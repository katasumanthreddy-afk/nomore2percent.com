'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  APIProvider, AdvancedMarker, Circle, Map, useMap, useMapsLibrary,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { MarkerClusterer, type Renderer } from '@googlemaps/markerclusterer';
import {
  AlertTriangle, ArrowUpRight, Building2, Crosshair, Layers, LandPlot, Loader2, MapPin, Plus,
  Satellite, Search, Target, Trash2, X, Briefcase,
} from 'lucide-react';
import PinActions from './PinActions';
import { formatSize } from '@/lib/land-leads';
import { stageLabel } from '@/lib/brands-projects';
import {
  coordText, formatDistance, isGap, metersBetween, nearestWithin, parseLatLngQuery, searchRecords,
  type LatLng, type LayerKey, type MapData, type MapLead, type MapProject, type MapProperty, type MapSite, type SearchHit,
} from '@/lib/map-workspace';

const HYD = { lat: 17.4, lng: 78.45 };

const LAYER: Record<LayerKey, { label: string; color: string; icon: typeof MapPin }> = {
  sites: { label: 'Site requirements', color: '#f97316', icon: Target },
  leads: { label: 'Land leads', color: '#7c3aed', icon: LandPlot },
  properties: { label: 'Properties', color: '#0284c7', icon: Building2 },
  projects: { label: 'Projects', color: '#1c1917', icon: Briefcase },
};
const GAP_COLOR = '#dc2626';
const SITE_STATUS_COLOR: Record<string, string> = { searching: '#f97316', found: '#059669', closed: '#a8a29e' };

type Selected = { kind: LayerKey; id: number } | null;
type Focus = { lat: number; lng: number; zoom?: number; n: number } | null;

/* ────────────────────────── markers ────────────────────────── */

function clusterRenderer(color: string): Renderer {
  return {
    render: ({ count, position }) => {
      const el = document.createElement('div');
      const size = count < 10 ? 30 : count < 50 ? 36 : 44;
      el.style.cssText = `width:${size}px;height:${size}px;border-radius:9999px;background:${color};color:#fff;`
        + 'display:flex;align-items:center;justify-content:center;font:600 12px/1 system-ui,sans-serif;'
        + `box-shadow:0 0 0 4px ${color}33,0 1px 3px rgba(0,0,0,.3);border:2px solid #fff;`;
      el.textContent = String(count);
      return new google.maps.marker.AdvancedMarkerElement({ position, content: el, zIndex: 1000 + count });
    },
  };
}

/** One layer of pins, optionally clustered. Remounted (via key) when
 *  clustering is switched so markers re-attach to the map cleanly. */
function MarkerLayer<T extends LatLng & { id: number }>({ items, color, cluster, render, onPick }: {
  items: T[]; color: string; cluster: boolean;
  render: (item: T) => React.ReactNode; onPick: (item: T) => void;
}) {
  const map = useMap();
  const [markers, setMarkers] = useState<Record<number, google.maps.marker.AdvancedMarkerElement>>({});
  const clusterer = useMemo(() => (map && cluster ? new MarkerClusterer({ map, renderer: clusterRenderer(color) }) : null), [map, cluster, color]);

  useEffect(() => () => { clusterer?.clearMarkers(); clusterer?.setMap(null); }, [clusterer]);
  useEffect(() => {
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));
  }, [clusterer, markers]);

  const register = useCallback((id: number, m: google.maps.marker.AdvancedMarkerElement | null) => {
    setMarkers((prev) => {
      if ((m && prev[id] === m) || (!m && !prev[id])) return prev;
      if (m) return { ...prev, [id]: m };
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return (
    <>
      {items.map((it) => (
        <Pin key={it.id} id={it.id} position={{ lat: it.lat, lng: it.lng }} register={cluster ? register : undefined} onClick={() => onPick(it)}>
          {render(it)}
        </Pin>
      ))}
    </>
  );
}

/** A marker whose ref callback is stable for its lifetime. A fresh inline
 *  callback each render makes React detach/re-attach every marker, which
 *  re-feeds the clusterer and loops forever. */
function Pin({ id, position, register, onClick, children }: {
  id: number; position: LatLng; onClick: () => void; children: React.ReactNode;
  register?: (id: number, m: google.maps.marker.AdvancedMarkerElement | null) => void;
}) {
  const ref = useCallback((m: google.maps.marker.AdvancedMarkerElement | null) => register?.(id, m), [register, id]);
  return <AdvancedMarker position={position} ref={register ? ref : undefined} onClick={onClick}>{children}</AdvancedMarker>;
}

function Dot({ color, size = 12, shape = 'circle', ring, selected }: { color: string; size?: number; shape?: 'circle' | 'square' | 'diamond'; ring?: string; selected?: boolean }) {
  const s = selected ? size + 6 : size;
  return (
    <div
      style={{
        width: s, height: s, background: color,
        borderRadius: shape === 'circle' ? 9999 : 3,
        transform: shape === 'diamond' ? 'rotate(45deg)' : undefined,
        boxShadow: `${ring ? `0 0 0 3px ${ring}55, ` : ''}0 1px 3px rgba(0,0,0,.35)`,
      }}
      className="border-2 border-white transition-all"
    />
  );
}

/** Pans/zooms when `focus` changes (search hits, list clicks). */
function CameraController({ focus }: { focus: Focus }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !focus) return;
    map.panTo({ lat: focus.lat, lng: focus.lng });
    if (focus.zoom) map.setZoom(focus.zoom);
  }, [map, focus]);
  return null;
}

