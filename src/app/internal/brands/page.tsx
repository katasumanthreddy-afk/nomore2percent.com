import InternalHeader from '@/components/internal/InternalHeader';
import { requireInternalMember } from '@/lib/require-internal-member';
import BrandsListClient from './BrandsListClient';

export default async function BrandsPage() {
  const member = await requireInternalMember('/internal/brands');
  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <BrandsListClient />
    </div>
  );
}
