'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, FileText, Pencil, Plus, Receipt, Share2, Trash2, TrendingUp } from 'lucide-react';
import { inr } from '@/lib/brands-projects';
import { compressImage } from '@/lib/compress-image';
import {
  COST_CATEGORIES, PAID_BY, UNITS, categoryLabel, costSummary, lineAmount, progressMessage,
  type BudgetLine, type Expense,
} from '@/lib/construction-costs';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Tab = 'expenses' | 'budget';
type ExpenseRow = Expense & { has_bill?: boolean };

const today = () => new Date().toISOString().slice(0, 10);
const blankExpense = () => ({ category: 'cement_materials', description: '', vendor: '', quantity: '', unit: '', rate: '', amount: '', expense_date: today(), paid_by: 'landowner', payment_status: 'paid' });
const blankLine = { category: 'civil', description: '', quantity: '', unit: 'sq ft', rate: '', amount: '' };

const inputClass = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white';
const labelClass = 'text-[11px] text-stone-500';

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'red' | 'amber' | 'green' }) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : tone === 'green' ? 'text-emerald-600' : 'text-stone-900';
  return (
    <div className="rounded-lg border border-stone-200 px-3 py-2.5 min-w-0">
      <div className="text-[11px] text-stone-500">{label}</div>
      <div className={`text-base font-semibold tabular-nums truncate ${color}`}>{value}</div>
    </div>
  );
}

/** Quantity × rate = amount inputs, shared by expenses and budget lines. */
function PricingInputs({ v, set }: { v: Record<string, string>; set: (k: string, val: string) => void }) {
  const computed = lineAmount(v.quantity, v.rate, '');
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div><label className={labelClass}>Qty</label><input inputMode="decimal" value={v.quantity} onChange={(e) => set('quantity', e.target.value)} className={inputClass} placeholder="e.g. 200" /></div>
      <div>
        <label className={labelClass}>Unit</label>
        <select value={v.unit} onChange={(e) => set('unit', e.target.value)} className={inputClass}>
          <option value="">—</option>
          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div><label className={labelClass}>Rate ₹</label><input inputMode="decimal" value={v.rate} onChange={(e) => set('rate', e.target.value)} className={inputClass} placeholder="per unit" /></div>
      <div>
        <label className={labelClass}>Amount ₹ *</label>
        <input inputMode="decimal" value={computed != null ? String(computed) : v.amount} onChange={(e) => set('amount', e.target.value)} readOnly={computed != null} className={`${inputClass} ${computed != null ? 'bg-stone-50 font-semibold' : ''}`} placeholder="Total" />
      </div>
    </div>
  );
}