/** Deep link (?site=12 etc.): fly to that pin once the data arrives. */
function DeepLinkCamera({ data, target }: { data: MapData | null; target: { kind: LayerKey; id: number } }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!map || !data || done.current) return;
    done.current = true;
    const it = (data[target.kind] as (LatLng & { id: number })[]).find((x) => x.id === target.id);
    if (it) { map.setCenter(it); map.setZoom(15); }
  }, [map, data, target]);
  return null;
}

/** Fits the first load to everything on the map. */
function FitOnce({ points }: { points: LatLng[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!map || done.current || points.length === 0) return;
    done.current = true;
    if (points.length === 1) { map.setCenter(points[0]); map.setZoom(14); return; }
    const b = new google.maps.LatLngBounds();
    points.forEach((p) => b.extend(p));
    map.fitBounds(b, 48);
  }, [map, points]);
  return null;
}

/* ────────────────────────── search ────────────────────────── */

function SearchBox({ data, onHit, onPlace }: {
  data: MapData;
  onHit: (h: SearchHit) => void;
  onPlace: (p: LatLng, label: string) => void;
}) {
  const geocoding = useMapsLibrary('geocoding');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const hits = useMemo(() => searchRecords(data, q), [data, q]);
  const coords = useMemo(() => parseLatLngQuery(q), [q]);

  const geocode = async () => {
    const term = q.trim();
    if (!term) return;
    if (coords) { onPlace(coords, coordText(coords)); setOpen(false); return; }
    if (!geocoding) { setMsg('Search is still loading…'); return; }
    setBusy(true); setMsg('');
    try {
      const res = await new geocoding.Geocoder().geocode({
        address: term,
        componentRestrictions: { country: 'IN' },
        bounds: { north: 17.75, south: 17.15, east: 78.8, west: 78.1 },
      });
      const r = res.results[0];
      if (!r) { setMsg('No place found.'); return; }
      const loc = r.geometry.location;
      onPlace({ lat: loc.lat(), lng: loc.lng() }, r.formatted_address.split(',').slice(0, 2).join(','));
      setOpen(false);
    } catch (e) {
      const code = (e as { code?: string })?.code || String(e);
      setMsg(code.includes('REQUEST_DENIED')
        ? 'Place search needs the Geocoding API enabled on the Maps key. Our own records and pasted coordinates still work.'
        : 'No place found.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative w-full sm:w-80">
      <div className="flex items-center gap-2 bg-white rounded-lg shadow-md border border-stone-200 px-3 h-10">
        <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setMsg(''); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); if (hits[0] && !coords) { onHit(hits[0]); setOpen(false); } else geocode(); }
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Locality, site, owner or lat,lng"
          className="flex-1 min-w-0 text-sm outline-none bg-transparent"
          aria-label="Search the map"
        />
        {busy ? <Loader2 className="w-4 h-4 animate-spin text-stone-400" /> : q && (
          <button onClick={() => { setQ(''); setMsg(''); }} aria-label="Clear search"><X className="w-4 h-4 text-stone-400" /></button>
        )}
      </div>
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-stone-200 overflow-hidden z-30">
          {coords && (
            <button onClick={() => { onPlace(coords, coordText(coords)); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center gap-2 text-sm">
              <Crosshair className="w-4 h-4 text-stone-500" /> Go to {coordText(coords)}
            </button>
          )}
          {hits.map((h) => {
            const L = LAYER[h.kind];
            return (
              <button key={`${h.kind}-${h.id}`} onClick={() => { onHit(h); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center gap-2">
                <L.icon className="w-4 h-4 flex-shrink-0" style={{ color: L.color }} />
                <span className="min-w-0">
                  <span className="block text-sm text-stone-900 truncate">{h.label}</span>
                  <span className="block text-[11px] text-stone-500 truncate">{h.sub}</span>
                </span>
              </button>
            );
          })}
          {!coords && (
            <button onClick={geocode} className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center gap-2 text-sm border-t border-stone-100 text-stone-700">
              <MapPin className="w-4 h-4 text-stone-500" /> Find “{q.trim()}” on Google Maps
            </button>
          )}
          {msg && <p className="px-3 py-2 text-xs text-amber-700 bg-amber-50 border-t border-amber-100">{msg}</p>}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── cards ────────────────────────── */

function CardShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute z-20 left-2 right-2 bottom-2 sm:left-3 sm:right-auto sm:bottom-3 sm:w-80 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden">
      <button onClick={onClose} className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-stone-100 flex items-center justify-center" aria-label="Close">
        <X className="w-4 h-4 text-stone-500" />
      </button>
      {children}
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 bg-stone-100 text-stone-600" style={color ? { background: `${color}14`, color } : undefined}>{children}</span>;
}

function SiteCard({ site, data, onPick, onDeleted }: { site: MapSite; data: MapData; onPick: (s: Selected, p: LatLng) => void; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState('');
  const remove = async () => {
    setDeleting(true); setDelError('');
    try {
      const d = await fetch(`/api/internal/requirements/${site.id}`, { method: 'DELETE' }).then((r) => r.json());
      if (d.success) onDeleted(); else setDelError(d.message || 'Could not delete.');
    } catch {
      setDelError('Could not delete. Check your connection.');
    } finally {
      setDeleting(false);
    }
  };
  const near = useMemo(() => [
    ...nearestWithin(site, site.radius_max_m, data.leads).map((x) => ({ kind: 'leads' as const, id: x.item.id, label: `${formatSize(x.item.size_sq_yds)} · ${x.item.locality}`, d: x.distance, p: x.item })),
    ...nearestWithin(site, site.radius_max_m, data.properties).map((x) => ({ kind: 'properties' as const, id: x.item.id, label: x.item.title, d: x.distance, p: x.item })),
  ].sort((a, b) => a.d - b.d), [site, data]);
  const gap = isGap(site);
  return (
    <div className="p-4">
      <div className="flex flex-wrap gap-1.5 mb-1.5 pr-8">
        <Tag color={SITE_STATUS_COLOR[site.status]}>{site.status}</Tag>
        {site.brand_name && <Tag>{site.brand_name}</Tag>}
        {site.priority === 'high' && <Tag color={GAP_COLOR}>High priority</Tag>}
      </div>
      <div className="font-semibold text-stone-900 leading-snug">{site.title}</div>
      <div className="text-xs text-stone-500 mt-0.5">Radius {formatDistance(site.radius_max_m)} · {site.nearby_leads} land lead{site.nearby_leads === 1 ? '' : 's'} · {site.nearby_properties} propert{site.nearby_properties === 1 ? 'y' : 'ies'}</div>
      {gap && (
        <div className="mt-2 flex gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Nothing inside this radius yet. Send it to a scout or target ads here.
        </div>
      )}
      {near.length > 0 && (
        <ul className="mt-2 max-h-36 overflow-y-auto divide-y divide-stone-100 border border-stone-100 rounded-lg">
          {near.slice(0, 8).map((n) => (
            <li key={`${n.kind}-${n.id}`}>
              <button onClick={() => onPick({ kind: n.kind, id: n.id }, n.p)} className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 hover:bg-stone-50">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: LAYER[n.kind].color }} />
                <span className="text-xs text-stone-800 truncate flex-1">{n.label}</span>
                <span className="text-[11px] font-semibold text-stone-500">{formatDistance(n.d)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-1.5 mt-3">
        <Link href={`/internal/requirements/${site.id}`} className="inline-flex items-center gap-1 rounded-md bg-orange-500 hover:bg-orange-600 px-2.5 py-1 text-[11px] font-semibold text-white">Open <ArrowUpRight className="w-3 h-3" /></Link>
        <PinActions nowrap point={site} label={`Site: ${site.title}${site.brand_name ? ` (${site.brand_name})` : ''}`} />
      </div>
      {!confirming && (
        <button onClick={() => setConfirming(true)} className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-red-600" aria-label="Delete site">
          <Trash2 className="w-3.5 h-3.5" /> Delete site
        </button>
      )}
      {confirming && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2.5">
          <p className="text-xs text-red-800">Delete <span className="font-semibold">{site.title}</span>? Its scout assignments go too. Linked projects and land leads are kept.</p>
          {delError && <p className="text-xs text-red-700 mt-1 font-semibold">{delError}</p>}
          <div className="flex gap-2 mt-2">
            <button onClick={remove} disabled={deleting} className="rounded-md bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold px-3 py-1.5 disabled:opacity-60">{deleting ? 'Deleting…' : 'Delete site'}</button>
            <button onClick={() => { setConfirming(false); setDelError(''); }} className="rounded-md border border-stone-200 bg-white text-[11px] font-semibold px-3 py-1.5 text-stone-600">Keep</button>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadCard({ lead }: { lead: MapLead }) {
  return (
    <div className="p-4">
      <div className="flex gap-1.5 mb-1.5 pr-8"><Tag color={LAYER.leads.color}>Land lead</Tag><Tag>{lead.status.replace('_', ' ')}</Tag></div>
      <div className="font-semibold text-stone-900">{formatSize(lead.size_sq_yds)} · {lead.locality}</div>
      <div className="text-xs text-stone-500 mt-0.5">{lead.owner_name}{lead.construction_interest === 'yes' ? ' · open to building' : ''}</div>
      <div className="flex items-center gap-1.5 mt-3">
        <Link href={`/internal/land-leads/${lead.id}`} className="inline-flex items-center gap-1 rounded-md bg-orange-500 hover:bg-orange-600 px-2.5 py-1 text-[11px] font-semibold text-white">Open <ArrowUpRight className="w-3 h-3" /></Link>
        <PinActions nowrap point={lead} label={`Land: ${formatSize(lead.size_sq_yds)} at ${lead.locality}`} />
      </div>
    </div>
  );
}

function PropertyCard({ property }: { property: MapProperty }) {
  const [cover, setCover] = useState<{ id: number; url: string | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/internal/properties/${property.id}/cover`).then((r) => r.json())
      .then((d) => { if (!cancelled && d.success) setCover({ id: property.id, url: d.url }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [property.id]);
  const photo = cover?.id === property.id ? cover.url : null;
  return (
    <>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="w-full h-32 object-cover bg-stone-100" />
      )}
      <div className="p-4">
        <div className="flex gap-1.5 mb-1.5 pr-8"><Tag color={LAYER.properties.color}>{property.property_type || 'Property'}</Tag>{property.status && <Tag>{property.status}</Tag>}</div>
        <div className="font-semibold text-stone-900 leading-snug">{property.title}</div>
        <div className="text-xs text-stone-500 mt-0.5 capitalize">{property.area}{property.deal_type ? ` · ${property.deal_type}` : ''}</div>
        <div className="text-xs font-semibold text-orange-600 mt-0.5">{property.deal_type === 'lease' ? property.lease_rate_label : property.price_label}</div>
        <div className="flex items-center gap-1.5 mt-3">
          <Link href={`/internal/properties/${property.id}`} className="inline-flex items-center gap-1 rounded-md bg-orange-500 hover:bg-orange-600 px-2.5 py-1 text-[11px] font-semibold text-white">Open <ArrowUpRight className="w-3 h-3" /></Link>
          <PinActions nowrap point={property} label={property.title} />
        </div>
      </div>
    </>
  );
}

function ProjectCard({ project }: { project: MapProject }) {
  return (
    <div className="p-4">
      <div className="flex gap-1.5 mb-1.5 pr-8"><Tag color={LAYER.projects.color}>Project</Tag><Tag>{stageLabel(project.stage)}</Tag></div>
      <div className="font-semibold text-stone-900">{project.name}</div>
      <div className="text-xs text-stone-500 mt-0.5">{project.brand_name || 'No brand'} · pinned from its {project.located_by.replace('_', ' ')}</div>
      <div className="flex items-center gap-1.5 mt-3">
        <Link href={`/internal/projects/${project.id}`} className="inline-flex items-center gap-1 rounded-md bg-orange-500 hover:bg-orange-600 px-2.5 py-1 text-[11px] font-semibold text-white">Open <ArrowUpRight className="w-3 h-3" /></Link>
        <PinActions nowrap point={project} label={`Project: ${project.name}`} />
      </div>
    </div>
  );
}

function DropCard({ point, label, data, onCreated }: {
  point: LatLng; label?: string; data: MapData;
  onCreated: (site: { id: number }) => void;
}) {
  const [mode, setMode] = useState<'menu' | 'site'>('menu');
  const [title, setTitle] = useState(label && !/^-?\d/.test(label) ? label : '');
  const [brand, setBrand] = useState('');
  const [radius, setRadius] = useState('1000');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inside = useMemo(() => data.sites.filter((s) => s.status === 'searching' && metersBetween(point, s) <= s.radius_max_m), [data.sites, point]);
  const lat = point.lat.toFixed(6); const lng = point.lng.toFixed(6);

  const createSite = async () => {
    if (!title.trim()) { setError('Give the site a name.'); return; }
    setSaving(true); setError('');
    try {
      const r = Number(radius) || 1000;
      const res = await fetch('/api/internal/requirements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), lat: Number(lat), lng: Number(lng), radius_min_m: Math.min(500, r), radius_max_m: r, brand_id: brand || null }),
      });
      const d = await res.json();
      if (!d.success) { setError(d.message || 'Could not save.'); return; }
      onCreated(d.requirement);
    } catch {
      setError('Could not save. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white';

  return (
    <div className="p-4">
      <div className="flex gap-1.5 mb-1.5 pr-8"><Tag color="#0f766e">Dropped pin</Tag></div>
      <div className="font-semibold text-stone-900">{label && !/^-?\d/.test(label) ? label : 'New location'}</div>
      <div className="text-xs text-stone-500 font-mono mt-0.5">{lat}, {lng}</div>
      <div className={`text-xs mt-1.5 ${inside.length ? 'text-emerald-700' : 'text-stone-500'}`}>
        {inside.length
          ? <>Inside {inside.length} open site radius{inside.length > 1 ? 'es' : ''}: {inside.slice(0, 3).map((s) => s.brand_name ? `${s.title} (${s.brand_name})` : s.title).join(', ')}{inside.length > 3 ? '…' : ''}</>
          : 'Not inside any open site radius.'}
      </div>

      {mode === 'menu' ? (
        <>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Link href={`/internal/properties/new?lat=${lat}&lng=${lng}`} className="flex items-center justify-center gap-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold px-3 py-2.5 hover:bg-stone-800">
              <Plus className="w-3.5 h-3.5" /> Property here
            </Link>
            <button onClick={() => setMode('site')} className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold px-3 py-2.5 hover:bg-orange-600">
              <Plus className="w-3.5 h-3.5" /> Site requirement
            </button>
          </div>
          <PinActions point={point} label={label && !/^-?\d/.test(label) ? label : 'Location'} className="mt-2" />
        </>
      ) : (
        <div className="mt-3 space-y-2">
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Site name, e.g. Kondapur 2" className={input} />
          <div className="grid grid-cols-2 gap-2">
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className={input} aria-label="Brand">
              <option value="">No brand</option>
              {data.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={radius} onChange={(e) => setRadius(e.target.value)} className={input} aria-label="Search radius">
              {[500, 750, 1000, 1500, 2000, 3000].map((m) => <option key={m} value={m}>{formatDistance(m)} radius</option>)}
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={createSite} disabled={saving} className="flex-1 rounded-lg bg-orange-500 text-white text-xs font-semibold px-3 py-2.5 disabled:opacity-60">{saving ? 'Saving…' : 'Save site'}</button>
            <button onClick={() => setMode('menu')} className="rounded-lg border border-stone-200 text-xs font-semibold px-3 py-2.5 text-stone-600">Back</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── workspace ────────────────────────── */

export default function MapWorkspace({ initialSelect }: { initialSelect?: Selected }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;

  const [data, setData] = useState<MapData | null>(null);
  const [error, setError] = useState('');
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ sites: true, leads: true, properties: true, projects: true });
  const [brand, setBrand] = useState('all');
  const [gapsOnly, setGapsOnly] = useState(false);
  const [showRadii, setShowRadii] = useState(false);
  const [cluster, setCluster] = useState(true);
  const [satellite, setSatellite] = useState(false);
  const [dropMode, setDropMode] = useState(false);
  const [dropped, setDropped] = useState<{ point: LatLng; label?: string } | null>(null);
  const [selected, setSelected] = useState<Selected>(initialSelect ?? null);
  const [focus, setFocus] = useState<Focus>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const apply = useCallback((d: { success: boolean; message?: string } & Partial<MapData>) => {
    if (d.success) { setData(d as MapData); setError(''); } else setError(d.message || 'Could not load the map.');
  }, []);
  const fetchMap = () => fetch('/api/internal/map').then((r) => r.json());
  const load = useCallback(async () => {
    try { apply(await fetchMap()); } catch { setError('Could not load the map.'); }
  }, [apply]);
  useEffect(() => {
    let cancelled = false;
    fetchMap().then((d) => { if (!cancelled) apply(d); }).catch(() => { if (!cancelled) setError('Could not load the map.'); });
    return () => { cancelled = true; };
  }, [apply]);

  const brandOk = useCallback((id: number | null) => brand === 'all' || (brand === 'none' ? id == null : String(id) === brand), [brand]);

  const view = useMemo(() => {
    if (!data) return null;
    const sites = data.sites.filter((s) => brandOk(s.brand_id) && (!gapsOnly || isGap(s)));
    const projects = data.projects.filter((p) => brandOk(p.brand_id));
    return {
      sites, projects,
      leads: data.leads, properties: data.properties,
      gaps: data.sites.filter((s) => brandOk(s.brand_id) && isGap(s)),
    };
  }, [data, brandOk, gapsOnly]);

  const fitPoints = useMemo(() => (data ? [...data.sites, ...data.leads, ...data.properties].map((p) => ({ lat: p.lat, lng: p.lng })) : []), [data]);

  const pick = useCallback((s: Selected, p?: LatLng) => {
    setDropped(null);
    setSelected(s);
    if (p) setFocus({ lat: p.lat, lng: p.lng, n: Date.now() });
  }, []);

  const onMapClick = (e: MapMouseEvent) => {
    const ll = e.detail.latLng;
    if (!ll) return;
    if (dropMode) {
      setSelected(null);
      setDropped({ point: { lat: ll.lat, lng: ll.lng } });
      setDropMode(false);
    } else {
      setSelected(null);
      setDropped(null);
    }
  };

  const sel = useMemo(() => {
    if (!data || !selected) return null;
    const list = data[selected.kind] as (LatLng & { id: number })[];
    return list.find((x) => x.id === selected.id) || null;
  }, [data, selected]);

  if (!apiKey) {
    return <div className="h-[70vh] rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center text-sm text-stone-500">Map view isn&apos;t configured (missing Google Maps key).</div>;
  }

  const selSite = selected?.kind === 'sites' ? (sel as MapSite | null) : null;
  const counts = view && {
    sites: view.sites.length, leads: view.leads.length, properties: view.properties.length, projects: view.projects.length,
  };

  const toggle = (k: LayerKey) => setLayers((l) => ({ ...l, [k]: !l[k] }));
  const chip = (on: boolean) => `inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border shadow-sm transition-colors ${on ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'}`;

  const panel = view && data && counts && (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-stone-200 p-3">
          <div className="text-[11px] text-stone-500">Open sites</div>
          <div className="text-lg font-semibold text-stone-900">{view.sites.filter((s) => s.status === 'searching').length}</div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
          <div className="text-[11px] text-red-700">With nothing nearby</div>
          <div className="text-lg font-semibold text-red-700">{view.gaps.length}</div>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2">Layers</div>
        <div className="space-y-1">
          {(Object.keys(LAYER) as LayerKey[]).map((k) => {
            const L = LAYER[k];
            return (
              <label key={k} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer">
                <input type="checkbox" checked={layers[k]} onChange={() => toggle(k)} className="accent-orange-500" />
                <span className="w-2.5 h-2.5 flex-shrink-0" style={{ background: L.color, borderRadius: k === 'leads' ? 2 : k === 'projects' ? 1 : 9999, transform: k === 'projects' ? 'rotate(45deg)' : undefined }} />
                <span className="text-sm text-stone-800 flex-1">{L.label}</span>
                <span className="text-xs text-stone-500 tabular-nums">{counts[k]}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-2">Brand</div>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="all">All brands</option>
          {data.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          <option value="none">No brand</option>
        </select>
        <p className="text-[11px] text-stone-400 mt-1">Filters sites and projects.</p>
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer text-sm text-stone-800">
          <input type="checkbox" checked={gapsOnly} onChange={() => setGapsOnly((v) => !v)} className="accent-red-600" /> Only sites with nothing nearby
        </label>
        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer text-sm text-stone-800">
          <input type="checkbox" checked={showRadii} onChange={() => setShowRadii((v) => !v)} className="accent-orange-500" /> Show every site radius
        </label>
        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer text-sm text-stone-800">
          <input type="checkbox" checked={cluster} onChange={() => setCluster((v) => !v)} className="accent-orange-500" /> Group nearby pins
        </label>
      </div>

      {view.gaps.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-red-700 uppercase tracking-wide mb-2">Sites with nothing nearby</div>
          <ul className="max-h-72 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-lg">
            {view.gaps.map((s) => (
              <li key={s.id}>
                <button onClick={() => { pick({ kind: 'sites', id: s.id }, s); setLayers((l) => ({ ...l, sites: true })); setPanelOpen(false); }} className={`w-full text-left px-3 py-2 hover:bg-stone-50 ${selected?.kind === 'sites' && selected.id === s.id ? 'bg-orange-50' : ''}`}>
                  <div className="text-sm text-stone-900 truncate">{s.title}</div>
                  <div className="text-[11px] text-stone-500">{s.brand_name || 'No brand'} · {formatDistance(s.radius_max_m)} radius{s.priority === 'high' ? ' · high priority' : ''}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <APIProvider apiKey={apiKey}>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 min-w-0 h-[70vh] lg:h-[calc(100vh-8.5rem)] min-h-[460px] rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
          <Map
            defaultCenter={HYD}
            defaultZoom={11}
            mapId={mapId}
            mapTypeId={satellite ? 'hybrid' : 'roadmap'}
            gestureHandling="greedy"
            disableDefaultUI
            zoomControl
            fullscreenControl
            clickableIcons={false}
            draggableCursor={dropMode ? 'crosshair' : undefined}
            onClick={onMapClick}
          >
            <CameraController focus={focus} />
            {initialSelect ? <DeepLinkCamera data={data} target={initialSelect} /> : <FitOnce points={fitPoints} />}

            {view && layers.properties && (
              <MarkerLayer key={`p-${cluster}`} items={view.properties} color={LAYER.properties.color} cluster={cluster}
                onPick={(p) => pick({ kind: 'properties', id: p.id })}
                render={(p) => <Dot color={LAYER.properties.color} size={11} selected={selected?.kind === 'properties' && selected.id === p.id} />} />
            )}
            {view && layers.leads && (
              <MarkerLayer key={`l-${cluster}`} items={view.leads} color={LAYER.leads.color} cluster={cluster}
                onPick={(l) => pick({ kind: 'leads', id: l.id })}
                render={(l) => <Dot color={LAYER.leads.color} size={13} shape="square" selected={selected?.kind === 'leads' && selected.id === l.id} />} />
            )}
            {view && layers.projects && (
              <MarkerLayer key={`j-${cluster}`} items={view.projects} color={LAYER.projects.color} cluster={cluster}
                onPick={(p) => pick({ kind: 'projects', id: p.id })}
                render={(p) => <Dot color={LAYER.projects.color} size={12} shape="diamond" selected={selected?.kind === 'projects' && selected.id === p.id} />} />
            )}
            {view && layers.sites && (
              <MarkerLayer key={`s-${cluster}`} items={view.sites} color={LAYER.sites.color} cluster={cluster}
                onPick={(s) => pick({ kind: 'sites', id: s.id })}
                render={(s) => {
                  const gap = isGap(s);
                  return <Dot color={gap ? GAP_COLOR : SITE_STATUS_COLOR[s.status] || LAYER.sites.color} size={16} ring={gap ? GAP_COLOR : undefined} selected={selected?.kind === 'sites' && selected.id === s.id} />;
                }} />
            )}

            {view && layers.sites && showRadii && view.sites.map((s) => (
              <Circle key={`r-${s.id}`} center={s} radius={s.radius_max_m} clickable={false}
                strokeColor={isGap(s) ? GAP_COLOR : SITE_STATUS_COLOR[s.status] || '#f97316'} strokeOpacity={0.5} strokeWeight={1}
                fillColor={isGap(s) ? GAP_COLOR : SITE_STATUS_COLOR[s.status] || '#f97316'} fillOpacity={0.06} />
            ))}
            {selSite && !showRadii && (
              <Circle center={selSite} radius={selSite.radius_max_m} clickable={false}
                strokeColor={isGap(selSite) ? GAP_COLOR : '#f97316'} strokeOpacity={0.7} strokeWeight={1.5}
                fillColor={isGap(selSite) ? GAP_COLOR : '#f97316'} fillOpacity={0.08} />
            )}

            {dropped && (
              <AdvancedMarker position={dropped.point} zIndex={5000}>
                <MapPin className="w-8 h-8 -mb-1 text-teal-700 drop-shadow" fill="#ccfbf1" />
              </AdvancedMarker>
            )}
          </Map>

          {/* top toolbar */}
          <div className="absolute top-3 left-3 right-3 z-20 flex flex-col sm:flex-row gap-2 sm:items-start pointer-events-none">
            <div className="pointer-events-auto">
              {data && (
                <SearchBox
                  data={data}
                  onHit={(h) => { setLayers((l) => ({ ...l, [h.kind]: true })); pick({ kind: h.kind, id: h.id }); setFocus({ lat: h.lat, lng: h.lng, zoom: 15, n: Date.now() }); }}
                  onPlace={(p, label) => { setSelected(null); setDropped({ point: p, label }); setFocus({ ...p, zoom: 15, n: Date.now() }); }}
                />
              )}
            </div>
            <div className="flex gap-2 pointer-events-auto sm:ml-auto">
              <button onClick={() => { setDropMode((v) => !v); setSelected(null); }} className={chip(dropMode)} aria-pressed={dropMode}>
                <MapPin className="w-3.5 h-3.5" /> {dropMode ? 'Tap the map…' : 'Drop pin'}
              </button>
              <button onClick={() => setSatellite((v) => !v)} className={chip(satellite)} aria-pressed={satellite}>
                <Satellite className="w-3.5 h-3.5" /> Satellite
              </button>
              <button onClick={() => setPanelOpen(true)} className={`${chip(false)} lg:hidden`}>
                <Layers className="w-3.5 h-3.5" /> Layers
              </button>
            </div>
          </div>

          {!data && !error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40">
              <Loader2 className="w-6 h-6 animate-spin text-stone-500" />
            </div>
          )}
          {error && (
            <div className="absolute top-16 left-3 right-3 sm:right-auto z-20 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 shadow">
              {error} <button onClick={load} className="font-semibold underline ml-1">Retry</button>
            </div>
          )}

          {data && dropped && (
            <CardShell onClose={() => setDropped(null)}>
              <DropCard
                key={`${dropped.point.lat},${dropped.point.lng}`}
                point={dropped.point} label={dropped.label} data={data}
                onCreated={async (site) => { setDropped(null); await load(); setLayers((l) => ({ ...l, sites: true })); setSelected({ kind: 'sites', id: site.id }); }}
              />
            </CardShell>
          )}
          {data && !dropped && sel && selected && (
            <CardShell onClose={() => setSelected(null)}>
              {selected.kind === 'sites' && <SiteCard key={selected.id} site={sel as MapSite} data={data} onPick={pick} onDeleted={async () => { setSelected(null); await load(); }} />}
              {selected.kind === 'leads' && <LeadCard lead={sel as MapLead} />}
              {selected.kind === 'properties' && <PropertyCard property={sel as MapProperty} />}
              {selected.kind === 'projects' && <ProjectCard project={sel as MapProject} />}
            </CardShell>
          )}
        </div>

        {/* side panel — docked on desktop, a sheet on mobile */}
        <aside className="hidden lg:block w-72 flex-shrink-0 bg-white border border-stone-200/80 rounded-xl shadow-[0_1px_2px_rgba(28,25,23,0.04)] p-4 h-[calc(100vh-8.5rem)] overflow-y-auto">
          {panel || <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-stone-100 animate-pulse" />)}</div>}
        </aside>
        {panelOpen && (
          <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-label="Map layers">
            <div className="absolute inset-0 bg-black/30" onClick={() => setPanelOpen(false)} />
            <div className="absolute left-0 right-0 bottom-0 max-h-[80vh] overflow-y-auto bg-white rounded-t-2xl p-4 pb-8 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-stone-900">Map layers</div>
                <button onClick={() => setPanelOpen(false)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center" aria-label="Close"><X className="w-4 h-4" /></button>
              </div>
              {panel}
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
}
