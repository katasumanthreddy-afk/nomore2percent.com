'use client';

import { useState } from 'react';
import Link from 'next/link';
import PropertyForm from '@/components/internal/PropertyForm';
import NotesTimeline from '@/components/internal/NotesTimeline';

interface Property {
  id: number; title: string; address: string | null; area: string | null;
  property_type: string; deal_type: string; status: string;
  price: number | null; price_label: string | null; lease_rate: number | null; lease_rate_label: string | null;
  sqft: number | null; zoning: string | null; cap_rate: number | null; tenant_name: string | null; lease_expiry: string | null;
  notes: string | null; lat: number | null; lng: number | null;
}
interface Deal { id: number; deal_name: string; stage: string }
interface Doc { id: number; title: string; document_type: string; created_at: string }
interface Photo { id: number; url: string | null; is_primary: boolean }

const STATUS_BADGE: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  under_negotiation: 'bg-amber-50 text-amber-600 border-amber-200',
  closed: 'bg-stone-100 text-stone-500 border-stone-200',
  off_market: 'bg-red-50 text-red-600 border-red-200',
};

export default function PropertyDetailClient({ property, deals, documents, matchingRequirements, photos }: { property: Property; deals: Deal[]; documents: Doc[]; matchingRequirements?: { id: number; title: string; status: string }[]; photos?: Photo[] }) {
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
      fd.append('property_id', String(property.id));
      const res = await fetch('/api/internal/documents', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setDocs((prev) => [data.document, ...prev]);
        setDocTitle(''); setDocFile(null);
      } else {
        alert(data.message);
      }
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
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">Edit Property</h1>
        <PropertyForm
          mode="edit"
          propertyId={property.id}
          initialData={{
            title: property.title, address: property.address || '', area: property.area || '',
            lat: property.lat, lng: property.lng,
            property_type: property.property_type, deal_type: property.deal_type,
            price: property.price != null ? String(property.price) : '', price_label: property.price_label || '',
            lease_rate: property.lease_rate != null ? String(property.lease_rate) : '', lease_rate_label: property.lease_rate_label || '',
            sqft: property.sqft != null ? String(property.sqft) : '', zoning: property.zoning || '',
            cap_rate: property.cap_rate != null ? String(property.cap_rate) : '', tenant_name: property.tenant_name || '',
            lease_expiry: property.lease_expiry || '', status: property.status, notes: property.notes || '',
          }}
          initialPhotos={photos}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link href="/internal/properties" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Properties</Link>

      {photos && photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-6">
          {photos.map((p) => p.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.id} src={p.url} alt="" className="aspect-square object-cover rounded-lg" />
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">{property.title}</h1>
          <p className="text-stone-500 text-sm capitalize">{property.area} · {property.property_type} · {property.deal_type}</p>
        </div>
        <button onClick={() => setEditing(true)} className="border border-stone-200 hover:border-stone-300 text-stone-600 rounded-lg px-4 py-2 text-sm font-semibold transition-colors flex-shrink-0">Edit</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-stone-400 uppercase tracking-wide mb-1">{property.deal_type === 'lease' ? 'Lease Rate' : 'Price'}</div>
          <div className="font-serif font-bold text-orange-500">{property.deal_type === 'lease' ? (property.lease_rate_label || '—') : (property.price_label || '—')}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-stone-400 uppercase tracking-wide mb-1">Sqft</div>
          <div className="font-serif font-bold text-stone-800">{property.sqft || '—'}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-stone-400 uppercase tracking-wide mb-1">Status</div>
          <span className={`text-[11px] font-bold uppercase px-2 py-1 rounded-full border ${STATUS_BADGE[property.status] || ''}`}>{property.status?.replace('_', ' ')}</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="text-xs text-stone-400 uppercase tracking-wide mb-1">Zoning</div>
          <div className="font-serif font-bold text-stone-800">{property.zoning || '—'}</div>
        </div>
      </div>

      {property.deal_type === 'lease' && (property.tenant_name || property.lease_expiry) && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6 text-sm">
          {property.tenant_name && <div><strong>Current Tenant:</strong> {property.tenant_name}</div>}
          {property.lease_expiry && <div className="mt-1"><strong>Lease Expiry:</strong> {new Date(property.lease_expiry).toLocaleDateString('en-IN')}</div>}
        </div>
      )}

      {property.notes && (
        <div className="mb-6">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Overview</div>
          <p className="text-sm text-stone-600 bg-white border border-stone-200 rounded-xl p-4">{property.notes}</p>
        </div>
      )}

      <div className="mb-6">
        <NotesTimeline propertyId={property.id} />
      </div>

      {matchingRequirements && matchingRequirements.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Satisfies These Site Requirements</div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl divide-y divide-orange-100">
            {matchingRequirements.map((r) => (
              <Link key={r.id} href={`/internal/requirements/${r.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-orange-100/50 transition-colors text-sm">
                <span className="font-medium text-stone-800">{r.title}</span>
                <span className="text-xs text-orange-600 font-semibold capitalize">{r.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Linked Deals</div>
          <Link href={`/internal/deals/new?property_id=${property.id}`} className="text-xs text-orange-500 font-semibold hover:underline">+ New Deal</Link>
        </div>
        {deals.length > 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
            {deals.map((d) => (
              <Link key={d.id} href={`/internal/deals/${d.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-stone-50 transition-colors text-sm">
                <span className="font-medium text-stone-800">{d.deal_name}</span>
                <span className="text-xs text-stone-500 capitalize">{d.stage?.replace('_', ' ')}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400">No deals linked to this property yet.</p>
        )}
      </div>

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
