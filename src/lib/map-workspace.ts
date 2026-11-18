// Shared, framework-free logic for the internal Map workspace: map links,
// distances, supply gaps and search parsing. Kept pure so it can be tested
// on its own and used on both the server and the client.

export type LatLng = { lat: number; lng: number };

export type LayerKey = 'sites' | 'leads' | 'properties' | 'projects';

export interface MapSite extends LatLng {
  id: number; title: string; status: string; radius_max_m: number;
  priority: string | null; brand_id: number | null; brand_name: string | null;
  nearby_properties: number; nearby_leads: number;
}
export interface MapLead extends LatLng {
  id: number; owner_name: string; locality: string; size_sq_yds: number;
  status: string; construction_interest: string | null;
}
export interface MapProperty extends LatLng {
  id: number; title: string; area: string | null; status: string | null;
  deal_type: string; property_type: string | null;
  price_label: string | null; lease_rate_label: string | null;
}
export interface MapProject extends LatLng {
  id: number; name: string; stage: string; brand_id: number | null; brand_name: string | null;
  located_by: 'property' | 'land_lead' | 'requirement';
}
export interface MapData {
  sites: MapSite[]; leads: MapLead[]; properties: MapProperty[]; projects: MapProject[];
  brands: { id: number; name: string }[];
}

const R = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;
export function metersBetween(a: LatLng, b: LatLng) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export const isValidLatLng = (lat: unknown, lng: unknown): boolean =>
  typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)
  && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

const fix = (n: number) => Number(n.toFixed(6));

/** Google Maps turn-by-turn directions from wherever the user is now. */
export function directionsUrl(p: LatLng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${fix(p.lat)},${fix(p.lng)}`;
}
/** A plain pin link that opens in Google Maps on any phone. */
export function pinUrl(p: LatLng) {
  return `https://www.google.com/maps/search/?api=1&query=${fix(p.lat)},${fix(p.lng)}`;
}
/** WhatsApp share sheet with a short label and the pin link. */
export function whatsappShareUrl(p: LatLng, label?: string) {
  const text = [label?.trim(), pinUrl(p)].filter(Boolean).join('\n');
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
export function coordText(p: LatLng) {
  return `${fix(p.lat)}, ${fix(p.lng)}`;
}

/** A site is a "gap" when it is still being searched for and nothing we
 *  know of (property or land lead) sits inside its radius. */
export function isGap(s: Pick<MapSite, 'status' | 'nearby_properties' | 'nearby_leads'>) {
  return s.status === 'searching' && s.nearby_properties === 0 && s.nearby_leads === 0;
}

export function countWithin(center: LatLng, radiusM: number, points: LatLng[]) {
  let n = 0;
  for (const p of points) if (metersBetween(center, p) <= radiusM) n++;
  return n;
}

export function nearestWithin<T extends LatLng>(center: LatLng, radiusM: number, points: T[]) {
  return points
    .map((p) => ({ item: p, distance: metersBetween(center, p) }))
    .filter((x) => x.distance <= radiusM)
    .sort((a, b) => a.distance - b.distance);
}

/** Project pins: use the most precise linked record that has coordinates. */
export function projectLocation(
  p: { property_id: number | null; land_lead_id: number | null; requirement_id: number | null },
  lookup: { properties: Map<number, LatLng>; leads: Map<number, LatLng>; sites: Map<number, LatLng> },
): (LatLng & { located_by: MapProject['located_by'] }) | null {
  const prop = p.property_id != null ? lookup.properties.get(p.property_id) : undefined;
  if (prop) return { ...prop, located_by: 'property' };
  const lead = p.land_lead_id != null ? lookup.leads.get(p.land_lead_id) : undefined;
  if (lead) return { ...lead, located_by: 'land_lead' };
  const site = p.requirement_id != null ? lookup.sites.get(p.requirement_id) : undefined;
  if (site) return { ...site, located_by: 'requirement' };
  return null;
}

/** Pasted coordinates or a Google Maps link in the search box → a point. */
export function parseLatLngQuery(q: string): LatLng | null {
  const s = q.trim();
  if (!s) return null;
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|ll|query|center|destination)=(-?\d+(?:\.\d+)?)\s*(?:,|%2C)\s*\+?(-?\d+(?:\.\d+)?)/i,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) {
      const lat = Number(m[1]); const lng = Number(m[2]);
      if (isValidLatLng(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

export type SearchHit =
  | { kind: LayerKey; id: number; label: string; sub: string; lat: number; lng: number };

/** Search our own records first (by name, owner, locality, brand). */
export function searchRecords(data: MapData, q: string, limit = 8): SearchHit[] {
  const term = q.trim().toLowerCase();
  if (term.length < 2) return [];
  const hits: SearchHit[] = [];
  const has = (...vals: (string | null | undefined)[]) => vals.some((v) => v?.toLowerCase().includes(term));
  for (const s of data.sites) if (has(s.title, s.brand_name)) hits.push({ kind: 'sites', id: s.id, label: s.title, sub: s.brand_name || 'Site requirement', lat: s.lat, lng: s.lng });
  for (const l of data.leads) if (has(l.owner_name, l.locality)) hits.push({ kind: 'leads', id: l.id, label: `${l.locality}`, sub: `Land lead · ${l.owner_name}`, lat: l.lat, lng: l.lng });
  for (const p of data.properties) if (has(p.title, p.area)) hits.push({ kind: 'properties', id: p.id, label: p.title, sub: p.area || 'Property', lat: p.lat, lng: p.lng });
  for (const p of data.projects) if (has(p.name, p.brand_name)) hits.push({ kind: 'projects', id: p.id, label: p.name, sub: p.brand_name || 'Project', lat: p.lat, lng: p.lng });
  return hits.slice(0, limit);
}
