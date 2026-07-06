'use client';

import { useState } from 'react';
import Header from '@/components/Header';

const AREAS = [
  'Gachibowli', 'Madhapur', 'Kondapur', 'Banjara Hills', 'Jubilee Hills', 'Kokapet',
  'Manikonda', 'Miyapur', 'Kukatpally', 'Hitech City', 'Financial District',
  'Nizampet', 'Alwal', 'Uppal', 'Secunderabad', 'Kompally', 'Begumpet', 'Somajiguda', 'Ameerpet',
];

interface ValuationResult {
  estimated_low: number;
  estimated_high: number;
  estimated_mid: number;
  rate_per_sqft_used: number;
  used_live_data: boolean;
  live_comp_count: number;
}

function formatINR(amount: number): string {
  if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
  if (amount >= 100000) return '₹' + (amount / 100000).toFixed(2).replace(/\.00$/, '') + ' L';
  return '₹' + amount.toLocaleString('en-IN');
}

export default function ValuationClient() {
  const [area, setArea] = useState('Gachibowli');
  const [customArea, setCustomArea] = useState('');
  const [propertyType, setPropertyType] = useState<'apartment' | 'villa' | 'plot' | 'commercial'>('apartment');
  const [sqft, setSqft] = useState('');
  const [ageYears, setAgeYears] = useState('5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ValuationResult | null>(null);

  const [wantsCallback, setWantsCallback] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [callbackSent, setCallbackSent] = useState(false);

  const effectiveArea = area === 'Other' ? customArea.trim() : area;

  const getEstimate = async () => {
    setError('');
    if (!effectiveArea) { setError('Please enter your locality.'); return; }
    if (!sqft || Number(sqft) <= 0) { setError('Please enter a valid built-up area in sqft.'); return; }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/property-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: effectiveArea, property_type: propertyType, sqft: Number(sqft), age_years: Number(ageYears) }),
      });
      const data = await res.json();
      if (data.success) setResult(data);
      else setError(data.message || 'Could not generate an estimate. Please try again.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestCallback = async () => {
    if (!name.trim() || !phone.trim()) return;
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, phone, area: effectiveArea, property_type: propertyType,
        budget: result ? formatINR(result.estimated_mid) : undefined,
        message: `Requested a professional valuation callback. Instant estimate: ${result ? formatINR(result.estimated_low) + ' - ' + formatINR(result.estimated_high) : 'N/A'}, ${sqft} sqft, ${ageYears} yrs old.`,
        source: 'property-valuation',
      }),
    });
    setCallbackSent(true);
  };

  return (
    <div className="flex-1 bg-stone-50">
      <Header />

      <div className="max-w-2xl mx-auto px-6 md:px-10 py-12">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Free Property Valuation</h1>
          <p className="text-stone-500 text-sm">
            Get an instant indicative estimate for your Hyderabad property — based on our own live listings and market data.
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Locality</label>
              <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white">
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                <option value="Other">Other (type below)</option>
              </select>
              {area === 'Other' && (
                <input
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  placeholder="Enter your locality"
                  className="w-full mt-2 border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Property Type</label>
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as any)} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white">
                <option value="apartment">Apartment</option>
                <option value="villa">Villa / Independent House</option>
                <option value="plot">Plot / Land</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Built-up Area (sqft)</label>
              <input
                type="number"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                placeholder="e.g. 1450"
                className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">Property Age (years)</label>
              <select value={ageYears} onChange={(e) => setAgeYears(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 bg-white">
                <option value="1">Under 2 years</option>
                <option value="4">2 - 5 years</option>
                <option value="8">5 - 10 years</option>
                <option value="15">10+ years</option>
              </select>
            </div>
          </div>

          {error && <div className="mt-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}

          <button
            onClick={getEstimate}
            disabled={loading}
            className="w-full mt-6 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg py-3 text-sm font-bold transition-colors"
          >
            {loading ? 'Calculating...' : 'Get Instant Estimate'}
          </button>
        </div>

        {result && (
          <div className="mt-6 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6 md:p-8 text-center">
            <div className="text-xs font-bold uppercase tracking-wide text-orange-500 mb-2">Estimated Market Value</div>
            <div className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mb-1">
              {formatINR(result.estimated_low)} – {formatINR(result.estimated_high)}
            </div>
            <div className="text-xs text-stone-500 mb-4">
              Based on ₹{result.rate_per_sqft_used.toLocaleString('en-IN')}/sqft
              {result.used_live_data
                ? ` — blended with ${result.live_comp_count} of our live ${effectiveArea} listings`
                : ' — based on area benchmark data (limited live listings in this exact locality yet)'}
            </div>
            <p className="text-[11px] text-stone-400 mb-5 max-w-md mx-auto">
              This is an instant, indicative estimate — not a certified valuation. Actual market value depends on exact condition, floor, view, amenities, and current demand. For an accurate number, talk to Sumanth.
            </p>

            {!wantsCallback && !callbackSent && (
              <button
                onClick={() => setWantsCallback(true)}
                className="bg-stone-900 text-white rounded-lg px-6 py-2.5 text-sm font-bold hover:bg-stone-800 transition-colors"
              >
                Get an Accurate Valuation from Sumanth
              </button>
            )}

            {wantsCallback && !callbackSent && (
              <div className="max-w-xs mx-auto flex flex-col gap-2 mt-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 your number" className="border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400" />
                <button onClick={requestCallback} className="bg-orange-500 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-orange-600 transition-colors">
                  Request Callback
                </button>
              </div>
            )}

            {callbackSent && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-2.5 inline-block">
                ✅ Got it — Sumanth will call you shortly with a detailed valuation.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
