import { requireInternalMember } from '@/lib/require-internal-member';
import ProjectsBoardClient from './ProjectsBoardClient';

export default async function ProjectsPage() {
  const member = await requireInternalMember('/internal/projects');
  return (
    <div className="min-h-screen bg-stone-50">
      <ProjectsBoardClient myId={member.id} isOwner={member.role === 'owner'} />
    </div>
  );
}
