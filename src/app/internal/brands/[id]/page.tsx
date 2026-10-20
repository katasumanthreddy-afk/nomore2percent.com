import InternalHeader from '@/components/internal/InternalHeader';
import { requireInternalMember } from '@/lib/require-internal-member';
import BrandDetailClient from './BrandDetailClient';

export default async function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await requireInternalMember(`/internal/brands/${id}`);
  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <BrandDetailClient brandId={id} isOwner={member.role === 'owner'} />
    </div>
  );
}
