import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { getCached, invalidateCache } from '@/lib/simple-cache';

// GET /api/internal/properties            — full rows for the Properties page
// GET /api/internal/properties?view=map   — just what map pins need
const MAP_COLUMNS = 'id, title, area, lat, lng, status, deal_type, property_type, price_label, lease_rate_label';

export async function GET(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  // 30s cache: several people browsing Properties/Requirements/Matches at
  // once previously meant each of them triggered this same query
  // independently. This lets concurrent requests within the window share
  // one result instead.
  const properties = await getCached('internal:properties', 30_000, async () => {
    const { data, error } = await supabaseInternalAdmin
      .from('commercial_properties')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  });

  if (new URL(req.url).searchParams.get('view') === 'map') {
    const cols = MAP_COLUMNS.split(', ');
    const slim = (properties || [])
      .filter((p: Record<string, unknown>) => p.lat != null && p.lng != null)
      .map((p: Record<string, unknown>) => Object.fromEntries(cols.map((c) => [c, p[c]])));
    return NextResponse.json({ success: true, properties: slim });
  }
  return NextResponse.json({ success: true, properties });
}

export async function POST(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const body = await req.json();
  if (!body.title) {
    return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
  }

  for (const k of ['id', 'created_at', 'updated_at']) delete body[k];
  const { data, error } = await supabaseInternalAdmin
    .from('commercial_properties')
    .insert([{ ...body, created_by: member.id }])
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  // The person who just added this should see it immediately, not wait out
  // the cache window.
  invalidateCache('internal:properties');
  invalidateCache('internal:requirements:matches');

  return NextResponse.json({ success: true, property: data });
}
