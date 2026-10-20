'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { CONSTRUCTION_INTEREST, LEAD_STATUSES, formatSize } from '@/lib/land-leads';

const SiteMap = dynamic(() => import('@/components/internal/SiteMap'), {
  ssr: false,
  loading: () => <div className="h-[600px] rounded-xl bg-stone-200 animate-pulse" />,
});

export interface LandLead {
  id: number; created_at: string; owner_name: string; phone: string; relation: string;
  locality: string; address: string | null; lat: number | null; lng: number | null;
  size_sq_yds: number; road_width_ft: number | null; land_type: string | null; title_status: string | null;
  expected_rent_monthly: number | null; status: string; form_language: string; construction_interest: string | null;
  utm_source: string | null; utm_campaign: string | null; utm_content: string | null;
  nearest_requirement_m: number | null; converted_property_id: number | null;
  team_members: { id: number; name: string } | null;
  site_requirements: { id: number; title: string; radius_max_m: number } | null;
  photo_count: number; cover_url: string | null;
}

const badge = (s: string) => LEAD_STATUSES.find((x) => x.value === s)?.badge || '';
const statusLabel = (s: string) => LEAD_STATUSES.find((x) => x.value === s)?.label || s;

export function nearBadge(l: Pick<LandLead, 'nearest_requirement_m' | 'site_requirements'>) {
  if (l.nearest_requirement_m == null || !l.site_requirements) return null;
  const inRadius = l.nearest_requirement_m <= l.site_requirements.radius_max_m;
  const km = l.nearest_requirement_m >= 1000 ? `${(l.nearest_requirement_m / 1000).toFixed(1)} km` : `${l.nearest_requirement_m} m`;
  return { inRadius, text: `${km} from ${l.site_requirements.title}` };
}

type Sort = 'newest' | 'largest' | 'nearest';

