// Approximate center-point coordinates for Hyderabad localities used across
// the site. These are locality-level approximations, not precise addresses —
// used as a fallback pin location for properties that don't have an exact
// lat/lng set yet via the admin map picker.
export const AREA_COORDINATES: Record<string, [number, number]> = {
  'Gachibowli': [17.4401, 78.3489],
  'Madhapur': [17.4483, 78.3915],
  'Banjara Hills': [17.4156, 78.4347],
  'Jubilee Hills': [17.4325, 78.4071],
  'Kondapur': [17.4615, 78.3671],
  'Hitech City': [17.4435, 78.3772],
  'Kompally': [17.5433, 78.4903],
  'Yapral': [17.5167, 78.5333],
  'Alwal': [17.5167, 78.5000],
  'Kukatpally': [17.4849, 78.4138],
  'Miyapur': [17.4969, 78.3822],
  'Dammaiguda': [17.5044, 78.5717],
  'Kokapet': [17.4108, 78.3208],
  'Financial District': [17.4142, 78.3467],
  'Nizampet': [17.5106, 78.3833],
  'Uppal': [17.3989, 78.5583],
  'Secunderabad': [17.4399, 78.4983],
  'Begumpet': [17.4436, 78.4667],
  'Somajiguda': [17.4239, 78.4622],
  'Ameerpet': [17.4374, 78.4487],
  'Manikonda': [17.4028, 78.3792],
  'Thumkunta': [17.5872, 78.5442],
  'Keesara': [17.4720, 78.6180],
  'Devar Yamjal': [17.5450, 78.5950],
  'Shamirpet': [17.5833, 78.5500],
  'Bachupally': [17.5211, 78.3736],
  'Bowrampet': [17.5433, 78.3517],
  'LB Nagar': [17.3489, 78.5511],
  'Dilsukhnagar': [17.3686, 78.5247],
};

// Central Hyderabad, used if an area genuinely isn't in the table above
// (e.g. a free-typed "Other" locality with no match).
export const HYDERABAD_CENTER: [number, number] = [17.4239, 78.4483];

export function getAreaCoordinates(area: string): [number, number] {
  return AREA_COORDINATES[area] || HYDERABAD_CENTER;
}

/** Resolves the coordinates to actually plot for a property: its own precise
 * pin if set, otherwise its locality's approximate center. */
export function resolvePropertyCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined,
  area: string
): [number, number] {
  if (lat != null && lng != null) return [lat, lng];
  return getAreaCoordinates(area);
}
