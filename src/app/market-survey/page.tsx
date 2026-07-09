'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { parseAmount } from '@/lib/parse-amount';

const AREAS = [
  'Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Kondapur',
  'Hitech City', 'Kompally', 'Yapral', 'Alwal', 'Kukatpally', 'Miyapur',
  'Dammaiguda', 'Thumkunta', 'Bachupally', 'Nizampet', 'Bowrampet',
  'Uppal', 'LB Nagar', 'Dilsukhnagar', 'Secunderabad', 'Other',
];

const DEVELOPMENTS = ['Metro', 'Flyover', 'Highway', 'IT Park', 'Mall', 'Hospital', 'School', 'ORR'];
const ISSUES = ['Water', 'Drainage', 'Garbage', 'Traffic', 'Roads', 'Parking', 'Encroachments', 'Pollution'];

interface Form {
  relationship: string;
  respondent_name: string;
  respondent_phone: string;
  willing_to_contact: boolean;
  years_in_locality: string;
  area: string;
  landmark: string;
  property_type: string;
  property_size_value: string;
  property_size_unit: string;
  facing: string;
  corner_plot: string;

  purchase_year: string;
  purchase_price: string;
  purchase_price_per_unit: string;
  purchase_type: string;
  builder_rating_construction: number;
  builder_rating_amenities: number;
  builder_rating_value: number;

  current_value: string;
  price_growth_bucket: string;
  growth_main_reason: string;
  received_offers: string;
  highest_offer: string;

  rating_roads: number;
  rating_water: number;
  rating_electricity: number;
  rating_drainage_garbage: number;
  rating_safety: number;
  rating_traffic_parking: number;
  rating_public_transport: number;
  rating_schools_hospitals: number;
  rating_shopping: number;
  water_source: string;
  power_cuts: string;

  recent_developments_list: string[];
  biggest_issues_list: string[];

  investment_interest: string;
  investment_budget: string;
  preferred_property_type: string;
  preferred_location: string;
  holding_period: string;
  expected_return: string;

  price_trend_1yr: string;
  price_trend_5yr: string;
  recommend_score: number;

  planning_to_sell: string;
  expected_sale_price: string;
  sell_reason: string;
  monthly_rent: string;
  rental_demand: string;

  feedback_best_thing: string;
  feedback_govt_improvement: string;
  feedback_invest_reason: string;
}

const initial: Form = {
  relationship: '', respondent_name: '', respondent_phone: '', willing_to_contact: false,
  years_in_locality: '', area: '', landmark: '', property_type: '',
  property_size_value: '', property_size_unit: 'sqft', facing: '', corner_plot: '',

  purchase_year: '', purchase_price: '', purchase_price_per_unit: '', purchase_type: '',
  builder_rating_construction: 0, builder_rating_amenities: 0, builder_rating_value: 0,

  current_value: '', price_growth_bucket: '', growth_main_reason: '', received_offers: '', highest_offer: '',

  rating_roads: 0, rating_water: 0, rating_electricity: 0, rating_drainage_garbage: 0,
  rating_safety: 0, rating_traffic_parking: 0, rating_public_transport: 0,
  rating_schools_hospitals: 0, rating_shopping: 0, water_source: '', power_cuts: '',

  recent_developments_list: [], biggest_issues_list: [],

  investment_interest: '', investment_budget: '', preferred_property_type: '',
  preferred_location: '', holding_period: '', expected_return: '',

  price_trend_1yr: '', price_trend_5yr: '', recommend_score: 0,

  planning_to_sell: '', expected_sale_price: '', sell_reason: '', monthly_rent: '', rental_demand: '',

  feedback_best_thing: '', feedback_govt_improvement: '', feedback_invest_reason: '',
};

