import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const { error } = await supabaseInternalAdmin.from('external_scouts').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
