'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NotesTimeline from '@/components/internal/NotesTimeline';
import ConstructionCard from '@/components/internal/ConstructionCard';
import FeesCard from '@/components/internal/FeesCard';
import { PROJECT_STAGES, STUCK_AFTER_DAYS, daysSince, stageIndex, stageLabel } from '@/lib/brands-projects';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Item { id: number; stage: string; label: string; sort: number; done: boolean; done_at: string | null; team_members: { id: number; name: string } | null }
interface Doc { id: number; title: string; document_type: string; created_at: string }

const DOC_TYPES: [string, string][] = [
  ['term_sheet', 'Term sheet'], ['title_deed', 'Title / sale deed'], ['construction_contract', 'Construction contract'],
  ['drawings', 'Drawings'], ['permission', 'Permission / approval'], ['noc', 'NOC'], ['lease_agreement', 'Lease agreement'],
  ['invoice', 'Invoice'], ['photo', 'Site photo'], ['other', 'Other'],
];

export default function ProjectDetailClient({ projectId, isOwner }: { projectId: string; isOwner: boolean }) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewStage, setViewStage] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [notesKey, setNotesKey] = useState(0);
  const [newItem, setNewItem] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('other');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    fetch(`/api/internal/projects/${projectId}`).then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setProject(d.project); setItems(d.checklist); setDocs(d.documents);
        setViewStage((s) => s || (d.project.stage === 'dropped' ? PROJECT_STAGES[0].value : d.project.stage));
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, [projectId]);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/internal/projects/${projectId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!d.success) { alert(d.message); return false; }
      load(); setNotesKey((k) => k + 1);
      return true;
    } finally {
      setBusy(false);
    }
  };

  const moveTo = async (stage: string) => {
    const open = items.filter((i) => i.stage === project.stage && !i.done).length;
    if (stage !== 'dropped' && stageIndex(stage) > stageIndex(project.stage) && open > 0) {
      if (!confirm(`${open} item${open > 1 ? 's are' : ' is'} still open in "${stageLabel(project.stage)}". Move on anyway?`)) return;
    }
    if (stage === 'dropped') {
      const reason = prompt('Why is this project dropped? (e.g. brand chose another site, owner backed out)');
      if (reason === null) return;
      if (await patch({ stage, dropped_reason: reason })) setViewStage(PROJECT_STAGES[0].value);
      return;
    }
    if (await patch({ stage })) setViewStage(stage);
  };

  const toggle = async (item: Item) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)));
    const res = await fetch(`/api/internal/projects/${projectId}/checklist`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item_id: item.id, done: !item.done }) });
    const d = await res.json();
    if (d.success) setItems((prev) => prev.map((i) => (i.id === item.id ? d.item : i)));
    else { alert(d.message); load(); }
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    const res = await fetch(`/api/internal/projects/${projectId}/checklist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: viewStage, label: newItem }) });
    const d = await res.json();
    if (d.success) { setItems((prev) => [...prev, d.item]); setNewItem(''); } else alert(d.message);
  };

  const removeItem = async (id: number) => {
    if (!confirm('Remove this checklist item for this project?')) return;
    await fetch(`/api/internal/projects/${projectId}/checklist?item_id=${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const upload = async () => {
    if (!docFile || !docTitle.trim()) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', docFile); fd.append('title', docTitle); fd.append('document_type', docType); fd.append('project_id', projectId);
      const res = await fetch('/api/internal/documents', { method: 'POST', body: fd });
      const d = await res.json();
      if (d.success) { setDocs((prev) => [d.document, ...prev]); setDocTitle(''); setDocFile(null); } else alert(d.message);
    } finally {
      setUploading(false);
    }
  };
  const viewDoc = async (id: number) => {
    const res = await fetch(`/api/internal/documents/${id}/url`);
    const d = await res.json();
    if (d.success) window.open(d.url, '_blank'); else alert(d.message);
  };
  const deleteDoc = async (id: number) => {
    if (!confirm('Remove this document?')) return;
    await fetch(`/api/internal/documents?id=${id}`, { method: 'DELETE' });
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const startEdit = () => {
    const s = (v: unknown) => (v == null ? '' : String(v));
    setForm({
      name: s(project.name), landowner_name: s(project.landowner_name), landowner_phone: s(project.landowner_phone),
      locality: s(project.locality), land_sq_yds: s(project.land_sq_yds), builtup_sqft: s(project.builtup_sqft),
      rent_per_sqft: s(project.rent_per_sqft), lease_years: s(project.lease_years), target_handover: s(project.target_handover), notes: s(project.notes),
    });
    setEditing(true);
  };

  const remove = async () => {
    if (!confirm('Delete this project, its checklist and notes? This cannot be undone.')) return;
    const res = await fetch(`/api/internal/projects/${projectId}`, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) router.push('/internal/projects'); else alert(d.message);
  };

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-8"><div className="h-64 bg-stone-200 rounded-xl animate-pulse" /></div>;
  if (!project) return <div className="max-w-5xl mx-auto px-6 py-8 text-sm text-stone-400">Project not found.</div>;

  const curIdx = stageIndex(project.stage);
  const dropped = project.stage === 'dropped';
  const days = daysSince(project.stage_changed_at);
  const stuck = !dropped && project.stage !== 'rent_started' && days > STUCK_AFTER_DAYS;
  const stageItems = items.filter((i) => i.stage === viewStage).sort((a, b) => a.sort - b.sort);
  const next = PROJECT_STAGES[curIdx + 1];
  const monthlyRent = project.rent_per_sqft && project.builtup_sqft ? Number(project.rent_per_sqft) * Number(project.builtup_sqft) : null;

  const inputClass = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white';
  const row = (label: string, value: React.ReactNode) => value ? (
    <div className="flex justify-between gap-4 py-2 border-b border-stone-100 last:border-0 text-sm"><span className="text-stone-500">{label}</span><span className="text-stone-900 text-right">{value}</span></div>
  ) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/internal/projects" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Projects</Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">{project.name}</h1>
          <p className="text-sm text-stone-500 mt-1">
            {project.brands ? <Link href={`/internal/brands/${project.brands.id}`} className="hover:text-orange-600 font-semibold">{project.brands.name}</Link> : 'No brand yet'}
            {project.locality ? ` · ${project.locality}` : ''}
            {project.team_members ? ` · ${project.team_members.name}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {project.landowner_phone && <a href={`tel:${project.landowner_phone}`} className="px-3.5 py-2 rounded-lg bg-stone-900 text-white text-sm font-semibold">Call owner</a>}
          {project.brands?.contact_phone && <a href={`tel:${project.brands.contact_phone}`} className="px-3.5 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 text-sm font-semibold">Call brand</a>}
          <button onClick={startEdit} className="px-3.5 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 text-sm font-semibold">Edit</button>
          {isOwner && <button onClick={remove} className="px-3.5 py-2 rounded-lg text-red-500 text-sm font-semibold">Delete</button>}
        </div>
      </div>

      {/* Stage stepper */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="text-sm">
            {dropped ? (
              <span className="font-semibold text-stone-500">Dropped{project.dropped_reason ? `: ${project.dropped_reason}` : ''}</span>
            ) : (
              <>
                <span className="font-semibold text-stone-900">{stageLabel(project.stage)}</span>
                <span className={`ml-2 ${stuck ? 'text-red-600 font-semibold' : 'text-stone-500'}`}>{days} day{days === 1 ? '' : 's'} in this stage{stuck ? ' · stuck' : ''}</span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {dropped ? (
              <button disabled={busy} onClick={() => moveTo('brand_interested')} className="text-xs border border-stone-300 rounded-lg px-3 py-1.5 font-semibold">Reopen</button>
            ) : (
              <>
                {next && <button disabled={busy} onClick={() => moveTo(next.value)} className="text-xs bg-orange-500 text-white rounded-lg px-3 py-1.5 font-semibold hover:bg-orange-600">Move to {next.label} →</button>}
                <button disabled={busy} onClick={() => moveTo('dropped')} className="text-xs text-stone-500 rounded-lg px-2 py-1.5 font-semibold hover:text-red-600">Drop</button>
              </>
            )}
          </div>
        </div>
        <ol className="flex gap-1 overflow-x-auto pb-1">
          {PROJECT_STAGES.map((s, i) => {
            const st = items.filter((it) => it.stage === s.value);
            const done = st.filter((it) => it.done).length;
            const state = dropped ? 'future' : i < curIdx ? 'past' : i === curIdx ? 'current' : 'future';
            return (
              <li key={s.value} className="flex-1 min-w-[5.5rem]">
                <button onClick={() => setViewStage(s.value)} className={`w-full text-left rounded-lg px-2 py-2 border transition-colors ${viewStage === s.value ? 'ring-2 ring-orange-300' : ''} ${state === 'current' ? 'bg-orange-50 border-orange-300' : state === 'past' ? 'bg-emerald-50 border-emerald-200' : 'bg-stone-50 border-stone-200'}`}>
                  <div className={`h-1 rounded-full mb-1.5 ${state === 'past' ? 'bg-emerald-400' : state === 'current' ? 'bg-orange-400' : 'bg-stone-200'}`} />
                  <div className="text-[11px] font-semibold text-stone-800 leading-tight">{s.short}</div>
                  <div className="text-[10px] text-stone-500">{st.length ? `${done}/${st.length}` : '–'}</div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Checklist for the selected stage */}
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-stone-800">{stageLabel(viewStage)} checklist</div>
              {viewStage !== project.stage && !dropped && <span className="text-[11px] text-stone-400">{stageIndex(viewStage) < curIdx ? 'completed stage' : 'upcoming stage'}</span>}
            </div>
            {stageItems.length === 0 && <p className="text-sm text-stone-400 mb-3">No items for this stage.</p>}
            <ul className="space-y-1">
              {stageItems.map((it) => (
                <li key={it.id} className="group flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-stone-50">
                  <input type="checkbox" checked={it.done} onChange={() => toggle(it)} className="mt-1 accent-orange-500 w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${it.done ? 'text-stone-400 line-through' : 'text-stone-800'}`}>{it.label}</div>
                    {it.done && it.done_at && <div className="text-[11px] text-stone-400">{it.team_members?.name ? `${it.team_members.name}, ` : ''}{new Date(it.done_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>}
                  </div>
                  <button onClick={() => removeItem(it.id)} className="text-xs text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100" aria-label="Remove item">✕</button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-3">
              <input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem()} placeholder={`Add an item to ${stageLabel(viewStage)}…`} className={inputClass} />
              <button onClick={addItem} className="text-xs bg-stone-900 text-white rounded-lg px-4 font-semibold">Add</button>
            </div>
          </div>

          {(stageIndex(project.stage) >= stageIndex('construction_contract') || project.builder_name || project.construction_progress > 0) && <ConstructionCard project={project} onSaved={patch} />}

          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-sm font-bold text-stone-800 mb-3">Documents</div>
            <div className="divide-y divide-stone-100 mb-3">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <button onClick={() => viewDoc(d.id)} className="text-stone-700 hover:text-orange-500 font-medium text-left">{d.title}</button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-stone-400 uppercase">{DOC_TYPES.find(([v]) => v === d.document_type)?.[1] || d.document_type}</span>
                    <button onClick={() => deleteDoc(d.id)} className="text-red-400 hover:text-red-600 text-xs" aria-label="Remove document">✕</button>
                  </div>
                </div>
              ))}
              {docs.length === 0 && <div className="py-3 text-xs text-stone-400">No documents yet.</div>}
            </div>
            <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-3 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Document title" className={inputClass} />
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
                  {DOC_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} className="text-xs" />
              <button onClick={upload} disabled={uploading || !docFile || !docTitle.trim()} className="text-xs bg-stone-900 text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-40">{uploading ? 'Uploading…' : 'Upload'}</button>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-sm font-bold text-stone-800 mb-3">Activity</div>
            <NotesTimeline key={notesKey} projectId={project.id} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-sm font-bold text-stone-800 mb-2">Deal</div>
            {editing ? (
              <div className="space-y-2">
                {([['name', 'Project name'], ['landowner_name', 'Landowner'], ['landowner_phone', 'Owner phone'], ['locality', 'Locality'], ['land_sq_yds', 'Land sq yds'], ['builtup_sqft', 'Built-up sq ft'], ['rent_per_sqft', 'Rent ₹/sq ft/mo'], ['lease_years', 'Lease years']] as const).map(([k, l]) => (
                  <div key={k}><label className="text-[11px] text-stone-500">{l}</label><input value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} className={inputClass} /></div>
                ))}
                <div><label className="text-[11px] text-stone-500">Target handover</label><input type="date" value={form.target_handover} onChange={(e) => setForm((f) => ({ ...f, target_handover: e.target.value }))} className={inputClass} /></div>
                <div><label className="text-[11px] text-stone-500">Notes</label><textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={inputClass + ' h-20 resize-none'} /></div>
                <div className="flex gap-2 pt-1">
                  <button disabled={busy} onClick={async () => { if (await patch(form)) setEditing(false); }} className="text-xs bg-orange-500 text-white rounded-lg px-4 py-2 font-semibold">Save</button>
                  <button onClick={() => setEditing(false)} className="text-xs border border-stone-200 rounded-lg px-4 py-2 font-semibold text-stone-600">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {row('Landowner', project.landowner_name && `${project.landowner_name}${project.landowner_phone ? `, ${project.landowner_phone}` : ''}`)}
                {row('Land', project.land_sq_yds && `${Number(project.land_sq_yds).toLocaleString('en-IN')} sq yds`)}
                {row('Built-up', project.builtup_sqft && `${Number(project.builtup_sqft).toLocaleString('en-IN')} sq ft`)}
                {row('Rent', project.rent_per_sqft && `₹${project.rent_per_sqft}/sq ft/mo`)}
                {row('Monthly rent', monthlyRent && `₹${Math.round(monthlyRent).toLocaleString('en-IN')}`)}
                {row('Lease', project.lease_years && `${project.lease_years} years`)}
                {row('Target handover', project.target_handover && new Date(project.target_handover).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))}
                {project.notes && <p className="text-sm text-stone-700 mt-3 whitespace-pre-wrap">{project.notes}</p>}
              </>
            )}
          </div>

          {isOwner && <FeesCard project={project} />}

          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-sm font-bold text-stone-800 mb-2">Linked</div>
            {row('Brand', project.brands && <Link href={`/internal/brands/${project.brands.id}`} className="hover:text-orange-600">{project.brands.name}</Link>)}
            {row('Brand contact', project.brands?.contact_name)}
            {row('Site requirement', project.site_requirements && <Link href={`/internal/requirements/${project.site_requirements.id}`} className="hover:text-orange-600">{project.site_requirements.title}</Link>)}
            {row('Land lead', project.land_leads && <Link href={`/internal/land-leads/${project.land_leads.id}`} className="hover:text-orange-600">{project.land_leads.owner_name}, {project.land_leads.locality}</Link>)}
            {row('Property', project.commercial_properties && <Link href={`/internal/properties/${project.commercial_properties.id}`} className="hover:text-orange-600">{project.commercial_properties.title}</Link>)}
            {!project.brands && !project.site_requirements && !project.land_leads && !project.commercial_properties && <p className="text-sm text-stone-400">Nothing linked.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
