import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createInternalServerClient } from '@/lib/supabase-internal-server';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import InternalHeader from '@/components/internal/InternalHeader';
import PropertyForm from '@/components/internal/PropertyForm';

export default async function NewPropertyPage() {
  const supabase = await createInternalServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/internal/login');

  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') redirect('/internal');

  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/internal/properties" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Properties</Link>
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">Add Commercial Property</h1>
        <PropertyForm mode="create" />
      </div>
    </div>
  );
}
