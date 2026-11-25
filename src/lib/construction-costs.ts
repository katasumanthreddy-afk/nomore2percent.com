// Construction budget (pricing) and expenses: shared, framework-free logic.

export const COST_CATEGORIES: { value: string; label: string }[] = [
  { value: 'civil', label: 'Civil & structure' },
  { value: 'steel', label: 'Steel' },
  { value: 'cement_materials', label: 'Cement, sand & aggregate' },
  { value: 'labour', label: 'Labour' },
  { value: 'roofing_fabrication', label: 'Roofing & fabrication' },
  { value: 'electrical', label: 'Electrical & power' },
  { value: 'plumbing', label: 'Plumbing & drainage' },
  { value: 'flooring_finishes', label: 'Flooring & finishes' },
  { value: 'doors_shutters', label: 'Shutters, doors & windows' },
  { value: 'permissions', label: 'Permissions & fees' },
  { value: 'design_supervision', label: 'Design & supervision' },
  { value: 'other', label: 'Other' },
];
export const COST_CATEGORY_VALUES = COST_CATEGORIES.map((c) => c.value);
export const categoryLabel = (v: string) => COST_CATEGORIES.find((c) => c.value === v)?.label || v;

export const PAID_BY: { value: string; label: string }[] = [
  { value: 'landowner', label: 'Landowner' },
  { value: 'builder', label: 'Builder' },
  { value: 'us', label: 'nomore2percent' },
  { value: 'brand', label: 'Brand' },
  { value: 'other', label: 'Other' },
];
export const PAID_BY_VALUES = PAID_BY.map((p) => p.value);

export const UNITS = ['sq ft', 'cu ft', 'cu m', 'bags', 'tonnes', 'kg', 'nos', 'rft', 'days', 'lump sum'];

export interface BudgetLine {
  id: number; category: string; description: string | null;
  quantity: number | null; unit: string | null; rate: number | null; amount: number;
}
export interface Expense {
  id: number; category: string; description: string | null; vendor: string | null;
  quantity: number | null; unit: string | null; rate: number | null; amount: number;
  expense_date: string; paid_by: string; payment_status: 'paid' | 'due';
  update_id: number | null; bill_url?: string | null;
  team_members?: { id: number; name: string } | null;
}

const n = (v: unknown) => (v == null || v === '' ? 0 : Number(v) || 0);

/** quantity × rate when both are given, otherwise the typed amount. */
export function lineAmount(quantity: unknown, rate: unknown, amount: unknown): number | null {
  const q = Number(quantity); const r = Number(rate);
  if (quantity !== '' && quantity != null && rate !== '' && rate != null && Number.isFinite(q) && Number.isFinite(r) && q > 0 && r >= 0) {
    return Math.round(q * r * 100) / 100;
  }
  const a = Number(amount);
  return amount !== '' && amount != null && Number.isFinite(a) && a >= 0 ? a : null;
}

export interface CostSummary {
  budget: number; spent: number; paid: number; due: number;
  /** % of budget spent (null without a budget). */
  spentPct: number | null;
  remaining: number | null;
  byCategory: { category: string; label: string; budget: number; spent: number; over: boolean }[];
  /** Spending running well ahead of physical progress. */
  overspending: boolean;
  /** Projected final cost if spend continues at the same rate per % built. */
  projected: number | null;
}

/**
 * Budget vs actual. The budget is the sum of budget lines, or the contract
 * value when no lines are set. "Overspending" = spent% exceeds progress% by
 * more than 10 points (a simple early-warning, not an audit).
 */
