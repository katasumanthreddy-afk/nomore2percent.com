import { redirect } from 'next/navigation';
import { requireInternalMember } from '@/lib/require-internal-member';
import TeamClient from './TeamClient';

export default async function TeamPage() {
  const member = await requireInternalMember('/internal/team');
  if (member.role !== 'owner') redirect('/internal');

  return (
    <div className="min-h-screen bg-stone-50">
      <TeamClient currentMemberId={member.id} />
    </div>
  );
}
