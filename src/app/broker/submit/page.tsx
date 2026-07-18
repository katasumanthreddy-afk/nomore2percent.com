import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import BrokerSubmitClient from './BrokerSubmitClient';

export const metadata: Metadata = {
  title: 'Submit a Listing | Broker Portal | nomore2percent',
};

export default async function BrokerSubmitPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/broker/submit');
  }

  const { data: broker } = await supabaseAdmin
    .from('brokers')
    .select('*')
    .ilike('email', user.email || '')
    .maybeSingle();

  if (!broker || broker.status === 'suspended') {
    redirect('/broker');
  }

  return <BrokerSubmitClient brokerId={broker.id} brokerName={broker.name} />;
}
