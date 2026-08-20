import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;

  const { data: deal, error } = await supabaseInternalAdmin
    .from('deals')
    .select('*, commercial_properties(id, title, area), team_members(id, name)')
    .eq('id', id)
    .single();

  if (error || !deal) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const { data: documents } = await supabaseInternalAdmin.from('documents').select('*').eq('deal_id', id).order('created_at', { ascending: false });

  return NextResponse.json({ success: true, deal, documents: documents || [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const { error } = await supabaseInternalAdmin
    .from('deals')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const { error } = await supabaseInternalAdmin.from('deals').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