export default function DetailedSurveyPage() {
  const [form, setForm] = useState<Form>(initial);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof Form, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const toggleList = (k: 'recent_developments_list' | 'biggest_issues_list', item: string) => {
    setForm((p) => {
      const list = p[k];
      return { ...p, [k]: list.includes(item) ? list.filter((i) => i !== item) : [...list, item] };
    });
  };

  const isTenant = form.relationship === 'tenant';

  const steps = [
    { title: 'About You & Your Property', subtitle: 'Tell us who you are and the basics' },
    { title: 'Purchase History', subtitle: 'This is gold — what you paid and how' },
    { title: 'Current Value & Growth', subtitle: "What it's worth today and why" },
    { title: 'Infrastructure', subtitle: 'Rate the real ground truth, 1-5' },
    { title: 'Developments & Issues', subtitle: "What's improved, what still needs fixing" },
    { title: 'Investment Interest', subtitle: 'Are you looking to invest further?' },
    { title: 'Future Outlook', subtitle: 'Where do you see this heading?' },
    { title: isTenant ? 'Rental Market' : 'Selling Intent', subtitle: isTenant ? 'Your rent and demand in the area' : 'Any plans to sell?' },
    { title: 'Open Feedback', subtitle: 'In your own words' },
  ];

  const totalSteps = steps.length;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const next = () => {
    if (step === 0 && !form.relationship) { setError('Please select your relationship to the property.'); return; }
    setError('');
    setStep((s) => Math.min(s + 1, totalSteps - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const back = () => { setStep((s) => Math.max(s - 1, 0)); setError(''); };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/market-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          purchase_price: parseAmount(form.purchase_price),
          purchase_price_per_unit: parseAmount(form.purchase_price_per_unit),
          current_value: parseAmount(form.current_value),
          highest_offer: parseAmount(form.highest_offer),
          expected_sale_price: parseAmount(form.expected_sale_price),
          monthly_rent: parseAmount(form.monthly_rent),
          property_size_value: parseAmount(form.property_size_value),
          corner_plot: form.corner_plot === 'yes' ? true : form.corner_plot === 'no' ? false : null,
          received_offers: form.received_offers === 'yes' ? true : form.received_offers === 'no' ? false : null,
        }),
      });
      const result = await res.json();
      if (result.success) setSubmitted(true);
      else setError(result.message || 'Something went wrong. Please try again.');
    } catch { setError('Could not submit. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const buildValuationUrl = () => {
    const typeMap: Record<string, string> = {
      'Apartment': 'apartment', 'Independent House': 'villa', 'Villa': 'villa',
      'Plot': 'plot', 'Commercial': 'commercial', 'Agricultural Land': 'plot',
    };
    const params = new URLSearchParams({ source: 'survey' });
    if (form.area) params.set('area', form.area);
    if (form.property_type && typeMap[form.property_type]) params.set('type', typeMap[form.property_type]);
    if (form.property_size_value && form.property_size_unit !== 'acres') {
      const raw = Number(form.property_size_value);
      const sqft = form.property_size_unit === 'sqyd' ? Math.round(raw * 9) : raw;
      if (sqft > 0) {
        params.set('sqft', String(sqft));
        params.set('auto', '1');
      }
    }
    // If they already consented to contact during the survey, don't make them
    // re-enter name/phone at the valuation gate — they've already given it once.
    if (form.willing_to_contact && form.respondent_name && form.respondent_phone) {
      params.set('name', form.respondent_name);
      params.set('phone', form.respondent_phone);
    }
    return '/property-valuation?' + params.toString();
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col bg-stone-50">
        <Header />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Thank you!</h2>
            <p className="text-stone-500 text-sm mb-6">Your response has been recorded and will help build Hyderabad's most accurate hyperlocal property intelligence database.</p>

            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-5 text-left">
              <div className="text-xs font-bold uppercase tracking-wide text-orange-500 mb-1.5">🎁 Your Reward</div>
              <p className="text-sm text-stone-700 mb-4">As a thank-you, here's a free instant valuation for your own property — pre-filled from what you just told us.</p>
              <a href={buildValuationUrl()} className="block text-center bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-6 py-3 text-sm font-bold transition-colors">
                Get My Free Valuation →
              </a>
            </div>

            <p className="text-stone-500 text-sm mb-4">Sumanth will reach out if there's anything relevant for your situation.</p>
            <a href="https://wa.me/917013224895" target="_blank" rel="noopener noreferrer" className="inline-block border border-stone-200 text-stone-600 rounded-lg px-5 py-2.5 text-sm font-semibold hover:border-stone-300 transition-colors mb-3">
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

          {step === 0 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-stone-500 mb-3">What's your relationship to this property?</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: 'owner', l: 'Owner', i: '🏠' }, { v: 'tenant', l: 'Tenant', i: '🔑' },
                    { v: 'investor', l: 'Investor', i: '📈' }, { v: 'broker', l: 'Broker', i: '🤝' },
                  ].map((r) => (
                    <button key={r.v} onClick={() => set('relationship', r.v)} className={`p-4 rounded-xl border-2 text-left transition-all ${form.relationship === r.v ? 'border-orange-500 bg-orange-50' : 'border-stone-200 hover:border-stone-300'}`}>
                      <div className="text-xl mb-1">{r.i}</div>
                      <div className="font-semibold text-stone-800 text-sm">{r.l}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="Your name (optional)"><input value={form.respondent_name} onChange={(e) => set('respondent_name', e.target.value)} className={ic} placeholder="Full name" /></F>
                <F label="Mobile number (optional)"><input value={form.respondent_phone} onChange={(e) => set('respondent_phone', e.target.value)} className={ic} placeholder="+91 your number" /></F>
                <F label="Years living in this locality"><input value={form.years_in_locality} onChange={(e) => set('years_in_locality', e.target.value)} className={ic} placeholder="e.g. 5" /></F>
                <F label="Area / Locality *">
                  <select value={form.area} onChange={(e) => set('area', e.target.value)} className={ic}>
                    <option value="">Select area</option>
                    {AREAS.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </F>
                <F label="Nearest landmark"><input value={form.landmark} onChange={(e) => set('landmark', e.target.value)} className={ic} placeholder="e.g. near XYZ signal" /></F>
                <F label="Property type">
                  <select value={form.property_type} onChange={(e) => set('property_type', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>Apartment</option><option>Independent House</option><option>Villa</option>
                    <option>Plot</option><option>Commercial</option><option>Agricultural Land</option>
                  </select>
                </F>
                <F label="Size">
                  <div className="flex gap-2">
                    <input value={form.property_size_value} onChange={(e) => set('property_size_value', e.target.value)} className={ic} placeholder="e.g. 1450" />
                    <select value={form.property_size_unit} onChange={(e) => set('property_size_unit', e.target.value)} className={ic + ' w-28 flex-shrink-0'}>
                      <option value="sqft">sq.ft</option>
                      <option value="sqyd">sq.yd</option>
                      <option value="acres">acres</option>
                    </select>
                  </div>
                </F>
                <F label="Facing">
                  <select value={form.facing} onChange={(e) => set('facing', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>East</option><option>West</option><option>North</option><option>South</option>
                  </select>
                </F>
              </div>

              <F label="Corner plot?">
                <div className="flex gap-3">
                  {['yes', 'no'].map((v) => (
                    <button key={v} onClick={() => set('corner_plot', v)} className={`px-4 py-2 rounded-lg border text-sm capitalize transition-colors ${form.corner_plot === v ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>{v}</button>
                  ))}
                </div>
              </F>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-500">Skip anything you'd rather not share — every field here is optional.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="When did you buy? (Year)"><input value={form.purchase_year} onChange={(e) => set('purchase_year', e.target.value)} className={ic} placeholder="e.g. 2018" /></F>
                <F label="Purchase price (₹)"><input value={form.purchase_price} onChange={(e) => set('purchase_price', e.target.value)} className={ic} placeholder="e.g. 6500000" /></F>
                <F label={`Price per ${form.property_size_unit === 'sqyd' ? 'sq.yd' : form.property_size_unit === 'acres' ? 'acre' : 'sq.ft'} (₹)`}><input value={form.purchase_price_per_unit} onChange={(e) => set('purchase_price_per_unit', e.target.value)} className={ic} placeholder="e.g. 4500" /></F>
                <F label="How did you acquire it?">
                  <select value={form.purchase_type} onChange={(e) => set('purchase_type', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option value="builder">Builder Purchase</option>
                    <option value="resale">Resale</option>
                    <option value="owner_direct">Owner Direct</option>
                    <option value="auction">Auction</option>
                  </select>
                </F>
              </div>

              {form.purchase_type === 'builder' && (
                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <ST>Builder Satisfaction</ST>
                  <Stars label="Construction quality" value={form.builder_rating_construction} onChange={(v) => set('builder_rating_construction', v)} />
                  <Stars label="Amenities" value={form.builder_rating_amenities} onChange={(v) => set('builder_rating_amenities', v)} />
                  <Stars label="Value for money" value={form.builder_rating_value} onChange={(v) => set('builder_rating_value', v)} />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F label="What's it worth today? (₹)"><input value={form.current_value} onChange={(e) => set('current_value', e.target.value)} className={ic} placeholder="e.g. 9500000" /></F>
                <F label="Main reason for growth">
                  <select value={form.growth_main_reason} onChange={(e) => set('growth_main_reason', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    {['Metro', 'ORR', 'IT Parks', 'Schools', 'Hospitals', 'Highway', 'Airport', 'Commercial Development', 'Demand Increase'].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </F>
              </div>

              <F label="How much has the value increased since purchase?">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Less than 25%', '25-50%', '50-100%', '100-200%', 'More than 200%'].map((o) => (
                    <button key={o} onClick={() => set('price_growth_bucket', o)} className={`px-3 py-2 rounded-lg border text-xs transition-colors ${form.price_growth_bucket === o ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>{o}</button>
                  ))}
                </div>
              </F>

              <F label="Received any offers recently?">
                <div className="flex gap-3">
                  {['yes', 'no'].map((v) => (
                    <button key={v} onClick={() => set('received_offers', v)} className={`px-4 py-2 rounded-lg border text-sm capitalize transition-colors ${form.received_offers === v ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>{v}</button>
                  ))}
                </div>
              </F>
              {form.received_offers === 'yes' && (
                <F label="Highest offer (₹)"><input value={form.highest_offer} onChange={(e) => set('highest_offer', e.target.value)} className={ic} placeholder="e.g. 9000000" /></F>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-500">Rate each from 1 (poor) to 5 (excellent).</p>
              <Stars label="Roads & footpaths" value={form.rating_roads} onChange={(v) => set('rating_roads', v)} />
              <Stars label="Water supply" value={form.rating_water} onChange={(v) => set('rating_water', v)} />
              <Stars label="Electricity" value={form.rating_electricity} onChange={(v) => set('rating_electricity', v)} />
              <Stars label="Drainage & garbage collection" value={form.rating_drainage_garbage} onChange={(v) => set('rating_drainage_garbage', v)} />
              <Stars label="Safety" value={form.rating_safety} onChange={(v) => set('rating_safety', v)} />
              <Stars label="Traffic & parking" value={form.rating_traffic_parking} onChange={(v) => set('rating_traffic_parking', v)} />
              <Stars label="Public transport & metro" value={form.rating_public_transport} onChange={(v) => set('rating_public_transport', v)} />
              <Stars label="Schools & hospitals nearby" value={form.rating_schools_hospitals} onChange={(v) => set('rating_schools_hospitals', v)} />
              <Stars label="Shopping & daily needs" value={form.rating_shopping} onChange={(v) => set('rating_shopping', v)} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-stone-100">
                <F label="Water source">
                  <select value={form.water_source} onChange={(e) => set('water_source', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option>GHMC</option><option>Borewell</option><option>Tanker</option><option>Mixed</option>
                  </select>
                </F>
                <F label="Power cuts">
                  <select value={form.power_cuts} onChange={(e) => set('power_cuts', e.target.value)} className={ic}>
                    <option value="">Select</option>
                    <option value="never">Never</option><option value="rarely">Rarely</option>
                    <option value="weekly">Weekly</option><option value="daily">Daily</option>
                  </select>
                </F>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <F label="Which developments have improved your locality recently?">
                <div className="flex flex-wrap gap-2">
                  {DEVELOPMENTS.map((d) => (
                    <button key={d} onClick={() => toggleList('recent_developments_list', d)} className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${form.recent_developments_list.includes(d) ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>{d}</button>
                  ))}
                </div>
              </F>
              <F label="What are the biggest problems in your area?">
                <div className="flex flex-wrap gap-2">
                  {ISSUES.map((i) => (
                    <button key={i} onClick={() => toggleList('biggest_issues_list', i)} className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${form.biggest_issues_list.includes(i) ? 'border-red-400 bg-red-50 text-red-600' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>{i}</button>
                  ))}
                </div>
              </F>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <F label="Are you interested in investing in real estate?">
                <div className="flex gap-3">
                  {['yes', 'no', 'maybe'].map((v) => (
                    <button key={v} onClick={() => set('investment_interest', v)} className={`px-4 py-2 rounded-lg border text-sm capitalize transition-colors ${form.investment_interest === v ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>{v}</button>
                  ))}
                </div>
              </F>

              {form.investment_interest && form.investment_interest !== 'no' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <F label="Investment budget">
                    <select value={form.investment_budget} onChange={(e) => set('investment_budget', e.target.value)} className={ic}>
                      <option value="">Select</option>
                      {['₹10L–25L', '₹25L–50L', '₹50L–1Cr', '₹1Cr–2Cr', '₹2Cr+'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </F>
                  <F label="Preferred property type">
                    <select value={form.preferred_property_type} onChange={(e) => set('preferred_property_type', e.target.value)} className={ic}>
                      <option value="">Select</option>
                      {['Apartment', 'Villa', 'Independent House', 'Plot', 'Commercial', 'Warehouse', 'Agricultural Land'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </F>
                  <F label="Preferred location"><input value={form.preferred_location} onChange={(e) => set('preferred_location', e.target.value)} className={ic} placeholder="e.g. Kokapet, Financial District" /></F>
                  <F label="Expected holding period">
                    <select value={form.holding_period} onChange={(e) => set('holding_period', e.target.value)} className={ic}>
                      <option value="">Select</option>
                      {['1 Year', '3 Years', '5 Years', '10 Years'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </F>
                  <F label="Expected annual return">
                    <select value={form.expected_return} onChange={(e) => set('expected_return', e.target.value)} className={ic}>
                      <option value="">Select</option>
                      {['8%', '10%', '12%', '15%', '20%+'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </F>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <F label="Do you think prices will rise in the next 1 year?">
                <div className="flex gap-3">
                  {[{ v: 'up', e: '⬆️' }, { v: 'flat', e: '➡️' }, { v: 'down', e: '⬇️' }].map((o) => (
                    <button key={o.v} onClick={() => set('price_trend_1yr', o.v)} className={`flex-1 py-3 rounded-lg border text-xl transition-colors ${form.price_trend_1yr === o.v ? 'border-orange-500 bg-orange-50' : 'border-stone-200 hover:border-stone-300'}`}>{o.e}</button>
                  ))}
                </div>
              </F>
              <F label="What about over the next 5 years?">
                <div className="flex gap-3">
                  {[{ v: 'up', e: '⬆️' }, { v: 'flat', e: '➡️' }, { v: 'down', e: '⬇️' }].map((o) => (
                    <button key={o.v} onClick={() => set('price_trend_5yr', o.v)} className={`flex-1 py-3 rounded-lg border text-xl transition-colors ${form.price_trend_5yr === o.v ? 'border-orange-500 bg-orange-50' : 'border-stone-200 hover:border-stone-300'}`}>{o.e}</button>
                  ))}
                </div>
              </F>
              <F label="On a scale of 1-10, would you recommend this locality?">
                <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => set('recommend_score', n)} className={`py-2 rounded-lg border text-sm font-semibold transition-colors ${form.recommend_score === n ? 'border-orange-500 bg-orange-500 text-white' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>{n}</button>
                  ))}
                </div>
              </F>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              {isTenant ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <F label="Monthly rent (₹)"><input value={form.monthly_rent} onChange={(e) => set('monthly_rent', e.target.value)} className={ic} placeholder="e.g. 22000" /></F>
                  <F label="Rental demand in your area">
                    <select value={form.rental_demand} onChange={(e) => set('rental_demand', e.target.value)} className={ic}>
                      <option value="">Select</option>
                      <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                    </select>
                  </F>
                </div>
              ) : (
                <>
                  <F label="Are you planning to sell?">
                    <div className="flex gap-3">
                      {['yes', 'no', 'maybe'].map((v) => (
                        <button key={v} onClick={() => set('planning_to_sell', v)} className={`px-4 py-2 rounded-lg border text-sm capitalize transition-colors ${form.planning_to_sell === v ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>{v}</button>
                      ))}
                    </div>
                  </F>
                  {form.planning_to_sell && form.planning_to_sell !== 'no' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <F label="Expected price (₹)"><input value={form.expected_sale_price} onChange={(e) => set('expected_sale_price', e.target.value)} className={ic} placeholder="e.g. 9500000" /></F>
                      <F label="Main reason">
                        <select value={form.sell_reason} onChange={(e) => set('sell_reason', e.target.value)} className={ic}>
                          <option value="">Select</option>
                          <option>Upgrade</option><option>Investment</option><option>Relocation</option>
                          <option>Financial Need</option><option>Other</option>
                        </select>
                      </F>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <F label="What's the best thing about your locality?"><textarea value={form.feedback_best_thing} onChange={(e) => set('feedback_best_thing', e.target.value)} className={ic + ' h-20 resize-none'} /></F>
              <F label="What should the government improve?"><textarea value={form.feedback_govt_improvement} onChange={(e) => set('feedback_govt_improvement', e.target.value)} className={ic + ' h-20 resize-none'} /></F>
              <F label="What would make you invest here?"><textarea value={form.feedback_invest_reason} onChange={(e) => set('feedback_invest_reason', e.target.value)} className={ic + ' h-20 resize-none'} /></F>

              <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                <input type="checkbox" checked={form.willing_to_contact} onChange={(e) => set('willing_to_contact', e.target.checked)} className="mt-0.5" />
                <span className="text-xs text-stone-500">I'm open to Sumanth contacting me about this property or investment opportunities.</span>
              </label>
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

          <p className="text-xs text-stone-400 text-center mt-3">All responses are private · No spam · Takes 5–7 minutes</p>
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

function Stars({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-stone-600">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => onChange(n)} className="text-xl leading-none" aria-label={`${n} star`}>
            {n <= value ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    </div>
  );
}
