import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';

interface BulkRow {
  title: string;
  lat: number;
  lng: number;
  area?: string;
}

// POST /api/internal/properties/bulk — creates many properties at once from
// a parsed list of {title, lat, lng, area?}. Everything else (property_type,
// deal_type, status) gets a sensible default, same as a normal single add,
// since a bulk-pasted list of coordinates usually doesn't carry full details
// yet — the point is getting pins on the map fast, details can be filled in
// per-property afterward.
export async function POST(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const body = await req.json();
  const rows: BulkRow[] = body.properties;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ success: false, message: 'No properties provided' }, { status: 400 });
  }

  const toInsert = rows.map((r) => ({
    title: r.title || `Property (${r.lat}, ${r.lng})`,
    lat: r.lat,
    lng: r.lng,
    area: r.area || null,
    property_type: 'office',
    deal_type: 'lease',
    status: 'available',
    created_by: member.id,
  }));

  const { data, error } = await supabaseInternalAdmin.from('commercial_properties').insert(toInsert).select('id');
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  return NextResponse.json({ success: true, created: data.length });
}
