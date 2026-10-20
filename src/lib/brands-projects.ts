// Shared definitions for Brands (demand side) and Projects
// (landowner + brand + site, from first interest to rent).

export const BRAND_CATEGORIES: { value: string; label: string }[] = [
  { value: 'quick_commerce', label: 'Quick commerce' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'retail', label: 'Retail' },
  { value: 'other', label: 'Other' },
];

export const BRAND_STATUSES: { value: string; label: string; badge: string }[] = [
  { value: 'active', label: 'Active', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'prospect', label: 'Prospect', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'paused', label: 'Paused', badge: 'bg-stone-100 text-stone-500 border-stone-200' },
];

// Columns a brand form may write. Anything else in a request body is ignored.
export const BRAND_FIELDS = [
  'name', 'category', 'status', 'contact_name', 'contact_role', 'contact_phone', 'contact_email', 'notes',
  'min_land_sq_yds', 'min_builtup_sqft', 'max_builtup_sqft', 'min_road_width_ft', 'min_frontage_ft',
  'min_ceiling_ft', 'power_kva', 'rent_min_per_sqft', 'rent_max_per_sqft', 'lease_years', 'spec_notes',
] as const;

export const BRAND_NUMERIC_FIELDS = new Set<string>([
  'min_land_sq_yds', 'min_builtup_sqft', 'max_builtup_sqft', 'min_road_width_ft', 'min_frontage_ft',
  'min_ceiling_ft', 'power_kva', 'rent_min_per_sqft', 'rent_max_per_sqft', 'lease_years',
]);

// Keeps only known brand columns, turning '' into null and numbers into numbers.
export function cleanBrandBody(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of BRAND_FIELDS) {
    if (!(k in body)) continue;
    const v = body[k];
    if (v === '' || v === undefined) { out[k] = null; continue; }
    if (BRAND_NUMERIC_FIELDS.has(k)) {
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      out[k] = Number.isFinite(n) ? n : null;
    } else {
      out[k] = typeof v === 'string' ? v.trim() : v;
    }
  }
  return out;
}


export const PROJECT_STAGES: { value: string; label: string; short: string }[] = [
  { value: 'brand_interested', label: 'Brand interested', short: 'Interest' },
  { value: 'site_approved', label: 'Site approved by brand', short: 'Site OK' },
  { value: 'term_sheet', label: 'Term sheet', short: 'Terms' },
  { value: 'construction_contract', label: 'Construction contract', short: 'Contract' },
  { value: 'permissions', label: 'Permissions', short: 'Permits' },
  { value: 'construction', label: 'Under construction', short: 'Building' },
  { value: 'handover', label: 'Handover to brand', short: 'Handover' },
  { value: 'lease_registered', label: 'Lease registered', short: 'Registered' },
  { value: 'rent_started', label: 'Rent started', short: 'Live' },
];
export const DROPPED = { value: 'dropped', label: 'Dropped' };
export const ALL_STAGE_VALUES = [...PROJECT_STAGES.map((s) => s.value), DROPPED.value];

export function stageLabel(v: string) {
  return PROJECT_STAGES.find((s) => s.value === v)?.label || (v === 'dropped' ? 'Dropped' : v);
}
export function stageIndex(v: string) {
  return PROJECT_STAGES.findIndex((s) => s.value === v);
}

// Default checklist seeded on every new project. Editable per project.
export const CHECKLIST_TEMPLATE: Record<string, string[]> = {
  brand_interested: [
    'Site pin and photos shared with the brand',
    "Brand's site spec sheet received",
    'Landowner confirms willingness to build',
  ],
  site_approved: [
    'Brand site visit done',
    'Brand approval received in writing',
    'Title documents collected (sale deed, EC, pattadar passbook)',
    'Title verified',
  ],
  term_sheet: [
    'Rent per sq ft agreed',
    'Lease term and escalation agreed',
    'Construction funding agreed (landowner / loan)',
    'Term sheet signed by brand and landowner',
    'Our fee agreement signed',
  ],
  construction_contract: [
    'Builder quotes collected',
    'Drawings prepared to brand spec',
    'Construction contract signed',
    'Payment schedule agreed',
  ],
  permissions: [
    'Building permission (GHMC / HMDA / panchayat)',
    'Land-use conversion, if agricultural',
    'Electricity load sanction',
    'Fire NOC, if applicable',
    'Trade licence',
  ],
  construction: [
    'Construction started',
    'Structure complete',
    'Electrical, flooring and shutters to spec',
    'Brand fit-out inspection passed',
  ],
  handover: [
    'Snag list closed',
    'Handover note signed by brand',
  ],
  lease_registered: [
    'Lease deed drafted and reviewed',
    'Stamp duty and registration fee paid',
    'Lease registered at SRO',
  ],
  rent_started: [
    'First rent received by landowner',
    'Our fee invoiced',
    'Our fee received',
  ],
};

// ── Spec matching ────────────────────────────────────────────

