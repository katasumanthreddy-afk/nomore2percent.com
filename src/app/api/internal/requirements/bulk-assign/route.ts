import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

// PATCH /api/internal/requirements/bulk-assign — assigns many requirements
// to exactly one team member or one external scout in a single action.
export async function PATCH(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const body = await req.json();
  const ids: number[] = body.ids;
  const { assigned_to_team_member_id, assigned_to_scout_id } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ success: false, message: 'No locations selected' }, { status: 400 });
  }
  if (!assigned_to_team_member_id && !assigned_to_scout_id) {
    return NextResponse.json({ success: false, message: 'Choose a team member or a scout to assign to' }, { status: 400 });
  }

  const patch = assigned_to_team_member_id
    ? { assigned_to_team_member_id, assigned_to_scout_id: null }
    : { assigned_to_scout_id, assigned_to_team_member_id: null };

  const { error } = await supabaseInternalAdmin.from('site_requirements').update(patch).in('id', ids);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  return NextResponse.json({ success: true, updated: ids.length });
}
