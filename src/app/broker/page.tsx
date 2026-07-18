import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { titleCase } from '@/types/property';

export const metadata: Metadata = {
  title: 'Broker Portal | nomore2percent',
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: 'Under Review', className: 'bg-amber-50 text-amber-600 border-amber-200' },
  approved: { label: 'Live', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  rejected: { label: 'Not Approved', className: 'bg-red-50 text-red-600 border-red-200' },
};

export default async function BrokerPortalPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/broker');
  }

  const { data: broker } = await supabaseAdmin
    .from('brokers')
    .select('*')
    .ilike('email', user.email || '')
    .maybeSingle();

  if (!broker) {
    return (
      <div className="flex-1 bg-stone-50">
        <Header />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Broker Portal</h1>
          <p className="text-stone-500 text-sm mb-1">
            This account ({user.email}) isn&apos;t registered as a partner broker yet.
          </p>
          <p className="text-stone-500 text-sm mb-6">
            nomore2percent&apos;s broker network is invite-based — reach out if you&apos;d like to partner with us.
          </p>
          <a href="https://wa.me/917013224895" target="_blank" rel="noopener noreferrer" className="inline-block bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-6 py-3 text-sm font-bold transition-colors">
            WhatsApp Us to Get Started
          </a>
        </div>
      </div>
    );
  }

  if (broker.status === 'suspended') {
    return (
      <div className="flex-1 bg-stone-50">
        <Header />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="text-4xl mb-4">⏸️</div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Account Paused</h1>
          <p className="text-stone-500 text-sm mb-6">Your broker account is currently paused. Contact us if you have questions.</p>
          <a href="https://wa.me/917013224895" target="_blank" rel="noopener noreferrer" className="inline-block border border-stone-200 rounded-lg px-6 py-3 text-sm font-semibold hover:border-stone-300 transition-colors">
            WhatsApp Us
          </a>
        </div>
      </div>
    );
  }

  const { data: submissions } = await supabaseAdmin
    .from('property_submissions')
    .select('*')
    .eq('broker_id', broker.id)
    .order('created_at', { ascending: false });

  const pendingMou = !broker.mou_signed;

  return (
    <div className="flex-1 bg-stone-50">
      <Header />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">Welcome, {broker.name}</h1>
            <p className="text-stone-500 text-sm">Broker Partner · nomore2percent</p>
          </div>
          <Link href="/broker/submit" className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-5 py-2.5 text-sm font-bold transition-colors">
            + Submit a Listing
          </Link>
        </div>

        {broker.status === 'invited' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-6">
            Your account is pending activation. You can submit listings, but reach out if you haven&apos;t heard from us about your MOU yet.
          </div>
        )}
        {pendingMou && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700 mb-6">
            Reminder: your partnership MOU is still marked as unsigned in our records — contact us if you believe this is outdated.
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
            <div className="font-serif text-2xl font-bold text-stone-900">{submissions?.length || 0}</div>
            <div className="text-xs text-stone-500 mt-1">Submitted</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
            <div className="font-serif text-2xl font-bold text-amber-500">{submissions?.filter((s) => s.status === 'pending').length || 0}</div>
            <div className="text-xs text-stone-500 mt-1">Under Review</div>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
            <div className="font-serif text-2xl font-bold text-emerald-500">{submissions?.filter((s) => s.status === 'approved').length || 0}</div>
            <div className="text-xs text-stone-500 mt-1">Live</div>
          </div>
        </div>

        <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Your Listings</h2>
        {submissions && submissions.length > 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
            {submissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-stone-800 truncate">{titleCase(s.title) || `${s.property_type} in ${s.area}`}</div>
                  <div className="text-xs text-stone-500">{s.area}</div>
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border flex-shrink-0 ${STATUS_LABEL[s.status]?.className || ''}`}>
                  {STATUS_LABEL[s.status]?.label || s.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-stone-300 rounded-xl p-10 text-center">
            <p className="text-stone-500 text-sm mb-4">No listings submitted yet.</p>
            <Link href="/broker/submit" className="text-orange-500 text-sm font-semibold hover:underline">Submit your first listing →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
