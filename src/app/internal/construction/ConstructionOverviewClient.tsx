'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, HardHat } from 'lucide-react';
import { inr, stageLabel } from '@/lib/brands-projects';

interface Row {
  id: number; name: string; stage: string; brand: string | null;
  builder_name: string | null; builder_phone: string | null;
  progress: number; target_handover: string | null;
  schedule: { kind: string; label: string };
  budget: number; spent: number; paid: number; due: number;
  spent_pct: number | null; overspending: boolean; projected: number | null;
  over_categories: string[];
  last_update: { note: string | null; progress: number | null; at: string } | null;
}

const SCHEDULE: Record<string, string> = {
  late: 'bg-red-50 text-red-700 border-red-200',
  behind: 'bg-amber-50 text-amber-700 border-amber-200',
  on_track: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  none: 'bg-stone-50 text-stone-500 border-stone-200',
};

const ago = (iso: string) => {
  const d = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
};

type Filter = 'active' | 'attention' | 'all';

export default function ConstructionOverviewClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [costsReady, setCostsReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('active');

  useEffect(() => {
    fetch('/api/internal/construction').then((r) => r.json())
      .then((d) => { if (d.success) { setRows(d.projects); setCostsReady(d.costsReady); } else setError(d.message); })
      .catch(() => setError('Could not load construction.'))
      .finally(() => setLoading(false));
  }, []);

  const needsAttention = (r: Row) => r.overspending || r.over_categories.length > 0 || r.schedule.kind === 'late' || r.schedule.kind === 'behind' || r.due > 0;
  const active = (r: Row) => r.schedule.kind !== 'done';

  const shown = useMemo(() => rows.filter((r) => filter === 'all' || (filter === 'active' ? active(r) : needsAttention(r))), [rows, filter]);
  const totals = useMemo(() => shown.reduce((t, r) => ({ budget: t.budget + r.budget, spent: t.spent + r.spent, due: t.due + r.due }), { budget: 0, spent: 0, due: 0 }), [shown]);
  const chip = (on: boolean) => `px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap ${on ? 'bg-orange-500 text-white border-orange-500' : 'border-stone-200 text-stone-500 bg-white hover:border-stone-300'}`;
  const card = 'bg-white border border-stone-200/80 rounded-xl shadow-[0_1px_2px_rgba(28,25,23,0.04)]';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl tracking-tight font-semibold text-stone-900">Construction</h1>
        <p className="text-sm text-stone-500 mt-1">Every site being built: progress, schedule, budget and what&apos;s been spent.</p>
      </div>

      {!costsReady && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">Budgets and expenses aren&apos;t set up yet: run <span className="font-mono">construction-costs-schema.sql</span> in the internal Supabase project. Progress and schedule still show.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className={`${card} p-4`}><div className="text-xs text-stone-500">Sites</div><div className="text-xl sm:text-2xl tracking-tight font-semibold text-stone-900">{shown.length}</div></div>
        <div className={`${card} p-4`}><div className="text-xs text-stone-500">Total budget</div><div className="text-xl sm:text-2xl tracking-tight font-semibold text-stone-900">{inr(totals.budget) || '₹0'}</div></div>
        <div className={`${card} p-4`}><div className="text-xs text-stone-500">Spent</div><div className="text-xl sm:text-2xl tracking-tight font-semibold text-stone-900">{inr(totals.spent) || '₹0'}</div></div>
        <div className={`${card} p-4`}><div className="text-xs text-stone-500">Payments due</div><div className={`text-xl sm:text-2xl tracking-tight font-semibold ${totals.due > 0 ? 'text-amber-600' : 'text-stone-900'}`}>{inr(totals.due) || '₹0'}</div></div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button onClick={() => setFilter('active')} className={chip(filter === 'active')}>In progress ({rows.filter(active).length})</button>
        <button onClick={() => setFilter('attention')} className={chip(filter === 'attention')}>Needs attention ({rows.filter(needsAttention).length})</button>
        <button onClick={() => setFilter('all')} className={chip(filter === 'all')}>All ({rows.length})</button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 bg-stone-200 rounded-xl animate-pulse" />)}</div>
      ) : shown.length === 0 ? (
        <div className={`${card} border-dashed p-10 text-center text-sm text-stone-500`}>
          <HardHat className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          {rows.length === 0 ? 'No projects have reached the construction contract stage yet.' : 'Nothing here with this filter.'}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => {
            const warn = [
              r.overspending && `${r.spent_pct}% spent at ${r.progress}% built`,
              r.over_categories.length > 0 && `Over budget: ${r.over_categories.join(', ')}`,
              r.projected != null && r.budget > 0 && r.projected > r.budget && `Heading for ~${inr(r.projected)}`,
            ].filter(Boolean) as string[];
            return (
              <Link key={r.id} href={`/internal/projects/${r.id}`} className={`${card} block p-4 hover:border-orange-300 transition-colors`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-stone-900">{r.name}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{r.brand || 'No brand'} · {stageLabel(r.stage)}{r.builder_name ? ` · ${r.builder_name}` : ''}</div>
                  </div>
                  <span className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${SCHEDULE[r.schedule.kind] || SCHEDULE.none}`}>{r.schedule.label}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-stone-500 mb-1"><span>Built</span><span className="tabular-nums">{r.progress}%</span></div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden"><div className="h-full bg-orange-400" style={{ width: `${r.progress}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-stone-500 mb-1">
                      <span>Spent {inr(r.spent) || '₹0'}{r.budget ? ` of ${inr(r.budget)}` : ''}</span>
                      <span className="tabular-nums">{r.spent_pct != null ? `${r.spent_pct}%` : 'no budget'}</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden"><div className={`h-full ${r.overspending || (r.spent_pct ?? 0) > 100 ? 'bg-red-500' : 'bg-stone-700'}`} style={{ width: `${Math.min(100, r.spent_pct ?? 0)}%` }} /></div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 mt-3">
                  {r.due > 0 && <span className="text-amber-700 font-semibold">{inr(r.due)} payments due</span>}
                  {r.target_handover && <span>Handover {new Date(r.target_handover).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  {r.last_update ? <span className="truncate max-w-full">Last update {ago(r.last_update.at)}{r.last_update.note ? `: ${r.last_update.note}` : ''}</span> : <span>No site updates yet</span>}
                </div>
                {warn.length > 0 && (
                  <div className="mt-2 flex gap-1.5 text-xs text-red-700"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{warn.join(' · ')}</div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
