import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import SignOutButton from './SignOutButton';

export const metadata: Metadata = {
  title: 'My Account | nomore2percent',
};

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account');
  }

  return (
    <div className="flex-1 bg-stone-50">
      <Header />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-400 text-white flex items-center justify-center font-serif font-bold text-lg">
                {user.email?.[0].toUpperCase()}
              </div>
              <div>
                <div className="font-serif text-lg font-bold text-stone-900">Welcome back</div>
                <div className="text-sm text-stone-500">{user.email}</div>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>

        <div className="bg-stone-100 border border-dashed border-stone-300 rounded-2xl p-6 text-center">
          <div className="text-2xl mb-2">🗂️</div>
          <div className="text-sm font-semibold text-stone-600 mb-1">Your Property Vault</div>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Coming soon — save valuations, track multiple properties, and get updated estimates over time, all in one place.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/property-valuation" className="bg-white border border-stone-200 rounded-xl p-5 hover:border-orange-300 transition-colors">
            <div className="text-sm font-bold text-stone-800 mb-1">Get a Property Valuation →</div>
            <div className="text-xs text-stone-500">Instant estimate + Property Health Score</div>
          </a>
          <a href="/properties" className="bg-white border border-stone-200 rounded-xl p-5 hover:border-orange-300 transition-colors">
            <div className="text-sm font-bold text-stone-800 mb-1">Browse Properties →</div>
            <div className="text-xs text-stone-500">Verified listings at 1% brokerage</div>
          </a>
        </div>
      </div>
    </div>
  );
}
