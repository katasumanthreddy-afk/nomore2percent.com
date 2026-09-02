'use client';

import { useEffect, useState } from 'react';

interface Requirement {
  id: number; title: string; lat: number; lng: number;
  radius_min_m: number; radius_max_m: number; status: string; notes: string | null;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  searching: { label: 'Still Searching', className: 'bg-orange-50 text-orange-600 border-orange-200' },
  found: { label: 'Found — No Longer Needed', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  closed: { label: 'Closed', className: 'bg-stone-100 text-stone-500 border-stone-200' },
};

export default function ScoutViewPage({ params }: { params: Promise<{ token: string }> }) {
  const [scoutName, setScoutName] = useState('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then(({ token }) => {
      fetch(`/api/scout-view/${token}`)
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
        <p className="text-stone-500 text-sm mb-6">Here are the locations we need help finding a property near. Tap any one to open it directly in Google Maps.</p>

        {requirements.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 rounded-xl p-14 text-center text-sm text-stone-400">
            Nothing assigned to you right now.
          </div>
        ) : (
          <div className="space-y-3">
            {requirements.map((r) => (
              <a
                key={r.id}
                href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white border border-stone-200 rounded-xl p-4 hover:border-orange-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="font-semibold text-stone-800">{r.title}</div>
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_LABEL[r.status]?.className || ''}`}>
                    {STATUS_LABEL[r.status]?.label || r.status}
                  </span>
                </div>
                <div className="text-xs text-stone-500 mb-1">Looking within {r.radius_min_m}m – {r.radius_max_m}m of this point</div>
                {r.notes && <div className="text-xs text-stone-500 italic mt-1">{r.notes}</div>}
                <div className="text-xs text-orange-500 font-semibold mt-2">Open in Google Maps →</div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
