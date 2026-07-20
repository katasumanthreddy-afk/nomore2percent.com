import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import BrokerProfileClient from './BrokerProfileClient';

export const metadata: Metadata = {
  title: 'Your Profile | Broker Portal | nomore2percent',
};

export default async function BrokerProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/broker/profile');
  }

  const { data: broker } = await supabaseAdmin
    .from('brokers')
    .select('*')
    .ilike('email', user.email || '')
    .maybeSingle();

  if (!broker) {
    redirect('/broker');
  }

  return <BrokerProfileClient broker={broker} />;
}
