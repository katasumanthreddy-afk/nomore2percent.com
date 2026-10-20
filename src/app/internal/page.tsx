import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createInternalServerClient } from '@/lib/supabase-internal-server';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import InternalHeader from '@/components/internal/InternalHeader';
import { STUCK_AFTER_DAYS, daysSince, stageLabel } from '@/lib/brands-projects';

export default async function InternalDashboard() {
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

  const { data: properties } = await supabaseInternalAdmin.from('commercial_properties').select('id, title, status, area, property_type, deal_type, created_at').order('created_at', { ascending: false }).limit(6);
  const { data: deals } = await supabaseInternalAdmin.from('deals').select('id, deal_name, stage, value, expected_close_date, created_at').order('created_at', { ascending: false }).limit(6);
  const { count: propCount } = await supabaseInternalAdmin.from('commercial_properties').select('id', { count: 'exact', head: true });
  const { count: dealCount } = await supabaseInternalAdmin.from('deals').select('id', { count: 'exact', head: true }).not('stage', 'in', '("closed_won","closed_lost")');

  // Projects: live count + stuck ones (older than 14 days in their stage).
  // Tolerates the projects table not existing yet.
  const { data: liveProjects } = await supabaseInternalAdmin
    .from('projects')
    .select('id, name, stage, stage_changed_at, brands(name)')
    .not('stage', 'in', '("rent_started","dropped")')
    .order('stage_changed_at', { ascending: true });
  const stuckProjects = (liveProjects || []).filter((p) => daysSince(p.stage_changed_at) > STUCK_AFTER_DAYS);
  const { count: newLeadCount } = await supabaseInternalAdmin.from('land_leads').select('id', { count: 'exact', head: true }).eq('status', 'new');

  const ninetyDaysOut = new Date();
  ninetyDaysOut.setDate(ninetyDaysOut.getDate() + 90);
  const { data: expiringLeases } = await supabaseInternalAdmin
    .from('commercial_properties')
    .select('id, title, area, tenant_name, lease_expiry')
    .eq('deal_type', 'lease')
    .not('lease_expiry', 'is', null)
    .lte('lease_expiry', ninetyDaysOut.toISOString().slice(0, 10))
    .order('lease_expiry', { ascending: true });

  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Welcome, {member.name.split(' ')[0]}</h1>
        <p className="text-stone-500 text-sm mb-6 capitalize">{member.role}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Link href="/internal/projects" className="bg-white border border-stone-200 rounded-xl p-5 hover:border-orange-300 transition-colors">
            <div className="font-serif text-2xl font-bold text-stone-900">{liveProjects?.length ?? 0}</div>
            <div className="text-xs text-stone-500 mt-1">Live Projects</div>
          </Link>
          <Link href="/internal/land-leads" className="bg-white border border-stone-200 rounded-xl p-5 hover:border-orange-300 transition-colors">
            <div className={`font-serif text-2xl font-bold ${newLeadCount ? 'text-orange-500' : 'text-stone-900'}`}>{newLeadCount ?? 0}</div>
            <div className="text-xs text-stone-500 mt-1">New Land Leads to call</div>
          </Link>
          <Link href="/internal/properties" className="bg-white border border-stone-200 rounded-xl p-5 hover:border-orange-300 transition-colors">
            <div className="font-serif text-2xl font-bold text-stone-900">{propCount ?? 0}</div>
            <div className="text-xs text-stone-500 mt-1">Commercial Properties</div>
          </Link>
          <Link href="/internal/deals" className="bg-white border border-stone-200 rounded-xl p-5 hover:border-orange-300 transition-colors">
            <div className="font-serif text-2xl font-bold text-stone-900">{dealCount ?? 0}</div>
            <div className="text-xs text-stone-500 mt-1">Open Deals</div>
          </Link>
        </div>

        {stuckProjects.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <div className="text-xs font-bold uppercase tracking-wide text-red-700 mb-2">Projects stuck more than {STUCK_AFTER_DAYS} days</div>
            <div className="space-y-1.5">
              {stuckProjects.map((p) => (
                <Link key={p.id} href={`/internal/projects/${p.id}`} className="flex items-center justify-between text-sm hover:underline">
                  <span className="text-stone-800">{p.name}</span>
                  <span className="text-red-700 font-semibold">{stageLabel(p.stage)} · {daysSince(p.stage_changed_at)}d</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {expiringLeases && expiringLeases.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <div className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-2">⚠️ Leases Expiring Within 90 Days</div>
            <div className="space-y-1.5">
              {expiringLeases.map((p) => {
                const isPast = new Date(p.lease_expiry) < new Date();
                return (
                  <Link key={p.id} href={`/internal/properties/${p.id}`} className="flex items-center justify-between text-sm hover:underline">
                    <span className="text-stone-800">{p.title} {p.tenant_name && <span className="text-stone-500">— {p.tenant_name}</span>}</span>
                    <span className={isPast ? 'text-red-600 font-semibold' : 'text-amber-700 font-semibold'}>
                      {isPast ? 'Expired ' : ''}{new Date(p.lease_expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-lg font-bold text-stone-900">Recent Properties</h2>
              <Link href="/internal/properties/new" className="text-xs text-orange-500 font-semibold hover:underline">+ Add</Link>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
              {(properties || []).map((p) => (
                <Link key={p.id} href={`/internal/properties/${p.id}`} className="block px-4 py-3 hover:bg-stone-50 transition-colors">
                  <div className="text-sm font-semibold text-stone-800">{p.title}</div>
                  <div className="text-xs text-stone-500 capitalize">{p.area} · {p.property_type} · {p.deal_type} · {p.status?.replace('_', ' ')}</div>
                </Link>
              ))}
              {(!properties || properties.length === 0) && <div className="px-4 py-8 text-center text-sm text-stone-400">No properties yet.</div>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-lg font-bold text-stone-900">Recent Deals</h2>
              <Link href="/internal/deals/new" className="text-xs text-orange-500 font-semibold hover:underline">+ Add</Link>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
              {(deals || []).map((d) => (
                <Link key={d.id} href={`/internal/deals/${d.id}`} className="block px-4 py-3 hover:bg-stone-50 transition-colors">
                  <div className="text-sm font-semibold text-stone-800">{d.deal_name}</div>
                  <div className="text-xs text-stone-500 capitalize">{d.stage?.replace('_', ' ')} {d.value ? `· ₹${Number(d.value).toLocaleString('en-IN')}` : ''}</div>
                </Link>
              ))}
              {(!deals || deals.length === 0) && <div className="px-4 py-8 text-center text-sm text-stone-400">No deals yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
