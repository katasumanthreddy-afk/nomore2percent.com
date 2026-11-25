import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { cleanCostBody } from '@/lib/construction-costs';

// Budget (pricing) and expenses for one project.
//   GET                       → { lines, expenses } (bills as signed URLs)
//   POST  multipart  kind=expense  (+ optional "bill" image)
//   POST  json       { kind: 'budget', ...line }
//   PATCH json       { kind, id, ...fields }
//   DELETE ?kind=expense|budget&item_id=N

const MAX_BILL_BYTES = 3 * 1024 * 1024;
const TABLE = { expense: 'construction_expenses', budget: 'construction_budget_lines' } as const;
type Kind = keyof typeof TABLE;

async function guard() {
  const member = await getRequestingTeamMember();
  return member && member.status === 'active' ? member : null;
}
const denied = () => NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
const fail = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });
const missingTable = (m?: string) => !!m && /construction_(expenses|budget_lines)/.test(m) && /does not exist|schema cache/.test(m);
const SETUP = 'Costs are not set up yet: run construction-costs-schema.sql in the internal Supabase project.';

async function uploadBill(projectId: string, file: File) {
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') return null;
  if (file.size > MAX_BILL_BYTES) return null;
  const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'jpg';
  const path = `project-${projectId}/bills/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabaseInternalAdmin.storage.from('project-photos')
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  return error ? null : path;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return denied();
  const { id } = await params;
  const [lines, expenses] = await Promise.all([
    supabaseInternalAdmin.from('construction_budget_lines').select('*').eq('project_id', id).order('sort').order('id'),
    supabaseInternalAdmin.from('construction_expenses').select('*, team_members:created_by(id, name)').eq('project_id', id).order('expense_date', { ascending: false }).order('id', { ascending: false }),
  ]);
  if (missingTable(lines.error?.message) || missingTable(expenses.error?.message)) return NextResponse.json({ success: false, setup: true, message: SETUP });
  if (lines.error || expenses.error) return fail((lines.error || expenses.error)!.message, 500);

  const paths = (expenses.data || []).map((e) => e.bill_path).filter(Boolean) as string[];
  const signed: Record<string, string> = {};
  if (paths.length) {
    const { data } = await supabaseInternalAdmin.storage.from('project-photos').createSignedUrls(paths, 3600);
    (data || []).forEach((d) => { if (d.path && d.signedUrl) signed[d.path] = d.signedUrl; });
  }
  return NextResponse.json({
    success: true,
    lines: lines.data || [],
    expenses: (expenses.data || []).map(({ bill_path, ...e }) => ({ ...e, has_bill: !!bill_path, bill_url: bill_path ? signed[bill_path] || null : null })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await guard();
  if (!member) return denied();
  const { id } = await params;
  const { data: project } = await supabaseInternalAdmin.from('projects').select('id').eq('id', id).single();
  if (!project) return fail('Not found', 404);

  const isMultipart = (req.headers.get('content-type') || '').includes('multipart/form-data');
  let body: Record<string, unknown> = {};
  let bill: File | null = null;
  if (isMultipart) {
    const fd = await req.formData();
    fd.forEach((v, k) => { if (typeof v === 'string') body[k] = v; else if (k === 'bill' && v.size > 0) bill = v; });
  } else {
    body = await req.json().catch(() => ({}));
  }
  const kind: Kind = body.kind === 'budget' ? 'budget' : 'expense';
  const { row, error } = cleanCostBody(body, kind);
  if (error) return fail(error);

  const insert: Record<string, unknown> = { ...row, project_id: Number(id) };
  if (kind === 'expense') {
    insert.created_by = member.id;
    const updateId = Number(body.update_id);
    if (Number.isInteger(updateId) && updateId > 0) insert.update_id = updateId;
    if (bill) insert.bill_path = await uploadBill(id, bill);
  } else {
    insert.sort = Number(body.sort) || 0;
  }

  const { data, error: dbErr } = await supabaseInternalAdmin.from(TABLE[kind]).insert([insert]).select('*').single();
  if (dbErr) return missingTable(dbErr.message) ? fail(SETUP, 409) : fail(dbErr.message, 500);
  await supabaseInternalAdmin.from('projects').update({ updated_at: new Date().toISOString() }).eq('id', id);
  return NextResponse.json({ success: true, item: data, billSaved: kind === 'expense' ? !!insert.bill_path || !bill : undefined });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return denied();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const kind: Kind = body.kind === 'budget' ? 'budget' : 'expense';
  const itemId = Number(body.id);
  if (!Number.isInteger(itemId)) return fail('Missing id');

  // Quick status flip (Mark paid / Mark due) without resending the whole row.
  let patch: Record<string, unknown>;
  if (kind === 'expense' && Object.keys(body).every((k) => ['kind', 'id', 'payment_status'].includes(k))) {
    patch = { payment_status: body.payment_status === 'due' ? 'due' : 'paid' };
  } else {
    const { row, error } = cleanCostBody(body, kind);
    if (error) return fail(error);
    patch = row;
    if (kind === 'budget') patch.updated_at = new Date().toISOString();
  }
  const { data, error } = await supabaseInternalAdmin.from(TABLE[kind]).update(patch).eq('id', itemId).eq('project_id', id).select('*').single();
  if (error) return fail(error.message, 500);
  return NextResponse.json({ success: true, item: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return denied();
  const { id } = await params;
  const sp = new URL(req.url).searchParams;
  const kind: Kind = sp.get('kind') === 'budget' ? 'budget' : 'expense';
  const itemId = Number(sp.get('item_id'));
  if (!Number.isInteger(itemId)) return fail('Missing item_id');

  let billPath: string | null = null;
  if (kind === 'expense') {
    const { data } = await supabaseInternalAdmin.from('construction_expenses').select('bill_path').eq('id', itemId).eq('project_id', id).single();
    billPath = data?.bill_path || null;
  }
  const { error } = await supabaseInternalAdmin.from(TABLE[kind]).delete().eq('id', itemId).eq('project_id', id);
  if (error) return fail(error.message, 500);
  if (billPath) await supabaseInternalAdmin.storage.from('project-photos').remove([billPath]);
  return NextResponse.json({ success: true });
}
