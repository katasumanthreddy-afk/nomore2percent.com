import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { distanceInMeters } from '@/lib/geo-utils';
import { invalidateCache } from '@/lib/simple-cache';
import { checkFit, effectiveSpec } from '@/lib/brands-projects';

// Columns the requirement detail page may change.
const EDITABLE = ['title', 'status', 'notes', 'matched_property_id', 'radius_min_m', 'radius_max_m', 'brand_id',
  'min_land_sq_yds', 'min_builtup_sqft', 'min_road_width_ft', 'rent_max_per_sqft', 'priority', 'target_date'];
const NUMERIC = new Set(['matched_property_id', 'radius_min_m', 'radius_max_m', 'brand_id', 'min_land_sq_yds', 'min_builtup_sqft', 'min_road_width_ft', 'rent_max_per_sqft']);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;

  const { data: requirement, error } = await supabaseInternalAdmin
    .from('site_requirements')
    .select('*, commercial_properties(id, title, area, status), brands(*)')
    .eq('id', id)
    .single();
  if (error || !requirement) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const { data: rawAssignments } = await supabaseInternalAdmin
    .from('requirement_assignments')
    .select('id, team_member_id, scout_id, team_members(id, name), external_scouts(id, name)')
    .eq('requirement_id', id);

  const assignments = (rawAssignments || []).map((a) => ({
    id: a.id,
    name: a.team_member_id ? (a.team_members as any)?.name : (a.external_scouts as any)?.name,
    type: a.team_member_id ? 'team' : 'scout',
  }));

  const spec = effectiveSpec(requirement, requirement.brands);

  const { data: properties } = await supabaseInternalAdmin
    .from('commercial_properties')
    .select('id, title, area, status, property_type, deal_type, price_label, lease_rate_label, lat, lng, sqft')
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  const nearby = (properties || [])
    .map((p) => ({ ...p, distance_m: Math.round(distanceInMeters(requirement.lat, requirement.lng, p.lat, p.lng)) }))
    .filter((p) => p.distance_m <= requirement.radius_max_m)
    .sort((a, b) => a.distance_m - b.distance_m)
    .map((p) => ({
      ...p,
      fit: checkFit(spec, {
        land_sq_yds: p.property_type === 'land' && p.sqft != null ? Number(p.sqft) / 9 : null,
        builtup_sqft: p.property_type !== 'land' && p.sqft != null ? Number(p.sqft) : null,
        road_width_ft: null,
      }),
    }));

  // Landowner leads from the campaign, inside the radius or just outside it
  // (up to 1.5x), so the team sees supply that is close enough to pitch.
  // Skipped quietly if the land_leads table doesn't exist yet.
  const { data: leads } = await supabaseInternalAdmin
    .from('land_leads')
    .select('id, owner_name, phone, locality, lat, lng, size_sq_yds, road_width_ft, construction_interest, status')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .neq('status', 'rejected');

  const nearbyLeads = (leads || [])
    .map((l) => ({ ...l, distance_m: Math.round(distanceInMeters(requirement.lat, requirement.lng, l.lat, l.lng)) }))
    .filter((l) => l.distance_m <= requirement.radius_max_m * 1.5)
    .sort((a, b) => a.distance_m - b.distance_m)
    .map((l) => ({
      ...l,
      inside_radius: l.distance_m <= requirement.radius_max_m,
      fit: checkFit(spec, { land_sq_yds: Number(l.size_sq_yds), road_width_ft: l.road_width_ft }),
    }));

  const { data: projects } = await supabaseInternalAdmin
    .from('projects')
    .select('id, name, stage')
    .eq('requirement_id', id);

  return NextResponse.json({ success: true, requirement, spec, nearby, nearbyLeads, projects: projects || [], assignments });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of EDITABLE) {
    if (!(k in body)) continue;
    const v = body[k];
    if (v === '' || v === null || v === undefined) update[k] = null;
    else if (NUMERIC.has(k)) { const n = Number(v); update[k] = Number.isFinite(n) ? n : null; }
    else update[k] = typeof v === 'string' ? v.trim() : v;
  }
  if ('title' in update && !update.title) {
    return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
  }

  const { error } = await supabaseInternalAdmin
    .from('site_requirements')
    .update(update)
    .eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  invalidateCache('internal:requirements:raw');
  invalidateCache('internal:requirements:matches');
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const { error } = await supabaseInternalAdmin.from('site_requirements').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  invalidateCache('internal:requirements:raw');
  invalidateCache('internal:requirements:matches');
  return NextResponse.json({ success: true });
}
