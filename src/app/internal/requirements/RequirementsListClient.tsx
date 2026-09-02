'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const RequirementsMap = dynamic(() => import('@/components/internal/RequirementsMap'), {
  ssr: false,
  loading: () => <div className="h-[600px] rounded-xl bg-stone-200 animate-pulse" />,
});

interface Requirement {
  id: number; title: string; lat: number; lng: number;
  radius_min_m: number; radius_max_m: number; status: string; nearby_count: number;
  commercial_properties: { id: number; title: string } | null;
  assigned_to_team_member_id: number | null;
}

const STATUS_BADGE: Record<string, string> = {
  searching: 'bg-orange-50 text-orange-600 border-orange-200',
  found: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  closed: 'bg-stone-100 text-stone-500 border-stone-200',
};

export default function RequirementsListClient() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'map'>('map');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    fetch('/api/internal/requirements').then((r) => r.json()).then((d) => {
      if (d.success) { setRequirements(d.requirements); setCurrentMemberId(d.currentMemberId); }
    }).finally(() => setLoading(false));
  }, []);

  const filtered = requirements
    .filter((r) => statusFilter === 'all' || r.status === statusFilter)
    .filter((r) => assignedFilter === 'all' || r.assigned_to_team_member_id === currentMemberId);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Site Requirements</h1>
        <div className="flex gap-2">
          <Link href="/internal/requirements/scouts" className="border border-stone-200 hover:border-stone-300 text-stone-600 rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
            External Scouts
          </Link>
          <Link href="/internal/requirements/bulk-import" className="border border-stone-200 hover:border-stone-300 text-stone-600 rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
            Bulk Import
          </Link>
        </div>
      </div>
      <p className="text-stone-500 text-sm mb-6">Target locations where you need to find a property — each has a search radius. Properties you add are automatically checked against these.</p>

      <div className="flex gap-2 mb-3">
        <button onClick={() => setAssignedFilter('all')} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${assignedFilter === 'all' ? 'bg-orange-500 text-white border-orange-500' : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}>
          All Requirements
        </button>
        <button onClick={() => setAssignedFilter('mine')} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${assignedFilter === 'mine' ? 'bg-orange-500 text-white border-orange-500' : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}>
          Assigned to Me
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-1.5 text-xs">
          <option value="all">All Status</option>
          <option value="searching">Searching</option>
          <option value="found">Found</option>
          <option value="closed">Closed</option>
        </select>
        <div className="flex border border-stone-200 rounded-lg overflow-hidden ml-auto">
          <button onClick={() => setView('list')} className={`px-3 py-1.5 text-xs font-semibold ${view === 'list' ? 'bg-orange-500 text-white' : 'text-stone-500'}`}>List</button>
          <button onClick={() => setView('map')} className={`px-3 py-1.5 text-xs font-semibold ${view === 'map' ? 'bg-orange-500 text-white' : 'text-stone-500'}`}>Map</button>
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] bg-stone-200 rounded-xl animate-pulse" />
      ) : view === 'map' ? (
        <RequirementsMap requirements={filtered} />
      ) : filtered.length > 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
          {filtered.map((r) => (
            <Link key={r.id} href={`/internal/requirements/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-stone-50 transition-colors">
              <div>
                <div className="text-sm font-semibold text-stone-800">{r.title}</div>
                <div className="text-xs text-stone-500">{r.radius_min_m}m – {r.radius_max_m}m radius {r.commercial_properties && `· Matched: ${r.commercial_properties.title}`}</div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-semibold text-orange-500">{r.nearby_count} nearby</span>
                <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${STATUS_BADGE[r.status] || ''}`}>{r.status}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-stone-300 rounded-xl p-14 text-center text-sm text-stone-400">No site requirements yet.</div>
      )}
    </div>
  );
}