export default function CostsCard({ project }: { project: any }) {
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [setup, setSetup] = useState('');
  const [tab, setTab] = useState<Tab>('expenses');
  const [adding, setAdding] = useState(false);
  const [exp, setExp] = useState<Record<string, string>>(blankExpense);
  const [bill, setBill] = useState<File | null>(null);
  const [line, setLine] = useState<Record<string, string>>(blankLine);
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'due'>('all');

  const apply = useCallback((d: any) => {
    if (d.success) { setLines(d.lines); setExpenses(d.expenses); setSetup(''); } else if (d.setup) setSetup(d.message);
    setLoaded(true);
  }, []);
  const reload = useCallback(() => fetch(`/api/internal/projects/${project.id}/costs`).then((r) => r.json()).then(apply).catch(() => setLoaded(true)), [project.id, apply]);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/internal/projects/${project.id}/costs`).then((r) => r.json()).then((d) => { if (!cancelled) apply(d); }).catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [project.id, project.updated_at, apply]);

  const summary = useMemo(() => costSummary(lines, expenses, { contractValue: project.contract_value, progress: project.construction_progress }), [lines, expenses, project.contract_value, project.construction_progress]);
  const progress = project.construction_progress ?? 0;
  const usingContract = lines.length === 0 && summary.budget > 0;

  const saveExpense = async () => {
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('kind', 'expense');
      const amt = lineAmount(exp.quantity, exp.rate, exp.amount);
      Object.entries({ ...exp, amount: amt != null ? String(amt) : '' }).forEach(([k, v]) => fd.append(k, v));
      if (bill) fd.append('bill', bill.type.startsWith('image/') ? await compressImage(bill) : bill);
      const d = await fetch(`/api/internal/projects/${project.id}/costs`, { method: 'POST', body: fd }).then((r) => r.json());
      if (!d.success) { setError(d.message || 'Could not save.'); return; }
      if (d.billSaved === false) setError('Expense saved, but the bill could not be uploaded (max 3 MB, image or PDF).');
      setExp(blankExpense()); setBill(null); setAdding(false);
      reload();
    } finally {
      setSaving(false);
    }
  };

  const saveLine = async () => {
    setSaving(true); setError('');
    try {
      const amt = lineAmount(line.quantity, line.rate, line.amount);
      const body = { ...line, amount: amt != null ? String(amt) : '', kind: 'budget', ...(editingLine ? { id: editingLine } : { sort: lines.length }) };
      const d = await fetch(`/api/internal/projects/${project.id}/costs`, { method: editingLine ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());
      if (!d.success) { setError(d.message || 'Could not save.'); return; }
      setLine(blankLine); setEditingLine(null); setAdding(false);
      reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (kind: Tab, id: number) => {
    if (!confirm(kind === 'budget' ? 'Delete this budget line?' : 'Delete this expense and its bill?')) return;
    await fetch(`/api/internal/projects/${project.id}/costs?kind=${kind === 'budget' ? 'budget' : 'expense'}&item_id=${id}`, { method: 'DELETE' });
    reload();
  };

  const togglePaid = async (e: ExpenseRow) => {
    const next = e.payment_status === 'paid' ? 'due' : 'paid';
    setExpenses((xs) => xs.map((x) => (x.id === e.id ? { ...x, payment_status: next } : x)));
    await fetch(`/api/internal/projects/${project.id}/costs`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'expense', id: e.id, payment_status: next }) });
  };

  const share = async () => {
    let latest: string | null = null;
    try {
      const d = await fetch(`/api/internal/projects/${project.id}/construction`).then((r) => r.json());
      latest = d.updates?.find((u: any) => u.note)?.note || null;
    } catch { /* fine without it */ }
    const text = progressMessage({ name: project.name, progress, budget: summary.budget, spent: summary.spent, due: summary.due, latestNote: latest, targetHandover: project.target_handover }, (v) => inr(v) || '₹0');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  if (!loaded) return <div className="h-40 rounded-xl bg-stone-100 animate-pulse" />;
  if (setup) {
    return (
      <div className="bg-white border border-amber-200 rounded-xl p-5">
        <div className="text-sm font-bold text-stone-800 mb-1">Budget & expenses</div>
        <p className="text-sm text-amber-800">{setup}</p>
      </div>
    );
  }

  const shown = filter === 'due' ? expenses.filter((e) => e.payment_status === 'due') : expenses;
  const byDate = shown.reduce<Record<string, ExpenseRow[]>>((acc, e) => { (acc[e.expense_date] ||= []).push(e); return acc; }, {});
  const spentBar = summary.spentPct != null ? Math.min(100, summary.spentPct) : 0;

  return (
    <div className="bg-white border border-stone-200/80 rounded-xl shadow-[0_1px_2px_rgba(28,25,23,0.04)] p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm font-bold text-stone-800">Budget & expenses</div>
        <button onClick={share} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-lg px-2.5 py-1.5 hover:border-emerald-300">
          <Share2 className="w-3.5 h-3.5" /> Send update
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <Stat label={usingContract ? 'Budget (contract)' : 'Budget'} value={summary.budget ? inr(summary.budget) || '—' : 'Not set'} />
        <Stat label="Spent" value={inr(summary.spent) || '₹0'} tone={summary.overspending ? 'red' : undefined} />
        <Stat label="Paid" value={inr(summary.paid) || '₹0'} tone="green" />
        <Stat label="Payments due" value={inr(summary.due) || '₹0'} tone={summary.due > 0 ? 'amber' : undefined} />
      </div>

      {summary.budget > 0 && (
        <div className="mb-3 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] text-stone-500"><span className="w-16">Built</span>
            <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden"><div className="h-full bg-orange-400" style={{ width: `${progress}%` }} /></div>
            <span className="w-10 text-right tabular-nums">{progress}%</span></div>
          <div className="flex items-center gap-2 text-[11px] text-stone-500"><span className="w-16">Spent</span>
            <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden"><div className={`h-full ${summary.overspending || (summary.spentPct ?? 0) > 100 ? 'bg-red-500' : 'bg-stone-700'}`} style={{ width: `${spentBar}%` }} /></div>
            <span className="w-10 text-right tabular-nums">{summary.spentPct}%</span></div>
        </div>
      )}

      {(summary.overspending || summary.byCategory.some((c) => c.over)) && (
        <div className="mb-3 flex gap-2 text-xs text-red-800 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <div>
            {summary.overspending && <div>{summary.spentPct}% of the budget is spent but the site is only {progress}% built.</div>}
            {summary.byCategory.filter((c) => c.over).length > 0 && <div>Over budget: {summary.byCategory.filter((c) => c.over).map((c) => `${c.label} (${inr(c.spent - c.budget)} over)`).join(', ')}.</div>}
          </div>
        </div>
      )}
      {summary.projected != null && summary.budget > 0 && (
        <div className={`mb-3 flex items-center gap-1.5 text-xs ${summary.projected > summary.budget ? 'text-amber-700' : 'text-stone-500'}`}>
          <TrendingUp className="w-3.5 h-3.5" /> At this rate the build will cost about {inr(summary.projected)}{summary.projected > summary.budget ? ` (${inr(summary.projected - summary.budget)} over budget)` : ''}.
        </div>
      )}

      <div className="flex items-center gap-1 border-b border-stone-200 mb-3">
        {([['expenses', `Expenses (${expenses.length})`], ['budget', `Budget & pricing (${lines.length})`]] as [Tab, string][]).map(([t, l]) => (
          <button key={t} onClick={() => { setTab(t); setAdding(false); setEditingLine(null); setError(''); }} className={`px-3 py-2 text-xs font-semibold -mb-px border-b-2 ${tab === t ? 'border-orange-500 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}>{l}</button>
        ))}
      </div>

      {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>}

      {tab === 'expenses' ? (
        <>
          {adding ? (
            <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-3 space-y-2 mb-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className={labelClass}>Category *</label><select value={exp.category} onChange={(e) => setExp((x) => ({ ...x, category: e.target.value }))} className={inputClass}>{COST_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                <div><label className={labelClass}>What for</label><input value={exp.description} onChange={(e) => setExp((x) => ({ ...x, description: e.target.value }))} className={inputClass} placeholder="e.g. OPC 53 cement" /></div>
                <div><label className={labelClass}>Vendor / paid to</label><input value={exp.vendor} onChange={(e) => setExp((x) => ({ ...x, vendor: e.target.value }))} className={inputClass} placeholder="e.g. Sri Sai Traders" /></div>
                <div><label className={labelClass}>Date</label><input type="date" value={exp.expense_date} onChange={(e) => setExp((x) => ({ ...x, expense_date: e.target.value }))} className={inputClass} /></div>
              </div>
              <PricingInputs v={exp} set={(k, val) => setExp((x) => ({ ...x, [k]: val }))} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div><label className={labelClass}>Paid by</label><select value={exp.paid_by} onChange={(e) => setExp((x) => ({ ...x, paid_by: e.target.value }))} className={inputClass}>{PAID_BY.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
                <div><label className={labelClass}>Status</label><select value={exp.payment_status} onChange={(e) => setExp((x) => ({ ...x, payment_status: e.target.value }))} className={inputClass}><option value="paid">Paid</option><option value="due">Due (not paid yet)</option></select></div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>Bill</label>
                  <label className="flex items-center gap-1.5 border border-stone-200 bg-white rounded-lg px-3 py-2 text-sm text-stone-600 cursor-pointer truncate">
                    <Receipt className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{bill ? bill.name : 'Photo or PDF'}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { setBill(e.target.files?.[0] || null); e.target.value = ''; }} />
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={saveExpense} disabled={saving} className="text-xs bg-orange-500 text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-60">{saving ? 'Saving…' : 'Save expense'}</button>
                <button onClick={() => { setAdding(false); setExp(blankExpense()); setBill(null); setError(''); }} className="text-xs border border-stone-200 rounded-lg px-4 py-2 font-semibold text-stone-600">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 mb-3">
              <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 text-xs bg-stone-900 text-white rounded-lg px-3 py-2 font-semibold"><Plus className="w-3.5 h-3.5" /> Add expense</button>
              {summary.due > 0 && (
                <div className="flex gap-1 text-[11px] font-semibold">
                  <button onClick={() => setFilter('all')} className={`px-2.5 py-1 rounded-md border ${filter === 'all' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-600'}`}>All</button>
                  <button onClick={() => setFilter('due')} className={`px-2.5 py-1 rounded-md border ${filter === 'due' ? 'bg-amber-500 text-white border-amber-500' : 'border-stone-200 text-stone-600'}`}>Due only</button>
                </div>
              )}
            </div>
          )}

          {expenses.length === 0 && !adding && <p className="text-sm text-stone-400">No expenses yet. Log material, labour and other payments as they happen, or add a spend when you post a site update.</p>}

          <div className="space-y-3">
            {Object.entries(byDate).map(([date, list]) => (
              <div key={date}>
                <div className="flex justify-between text-[11px] font-semibold text-stone-500 mb-1">
                  <span>{new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="tabular-nums">{inr(list.reduce((s, e) => s + Number(e.amount), 0))}</span>
                </div>
                <ul className="divide-y divide-stone-100 border border-stone-200 rounded-lg">
                  {list.map((e) => (
                    <li key={e.id} className="group flex items-start gap-3 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-stone-900 truncate">{e.description || categoryLabel(e.category)}</div>
                        <div className="text-[11px] text-stone-500 truncate">
                          {categoryLabel(e.category)}
                          {e.quantity && e.rate ? ` · ${Number(e.quantity).toLocaleString('en-IN')} ${e.unit || ''} × ${inr(e.rate)}` : ''}
                          {e.vendor ? ` · ${e.vendor}` : ''}
                          {` · by ${PAID_BY.find((p) => p.value === e.paid_by)?.label.toLowerCase() || e.paid_by}`}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold text-stone-900 tabular-nums">{inr(e.amount)}</div>
                        <div className="flex items-center justify-end gap-2 mt-0.5">
                          {e.bill_url && <a href={e.bill_url} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-700" title="View bill" aria-label="View bill"><FileText className="w-3.5 h-3.5" /></a>}
                          <button onClick={() => togglePaid(e)} className={`text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 ${e.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`} title={e.payment_status === 'paid' ? 'Mark as due' : 'Mark as paid'}>
                            {e.payment_status === 'paid' ? <span className="inline-flex items-center gap-0.5"><Check className="w-3 h-3" />Paid</span> : 'Due'}
                          </button>
                          <button onClick={() => remove('expenses', e.id)} className="text-stone-300 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Delete expense"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {summary.byCategory.length > 0 && (
            <div className="space-y-2 mb-4">
              {summary.byCategory.map((c) => {
                const pct = c.budget > 0 ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : c.spent > 0 ? 100 : 0;
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-stone-700">{c.label}</span>
                      <span className={`tabular-nums ${c.over ? 'text-red-600 font-semibold' : !c.budget ? 'text-amber-700' : 'text-stone-500'}`}>{inr(c.spent) || '₹0'} / {c.budget ? inr(c.budget) : 'not in budget'}</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden"><div className={`h-full ${c.over ? 'bg-red-500' : !c.budget ? 'bg-amber-300' : 'bg-orange-400'}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}

          {lines.length > 0 && (
            <div className="overflow-x-auto border border-stone-200 rounded-lg mb-3">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-[11px] text-stone-500 uppercase tracking-wide">
                  <tr><th className="text-left font-semibold px-3 py-2">Item</th><th className="text-right font-semibold px-3 py-2 whitespace-nowrap">Qty × rate</th><th className="text-right font-semibold px-3 py-2">Amount</th><th className="w-14" /></tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {lines.map((l) => (
                    <tr key={l.id} className="group">
                      <td className="px-3 py-2"><div className="text-stone-900">{l.description || categoryLabel(l.category)}</div><div className="text-[11px] text-stone-500">{categoryLabel(l.category)}</div></td>
                      <td className="px-3 py-2 text-right text-xs text-stone-500 whitespace-nowrap tabular-nums">{l.quantity && l.rate ? `${Number(l.quantity).toLocaleString('en-IN')} ${l.unit || ''} × ${inr(l.rate)}` : 'lump sum'}</td>
                      <td className="px-3 py-2 text-right font-semibold text-stone-900 tabular-nums whitespace-nowrap">{inr(l.amount)}</td>
                      <td className="px-2 py-2 text-right whitespace-nowrap">
                        <button onClick={() => { setEditingLine(l.id); setAdding(true); setLine({ category: l.category, description: l.description || '', quantity: l.quantity != null ? String(l.quantity) : '', unit: l.unit || '', rate: l.rate != null ? String(l.rate) : '', amount: String(l.amount) }); }} className="text-stone-300 hover:text-stone-700 mr-2" aria-label="Edit line"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove('budget', l.id)} className="text-stone-300 hover:text-red-500" aria-label="Delete line"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-50"><tr><td className="px-3 py-2 text-xs font-semibold text-stone-600" colSpan={2}>Total budget</td><td className="px-3 py-2 text-right font-semibold text-stone-900 tabular-nums">{inr(lines.reduce((s, l) => s + Number(l.amount), 0))}</td><td /></tr></tfoot>
              </table>
            </div>
          )}

          {adding ? (
            <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className={labelClass}>Category *</label><select value={line.category} onChange={(e) => setLine((x) => ({ ...x, category: e.target.value }))} className={inputClass}>{COST_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                <div><label className={labelClass}>Item</label><input value={line.description} onChange={(e) => setLine((x) => ({ ...x, description: e.target.value }))} className={inputClass} placeholder="e.g. RCC frame structure" /></div>
              </div>
              <PricingInputs v={line} set={(k, val) => setLine((x) => ({ ...x, [k]: val }))} />
              <div className="flex gap-2 pt-1">
                <button onClick={saveLine} disabled={saving} className="text-xs bg-orange-500 text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-60">{saving ? 'Saving…' : editingLine ? 'Save line' : 'Add line'}</button>
                <button onClick={() => { setAdding(false); setEditingLine(null); setLine(blankLine); setError(''); }} className="text-xs border border-stone-200 rounded-lg px-4 py-2 font-semibold text-stone-600">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 text-xs bg-stone-900 text-white rounded-lg px-3 py-2 font-semibold"><Plus className="w-3.5 h-3.5" /> Add budget line</button>
              {lines.length === 0 && <p className="text-sm text-stone-400 mt-2">Break the build into priced items, e.g. RCC structure 4,500 sq ft × ₹1,450. {project.contract_value ? `Until then, the contract value (${inr(project.contract_value)}) is used as the budget.` : ''}</p>}
            </>
          )}
        </>
      )}
    </div>
  );
}
