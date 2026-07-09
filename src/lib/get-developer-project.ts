import { cache } from 'react';
import { supabase } from '@/lib/supabase';
import { DeveloperProject } from '@/types/developer-project';

export const getDeveloperProject = cache(async (id: string): Promise<DeveloperProject | null> => {
  const { data, error } = await supabase
    .from('developer_projects')
    .select('*, developer_project_images(storage_path, is_primary)')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  const images = (data.developer_project_images || [])
    .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
    .map((img: any) => img.storage_path);

  return { ...data, images } as DeveloperProject;
});
