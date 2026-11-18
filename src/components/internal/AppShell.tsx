'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, KanbanSquare, Sprout, Target, Building2, Map, Store, Users,
  IndianRupee, Handshake, ShieldCheck, LogOut, Menu, X,
} from 'lucide-react';
import { createInternalBrowserClient } from '@/lib/supabase-internal-browser';
import { APP_BRAND } from '@/lib/app-brand';

type Item = { href: string; label: string; icon: typeof LayoutDashboard; ownerOnly?: boolean; exact?: boolean };
const GROUPS: { label: string; items: Item[] }[] = [
  { label: 'Overview', items: [{ href: '/internal', label: 'Today', icon: LayoutDashboard, exact: true }] },
  {
    label: 'Pipeline',
    items: [
      { href: '/internal/projects', label: 'Projects', icon: KanbanSquare },
      { href: '/internal/land-leads', label: 'Land Leads', icon: Sprout },
      { href: '/internal/requirements', label: 'Requirements', icon: Target },
    ],
  },
  {
    label: 'Supply',
    items: [
      { href: '/internal/properties', label: 'Properties', icon: Building2 },
      { href: '/internal/map', label: 'Map', icon: Map },
    ],
  },
  {
    label: 'Partners',
    items: [
      { href: '/internal/brands', label: 'Brands', icon: Store },
      { href: '/internal/requirements/scouts', label: 'Scouts', icon: Users },
    ],
  },
  {
    label: 'Money',
    items: [
      { href: '/internal/fees', label: 'Fees', icon: IndianRupee, ownerOnly: true },
      { href: '/internal/deals', label: 'Deals', icon: Handshake },
    ],
  },
  { label: 'Admin', items: [{ href: '/internal/team', label: 'Team', icon: ShieldCheck, ownerOnly: true }] },
];

// The most specific matching item wins, so Scouts (under /requirements)
// doesn't also light up Requirements.
function activeHref(pathname: string, items: Item[]) {
  let best: Item | null = null;
  for (const it of items) {
    const hit = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + '/');
    if (hit && (!best || it.href.length > best.href.length)) best = it;
  }
  return best?.href ?? null;
}

export default function AppShell({ member, children }: { member: { name: string; role: string }; children: React.ReactNode }) {
  const pathname = usePathname() || '/internal';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isOwner = member.role === 'owner';
  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !i.ownerOnly || isOwner) })).filter((g) => g.items.length);
  const active = activeHref(pathname, groups.flatMap((g) => g.items));
  const current = groups.flatMap((g) => g.items).find((i) => i.href === active);

  // Portal-wide safety net for API calls:
  //  - an expired login (403 "Not authorized") sends you to sign in again,
  //    instead of pages silently showing empty lists;
  //  - a server error shows a short notice instead of failing silently.
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const original = window.fetch;
    let redirecting = false;
    window.fetch = async (input, init) => {
      const res = await original(input, init);
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (!url.includes('/api/internal/')) return res;
      if (res.status === 403 && !redirecting) {
        const body = await res.clone().json().catch(() => null);
        if (body?.message === 'Not authorized') {
          redirecting = true;
          window.location.href = `/internal/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }
      } else if (res.status >= 500) {
        setNotice('Something went wrong on our side. Please try again in a moment.');
      }
      return res;
    };
    return () => { window.fetch = original; };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const signOut = async () => {
    await createInternalBrowserClient().auth.signOut();
    router.push('/internal/login');
    router.refresh();
  };

  const initials = member.name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Main">
      {groups.map((g) => (
        <div key={g.label}>
          <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">{g.label}</div>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const on = it.href === active;
              const Icon = it.icon;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={on ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${on ? 'bg-white/[0.08] text-white' : 'text-stone-400 hover:bg-white/[0.04] hover:text-stone-100'}`}
                  >
                    <Icon size={16} strokeWidth={on ? 2.25 : 1.75} className={on ? 'text-orange-400' : 'text-stone-500 group-hover:text-stone-300'} />
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <Link href="/internal" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.06] flex-shrink-0">
      <span className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs font-bold tracking-tight">{APP_BRAND.mark}</span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-white">{APP_BRAND.name}</span>
        <span className="block text-[11px] text-stone-500">{APP_BRAND.product}</span>
      </span>
    </Link>
  );

  const user = (
    <div className="border-t border-white/[0.06] p-3 flex items-center gap-3 flex-shrink-0">
      <span className="w-8 h-8 rounded-full bg-stone-800 text-stone-200 flex items-center justify-center text-[11px] font-semibold flex-shrink-0">{initials || '?'}</span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[13px] font-medium text-stone-100 truncate">{member.name}</span>
        <span className="block text-[11px] text-stone-500 capitalize">{member.role}</span>
      </span>
      <button onClick={signOut} title="Sign out" aria-label="Sign out" className="p-2 rounded-lg text-stone-500 hover:text-stone-100 hover:bg-white/[0.06] transition-colors">
        <LogOut size={16} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col bg-stone-950 z-30">
        {brand}
        {nav}
        {user}
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-stone-950 flex items-center gap-3 px-3">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-2 rounded-lg text-stone-300 hover:bg-white/[0.06]"><Menu size={20} /></button>
        <span className="w-7 h-7 rounded-md bg-orange-500 text-white flex items-center justify-center text-[11px] font-bold">{APP_BRAND.mark}</span>
        <span className="text-sm font-semibold text-white truncate">{current?.label ?? APP_BRAND.product}</span>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-stone-950 flex flex-col shadow-2xl">
            <div className="relative">
              {brand}
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 p-2 rounded-lg text-stone-400 hover:bg-white/[0.06]"><X size={18} /></button>
            </div>
            {nav}
            {user}
          </div>
        </div>
      )}

      <main className="lg:pl-60 min-w-0">{children}</main>

      {notice && (
        <div role="status" className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:max-w-sm bg-stone-900 text-stone-100 text-sm rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3">
          <span className="flex-1">{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss" className="text-stone-400 hover:text-white"><X size={16} /></button>
        </div>
      )}
    </div>
  );
}
