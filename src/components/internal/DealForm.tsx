'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface DealFormData {
  deal_name: string; property_id: string; stage: string;
  client_name: string; client_contact: string; value: string;
  assigned_to: string; notes: string; expected_close_date: string;
}

const empty: DealFormData = {
  deal_name: '', property_id: '', stage: 'lead',
  client_name: '', client_contact: '', value: '',
  assigned_to: '', notes: '', expected_close_date: '',
};

export default function DealForm({ mode, dealId, initialData }: { mode: 'create' | 'edit'; dealId?: number; initialData?: Partial<DealFormData> }) {
  const router = useRouter();
  const [form, setForm] = useState<DealFormData>({ ...empty, ...initialData });
  const [properties, setProperties] = useState<{ id: number; title: string }[]>([]);
  const [team, setTeam] = useState<{ id: number; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/internal/properties').then((r) => r.json()).then((d) => d.success && setProperties(d.properties));
    fetch('/api/internal/team').then((r) => r.json()).then((d) => d.success && setTeam(d.members.filter((m: any) => m.status === 'active')));
  }, []);

  const set = (k: keyof DealFormData, v: string) => setForm((prev) => ({ ...prev, [k]: v }));
  const inputClass = "w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400";
  const labelClass = "text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block";

  const submit = async () => {
    setError('');
    if (!form.deal_name.trim()) { setError('Deal name is required.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        property_id: form.property_id || null,
        assigned_to: form.assigned_to || null,
        value: form.value ? parseFloat(form.value) : null,
        expected_close_date: form.expected_close_date || null,
      };
      const res = await fetch(mode === 'edit' ? `/api/internal/deals/${dealId}` : '/api/internal/deals', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Something went wrong.'); setSaving(false); return; }
      router.push(mode === 'edit' ? `/internal/deals/${dealId}` : `/internal/deals/${data.deal.id}`);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
      <div><label className={labelClass}>Deal Name *</label><input value={form.deal_name} onChange={(e) => set('deal_name', e.target.value)} className={inputClass} placeholder="e.g. HITEC City Office — Acme Corp Lease" /></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Linked Property</label>
          <select value={form.property_id} onChange={(e) => set('property_id', e.target.value)} className={inputClass}>
            <option value="">None</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Stage</label>
          <select value={form.stage} onChange={(e) => set('stage', e.target.value)} className={inputClass}>
            <option value="lead">Lead</option>
            <option value="negotiation">Negotiation</option>
            <option value="due_diligence">Due Diligence</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </select>
        </div>
        <div><label className={labelClass}>Client Name</label><input value={form.client_name} onChange={(e) => set('client_name', e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Client Contact</label><input value={form.client_contact} onChange={(e) => set('client_contact', e.target.value)} className={inputClass} placeholder="Phone or email" /></div>
        <div><label className={labelClass}>Deal Value (₹)</label><input type="number" value={form.value} onChange={(e) => set('value', e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Expected Close Date</label><input type="date" value={form.expected_close_date} onChange={(e) => set('expected_close_date', e.target.value)} className={inputClass} /></div>
        <div>
          <label className={labelClass}>Assigned To</label>
          <select value={form.assigned_to} onChange={(e) => set('assigned_to', e.target.value)} className={inputClass}>
            <option value="">Unassigned</option>
            {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div><label className={labelClass}>Notes</label><textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className={inputClass + ' h-24 resize-none'} /></div>

      {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}

      <button onClick={submit} disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg py-3 text-sm font-bold transition-colors">
        {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Deal'}
      </button>
    </div>
  );
}
