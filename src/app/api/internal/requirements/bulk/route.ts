import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { invalidateCache } from '@/lib/simple-cache';
import { distanceInMeters } from '@/lib/geo-utils';

interface BulkRow { title?: string; lat: number; lng: number }

const DUPLICATE_WITHIN_M = 50;
const MAX_ROWS = 500;

// POST /api/internal/requirements/bulk
// { requirements: [{title, lat, lng}], radius_min_m, radius_max_m, brand_id?, priority?, target_date? }
// Sites within 50 m of one already on file for the same brand (or in the
// same paste) are skipped, so pasting an updated list twice is harmless.
export async function POST(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const body = await req.json();
  const rows: BulkRow[] = Array.isArray(body.requirements) ? body.requirements : [];
  const radiusMin = Number(body.radius_min_m) || 500;
  const radiusMax = Number(body.radius_max_m) || 1000;
  const brandId = body.brand_id ? Number(body.brand_id) : null;
  const priority = ['high', 'normal', 'low'].includes(body.priority) ? body.priority : 'normal';
  const targetDate = typeof body.target_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.target_date) ? body.target_date : null;

  const clean = rows
    .map((r) => ({ title: String(r.title || '').trim().slice(0, 200), lat: Number(r.lat), lng: Number(r.lng) }))
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng) && Math.abs(r.lat) <= 90 && Math.abs(r.lng) <= 180);
  if (clean.length === 0) return NextResponse.json({ success: false, message: 'No valid locations provided' }, { status: 400 });
  if (clean.length > MAX_ROWS) return NextResponse.json({ success: false, message: `At most ${MAX_ROWS} locations per import` }, { status: 400 });
  if (radiusMax < radiusMin) return NextResponse.json({ success: false, message: 'Max radius must be at least the min radius' }, { status: 400 });

  let existingQuery = supabaseInternalAdmin.from('site_requirements').select('lat, lng');
  existingQuery = brandId ? existingQuery.eq('brand_id', brandId) : existingQuery.is('brand_id', null);
  const { data: existing } = await existingQuery;

  const kept: { lat: number; lng: number }[] = [...(existing || [])];
  const toInsert = [];
  let skipped = 0;
  for (const r of clean) {
    if (kept.some((e) => distanceInMeters(r.lat, r.lng, e.lat, e.lng) <= DUPLICATE_WITHIN_M)) { skipped++; continue; }
    kept.push(r);
    toInsert.push({
      title: r.title || `Site (${r.lat.toFixed(5)}, ${r.lng.toFixed(5)})`,
      lat: r.lat, lng: r.lng,
      radius_min_m: radiusMin, radius_max_m: radiusMax,
      brand_id: brandId, priority, target_date: targetDate,
      created_by: member.id,
    });
  }

  let created = 0;
  if (toInsert.length) {
    const { data, error } = await supabaseInternalAdmin.from('site_requirements').insert(toInsert).select('id');
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    created = data.length;
  }

  invalidateCache('internal:requirements:raw');
  invalidateCache('internal:requirements:matches');

  return NextResponse.json({ success: true, created, skipped });
}
