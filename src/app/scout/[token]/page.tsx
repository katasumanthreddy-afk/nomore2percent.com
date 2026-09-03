'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/admin/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-56 rounded-lg bg-stone-100 animate-pulse" />,
});

interface Requirement {
  id: number; title: string; lat: number; lng: number;
  radius_min_m: number; radius_max_m: number; status: string; notes: string | null;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  searching: { label: 'Still Searching', className: 'bg-orange-50 text-orange-600 border-orange-200' },
  found: { label: 'Found — No Longer Needed', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  closed: { label: 'Closed', className: 'bg-stone-100 text-stone-500 border-stone-200' },
};

function SubmitForm({ token, requirement, onDone }: { token: string; requirement: Requirement; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [pricePerSqft, setPricePerSqft] = useState('');
  const [notes, setNotes] = useState('');
  const [lat, setLat] = useState<number | null>(requirement.lat);
  const [lng, setLng] = useState<number | null>(requirement.lng);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError('');
    if (!title.trim()) { setError('Give this property a short title.'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('requirement_id', String(requirement.id));
      fd.append('title', title);
      fd.append('address', address);
      fd.append('price_per_sqft', pricePerSqft);
      fd.append('notes', notes);
      if (lat != null) fd.append('lat', String(lat));
      if (lng != null) fd.append('lng', String(lng));
      photos.forEach((f) => fd.append('photos', f));

      const res = await fetch(`/api/scout-view/${token}/submit`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Something went wrong.'); return; }
      setDone(true);
      setTimeout(onDone, 1500);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400";

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mt-2 text-center">
        <div className="text-2xl mb-1">✓</div>
        <p className="text-sm text-emerald-700 font-semibold">Submitted — thank you!</p>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mt-2 space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Property title (e.g. 'Vacant plot near main road')" className={inputClass} />
      <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address or landmark" className={inputClass} />
      <div>
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1 block">Lease Rate (₹ per sq.ft / month)</label>
        <input value={pricePerSqft} onChange={(e) => setPricePerSqft(e.target.value)} type="number" step="0.5" placeholder="e.g. 65" className={inputClass} />
      </div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else worth knowing" className={inputClass + ' h-20 resize-none'} />

      <div>
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Pin the Exact Location</div>
        <LocationPicker lat={lat} lng={lng} defaultCenter={[requirement.lat, requirement.lng]} onChange={(la, ln) => { setLat(la); setLng(ln); }} />
      </div>

      <div>
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Photos</div>
        <input type="file" multiple accept="image/*" onChange={(e) => setPhotos(Array.from(e.target.files || []))} className="text-xs" />
        {photos.length > 0 && <p className="text-xs text-stone-500 mt-1">{photos.length} photo{photos.length > 1 ? 's' : ''} selected</p>}
      </div>

      {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}

      <button onClick={submit} disabled={submitting} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-bold transition-colors">
        {submitting ? 'Submitting...' : 'Submit This Property'}
      </button>
    </div>
  );
}

export default function ScoutViewPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('');
  const [scoutName, setScoutName] = useState('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openFormId, setOpenFormId] = useState<number | null>(null);

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      fetch(`/api/scout-view/${t}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) { setScoutName(d.scoutName); setRequirements(d.requirements); }
          else setError(d.message || 'Link not found.');
        })
        .finally(() => setLoading(false));
    });
  }, [params]);

  if (loading) {
    return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="text-stone-400 text-sm">Loading...</div></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6 text-center">
        <div>
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="font-serif text-xl font-bold text-stone-900 mb-2">Link Not Valid</h1>
          <p className="text-stone-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-stone-950 px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-serif font-bold text-sm">N2</div>
          <span className="text-white font-serif font-bold text-sm">nomore2percent</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Hi {scoutName}</h1>
        <p className="text-stone-500 text-sm mb-6">Here are the locations we need help finding a property near. Found something? Submit it directly with photos and price — no account needed.</p>

        {requirements.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 rounded-xl p-14 text-center text-sm text-stone-400">
            Nothing assigned to you right now.
          </div>
        ) : (
          <div className="space-y-3">
            {requirements.map((r) => (
              <div key={r.id} className="bg-white border border-stone-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="font-semibold text-stone-800">{r.title}</div>
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_LABEL[r.status]?.className || ''}`}>
                    {STATUS_LABEL[r.status]?.label || r.status}
                  </span>
                </div>
                <div className="text-xs text-stone-500 mb-1">Looking within {r.radius_min_m}m – {r.radius_max_m}m of this point</div>
                {r.notes && <div className="text-xs text-stone-500 italic mt-1">{r.notes}</div>}

                <div className="flex gap-3 mt-2">
                  <a href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 font-semibold">
                    Open in Google Maps →
                  </a>
                  <button onClick={() => setOpenFormId(openFormId === r.id ? null : r.id)} className="text-xs text-stone-700 font-semibold underline">
                    {openFormId === r.id ? 'Cancel' : 'Found Something? Submit It →'}
                  </button>
                </div>

                {openFormId === r.id && <SubmitForm token={token} requirement={r} onDone={() => setOpenFormId(null)} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