export function costSummary(lines: Pick<BudgetLine, 'category' | 'amount'>[], expenses: Pick<Expense, 'category' | 'amount' | 'payment_status'>[], opts: { contractValue?: number | null; progress?: number | null } = {}): CostSummary {
  const lineTotal = lines.reduce((s, l) => s + n(l.amount), 0);
  const budget = lineTotal > 0 ? lineTotal : n(opts.contractValue);
  const spent = expenses.reduce((s, e) => s + n(e.amount), 0);
  const paid = expenses.filter((e) => e.payment_status === 'paid').reduce((s, e) => s + n(e.amount), 0);
  const due = spent - paid;
  const spentPct = budget > 0 ? Math.round((spent / budget) * 100) : null;
  const progress = opts.progress ?? 0;

  const cats = new Set([...lines.map((l) => l.category), ...expenses.map((e) => e.category)]);
  const byCategory = COST_CATEGORIES.filter((c) => cats.has(c.value)).map((c) => {
    const b = lines.filter((l) => l.category === c.value).reduce((s, l) => s + n(l.amount), 0);
    const sp = expenses.filter((e) => e.category === c.value).reduce((s, e) => s + n(e.amount), 0);
    return { category: c.value, label: c.label, budget: b, spent: sp, over: b > 0 && sp > b };
  });
  // Categories not in the list (legacy / custom) still count.
  for (const c of cats) if (!COST_CATEGORY_VALUES.includes(c)) {
    const b = lines.filter((l) => l.category === c).reduce((s, l) => s + n(l.amount), 0);
    const sp = expenses.filter((e) => e.category === c).reduce((s, e) => s + n(e.amount), 0);
    byCategory.push({ category: c, label: c, budget: b, spent: sp, over: b > 0 && sp > b });
  }

  return {
    budget, spent, paid, due, spentPct,
    remaining: budget > 0 ? budget - spent : null,
    byCategory,
    overspending: spentPct != null && progress < 100 && spentPct > progress + 10,
    projected: progress >= 10 && progress < 100 && spent > 0 ? Math.round(spent / (progress / 100)) : null,
  };
}

/** Plain-text progress note for the landowner / brand on WhatsApp. */
export function progressMessage(p: {
  name: string; progress: number; budget: number; spent: number; due: number;
  latestNote?: string | null; targetHandover?: string | null;
}, inr: (v: number) => string) {
  const lines = [
    `*${p.name}*: construction update`,
    `Progress: ${p.progress}% complete`,
    p.budget > 0 ? `Spent so far: ${inr(p.spent)} of ${inr(p.budget)} budget (${Math.round((p.spent / p.budget) * 100)}%)` : `Spent so far: ${inr(p.spent)}`,
    p.due > 0 ? `Pending payments: ${inr(p.due)}` : null,
    p.latestNote ? `Latest: ${p.latestNote}` : null,
    p.targetHandover ? `Target handover: ${new Date(p.targetHandover).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : null,
    '— nomore2percent',
  ];
  return lines.filter(Boolean).join('\n');
}

/** Validates an expense/budget body from the client. */
export function cleanCostBody(body: Record<string, unknown>, kind: 'expense' | 'budget') {
  const str = (v: unknown, max = 300) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  const num = (v: unknown) => { const x = v === '' || v == null ? null : Number(v); return x != null && Number.isFinite(x) && x >= 0 ? x : null; };
  const category = COST_CATEGORY_VALUES.includes(String(body.category)) ? String(body.category) : null;
  const quantity = num(body.quantity);
  const rate = num(body.rate);
  const amount = lineAmount(quantity ?? '', rate ?? '', body.amount);
  const out: Record<string, unknown> = {
    category, description: str(body.description), quantity, unit: str(body.unit, 20), rate, amount,
  };
  if (kind === 'expense') {
    out.vendor = str(body.vendor, 120);
    const d = str(body.expense_date, 10);
    out.expense_date = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : new Date().toISOString().slice(0, 10);
    out.paid_by = PAID_BY_VALUES.includes(String(body.paid_by)) ? String(body.paid_by) : 'landowner';
    out.payment_status = body.payment_status === 'due' ? 'due' : 'paid';
  }
  const error = !category ? 'Choose a category.' : amount == null ? 'Enter an amount, or quantity and rate.' : null;
  return { row: out, error };
}
