import InternalHeader from '@/components/internal/InternalHeader';
import { requireInternalMember } from '@/lib/require-internal-member';
import ProjectsBoardClient from './ProjectsBoardClient';

export default async function ProjectsPage() {
  const member = await requireInternalMember('/internal/projects');
  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <ProjectsBoardClient myId={member.id} />
    </div>
  );
}
