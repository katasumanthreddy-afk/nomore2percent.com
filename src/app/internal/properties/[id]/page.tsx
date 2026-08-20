import { redirect } from 'next/navigation';
import { createInternalServerClient } from '@/lib/supabase-internal-server';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
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

  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <PropertyDetailClient property={property} deals={deals || []} documents={documents || []} />
    </div>
  );
}
