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

interface ExistingPhoto { id: number; url: string | null }

export default function PropertyForm({ mode, propertyId, initialData, initialPhotos }: { mode: 'create' | 'edit'; propertyId?: number; initialData?: Partial<CommercialFormData>; initialPhotos?: ExistingPhoto[] }) {
  const router = useRouter();
  const [form, setForm] = useState<CommercialFormData>({ ...empty, ...initialData });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>(initialPhotos || []);
  const [stagedPhotos, setStagedPhotos] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

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

      const newPropertyId = mode === 'edit' ? propertyId! : data.property.id;

      if (stagedPhotos.length > 0) {
        setUploadingPhotos(true);
        for (let i = 0; i < stagedPhotos.length; i++) {
          const fd = new FormData();
          fd.append('photo', stagedPhotos[i]);
          fd.append('property_id', String(newPropertyId));
          fd.append('is_primary', String(existingPhotos.length === 0 && i === 0));
          await fetch('/api/internal/properties/photos', { method: 'POST', body: fd });
        }
        setUploadingPhotos(false);
      }

      router.push(`/internal/properties/${newPropertyId}`);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const addStagedPhotos = (files: FileList | null) => {
    if (!files) return;
    setStagedPhotos((prev) => [...prev, ...Array.from(files)]);
  };

  const removeStagedPhoto = (idx: number) => {
    setStagedPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingPhoto = async (id: number) => {
    if (!confirm('Remove this photo?')) return;
    await fetch(`/api/internal/properties/photos?id=${id}`, { method: 'DELETE' });
    setExistingPhotos((prev) => prev.filter((p) => p.id !== id));
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
        <div className="text-sm font-bold text-stone-800 mb-3">Photos</div>

        {existingPhotos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {existingPhotos.map((p) => (
              <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 group">
                {p.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                )}
                <button onClick={() => removeExistingPhoto(p.id)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</button>
              </div>
            ))}
          </div>
        )}

        {stagedPhotos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {stagedPhotos.map((f, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeStagedPhoto(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</button>
                <span className="absolute bottom-1 left-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">New</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-2 border-dashed border-stone-300 rounded-xl p-5 text-center hover:border-orange-300 transition-colors">
          <p className="text-sm text-stone-500 mb-2">Add photos of the property</p>
          <label className="inline-block bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold rounded-lg px-4 py-2 cursor-pointer transition-colors">
            Choose Files
            <input type="file" multiple accept="image/*" onChange={(e) => addStagedPhotos(e.target.files)} className="hidden" />
          </label>
        </div>
      </div>

      <div>
        <div className="text-sm font-bold text-stone-800 mb-3">Location</div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={labelClass}>Latitude</label>
            <input
              type="number" step="0.000001" value={form.lat ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value === '' ? null : parseFloat(e.target.value) }))}
              placeholder="e.g. 17.474417" className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Longitude</label>
            <input
              type="number" step="0.000001" value={form.lng ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value === '' ? null : parseFloat(e.target.value) }))}
              placeholder="e.g. 78.345472" className={inputClass}
            />
          </div>
        </div>
        <p className="text-[11px] text-stone-400 mb-3">Type coordinates directly if you already have them (from a scout, GPS, etc.), or click the map below to drop a pin — either way keeps the other in sync.</p>

        <LocationPicker lat={form.lat} lng={form.lng} defaultCenter={getAreaCoordinates(form.area)} onChange={(lat, lng) => setForm((p) => ({ ...p, lat, lng }))} />
      </div>

      {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}

      <button onClick={submit} disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg py-3 text-sm font-bold transition-colors">
        {uploadingPhotos ? 'Uploading photos...' : saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Property'}
      </button>
    </div>
  );
}
