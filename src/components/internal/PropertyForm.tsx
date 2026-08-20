'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getAreaCoordinates } from '@/lib/area-coordinates';

const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-64 rounded-lg bg-stone-100 animate-pulse" />,
});

export interface CommercialFormData {
  title: string; address: string; area: string; lat: number | null; lng: number | null;
  property_type: string; deal_type: string;
  price: string; price_label: string; lease_rate: string; lease_rate_label: string;
  sqft: string; zoning: string; cap_rate: string; tenant_name: string; lease_expiry: string;
  status: string; notes: string;
}

const empty: CommercialFormData = {
  title: '', address: '', area: '', lat: null, lng: null,
  property_type: 'office', deal_type: 'sale',
  price: '', price_label: '', lease_rate: '', lease_rate_label: '',
  sqft: '', zoning: '', cap_rate: '', tenant_name: '', lease_expiry: '',
  status: 'available', notes: '',
};

export default function PropertyForm({ mode, propertyId, initialData }: { mode: 'create' | 'edit'; propertyId?: number; initialData?: Partial<CommercialFormData> }) {
  const router = useRouter();
  const [form, setForm] = useState<CommercialFormData>({ ...empty, ...initialData });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof CommercialFormData, v: any) => setForm((prev) => ({ ...prev, [k]: v }));
  const inputClass = "w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400";
  const labelClass = "text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block";

  const submit = async () => {
    setError('');
    if (!form.title.trim()) { setError('Property title is required.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.price ? parseFloat(form.price) : null,
        lease_rate: form.lease_rate ? parseFloat(form.lease_rate) : null,
        sqft: form.sqft ? parseFloat(form.sqft) : null,
        cap_rate: form.cap_rate ? parseFloat(form.cap_rate) : null,
        lease_expiry: form.lease_expiry || null,
      };
      const res = await fetch(mode === 'edit' ? `/api/internal/properties/${propertyId}` : '/api/internal/properties', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Something went wrong.'); setSaving(false); return; }
      router.push(mode === 'edit' ? `/internal/properties/${propertyId}` : `/internal/properties/${data.property.id}`);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6">
      <div>
        <div className="text-sm font-bold text-stone-800 mb-3">Property Details</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className={labelClass}>Title *</label><input value={form.title} onChange={(e) => set('title', e.target.value)} className={inputClass} placeholder="e.g. Grade-A Office Space, HITEC City" /></div>
          <div>
            <label className={labelClass}>Property Type</label>
            <select value={form.property_type} onChange={(e) => set('property_type', e.target.value)} className={inputClass}>
              <option value="office">Office</option>
              <option value="retail">Retail</option>
              <option value="warehouse">Warehouse</option>
              <option value="land">Land</option>
              <option value="mixed_use">Mixed Use</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Deal Type</label>
            <select value={form.deal_type} onChange={(e) => set('deal_type', e.target.value)} className={inputClass}>
              <option value="sale">For Sale</option>
              <option value="lease">For Lease</option>
            </select>
          </div>
          <div><label className={labelClass}>Area / Locality</label><input value={form.area} onChange={(e) => set('area', e.target.value)} className={inputClass} placeholder="e.g. Gachibowli" /></div>
          <div><label className={labelClass}>Address</label><input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Sqft</label><input type="number" value={form.sqft} onChange={(e) => set('sqft', e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Zoning</label><input value={form.zoning} onChange={(e) => set('zoning', e.target.value)} className={inputClass} placeholder="e.g. Commercial" /></div>

          {form.deal_type === 'sale' ? (
            <>
              <div><label className={labelClass}>Price (₹)</label><input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Price Label (display)</label><input value={form.price_label} onChange={(e) => set('price_label', e.target.value)} className={inputClass} placeholder="e.g. ₹12.5 Cr" /></div>
              <div><label className={labelClass}>Cap Rate (%)</label><input type="number" step="0.1" value={form.cap_rate} onChange={(e) => set('cap_rate', e.target.value)} className={inputClass} /></div>
            </>
          ) : (
            <>
              <div><label className={labelClass}>Lease Rate (₹/sqft/mo)</label><input type="number" value={form.lease_rate} onChange={(e) => set('lease_rate', e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Lease Rate Label (display)</label><input value={form.lease_rate_label} onChange={(e) => set('lease_rate_label', e.target.value)} className={inputClass} placeholder="e.g. ₹65/sqft/mo" /></div>
              <div><label className={labelClass}>Current Tenant</label><input value={form.tenant_name} onChange={(e) => set('tenant_name', e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Lease Expiry</label><input type="date" value={form.lease_expiry} onChange={(e) => set('lease_expiry', e.target.value)} className={inputClass} /></div>
            </>
          )}

          <div>
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
              <option value="available">Available</option>
              <option value="under_negotiation">Under Negotiation</option>
              <option value="closed">Closed</option>
              <option value="off_market">Off Market</option>
            </select>
          </div>

          <div className="md:col-span-2"><label className={labelClass}>Notes</label><textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className={inputClass + ' h-24 resize-none'} /></div>
        </div>
      </div>

      <div>
        <div className="text-sm font-bold text-stone-800 mb-3">Location</div>
        <LocationPicker lat={form.lat} lng={form.lng} defaultCenter={getAreaCoordinates(form.area)} onChange={(lat, lng) => setForm((p) => ({ ...p, lat, lng }))} />
      </div>

      {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}

      <button onClick={submit} disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg py-3 text-sm font-bold transition-colors">
        {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Property'}
      </button>
    </div>
  );
}
