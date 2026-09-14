'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Match {
  id: number; title: string; area: string | null; status: string; deal_type: string;
  price_label: string | null; lease_rate_label: string | null; distance_m: number;
}

interface RequirementResult {
  id: number; title: string; radius_max_m: number; status: string;
  matched_property_id: number | null; matches: Match[];
}

const STATUS_BADGE: Record<string, string> = {
  searching: 'bg-orange-50 text-orange-600 border-orange-200',
  found: 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

export default function MatchesClient() {
  const [results, setResults] = useState<RequirementResult[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/internal/requirements/matches')
      .then((r) => r.json())
      .then((d) => { if (d.success) { setResults(d.results); setTotalMatches(d.totalMatches); } })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link href="/internal/requirements" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Site Requirements</Link>

      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Requirement Matches</h1>
      <p className="text-stone-500 text-sm mb-6">
        Every open requirement that currently has a property within its search radius — computed automatically from live coordinates, no manual checking needed. New properties show up here the moment they're added, if they fall in range of anything.
      </p>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-stone-200 rounded-xl animate-pulse" />)}</div>
      ) : results.length > 0 ? (
        <>
          <div className="bg-stone-900 text-white rounded-xl px-4 py-3 mb-5 text-sm font-semibold">
            {results.length} requirement{results.length === 1 ? '' : 's'} with candidates · {totalMatches} total matches
          </div>

          <div className="space-y-4">
            {results.map((r) => (
              <div key={r.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                  <Link href={`/internal/requirements/${r.id}`} className="font-semibold text-stone-800 hover:text-orange-500">{r.title}</Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-orange-500">{r.matches.length} match{r.matches.length === 1 ? '' : 'es'}</span>
                    <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_BADGE[r.status] || ''}`}>{r.status}</span>
                  </div>
                </div>
                <div className="divide-y divide-stone-50">
                  {r.matches.map((m) => (
                    <Link key={m.id} href={`/internal/properties/${m.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-stone-700">{m.title}</span>
                        {r.matched_property_id === m.id && <span className="text-[10px] font-bold text-emerald-600">✓ CONFIRMED MATCH</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-stone-500">{m.deal_type === 'lease' ? m.lease_rate_label : m.price_label}</span>
                        <span className="font-semibold text-orange-500">{m.distance_m}m</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white border border-dashed border-stone-300 rounded-xl p-14 text-center text-sm text-stone-400">
          No matches yet — nothing currently falls within any open requirement's search radius.
        </div>
      )}
    </div>
  );
}
