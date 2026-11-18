import { requireInternalMember } from '@/lib/require-internal-member';
import UnifiedMapClient from './UnifiedMapClient';

export default async function UnifiedMapPage() {
  await requireInternalMember('/internal/map');

  return (
    <div className="min-h-screen bg-stone-50">
      <UnifiedMapClient />
    </div>
  );
}
