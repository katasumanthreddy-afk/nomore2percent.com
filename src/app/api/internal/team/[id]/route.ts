import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { invalidatePrefix } from '@/lib/simple-cache';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active' || member.role !== 'owner') {
    return NextResponse.json({ success: false, message: 'Only an owner can manage team members' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  // Only these can be changed from the Team page.
  const update: Record<string, unknown> = {};
  for (const k of ['name', 'role', 'status']) if (k in body) update[k] = body[k];
  if ('role' in update && !['owner', 'partner', 'employee'].includes(String(update.role))) {
    return NextResponse.json({ success: false, message: 'Invalid role' }, { status: 400 });
  }
  if ('status' in update && !['active', 'inactive'].includes(String(update.status))) {
    return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
  }
  if (Number(id) === member.id && (update.status === 'inactive' || update.role === 'employee')) {
    return NextResponse.json({ success: false, message: "You can't deactivate or demote yourself" }, { status: 400 });
  }
  const { error } = await supabaseInternalAdmin.from('team_members').update(update).eq('id', id);
  invalidatePrefix('internal:member:');
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

  if (Number(id) === member.id) {
    return NextResponse.json({ success: false, message: "You can't remove yourself" }, { status: 400 });
  }
  const { error } = await supabaseInternalAdmin.from('team_members').delete().eq('id', id);
  invalidatePrefix('internal:member:');
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
