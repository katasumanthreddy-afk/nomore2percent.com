import { NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { getCached } from '@/lib/simple-cache';
import {
  countWithin, isValidLatLng, projectLocation,
  type LatLng, type MapData, type MapLead, type MapProject, type MapProperty, type MapSite,
} from '@/lib/map-workspace';

/* eslint-disable @typescript-eslint/no-explicit-any */
const one = (v: any) => (Array.isArray(v) ? v[0] : v) ?? null;
const pt = (r: any): LatLng | null => {
  const lat = r.lat == null ? NaN : Number(r.lat);
  const lng = r.lng == null ? NaN : Number(r.lng);
  return isValidLatLng(lat, lng) ? { lat, lng } : null;
};

// GET /api/internal/map — every layer of the supply + demand map in one
// slim payload: site requirements (with how much supply sits inside each
// radius), land leads, commercial properties and projects (placed on their
// linked property, land lead or site). Coordinates and labels only.
export async function GET() {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  try {
    const data = await getCached<MapData>('internal:map:data', 30_000, async () => {
      const [sitesRes, leadsRes, propsRes, projectsRes, brandsRes] = await Promise.all([
        supabaseInternalAdmin.from('site_requirements').select('id, title, lat, lng, status, radius_max_m, priority, brand_id, brands(id, name)'),
        supabaseInternalAdmin.from('land_leads').select('id, owner_name, locality, lat, lng, size_sq_yds, status, construction_interest').neq('status', 'rejected'),
        supabaseInternalAdmin.from('commercial_properties').select('id, title, area, lat, lng, status, deal_type, property_type, price_label, lease_rate_label'),
        supabaseInternalAdmin.from('projects').select('id, name, stage, brand_id, property_id, land_lead_id, requirement_id, brands(id, name)').neq('stage', 'dropped'),
        supabaseInternalAdmin.from('brands').select('id, name').order('name'),
      ]);
      if (sitesRes.error) throw sitesRes.error;
      if (propsRes.error) throw propsRes.error;

      const properties: MapProperty[] = [];
      for (const p of propsRes.data || []) {
        const loc = pt(p);
        if (loc) properties.push({ ...loc, id: p.id, title: p.title, area: p.area, status: p.status, deal_type: p.deal_type, property_type: p.property_type, price_label: p.price_label, lease_rate_label: p.lease_rate_label });
      }

      // Land leads / projects / brands are optional layers: if those tables
      // aren't migrated yet the map still works with what exists.
      const leads: MapLead[] = [];
      for (const l of leadsRes.error ? [] : leadsRes.data || []) {
        const loc = pt(l);
        if (loc) leads.push({ ...loc, id: l.id, owner_name: l.owner_name, locality: l.locality, size_sq_yds: Number(l.size_sq_yds), status: l.status, construction_interest: l.construction_interest });
      }

      const sites: MapSite[] = [];
      for (const s of sitesRes.data || []) {
        const loc = pt(s);
        if (!loc) continue;
        const radius = Number(s.radius_max_m) || 1000;
        const brand = one(s.brands);
        sites.push({
          ...loc, id: s.id, title: s.title, status: s.status, radius_max_m: radius,
          priority: s.priority ?? null, brand_id: s.brand_id ?? null, brand_name: brand?.name ?? null,
          nearby_properties: countWithin(loc, radius, properties),
          nearby_leads: countWithin(loc, radius, leads),
        });
      }

      const lookup = {
        properties: new Map(properties.map((p) => [p.id, { lat: p.lat, lng: p.lng }])),
        leads: new Map(leads.map((l) => [l.id, { lat: l.lat, lng: l.lng }])),
        sites: new Map(sites.map((s) => [s.id, { lat: s.lat, lng: s.lng }])),
      };
      const projects: MapProject[] = [];
      for (const p of projectsRes.error ? [] : projectsRes.data || []) {
        const loc = projectLocation(p, lookup);
        const brand = one(p.brands);
        if (loc) projects.push({ ...loc, id: p.id, name: p.name, stage: p.stage, brand_id: p.brand_id ?? null, brand_name: brand?.name ?? null });
      }

      return { sites, leads, properties, projects, brands: brandsRes.error ? [] : brandsRes.data || [] };
    });

    return NextResponse.json({ success: true, ...data });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Could not load the map.' }, { status: 500 });
  }
}
