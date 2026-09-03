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

  // Postgres won't accept an upsert's ON CONFLICT target against a partial
  // unique index (the ones scoped with "where team_member_id is not null" /
  // "where scout_id is not null"), so duplicates are filtered out here
  // manually before inserting, rather than relying on the database to skip
  // them during the write itself.
  const { data: existing } = await supabaseInternalAdmin
    .from('requirement_assignments')
    .select('requirement_id, team_member_id, scout_id')
    .in('requirement_id', ids);

  const alreadyAssigned = new Set(
    (existing || [])
      .filter((e) => (team_member_id ? e.team_member_id === team_member_id : e.scout_id === scout_id))
      .map((e) => e.requirement_id)
  );

  const newRows = rows.filter((r) => !alreadyAssigned.has(r.requirement_id));

  if (newRows.length > 0) {
    const { error } = await supabaseInternalAdmin.from('requirement_assignments').insert(newRows);
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated: ids.length });
}
