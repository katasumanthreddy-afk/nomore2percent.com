'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { titleCase } from '@/types/property';
import { CONSTRUCTION_INTEREST, LEAD_STATUSES, formatSize } from '@/lib/land-leads';
import { specLine, stageLabel, type FitResult, type Spec } from '@/lib/brands-projects';

interface NearbyProperty {
  id: number; title: string; area: string | null; status: string;
  property_type: string; deal_type: string; price_label: string | null; lease_rate_label: string | null;
  distance_m: number; fit: FitResult;
}

interface NearbyLead {
  id: number; owner_name: string; phone: string; locality: string; size_sq_yds: number;
  road_width_ft: number | null; construction_interest: string | null; status: string;
  distance_m: number; inside_radius: boolean; fit: FitResult;
}

interface Assignment { id: number; name: string; type: 'team' | 'scout' }

interface Requirement {
  id: number; title: string; lat: number; lng: number;
  radius_min_m: number; radius_max_m: number; status: string; notes: string | null;
  matched_property_id: number | null;
  commercial_properties: { id: number; title: string } | null;
  brand_id: number | null; brands: { id: number; name: string } | null;
  min_land_sq_yds: number | null; min_builtup_sqft: number | null; min_road_width_ft: number | null;
  rent_max_per_sqft: number | null; priority: string | null; target_date: string | null;
}

function FitBadge({ fit }: { fit: FitResult }) {
  if (!fit.fits) return <span title={fit.issues.join(', ')} className="text-[11px] font-semibold border rounded-full px-2 py-0.5 bg-red-50 text-red-600 border-red-200">✕ {fit.issues[0]}</span>;
  if (fit.unknown.length) return <span className="text-[11px] font-semibold border rounded-full px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-200">? check {fit.unknown.join(', ')}</span>;
  return <span className="text-[11px] font-semibold border rounded-full px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200">✓ fits spec</span>;
}

const STATUS_BADGE: Record<string, string> = {
  searching: 'bg-orange-50 text-orange-600 border-orange-200',
  found: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  closed: 'bg-stone-100 text-stone-500 border-stone-200',
};

