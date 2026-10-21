'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandForm from '@/components/internal/BrandForm';
import BulkSitesInput, { type BulkSitesValue } from '@/components/internal/BulkSitesInput';
import { BRAND_CATEGORIES, BRAND_STATUSES, STUCK_AFTER_DAYS, daysSince, specLine, stageLabel } from '@/lib/brands-projects';

/* eslint-disable @typescript-eslint/no-explicit-any */

function describeResult(r?: string) {
  if (!r) return null;
  if (r === 'failed') return { ok: false, text: "The brand was created but the sites couldn't be saved. Add them below." };
  const [c, s] = r.split('-').map(Number);
  if (!Number.isFinite(c)) return null;
  return { ok: true, text: `${c} site${c === 1 ? '' : 's'} added${s ? `, ${s} skipped as duplicates` : ''}.` };
}

export default function BrandDetailClient({ brandId, isOwner, sitesResult }: { brandId: string; isOwner: boolean; sitesResult?: string }) {
  const router = useRouter();
  const [brand, setBrand] = useState<any>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [banner, setBanner] = useState(describeResult(sitesResult));
  const [adding, setAdding] = useState(false);
  const [bulk, setBulk] = useState<BulkSitesValue | null>(null);
  const [saving, setSaving] = useState(false);
  const onBulk = useCallback((v: BulkSitesValue) => setBulk(v), []);

  const addSites = async () => {
    if (!bulk?.rows.length) return;
    setSaving(true);
    try {
      const res = await fetch('/api/internal/requirements/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: Number(brandId),
          requirements: bulk.rows.map((r) => ({ title: r.title, lat: r.lat, lng: r.lng })),
          radius_min_m: bulk.radius_min_m, radius_max_m: bulk.radius_max_m,
          priority: bulk.priority, target_date: bulk.target_date || null,
        }),
      });
      const d = await res.json();
      if (!d.success) { setBanner({ ok: false, text: d.message || 'Could not add sites.' }); return; }
      setBanner(describeResult(`${d.created}-${d.skipped}`));
      setAdding(false); setBulk(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const load = () => {
    fetch(`/api/internal/brands/${brandId}`).then((r) => r.json())
      .then((d) => { if (d.success) { setBrand(d.brand); setRequirements(d.requirements); setProjects(d.projects); } })
      .finally(() => setLoading(false));
  };
  useEffect(load, [brandId]);

  const remove = async () => {
    if (!confirm(`Delete ${brand.name}? Its site requirements and projects are kept but unlinked.`)) return;
    const res = await fetch(`/api/internal/brands/${brandId}`, { method: 'DELETE' });
    const d = await res.json();
    if (!d.success) { alert(d.message); return; }
    router.push('/internal/brands');
  };

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-8"><div className="h-64 bg-stone-200 rounded-xl animate-pulse" /></div>;
  if (!brand) return <div className="max-w-4xl mx-auto px-6 py-8 text-sm text-stone-400">Brand not found.</div>;

  if (editing) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">Edit {brand.name}</h1>
        <BrandForm
          initial={brand}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            const res = await fetch(`/api/internal/brands/${brandId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
            const d = await res.json();
            if (!d.success) return d.message || 'Could not save.';
            setBrand(d.brand); setEditing(false);
            return null;
          }}
        />
      </div>
    );
  }

  const status = BRAND_STATUSES.find((s) => s.value === brand.status);
  const row = (label: string, value: React.ReactNode) => value ? (
    <div className="flex justify-between gap-4 py-2 border-b border-stone-100 last:border-0 text-sm"><span className="text-stone-500">{label}</span><span className="text-stone-900 text-right">{value}</span></div>
  ) : null;
  const n = (v: any, unit = '') => (v != null ? `${Number(v).toLocaleString('en-IN')}${unit}` : null);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/internal/brands" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Brands</Link>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-stone-900">{brand.name}</h1>
            {status && <span className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${status.badge}`}>{status.label}</span>}
          </div>
          <p className="text-sm text-stone-500 mt-1">{BRAND_CATEGORIES.find((c) => c.value === brand.category)?.label}{specLine(brand) ? ` · ${specLine(brand)}` : ''}</p>
        </div>
        <div className="flex gap-2">
          {brand.contact_phone && <a href={`tel:${brand.contact_phone}`} className="px-3.5 py-2 rounded-lg bg-stone-900 text-white text-sm font-semibold">Call</a>}
          <button onClick={() => setEditing(true)} className="px-3.5 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 text-sm font-semibold">Edit</button>
          {isOwner && <button onClick={remove} className="px-3.5 py-2 rounded-lg text-red-500 text-sm font-semibold">Delete</button>}
        </div>
      </div>

      {banner && (
        <div className={`flex items-center justify-between gap-3 text-sm rounded-lg px-4 py-2.5 mb-5 border ${banner.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span>{banner.text}</span>
          <button onClick={() => setBanner(null)} className="text-xs opacity-60 hover:opacity-100" aria-label="Dismiss">✕</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-stone-800">Site requirements ({requirements.length})</div>
              {!adding && <button onClick={() => setAdding(true)} className="text-xs text-orange-500 font-semibold hover:underline">+ Add sites in bulk</button>}
            </div>
            {adding && (
              <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-4 mb-4">
                <BulkSitesInput onChange={onBulk} compact />
                <div className="flex gap-2 mt-3">
                  <button onClick={addSites} disabled={saving || !bulk?.rows.length} className="text-xs bg-orange-500 text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-40">
                    {saving ? 'Adding…' : `Add ${bulk?.rows.length || ''} site${bulk?.rows.length === 1 ? '' : 's'} to ${brand.name}`}
                  </button>
                  <button onClick={() => { setAdding(false); setBulk(null); }} className="text-xs border border-stone-200 rounded-lg px-4 py-2 font-semibold text-stone-600 bg-white">Cancel</button>
                </div>
              </div>
            )}
            {requirements.length === 0 && !adding ? (
              <p className="text-sm text-stone-400">None yet. Click &quot;Add sites in bulk&quot; and paste this brand&apos;s locations.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {requirements.map((r) => (
                  <li key={r.id}>
                    <Link href={`/internal/requirements/${r.id}`} className="flex justify-between gap-3 py-2 text-sm hover:text-orange-600">
                      <span className="truncate">{r.priority === 'high' && <span className="text-red-500 font-bold">! </span>}{r.title}</span>
                      <span className="text-xs text-stone-400 capitalize flex-shrink-0">{r.status}{r.target_date ? ` · by ${new Date(r.target_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-stone-800">Projects ({projects.length})</div>
              <Link href={`/internal/projects/new?brand_id=${brand.id}`} className="text-xs text-orange-500 font-semibold hover:underline">+ New project</Link>
            </div>
            {projects.length === 0 ? (
              <p className="text-sm text-stone-400">No projects with this brand yet.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {projects.map((p) => {
                  const days = daysSince(p.stage_changed_at);
                  const stuck = days > STUCK_AFTER_DAYS && !['rent_started', 'dropped'].includes(p.stage);
                  return (
                    <li key={p.id}>
                      <Link href={`/internal/projects/${p.id}`} className="flex justify-between gap-3 py-2 text-sm hover:text-orange-600">
                        <span className="truncate">{p.name}</span>
                        <span className={`text-xs flex-shrink-0 ${stuck ? 'text-red-600 font-semibold' : 'text-stone-400'}`}>{stageLabel(p.stage)} · {days}d</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {(brand.notes || brand.spec_notes) && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3">
              {brand.spec_notes && <div><div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Spec notes</div><p className="text-sm text-stone-700 whitespace-pre-wrap">{brand.spec_notes}</p></div>}
              {brand.notes && <div><div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Notes</div><p className="text-sm text-stone-700 whitespace-pre-wrap">{brand.notes}</p></div>}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-sm font-bold text-stone-800 mb-2">Contact</div>
            {brand.contact_name || brand.contact_phone || brand.contact_email ? (
              <>
                {row('Name', brand.contact_name)}
                {row('Role', brand.contact_role)}
                {row('Phone', brand.contact_phone && <a href={`tel:${brand.contact_phone}`} className="hover:underline">{brand.contact_phone}</a>)}
                {row('Email', brand.contact_email && <a href={`mailto:${brand.contact_email}`} className="hover:underline">{brand.contact_email}</a>)}
              </>
            ) : <p className="text-sm text-stone-400">No contact saved.</p>}
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-sm font-bold text-stone-800 mb-2">Standard site spec</div>
            {row('Min land', n(brand.min_land_sq_yds, ' sq yds'))}
            {row('Built-up', brand.min_builtup_sqft || brand.max_builtup_sqft ? `${n(brand.min_builtup_sqft) ?? '?'} – ${n(brand.max_builtup_sqft) ?? '?'} sq ft` : null)}
            {row('Min road width', n(brand.min_road_width_ft, ' ft'))}
            {row('Min frontage', n(brand.min_frontage_ft, ' ft'))}
            {row('Clear height', n(brand.min_ceiling_ft, ' ft'))}
            {row('Power', n(brand.power_kva, ' kVA'))}
            {row('Rent', brand.rent_min_per_sqft || brand.rent_max_per_sqft ? `₹${brand.rent_min_per_sqft ?? '?'} – ₹${brand.rent_max_per_sqft ?? '?'} /sq ft/mo` : null)}
            {row('Lease', n(brand.lease_years, ' years'))}
            {!specLine(brand) && !brand.power_kva && <p className="text-sm text-stone-400">Not set. Add it so matching can check land size and road width.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
