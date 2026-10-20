'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PROJECT_STAGES, STUCK_AFTER_DAYS, daysSince } from '@/lib/brands-projects';

interface Project {
  id: number; name: string; stage: string; stage_changed_at: string; locality: string | null;
  builtup_sqft: number | null; rent_per_sqft: number | null; target_handover: string | null;
  brands: { id: number; name: string } | null;
  team_members: { id: number; name: string } | null;
  stage_done: number; stage_total: number;
}

export default function ProjectsBoardClient({ myId }: { myId: number }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [brand, setBrand] = useState('all');
  const [mine, setMine] = useState(false);
  const [stuckOnly, setStuckOnly] = useState(false);
  const [showDropped, setShowDropped] = useState(false);

  useEffect(() => {
    fetch('/api/internal/projects').then((r) => r.json())
      .then((d) => { if (d.success) setProjects(d.projects); else setError(d.message); })
      .catch(() => setError('Could not load projects.'))
      .finally(() => setLoading(false));
  }, []);

  const isStuck = (p: Project) => !['rent_started', 'dropped'].includes(p.stage) && daysSince(p.stage_changed_at) > STUCK_AFTER_DAYS;

  const brands = useMemo(() => [...new Map(projects.filter((p) => p.brands).map((p) => [p.brands!.id, p.brands!.name])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [projects]);

  const filtered = projects.filter((p) =>
    (brand === 'all' || String(p.brands?.id) === brand)
    && (!mine || p.team_members?.id === myId)
    && (!stuckOnly || isStuck(p)));

  const live = filtered.filter((p) => p.stage !== 'dropped');
  const dropped = filtered.filter((p) => p.stage === 'dropped');
  const stuckCount = projects.filter(isStuck).length;
  const liveSqft = live.filter((p) => p.stage !== 'rent_started').reduce((s, p) => s + Number(p.builtup_sqft || 0), 0);

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${active ? 'bg-orange-500 text-white border-orange-500' : 'border-stone-200 text-stone-500 bg-white hover:border-stone-300'}`;

  return (
    <div className="px-4 sm:px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">Projects</h1>
            <p className="text-sm text-stone-500 mt-1">Landowner + brand + site, from first interest to rent.</p>
          </div>
          <Link href="/internal/projects/new" className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600">+ New project</Link>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5 max-w-2xl">
          <div className="bg-white border border-stone-200 rounded-xl p-4"><div className="text-xs text-stone-500">In progress</div><div className="font-serif text-2xl font-bold text-stone-900">{live.filter((p) => p.stage !== 'rent_started').length}</div></div>
          <div className="bg-white border border-stone-200 rounded-xl p-4"><div className="text-xs text-stone-500">Stuck &gt; {STUCK_AFTER_DAYS} days</div><div className={`font-serif text-2xl font-bold ${stuckCount ? 'text-red-600' : 'text-stone-900'}`}>{stuckCount}</div></div>
          <div className="bg-white border border-stone-200 rounded-xl p-4"><div className="text-xs text-stone-500">Built-up in pipeline</div><div className="font-serif text-2xl font-bold text-stone-900">{liveSqft ? `${liveSqft.toLocaleString('en-IN')}` : '–'}<span className="text-xs font-sans text-stone-500"> sq ft</span></div></div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-1.5 text-xs bg-white">
            <option value="all">All brands</option>
            {brands.map(([id, name]) => <option key={id} value={String(id)}>{name}</option>)}
          </select>
          <button onClick={() => setMine((m) => !m)} className={chip(mine)}>Assigned to me</button>
          <button onClick={() => setStuckOnly((s) => !s)} className={chip(stuckOnly)}>Stuck only</button>
          <button onClick={() => setShowDropped((s) => !s)} className={chip(showDropped)}>Dropped ({dropped.length})</button>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}{/projects/.test(error) ? ' (run brands-projects-schema.sql in the internal Supabase project)' : ''}</p>}
      </div>

      {loading ? (
        <div className="max-w-7xl mx-auto h-72 bg-stone-200 rounded-xl animate-pulse" />
      ) : showDropped ? (
        <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
          {dropped.length === 0 ? <div className="p-8 text-center text-sm text-stone-400">No dropped projects.</div> : dropped.map((p) => (
            <Link key={p.id} href={`/internal/projects/${p.id}`} className="block px-4 py-3 hover:bg-stone-50">
              <div className="text-sm font-semibold text-stone-800">{p.name}</div>
              <div className="text-xs text-stone-500">{p.brands?.name || 'No brand'} · {p.locality || '–'}</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max max-w-none mx-auto" style={{ width: 'max-content' }}>
            {PROJECT_STAGES.map((s) => {
              const inStage = live.filter((p) => p.stage === s.value);
              return (
                <div key={s.value} className="w-60 flex-shrink-0">
                  <div className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2 px-1">{s.label} <span className="text-stone-400">({inStage.length})</span></div>
                  <div className="space-y-2 min-h-[4rem] bg-stone-100/70 rounded-xl p-2">
                    {inStage.map((p) => {
                      const days = daysSince(p.stage_changed_at);
                      const stuck = isStuck(p);
                      return (
                        <Link key={p.id} href={`/internal/projects/${p.id}`} className={`block bg-white border rounded-lg p-3 hover:border-orange-300 transition-colors ${stuck ? 'border-red-300' : 'border-stone-200'}`}>
                          <div className="text-sm font-semibold text-stone-800 leading-snug">{p.name}</div>
                          <div className="text-xs text-stone-500 mt-0.5">{p.brands?.name || 'No brand'}{p.locality ? ` · ${p.locality}` : ''}</div>
                          {p.stage_total > 0 && (
                            <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-400" style={{ width: `${Math.round((p.stage_done / p.stage_total) * 100)}%` }} />
                            </div>
                          )}
                          <div className="flex justify-between text-[11px] mt-1.5">
                            <span className="text-stone-400">{p.stage_total ? `${p.stage_done}/${p.stage_total} done` : ''}</span>
                            <span className={stuck ? 'text-red-600 font-semibold' : 'text-stone-400'}>{days}d in stage</span>
                          </div>
                          {p.team_members && <div className="text-[11px] text-stone-400 mt-0.5">→ {p.team_members.name}</div>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
