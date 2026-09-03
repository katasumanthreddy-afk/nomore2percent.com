import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

// POST /api/internal/requirements/[id]/assign — adds one assignee (team
// member or scout) to a requirement. Does NOT replace existing assignees —
// a requirement can have several people assigned at once. Assigning the
// same person twice is a no-op (the unique index handles it quietly).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { team_member_id, scout_id } = body;

  if (!team_member_id && !scout_id) {
    return NextResponse.json({ success: false, message: 'Choose a team member or a scout' }, { status: 400 });
  }

  const { error } = await supabaseInternalAdmin
    .from('requirement_assignments')
    .insert([{ requirement_id: id, team_member_id: team_member_id || null, scout_id: scout_id || null }]);

  // A duplicate assignment (unique index conflict) isn't really an error
  // from the user's point of view — they're already assigned.
  if (error && error.code !== '23505') {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/internal/requirements/[id]/assign?assignment_id=X — removes
// one specific assignment (not all of them).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  await params; // requirement id isn't needed for the delete itself, but keeps the route shape consistent

  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get('assignment_id');
  if (!assignmentId) return NextResponse.json({ success: false, message: 'Missing assignment_id' }, { status: 400 });

  const { error } = await supabaseInternalAdmin.from('requirement_assignments').delete().eq('id', assignmentId);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
