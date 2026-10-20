'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NotesTimeline from '@/components/internal/NotesTimeline';
import { LAND_TYPES, LEAD_STATUSES, formatSize } from '@/lib/land-leads';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Props {
  lead: any;
  photos: { id: number; url: string | null }[];
  team: { id: number; name: string }[];
  nearby: { id: number; title: string; status: string; distance_m: number; radius_max_m: number }[];
}

const TITLE: Record<string, string> = { clear: 'Clear, documents ready', in_progress: 'Some work pending', not_sure: 'Not sure' };

export default function LandLeadDetailClient({ lead: initial, photos, team, nearby }: Props) {
  const router = useRouter();
  const [lead, setLead] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [notesKey, setNotesKey] = useState(0);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/internal/land-leads/${lead.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) { alert(data.message); return; }
      if (data.lead) { setLead(data.lead); setNotesKey((k) => k + 1); }
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = (status: string) => {
    if (status === 'rejected') {
      const reason = prompt('Reason for rejecting? (e.g. too far, narrow road, title issue)') ?? null;
      if (reason === null) return;
      patch({ status, rejection_reason: reason });
    } else {
      patch({ status });
    }
  };

  const convert = async () => {
    if (!confirm('Add this land to Properties? It will show on the map and in requirement matching.')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/internal/land-leads/${lead.id}/convert`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) { alert(data.message); return; }
      router.push(`/internal/properties/${data.propertyId}`);
    } finally {
      setBusy(false);
    }
  };

  const waText = encodeURIComponent(`Namaste ${lead.owner_name} garu, this is from nomore2percent about your ${formatSize(Number(lead.size_sq_yds))} land in ${lead.locality} for long-term lease. Is this a good time to talk?`);
  const mapsUrl = lead.lat != null ? `https://www.google.com/maps/search/?api=1&query=${lead.lat},${lead.lng}` : null;

  const row = (label: string, value: React.ReactNode) => value ? (
    <div className="flex justify-between gap-4 py-2 border-b border-stone-100 last:border-0 text-sm">
      <span className="text-stone-500">{label}</span><span className="text-stone-900 text-right">{value}</span>
    </div>
  ) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/internal/land-leads" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Land Leads</Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">{formatSize(Number(lead.size_sq_yds))} · {lead.locality}</h1>
          <p className="text-sm text-stone-500 mt-1">
            Lead #{lead.id} · {new Date(lead.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            {lead.utm_source && ` · via ${lead.utm_source}${lead.utm_content ? ` / ${lead.utm_content}` : ''}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:+91${lead.phone}`} className="px-3.5 py-2 rounded-lg bg-stone-900 text-white text-sm font-semibold">Call</a>
          <a href={`https://wa.me/91${lead.phone}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">WhatsApp</a>
          {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 rounded-lg border border-stone-300 text-stone-700 text-sm font-semibold bg-white">Open in Maps</a>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {photos.map((p) => p.url && (
                <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-40 w-56 object-cover rounded-xl" />
                </a>
              ))}
            </div>
          )}

          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-sm font-bold text-stone-800 mb-2">Land</div>
            {row('Size', `${Number(lead.size_value).toLocaleString('en-IN')} ${lead.size_unit.replace('_', ' ')} (${Math.round(Number(lead.size_sq_yds)).toLocaleString('en-IN')} sq yds)`)}
            {row('Locality', lead.locality)}
            {row('Landmark / survey no.', lead.address)}
            {row('Road width', lead.road_width_ft ? `${lead.road_width_ft} ft` : null)}
            {row('Land type', LAND_TYPES.find((t) => t.value === lead.land_type)?.en)}
            {row('Title', TITLE[lead.title_status])}
            {row('Current use', lead.current_use)}
            {row('Expected rent', lead.expected_rent_monthly ? `₹${Number(lead.expected_rent_monthly).toLocaleString('en-IN')}/month` : null)}
            {row('Preferred lease', lead.lease_years_preferred ? `${lead.lease_years_preferred}+ years` : null)}
            {row('Map pin', lead.lat != null ? `${Number(lead.lat).toFixed(5)}, ${Number(lead.lng).toFixed(5)}` : <span className="text-amber-600">Not set; ask the owner for a location pin</span>)}
            {lead.notes && <div className="mt-3 text-sm text-stone-700 bg-stone-50 rounded-lg p-3 whitespace-pre-wrap">{lead.notes}</div>}
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-sm font-bold text-stone-800 mb-2">Owner</div>
            {row('Name', lead.owner_name)}
            {row('Phone', lead.phone)}
            {row('Relation', lead.relation)}
            {row('Form language', lead.form_language === 'te' ? 'Telugu' : 'English')}
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-sm font-bold text-stone-800 mb-3">Activity</div>
            <NotesTimeline key={notesKey} landLeadId={lead.id} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Status</label>
              <div className="grid grid-cols-2 gap-1.5">
                {LEAD_STATUSES.map((s) => (
                  <button key={s.value} disabled={busy} onClick={() => changeStatus(s.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${lead.status === s.value ? s.badge + ' ring-2 ring-offset-1 ring-orange-300' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              {lead.status === 'rejected' && lead.rejection_reason && <p className="text-xs text-stone-500 mt-2">Reason: {lead.rejection_reason}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Assigned to</label>
              <select disabled={busy} value={lead.assigned_to ?? ''} onChange={(e) => patch({ assigned_to: e.target.value || null })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Unassigned</option>
                {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            {lead.converted_property_id ? (
              <Link href={`/internal/properties/${lead.converted_property_id}`} className="block text-center w-full py-2.5 rounded-lg bg-stone-900 text-white text-sm font-semibold">View in Properties →</Link>
            ) : (
              <button disabled={busy} onClick={convert} className="w-full py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60">Add to Properties</button>
            )}
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-sm font-bold text-stone-800 mb-3">Site requirements within 3 km</div>
            {lead.lat == null ? (
              <p className="text-xs text-stone-500">Needs a map pin to match.</p>
            ) : nearby.length === 0 ? (
              <p className="text-xs text-stone-500">None nearby.</p>
            ) : (
              <ul className="space-y-2">
                {nearby.map((r) => {
                  const inside = r.distance_m <= r.radius_max_m;
                  return (
                    <li key={r.id}>
                      <Link href={`/internal/requirements/${r.id}`} className="flex justify-between gap-3 text-sm hover:text-orange-600">
                        <span className="truncate">{inside && <span className="text-emerald-600">● </span>}{r.title}</span>
                        <span className={`flex-shrink-0 text-xs ${inside ? 'text-emerald-600 font-semibold' : 'text-stone-400'}`}>
                          {r.distance_m >= 1000 ? `${(r.distance_m / 1000).toFixed(1)} km` : `${r.distance_m} m`}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
