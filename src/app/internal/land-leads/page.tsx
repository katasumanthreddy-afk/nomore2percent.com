import { redirect } from 'next/navigation';
import { createInternalServerClient } from '@/lib/supabase-internal-server';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import InternalHeader from '@/components/internal/InternalHeader';
import LandLeadsClient from './LandLeadsClient';

export default async function LandLeadsPage() {
  const supabase = await createInternalServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/internal/login?next=/internal/land-leads');

  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') redirect('/internal');

  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <LandLeadsClient myId={member.id} />
    </div>
  );
}
