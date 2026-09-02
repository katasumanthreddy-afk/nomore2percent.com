import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

// PATCH /api/internal/requirements/[id]/assign — assigns to exactly one of a
// team member or an external scout at a time. Passing { assigned_to_team_member_id: null,
// assigned_to_scout_id: null } clears the assignment entirely.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { assigned_to_team_member_id, assigned_to_scout_id } = body;

  // Assigning to one clears the other — a requirement has exactly one owner.
  const patch = assigned_to_team_member_id
    ? { assigned_to_team_member_id, assigned_to_scout_id: null }
    : assigned_to_scout_id
    ? { assigned_to_scout_id, assigned_to_team_member_id: null }
    : { assigned_to_team_member_id: null, assigned_to_scout_id: null };

  const { error } = await supabaseInternalAdmin.from('site_requirements').update(patch).eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
