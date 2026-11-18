import { requireInternalMember } from '@/lib/require-internal-member';
import BrandsListClient from './BrandsListClient';

export default async function BrandsPage() {
  await requireInternalMember('/internal/brands');
  return (
    <div className="min-h-screen bg-stone-50">
      <BrandsListClient />
    </div>
  );
}
