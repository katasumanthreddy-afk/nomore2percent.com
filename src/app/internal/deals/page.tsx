import { requireInternalMember } from '@/lib/require-internal-member';
import DealsListClient from './DealsListClient';

export default async function DealsPage() {
  await requireInternalMember('/internal/deals');

  return (
    <div className="min-h-screen bg-stone-50">
      <DealsListClient />
    </div>
  );
}
