'use client';

import { useState } from 'react';
import Header from '@/components/Header';

const AREAS = [
  'Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Kondapur',
  'Hitech City', 'Kompally', 'Yapral', 'Alwal', 'Kukatpally', 'Miyapur',
  'Dammaiguda', 'Thumkunta', 'Bachupally', 'Nizampet', 'Bowrampet',
  'Uppal', 'LB Nagar', 'Dilsukhnagar', 'Secunderabad', 'Other',
];

const INFRA_OPTIONS = ['Good', 'Average', 'Poor', 'Very Poor'];
const PURCHASE_RANGES = [
  'Under ₹20 Lakhs', '₹20L – ₹40L', '₹40L – ₹60L', '₹60L – ₹80L',
  '₹80L – ₹1 Cr', '₹1 Cr – ₹1.5 Cr', '₹1.5 Cr – ₹2 Cr',
  '₹2 Cr – ₹3 Cr', '₹3 Cr – ₹5 Cr', 'Above ₹5 Cr',
];
const RENT_RANGES = [
  'Under ₹8,000/month', '₹8,000 – ₹12,000', '₹12,000 – ₹18,000',
  '₹18,000 – ₹25,000', '₹25,000 – ₹35,000', '₹35,000 – ₹50,000',
  '₹50,000 – ₹75,000', 'Above ₹75,000/month',
];
const DEPOSIT_RANGES = [
  'Under ₹50,000', '₹50,000 – ₹1 Lakh', '₹1L – ₹2L',
  '₹2L – ₹3L', '₹3L – ₹5L', 'Above ₹5 Lakhs',
];
const CURRENT_VALUE_RANGES = [
  'Under ₹30 Lakhs', '₹30L – ₹60L', '₹60L – ₹1 Cr',
  '₹1 Cr – ₹1.5 Cr', '₹1.5 Cr – ₹2 Cr', '₹2 Cr – ₹3 Cr',
  '₹3 Cr – ₹5 Cr', 'Above ₹5 Cr',
];

type UserType = 'owner' | 'renter' | '';

interface InfraRating {
  water_supply: string;
  road_width: string;
  road_condition: string;
  power_cuts: string;
  drainage: string;
  garbage_collection: string;
}

interface Form {
  user_type: UserType;
  name: string;
  phone: string;
  willing_to_contact: string;

  area: string;
  locality: string;
  property_type: string;
  bhk: string;
  floor: string;
  building_age: string;
  society_name: string;

  purchase_year: string;
  purchase_price_range: string;
  purchase_price_exact: string;
  purchase_price_per_sqft: string;
  current_value_range: string;
  current_value_exact: string;
  appreciation_feel: string;

  rent_amount_range: string;
  rent_amount_exact: string;
  deposit_range: string;
  deposit_exact: string;
  rent_increase_last_year: string;
  rent_increase_amount: string;
  years_renting: string;

  infra: InfraRating;

  nearby_developments: string;
  metro_connectivity: string;
  new_projects_nearby: string;
  price_impact_of_developments: string;

  builder_name: string;
  builder_rating: string;
  maintenance_charges: string;
  oc_status: string;
  society_quality: string;

  would_recommend_area: string;
  best_about_area: string;
  worst_about_area: string;
}

const initial: Form = {
  user_type: '',
  name: '', phone: '', willing_to_contact: 'Yes',
  area: '', locality: '', property_type: '', bhk: '', floor: '', building_age: '', society_name: '',
  purchase_year: '', purchase_price_range: '', purchase_price_exact: '',
  purchase_price_per_sqft: '', current_value_range: '', current_value_exact: '', appreciation_feel: '',
  rent_amount_range: '', rent_amount_exact: '', deposit_range: '', deposit_exact: '',
  rent_increase_last_year: '', rent_increase_amount: '', years_renting: '',
  infra: { water_supply: '', road_width: '', road_condition: '', power_cuts: '', drainage: '', garbage_collection: '' },
  nearby_developments: '', metro_connectivity: '', new_projects_nearby: '', price_impact_of_developments: '',
  builder_name: '', builder_rating: '', maintenance_charges: '', oc_status: '', society_quality: '',
  would_recommend_area: '', best_about_area: '', worst_about_area: '',
};

