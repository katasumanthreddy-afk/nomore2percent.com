'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Scout { id: number; name: string; phone: string | null; access_token: string; assigned_count: number }

export default function ScoutsClient() {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const load = () => {
    fetch('/api/internal/scouts').then((r) => r.json()).then((d) => { if (d.success) setScouts(d.scouts); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async () => {
    setError('');
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/internal/scouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setForm({ name: '', phone: '' });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number, name: string) => {
    if (!confirm(`Remove "${name}"? Their link will stop working.`)) return;
    await fetch(`/api/internal/scouts/${id}`, { method: 'DELETE' });
    load();
  };

  const copyLink = (scout: Scout) => {
    const link = `${origin}/scout/${scout.access_token}`;
    const message = `Hi ${scout.name}, here are the locations we're looking to find a property near: ${link}`;
    navigator.clipboard.writeText(message);
    setCopiedId(scout.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const inputClass = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400";

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link href="/internal/requirements" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Site Requirements</Link>

      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-2xl font-bold text-stone-900">External Scouts & Brokers</h1>
        <button onClick={() => setShowForm((s) => !s)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors">
          {showForm ? 'Cancel' : '+ Add Scout'}
        </button>
      </div>
      <p className="text-stone-500 text-sm mb-6">People outside your team who don&apos;t need a portal login — just a private link to see what they've been assigned to search for.</p>

      {showForm && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" className={inputClass} />
            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone (optional)" className={inputClass} />
          </div>
          {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">{error}</div>}
          <button onClick={submit} disabled={saving} className="bg-stone-900 text-white rounded-lg px-5 py-2 text-sm font-bold hover:bg-stone-800 transition-colors disabled:opacity-50">
            {saving ? 'Adding...' : 'Add Scout'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="h-40 bg-stone-200 rounded-xl animate-pulse" />
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
          {scouts.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div>
                <div className="text-sm font-semibold text-stone-800">{s.name}</div>
                <div className="text-xs text-stone-500">{s.phone || 'No phone on file'} · {s.assigned_count} assigned</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => copyLink(s)} className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg px-3 py-1.5 font-semibold transition-colors">
                  {copiedId === s.id ? '✓ Copied' : 'Copy WhatsApp Message'}
                </button>
                <button onClick={() => remove(s.id, s.name)} className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-3 py-1.5 hover:bg-red-100 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
          {scouts.length === 0 && (
            <div className="p-14 text-center text-sm text-stone-400">No external scouts added yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
