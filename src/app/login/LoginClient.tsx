'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function LoginClient() {
  const searchParams = useSearchParams();
  const hadError = searchParams.get('error') === '1';
  const next = searchParams.get('next') || '/account';

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(hadError ? 'That link didn\'t work — it may have expired. Please try again.' : '');

  const sendLink = async () => {
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email address.'); return; }
    setError('');
    setSending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (signInError) setError(signInError.message);
      else setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 bg-stone-50">
      <Header />

      <div className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 text-center">
          {!sent ? (
            <>
              <div className="w-12 h-12 rounded-xl bg-orange-400 text-white flex items-center justify-center font-serif font-bold text-lg mx-auto mb-4">N2</div>
              <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Sign In</h1>
              <p className="text-stone-500 text-sm mb-6">
                Enter your email — we'll send you a link to sign in. No password, and if you're new, this creates your account automatically.
              </p>

              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendLink()}
                  placeholder="you@example.com"
                  className="border border-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-orange-400"
                />
                {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-left">{error}</div>}
                <button
                  onClick={sendLink}
                  disabled={sending}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg py-3 text-sm font-bold transition-colors"
                >
                  {sending ? 'Sending...' : 'Send Magic Link →'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 text-2xl">✉️</div>
              <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Check Your Email</h1>
              <p className="text-stone-500 text-sm">
                We sent a sign-in link to <span className="font-semibold text-stone-700">{email}</span>. Click it to continue — the link expires shortly, so use it soon.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
