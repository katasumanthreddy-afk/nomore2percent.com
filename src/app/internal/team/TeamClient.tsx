'use client';

import { useEffect, useState } from 'react';

interface Member { id: number; name: string; email: string; role: string; status: string }

export default function TeamClient({ currentMemberId }: { currentMemberId: number }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'employee' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    fetch('/api/internal/team').then((r) => r.json()).then((d) => { if (d.success) setMembers(d.members); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async () => {
    setError('');
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/internal/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setForm({ name: '', email: '', role: 'employee' });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const updateMember = async (id: number, patch: Partial<Member>) => {
    await fetch(`/api/internal/team/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    load();
  };

  const removeMember = async (id: number, name: string) => {
    if (!confirm(`Remove "${name}" from the internal team?`)) return;
    const res = await fetch(`/api/internal/team/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) alert(data.message);
    load();
  };

  const inputClass = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400";

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Team & Partners</h1>
        <button onClick={() => setShowForm((s) => !s)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors">
          {showForm ? 'Cancel' : '+ Add Person'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" className={inputClass} />
            <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email (must match sign-in)" className={inputClass} />
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className={inputClass}>
              <option value="employee">Employee</option>
              <option value="partner">Partner</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">{error}</div>}
          <button onClick={submit} disabled={saving} className="bg-stone-900 text-white rounded-lg px-5 py-2 text-sm font-bold hover:bg-stone-800 transition-colors disabled:opacity-50">
            {saving ? 'Adding...' : 'Add to Team'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="h-40 bg-stone-200 rounded-xl animate-pulse" />
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div>
                <div className="text-sm font-semibold text-stone-800">{m.name} {m.id === currentMemberId && <span className="text-xs text-stone-400">(you)</span>}</div>
                <div className="text-xs text-stone-500">{m.email}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select value={m.role} onChange={(e) => updateMember(m.id, { role: e.target.value })} className="text-xs border border-stone-200 rounded px-2 py-1.5">
                  <option value="employee">Employee</option>
                  <option value="partner">Partner</option>
                  <option value="owner">Owner</option>
                </select>
                <select value={m.status} onChange={(e) => updateMember(m.id, { status: e.target.value })} className="text-xs border border-stone-200 rounded px-2 py-1.5">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {m.id !== currentMemberId && (
                  <button onClick={() => removeMember(m.id, m.name)} className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-3 py-1.5 hover:bg-red-100 transition-colors">Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
