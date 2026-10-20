'use client';

import { useState } from 'react';
import { BRAND_CATEGORIES, BRAND_STATUSES } from '@/lib/brands-projects';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Values = Record<string, string>;

const TEXT = ['name', 'category', 'status', 'contact_name', 'contact_role', 'contact_phone', 'contact_email', 'notes', 'spec_notes'];
const NUM = ['min_land_sq_yds', 'min_builtup_sqft', 'max_builtup_sqft', 'min_road_width_ft', 'min_frontage_ft', 'min_ceiling_ft', 'power_kva', 'rent_min_per_sqft', 'rent_max_per_sqft', 'lease_years'];

export function toFormValues(brand?: any): Values {
  const v: Values = {};
  [...TEXT, ...NUM].forEach((k) => { v[k] = brand?.[k] != null ? String(brand[k]) : ''; });
  if (!v.category) v.category = 'quick_commerce';
  if (!v.status) v.status = 'active';
  return v;
}

export default function BrandForm({ initial, submitLabel, onSubmit, onCancel }: {
  initial?: any; submitLabel: string;
  onSubmit: (values: Values) => Promise<string | null>; // returns an error message or null
  onCancel?: () => void;
}) {
  const [v, setV] = useState<Values>(toFormValues(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, val: string) => setV((p) => ({ ...p, [k]: val }));

  const inputClass = 'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white';
  const labelClass = 'text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block';
  const num = (k: string, label: string, ph?: string) => (
    <div><label className={labelClass}>{label}</label><input inputMode="decimal" value={v[k]} onChange={(e) => set(k, e.target.value)} className={inputClass} placeholder={ph} /></div>
  );

  const submit = async () => {
    setError('');
    if (!v.name.trim()) { setError('Brand name is required.'); return; }
    setSaving(true);
    try {
      const err = await onSubmit(v);
      if (err) setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="text-sm font-bold text-stone-800 mb-3">Brand</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className={labelClass}>Name *</label><input value={v.name} onChange={(e) => set('name', e.target.value)} className={inputClass} placeholder="e.g. Blinkit" /></div>
          <div>
            <label className={labelClass}>Category</label>
            <select value={v.category} onChange={(e) => set('category', e.target.value)} className={inputClass}>
              {BRAND_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={v.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
              {BRAND_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="text-sm font-bold text-stone-800 mb-3">Contact</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Name</label><input value={v.contact_name} onChange={(e) => set('contact_name', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Role</label><input value={v.contact_role} onChange={(e) => set('contact_role', e.target.value)} className={inputClass} placeholder="e.g. Cluster Head, Expansion" /></div>
          <div><label className={labelClass}>Phone</label><input inputMode="tel" value={v.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Email</label><input type="email" value={v.contact_email} onChange={(e) => set('contact_email', e.target.value)} className={inputClass} /></div>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <div className="text-sm font-bold text-stone-800">Standard site spec</div>
        <p className="text-xs text-stone-500 mb-4 mt-0.5">The brand&apos;s usual format. Each site requirement uses these unless it sets its own. Land size and road width are checked against land leads automatically.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {num('min_land_sq_yds', 'Min land (sq yds)', 'e.g. 600')}
          {num('min_builtup_sqft', 'Min built-up (sq ft)', 'e.g. 4000')}
          {num('max_builtup_sqft', 'Max built-up (sq ft)')}
          {num('min_road_width_ft', 'Min road width (ft)', 'e.g. 30')}
          {num('min_frontage_ft', 'Min frontage (ft)')}
          {num('min_ceiling_ft', 'Min clear height (ft)')}
          {num('power_kva', 'Power load (kVA)')}
          {num('rent_min_per_sqft', 'Rent from (₹/sq ft/mo)')}
          {num('rent_max_per_sqft', 'Rent up to (₹/sq ft/mo)')}
          {num('lease_years', 'Usual lease (years)')}
        </div>
        <div className="mt-4"><label className={labelClass}>Other spec notes</label><textarea value={v.spec_notes} onChange={(e) => set('spec_notes', e.target.value)} className={inputClass + ' h-20 resize-none'} placeholder="e.g. Ground floor only, rolling shutters, parking for 30 two-wheelers" /></div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <label className={labelClass}>Notes</label>
        <textarea value={v.notes} onChange={(e) => set('notes', e.target.value)} className={inputClass + ' h-24 resize-none'} placeholder="Relationship history, decision process, who signs" />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={saving} className="px-5 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60">{saving ? 'Saving…' : submitLabel}</button>
        {onCancel && <button onClick={onCancel} className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-600 text-sm font-semibold bg-white">Cancel</button>}
      </div>
    </div>
  );
}
