import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createInternalServerClient } from '@/lib/supabase-internal-server';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import InternalHeader from '@/components/internal/InternalHeader';
import { feeSummary, inr } from '@/lib/brands-projects';
import { GROUP_LABEL, buildToday, requestTime, type Group } from '@/lib/today';

export default async function InternalDashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const supabase = await createInternalServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/internal/login');

  const member = await getRequestingTeamMember();
  if (!member) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-6 text-center">
        <div>
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="font-serif text-xl font-bold text-white mb-2">Not Recognized</h1>
          <p className="text-stone-400 text-sm">{user.email} isn&apos;t on the internal team list. Contact the account owner.</p>
        </div>
      </div>
    );
  }
  if (member.status !== 'active') {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-6 text-center">
        <div>
          <div className="text-4xl mb-4">⏸️</div>
          <h1 className="font-serif text-xl font-bold text-white mb-2">Account Inactive</h1>
        </div>
      </div>
    );
  }

  const isOwner = member.role === 'owner';
  const sp = await searchParams;
  const showAll = sp.view === 'all';
  const now = requestTime();

  // Everything below tolerates a table not existing yet (data comes back null).
  const db = supabaseInternalAdmin;
  const [
    { data: leads }, { data: projects }, { data: openItems }, { data: reqs }, { data: assignments },
    { data: props }, { data: feeRows }, { data: scouts }, { data: expiringLeases },
    { count: propCount }, { count: openReqCount },
  ] = await Promise.all([
    db.from('land_leads').select('id, owner_name, locality, size_sq_yds, status, created_at, updated_at, assigned_to, construction_interest, lat, lng').neq('status', 'signed'),
    db.from('projects').select('id, name, stage, stage_changed_at, assigned_to, target_handover, construction_start, construction_progress').not('stage', 'in', '("rent_started","dropped")'),
    db.from('project_checklist_items').select('project_id, stage, label, sort').eq('done', false).order('sort'),
    db.from('site_requirements').select('id, title, status, lat, lng, radius_max_m, priority, target_date, brands(name)').eq('status', 'searching'),
    db.from('requirement_assignments').select('requirement_id, team_member_id').not('team_member_id', 'is', null),
    db.from('commercial_properties').select('lat, lng').not('lat', 'is', null),
    isOwner ? db.from('project_fees').select('id, project_id, amount, received_amount, received_at, status, due_date, projects(name)') : Promise.resolve({ data: null }),
    db.from('external_scouts').select('id, name, expires_at, revoked_at'),
    db.from('commercial_properties').select('id, title, tenant_name, lease_expiry').eq('deal_type', 'lease').not('lease_expiry', 'is', null)
      .lte('lease_expiry', new Date(now + 90 * 86_400_000).toISOString().slice(0, 10)).order('lease_expiry'),
    db.from('commercial_properties').select('id', { count: 'exact', head: true }),
    db.from('site_requirements').select('id', { count: 'exact', head: true }).eq('status', 'searching'),
  ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const all = buildToday({
    me: member.id, isOwner, now,
    leads: leads || [],
    projects: projects || [],
    openItems: openItems || [],
    requirements: (reqs || []).map((r: any) => ({
      ...r, brand_name: r.brands?.name ?? null,
      assignee_ids: (assignments || []).filter((a) => a.requirement_id === r.id).map((a) => a.team_member_id as number),
    })),
    properties: props || [],
    fees: (feeRows || []).map((f: any) => ({ ...f, project_name: f.projects?.name ?? `Project #${f.project_id}` })),
    scouts: scouts || [],
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const items = showAll ? all : all.filter((i) => i.mine);
  const urgentCount = items.filter((i) => i.urgency === 'urgent').length;
  const groups = (Object.keys(GROUP_LABEL) as Group[]).map((g) => ({ g, rows: items.filter((i) => i.group === g) })).filter((x) => x.rows.length);
  const fs = feeSummary(feeRows || []);
  const newLeads = (leads || []).filter((l) => l.status === 'new').length;

  const greeting = (() => {
    const h = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()));
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();
  const dot: Record<string, string> = { urgent: 'bg-red-500', soon: 'bg-amber-400', normal: 'bg-stone-300' };

  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">{greeting}, {member.name.split(' ')[0]}</h1>
            <p className="text-stone-500 text-sm mt-1">
              {items.length === 0 ? 'Nothing needs you right now.' : `${items.length} thing${items.length > 1 ? 's' : ''} need${items.length > 1 ? '' : 's'} attention${urgentCount ? `, ${urgentCount} urgent` : ''}.`}
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5 text-xs font-semibold">
            <Link href="/internal" className={`px-3 py-1.5 rounded-md ${!showAll ? 'bg-orange-500 text-white' : 'text-stone-500'}`}>Mine + unassigned</Link>
            <Link href="/internal?view=all" className={`px-3 py-1.5 rounded-md ${showAll ? 'bg-orange-500 text-white' : 'text-stone-500'}`}>Everyone</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Link href="/internal/land-leads" className="bg-white border border-stone-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
            <div className={`font-serif text-2xl font-bold ${newLeads ? 'text-orange-500' : 'text-stone-900'}`}>{newLeads}</div>
            <div className="text-xs text-stone-500 mt-0.5">New land leads</div>
          </Link>
          <Link href="/internal/projects" className="bg-white border border-stone-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
            <div className="font-serif text-2xl font-bold text-stone-900">{projects?.length ?? 0}</div>
            <div className="text-xs text-stone-500 mt-0.5">Live projects</div>
          </Link>
          <Link href="/internal/requirements" className="bg-white border border-stone-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
            <div className="font-serif text-2xl font-bold text-stone-900">{openReqCount ?? 0}</div>
            <div className="text-xs text-stone-500 mt-0.5">Sites still searching</div>
          </Link>
          {isOwner && feeRows ? (
            <Link href="/internal/fees" className="bg-white border border-stone-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
              <div className="font-serif text-2xl font-bold text-emerald-600">{inr(fs.receivedThisQuarter)}</div>
              <div className="text-xs text-stone-500 mt-0.5">Fees this quarter{fs.overdueCount ? <span className="text-red-600 font-semibold"> · {inr(fs.overdue)} overdue</span> : null}</div>
            </Link>
          ) : (
            <Link href="/internal/properties" className="bg-white border border-stone-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
              <div className="font-serif text-2xl font-bold text-stone-900">{propCount ?? 0}</div>
              <div className="text-xs text-stone-500 mt-0.5">Properties</div>
            </Link>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 rounded-xl p-10 text-center">
            <div className="font-serif text-lg font-bold text-stone-800">All clear</div>
            <p className="text-sm text-stone-500 mt-1">No calls waiting, no stuck projects, nothing overdue.{!showAll ? ' Switch to Everyone to see the whole team.' : ''}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(({ g, rows }) => (
              <section key={g}>
                <h2 className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">{GROUP_LABEL[g]} <span className="text-stone-400">({rows.length})</span></h2>
                <ul className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
                  {rows.map((i) => (
                    <li key={i.key}>
                      <Link href={i.href} className="flex items-start gap-3 px-4 py-3 hover:bg-stone-50 transition-colors">
                        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dot[i.urgency]}`} aria-label={i.urgency} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-stone-800">{i.title}</span>
                          <span className="block text-xs text-stone-500 truncate">{i.detail}</span>
                        </span>
                        {!i.mine && <span className="text-[10px] text-stone-400 flex-shrink-0 mt-1">assigned</span>}
                        <span className="text-stone-300 flex-shrink-0">›</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {expiringLeases && expiringLeases.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">Existing leases expiring within 90 days</h2>
            <ul className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
              {expiringLeases.map((p) => {
                const isPast = new Date(p.lease_expiry).getTime() < now;
                return (
                  <li key={p.id}>
                    <Link href={`/internal/properties/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-stone-50">
                      <span className="text-stone-800">{p.title}{p.tenant_name && <span className="text-stone-500"> · {p.tenant_name}</span>}</span>
                      <span className={isPast ? 'text-red-600 font-semibold' : 'text-amber-700 font-semibold'}>{isPast ? 'Expired ' : ''}{new Date(p.lease_expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap gap-2 mt-8 text-xs font-semibold">
          <Link href="/internal/projects/new" className="px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-600 hover:border-orange-300">+ Project</Link>
          <Link href="/internal/brands/new" className="px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-600 hover:border-orange-300">+ Brand</Link>
          <Link href="/internal/properties/new" className="px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-600 hover:border-orange-300">+ Property</Link>
          <Link href="/internal/requirements/bulk-import" className="px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-600 hover:border-orange-300">Import site locations</Link>
          <Link href="/internal/deals" className="px-3 py-2 rounded-lg bg-white border border-stone-200 text-stone-600 hover:border-orange-300">Deals</Link>
        </div>
      </div>
    </div>
  );
}
