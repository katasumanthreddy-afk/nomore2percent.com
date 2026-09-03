import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';

// GET /api/scout-view/[token] — intentionally has NO team-member auth check.
// The unguessable token itself is the access control, since external
// scouts/brokers don't have (and shouldn't need) portal accounts. Only
// returns what a scout actually needs to go find a property — title,
// coordinates, radius, status — never deal values, client info, or
// anything else from the internal database.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data: scout, error: scoutError } = await supabaseInternalAdmin
    .from('external_scouts')
    .select('id, name')
    .eq('access_token', token)
    .maybeSingle();

  if (scoutError || !scout) {
    return NextResponse.json({ success: false, message: 'Invalid or expired link' }, { status: 404 });
  }

  const { data: assignmentRows } = await supabaseInternalAdmin
    .from('requirement_assignments')
    .select('requirement_id')
    .eq('scout_id', scout.id);

  const requirementIds = (assignmentRows || []).map((a) => a.requirement_id);
  if (requirementIds.length === 0) {
    return NextResponse.json({ success: true, scoutName: scout.name, requirements: [] });
  }

  const { data: requirements } = await supabaseInternalAdmin
    .from('site_requirements')
    .select('id, title, lat, lng, radius_min_m, radius_max_m, status, notes')
    .in('id', requirementIds)
    .order('created_at', { ascending: false });

  return NextResponse.json({ success: true, scoutName: scout.name, requirements: requirements || [] });
}
