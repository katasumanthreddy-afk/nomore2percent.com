'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createInternalBrowserClient } from '@/lib/supabase-internal-browser';

export default function InternalHeader({ memberName, role }: { memberName: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    const supabase = createInternalBrowserClient();
    await supabase.auth.signOut();
    router.push('/internal/login');
  };

  const linkClass = (href: string) =>
    `text-sm font-medium transition-colors ${pathname.startsWith(href) ? 'text-orange-400' : 'text-stone-400 hover:text-stone-200'}`;

  return (
    <div className="bg-stone-950 border-b border-stone-800 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-7">
        <Link href="/internal" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-serif font-bold text-xs">N2</div>
          <span className="text-white font-serif font-bold text-sm hidden sm:inline">Internal</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/internal/properties" className={linkClass('/internal/properties')}>Properties</Link>
          <Link href="/internal/requirements" className={linkClass('/internal/requirements')}>Requirements</Link>
          <Link href="/internal/deals" className={linkClass('/internal/deals')}>Deals</Link>
          {role === 'owner' && <Link href="/internal/team" className={linkClass('/internal/team')}>Team</Link>}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-stone-500 hidden sm:inline">{memberName}</span>
        <button onClick={signOut} className="text-xs border border-stone-700 text-stone-300 rounded-lg px-3 py-1.5 hover:border-stone-500 transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}
