'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      router.push('/admin');
    } else {
      setError(data.message || 'Login failed');
    }
  };

  return (
    <div className="flex-1 bg-stone-950 flex items-center justify-center p-6">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-10 w-full max-w-sm">
        <div className="font-serif text-xl font-bold text-stone-100 mb-1">nomore<span className="text-orange-400">2%</span></div>
        <div className="text-xs text-stone-500 mb-7">Admin Panel — Restricted Access</div>

        {error && <div className="bg-red-950/40 border border-red-800/40 text-red-400 text-sm rounded-lg px-3.5 py-2.5 mb-4">⚠ {error}</div>}

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wide text-stone-500 mb-1.5">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3.5 py-2.5 text-sm text-stone-100 outline-none focus:border-orange-400" placeholder="sumanth" required />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wide text-stone-500 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-stone-950 border border-stone-800 rounded-lg px-3.5 py-2.5 text-sm text-stone-100 outline-none focus:border-orange-400" placeholder="••••••••" required />
          </div>
          <button type="submit" className="bg-orange-500 text-stone-950 rounded-lg py-2.5 text-sm font-bold hover:bg-orange-400 transition-colors mt-1">Sign In →</button>
        </form>

        <Link href="/" className="block text-center text-xs text-stone-500 hover:text-orange-400 mt-6">← Back to Marketplace</Link>
      </div>
    </div>
  );
}
