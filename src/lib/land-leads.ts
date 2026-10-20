// Shared constants for the land-sourcing campaign (public form + internal inbox).

export const MIN_SQ_YDS = 500;

// 1 gunta = 121 sq yds, 1 acre = 40 guntas = 4840 sq yds.
export const SQ_YDS_PER_UNIT: Record<string, number> = { sq_yds: 1, guntas: 121, acres: 4840 };

export function toSqYds(value: number, unit: string): number {
  return value * (SQ_YDS_PER_UNIT[unit] ?? 1);
}

export const LAND_TYPES: { value: string; en: string; te: string }[] = [
  { value: 'open_plot', en: 'Open plot', te: 'ఓపెన్ ప్లాట్' },
  { value: 'hmda_layout', en: 'HMDA approved layout', te: 'HMDA అప్రూవ్డ్ లేఅవుట్' },
  { value: 'dtcp_layout', en: 'DTCP approved layout', te: 'DTCP అప్రూవ్డ్ లేఅవుట్' },
  { value: 'gp_layout', en: 'Gram Panchayat layout', te: 'గ్రామ పంచాయతీ లేఅవుట్' },
  { value: 'agricultural', en: 'Agricultural land', te: 'వ్యవసాయ భూమి' },
  { value: 'other', en: 'Other / not sure', te: 'ఇతర / తెలియదు' },
];

export const LEAD_STATUSES: { value: string; label: string; badge: string }[] = [
  { value: 'new', label: 'New', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'contacted', label: 'Contacted', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'site_visit', label: 'Site visit', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'shortlisted', label: 'Shortlisted', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'negotiating', label: 'Negotiating', badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  { value: 'signed', label: 'Signed', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'rejected', label: 'Rejected', badge: 'bg-stone-100 text-stone-500 border-stone-200' },
];

export function formatSize(sqYds: number): string {
  if (sqYds >= 4840) return `${(sqYds / 4840).toFixed(sqYds % 4840 === 0 ? 0 : 2)} acres`;
  return `${Math.round(sqYds).toLocaleString('en-IN')} sq yds`;
}
