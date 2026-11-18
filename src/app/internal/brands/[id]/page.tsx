import { requireInternalMember } from '@/lib/require-internal-member';
import BrandDetailClient from './BrandDetailClient';

export default async function BrandDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const { sites } = await searchParams;
  const member = await requireInternalMember(`/internal/brands/${id}`);
  return (
    <div className="min-h-screen bg-stone-50">
      <BrandDetailClient brandId={id} isOwner={member.role === 'owner'} sitesResult={sites} />
    </div>
  );
}
