import { requireInternalMember } from '@/lib/require-internal-member';
import NewBrandClient from './NewBrandClient';

export default async function NewBrandPage() {
  await requireInternalMember('/internal/brands/new');
  return (
    <div className="min-h-screen bg-stone-50">
      <NewBrandClient />
    </div>
  );
}
