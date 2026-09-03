import { redirect } from 'next/navigation';
import { createInternalServerClient } from '@/lib/supabase-internal-server';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { distanceInMeters } from '@/lib/geo-utils';
import InternalHeader from '@/components/internal/InternalHeader';
import PropertyDetailClient from './PropertyDetailClient';

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createInternalServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/internal/login?next=/internal/properties/${id}`);

  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') redirect('/internal');

  const { data: property } = await supabaseInternalAdmin.from('commercial_properties').select('*').eq('id', id).single();
  if (!property) redirect('/internal/properties');

  const { data: deals } = await supabaseInternalAdmin.from('deals').select('id, deal_name, stage').eq('property_id', id);
  const { data: documents } = await supabaseInternalAdmin.from('documents').select('*').eq('property_id', id).order('created_at', { ascending: false });
  const { data: rawPhotos } = await supabaseInternalAdmin.from('property_images').select('*').eq('property_id', id).order('is_primary', { ascending: false });

  const photos = await Promise.all(
    (rawPhotos || []).map(async (p) => {
      const { data } = await supabaseInternalAdmin.storage.from('commercial-property-photos').createSignedUrl(p.storage_path, 3600);
      return { id: p.id, url: data?.signedUrl || null, is_primary: p.is_primary };
    })
  );

  let matchingRequirements: { id: number; title: string; status: string }[] = [];
  if (property.lat != null && property.lng != null) {
    const { data: requirements } = await supabaseInternalAdmin.from('site_requirements').select('id, title, status, lat, lng, radius_max_m').neq('status', 'closed');
    matchingRequirements = (requirements || [])
      .filter((r) => distanceInMeters(r.lat, r.lng, property.lat, property.lng) <= r.radius_max_m)
      .map((r) => ({ id: r.id, title: r.title, status: r.status }));
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <PropertyDetailClient property={property} deals={deals || []} documents={documents || []} matchingRequirements={matchingRequirements} photos={photos} />
    </div>
  );
}
