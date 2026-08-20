'use client';

import { useState } from 'react';
import Link from 'next/link';
import DealForm from '@/components/internal/DealForm';

interface Deal {
  id: number; deal_name: string; stage: string; client_name: string | null; client_contact: string | null;
  value: number | null; notes: string | null; expected_close_date: string | null;
  property_id: number | null; commercial_properties: { id: number; title: string; area: string } | null;
  assigned_to: number | null; team_members: { id: number; name: string } | null;
}
interface Doc { id: number; title: string; document_type: string }

const STAGE_LABEL: Record<string, string> = {
  lead: 'Lead', negotiation: 'Negotiation', due_diligence: 'Due Diligence',
  closed_won: 'Closed Won', closed_lost: 'Closed Lost',
};

export default function DealDetailClient({ deal, documents }: { deal: Deal; documents: Doc[] }) {
  const [editing, setEditing] = useState(false);
  const [docs, setDocs] = useState(documents);
  const [uploading, setUploading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('other');
  const [docFile, setDocFile] = useState<File | null>(null);

  const upload = async () => {
    if (!docFile || !docTitle.trim()) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', docFile);
      fd.append('title', docTitle);
      fd.append('document_type', docType);
      fd.append('deal_id', String(deal.id));
      const res = await fetch('/api/internal/documents', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) { setDocs((prev) => [data.document, ...prev]); setDocTitle(''); setDocFile(null); }
      else alert(data.message);
    } finally {
      setUploading(false);
    }
  };

  const viewDoc = async (id: number) => {
    const res = await fetch(`/api/internal/documents/${id}/url`);
    const data = await res.json();
    if (data.success) window.open(data.url, '_blank');
    else alert(data.message);
  };

  const deleteDoc = async (id: number) => {
    if (!confirm('Remove this document?')) return;
    await fetch(`/api/internal/documents?id=${id}`, { method: 'DELETE' });
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  if (editing) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button onClick={() => setEditing(false)} className="text-xs text-stone-400 hover:text-stone-600 mb-4">← Cancel Editing</button>
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">Edit Deal</h1>
        <DealForm
          mode="edit"
          dealId={deal.id}
          initialData={{
            deal_name: deal.deal_name, property_id: deal.property_id ? String(deal.property_id) : '',
            stage: deal.stage, client_name: deal.client_name || '', client_contact: deal.client_contact || '',
            value: deal.value != null ? String(deal.value) : '', assigned_to: deal.assigned_to ? String(deal.assigned_to) : '',
            notes: deal.notes || '', expected_close_date: deal.expected_close_date || '',
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Link href="/internal/deals" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Deals</Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">{deal.deal_name}</h1>
          <p className="text-stone-500 text-sm">{STAGE_LABEL[deal.stage]} {deal.commercial_properties && <>· <Link href={`/internal/properties/${deal.commercial_properties.id}`} className="text-orange-500 hover:underline">{deal.commercial_properties.title}</Link></>}</p>
        </div>
        <button onClick={() => setEditing(true)} className="border border-stone-200 hover:border-stone-300 text-stone-600 rounded-lg px-4 py-2 text-sm font-semibold transition-colors flex-shrink-0">Edit</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-stone-400 uppercase tracking-wide mb-1">Value</div>
          <div className="font-serif font-bold text-orange-500">{deal.value ? `₹${Number(deal.value).toLocaleString('en-IN')}` : '—'}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-stone-400 uppercase tracking-wide mb-1">Assigned To</div>
          <div className="font-serif font-bold text-stone-800">{deal.team_members?.name || 'Unassigned'}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-stone-400 uppercase tracking-wide mb-1">Client</div>
          <div className="text-sm font-semibold text-stone-800">{deal.client_name || '—'}</div>
          {deal.client_contact && <div className="text-xs text-stone-500">{deal.client_contact}</div>}
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-stone-400 uppercase tracking-wide mb-1">Expected Close</div>
          <div className="text-sm font-semibold text-stone-800">{deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString('en-IN') : '—'}</div>
        </div>
      </div>

      {deal.notes && (
        <div className="mb-6">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Notes</div>
          <p className="text-sm text-stone-600 bg-white border border-stone-200 rounded-xl p-4">{deal.notes}</p>
        </div>
      )}

      <div>
        <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Documents</div>
        <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100 mb-3">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <button onClick={() => viewDoc(d.id)} className="text-stone-700 hover:text-orange-500 font-medium text-left">{d.title}</button>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-stone-400 uppercase">{d.document_type.replace('_', ' ')}</span>
                <button onClick={() => deleteDoc(d.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </div>
            </div>
          ))}
          {docs.length === 0 && <div className="px-4 py-6 text-center text-xs text-stone-400">No documents uploaded yet.</div>}
        </div>

        <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-4 space-y-2">
          <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Document title" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400" />
          <div className="flex gap-2">
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-2 text-sm">
              <option value="contract">Contract</option>
              <option value="lease_agreement">Lease Agreement</option>
              <option value="title_deed">Title Deed</option>
              <option value="noc">NOC</option>
              <option value="other">Other</option>
            </select>
            <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} className="flex-1 text-xs" />
          </div>
          <button onClick={upload} disabled={uploading || !docFile || !docTitle.trim()} className="text-xs bg-stone-900 text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-40">
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </div>
    </div>
  );
}
