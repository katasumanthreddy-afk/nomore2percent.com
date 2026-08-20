'use client';

import { useState } from 'react';
import { createInternalBrowserClient } from '@/lib/supabase-internal-browser';

export default function InternalLoginPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const sendLink = async () => {
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email address.'); return; }
    setError('');
    setSending(true);
    try {
      const supabase = createInternalBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/internal/auth/callback` },
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
      const supabase = createInternalBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/internal/auth/callback` },
      });
      if (oauthError) { setError(oauthError.message); setGoogleLoading(false); }
    } catch {
      setError('Could not start Google sign-in.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-6">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center font-serif font-bold text-lg mx-auto mb-3">N2</div>
          <h1 className="font-serif text-xl font-bold text-white">Internal Portal</h1>
          <p className="text-stone-400 text-xs mt-1">Team & partner access only</p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <p className="text-stone-300 text-sm">Check your email for a sign-in link.</p>
          </div>
        ) : (
          <>
            <button
              onClick={signInWithGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2.5 border border-stone-700 hover:border-stone-600 rounded-lg py-3 text-sm font-semibold text-stone-200 transition-colors disabled:opacity-50 mb-4"
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
              <div className="flex-1 h-px bg-stone-800" />
              <span className="text-[11px] text-stone-500 uppercase tracking-wide">or</span>
              <div className="flex-1 h-px bg-stone-800" />
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3.5 py-2.5 text-sm text-stone-100 outline-none focus:border-orange-400 mb-3"
            />
            {error && <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2 mb-3">{error}</div>}
            <button
              onClick={sendLink}
              disabled={sending}
              className="w-full bg-orange-500 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-orange-400 transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Sign-In Link'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
