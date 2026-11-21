'use client';

import { useState } from 'react';
import { Check, Copy, Link2, Share2 } from 'lucide-react';
import { leaseListingUrl } from '@/lib/lease-listing';

/** The public "send us a property for lease" link, ready to copy or send
 *  on WhatsApp. An optional name tags submissions with who it went to. */
export default function ShareListingLink() {
  const [by, setBy] = useState('');
  const [copied, setCopied] = useState(false);
  // Always the live site, even when viewed on a preview deploy.
  const origin = 'https://nomore2percent.com';
  const url = leaseListingUrl(origin, by);
  const message = `Have a shop, warehouse, plot or building for lease in Hyderabad? Share it with us here (takes 2 minutes):\n${url}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  return (
    <div className="bg-white border border-stone-200/80 rounded-xl shadow-[0_1px_2px_rgba(28,25,23,0.04)] p-4 mb-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-stone-900"><Link2 className="w-4 h-4 text-orange-500" /> Collect properties with a link</div>
      <p className="text-xs text-stone-500 mt-0.5 mb-3">Anyone with this link can send a property for lease (details, map pin, photos). It lands here as <span className="font-semibold text-violet-700">New submission</span>.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={by} onChange={(e) => setBy(e.target.value)} placeholder="Sending to (optional), e.g. Ravi broker" className="sm:w-56 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400" aria-label="Who you are sending the link to" />
        <div className="flex-1 min-w-0 flex items-center gap-2 border border-stone-200 bg-stone-50 rounded-lg px-3 py-2 text-xs font-mono text-stone-700">
          <span className="truncate">{url}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-stone-300">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">
            <Share2 className="w-3.5 h-3.5" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
