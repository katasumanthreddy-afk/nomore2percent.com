'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Deal {
  id: number; deal_name: string; stage: string; client_name: string | null;
  value: number | null; expected_close_date: string | null;
  commercial_properties: { id: number; title: string } | null;
  team_members: { id: number; name: string } | null;
}

const STAGES = [
  { v: 'lead', label: 'Lead' },
  { v: 'negotiation', label: 'Negotiation' },
  { v: 'due_diligence', label: 'Due Diligence' },
  { v: 'closed_won', label: 'Closed Won' },
  { v: 'closed_lost', label: 'Closed Lost' },
];

export default function DealsListClient() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/internal/deals').then((r) => r.json()).then((d) => { if (d.success) setDeals(d.deals); }).finally(() => setLoading(false));
  }, []);

  const filteredDeals = deals.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return d.deal_name?.toLowerCase().includes(q) || d.client_name?.toLowerCase().includes(q) || d.commercial_properties?.title?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Deals</h1>
        <Link href="/internal/deals/new" className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors">+ Add Deal</Link>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search deal name, client, or property..."
        className="border border-stone-200 rounded-lg px-3 py-1.5 text-xs w-72 mb-6"
      />

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-stone-200 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-6">
          {STAGES.map((stage) => {
            const inStage = filteredDeals.filter((d) => d.stage === stage.v);
            if (inStage.length === 0) return null;
            return (
              <div key={stage.v}>
                <div className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2">{stage.label} ({inStage.length})</div>
                <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
                  {inStage.map((d) => (
                    <Link key={d.id} href={`/internal/deals/${d.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors">
                      <div>
                        <div className="text-sm font-semibold text-stone-800">{d.deal_name}</div>
                        <div className="text-xs text-stone-500">{d.client_name || 'No client set'} {d.commercial_properties && `· ${d.commercial_properties.title}`}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {d.value && <div className="text-sm font-bold text-orange-500">₹{Number(d.value).toLocaleString('en-IN')}</div>}
                        {d.team_members && <div className="text-[10px] text-stone-400">{d.team_members.name}</div>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredDeals.length === 0 && <div className="bg-white border border-dashed border-stone-300 rounded-xl p-14 text-center text-sm text-stone-400">{search ? 'No deals match your search.' : 'No deals yet.'}</div>}
        </div>
      )}
    </div>
  );
}
