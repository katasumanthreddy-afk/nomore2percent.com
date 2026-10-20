'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Opt = { id: number; name?: string; title?: string };

export default function NewProjectClient({ prefill, brands, requirements, team, myId }: {
  prefill: Record<string, string>; brands: Opt[]; requirements: Opt[]; team: Opt[]; myId: number;
}) {
  const router = useRouter();
  const [v, setV] = useState<Record<string, string>>({
    name: '', brand_id: '', requirement_id: '', property_id: '', land_lead_id: '',
    landowner_name: '', landowner_phone: '', locality: '', land_sq_yds: '', builtup_sqft: '',
    rent_per_sqft: '', lease_years: '', target_handover: '', assigned_to: String(myId), notes: '',
    ...prefill,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, val: string) => setV((p) => ({ ...p, [k]: val }));

  const inputClass = 'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white';
  const labelClass = 'text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block';

  const submit = async () => {
    setError('');
    if (!v.name.trim()) { setError('Give the project a name.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/internal/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) });
      const d = await res.json();
      if (!d.success) { setError(d.message || 'Could not save.'); return; }
      router.push(`/internal/projects/${d.project.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/internal/projects" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Projects</Link>
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">New project</h1>
      <p className="text-sm text-stone-500 mb-6">Starts at &quot;Brand interested&quot; with the standard checklist for every stage.</p>

      <div className="space-y-5">
        <div className="bg-white border border-stone-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className={labelClass}>Project name *</label><input value={v.name} onChange={(e) => set('name', e.target.value)} className={inputClass} placeholder="e.g. Blinkit · Kompally 1200 sq yds" /></div>
          <div>
            <label className={labelClass}>Brand</label>
            <select value={v.brand_id} onChange={(e) => set('brand_id', e.target.value)} className={inputClass}>
              <option value="">Not decided yet</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Site requirement</label>
            <select value={v.requirement_id} onChange={(e) => set('requirement_id', e.target.value)} className={inputClass}>
              <option value="">None</option>
              {requirements.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Assigned to</label>
            <select value={v.assigned_to} onChange={(e) => set('assigned_to', e.target.value)} className={inputClass}>
              <option value="">Unassigned</option>
              {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div><label className={labelClass}>Target handover</label><input type="date" value={v.target_handover} onChange={(e) => set('target_handover', e.target.value)} className={inputClass} /></div>
          {(v.land_lead_id || v.property_id) && (
            <p className="md:col-span-2 text-xs text-stone-500">
              Linked to {v.land_lead_id && <Link href={`/internal/land-leads/${v.land_lead_id}`} className="text-orange-500 hover:underline">land lead #{v.land_lead_id}</Link>}
              {v.land_lead_id && v.property_id && ' and '}
              {v.property_id && <Link href={`/internal/properties/${v.property_id}`} className="text-orange-500 hover:underline">property #{v.property_id}</Link>}.
            </p>
          )}
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 text-sm font-bold text-stone-800">Landowner & site</div>
          <div><label className={labelClass}>Landowner name</label><input value={v.landowner_name} onChange={(e) => set('landowner_name', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Landowner phone</label><input inputMode="tel" value={v.landowner_phone} onChange={(e) => set('landowner_phone', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Locality</label><input value={v.locality} onChange={(e) => set('locality', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Land (sq yds)</label><input inputMode="decimal" value={v.land_sq_yds} onChange={(e) => set('land_sq_yds', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Planned built-up (sq ft)</label><input inputMode="decimal" value={v.builtup_sqft} onChange={(e) => set('builtup_sqft', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Rent (₹/sq ft/month)</label><input inputMode="decimal" value={v.rent_per_sqft} onChange={(e) => set('rent_per_sqft', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Lease (years)</label><input inputMode="numeric" value={v.lease_years} onChange={(e) => set('lease_years', e.target.value)} className={inputClass} /></div>
          <div className="md:col-span-2"><label className={labelClass}>Notes</label><textarea value={v.notes} onChange={(e) => set('notes', e.target.value)} className={inputClass + ' h-20 resize-none'} /></div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <button onClick={submit} disabled={saving} className="px-5 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60">{saving ? 'Creating…' : 'Create project'}</button>
      </div>
    </div>
  );
}
