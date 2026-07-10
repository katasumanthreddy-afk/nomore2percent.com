'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';

const AREAS = [
  'Gachibowli', 'Madhapur', 'Kondapur', 'Banjara Hills', 'Jubilee Hills', 'Kokapet',
  'Manikonda', 'Miyapur', 'Kukatpally', 'Hitech City', 'Financial District',
  'Nizampet', 'Alwal', 'Uppal', 'Secunderabad', 'Kompally', 'Begumpet', 'Somajiguda', 'Ameerpet',
];

interface HealthFactor { label: string; impact: 'positive' | 'neutral' | 'negative'; note: string; }
interface HealthScore { score: number; band: string; factors: HealthFactor[]; }
interface ValuationResult {
  estimated_low: number;
  estimated_high: number;
  estimated_mid: number;
  rate_per_sqft_used: number;
  used_live_data: boolean;
  live_comp_count: number;
  health: HealthScore;
}

function formatINR(amount: number): string {
  if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
  if (amount >= 100000) return '₹' + (amount / 100000).toFixed(2).replace(/\.00$/, '') + ' L';
  return '₹' + amount.toLocaleString('en-IN');
}

const scoreColor = (band: string) =>
  band === 'Excellent' || band === 'Good' ? 'text-emerald-500' : band === 'Fair' ? 'text-amber-500' : 'text-red-500';
const scoreRing = (band: string) =>
  band === 'Excellent' || band === 'Good' ? 'stroke-emerald-500' : band === 'Fair' ? 'stroke-amber-500' : 'stroke-red-500';
const factorDot = (impact: string) =>
  impact === 'positive' ? 'bg-emerald-500' : impact === 'negative' ? 'bg-red-500' : 'bg-stone-300';

type Stage = 'form' | 'gate' | 'results';

