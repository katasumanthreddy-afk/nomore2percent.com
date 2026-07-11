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
  'thumkunta': 3800,
  'keesara': 3600,
  'devar yamjal': 3500,
  'shamirpet': 4000,
};

const DEFAULT_BENCHMARK = 5500;

const PROPERTY_TYPE_MULTIPLIER: Record<string, number> = {
  apartment: 1,
  villa: 1.2,
  independent_house: 1.1,
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
  property_type: 'apartment' | 'villa' | 'independent_house' | 'plot' | 'commercial';
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

export interface HealthScore {
  score: number; // 0-100
  band: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';
  factors: { label: string; impact: 'positive' | 'neutral' | 'negative'; note: string }[];
}

/**
 * A directional "how healthy does this property look" score — deliberately
 * simple and explainable rather than a black box, since the factors are shown
 * to the user alongside the score. This is NOT a substitute for a real
 * inspection or professional appraisal; it's a marketing/engagement device
 * built from the same inputs already collected for the valuation estimate.
 */
export function calculateHealthScore(input: ValuationInput, result: ValuationResult): HealthScore {
  let score = 65;
  const factors: HealthScore['factors'] = [];

  // Age
  if (input.age_years <= 2) {
    score += 15;
    factors.push({ label: 'Property age', impact: 'positive', note: 'Newer construction, minimal wear expected' });
  } else if (input.age_years <= 5) {
    score += 8;
    factors.push({ label: 'Property age', impact: 'positive', note: 'Relatively new, in good condition typically' });
  } else if (input.age_years <= 10) {
    factors.push({ label: 'Property age', impact: 'neutral', note: 'Mid-life property, condition varies' });
  } else {
    score -= 10;
    factors.push({ label: 'Property age', impact: 'negative', note: 'Older construction — factor in maintenance costs' });
  }

  // Market position vs benchmark
  const positionRatio = result.rate_per_sqft_used / result.benchmark_rate;
  if (positionRatio >= 1.1) {
    score += 10;
    factors.push({ label: 'Locality strength', impact: 'positive', note: 'Priced above the area benchmark — strong local demand' });
  } else if (positionRatio >= 0.9) {
    score += 5;
    factors.push({ label: 'Locality strength', impact: 'neutral', note: 'In line with the area benchmark' });
  } else {
    score -= 5;
    factors.push({ label: 'Locality strength', impact: 'negative', note: 'Below the area benchmark — worth understanding why' });
  }

  // Data confidence
  if (result.used_live_data && result.live_comp_count >= 4) {
    score += 5;
    factors.push({ label: 'Data confidence', impact: 'positive', note: `Backed by ${result.live_comp_count} comparable live listings` });
  } else if (result.used_live_data) {
    score += 2;
    factors.push({ label: 'Data confidence', impact: 'neutral', note: 'Backed by a small number of live listings' });
  } else {
    factors.push({ label: 'Data confidence', impact: 'neutral', note: 'Based on area benchmark — limited live listings here yet' });
  }

  // Property type
  if (input.property_type === 'villa' || input.property_type === 'independent_house' || input.property_type === 'commercial') {
    score += 3;
    factors.push({ label: 'Property type', impact: 'positive', note: 'Tends to hold value well in this category' });
  } else if (input.property_type === 'plot') {
    score -= 3;
    factors.push({ label: 'Property type', impact: 'negative', note: 'No rental income potential until built' });
  }

  score = Math.max(0, Math.min(100, score));

  const band: HealthScore['band'] =
    score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Needs Attention';

  return { score, band, factors };
}

export function formatINR(amount: number): string {
  if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
  if (amount >= 100000) return '₹' + (amount / 100000).toFixed(2).replace(/\.00$/, '') + ' L';
  return '₹' + amount.toLocaleString('en-IN');
}
