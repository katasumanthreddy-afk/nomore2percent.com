import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { distanceInMeters } from '@/lib/geo-utils';

// GET /api/internal/requirements — list all, each with a live count of how
// many existing properties currently fall within its search radius.
export async function GET() {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const { data: requirements, error } = await supabaseInternalAdmin
    .from('site_requirements')
    .select('*, commercial_properties(id, title)')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  const { data: properties } = await supabaseInternalAdmin
    .from('commercial_properties')
    .select('id, lat, lng')
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  const withMatches = (requirements || []).map((r) => {
    const matchCount = (properties || []).filter((p) => {
      const d = distanceInMeters(r.lat, r.lng, p.lat, p.lng);
      return d <= r.radius_max_m;
    }).length;
    return { ...r, nearby_count: matchCount };
  });

  return NextResponse.json({ success: true, requirements: withMatches, currentMemberId: member.id });
}

export async function POST(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const body = await req.json();
  if (!body.title || body.lat == null || body.lng == null) {
    return NextResponse.json({ success: false, message: 'Title, lat, and lng are required' }, { status: 400 });
  }

  const { data, error } = await supabaseInternalAdmin
    .from('site_requirements')
    .insert([{
      title: body.title, lat: body.lat, lng: body.lng,
      radius_min_m: body.radius_min_m ?? 500, radius_max_m: body.radius_max_m ?? 1000,
      notes: body.notes || null, created_by: member.id,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, requirement: data });
}
