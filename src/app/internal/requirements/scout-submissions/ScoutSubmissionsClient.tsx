'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Submission {
  id: number; title: string | null; address: string | null; price_label: string | null;
  notes: string | null; lat: number | null; lng: number | null; status: string; created_at: string;
  external_scouts: { id: number; name: string; phone: string | null } | null;
  site_requirements: { id: number; title: string } | null;
  images: { id: number; url: string | null }[];
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

export default function ScoutSubmissionsClient() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    fetch('/api/internal/scout-submissions').then((r) => r.json()).then((d) => { if (d.success) setSubmissions(d.submissions); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = filter === 'pending' ? submissions.filter((s) => s.status === 'pending') : submissions;

  const approve = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/internal/scout-submissions/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) alert(data.message);
      load();
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: number) => {
    setBusyId(id);
    try {
      await fetch(`/api/internal/scout-submissions/${id}/reject`, { method: 'POST' });
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link href="/internal/requirements" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Site Requirements</Link>
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">Scout Submissions</h1>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setFilter('pending')} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filter === 'pending' ? 'bg-orange-500 text-white border-orange-500' : 'border-stone-200 text-stone-500'}`}>
          Pending ({submissions.filter((s) => s.status === 'pending').length})
        </button>
        <button onClick={() => setFilter('all')} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filter === 'all' ? 'bg-orange-500 text-white border-orange-500' : 'border-stone-200 text-stone-500'}`}>
          All ({submissions.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-40 bg-stone-200 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white border border-stone-200 rounded-xl p-4">
              {s.images.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto">
                  {s.images.map((img) => img.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={img.id} src={img.url} alt="" className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                  ))}
                </div>
              )}
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="font-semibold text-stone-800">{s.title}</div>
                <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_BADGE[s.status]}`}>{s.status}</span>
              </div>
              <div className="text-xs text-stone-500 mb-1">
                From {s.external_scouts?.name || 'Unknown scout'} {s.external_scouts?.phone && `· ${s.external_scouts.phone}`}
                {s.site_requirements && <> · For: {s.site_requirements.title}</>}
              </div>
              {s.address && <div className="text-xs text-stone-600 mb-1">📍 {s.address}</div>}
              {s.price_label && <div className="text-sm font-bold text-orange-500 mb-1">{s.price_label}</div>}
              {s.notes && <div className="text-xs text-stone-500 italic mb-2">{s.notes}</div>}
              {s.lat != null && s.lng != null && (
                <a href={`https://www.google.com/maps?q=${s.lat},${s.lng}`} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 hover:underline">
                  View pinned location →
                </a>
              )}

              {s.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => approve(s.id)} disabled={busyId === s.id} className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-1.5 font-semibold disabled:opacity-50">
                    Approve → Create Property
                  </button>
                  <button onClick={() => reject(s.id)} disabled={busyId === s.id} className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg px-4 py-1.5 font-semibold disabled:opacity-50">
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-stone-300 rounded-xl p-14 text-center text-sm text-stone-400">Nothing here yet.</div>
      )}
    </div>
  );
}
