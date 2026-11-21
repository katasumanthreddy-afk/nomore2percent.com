'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Inbox } from 'lucide-react';

/** Banner on a property that came in through the public lease link. */
export default function SubmissionReview({ propertyId, ownerName, ownerPhone }: { propertyId: number; ownerName?: string | null; ownerPhone?: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const setStatus = async (status: string) => {
    setBusy(status); setError('');
    try {
      const d = await fetch(`/api/internal/properties/${propertyId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      }).then((r) => r.json());
      if (!d.success) { setError(d.message || 'Could not update.'); return; }
      router.refresh();
    } catch {
      setError('Could not update. Check your connection.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50 p-4">
      <div className="flex items-start gap-3">
        <Inbox className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-violet-900">New submission from the lease link</div>
          <p className="text-xs text-violet-800 mt-0.5">
            Sent by {ownerName || 'someone'}{ownerPhone && <> · <a href={`tel:${ownerPhone}`} className="underline">{ownerPhone}</a> · <a href={`https://wa.me/91${ownerPhone}`} target="_blank" rel="noopener noreferrer" className="underline">WhatsApp</a></>}.
            Check the details and pin, then approve it.
          </p>
          {error && <p className="text-xs text-red-700 mt-1 font-semibold">{error}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={() => setStatus('available')} disabled={!!busy} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 disabled:opacity-60">{busy === 'available' ? 'Saving…' : 'Approve as available'}</button>
            <button onClick={() => setStatus('off_market')} disabled={!!busy} className="rounded-lg border border-stone-300 bg-white text-stone-700 text-xs font-semibold px-3.5 py-2 disabled:opacity-60">{busy === 'off_market' ? 'Saving…' : 'Not suitable'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