export interface Spec {
  min_land_sq_yds?: number | null;
  min_builtup_sqft?: number | null;
  min_road_width_ft?: number | null;
  rent_max_per_sqft?: number | null;
}

// A requirement's own values win; anything it leaves blank falls back to the brand.
export function effectiveSpec(requirement: Spec | null | undefined, brand: Spec | null | undefined): Spec {
  const pick = (k: keyof Spec) => (requirement?.[k] ?? brand?.[k] ?? null);
  return {
    min_land_sq_yds: pick('min_land_sq_yds'),
    min_builtup_sqft: pick('min_builtup_sqft'),
    min_road_width_ft: pick('min_road_width_ft'),
    rent_max_per_sqft: pick('rent_max_per_sqft'),
  };
}

export interface FitResult { fits: boolean; issues: string[]; unknown: string[] }

// Compares a candidate site (property or land lead) with a spec. "unknown"
// means the site is missing that detail, which is a question to ask the
// owner, not a reason to reject.
export function checkFit(spec: Spec, site: { land_sq_yds?: number | null; builtup_sqft?: number | null; road_width_ft?: number | null }): FitResult {
  const issues: string[] = [];
  const unknown: string[] = [];
  if (spec.min_land_sq_yds) {
    if (site.land_sq_yds == null) unknown.push('land size');
    else if (site.land_sq_yds < spec.min_land_sq_yds) issues.push(`land ${Math.round(site.land_sq_yds)} < ${spec.min_land_sq_yds} sq yds`);
  }
  if (spec.min_builtup_sqft && site.builtup_sqft != null && site.builtup_sqft < spec.min_builtup_sqft) {
    issues.push(`built-up ${Math.round(site.builtup_sqft)} < ${spec.min_builtup_sqft} sq ft`);
  }
  if (spec.min_road_width_ft) {
    if (site.road_width_ft == null) unknown.push('road width');
    else if (site.road_width_ft < spec.min_road_width_ft) issues.push(`road ${site.road_width_ft} < ${spec.min_road_width_ft} ft`);
  }
  return { fits: issues.length === 0, issues, unknown };
}

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}
export const STUCK_AFTER_DAYS = 14;

// One-line summary of a brand or requirement spec.
export function specLine(b: { min_land_sq_yds?: number | null; min_builtup_sqft?: number | null; min_road_width_ft?: number | null; rent_min_per_sqft?: number | null; rent_max_per_sqft?: number | null }) {
  const parts: string[] = [];
  if (b.min_land_sq_yds) parts.push(`${Number(b.min_land_sq_yds).toLocaleString('en-IN')}+ sq yds land`);
  if (b.min_builtup_sqft) parts.push(`${Number(b.min_builtup_sqft).toLocaleString('en-IN')}+ sq ft built`);
  if (b.min_road_width_ft) parts.push(`${b.min_road_width_ft}+ ft road`);
  if (b.rent_min_per_sqft || b.rent_max_per_sqft) parts.push(`₹${b.rent_min_per_sqft ?? '?'}–${b.rent_max_per_sqft ?? '?'}/sq ft`);
  return parts.join(' · ');
}


// Columns a project form may write.
const PROJECT_TEXT = ['name', 'landowner_name', 'landowner_phone', 'locality', 'notes', 'target_handover', 'stage', 'dropped_reason'];
const PROJECT_TEXT_EXTRA = ['builder_name', 'builder_phone', 'construction_funded_by', 'construction_start'];
const PROJECT_NUM = ['brand_id', 'requirement_id', 'property_id', 'land_lead_id', 'land_sq_yds', 'builtup_sqft', 'rent_per_sqft', 'lease_years', 'assigned_to', 'contract_value', 'construction_progress'];

export function cleanProjectBody(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of [...PROJECT_TEXT, ...PROJECT_TEXT_EXTRA, ...PROJECT_NUM]) {
    if (!(k in body)) continue;
    const v = body[k];
    if (v === '' || v === null || v === undefined) { out[k] = null; continue; }
    if (PROJECT_NUM.includes(k)) {
      const n = Number(v);
      out[k] = Number.isFinite(n) ? n : null;
    } else {
      out[k] = typeof v === 'string' ? v.trim() : v;
    }
  }
  if (typeof out.construction_progress === 'number') {
    out.construction_progress = Math.max(0, Math.min(100, Math.round(out.construction_progress)));
  }
  if (out.construction_funded_by && !['landowner', 'loan', 'brand', 'mixed', 'other'].includes(String(out.construction_funded_by))) {
    out.construction_funded_by = null;
  }
  return out;
}

// ── Construction ─────────────────────────────────────────────

export const FUNDED_BY: { value: string; label: string }[] = [
  { value: 'landowner', label: 'Landowner (own funds)' },
  { value: 'loan', label: 'Landowner (bank loan)' },
  { value: 'brand', label: 'Brand' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'other', label: 'Other' },
];

// Stages where construction is (or should be) under way, and after.
const BUILD_STAGES = ['construction', 'handover'];
const AFTER_BUILD = ['lease_registered', 'rent_started'];

