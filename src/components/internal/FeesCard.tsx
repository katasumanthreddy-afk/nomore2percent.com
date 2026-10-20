'use client';

import { useEffect, useState } from 'react';
import { FEE_BASES, FEE_PAYERS, FEE_STATUSES, FEE_TYPES, inr, isOverdue, monthlyRent, suggestFee } from '@/lib/brands-projects';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Fee {
  id: number; fee_type: string; payer: string; basis: string; basis_value: number | null; amount: number;
  due_date: string | null; status: string; invoice_number: string | null; invoiced_at: string | null;
  received_amount: number | null; received_at: string | null; notes: string | null;
}

const label = (list: { value: string; label: string }[], v: string) => list.find((x) => x.value === v)?.label || v;
const blank = { fee_type: 'brokerage', payer: 'landowner', basis: 'months_rent', basis_value: '1', amount: '', due_date: '', notes: '' };

export default function FeesCard({ project }: { project: any }) {
  const [fees, setFees] = useState<Fee[]>([]);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(blank);
  const [amountTouched, setAmountTouched] = useState(false);

  const load = () => {
    fetch(`/api/internal/projects/${project.id}/fees`).then((r) => r.json())
      .then((d) => { if (d.success) setFees(d.fees); else setError(d.message); });
  };
  useEffect(load, [project.id]);

  const suggested = suggestFee(form.basis, form.basis_value === '' ? null : Number(form.basis_value), project);
  const shownAmount = amountTouched || form.basis === 'fixed' ? form.amount : suggested != null ? String(suggested) : form.amount;

  const add = async () => {
    const body = { ...form, amount: shownAmount };
    const res = await fetch(`/api/internal/projects/${project.id}/fees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await res.json();
    if (!d.success) { alert(d.message); return; }
    setFees((f) => [...f, d.fee]); setForm(blank); setAmountTouched(false); setAdding(false);
  };

  const patch = async (fee: Fee, body: Record<string, unknown>) => {
    const res = await fetch(`/api/internal/projects/${project.id}/fees`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fee_id: fee.id, ...body }) });
    const d = await res.json();
    if (!d.success) { alert(d.message); return; }
    setFees((f) => f.map((x) => (x.id === fee.id ? d.fee : x)));
  };

  const markInvoiced = (fee: Fee) => {
    const no = prompt('Invoice number (optional)', fee.invoice_number || '');
    if (no === null) return;
    patch(fee, { status: 'invoiced', invoice_number: no });
  };
  const markReceived = (fee: Fee) => {
    const amt = prompt('Amount received ₹', String(fee.amount));
    if (amt === null) return;
    patch(fee, { status: 'received', received_amount: amt });
  };
  const remove = async (fee: Fee) => {
    if (!confirm('Delete this fee?')) return;
    await fetch(`/api/internal/projects/${project.id}/fees?fee_id=${fee.id}`, { method: 'DELETE' });
    setFees((f) => f.filter((x) => x.id !== fee.id));
  };

  if (error) return null; // non-owners: the card simply isn't shown

  const active = fees.filter((f) => f.status !== 'written_off');
  const total = active.reduce((s, f) => s + Number(f.amount), 0);
  const received = fees.filter((f) => f.status === 'received').reduce((s, f) => s + Number(f.received_amount ?? f.amount), 0);
  const rent = monthlyRent(project);
  const inputClass = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white';

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-bold text-stone-800">Our fees</div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">owner only</span>
      </div>
      <div className="text-xs text-stone-500 mb-3">{inr(received)} received of {inr(total)}</div>

      {fees.length === 0 && !adding && <p className="text-sm text-stone-400 mb-3">No fees recorded. Add what you&apos;ll charge as soon as the term sheet is agreed.</p>}

      <ul className="space-y-2 mb-3">
        {fees.map((f) => {
          const st = FEE_STATUSES.find((s) => s.value === f.status);
          const overdue = isOverdue(f);
          return (
            <li key={f.id} className={`border rounded-lg p-3 ${overdue ? 'border-red-200 bg-red-50/40' : 'border-stone-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-stone-900">{inr(f.amount)} <span className="font-normal text-stone-500">· {label(FEE_TYPES, f.fee_type)}</span></div>
                  <div className="text-[11px] text-stone-500">
                    from {label(FEE_PAYERS, f.payer).toLowerCase()}
                    {f.basis === 'months_rent' && f.basis_value ? ` · ${f.basis_value} month${Number(f.basis_value) === 1 ? '' : 's'} rent` : ''}
                    {f.basis === 'percent_contract' && f.basis_value ? ` · ${f.basis_value}% of contract` : ''}
                    {f.due_date && <span className={overdue ? 'text-red-600 font-semibold' : ''}> · due {new Date(f.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{overdue ? ' (overdue)' : ''}</span>}
                    {f.invoice_number && ` · inv ${f.invoice_number}`}
                    {f.status === 'received' && f.received_at && ` · received ${new Date(f.received_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${f.received_amount != null && Number(f.received_amount) !== Number(f.amount) ? ` (${inr(f.received_amount)})` : ''}`}
                  </div>
                </div>
                {st && <span className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 flex-shrink-0 ${st.badge}`}>{st.label}</span>}
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-[11px] font-semibold">
                {f.status === 'expected' && <button onClick={() => markInvoiced(f)} className="text-orange-600 hover:underline">Mark invoiced</button>}
                {(f.status === 'expected' || f.status === 'invoiced') && <button onClick={() => markReceived(f)} className="text-emerald-600 hover:underline">Mark received</button>}
                {f.status !== 'written_off' && f.status !== 'received' && <button onClick={() => confirm('Write this fee off?') && patch(f, { status: 'written_off' })} className="text-stone-400 hover:text-stone-600">Write off</button>}
                {f.status !== 'expected' && <button onClick={() => patch(f, { status: 'expected', received_amount: '', received_at: '' })} className="text-stone-400 hover:text-stone-600">Reset</button>}
                <button onClick={() => remove(f)} className="text-stone-300 hover:text-red-500 ml-auto">Delete</button>
              </div>
            </li>
          );
        })}
      </ul>

      {adding ? (
        <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select value={form.fee_type} onChange={(e) => setForm((f) => ({ ...f, fee_type: e.target.value }))} className={inputClass}>{FEE_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            <select value={form.payer} onChange={(e) => setForm((f) => ({ ...f, payer: e.target.value }))} className={inputClass}>{FEE_PAYERS.map((o) => <option key={o.value} value={o.value}>Paid by {o.label.toLowerCase()}</option>)}</select>
            <select value={form.basis} onChange={(e) => { setForm((f) => ({ ...f, basis: e.target.value, basis_value: e.target.value === 'percent_contract' ? '5' : e.target.value === 'months_rent' ? '1' : '' })); setAmountTouched(false); }} className={inputClass}>{FEE_BASES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            {form.basis !== 'fixed' ? (
              <input inputMode="decimal" value={form.basis_value} onChange={(e) => { setForm((f) => ({ ...f, basis_value: e.target.value })); setAmountTouched(false); }} placeholder={form.basis === 'months_rent' ? 'Months' : '%'} className={inputClass} />
            ) : <div />}
            <input inputMode="numeric" value={shownAmount} onChange={(e) => { setAmountTouched(true); setForm((f) => ({ ...f, amount: e.target.value })); }} placeholder="Amount ₹" className={inputClass} />
            <input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className={inputClass} title="Due date" />
          </div>
          {form.basis === 'months_rent' && !rent && <p className="text-[11px] text-amber-700">Add built-up sq ft and rent per sq ft to the project to calculate this.</p>}
          {form.basis === 'percent_contract' && !project.contract_value && <p className="text-[11px] text-amber-700">Add the construction contract value to calculate this.</p>}
          {form.basis !== 'fixed' && suggested != null && !amountTouched && <p className="text-[11px] text-stone-500">Calculated from {form.basis === 'months_rent' ? `monthly rent ${inr(rent)}` : `contract ${inr(project.contract_value)}`}. You can overwrite it.</p>}
          <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" className={inputClass} />
          <div className="flex gap-2">
            <button onClick={add} disabled={!shownAmount} className="text-xs bg-orange-500 text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-40">Add fee</button>
            <button onClick={() => { setAdding(false); setForm(blank); setAmountTouched(false); }} className="text-xs border border-stone-200 rounded-lg px-4 py-2 font-semibold text-stone-600">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="text-xs text-orange-500 font-semibold hover:underline">+ Add fee</button>
      )}
    </div>
  );
}
