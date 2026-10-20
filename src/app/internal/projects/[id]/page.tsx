import InternalHeader from '@/components/internal/InternalHeader';
import { requireInternalMember } from '@/lib/require-internal-member';
import ProjectDetailClient from './ProjectDetailClient';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await requireInternalMember(`/internal/projects/${id}`);
  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <ProjectDetailClient projectId={id} isOwner={member.role === 'owner'} />
    </div>
  );
}
