'use client';

import { useEffect, useState } from 'react';

interface Note { id: number; note: string; created_at: string; team_members: { id: number; name: string } | null }

export default function NotesTimeline({ propertyId, dealId }: { propertyId?: number; dealId?: number }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [posting, setPosting] = useState(false);

  const load = () => {
    const qs = propertyId ? `property_id=${propertyId}` : `deal_id=${dealId}`;
    fetch(`/api/internal/notes?${qs}`).then((r) => r.json()).then((d) => { if (d.success) setNotes(d.notes); }).finally(() => setLoading(false));
  };
  useEffect(load, [propertyId, dealId]);

  const post = async () => {
    if (!newNote.trim()) return;
    setPosting(true);
    try {
      const res = await fetch('/api/internal/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote, property_id: propertyId, deal_id: dealId }),
      });
      const data = await res.json();
      if (data.success) { setNotes((prev) => [data.note, ...prev]); setNewNote(''); }
      else alert(data.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Activity Notes</div>
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 mb-3 flex gap-2">
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && post()}
          placeholder="Add an update — call notes, status change, anything worth logging"
          className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"
        />
        <button onClick={post} disabled={posting || !newNote.trim()} className="text-xs bg-stone-900 text-white rounded-lg px-4 font-semibold disabled:opacity-40 whitespace-nowrap">
          {posting ? 'Adding...' : 'Add'}
        </button>
      </div>

      {loading ? (
        <div className="h-16 bg-stone-100 rounded-xl animate-pulse" />
      ) : notes.length > 0 ? (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="bg-white border border-stone-200 rounded-xl px-4 py-2.5">
              <p className="text-sm text-stone-700">{n.note}</p>
              <p className="text-[11px] text-stone-400 mt-1">
                {n.team_members?.name || 'Unknown'} · {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-stone-400 px-1">No activity logged yet — this is a running log, not a single field, so nobody's update ever overwrites anyone else's.</p>
      )}
    </div>
  );
}
