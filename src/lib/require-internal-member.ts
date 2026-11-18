import { redirect } from 'next/navigation';
import { getInternalSession } from '@/lib/get-internal-team-member';

// Shared guard for internal pages: signed in, on the team, active.
export async function requireInternalMember(nextPath: string) {
  const { email, member } = await getInternalSession();
  if (!email) redirect(`/internal/login?next=${encodeURIComponent(nextPath)}`);
  if (!member || member.status !== 'active') redirect('/internal');
  return member;
}

// Only same-site internal paths are allowed as a post-login destination.
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/internal') || next.startsWith('//') || next.includes('\\')) return '/internal';
  return next;
}
