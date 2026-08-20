import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;

  const { data: property, error } = await supabaseInternalAdmin.from('commercial_properties').select('*').eq('id', id).single();
  if (error || !property) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const { data: deals } = await supabaseInternalAdmin.from('deals').select('id, deal_name, stage').eq('property_id', id);
  const { data: documents } = await supabaseInternalAdmin.from('documents').select('*').eq('property_id', id).order('created_at', { ascending: false });

  return NextResponse.json({ success: true, property, deals: deals || [], documents: documents || [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  delete body.created_by;

  const { error } = await supabaseInternalAdmin
    .from('commercial_properties')
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
  const { error } = await supabaseInternalAdmin.from('commercial_properties').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