export default function RequirementDetailClient({ requirementId }: { requirementId: string }) {
  const router = useRouter();
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [nearby, setNearby] = useState<NearbyProperty[]>([]);
  const [nearbyLeads, setNearbyLeads] = useState<NearbyLead[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string; stage: string }[]>([]);
  const [spec, setSpec] = useState<Spec>({});
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [editSpec, setEditSpec] = useState(false);
  const [specForm, setSpecForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<{ id: number; name: string }[]>([]);
  const [scouts, setScouts] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/internal/team').then((r) => r.json()).then((d) => d.success && setTeam(d.members.filter((m: any) => m.status === 'active')));
    fetch('/api/internal/scouts').then((r) => r.json()).then((d) => d.success && setScouts(d.scouts));
    fetch('/api/internal/brands').then((r) => r.json()).then((d) => d.success && setBrands(d.brands));
  }, []);

  const load = () => {
    fetch(`/api/internal/requirements/${requirementId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setRequirement(d.requirement); setNearby(d.nearby); setAssignments(d.assignments || []);
          setNearbyLeads(d.nearbyLeads || []); setProjects(d.projects || []); setSpec(d.spec || {});
        }
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, [requirementId]);

  const updateStatus = async (status: string) => {
    await fetch(`/api/internal/requirements/${requirementId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    load();
  };

  const openSpecEditor = () => {
    if (!requirement) return;
    const s = (v: unknown) => (v == null ? '' : String(v));
    setSpecForm({
      brand_id: s(requirement.brand_id), priority: requirement.priority || 'normal', target_date: s(requirement.target_date),
      min_land_sq_yds: s(requirement.min_land_sq_yds), min_builtup_sqft: s(requirement.min_builtup_sqft),
      min_road_width_ft: s(requirement.min_road_width_ft), rent_max_per_sqft: s(requirement.rent_max_per_sqft),
    });
    setEditSpec(true);
  };

  const saveSpec = async () => {
    const res = await fetch(`/api/internal/requirements/${requirementId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(specForm),
    });
    const d = await res.json();
    if (!d.success) { alert(d.message); return; }
    setEditSpec(false);
    load();
  };

  const markAsMatch = async (propertyId: number) => {
    await fetch(`/api/internal/requirements/${requirementId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matched_property_id: propertyId, status: 'found' }),
    });
    load();
  };

  const addAssignee = async (patch: { team_member_id?: number; scout_id?: number }) => {
    await fetch(`/api/internal/requirements/${requirementId}/assign`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    });
    load();
  };

  const removeAssignee = async (assignmentId: number) => {
    await fetch(`/api/internal/requirements/${requirementId}/assign?assignment_id=${assignmentId}`, { method: 'DELETE' });
    load();
  };

  const remove = async () => {
    if (!confirm('Delete this site requirement?')) return;
    await fetch(`/api/internal/requirements/${requirementId}`, { method: 'DELETE' });
    router.push('/internal/requirements');
  };

  if (loading) return <div className="max-w-2xl mx-auto px-6 py-8"><div className="h-64 bg-stone-200 rounded-xl animate-pulse" /></div>;
  if (!requirement) return <div className="max-w-2xl mx-auto px-6 py-8 text-sm text-stone-400">Not found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Link href="/internal/requirements" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Site Requirements</Link>

      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="font-serif text-2xl font-bold text-stone-900">{requirement.title}</h1>
        <button onClick={remove} className="text-xs text-red-500 hover:text-red-600 flex-shrink-0">Delete</button>
      </div>
      <p className="text-stone-500 text-sm mb-6">Search radius: {requirement.radius_min_m}m – {requirement.radius_max_m}m</p>

      <div className="flex gap-2 mb-6">
        {['searching', 'found', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => updateStatus(s)}
            className={`text-xs font-semibold rounded-lg px-3 py-1.5 border capitalize transition-colors ${requirement.status === s ? STATUS_BADGE[s] : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Brand & spec</div>
          {!editSpec && <button onClick={openSpecEditor} className="text-xs text-orange-500 font-semibold hover:underline">Edit</button>}
        </div>
        {editSpec ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={specForm.brand_id} onChange={(e) => setSpecForm((f) => ({ ...f, brand_id: e.target.value }))} className="border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">No brand</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={specForm.priority} onChange={(e) => setSpecForm((f) => ({ ...f, priority: e.target.value }))} className="border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="normal">Normal priority</option>
                <option value="high">High priority</option>
                <option value="low">Low priority</option>
              </select>
              <input type="date" value={specForm.target_date} onChange={(e) => setSpecForm((f) => ({ ...f, target_date: e.target.value }))} className="border border-stone-200 rounded-lg px-3 py-2 text-sm" title="Brand wants it by" />
            </div>
            <p className="text-[11px] text-stone-500">Leave a field blank to use the brand&apos;s standard spec.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([['min_land_sq_yds', 'Min land sq yds'], ['min_builtup_sqft', 'Min built-up sq ft'], ['min_road_width_ft', 'Min road ft'], ['rent_max_per_sqft', 'Max rent ₹/sq ft']] as const).map(([k, l]) => (
                <input key={k} inputMode="decimal" placeholder={l} value={specForm[k]} onChange={(e) => setSpecForm((f) => ({ ...f, [k]: e.target.value }))} className="border border-stone-200 rounded-lg px-3 py-2 text-sm" />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={saveSpec} className="text-xs bg-orange-500 text-white rounded-lg px-4 py-2 font-semibold">Save</button>
              <button onClick={() => setEditSpec(false)} className="text-xs border border-stone-200 rounded-lg px-4 py-2 font-semibold text-stone-600">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-stone-700 space-y-1">
            <div>
              {requirement.brands ? <Link href={`/internal/brands/${requirement.brands.id}`} className="font-semibold hover:text-orange-600">{requirement.brands.name}</Link> : <span className="text-stone-400">No brand linked</span>}
              {requirement.priority === 'high' && <span className="ml-2 text-[11px] font-bold text-red-600">HIGH PRIORITY</span>}
              {requirement.target_date && <span className="ml-2 text-xs text-stone-500">wanted by {new Date(requirement.target_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
            </div>
            <div className="text-xs text-stone-500">{specLine(spec) || 'No spec set; matching uses distance only.'}</div>
          </div>
        )}
      </div>

      {projects.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Projects for this site</div>
          {projects.map((p) => (
            <Link key={p.id} href={`/internal/projects/${p.id}`} className="flex justify-between text-sm py-1 hover:text-orange-600">
              <span>{p.name}</span><span className="text-xs text-stone-500">{stageLabel(p.stage)}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6">
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Assigned To ({assignments.length})</div>
        {assignments.length > 0 ? (
          <div className="space-y-1.5 mb-3">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2">
                <span className="text-sm text-stone-800">{a.name} <span className="text-xs text-stone-400">({a.type === 'team' ? 'Team' : 'External Scout'})</span></span>
                <button onClick={() => removeAssignee(a.id)} className="text-xs text-red-500 hover:text-red-600">Remove</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400 mb-3">Not yet assigned to anyone.</p>
        )}
        <div className="flex gap-2 mt-3">
          <select
            onChange={(e) => { if (e.target.value) { addAssignee({ team_member_id: parseInt(e.target.value) }); e.target.value = ''; } }}
            value=""
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">+ Add team member...</option>
            {team.filter((m) => !assignments.some((a) => a.type === 'team' && a.name === m.name)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select
            onChange={(e) => { if (e.target.value) { addAssignee({ scout_id: parseInt(e.target.value) }); e.target.value = ''; } }}
            value=""
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">+ Add external scout...</option>
            {scouts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <Link href="/internal/requirements/scouts" className="text-xs text-orange-500 hover:underline mt-2 inline-block">Manage external scouts →</Link>
      </div>

      {requirement.commercial_properties && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-1">✓ Confirmed Match</div>
          <Link href={`/internal/properties/${requirement.matched_property_id}`} className="text-sm font-semibold text-stone-800 hover:underline">
            {requirement.commercial_properties.title}
          </Link>
        </div>
      )}

      <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
        Properties Within Range ({nearby.length})
      </div>
      {nearby.length > 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
          {nearby.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Link href={`/internal/properties/${p.id}`} className="text-sm font-semibold text-stone-800 hover:text-orange-500">{titleCase(p.title)}</Link>
                <div className="text-xs text-stone-500 capitalize">{p.area} · {p.property_type} · {p.distance_m}m away</div>
                <div className="mt-1 flex flex-wrap gap-2 items-center">
                  <FitBadge fit={p.fit} />
                  <Link href={`/internal/projects/new?requirement_id=${requirement.id}&property_id=${p.id}`} className="text-[11px] text-orange-500 font-semibold hover:underline">Start project →</Link>
                </div>
              </div>
              {requirement.matched_property_id === p.id ? (
                <span className="text-xs font-bold text-emerald-600 flex-shrink-0">✓ Matched</span>
              ) : (
                <button onClick={() => markAsMatch(p.id)} className="text-xs bg-stone-900 text-white rounded-lg px-3 py-1.5 font-semibold flex-shrink-0">
                  Mark as Match
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-stone-300 rounded-xl p-10 text-center text-sm text-stone-400">
          No properties within range yet — as you add commercial properties near this location, they'll show up here automatically.
        </div>
      )}

      <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 mt-8">
        Landowner leads nearby ({nearbyLeads.length})
      </div>
      {nearbyLeads.length > 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
          {nearbyLeads.map((l) => (
            <div key={l.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/internal/land-leads/${l.id}`} className="text-sm font-semibold text-stone-800 hover:text-orange-500">{formatSize(Number(l.size_sq_yds))} · {l.locality}</Link>
                <span className={`text-xs flex-shrink-0 ${l.inside_radius ? 'text-emerald-600 font-semibold' : 'text-stone-400'}`}>{l.distance_m}m {l.inside_radius ? 'inside' : 'just outside'}</span>
              </div>
              <div className="text-xs text-stone-500">{l.owner_name} · {LEAD_STATUSES.find((s) => s.value === l.status)?.label}{l.road_width_ft ? ` · ${l.road_width_ft} ft road` : ''}{l.construction_interest ? ` · ${CONSTRUCTION_INTEREST[l.construction_interest]?.label}` : ''}</div>
              <div className="mt-1 flex flex-wrap gap-2 items-center">
                <FitBadge fit={l.fit} />
                <Link href={`/internal/projects/new?requirement_id=${requirement.id}&land_lead_id=${l.id}`} className="text-[11px] text-orange-500 font-semibold hover:underline">Start project →</Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-stone-300 rounded-xl p-8 text-center text-sm text-stone-400">
          No landowner leads near this location yet. Leads from the lease-your-land campaign appear here when their pin is within range.
        </div>
      )}
    </div>
  );
}
