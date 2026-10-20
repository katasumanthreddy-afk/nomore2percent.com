import InternalHeader from '@/components/internal/InternalHeader';
import { requireInternalMember } from '@/lib/require-internal-member';
import NewBrandClient from './NewBrandClient';

export default async function NewBrandPage() {
  const member = await requireInternalMember('/internal/brands/new');
  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <NewBrandClient />
    </div>
  );
}
