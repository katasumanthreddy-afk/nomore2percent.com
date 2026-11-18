import type { Metadata } from 'next';
import AppShell from '@/components/internal/AppShell';
import { getInternalSession } from '@/lib/get-internal-team-member';
import { APP_BRAND } from '@/lib/app-brand';

export const metadata: Metadata = {
  title: { default: `${APP_BRAND.product} · ${APP_BRAND.name}`, template: `%s · ${APP_BRAND.name}` },
  robots: { index: false, follow: false },
};

// One shell for the whole portal. It stays mounted while you move between
// pages, so only the page content changes. Signed-out visitors (the login
// page) and people not on the team get the page alone.
export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const { member } = await getInternalSession();
  if (!member || member.status !== 'active') return <>{children}</>;
  return <AppShell member={{ name: member.name, role: member.role }}>{children}</AppShell>;
}
