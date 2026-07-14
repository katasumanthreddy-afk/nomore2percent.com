import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

const BASE_URL = 'https://www.nomore2percent.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/properties`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/projects`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/area-insights`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/area-guides`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/market-survey`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/property-valuation`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/list-your-property`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/blog/why-hyderabad-buyers-deserve-better-than-2-percent`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/privacy-policy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/rera-disclaimer`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  // Active property listings — the pages that actually drive organic search traffic
  const { data: properties } = await supabase
    .from('properties')
    .select('id, created_at')
    .eq('status', 'active');

  const propertyRoutes: MetadataRoute.Sitemap = (properties || []).map((p) => ({
    url: `${BASE_URL}/properties/${p.id}`,
    lastModified: p.created_at ? new Date(p.created_at) : undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Active developer projects
  const { data: projects } = await supabase
    .from('developer_projects')
    .select('id, created_at')
    .eq('is_active', true);

  const projectRoutes: MetadataRoute.Sitemap = (projects || []).map((p) => ({
    url: `${BASE_URL}/projects/${p.id}`,
    lastModified: p.created_at ? new Date(p.created_at) : undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...propertyRoutes, ...projectRoutes];
}
