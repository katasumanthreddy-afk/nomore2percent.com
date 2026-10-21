// Builds the "what needs me today" list for the internal dashboard.
// Pure function over plain rows so it can be tested without a database.

import { distanceInMeters } from './geo-utils';
import { STUCK_AFTER_DAYS, daysSince, inr, isOverdue, scheduleStatus, stageLabel } from './brands-projects';
import { scoutLinkState } from './scout-links';

export type Urgency = 'urgent' | 'soon' | 'normal';
export type Group = 'leads' | 'projects' | 'sites' | 'money' | 'admin';

export interface TodayItem {
  key: string;
  group: Group;
  urgency: Urgency;
  title: string;
  detail: string;
  href: string;
  mine: boolean;        // assigned to me, or unassigned (anyone should pick it up)
  sortAt: number;       // lower = earlier in its urgency band
}

export const GROUP_LABEL: Record<Group, string> = {
  leads: 'Landowners to call',
  projects: 'Projects',
  sites: 'Brand sites with no candidate',
  money: 'Fees',
  admin: 'Housekeeping',
};

const LEAD_CALL_HOURS = 2;      // playbook: call within 2 hours
const LEAD_FOLLOWUP_DAYS = 7;   // contacted / site visit with no movement
const SITE_SOON_DAYS = 14;      // brand wants it within two weeks

type Num = number | string | null | undefined;
const n = (v: Num) => (v == null ? null : Number(v));
const hoursSince = (iso: string, now: number) => (now - Date.parse(iso)) / 3_600_000;

export interface TodayInput {
  me: number;
  isOwner: boolean;
  now?: number;
  leads: { id: number; owner_name: string; locality: string; size_sq_yds: Num; status: string; created_at: string; updated_at: string; assigned_to: number | null; construction_interest: string | null; lat: Num; lng: Num }[];
  projects: { id: number; name: string; stage: string; stage_changed_at: string; assigned_to: number | null; target_handover: string | null; construction_start: string | null; construction_progress: number | null }[];
  openItems: { project_id: number; stage: string; label: string }[]; // open checklist items
  requirements: { id: number; title: string; status: string; lat: number; lng: number; radius_max_m: number; priority: string | null; target_date: string | null; brand_name: string | null; assignee_ids: number[] }[];
  properties: { lat: Num; lng: Num }[];
  fees: { id: number; project_id: number; project_name: string; amount: Num; status: string; due_date: string | null }[];
  scouts: { id: number; name: string; expires_at: string | null; revoked_at: string | null }[];
}

