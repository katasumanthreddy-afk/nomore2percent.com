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
    <div className="bg-stone-950 border-b border-stone-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-3 sticky top-0 z-10 overflow-hidden">
      <div className="flex items-center gap-4 sm:gap-7 min-w-0">
        <Link href="/internal" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-serif font-bold text-xs flex-shrink-0">N2</div>
          <span className="text-white font-serif font-bold text-sm hidden md:inline whitespace-nowrap">Internal</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href="/internal/properties" className={linkClass('/internal/properties') + ' flex-shrink-0'}>Properties</Link>
          <Link href="/internal/requirements" className={linkClass('/internal/requirements') + ' flex-shrink-0'}>Requirements</Link>
          <Link href="/internal/map" className={linkClass('/internal/map') + ' flex-shrink-0'}>Map</Link>
          <Link href="/internal/deals" className={linkClass('/internal/deals') + ' flex-shrink-0'}>Deals</Link>
          {role === 'owner' && <Link href="/internal/team" className={linkClass('/internal/team') + ' flex-shrink-0'}>Team</Link>}
        </nav>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <span className="text-xs text-stone-500 hidden lg:inline whitespace-nowrap">{memberName}</span>
        <button onClick={signOut} className="text-xs border border-stone-700 text-stone-300 rounded-lg px-3 py-1.5 hover:border-stone-500 transition-colors flex-shrink-0 whitespace-nowrap">
          Sign Out
        </button>
      </div>
    </div>
  );
}
