import { requireInternalMember } from '@/lib/require-internal-member';
import LandLeadsClient from './LandLeadsClient';

export default async function LandLeadsPage() {
  const member = await requireInternalMember('/internal/land-leads');

  return (
    <div className="min-h-screen bg-stone-50">
      <LandLeadsClient myId={member.id} />
    </div>
  );
}