export default function LandLeadsClient({ myId }: { myId: number }) {
  const [leads, setLeads] = useState<LandLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<string>('open');
  const [mine, setMine] = useState(false);
  const [buildersOnly, setBuildersOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('newest');
  const [q, setQ] = useState('');
  const [view, setView] = useState<'list' | 'map'>('list');

  useEffect(() => {
    fetch('/api/internal/land-leads').then((r) => r.json())
      .then((d) => { if (d.success) setLeads(d.leads); else setError(d.message); })
      .catch(() => setError('Could not load leads.'))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { open: 0, all: leads.length };
    leads.forEach((l) => { c[l.status] = (c[l.status] || 0) + 1; if (!['signed', 'rejected'].includes(l.status)) c.open++; });
    return c;
  }, [leads]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = leads.filter((l) =>
      (status === 'all' || (status === 'open' ? !['signed', 'rejected'].includes(l.status) : l.status === status))
      && (!mine || l.team_members?.id === myId)
      && (!buildersOnly || l.construction_interest === 'yes' || l.construction_interest === 'maybe')
      && (!term || [l.owner_name, l.phone, l.locality, l.address].some((v) => v?.toLowerCase().includes(term))));
    return [...list].sort((a, b) =>
      sort === 'largest' ? b.size_sq_yds - a.size_sq_yds
      : sort === 'nearest' ? (a.nearest_requirement_m ?? Infinity) - (b.nearest_requirement_m ?? Infinity)
      : +new Date(b.created_at) - +new Date(a.created_at));
  }, [leads, status, mine, buildersOnly, sort, q, myId]);

  const totalSqYds = filtered.reduce((s, l) => s + Number(l.size_sq_yds), 0);
  const inRadius = filtered.filter((l) => nearBadge(l)?.inRadius).length;

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${active ? 'bg-orange-500 text-white border-orange-500' : 'border-stone-200 text-stone-500 bg-white hover:border-stone-300'}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Land Leads</h1>
          <p className="text-sm text-stone-500 mt-1">Landowners (500+ sq yds) to match with quick-commerce brands · <a href="/lease-your-land" target="_blank" className="text-orange-500 hover:underline">public form ↗</a></p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('list')} className={chip(view === 'list')}>List</button>
          <button onClick={() => setView('map')} className={chip(view === 'map')}>Map</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-stone-200 rounded-xl p-4"><div className="text-xs text-stone-500">Leads shown</div><div className="font-serif text-2xl font-bold text-stone-900">{filtered.length}</div></div>
        <div className="bg-white border border-stone-200 rounded-xl p-4"><div className="text-xs text-stone-500">Total land</div><div className="font-serif text-2xl font-bold text-stone-900">{formatSize(totalSqYds)}</div></div>
        <div className="bg-white border border-stone-200 rounded-xl p-4"><div className="text-xs text-stone-500">Inside a requirement radius</div><div className="font-serif text-2xl font-bold text-emerald-600">{inRadius}</div></div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 [scrollbar-width:none]">
        <button onClick={() => setStatus('open')} className={chip(status === 'open')}>Open ({counts.open || 0})</button>
        {LEAD_STATUSES.map((s) => (
          <button key={s.value} onClick={() => setStatus(s.value)} className={chip(status === s.value)}>{s.label} ({counts[s.value] || 0})</button>
        ))}
        <button onClick={() => setStatus('all')} className={chip(status === 'all')}>All ({counts.all})</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, area…" className="flex-1 min-w-[12rem] border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white" />
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="newest">Newest first</option>
          <option value="largest">Largest first</option>
          <option value="nearest">Closest to a requirement</option>
        </select>
        <button onClick={() => setBuildersOnly((b) => !b)} className={chip(buildersOnly)}>Open to building</button>
        <button onClick={() => setMine((m) => !m)} className={chip(mine)}>Assigned to me</button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}{error.includes('land_leads') ? ' (run land-leads-schema.sql in the internal Supabase project)' : ''}</p>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-28 bg-stone-200 rounded-xl animate-pulse" />)}</div>
      ) : view === 'map' ? (
        <SiteMap
          height="600px"
          properties={filtered.filter((l) => l.lat != null && l.lng != null).map((l) => ({
            id: l.id, title: `${l.owner_name} · ${formatSize(Number(l.size_sq_yds))}`, lat: l.lat!, lng: l.lng!,
            area: l.locality, deal_type: 'lease', status: l.status,
            lease_rate_label: l.expected_rent_monthly ? `₹${Number(l.expected_rent_monthly).toLocaleString('en-IN')}/mo ask` : null,
          }))}
          propertyHref={(id) => `/internal/land-leads/${id}`}
        />
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-xl p-10 text-center text-sm text-stone-500">
          No leads here yet. Share <span className="font-mono text-stone-700">nomore2percent.com/lease-your-land</span> in your ads.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => {
            const near = nearBadge(l);
            return (
              <Link key={l.id} href={`/internal/land-leads/${l.id}`} className="flex gap-4 bg-white border border-stone-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
                <div className="w-20 h-20 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-[10px] text-stone-400">
                  {l.cover_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={l.cover_url} alt="" className="w-full h-full object-cover" />
                    : 'No photo'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-stone-900">{formatSize(Number(l.size_sq_yds))} · {l.locality}</span>
                    <span className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${badge(l.status)}`}>{statusLabel(l.status)}</span>
                    {l.construction_interest && CONSTRUCTION_INTEREST[l.construction_interest] && <span className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${CONSTRUCTION_INTEREST[l.construction_interest].badge}`}>{CONSTRUCTION_INTEREST[l.construction_interest].label}</span>}
                    {l.converted_property_id && <span className="text-[11px] font-semibold border rounded-full px-2 py-0.5 bg-stone-900 text-white border-stone-900">In Properties</span>}
                  </div>
                  <div className="text-sm text-stone-600 mt-0.5 truncate">{l.owner_name} ({l.relation}) · {l.phone}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500 mt-1.5">
                    {l.road_width_ft && <span>{l.road_width_ft} ft road</span>}
                    {l.expected_rent_monthly && <span>Asks ₹{Number(l.expected_rent_monthly).toLocaleString('en-IN')}/mo</span>}
                    {near && <span className={near.inRadius ? 'text-emerald-600 font-semibold' : ''}>{near.inRadius ? '● ' : ''}{near.text}</span>}
                    {l.lat == null && <span className="text-amber-600">No map pin</span>}
                    <span>{l.team_members ? `→ ${l.team_members.name}` : 'Unassigned'}</span>
                    <span>{new Date(l.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{l.utm_source ? ` · via ${l.utm_source}` : ''}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
