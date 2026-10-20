import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

// Fees are our revenue: owner accounts only.
async function ownerOnly() {
  const member = await getRequestingTeamMember();
  return member && member.status === 'active' && member.role === 'owner' ? member : null;
}
const denied = () => NextResponse.json({ success: false, message: 'Only an owner can see or change fees' }, { status: 403 });

const ENUMS: Record<string, string[]> = {
  fee_type: ['brokerage', 'construction_mgmt', 'permissions', 'other'],
  payer: ['landowner', 'brand', 'builder', 'other'],
  basis: ['fixed', 'months_rent', 'percent_contract'],
  status: ['expected', 'invoiced', 'received', 'written_off'],
};
const NUM = ['basis_value', 'amount', 'received_amount'];
const TEXT = ['due_date', 'invoice_number', 'invoiced_at', 'received_at', 'notes'];

function clean(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, allowed] of Object.entries(ENUMS)) {
    if (k in body) { const v = String(body[k] ?? ''); if (allowed.includes(v)) out[k] = v; }
  }
  for (const k of NUM) {
    if (!(k in body)) continue;
    const v = body[k];
    const n = v === '' || v == null ? null : Number(v);
    out[k] = n != null && Number.isFinite(n) ? n : null;
  }
  for (const k of TEXT) {
    if (!(k in body)) continue;
    const v = body[k];
    out[k] = typeof v === 'string' && v.trim() ? v.trim().slice(0, 1000) : null;
  }
  return out;
}

// Stamps today's date when a fee moves to invoiced / received and no date was given.
function stampDates(out: Record<string, unknown>) {
  const today = new Date().toISOString().slice(0, 10);
  if (out.status === 'invoiced' && !out.invoiced_at) out.invoiced_at = today;
  if (out.status === 'received') {
    if (!out.received_at) out.received_at = today;
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ownerOnly())) return denied();
  const { id } = await params;
  const { data, error } = await supabaseInternalAdmin.from('project_fees').select('*').eq('project_id', id).order('created_at');
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, fees: data || [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await ownerOnly();
  if (!member) return denied();
  const { id } = await params;
  const body = clean(await req.json());
  if (body.amount == null || Number(body.amount) <= 0) {
    return NextResponse.json({ success: false, message: 'Enter the fee amount.' }, { status: 400 });
  }
  stampDates(body);
  if (body.status === 'received' && body.received_amount == null) body.received_amount = body.amount;

  const { data, error } = await supabaseInternalAdmin
    .from('project_fees')
    .insert([{ ...body, project_id: Number(id), created_by: member.id }])
    .select()
    .single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, fee: data });
}

// PATCH { fee_id, ...fields }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ownerOnly())) return denied();
  const { id } = await params;
  const raw = await req.json();
  const body = clean(raw);
  if ('amount' in body && (body.amount == null || Number(body.amount) <= 0)) {
    return NextResponse.json({ success: false, message: 'Enter the fee amount.' }, { status: 400 });
  }
  stampDates(body);

  if (body.status === 'received' && !('received_amount' in body)) {
    const { data: cur } = await supabaseInternalAdmin.from('project_fees').select('amount, received_amount').eq('id', raw.fee_id).eq('project_id', id).single();
    if (cur && cur.received_amount == null) body.received_amount = cur.amount;
  }

  const { data, error } = await supabaseInternalAdmin
    .from('project_fees')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', raw.fee_id)
    .eq('project_id', id)
    .select()
    .single();
  if (error || !data) return NextResponse.json({ success: false, message: error?.message || 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, fee: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ownerOnly())) return denied();
  const { id } = await params;
  const feeId = new URL(req.url).searchParams.get('fee_id');
  if (!feeId) return NextResponse.json({ success: false, message: 'Missing fee_id' }, { status: 400 });
  const { error } = await supabaseInternalAdmin.from('project_fees').delete().eq('id', feeId).eq('project_id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
