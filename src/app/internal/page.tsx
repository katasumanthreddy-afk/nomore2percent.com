import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createInternalServerClient } from '@/lib/supabase-internal-server';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import InternalHeader from '@/components/internal/InternalHeader';

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

  return (
    <div className="min-h-screen bg-stone-50">
      <InternalHeader memberName={member.name} role={member.role} />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Welcome, {member.name.split(' ')[0]}</h1>
        <p className="text-stone-500 text-sm mb-6 capitalize">{member.role}</p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link href="/internal/properties" className="bg-white border border-stone-200 rounded-xl p-5 hover:border-orange-300 transition-colors">
            <div className="font-serif text-2xl font-bold text-stone-900">{propCount ?? 0}</div>
            <div className="text-xs text-stone-500 mt-1">Commercial Properties</div>
          </Link>
          <Link href="/internal/deals" className="bg-white border border-stone-200 rounded-xl p-5 hover:border-orange-300 transition-colors">
            <div className="font-serif text-2xl font-bold text-stone-900">{dealCount ?? 0}</div>
            <div className="text-xs text-stone-500 mt-1">Open Deals</div>
          </Link>
        </div>

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
