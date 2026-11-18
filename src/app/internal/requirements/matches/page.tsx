import { requireInternalMember } from '@/lib/require-internal-member';
import MatchesClient from './MatchesClient';

export default async function MatchesPage() {
  await requireInternalMember('/internal/requirements/matches');

  return (
    <div className="min-h-screen bg-stone-50">
      <MatchesClient />
    </div>
  );
}
