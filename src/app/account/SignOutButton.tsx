'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function SignOutButton() {
  const router = useRouter();

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <button onClick={signOut} className="text-sm text-stone-500 hover:text-stone-700 border border-stone-200 rounded-lg px-4 py-2 hover:border-stone-300 transition-colors">
      Sign Out
    </button>
  );
}
