'use client';

import { useEffect, useMemo, useState } from 'react';
import { parseCoordList, type ParsedCoordRow } from '@/lib/parse-coord-list';

export interface BulkSitesValue {
  rows: ParsedCoordRow[];          // valid rows only
  radius_min_m: number;
  radius_max_m: number;
  priority: string;
  target_date: string;
}

// Paste box for many site locations at once: numbered "LAT | LONG" lists,
// "Title, lat, lng" lines, or Google Maps links. Shows a live preview and
// reports the valid rows + batch settings to the parent.
export default function BulkSitesInput({ onChange, compact = false }: { onChange: (v: BulkSitesValue) => void; compact?: boolean }) {
  const [text, setText] = useState('');
  const [radiusMin, setRadiusMin] = useState('500');
  const [radiusMax, setRadiusMax] = useState('1000');
  const [priority, setPriority] = useState('normal');
  const [targetDate, setTargetDate] = useState('');

  const rows = useMemo(() => parseCoordList(text), [text]);
  const valid = useMemo(() => rows.filter((r) => r.valid), [rows]);
  const invalid = rows.length - valid.length;

  useEffect(() => {
    onChange({
      rows: valid,
      radius_min_m: parseInt(radiusMin) || 500,
      radius_max_m: parseInt(radiusMax) || 1000,
      priority,
      target_date: targetDate,
    });
  }, [valid, radiusMin, radiusMax, priority, targetDate, onChange]);

  const inputClass = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 bg-white';
  const labelClass = 'text-[11px] font-semibold text-stone-500 uppercase tracking-wide mb-1 block';

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={`${inputClass} font-mono ${compact ? 'h-32' : 'h-44'}`}
        placeholder={'26. Khaitlapur\nLAT: 17.46884 | LONG: 78.41343\n\nTelecom Nagar, 17.4402, 78.3601\nHafeezpet https://www.google.com/maps/place/…/@17.48,78.35,15z'}
      />
      <p className="text-[11px] text-stone-400 -mt-1">
        One site per entry: a name line then <code className="bg-stone-100 px-1 rounded">LAT: .. | LONG: ..</code>, or <code className="bg-stone-100 px-1 rounded">Name, latitude, longitude</code>, or a name followed by a full Google Maps link.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><label className={labelClass}>Min radius (m)</label><input type="number" value={radiusMin} onChange={(e) => setRadiusMin(e.target.value)} className={inputClass} /></div>
        <div><label className={labelClass}>Max radius (m)</label><input type="number" value={radiusMax} onChange={(e) => setRadiusMax(e.target.value)} className={inputClass} /></div>
        <div>
          <label className={labelClass}>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div><label className={labelClass}>Wanted by</label><input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={inputClass} /></div>
      </div>

      {rows.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-1.5 text-xs font-semibold">
            <span className="text-emerald-600">{valid.length} site{valid.length === 1 ? '' : 's'} ready</span>
            {invalid > 0 && <span className="text-red-500">{invalid} need fixing</span>}
          </div>
          <div className="border border-stone-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto bg-white">
            <table className="w-full text-xs">
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-b border-stone-100 last:border-0 ${!r.valid ? 'bg-red-50' : ''}`}>
                    <td className="px-2.5 py-1.5 w-5 text-stone-400">{r.valid ? '✓' : '✕'}</td>
                    <td className="px-2.5 py-1.5 text-stone-700">{r.title || <span className="text-stone-400 italic">No name (will use coordinates)</span>}</td>
                    <td className="px-2.5 py-1.5 text-stone-500 font-mono">{r.valid ? `${r.lat}, ${r.lng}` : <span className="text-red-600 font-sans">{r.error || 'Could not read coordinates'}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
