import { requireInternalMember } from '@/lib/require-internal-member';
import ScoutSubmissionsClient from './ScoutSubmissionsClient';

export default async function ScoutSubmissionsPage() {
  await requireInternalMember('/internal/requirements/scout-submissions');

  return (
    <div className="min-h-screen bg-stone-50">
      <ScoutSubmissionsClient />
    </div>
  );
}
