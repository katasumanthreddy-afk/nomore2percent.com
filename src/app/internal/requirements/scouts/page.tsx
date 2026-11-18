import { requireInternalMember } from '@/lib/require-internal-member';
import ScoutsClient from './ScoutsClient';

export default async function ScoutsPage() {
  await requireInternalMember('/internal/requirements/scouts');

  return (
    <div className="min-h-screen bg-stone-50">
      <ScoutsClient />
    </div>
  );
}
