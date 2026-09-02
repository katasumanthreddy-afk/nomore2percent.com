import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

interface BulkRow { title: string; lat: number; lng: number }

export async function POST(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const body = await req.json();
  const rows: BulkRow[] = body.requirements;
  const radiusMin = body.radius_min_m ?? 500;
  const radiusMax = body.radius_max_m ?? 1000;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ success: false, message: 'No locations provided' }, { status: 400 });
  }

  const toInsert = rows.map((r) => ({
    title: r.title || `Site (${r.lat}, ${r.lng})`,
    lat: r.lat, lng: r.lng,
    radius_min_m: radiusMin, radius_max_m: radiusMax,
    created_by: member.id,
  }));

  const { data, error } = await supabaseInternalAdmin.from('site_requirements').insert(toInsert).select('id');
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  return NextResponse.json({ success: true, created: data.length });
}
