'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { getAreaCoordinates } from '@/lib/area-coordinates';
import { compressImage } from '@/lib/compress-image';
import { FLOORS, LISTING_TYPES, SUBMITTER_ROLES } from '@/lib/lease-listing';
import { CheckCircle2, Crosshair, MapPin, Upload, X, Building2, Plus } from 'lucide-react';

const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-[280px] rounded-xl bg-stone-100 animate-pulse" />,
});

const WHATSAPP = '917013224895';

type PhotoPreview = { file: File; url: string };

const blankProperty = {
  property_type: '', locality: '', address: '',
  sqft: '', land_sq_yds: '', floor: '', road_width_ft: '', frontage_ft: '',
  rate_per_sqft: '', rent_monthly: '', available_from: '', notes: '',
};

export default function ListForLeaseClient() {
  const params = useSearchParams();
  const by = params.get('by') || '';

  // Contact details stay filled after a submission so people can send
  // several properties in a row.
  const [contact, setContact] = useState({ name: '', phone: '', role: 'owner', website: '' });
  const [form, setForm] = useState(blankProperty);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sentCount, setSentCount] = useState(0);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof blankProperty, v: string) => { setForm((p) => ({ ...p, [k]: v })); setError(''); };
  const isLand = form.property_type === 'land';

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 6 - photos.length)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((p) => [...p, ...next]);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { setError('Your phone did not share its location. Tap the map instead.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(Number(pos.coords.latitude.toFixed(6))); setLng(Number(pos.coords.longitude.toFixed(6))); setLocating(false); },
      () => { setError('Could not get your location. Tap the map to drop the pin instead.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!contact.name.trim()) { setError('Please enter your name.'); return; }
    if (!/^[6-9]\d{9}$/.test(contact.phone.replace(/[^\d]/g, '').slice(-10))) { setError('Please enter a valid 10-digit mobile number.'); return; }
    if (!form.property_type) { setError('Please choose the type of property.'); return; }
    if (!form.locality.trim()) { setError('Please enter the area / locality.'); return; }
    if (lat == null) { setError('Please drop a pin on the map so we know exactly where the property is.'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(contact).forEach(([k, v]) => fd.append(k, v));
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (by) fd.append('by', by);
      fd.append('lat', String(lat)); fd.append('lng', String(lng));
      for (const p of photos) fd.append('photos', await compressImage(p.file));

      const res = await fetch('/api/list-for-lease', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({ success: false }));
      if (!data.success) { setError(data.message || 'Something went wrong. Please try again.'); return; }
      setSentCount((n) => n + 1);
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Network problem. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const another = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setForm(blankProperty); setPhotos([]); setLat(null); setLng(null); setError(''); setDone(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputClass = 'w-full border border-stone-200 rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-orange-400 bg-white';
  const labelClass = 'text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block';
  const card = 'bg-white border border-stone-200/80 rounded-2xl shadow-[0_1px_2px_rgba(28,25,23,0.04)] p-5 sm:p-6';

  return (
    <div className="flex-1 bg-stone-50">
      <Header />

      <section className="bg-stone-900 text-white">
        <div className="max-w-2xl mx-auto px-5 pt-9 pb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-orange-300 bg-orange-400/10 border border-orange-400/30 rounded-full px-3 py-1 mb-4">
            <Building2 size={13} /> Property for lease · Hyderabad
          </div>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-tight">Have a space to lease?<br /><span className="text-orange-400">Share it with us in 2 minutes.</span></h1>
          <p className="text-stone-300 mt-3 text-[15px] leading-relaxed">Shops, warehouses, plots and buildings. We match them with quick-commerce and retail brands looking for space right now. Free for owners and brokers.</p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6 sm:py-8">
        {done ? (
          <div className={`${card} text-center`}>
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-semibold text-stone-900 mt-3">Thank you, {contact.name.split(' ')[0]}!</h2>
            <p className="text-sm text-stone-600 mt-1.5">
              {sentCount > 1 ? `${sentCount} properties received.` : 'Your property has been received.'} Our team will review it and call you on {contact.phone} if a brand is interested.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-5">
              <button onClick={another} className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-lg bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600">
                <Plus className="w-4 h-4" /> Add another property
              </button>
              <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi, I just shared a property for lease on nomore2percent.')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-stone-200 bg-white text-stone-700 font-semibold text-sm">
                WhatsApp us
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} onChange={() => setError('')} className="space-y-4" noValidate>
            {sentCount > 0 && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{sentCount} sent. Fill in the next property below.</p>}

            <div className={card}>
              <div className="text-sm font-semibold text-stone-900 mb-4">Your details</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelClass} htmlFor="name">Your name *</label><input id="name" required autoComplete="name" value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} className={inputClass} /></div>
                <div><label className={labelClass} htmlFor="phone">Mobile number *</label><input id="phone" required inputMode="tel" autoComplete="tel" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} className={inputClass} placeholder="10-digit mobile" /></div>
              </div>
              <div className="mt-4">
                <span className={labelClass}>You are</span>
                <div className="flex flex-wrap gap-2">
                  {SUBMITTER_ROLES.map((r) => (
                    <button type="button" key={r.value} onClick={() => setContact((c) => ({ ...c, role: r.value }))} className={`px-3.5 py-2 rounded-lg text-sm font-medium border ${contact.role === r.value ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200'}`}>{r.label}</button>
                  ))}
                </div>
              </div>
              {/* honeypot */}
              <input tabIndex={-1} autoComplete="off" value={contact.website} onChange={(e) => setContact((c) => ({ ...c, website: e.target.value }))} className="hidden" aria-hidden="true" name="website" />
            </div>

            <div className={card}>
              <div className="text-sm font-semibold text-stone-900 mb-4">The property</div>
              <span className={labelClass}>Type *</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {LISTING_TYPES.map((t) => (
                  <button type="button" key={t.value} onClick={() => set('property_type', t.value)} className={`px-3 py-2.5 rounded-lg text-sm font-medium border text-left ${form.property_type === t.value ? 'bg-orange-50 text-orange-700 border-orange-400' : 'bg-white text-stone-700 border-stone-200'}`}>{t.label}</button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelClass} htmlFor="locality">Area / locality *</label><input id="locality" required value={form.locality} onChange={(e) => set('locality', e.target.value)} className={inputClass} placeholder="e.g. Kondapur" /></div>
                {isLand ? (
                  <div><label className={labelClass} htmlFor="land">Plot size (sq yds)</label><input id="land" inputMode="decimal" value={form.land_sq_yds} onChange={(e) => set('land_sq_yds', e.target.value)} className={inputClass} placeholder="e.g. 800" /></div>
                ) : (
                  <div><label className={labelClass} htmlFor="sqft">Built-up area (sq ft)</label><input id="sqft" inputMode="decimal" value={form.sqft} onChange={(e) => set('sqft', e.target.value)} className={inputClass} placeholder="e.g. 3500" /></div>
                )}
                <div className="sm:col-span-2"><label className={labelClass} htmlFor="address">Address / landmark</label><input id="address" value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} placeholder="Building, road, nearby landmark" /></div>
                {!isLand && (
                  <div>
                    <label className={labelClass} htmlFor="floor">Floor</label>
                    <select id="floor" value={form.floor} onChange={(e) => set('floor', e.target.value)} className={inputClass}>
                      <option value="">Select</option>
                      {FLOORS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                )}
                <div><label className={labelClass} htmlFor="road">Road width (ft)</label><input id="road" inputMode="decimal" value={form.road_width_ft} onChange={(e) => set('road_width_ft', e.target.value)} className={inputClass} placeholder="e.g. 40" /></div>
                <div><label className={labelClass} htmlFor="frontage">Frontage (ft)</label><input id="frontage" inputMode="decimal" value={form.frontage_ft} onChange={(e) => set('frontage_ft', e.target.value)} className={inputClass} placeholder="Width facing the road" /></div>
              </div>
            </div>

            <div className={card}>
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="text-sm font-semibold text-stone-900">Exact location *</div>
                <button type="button" onClick={useMyLocation} disabled={locating} className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 border border-orange-200 bg-orange-50 rounded-lg px-2.5 py-1.5 flex-shrink-0">
                  <Crosshair className="w-3.5 h-3.5" /> {locating ? 'Locating…' : 'I’m at the property'}
                </button>
              </div>
              <p className="text-xs text-stone-500 mb-3">Tap the map to drop a pin on the property. Brands decide on location first.</p>
              <LocationPicker lat={lat} lng={lng} defaultCenter={getAreaCoordinates(form.locality)} onChange={(a, b) => { setLat(a); setLng(b); setError(''); }} />
              <p className={`text-xs mt-2 flex items-center gap-1 ${lat != null ? 'text-emerald-700' : 'text-stone-400'}`}>
                <MapPin className="w-3.5 h-3.5" /> {lat != null ? `Pin set: ${lat.toFixed(5)}, ${lng!.toFixed(5)}` : 'No pin yet'}
              </p>
            </div>

            <div className={card}>
              <div className="text-sm font-semibold text-stone-900 mb-4">Rent & availability</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelClass} htmlFor="rate">Rent per sq ft / month (₹)</label><input id="rate" inputMode="decimal" value={form.rate_per_sqft} onChange={(e) => set('rate_per_sqft', e.target.value)} className={inputClass} placeholder="e.g. 60" /></div>
                <div><label className={labelClass} htmlFor="rent">Or total rent / month (₹)</label><input id="rent" inputMode="decimal" value={form.rent_monthly} onChange={(e) => set('rent_monthly', e.target.value)} className={inputClass} placeholder="e.g. 200000" /></div>
                <div className="sm:col-span-2"><label className={labelClass} htmlFor="avail">Available from</label><input id="avail" value={form.available_from} onChange={(e) => set('available_from', e.target.value)} className={inputClass} placeholder="e.g. Immediately, January 2027" /></div>
                <div className="sm:col-span-2"><label className={labelClass} htmlFor="notes">Anything else?</label><textarea id="notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} className={inputClass + ' h-24 resize-none'} placeholder="Parking, power load, ceiling height, current tenant…" /></div>
              </div>
            </div>

            <div className={card}>
              <div className="text-sm font-semibold text-stone-900 mb-1">Photos</div>
              <p className="text-xs text-stone-500 mb-3">Front view, road and inside. Up to 6.</p>
              <div className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <div key={p.url} className="relative w-20 h-20 rounded-lg overflow-hidden bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { URL.revokeObjectURL(p.url); setPhotos((ps) => ps.filter((_, j) => j !== i)); }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center" aria-label="Remove photo"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                {photos.length < 6 && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 text-[11px] cursor-pointer hover:border-orange-300">
                    <Upload className="w-5 h-5 mb-0.5" /> Add
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
                  </label>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">{error}</p>}
            <button type="submit" disabled={saving} className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-semibold text-[15px] hover:bg-orange-600 disabled:opacity-60">
              {saving ? 'Sending…' : 'Send property'}
            </button>
            <p className="text-[11px] text-stone-400 text-center">We only use your number to contact you about this property.</p>
          </form>
        )}
      </div>
    </div>
  );
}
