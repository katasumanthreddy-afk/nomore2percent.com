import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createInternalServerClient } from '@/lib/supabase-internal-server';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import InternalHeader from '@/components/internal/InternalHeader';
import DealForm from '@/components/internal/DealForm';

export default async function NewDealPage({ searchParams }: { searchParams: Promise<{ property_id?: string }> }) {
  const { property_id } = await searchParams;
  const supabase = await createInternalServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/internal/login');

  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') redirect('/internal');

  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/internal/deals" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Deals</Link>
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">Add Deal</h1>
        <DealForm mode="create" initialData={{ property_id: property_id || '' }} />
      </div>
    </div>
  );
}