export function buildToday(input: TodayInput): TodayItem[] {
  const now = input.now ?? Date.now();
  const items: TodayItem[] = [];
  const mine = (assignee: number | null) => assignee == null || assignee === input.me;

  // ── Leads ──
  for (const l of input.leads) {
    const size = n(l.size_sq_yds);
    const what = `${size ? `${Math.round(size).toLocaleString('en-IN')} sq yds` : 'Land'} · ${l.locality}`;
    if (l.status === 'new') {
      const h = hoursSince(l.created_at, now);
      items.push({
        key: `lead-new-${l.id}`, group: 'leads', href: `/internal/land-leads/${l.id}`, mine: mine(l.assigned_to),
        urgency: h > LEAD_CALL_HOURS ? 'urgent' : 'soon',
        title: `Call ${l.owner_name}`,
        detail: `${what}${l.construction_interest === 'yes' ? ' · ready to build' : ''} · waiting ${h < 1 ? 'under 1 hour' : h < 48 ? `${Math.floor(h)} h` : `${Math.floor(h / 24)} days`}`,
        sortAt: Date.parse(l.created_at),
      });
    } else if (['contacted', 'site_visit', 'shortlisted', 'negotiating'].includes(l.status)) {
      const d = daysSince(l.updated_at);
      if (d >= LEAD_FOLLOWUP_DAYS) {
        items.push({
          key: `lead-stale-${l.id}`, group: 'leads', href: `/internal/land-leads/${l.id}`, mine: mine(l.assigned_to),
          urgency: 'normal', title: `Follow up with ${l.owner_name}`,
          detail: `${what} · no update for ${d} days`, sortAt: Date.parse(l.updated_at),
        });
      }
    }
  }

  // ── Projects ──
  for (const p of input.projects) {
    const sch = scheduleStatus(p, now);
    if (sch.kind === 'late' || sch.kind === 'behind') {
      items.push({
        key: `proj-build-${p.id}`, group: 'projects', href: `/internal/projects/${p.id}`, mine: mine(p.assigned_to),
        urgency: sch.kind === 'late' ? 'urgent' : 'soon',
        title: `${p.name}: construction ${sch.kind}`, detail: sch.label, sortAt: 0,
      });
    }
    const days = daysSince(p.stage_changed_at);
    const open = input.openItems.filter((i) => i.project_id === p.id && i.stage === p.stage);
    if (p.stage === 'permissions' && open.length) {
      items.push({
        key: `proj-perm-${p.id}`, group: 'projects', href: `/internal/projects/${p.id}`, mine: mine(p.assigned_to),
        urgency: days > STUCK_AFTER_DAYS ? 'urgent' : 'normal',
        title: `${p.name}: ${open.length} permission${open.length > 1 ? 's' : ''} pending`,
        detail: open.slice(0, 3).map((i) => i.label).join(' · ') + (open.length > 3 ? ' …' : ''),
        sortAt: Date.parse(p.stage_changed_at),
      });
    } else if (days > STUCK_AFTER_DAYS) {
      items.push({
        key: `proj-stuck-${p.id}`, group: 'projects', href: `/internal/projects/${p.id}`, mine: mine(p.assigned_to),
        urgency: 'soon', title: `${p.name}: stuck in ${stageLabel(p.stage)}`,
        detail: `${days} days in this stage${open.length ? ` · next: ${open[0].label}` : ''}`,
        sortAt: Date.parse(p.stage_changed_at),
      });
    }
  }

  // ── Brand sites with nothing inside the radius ──
  const candidates = [
    ...input.properties.map((p) => ({ lat: n(p.lat), lng: n(p.lng) })),
    ...input.leads.filter((l) => l.status !== 'rejected').map((l) => ({ lat: n(l.lat), lng: n(l.lng) })),
  ].filter((c): c is { lat: number; lng: number } => c.lat != null && c.lng != null);

  for (const r of input.requirements) {
    if (r.status !== 'searching') continue;
    const has = candidates.some((c) => distanceInMeters(r.lat, r.lng, c.lat, c.lng) <= r.radius_max_m);
    if (has) continue;
    const daysLeft = r.target_date ? Math.ceil((Date.parse(r.target_date) - now) / 86_400_000) : null;
    const pressing = r.priority === 'high' || (daysLeft != null && daysLeft <= SITE_SOON_DAYS);
    if (!pressing) continue; // the full list lives on the Requirements page
    items.push({
      key: `req-${r.id}`, group: 'sites', href: `/internal/requirements/${r.id}`,
      mine: r.assignee_ids.length === 0 || r.assignee_ids.includes(input.me),
      urgency: daysLeft != null && daysLeft <= 7 ? 'urgent' : 'soon',
      title: `${r.brand_name ? `${r.brand_name}: ` : ''}${r.title}`,
      detail: `Nothing within ${r.radius_max_m} m${r.priority === 'high' ? ' · high priority' : ''}${daysLeft != null ? (daysLeft < 0 ? ` · wanted ${-daysLeft} days ago` : ` · wanted in ${daysLeft} days`) : ''}`,
      sortAt: daysLeft ?? 999,
    });
  }

  // ── Fees (owners only) ──
  if (input.isOwner) {
    for (const f of input.fees) {
      if (f.status !== 'expected' && f.status !== 'invoiced') continue;
      if (!f.due_date) continue;
      const daysLeft = Math.ceil((Date.parse(f.due_date) - now) / 86_400_000);
      const overdue = isOverdue(f, now);
      if (!overdue && daysLeft > 7) continue;
      items.push({
        key: `fee-${f.id}`, group: 'money', href: `/internal/projects/${f.project_id}`, mine: true,
        urgency: overdue ? 'urgent' : 'soon',
        title: `${f.status === 'expected' ? 'Invoice' : 'Collect'} ${inr(n(f.amount))}: ${f.project_name}`,
        detail: overdue ? `Overdue by ${-daysLeft} days` : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} days`,
        sortAt: Date.parse(f.due_date),
      });
    }
  }

  // ── Scout links about to stop working ──
  for (const s of input.scouts) {
    if (scoutLinkState(s, now) !== 'active' || !s.expires_at) continue;
    const daysLeft = Math.ceil((Date.parse(s.expires_at) - now) / 86_400_000);
    if (daysLeft > 7) continue;
    items.push({
      key: `scout-${s.id}`, group: 'admin', href: '/internal/requirements/scouts', mine: true, urgency: 'normal',
      title: `${s.name}'s scout link expires`, detail: `in ${daysLeft} day${daysLeft === 1 ? '' : 's'}; renew if they're still searching`,
      sortAt: Date.parse(s.expires_at),
    });
  }

  const rank: Record<Urgency, number> = { urgent: 0, soon: 1, normal: 2 };
  return items.sort((a, b) => rank[a.urgency] - rank[b.urgency] || a.sortAt - b.sortAt);
}

// Read once per request so every item on the page uses the same clock.
export function requestTime(): number {
  return Date.now();
}
