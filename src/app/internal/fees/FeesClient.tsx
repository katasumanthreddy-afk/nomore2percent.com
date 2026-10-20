'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FEE_STATUSES, FEE_TYPES, feeSummary, inr, isOverdue } from '@/lib/brands-projects';

interface Fee {
  id: number; fee_type: string; payer: string; amount: number; due_date: string | null; status: string;
  received_amount: number | null; received_at: string | null; invoice_number: string | null;
  projects: { id: number; name: string; stage: string; brands: { name: string } | null } | null;
}

type Filter = 'open' | 'overdue' | 'received' | 'all';

export default function FeesClient() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('open');

  useEffect(() => {
    fetch('/api/internal/fees').then((r) => r.json())
      .then((d) => { if (d.success) setFees(d.fees); else setError(d.message); })
      .catch(() => setError('Could not load fees.'))
      .finally(() => setLoading(false));
  }, []);

  const s = useMemo(() => feeSummary(fees), [fees]);

  const shown = fees.filter((f) =>
    filter === 'all' ? true
    : filter === 'overdue' ? isOverdue(f)
    : filter === 'received' ? f.status === 'received'
    : f.status === 'expected' || f.status === 'invoiced');

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${active ? 'bg-orange-500 text-white border-orange-500' : 'border-stone-200 text-stone-500 bg-white hover:border-stone-300'}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/internal/projects" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Projects</Link>
      <h1 className="font-serif text-2xl font-bold text-stone-900">Fees</h1>
      <p className="text-sm text-stone-500 mt-1 mb-6">What nomore2percent earns across projects. Visible to owners only.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-stone-200 rounded-xl p-4"><div className="text-xs text-stone-500">Received this quarter</div><div className="font-serif text-xl font-bold text-emerald-600">{inr(s.receivedThisQuarter)}</div></div>
        <div className="bg-white border border-stone-200 rounded-xl p-4"><div className="text-xs text-stone-500">Invoiced, awaiting payment</div><div className="font-serif text-xl font-bold text-stone-900">{inr(s.invoiced)}</div></div>
        <div className="bg-white border border-stone-200 rounded-xl p-4"><div className="text-xs text-stone-500">Expected (not yet invoiced)</div><div className="font-serif text-xl font-bold text-stone-900">{inr(s.expected)}</div></div>
        <div className="bg-white border border-stone-200 rounded-xl p-4"><div className="text-xs text-stone-500">Overdue</div><div className={`font-serif text-xl font-bold ${s.overdueCount ? 'text-red-600' : 'text-stone-900'}`}>{inr(s.overdue)}{s.overdueCount ? <span className="text-xs font-sans font-normal text-stone-500"> · {s.overdueCount}</span> : null}</div></div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['open', 'overdue', 'received', 'all'] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={chip(filter === f)}>{f[0].toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}{/project_fees/.test(error) ? ' (run construction-fees-schema.sql in the internal Supabase project)' : ''}</p>}

      {loading ? (
        <div className="h-48 bg-stone-200 rounded-xl animate-pulse" />
      ) : shown.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-xl p-10 text-center text-sm text-stone-400">Nothing here. Add fees from a project&apos;s page.</div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-stone-500 border-b border-stone-200">
                <th className="px-4 py-2.5 font-semibold">Project</th>
                <th className="px-4 py-2.5 font-semibold">Fee</th>
                <th className="px-4 py-2.5 font-semibold text-right">Amount</th>
                <th className="px-4 py-2.5 font-semibold">Due</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {shown.map((f) => {
                const st = FEE_STATUSES.find((x) => x.value === f.status);
                const overdue = isOverdue(f);
                return (
                  <tr key={f.id} className={overdue ? 'bg-red-50/40' : ''}>
                    <td className="px-4 py-2.5">
                      {f.projects ? <Link href={`/internal/projects/${f.projects.id}`} className="font-semibold text-stone-800 hover:text-orange-600">{f.projects.name}</Link> : '–'}
                      {f.projects?.brands && <div className="text-[11px] text-stone-500">{f.projects.brands.name}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-stone-600">{FEE_TYPES.find((t) => t.value === f.fee_type)?.label}<div className="text-[11px] text-stone-400">from {f.payer}{f.invoice_number ? ` · inv ${f.invoice_number}` : ''}</div></td>
                    <td className="px-4 py-2.5 text-right font-semibold text-stone-900 whitespace-nowrap">{inr(f.status === 'received' ? (f.received_amount ?? f.amount) : f.amount)}</td>
                    <td className={`px-4 py-2.5 whitespace-nowrap ${overdue ? 'text-red-600 font-semibold' : 'text-stone-600'}`}>{f.due_date ? new Date(f.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '–'}</td>
                    <td className="px-4 py-2.5">{st && <span className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${st.badge}`}>{st.label}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
