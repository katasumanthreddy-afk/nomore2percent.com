export interface DeveloperProject {
  id: number;
  project_name: string;
  developer_name: string;
  project_type: 'apartment' | 'villa' | 'plot' | 'commercial' | 'mixed';
  area: string;
  address: string | null;
  description: string | null;
  price_range: string | null;
  starting_price_num: number | null;
  possession_date: string | null;
  rera_number: string | null;
  total_units: number | null;
  land_area: string | null;
  unit_types: string[] | null;
  amenities: string[] | null;
  status: 'upcoming' | 'under_construction' | 'ready_to_move';
  featured: boolean;
  is_active: boolean;
  images: string[];
  created_at: string;
}

export function projectStatusLabel(status: string): string {
  if (status === 'ready_to_move') return 'Ready to Move';
  if (status === 'upcoming') return 'Upcoming';
  return 'Under Construction';
}
