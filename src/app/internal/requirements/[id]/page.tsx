import { requireInternalMember } from '@/lib/require-internal-member';
import RequirementDetailClient from './RequirementDetailClient';

export default async function RequirementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireInternalMember(`/internal/requirements/${id}`);

  return (
    <div className="min-h-screen bg-stone-50">
      <RequirementDetailClient requirementId={id} />
    </div>
  );
}
