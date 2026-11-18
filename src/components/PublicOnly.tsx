'use client';

import { usePathname } from 'next/navigation';

// Renders its children everywhere except the internal portal, which has its
// own app shell: no public footer, visitor chat, install prompt or analytics.
export default function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/internal')) return null;
  return <>{children}</>;
}
