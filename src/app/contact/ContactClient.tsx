'use client';

import { useState } from 'react';
import Header from '@/components/Header';

export default function ContactClient() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!name.trim() || !phone.trim()) {
      setError('Please enter your name and phone number.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email: email || undefined, message: message || undefined, source: 'contact-page' }),
      });
      const data = await res.json();
      if (data.success) setSent(true);
      else setError(data.message || 'Something went wrong. Please try again.');
    } catch {
      setError('Could not send. Please try WhatsApp instead.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 bg-stone-50">
      <Header />

      <div className="bg-gradient-to-br from-stone-900 to-orange-950 px-6 md:px-10 py-16 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">Get in Touch</h1>
          <p className="text-stone-300 text-sm max-w-xl mx-auto">
            Buying, selling, or just have a question about a Hyderabad property? We usually reply within a few hours.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900 mb-5">Reach Us Directly</h2>

            <a href="https://wa.me/917013224895" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl p-4 mb-3 hover:border-emerald-300 transition-colors">
              <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0">💬</div>
              <div>
                <div className="font-semibold text-sm text-stone-900">WhatsApp</div>
                <div className="text-xs text-stone-500">Fastest way to reach us</div>
              </div>
            </a>

            <a href="tel:+917013224895" className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl p-4 mb-3 hover:border-orange-300 transition-colors">
              <div className="w-11 h-11 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-xl flex-shrink-0">📞</div>
              <div>
                <div className="font-semibold text-sm text-stone-900">+91 70132 24895</div>
                <div className="text-xs text-stone-500">Call us directly</div>
              </div>
            </a>

            <a href="https://instagram.com/nomore2percent" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl p-4 mb-3 hover:border-pink-300 transition-colors">
              <div className="w-11 h-11 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center text-xl flex-shrink-0">📷</div>
              <div>
                <div className="font-semibold text-sm text-stone-900">@nomore2percent</div>
                <div className="text-xs text-stone-500">Follow us on Instagram</div>
              </div>
            </a>

            <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl p-4">
              <div className="w-11 h-11 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center text-xl flex-shrink-0">📍</div>
              <div>
                <div className="font-semibold text-sm text-stone-900">Hyderabad, Telangana</div>
                <div className="text-xs text-stone-500">Serving properties across the city</div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900 mb-5">Send a Message</h2>
            {sent ? (
              <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                <div className="font-serif text-lg font-bold text-stone-900 mb-1">Message Sent</div>
                <p className="text-sm text-stone-500">Thanks for reaching out — we'll get back to you shortly.</p>
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col gap-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 your mobile number" className="border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400" />
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" className="border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-orange-400 h-24 resize-none" />
                {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
                <button onClick={submit} disabled={sending} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-bold transition-colors">
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
