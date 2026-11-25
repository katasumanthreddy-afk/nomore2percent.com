import { NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { costSummary } from '@/lib/construction-costs';
import { scheduleStatus } from '@/lib/brands-projects';

/* eslint-disable @typescript-eslint/no-explicit-any */
const one = (v: any) => (Array.isArray(v) ? v[0] : v) ?? null;

// GET /api/internal/construction — every project with a build in progress
// (or a construction contract / budget), with schedule and cost status.
export async function GET() {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });

  const { data: projects, error } = await supabaseInternalAdmin
    .from('projects')
    .select('id, name, stage, builder_name, builder_phone, contract_value, construction_start, target_handover, construction_progress, updated_at, brands(id, name)')
    .in('stage', ['construction_contract', 'permissions', 'construction', 'handover', 'lease_registered', 'rent_started'])
    .order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  const ids = (projects || []).map((p) => p.id);
  const [lines, expenses, updates] = ids.length ? await Promise.all([
    supabaseInternalAdmin.from('construction_budget_lines').select('project_id, category, amount').in('project_id', ids),
    supabaseInternalAdmin.from('construction_expenses').select('project_id, category, amount, payment_status, expense_date').in('project_id', ids),
    supabaseInternalAdmin.from('construction_updates').select('project_id, note, progress, created_at').in('project_id', ids).order('created_at', { ascending: false }),
  ]) : [{ data: [] }, { data: [] }, { data: [] }] as any[];
  const costsReady = !lines.error && !expenses.error;

  const rows = (projects || []).map((p) => {
    const pl = costsReady ? (lines.data || []).filter((l: any) => l.project_id === p.id) : [];
    const pe = costsReady ? (expenses.data || []).filter((e: any) => e.project_id === p.id) : [];
    const lastUpdate = (updates.data || []).find((u: any) => u.project_id === p.id) || null;
    const cost = costSummary(pl, pe, { contractValue: p.contract_value, progress: p.construction_progress });
    return {
      id: p.id, name: p.name, stage: p.stage, brand: one(p.brands)?.name ?? null,
      builder_name: p.builder_name, builder_phone: p.builder_phone,
      progress: p.construction_progress ?? 0, target_handover: p.target_handover,
      schedule: scheduleStatus(p),
      budget: cost.budget, spent: cost.spent, paid: cost.paid, due: cost.due,
      spent_pct: cost.spentPct, overspending: cost.overspending, projected: cost.projected,
      over_categories: cost.byCategory.filter((c) => c.over).map((c) => c.label),
      last_update: lastUpdate ? { note: lastUpdate.note, progress: lastUpdate.progress, at: lastUpdate.created_at } : null,
    };
  });

  return NextResponse.json({ success: true, costsReady, projects: rows });
}
