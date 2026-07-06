// Baseline ₹/sqft benchmarks for major Hyderabad localities.
// These are rough, indicative figures — NOT live registered transaction data.
// They exist as a sensible starting point when we don't have enough of our own
// listings in an area yet; live comps (see estimateValue below) are blended in
// and given more weight as more of our own data becomes available.
export const LOCALITY_BENCHMARKS: Record<string, number> = {
  'gachibowli': 7500,
  'madhapur': 8500,
  'kondapur': 7000,
  'banjara hills': 12000,
  'jubilee hills': 13000,
  'kokapet': 8000,
  'manikonda': 6000,
  'miyapur': 5000,
  'kukatpally': 5500,
  'hitech city': 8500,
  'hitec city': 8500,
  'financial district': 8000,
  'nizampet': 4800,
  'alwal': 4200,
  'uppal': 4000,
  'secunderabad': 6500,
  'kompally': 4500,
  'begumpet': 9000,
  'somajiguda': 9500,
  'ameerpet': 6000,
};

const DEFAULT_BENCHMARK = 5500;

const PROPERTY_TYPE_MULTIPLIER: Record<string, number> = {
  apartment: 1,
  villa: 1.2,
  plot: 0.85,
  commercial: 1.3,
};

function ageMultiplier(ageYears: number): number {
  if (ageYears <= 2) return 1.05;
  if (ageYears <= 5) return 1;
  if (ageYears <= 10) return 0.95;
  return 0.88;
}

export function getBenchmarkRate(area: string): number {
  const key = area.trim().toLowerCase();
  return LOCALITY_BENCHMARKS[key] || DEFAULT_BENCHMARK;
}

export interface ValuationInput {
  area: string;
  property_type: 'apartment' | 'villa' | 'plot' | 'commercial';
  sqft: number;
  age_years: number;
  live_comp_avg?: number | null;
  live_comp_count?: number;
}

export interface ValuationResult {
  estimated_low: number;
  estimated_high: number;
  estimated_mid: number;
  rate_per_sqft_used: number;
  benchmark_rate: number;
  used_live_data: boolean;
  live_comp_count: number;
}

export function estimateValue(input: ValuationInput): ValuationResult {
  const benchmarkRate = getBenchmarkRate(input.area);

  // Blend our own listings' average price/sqft into the benchmark once we have
  // at least 2 comparable active listings in the same area — weighted by how
  // many comps we actually have, capped so a handful of comps don't overcorrect.
  let rate = benchmarkRate;
  let usedLiveData = false;
  const compCount = input.live_comp_count || 0;

  if (input.live_comp_avg && compCount >= 2) {
    const weight = Math.min(compCount / 8, 0.7); // up to 70% weight once we have 8+ comps
    rate = benchmarkRate * (1 - weight) + input.live_comp_avg * weight;
    usedLiveData = true;
  }

  rate *= PROPERTY_TYPE_MULTIPLIER[input.property_type] ?? 1;
  rate *= ageMultiplier(input.age_years);

  const mid = Math.round(rate * input.sqft);
  const low = Math.round(mid * 0.92);
  const high = Math.round(mid * 1.08);

  return {
    estimated_low: low,
    estimated_high: high,
    estimated_mid: mid,
    rate_per_sqft_used: Math.round(rate),
    benchmark_rate: benchmarkRate,
    used_live_data: usedLiveData,
    live_comp_count: compCount,
  };
}

export function formatINR(amount: number): string {
  if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
  if (amount >= 100000) return '₹' + (amount / 100000).toFixed(2).replace(/\.00$/, '') + ' L';
  return '₹' + amount.toLocaleString('en-IN');
}
