'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Broker {
  id: number; name: string; phone: string; email: string;
  rera_agent_number: string | null; rera_verified: boolean; mou_signed: boolean;
  status: string;
}

export default function BrokerProfileClient({ broker }: { broker: Broker }) {
  const [phone, setPhone] = useState(broker.phone);
  const [rera, setRera] = useState(broker.rera_agent_number || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [reraResetNotice, setReraResetNotice] = useState(false);

  const submit = async () => {
    setError('');
    setSaved(false);
    if (!phone.trim()) { setError('Phone number is required.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/brokers/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, rera_agent_number: rera || null }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Something went wrong.'); return; }
      setSaved(true);
      setReraResetNotice(!!data.rera_reset);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400";
  const labelClass = "text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block";

  return (
    <div className="flex-1 bg-stone-50">
      <Header />
      <div className="max-w-lg mx-auto px-6 py-10">
        <Link href="/broker" className="text-xs text-stone-400 hover:text-stone-600 mb-4 inline-block">← Back to Dashboard</Link>
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Your Profile</h1>
        <p className="text-stone-500 text-sm mb-6">Update your contact details. Some fields are managed by nomore2percent and can't be changed here.</p>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
          <div>
            <label className={labelClass}>Name</label>
            <div className="text-sm text-stone-500 bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2.5">{broker.name}</div>
          </div>
          <div>
            <label className={labelClass}>Email (used to sign in)</label>
            <div className="text-sm text-stone-500 bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2.5">{broker.email}</div>
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+91 your number" />
          </div>

          <div>
            <label className={labelClass}>RERA Agent Registration Number</label>
            <input value={rera} onChange={(e) => setRera(e.target.value)} className={inputClass} placeholder="e.g. A0123456789012345" />
            <p className="text-[11px] text-stone-400 mt-1.5">
              {broker.rera_verified
                ? '✓ Currently verified — changing this number will require re-verification.'
                : 'Not yet verified by nomore2percent.'}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
            <span className={'text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ' + (broker.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : broker.status === 'suspended' ? 'bg-stone-100 text-stone-500 border-stone-200' : 'bg-amber-50 text-amber-600 border-amber-200')}>
              {broker.status === 'active' ? 'Active Partner' : broker.status === 'suspended' ? 'Paused' : 'Invited'}
            </span>
            <span className={'text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ' + (broker.mou_signed ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-stone-100 text-stone-500 border-stone-200')}>
              MOU {broker.mou_signed ? 'Signed' : 'Not Signed'}
            </span>
          </div>

          {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
          {saved && (
            <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              Saved. {reraResetNotice && 'Your RERA number will need to be re-verified by nomore2percent.'}
            </div>
          )}

          <button onClick={submit} disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-bold transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <p className="text-xs text-stone-400 mt-4 text-center">
          Need your name, email, status, or MOU status updated? <a href="https://wa.me/917013224895" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">WhatsApp us</a>.
        </p>
      </div>
    </div>
  );
}