export interface ScheduleStatus { kind: 'none' | 'on_track' | 'behind' | 'late' | 'done'; expected: number | null; label: string }

// "late": target handover has passed and the site isn't handed over.
// "behind": actual progress trails a straight-line schedule from start to
// target by more than 15 points. A simple yardstick, not a Gantt chart.
export function scheduleStatus(p: {
  stage: string; construction_start?: string | null; target_handover?: string | null; construction_progress?: number | null;
}, now = Date.now()): ScheduleStatus {
  const progress = p.construction_progress ?? 0;
  if (AFTER_BUILD.includes(p.stage) || progress >= 100) return { kind: 'done', expected: null, label: 'Built' };
  if (!p.target_handover) return { kind: 'none', expected: null, label: 'No target date' };
  const target = Date.parse(p.target_handover);
  if (now > target + 86_400_000 && p.stage !== 'dropped') {
    const days = Math.floor((now - target) / 86_400_000);
    return { kind: 'late', expected: 100, label: `${days}d past handover date` };
  }
  if (!BUILD_STAGES.includes(p.stage) || !p.construction_start) return { kind: 'none', expected: null, label: 'Not started' };
  const start = Date.parse(p.construction_start);
  if (target <= start) return { kind: 'none', expected: null, label: 'Check dates' };
  const expected = Math.max(0, Math.min(100, Math.round(((now - start) / (target - start)) * 100)));
  if (progress + 15 < expected) return { kind: 'behind', expected, label: `${progress}% done, ~${expected}% expected` };
  return { kind: 'on_track', expected, label: `${progress}% done, on track` };
}

// ── Fees ─────────────────────────────────────────────────────

export const FEE_TYPES: { value: string; label: string }[] = [
  { value: 'brokerage', label: 'Lease brokerage' },
  { value: 'construction_mgmt', label: 'Construction management' },
  { value: 'permissions', label: 'Permissions / liaison' },
  { value: 'other', label: 'Other' },
];
export const FEE_PAYERS: { value: string; label: string }[] = [
  { value: 'landowner', label: 'Landowner' },
  { value: 'brand', label: 'Brand' },
  { value: 'builder', label: 'Builder' },
  { value: 'other', label: 'Other' },
];
export const FEE_BASES: { value: string; label: string }[] = [
  { value: 'fixed', label: 'Fixed amount' },
  { value: 'months_rent', label: 'Months of rent' },
  { value: 'percent_contract', label: '% of construction contract' },
];
export const FEE_STATUSES: { value: string; label: string; badge: string }[] = [
  { value: 'expected', label: 'Expected', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'invoiced', label: 'Invoiced', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'received', label: 'Received', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'written_off', label: 'Written off', badge: 'bg-stone-100 text-stone-500 border-stone-200' },
];

export function monthlyRent(p: { rent_per_sqft?: number | null; builtup_sqft?: number | null }): number | null {
  return p.rent_per_sqft && p.builtup_sqft ? Number(p.rent_per_sqft) * Number(p.builtup_sqft) : null;
}

// Suggested amount from the basis; null when the project lacks the numbers.
export function suggestFee(basis: string, basisValue: number | null, p: { rent_per_sqft?: number | null; builtup_sqft?: number | null; contract_value?: number | null }): number | null {
  if (basisValue == null || !Number.isFinite(basisValue)) return null;
  if (basis === 'months_rent') { const m = monthlyRent(p); return m ? Math.round(m * basisValue) : null; }
  if (basis === 'percent_contract') return p.contract_value ? Math.round(Number(p.contract_value) * basisValue / 100) : null;
  return null;
}

export function isOverdue(f: { status: string; due_date?: string | null }, now = Date.now()) {
  return (f.status === 'expected' || f.status === 'invoiced') && !!f.due_date && Date.parse(f.due_date) + 86_400_000 < now;
}

export function inr(n: number | null | undefined): string {
  if (n == null) return '–';
  const v = Number(n);
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

// Totals for the fees page and dashboard. Quarter boundaries (Jan/Apr/Jul/Oct)
// are the same for calendar and Indian fiscal quarters.
export function feeSummary(fees: { status: string; amount: number; received_amount?: number | null; received_at?: string | null; due_date?: string | null }[], now = new Date()) {
  const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).getTime();
  let receivedThisQuarter = 0, invoiced = 0, expected = 0, overdue = 0, overdueCount = 0;
  for (const f of fees) {
    const amt = Number(f.amount) || 0;
    if (f.status === 'received' && f.received_at && Date.parse(f.received_at) >= qStart) receivedThisQuarter += Number(f.received_amount ?? amt);
    if (f.status === 'invoiced') invoiced += amt;
    if (f.status === 'expected') expected += amt;
    if (isOverdue(f, now.getTime())) { overdue += amt; overdueCount++; }
  }
  return { receivedThisQuarter, invoiced, expected, overdue, overdueCount };
}
