'use client';

import { useEffect, useState } from 'react';
import { FUNDED_BY, inr, scheduleStatus } from '@/lib/brands-projects';
import { compressImage } from '@/lib/compress-image';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Update {
  id: number; progress: number | null; note: string | null; created_at: string;
  team_members: { id: number; name: string } | null;
  photos: { id: number; url: string | null }[];
}

const STATUS_STYLE: Record<string, string> = {
  late: 'bg-red-50 text-red-700 border-red-200',
  behind: 'bg-amber-50 text-amber-700 border-amber-200',
  on_track: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  none: 'bg-stone-50 text-stone-500 border-stone-200',
};

export default function ConstructionCard({ project, onSaved }: { project: any; onSaved: (patch: Record<string, unknown>) => Promise<boolean> }) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState('');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);

  const load = () => {
    fetch(`/api/internal/projects/${project.id}/construction`).then((r) => r.json()).then((d) => d.success && setUpdates(d.updates));
  };
  useEffect(load, [project.id]);

  const status = scheduleStatus(project);
  const pct = project.construction_progress ?? 0;

  const startEdit = () => {
    const s = (v: unknown) => (v == null ? '' : String(v));
    setForm({
      builder_name: s(project.builder_name), builder_phone: s(project.builder_phone), contract_value: s(project.contract_value),
      construction_funded_by: s(project.construction_funded_by), construction_start: s(project.construction_start), target_handover: s(project.target_handover),
    });
    setEditing(true);
  };

  const post = async () => {
    setPosting(true);
    try {
      const fd = new FormData();
      if (progress.trim()) fd.append('progress', progress);
      if (note.trim()) fd.append('note', note);
      for (const f of photos) fd.append('photos', await compressImage(f));
      const res = await fetch(`/api/internal/projects/${project.id}/construction`, { method: 'POST', body: fd });
      const d = await res.json();
      if (!d.success) { alert(d.message); return; }
      if (d.photosSkipped) alert(`${d.photosSkipped} photo(s) could not be uploaded.`);
      setProgress(''); setNote(''); setPhotos([]);
      load();
      await onSaved({}); // refresh project (progress figure)
    } finally {
      setPosting(false);
    }
  };

  const removeUpdate = async (id: number) => {
    if (!confirm('Delete this site update and its photos?')) return;
    await fetch(`/api/internal/projects/${project.id}/construction?update_id=${id}`, { method: 'DELETE' });
    setUpdates((u) => u.filter((x) => x.id !== id));
  };

  const inputClass = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white';
  const row = (label: string, value: React.ReactNode) => value ? (
    <div className="flex justify-between gap-4 py-1.5 text-sm"><span className="text-stone-500">{label}</span><span className="text-stone-900 text-right">{value}</span></div>
  ) : null;
  const date = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm font-bold text-stone-800">Construction</div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${STATUS_STYLE[status.kind]}`}>{status.label}</span>
          {!editing && <button onClick={startEdit} className="text-xs text-orange-500 font-semibold hover:underline">Edit</button>}
        </div>
      </div>

      <div className="mb-4">
        <div className="relative h-3 bg-stone-100 rounded-full overflow-hidden">
          <div className={`h-full ${status.kind === 'late' ? 'bg-red-400' : status.kind === 'behind' ? 'bg-amber-400' : 'bg-orange-400'}`} style={{ width: `${pct}%` }} />
          {status.expected != null && status.kind !== 'done' && (
            <div className="absolute top-0 bottom-0 w-0.5 bg-stone-700" style={{ left: `${status.expected}%` }} title={`Expected by today: ${status.expected}%`} />
          )}
        </div>
        <div className="flex justify-between text-[11px] text-stone-500 mt-1">
          <span>{pct}% built</span>
          {status.expected != null && status.kind !== 'done' && <span>| marker = where it should be today</span>}
        </div>
      </div>

      {editing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div><label className="text-[11px] text-stone-500">Builder</label><input value={form.builder_name} onChange={(e) => setForm((f) => ({ ...f, builder_name: e.target.value }))} className={inputClass} /></div>
          <div><label className="text-[11px] text-stone-500">Builder phone</label><input inputMode="tel" value={form.builder_phone} onChange={(e) => setForm((f) => ({ ...f, builder_phone: e.target.value }))} className={inputClass} /></div>
          <div><label className="text-[11px] text-stone-500">Contract value ₹</label><input inputMode="numeric" value={form.contract_value} onChange={(e) => setForm((f) => ({ ...f, contract_value: e.target.value }))} className={inputClass} /></div>
          <div>
            <label className="text-[11px] text-stone-500">Funded by</label>
            <select value={form.construction_funded_by} onChange={(e) => setForm((f) => ({ ...f, construction_funded_by: e.target.value }))} className={inputClass}>
              <option value="">Not decided</option>
              {FUNDED_BY.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div><label className="text-[11px] text-stone-500">Construction start</label><input type="date" value={form.construction_start} onChange={(e) => setForm((f) => ({ ...f, construction_start: e.target.value }))} className={inputClass} /></div>
          <div><label className="text-[11px] text-stone-500">Target handover</label><input type="date" value={form.target_handover} onChange={(e) => setForm((f) => ({ ...f, target_handover: e.target.value }))} className={inputClass} /></div>
          <div className="sm:col-span-2 flex gap-2">
            <button onClick={async () => { if (await onSaved(form)) setEditing(false); }} className="text-xs bg-orange-500 text-white rounded-lg px-4 py-2 font-semibold">Save</button>
            <button onClick={() => setEditing(false)} className="text-xs border border-stone-200 rounded-lg px-4 py-2 font-semibold text-stone-600">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="mb-4 divide-y divide-stone-100">
          {row('Builder', project.builder_name && <>{project.builder_name}{project.builder_phone && <> · <a href={`tel:${project.builder_phone}`} className="hover:underline">{project.builder_phone}</a></>}</>)}
          {row('Contract value', project.contract_value && inr(project.contract_value))}
          {row('Funded by', FUNDED_BY.find((f) => f.value === project.construction_funded_by)?.label)}
          {row('Start', date(project.construction_start))}
          {row('Target handover', date(project.target_handover))}
          {!project.builder_name && !project.contract_value && !project.construction_start && <p className="text-sm text-stone-400 py-1">Add the builder, contract value and dates once the construction contract is signed.</p>}
        </div>
      )}

      <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-3 space-y-2">
        <div className="text-xs font-semibold text-stone-600">Post a site update</div>
        <div className="flex gap-2">
          <input inputMode="numeric" value={progress} onChange={(e) => setProgress(e.target.value.replace(/[^\d]/g, '').slice(0, 3))} placeholder={`% done (now ${pct})`} className={inputClass + ' max-w-[9rem]'} />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened? e.g. Roof slab cast" className={inputClass} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs border border-stone-300 bg-white rounded-lg px-3 py-1.5 cursor-pointer font-semibold text-stone-600">
            {photos.length ? `${photos.length} photo${photos.length > 1 ? 's' : ''}` : 'Add photos'}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { setPhotos(Array.from(e.target.files || []).slice(0, 6)); e.target.value = ''; }} />
          </label>
          <button onClick={post} disabled={posting || (!progress && !note.trim() && photos.length === 0)} className="text-xs bg-stone-900 text-white rounded-lg px-4 py-1.5 font-semibold disabled:opacity-40">{posting ? 'Posting…' : 'Post update'}</button>
        </div>
      </div>

      {updates.length > 0 && (
        <ul className="mt-4 space-y-3">
          {updates.map((u) => (
            <li key={u.id} className="group border-l-2 border-orange-200 pl-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-stone-500">
                  {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {u.team_members ? ` · ${u.team_members.name}` : ''}
                  {u.progress != null && <span className="ml-1 font-semibold text-stone-800">· {u.progress}%</span>}
                </div>
                <button onClick={() => removeUpdate(u.id)} className="text-xs text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100" aria-label="Delete update">✕</button>
              </div>
              {u.note && <div className="text-sm text-stone-800 mt-0.5">{u.note}</div>}
              {u.photos.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {u.photos.map((p) => p.url && (
                    <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="h-20 w-28 object-cover rounded-lg" />
                    </a>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
