export interface Property {
  id: number;
  title: string;
  description: string | null;
  price: string;
  price_num: number | null;
  price_per_sqft: string | null;
  area: string;
  address: string | null;
  property_type: 'apartment' | 'villa' | 'independent_house' | 'plot' | 'commercial' | 'agricultural';
  listing_type: 'sale' | 'rent';
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  size_unit: 'sqft' | 'sqyd' | 'acres' | null;
  floor: string | null;
  parking: number;
  year_built: string | null;
  rera_number: string | null;
  amenities: string[] | null;
  status: 'active' | 'sold' | 'rented' | 'inactive';
  featured: boolean;
  images: string[];
  created_at: string;
}

export function savingsLabel(priceNum: number | null, listingType: string): string | null {
  if (!priceNum || listingType === 'rent') return null;
  const saving = Math.round(priceNum * 0.01);
  if (saving >= 10000000) return '₹' + (saving / 10000000).toFixed(2) + ' Cr';
  if (saving >= 100000) return '₹' + (saving / 100000).toFixed(1) + 'L';
  return '₹' + saving.toLocaleString('en-IN');
}

export function propertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    apartment: 'Apartment / Flat',
    villa: 'Villa',
    independent_house: 'Independent House',
    plot: 'Plot / Land',
    commercial: 'Commercial',
    agricultural: 'Agricultural Land',
  };
  return labels[type] || type;
}

export function sizeUnitLabel(unit: string | null | undefined): string {
  if (unit === 'sqyd') return 'sq.yd';
  if (unit === 'acres') return 'acres';
  return 'sqft';
}

export function defaultSizeUnitForType(propertyType: string): 'sqft' | 'sqyd' | 'acres' {
  if (propertyType === 'plot') return 'sqyd';
  if (propertyType === 'agricultural') return 'acres';
  return 'sqft';
}
