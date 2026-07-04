import { cache } from 'react';
import { supabase } from '@/lib/supabase';
import { Property } from '@/types/property';

// Cached per-request so generateMetadata() and the page component
// share one Supabase query instead of fetching the same property twice.
export const getProperty = cache(async (id: string): Promise<Property | null> => {
  const { data, error } = await supabase
    .from('properties')
    .select('*, property_images(storage_path, is_primary)')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error || !data) return null;

  const images = (data.property_images || [])
    .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
    .map((img: any) => img.storage_path);

  return { ...data, images } as Property;
});