export default function DetailedSurveyPage() {
  const [form, setForm] = useState<Form>(initial);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof Form, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const setInfra = (k: keyof InfraRating, v: string) => setForm((p) => ({ ...p, infra: { ...p.infra, [k]: v } }));

  const steps = [
    { title: 'Who are you?', subtitle: 'Owner or renter — this shapes your questions' },
    { title: 'Property details', subtitle: 'Tell us about the property' },
    form.user_type === 'owner'
      ? { title: 'Purchase & pricing', subtitle: 'What you paid and current value' }
      : { title: 'Rent & deposit', subtitle: 'What you pay and how it has changed' },
    { title: 'Infrastructure', subtitle: 'Water, roads, power, drainage — real ground truth' },
    { title: 'Developments', subtitle: 'What\'s changed nearby recently' },
    { title: 'Builder & society', subtitle: 'Quality, reputation, maintenance' },
    { title: 'Your view', subtitle: 'What\'s great and what\'s not' },
    { title: 'Your details', subtitle: 'So Sumanth can follow up if needed' },
  ];

  const totalSteps = steps.length;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const next = () => {
    if (step === 0 && !form.user_type) { setError('Please select if you are an owner or renter.'); return; }
    setError('');
    setStep((s) => Math.min(s + 1, totalSteps - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => { setStep((s) => Math.max(s - 1, 0)); setError(''); };

  const submit = async () => {
    if (!form.name || !form.phone) { setError('Please enter your name and phone number.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/market-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (result.success) { setSubmitted(true); }
      else { setError(result.message || 'Something went wrong. Please try again.'); }
    } catch { setError('Could not submit. Please try again.'); }
    finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col bg-stone-50">
        <Header />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Thank you!</h2>
            <p className="text-stone-500 text-sm mb-2">Your response has been recorded and will help build Hyderabad's most accurate hyperlocal property intelligence database.</p>
            <p className="text-stone-500 text-sm mb-6">Sumanth will reach out if there's anything relevant for your situation.</p>
            <a href="https://wa.me/917013224895" target="_blank" rel="noopener noreferrer" className="inline-block bg-green-500 text-white rounded-lg px-6 py-3 text-sm font-bold hover:bg-green-600 transition-colors mb-3">
              WhatsApp Sumanth
            </a>
            <div><a href="/properties" className="text-sm text-orange-500 hover:underline">Browse Properties →</a></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-stone-50">
      <Header />

      <div className="bg-gradient-to-br from-stone-900 to-orange-950 px-6 md:px-10 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-widest text-orange-300 mb-2">Hyderabad Property Intelligence Survey</div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-white mb-1">{steps[step].title}</h1>
          <p className="text-stone-400 text-sm">{steps[step].subtitle}</p>
          <div className="mt-5 h-1.5 bg-stone-700 rounded-full overflow-hidden">
            <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: progress + '%' }} />
          </div>
          <div className="text-xs text-stone-500 mt-1.5">Step {step + 1} of {totalSteps}</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 md:px-10 py-8 w-full">
        <div className="bg-white border border-stone-200 rounded-2xl p-6">

          {/* ── STEP 0: User type ── */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-500">Are you a property owner or a renter in Hyderabad?</p>
              <div className="grid grid-cols-2 gap-4">
                {(['owner', 'renter'] as UserType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => set('user_type', type)}
                    className={`p-5 rounded-xl border-2 text-left transition-all ${
                      form.user_type === type
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type === 'owner' ? '🏠' : '🔑'}</div>
                    <div className="font-semibold text-stone-800 capitalize">{type}</div>
                    <div className="text-xs text-stone-400 mt-1">
                      {type === 'owner' ? 'I own this property' : 'I rent this property'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 1: Property details ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Area / Locality *">
                  <select value={form.area} onChange={(e) => set('area', e.target.value)} className={ic}>
                    <option value="">Select area</option>
                    {AREAS.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </F>
                <F label="Street / Colony name">
                  <input value={form.locality} onChange={(e) => set('locality', e.target.value)} className={ic} placeholder="e.g. Prashant Hills, Phase 2" />
                </F>
                <F label="Property type">
                  <select value={form.property_type} onChange={(e) => set('property_type', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>Apartment / Flat</option>
                    <option>Villa / Independent House</option>
                    <option>Plot / Open land</option>
                    <option>Row house / Duplex</option>
                    <option>Commercial</option>
                  </select>
                </F>
                <F label="BHK configuration">
                  <select value={form.bhk} onChange={(e) => set('bhk', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>1 BHK</option><option>2 BHK</option><option>3 BHK</option>
                    <option>4 BHK</option><option>4+ BHK</option><option>Studio</option>
                  </select>
                </F>
                <F label="Floor number">
                  <input value={form.floor} onChange={(e) => set('floor', e.target.value)} className={ic} placeholder="e.g. Ground, 3rd, 12th" />
                </F>
                <F label="Age of building">
                  <select value={form.building_age} onChange={(e) => set('building_age', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>Under construction</option>
                    <option>0–2 years</option><option>2–5 years</option>
                    <option>5–10 years</option><option>10–20 years</option>
                    <option>Above 20 years</option>
                  </select>
                </F>
                <F label="Society / Project name" full>
                  <input value={form.society_name} onChange={(e) => set('society_name', e.target.value)} className={ic} placeholder="e.g. Prestige High Fields, Rainbow Vistas" />
                </F>
              </div>
            </div>
          )}

          {/* ── STEP 2: Owner — Purchase & pricing ── */}
          {step === 2 && form.user_type === 'owner' && (
            <div className="space-y-5">
              <ST>Purchase details</ST>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Year of purchase">
                  <select value={form.purchase_year} onChange={(e) => set('purchase_year', e.target.value)} className={ic}>
                    <option value="">Select year</option>
                    {Array.from({ length: 25 }, (_, i) => 2025 - i).map((y) => <option key={y}>{y}</option>)}
                  </select>
                </F>
                <F label="Purchase price range">
                  <select value={form.purchase_price_range} onChange={(e) => set('purchase_price_range', e.target.value)} className={ic}>
                    <option value="">Select range</option>
                    {PURCHASE_RANGES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </F>
                <F label="Exact price paid (optional)">
                  <input value={form.purchase_price_exact} onChange={(e) => set('purchase_price_exact', e.target.value)} className={ic} placeholder="e.g. 72,50,000" />
                </F>
                <F label="Price per sqft at purchase (optional)">
                  <input value={form.purchase_price_per_sqft} onChange={(e) => set('purchase_price_per_sqft', e.target.value)} className={ic} placeholder="e.g. ₹4,200/sqft" />
                </F>
              </div>
              <ST>Current value</ST>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Estimated current value range">
                  <select value={form.current_value_range} onChange={(e) => set('current_value_range', e.target.value)} className={ic}>
                    <option value="">Select range</option>
                    {CURRENT_VALUE_RANGES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </F>
                <F label="Exact current value estimate (optional)">
                  <input value={form.current_value_exact} onChange={(e) => set('current_value_exact', e.target.value)} className={ic} placeholder="e.g. 1,10,00,000" />
                </F>
                <F label="How would you describe appreciation?" full>
                  <select value={form.appreciation_feel} onChange={(e) => set('appreciation_feel', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>Very strong — much more than expected</option>
                    <option>Good — in line with expectations</option>
                    <option>Moderate — slower than expected</option>
                    <option>Flat — no real appreciation</option>
                    <option>Negative — value has fallen</option>
                  </select>
                </F>
              </div>
            </div>
          )}

          {/* ── STEP 2: Renter — Rent & deposit ── */}
          {step === 2 && form.user_type === 'renter' && (
            <div className="space-y-5">
              <ST>Current rent</ST>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Monthly rent range">
                  <select value={form.rent_amount_range} onChange={(e) => set('rent_amount_range', e.target.value)} className={ic}>
                    <option value="">Select range</option>
                    {RENT_RANGES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </F>
                <F label="Exact monthly rent (optional)">
                  <input value={form.rent_amount_exact} onChange={(e) => set('rent_amount_exact', e.target.value)} className={ic} placeholder="e.g. ₹22,000/month" />
                </F>
                <F label="How many years have you been renting here?">
                  <select value={form.years_renting} onChange={(e) => set('years_renting', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>Less than 1 year</option><option>1–2 years</option>
                    <option>2–3 years</option><option>3–5 years</option>
                    <option>More than 5 years</option>
                  </select>
                </F>
              </div>
              <ST>Security deposit</ST>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Deposit amount range">
                  <select value={form.deposit_range} onChange={(e) => set('deposit_range', e.target.value)} className={ic}>
                    <option value="">Select range</option>
                    {DEPOSIT_RANGES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </F>
                <F label="Exact deposit amount (optional)">
                  <input value={form.deposit_exact} onChange={(e) => set('deposit_exact', e.target.value)} className={ic} placeholder="e.g. ₹1,50,000" />
                </F>
              </div>
              <ST>Rent changes</ST>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Did your rent increase in the last 12 months?">
                  <select value={form.rent_increase_last_year} onChange={(e) => set('rent_increase_last_year', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>Yes — significant increase (10%+)</option>
                    <option>Yes — moderate increase (5–10%)</option>
                    <option>Yes — small increase (under 5%)</option>
                    <option>No — rent stayed the same</option>
                    <option>Rent was reduced</option>
                  </select>
                </F>
                <F label="Increase amount (if applicable)">
                  <input value={form.rent_increase_amount} onChange={(e) => set('rent_increase_amount', e.target.value)} className={ic} placeholder="e.g. ₹2,000/month or 8%" />
                </F>
              </div>
            </div>
          )}

          {/* ── STEP 3: Infrastructure ── */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-stone-500">Rate the infrastructure in your area honestly. This is the most valuable data for buyers considering your locality.</p>
              {([
                { key: 'water_supply', label: 'Water supply', hint: 'Daily supply, hours available, quality' },
                { key: 'road_width', label: 'Road width & access', hint: 'Main road and internal roads' },
                { key: 'road_condition', label: 'Road condition', hint: 'Potholes, repairs, drainage from roads' },
                { key: 'power_cuts', label: 'Power supply', hint: 'Frequency of cuts, duration' },
                { key: 'drainage', label: 'Drainage & flooding', hint: 'Monsoon flooding, stormwater drainage' },
                { key: 'garbage_collection', label: 'Garbage collection', hint: 'Frequency, door-to-door service' },
              ] as { key: keyof InfraRating; label: string; hint: string }[]).map((item) => (
                <div key={item.key}>
                  <div className="text-sm font-medium text-stone-700 mb-0.5">{item.label}</div>
                  <div className="text-xs text-stone-400 mb-2">{item.hint}</div>
                  <div className="flex gap-2 flex-wrap">
                    {INFRA_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setInfra(item.key, opt)}
                        className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                          form.infra[item.key] === opt
                            ? opt === 'Good' ? 'bg-emerald-500 text-white border-emerald-500'
                            : opt === 'Average' ? 'bg-orange-400 text-white border-orange-400'
                            : opt === 'Poor' ? 'bg-red-400 text-white border-red-400'
                            : 'bg-red-700 text-white border-red-700'
                            : 'border-stone-200 text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── STEP 4: Developments ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Metro / MMTS connectivity" full>
                  <select value={form.metro_connectivity} onChange={(e) => set('metro_connectivity', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>Metro station within 500m</option>
                    <option>Metro station within 1–2km</option>
                    <option>Metro planned / under construction nearby</option>
                    <option>No metro connectivity</option>
                    <option>MMTS station nearby</option>
                  </select>
                </F>
                <F label="New residential projects nearby?" full>
                  <select value={form.new_projects_nearby} onChange={(e) => set('new_projects_nearby', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>Many new projects under construction</option>
                    <option>A few new projects</option>
                    <option>Mostly established — few new projects</option>
                    <option>No new development activity</option>
                  </select>
                </F>
                <F label="Key developments in your area recently" full>
                  <textarea
                    value={form.nearby_developments}
                    onChange={(e) => set('nearby_developments', e.target.value)}
                    className={ic + ' min-h-24'}
                    placeholder="e.g. New ORR interchange opened, IT park under construction 2km away, new school, hospital, shopping mall etc."
                  />
                </F>
                <F label="How have these developments impacted property prices?" full>
                  <select value={form.price_impact_of_developments} onChange={(e) => set('price_impact_of_developments', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>Significant positive impact — prices jumped</option>
                    <option>Moderate positive impact</option>
                    <option>Little to no impact so far</option>
                    <option>Negative impact — prices fell</option>
                    <option>Too early to tell</option>
                  </select>
                </F>
              </div>
            </div>
          )}

          {/* ── STEP 5: Builder & society ── */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Builder / Developer name">
                  <input value={form.builder_name} onChange={(e) => set('builder_name', e.target.value)} className={ic} placeholder="e.g. Prestige, Aparna, My Home" />
                </F>
                <F label="Builder quality rating">
                  <select value={form.builder_rating} onChange={(e) => set('builder_rating', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>Excellent — delivered on all promises</option>
                    <option>Good — minor issues, mostly satisfied</option>
                    <option>Average — several issues, not fully satisfied</option>
                    <option>Poor — major issues, would not recommend</option>
                    <option>Independent house / No builder</option>
                  </select>
                </F>
                <F label="Monthly maintenance charges">
                  <select value={form.maintenance_charges} onChange={(e) => set('maintenance_charges', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>No maintenance (independent house)</option>
                    <option>Under ₹1,000/month</option>
                    <option>₹1,000 – ₹2,500/month</option>
                    <option>₹2,500 – ₹5,000/month</option>
                    <option>₹5,000 – ₹10,000/month</option>
                    <option>Above ₹10,000/month</option>
                  </select>
                </F>
                <F label="Occupancy Certificate (OC) status">
                  <select value={form.oc_status} onChange={(e) => set('oc_status', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>OC obtained — fully compliant</option>
                    <option>OC pending — applied but not received</option>
                    <option>No OC — not yet applied</option>
                    <option>Not applicable (plot / old construction)</option>
                    <option>Not sure</option>
                  </select>
                </F>
                <F label="Overall society / building quality" full>
                  <select value={form.society_quality} onChange={(e) => set('society_quality', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>Excellent — well maintained, good management</option>
                    <option>Good — mostly well kept</option>
                    <option>Average — some maintenance issues</option>
                    <option>Poor — poorly maintained, management issues</option>
                  </select>
                </F>
              </div>
            </div>
          )}

          {/* ── STEP 6: Your view ── */}
          {step === 6 && (
            <div className="space-y-4">
              <F label="Would you recommend this area to a friend or family member looking to buy/rent?" full>
                <div className="flex gap-3 flex-wrap mt-1">
                  {['Definitely yes', 'Probably yes', 'Not sure', 'Probably not', 'Definitely not'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => set('would_recommend_area', opt)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                        form.would_recommend_area === opt
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </F>
              <F label="What's the best thing about living / owning in this area?" full>
                <textarea
                  value={form.best_about_area}
                  onChange={(e) => set('best_about_area', e.target.value)}
                  className={ic + ' min-h-24'}
                  placeholder="e.g. Peaceful neighbourhood, close to schools, good connectivity, appreciating values..."
                />
              </F>
              <F label="What's the biggest problem or concern in this area?" full>
                <textarea
                  value={form.worst_about_area}
                  onChange={(e) => set('worst_about_area', e.target.value)}
                  className={ic + ' min-h-24'}
                  placeholder="e.g. Waterlogging in monsoon, traffic congestion, no metro, poor road condition..."
                />
              </F>
            </div>
          )}

          {/* ── STEP 7: Contact details ── */}
          {step === 7 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-500">Your details are private — only Sumanth will see them, and only to follow up if there's something relevant for your situation.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Your name *">
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} className={ic} placeholder="Sumanth Reddy" />
                </F>
                <F label="WhatsApp number *">
                  <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={ic} placeholder="+91 98765 43210" />
                </F>
                <F label="Can Sumanth contact you about relevant properties?" full>
                  <div className="flex gap-3 mt-1">
                    {['Yes', 'No — survey only'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => set('willing_to_contact', opt)}
                        className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                          form.willing_to_contact === opt
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'border-stone-200 text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </F>
              </div>
            </div>
          )}

          {error && <div className="text-sm text-red-500 mt-4 p-3 bg-red-50 rounded-lg">{error}</div>}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={back} className="px-5 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-sm hover:border-stone-300 transition-colors">
                Back
              </button>
            )}
            {step < totalSteps - 1 ? (
              <button onClick={next} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-bold transition-colors">
                Continue →
              </button>
            ) : (
              <button onClick={submit} disabled={submitting} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-bold transition-colors disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Survey'}
              </button>
            )}
          </div>

          <p className="text-xs text-stone-400 text-center mt-3">All responses are private · No spam · Takes 4–6 minutes</p>
        </div>
      </div>
    </div>
  );
}

const ic = "w-full border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-700 outline-none focus:border-orange-400 bg-white";

function ST({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-bold uppercase tracking-widest text-stone-400 pt-2 pb-1 border-b border-stone-100">{children}</div>;
}

function F({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-medium text-stone-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
