'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { parseCoordList } from '@/lib/parse-coord-list';

export default function RequirementsBulkImportClient() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [radiusMin, setRadiusMin] = useState('500');
  const [radiusMax, setRadiusMax] = useState('1000');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const rows = useMemo(() => parseCoordList(text), [text]);
  const validRows = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

  const importAll = async () => {
    setError('');
    if (validRows.length === 0) { setError('No valid coordinates to import.'); return; }
    setImporting(true);
    try {
      const res = await fetch('/api/internal/requirements/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements: validRows.map((r) => ({ title: r.title, lat: r.lat, lng: r.lng })),
          radius_min_m: parseInt(radiusMin) || 500,
          radius_max_m: parseInt(radiusMax) || 1000,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Import failed.'); setImporting(false); return; }
      setResult(`Added ${data.created} site requirements.`);
      setTimeout(() => router.push('/internal/requirements'), 1200);
    } catch {
      setError('Something went wrong. Please try again.');
      setImporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Link href="/internal/requirements" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Site Requirements</Link>
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Bulk Import Site Requirements</h1>
      <p className="text-stone-500 text-sm mb-6">
        Paste your list of target locations. Each becomes a search zone on the map — properties you add later are automatically flagged when they fall inside one.
      </p>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Min Radius (meters)</label>
            <input type="number" value={radiusMin} onChange={(e) => setRadiusMin(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Max Radius (meters)</label>
            <input type="number" value={radiusMax} onChange={(e) => setRadiusMax(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400" />
          </div>
        </div>
        <p className="text-[11px] text-stone-400 -mt-2">Applies to every location in this batch — e.g. 500 / 1000 for a 500m–1km search radius. You can adjust per-location afterward if needed.</p>

        <div>
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Paste Your List</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 h-48 font-mono"
            placeholder={'26. Khaitlapur\nLAT: 17.46884 | LONG: 78.41343\n\n27. Chaitanyapuri\nLAT: 17.37385 | LONG: 78.541406'}
          />
          <p className="text-[11px] text-stone-400 mt-1.5">
            Title line followed by a <code className="bg-stone-100 px-1 rounded">LAT: .. | LONG: ..</code> line, or everything on one line as <code className="bg-stone-100 px-1 rounded">Title, latitude, longitude</code>. Decimal degrees only.
          </p>
        </div>

        {rows.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-semibold text-emerald-600">{validRows.length} ready to import</span>
              {invalidRows.length > 0 && <span className="text-xs font-semibold text-red-500">{invalidRows.length} couldn't be parsed</span>}
            </div>
            <div className="border border-stone-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={`border-b border-stone-100 last:border-0 ${!r.valid ? 'bg-red-50' : ''}`}>
                      <td className="px-3 py-1.5 text-stone-400 w-6">{r.valid ? '✓' : '✕'}</td>
                      <td className="px-3 py-1.5 text-stone-700">{r.title || <span className="text-stone-400 italic">Untitled</span>}</td>
                      <td className="px-3 py-1.5 text-stone-500 font-mono">{r.valid ? `${r.lat}, ${r.lng}` : r.raw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
        {result && <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{result} Redirecting to the map...</div>}

        <button
          onClick={importAll}
          disabled={importing || validRows.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-lg py-3 text-sm font-bold transition-colors"
        >
          {importing ? 'Importing...' : `Import ${validRows.length || ''} Location${validRows.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}
