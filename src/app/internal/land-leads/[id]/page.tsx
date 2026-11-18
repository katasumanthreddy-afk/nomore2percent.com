import { redirect } from 'next/navigation';
import { requireInternalMember } from '@/lib/require-internal-member';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { distanceInMeters } from '@/lib/geo-utils';
import LandLeadDetailClient from './LandLeadDetailClient';

export default async function LandLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireInternalMember(`/internal/land-leads/${id}`);

  const { data: lead } = await supabaseInternalAdmin.from('land_leads').select('*').eq('id', id).single();
  if (!lead) redirect('/internal/land-leads');

  const { data: rawImages } = await supabaseInternalAdmin.from('land_lead_images').select('id, storage_path').eq('lead_id', id).order('id');
  const photos = await Promise.all((rawImages || []).map(async (img) => {
    const { data } = await supabaseInternalAdmin.storage.from('land-lead-photos').createSignedUrl(img.storage_path, 3600);
    return { id: img.id, url: data?.signedUrl || null };
  }));

  const { data: team } = await supabaseInternalAdmin.from('team_members').select('id, name').eq('status', 'active').order('name');

  // Requirements within 3 km, closest first.
  let nearby: { id: number; title: string; status: string; distance_m: number; radius_max_m: number }[] = [];
  if (lead.lat != null && lead.lng != null) {
    const { data: reqs } = await supabaseInternalAdmin.from('site_requirements').select('id, title, status, lat, lng, radius_max_m').neq('status', 'closed');
    nearby = (reqs || [])
      .map((r) => ({ id: r.id, title: r.title, status: r.status, radius_max_m: r.radius_max_m, distance_m: Math.round(distanceInMeters(lead.lat, lead.lng, r.lat, r.lng)) }))
      .filter((r) => r.distance_m <= 3000)
      .sort((a, b) => a.distance_m - b.distance_m)
      .slice(0, 8);
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <LandLeadDetailClient lead={lead} photos={photos} team={team || []} nearby={nearby} />
    </div>
  );
}
