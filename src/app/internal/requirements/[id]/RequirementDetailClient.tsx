'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { titleCase } from '@/types/property';

interface NearbyProperty {
  id: number; title: string; area: string | null; status: string;
  property_type: string; deal_type: string; price_label: string | null; lease_rate_label: string | null;
  distance_m: number;
}

interface Assignment { id: number; name: string; type: 'team' | 'scout' }

interface Requirement {
  id: number; title: string; lat: number; lng: number;
  radius_min_m: number; radius_max_m: number; status: string; notes: string | null;
  matched_property_id: number | null;
  commercial_properties: { id: number; title: string } | null;
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
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<{ id: number; name: string }[]>([]);
  const [scouts, setScouts] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/internal/team').then((r) => r.json()).then((d) => d.success && setTeam(d.members.filter((m: any) => m.status === 'active')));
    fetch('/api/internal/scouts').then((r) => r.json()).then((d) => d.success && setScouts(d.scouts));
  }, []);

  const load = () => {
    fetch(`/api/internal/requirements/${requirementId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) { setRequirement(d.requirement); setNearby(d.nearby); setAssignments(d.assignments || []); } })
      .finally(() => setLoading(false));
  };
  useEffect(load, [requirementId]);

  const updateStatus = async (status: string) => {
    await fetch(`/api/internal/requirements/${requirementId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
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
    </div>
  );
}
