import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active' || member.role !== 'owner') {
    return NextResponse.json({ success: false, message: 'Only an owner can manage team members' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const { error } = await supabaseInternalAdmin.from('team_members').update(body).eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active' || member.role !== 'owner') {
    return NextResponse.json({ success: false, message: 'Only an owner can manage team members' }, { status: 403 });
  }
  const { id } = await params;
  if (String(member.id) === id) {
    return NextResponse.json({ success: false, message: "You can't remove yourself." }, { status: 400 });
  }

  const { error } = await supabaseInternalAdmin.from('team_members').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