export default function ValuationClient() {
  const searchParams = useSearchParams();
  const prefillArea = searchParams.get('area') || '';
  const prefillType = searchParams.get('type') as 'apartment' | 'villa' | 'independent_house' | 'plot' | 'commercial' | null;
  const prefillSqft = searchParams.get('sqft') || '';
  const prefillName = searchParams.get('name') || '';
  const prefillPhone = searchParams.get('phone') || '';
  const autoRun = searchParams.get('auto') === '1';
  const fromSurvey = searchParams.get('source') === 'survey';

  const [area, setArea] = useState(
    prefillArea ? (AREAS.includes(prefillArea) ? prefillArea : 'Other') : 'Gachibowli'
  );
  const [customArea, setCustomArea] = useState(prefillArea && !AREAS.includes(prefillArea) ? prefillArea : '');
  const [propertyType, setPropertyType] = useState<'apartment' | 'villa' | 'independent_house' | 'plot' | 'commercial'>(prefillType || 'apartment');
  const [sqft, setSqft] = useState(prefillSqft);
  const [ageYears, setAgeYears] = useState('5');

  const [stage, setStage] = useState<Stage>('form');
  const [name, setName] = useState(prefillName);
  const [phone, setPhone] = useState(prefillPhone);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ValuationResult | null>(null);

  const effectiveArea = area === 'Other' ? customArea.trim() : area;
  const alreadyHaveContact = !!(prefillName && prefillPhone);

  const validateForm = () => {
    setError('');
    if (!effectiveArea) { setError('Please enter your locality.'); return false; }
    if (!sqft || Number(sqft) <= 0) { setError('Please enter a valid built-up area in sqft.'); return false; }
    return true;
  };

  const goToGate = () => {
    if (!validateForm()) return;
    setStage('gate');
  };

  const unlock = async (nameOverride?: string, phoneOverride?: string) => {
    const useName = nameOverride ?? name;
    const usePhone = phoneOverride ?? phone;
    if (!alreadyHaveContact) {
      if (!useName.trim()) { setError('Please enter your name.'); return; }
      const cleanPhone = usePhone.replace(/[\s+\-]/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone.slice(-10))) { setError('Please enter a valid mobile number.'); return; }
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/property-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: effectiveArea, property_type: propertyType, sqft: Number(sqft), age_years: Number(ageYears),
          name: useName, phone: usePhone,
        }),
      });
      const data = await res.json();
      if (data.success) { setResult(data); setStage('results'); }
      else setError(data.message || 'Could not generate an estimate. Please try again.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Arriving from the survey with area+sqft (and often name+phone already given
  // via consent) — skip straight to a computed result, no re-asking needed.
  useEffect(() => {
    if (autoRun && prefillArea && prefillSqft) {
      if (alreadyHaveContact) {
        unlock(prefillName, prefillPhone);
      } else {
        setStage('gate');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 bg-stone-50">
      <Header />

      <div className="max-w-2xl mx-auto px-6 md:px-10 py-12">
        {fromSurvey && stage !== 'results' && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2.5">
            <span className="text-lg">🎁</span>
            <span>Thanks for completing the survey! Let's get your free valuation.</span>
          </div>
        )}

        {stage === 'form' && (
          <>
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">What's Your Property's Current Market Value?</h1>
              <p className="text-stone-500 text-sm">
                Answer a few quick questions and get an instant estimate, backed by our own live listings and market data.
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
                    <option value="villa">Villa</option>
                <option value="independent_house">Independent House</option>
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
                onClick={goToGate}
                className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-3 text-sm font-bold transition-colors"
              >
                See My Property's Value →
              </button>
              <p className="text-center text-[11px] text-stone-400 mt-3">Takes about 2 minutes · Free · No obligation</p>
            </div>
          </>
        )}

        {stage === 'gate' && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 text-center max-w-md mx-auto">
            <div className="text-4xl mb-3">📊</div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Your Valuation Is Ready</h2>
            <p className="text-stone-500 text-sm mb-6">
              Enter your details to unlock your estimated value, Property Health Score, and full breakdown.
            </p>

            <div className="flex flex-col gap-3 mb-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="border border-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-orange-400" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 your mobile number" className="border border-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-orange-400" />
            </div>

            {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</div>}

            <button
              onClick={() => unlock()}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg py-3 text-sm font-bold transition-colors"
            >
              {loading ? 'Calculating...' : 'Unlock My Free Valuation →'}
            </button>
            <p className="text-[11px] text-stone-400 mt-3">Your number stays private — used only if you'd like Sumanth to follow up.</p>
            <button onClick={() => setStage('form')} className="text-xs text-stone-400 hover:text-stone-600 mt-4">← Back</button>
          </div>
        )}

        {stage === 'results' && result && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6 md:p-8 text-center">
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
              <p className="text-[11px] text-stone-400 max-w-md mx-auto">
                This is an instant, indicative estimate — not a certified valuation. Actual market value depends on exact condition, floor, view, amenities, and current demand.
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-5 mb-5">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#e7e5e4" strokeWidth="8" />
                    <circle
                      cx="40" cy="40" r="34" fill="none" strokeWidth="8" strokeLinecap="round"
                      className={scoreRing(result.health.band)}
                      strokeDasharray={2 * Math.PI * 34}
                      strokeDashoffset={2 * Math.PI * 34 * (1 - result.health.score / 100)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="font-serif text-xl font-bold text-stone-900">{result.health.score}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-1">Property Health Score</div>
                  <div className={`font-serif text-xl font-bold ${scoreColor(result.health.band)}`}>{result.health.band}</div>
                </div>
              </div>

              <div className="space-y-2.5">
                {result.health.factors.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${factorDot(f.impact)}`} />
                    <div className="text-sm">
                      <span className="font-semibold text-stone-700">{f.label}:</span>{' '}
                      <span className="text-stone-500">{f.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-stone-100 border border-dashed border-stone-300 rounded-2xl p-5 text-center">
              <div className="text-sm font-semibold text-stone-600 mb-1">🔒 Locality Report & PDF Download</div>
              <p className="text-xs text-stone-500">Coming soon — infrastructure ratings, growth trends, and a downloadable report for {effectiveArea}.</p>
            </div>

            <div className="text-center">
              <p className="text-stone-500 text-sm mb-3">Sumanth will reach out if there's anything relevant for your situation.</p>
              <a href="https://wa.me/917013224895" target="_blank" rel="noopener noreferrer" className="inline-block bg-stone-900 text-white rounded-lg px-6 py-3 text-sm font-bold hover:bg-stone-800 transition-colors">
                WhatsApp Sumanth
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
