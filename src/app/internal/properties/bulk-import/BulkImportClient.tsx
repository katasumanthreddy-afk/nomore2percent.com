'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ParsedRow {
  raw: string;
  title: string;
  lat: number | null;
  lng: number | null;
  valid: boolean;
}

function parseLine(line: string): ParsedRow {
  const trimmed = line.trim();
  const parts = trimmed.split(/\t|,/).map((p) => p.trim()).filter(Boolean);

  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    const valid = !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    return { raw: line, title: '', lat: valid ? lat : null, lng: valid ? lng : null, valid };
  }
  if (parts.length >= 3) {
    const lng = parseFloat(parts[parts.length - 1]);
    const lat = parseFloat(parts[parts.length - 2]);
    const title = parts.slice(0, parts.length - 2).join(', ');
    const valid = !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    return { raw: line, title, lat: valid ? lat : null, lng: valid ? lng : null, valid };
  }
  return { raw: line, title: '', lat: null, lng: null, valid: false };
}

export default function BulkImportClient() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const rows = useMemo(() => {
    return text.split('\n').map((l) => l.trim()).filter(Boolean).map(parseLine);
  }, [text]);

  const validRows = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

  const importAll = async () => {
    setError('');
    if (validRows.length === 0) { setError('No valid coordinates to import.'); return; }
    setImporting(true);
    try {
      const res = await fetch('/api/internal/properties/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: validRows.map((r) => ({ title: r.title, lat: r.lat, lng: r.lng })) }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Import failed.'); setImporting(false); return; }
      setResult(`Added ${data.created} properties.`);
      setTimeout(() => router.push('/internal/properties'), 1200);
    } catch {
      setError('Something went wrong. Please try again.');
      setImporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Link href="/internal/properties" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Properties</Link>
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Bulk Import from Coordinates</h1>
      <p className="text-stone-500 text-sm mb-6">
        Paste one location per line. Each property gets pinned on the map immediately — you can fill in type, price, and other details afterward from its own page.
      </p>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Paste Your List</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 h-40 font-mono"
            placeholder={'Kondapur Site, 17.474417, 78.345472\nKollur Site, 17.466389, 78.259361\n17.4615, 78.3671'}
          />
          <p className="text-[11px] text-stone-400 mt-1.5">
            One per line — <code className="bg-stone-100 px-1 rounded">Title, latitude, longitude</code> or just <code className="bg-stone-100 px-1 rounded">latitude, longitude</code> (title optional). Comma or tab separated — pasting straight from a spreadsheet works too. Decimal degrees only, not DMS format.
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
          {importing ? 'Importing...' : `Import ${validRows.length || ''} Propert${validRows.length === 1 ? 'y' : 'ies'}`}
        </button>
      </div>
    </div>
  );
}
