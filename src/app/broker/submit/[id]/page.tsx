import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import BrokerSubmitClient from '../BrokerSubmitClient';

export const metadata: Metadata = {
  title: 'Edit Listing | Broker Portal | nomore2percent',
};

export default async function BrokerEditSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/broker/submit/${id}`);
  }

  const { data: broker } = await supabaseAdmin
    .from('brokers')
    .select('*')
    .ilike('email', user.email || '')
    .maybeSingle();

  if (!broker || broker.status === 'suspended') {
    redirect('/broker');
  }

  const { data: submission } = await supabaseAdmin
    .from('property_submissions')
    .select('*, property_submission_images(id, storage_path, is_primary)')
    .eq('id', id)
    .single();

  // Only the broker who submitted it can edit it, and only while still pending —
  // once reviewed, the record shouldn't change out from under admin's decision.
  if (!submission || submission.broker_id !== broker.id || submission.status !== 'pending') {
    redirect('/broker');
  }

  const initialData = {
    title: submission.title || '',
    description: submission.description || '',
    price: submission.price || '',
    property_type: submission.property_type || 'apartment',
    listing_type: submission.listing_type || 'sale',
    area: submission.area || '',
    address: submission.address || '',
    bedrooms: submission.bedrooms != null ? String(submission.bedrooms) : '',
    bathrooms: submission.bathrooms != null ? String(submission.bathrooms) : '',
    sqft: submission.sqft != null ? String(submission.sqft) : '',
    size_unit: submission.size_unit || 'sqft',
    floor: submission.floor || '',
    year_built: submission.year_built || '',
    lat: submission.lat ?? null,
    lng: submission.lng ?? null,
  };

  const initialPhotos = (submission.property_submission_images || []).sort(
    (a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
  );

  return (
    <BrokerSubmitClient
      mode="edit"
      submissionId={submission.id}
      brokerId={broker.id}
      brokerName={broker.name}
      initialData={initialData}
      initialPhotos={initialPhotos}
    />
  );
}
