import { NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { distanceInMeters } from '@/lib/geo-utils';

// GET /api/internal/requirements/matches — every requirement that currently
// has at least one property within its radius, each with the full list of
// matches (not just a count). Computed fresh on every call from live
// coordinates, so a newly-added property shows up here automatically the
// next time this loads — nobody has to manually check it against anything.
export async function GET() {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const { data: requirements } = await supabaseInternalAdmin
    .from('site_requirements')
    .select('id, title, lat, lng, radius_min_m, radius_max_m, status, matched_property_id')
    .neq('status', 'closed');

  const { data: properties } = await supabaseInternalAdmin
    .from('commercial_properties')
    .select('id, title, area, status, deal_type, price_label, lease_rate_label, lat, lng')
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  const results = (requirements || [])
    .map((r) => {
      const matches = (properties || [])
        .map((p) => ({ ...p, distance_m: Math.round(distanceInMeters(r.lat, r.lng, p.lat, p.lng)) }))
        .filter((p) => p.distance_m <= r.radius_max_m)
        .sort((a, b) => a.distance_m - b.distance_m);
      return { ...r, matches };
    })
    .filter((r) => r.matches.length > 0)
    .sort((a, b) => b.matches.length - a.matches.length);

  return NextResponse.json({ success: true, results, totalMatches: results.reduce((sum, r) => sum + r.matches.length, 0) });
}
