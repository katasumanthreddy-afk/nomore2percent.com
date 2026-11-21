// Shared constants for the public "List your property for lease" link
// (/list-for-lease). Submissions are saved straight into the internal
// Properties table with status SUBMITTED_STATUS, so the team reviews them
// in Internal → Properties before marking them available.

export const SUBMITTED_STATUS = 'submitted';

export const LISTING_TYPES = [
  { value: 'retail', label: 'Shop / showroom' },
  { value: 'warehouse', label: 'Warehouse / godown' },
  { value: 'land', label: 'Open land / plot' },
  { value: 'office', label: 'Office space' },
  { value: 'mixed_use', label: 'Full building' },
  { value: 'other', label: 'Other' },
] as const;

export const SUBMITTER_ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'family', label: 'Owner’s family' },
  { value: 'broker', label: 'Broker / agent' },
  { value: 'other', label: 'Other' },
] as const;

export const FLOORS = ['Ground floor', 'Ground + 1', 'First floor', 'Upper floor', 'Basement', 'Whole building'] as const;

export const listingTypeLabel = (v: string) => LISTING_TYPES.find((t) => t.value === v)?.label || 'Property';

/** Build the public link, optionally tagged with who it was sent to. */
export function leaseListingUrl(origin: string, by?: string) {
  const base = `${origin.replace(/\/$/, '')}/list-for-lease`;
  const tag = by?.trim();
  return tag ? `${base}?by=${encodeURIComponent(tag)}` : base;
}
