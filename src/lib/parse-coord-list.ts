export interface ParsedCoordRow {
  raw: string;
  title: string;
  lat: number | null;
  lng: number | null;
  valid: boolean;
}

// Handles two real-world paste shapes:
//   1) "26. Khaitlapur" on one line, "LAT: 17.46884 | LONG: 78.41343" on the next
//   2) "Title, lat, lng" or bare "lat, lng" all on a single line
// A blank line, or any line that isn't a title and isn't a coordinate line,
// just gets skipped rather than breaking the whole paste.
export function parseCoordList(text: string): ParsedCoordRow[] {
  const lines = text.split('\n').map((l) => l.trim());
  const results: ParsedCoordRow[] = [];
  let pendingTitle = '';

  const labeledCoordPattern = /LAT[:\s]*(-?[\d.]+)\s*[|,]?\s*LONG[:\s]*(-?[\d.]+)/i;

  for (const line of lines) {
    if (!line) continue;

    const labeled = line.match(labeledCoordPattern);
    if (labeled) {
      const lat = parseFloat(labeled[1]);
      const lng = parseFloat(labeled[2]);
      const valid = !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
      results.push({ raw: line, title: pendingTitle, lat: valid ? lat : null, lng: valid ? lng : null, valid });
      pendingTitle = '';
      continue;
    }

    const parts = line.split(/\t|,/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const lastNum = parseFloat(parts[parts.length - 1]);
      const secondLastNum = parseFloat(parts[parts.length - 2]);
      if (!isNaN(lastNum) && !isNaN(secondLastNum)) {
        const lat = secondLastNum, lng = lastNum;
        const title = parts.length > 2 ? parts.slice(0, -2).join(', ') : pendingTitle;
        const valid = Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
        results.push({ raw: line, title, lat: valid ? lat : null, lng: valid ? lng : null, valid });
        pendingTitle = '';
        continue;
      }
    }

    pendingTitle = line.replace(/^\d+\.\s*/, '');
  }

  return results;
}
