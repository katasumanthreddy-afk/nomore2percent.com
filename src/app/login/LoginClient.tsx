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
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const signInWithGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      // On success, Supabase redirects the browser to Google immediately —
      // this only returns if something went wrong before that redirect fired.
      if (oauthError) { setError(oauthError.message); setGoogleLoading(false); }
    } catch {
      setError('Could not start Google sign-in. Please try again.');
      setGoogleLoading(false);
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
                Sign in to save properties and valuations. If you're new, this creates your account automatically.
              </p>

              <button
                onClick={signInWithGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2.5 border border-stone-200 hover:border-stone-300 rounded-lg py-3 text-sm font-semibold text-stone-700 transition-colors disabled:opacity-50 mb-4"
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.61z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
                </svg>
                {googleLoading ? 'Redirecting...' : 'Continue with Google'}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-stone-200" />
                <span className="text-[11px] text-stone-400 uppercase tracking-wide">or</span>
                <div className="flex-1 h-px bg-stone-200" />
              </div>

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
