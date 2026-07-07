/**
 * Parses a free-text amount like "45 lakhs", "1.2 Cr", "6500000", or "25,000/mo"
 * into a plain number for numeric database columns. Returns null if nothing
 * numeric could be found, rather than throwing — callers should treat null
 * as "not provided" and store it as such.
 */
export function parseAmount(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return isNaN(input) ? null : input;

  const str = String(input).trim().toLowerCase();
  if (!str) return null;

  const num = parseFloat(str.replace(/,/g, '').replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return null;

  if (str.includes('cr')) return num * 10000000;
  if (str.includes('lakh') || str.includes('l')) return num * 100000;
  return num;
}
