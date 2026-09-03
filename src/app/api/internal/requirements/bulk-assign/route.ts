import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

// POST /api/internal/requirements/bulk-assign — adds one assignee across
// several requirements in one action. Additive, not a replacement — any
// requirement that already has other people assigned keeps them.
export async function POST(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const body = await req.json();
  const ids: number[] = body.ids;
  const { team_member_id, scout_id } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ success: false, message: 'No locations selected' }, { status: 400 });
  }
  if (!team_member_id && !scout_id) {
    return NextResponse.json({ success: false, message: 'Choose a team member or a scout to assign to' }, { status: 400 });
  }

  const rows = ids.map((requirement_id) => ({
    requirement_id, team_member_id: team_member_id || null, scout_id: scout_id || null,
  }));

  // Duplicate assignments (someone already assigned to some of these) are
  // silently skipped rather than erroring the whole batch.
  const { error } = await supabaseInternalAdmin.from('requirement_assignments').upsert(rows, { onConflict: team_member_id ? 'requirement_id,team_member_id' : 'requirement_id,scout_id', ignoreDuplicates: true });
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  return NextResponse.json({ success: true, updated: ids.length });
}
