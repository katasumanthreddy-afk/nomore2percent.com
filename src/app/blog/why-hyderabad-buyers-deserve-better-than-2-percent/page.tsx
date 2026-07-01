import Link from 'next/link';
import Header from '@/components/Header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Why Hyderabad's Home Buyers Deserve Better Than 2% | nomore2percent",
  description: 'Introducing nomore2percent — the brokerage platform built for the Hyderabad market that puts lakhs back in your pocket, without sacrificing service, transparency, or results.',
};

export default function BlogPost() {
  return (
    <div className="flex-1 bg-stone-50">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-orange-950 px-6 md:px-10 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-300 bg-orange-400/10 border border-orange-400/20 px-2.5 py-1 rounded-full">Platform Launch</span>
            <span className="text-stone-500 text-xs">· Hyderabad Real Estate</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
            Why Hyderabad's Home Buyers Deserve <em className="text-orange-300 italic">Better</em> Than 2%
          </h1>
          <p className="text-stone-300 text-sm md:text-base mb-6 leading-relaxed max-w-2xl">
            Introducing nomore2percent — the brokerage platform built for the Hyderabad market that puts lakhs back in your pocket, without sacrificing service, transparency, or results.
          </p>
          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span>By <strong className="text-stone-200">Sumanth</strong>, Founder</span>
            <span>·</span>
            <span>30 May 2026</span>
            <span>·</span>
            <span>8 min read</span>
          </div>
        </div>
      </div>

      {/* Article */}
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-12">
        <div className="prose-custom">

          <p className="text-lg text-stone-700 leading-relaxed font-medium mb-8 pb-8 border-b border-stone-200">
            Every year, thousands of families in Hyderabad make the biggest financial decision of their lives — buying a home. And every year, a quiet 2% tax silently drains crores from their savings, paid not to the builder, not to the government, but to the broker who showed them around a flat they already found online. We built nomore2percent to change that.
          </p>

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">The Problem With Traditional Brokerage</h2>
          <p className="text-stone-600 leading-relaxed mb-4">
            The Hyderabad property market has boomed. Gachibowli, Madhapur, Kondapur, Jubilee Hills — these areas have seen 30–40% appreciation over the last five years, fuelled by IT sector growth and infrastructure investment. Yet the brokerage model hasn't evolved at all. A 2% commission on a ₹1.5 crore apartment is <strong className="text-stone-800">₹3 lakhs</strong> — paid for what, exactly?
          </p>
          <p className="text-stone-600 leading-relaxed mb-6">
            In a world where property listings are on MagicBricks, 99acres, and Housing.com — where buyers do months of independent research before a single site visit — the value proposition of a traditional broker has fundamentally shifted. The negotiation, the paperwork, the coordination: these matter. The discovery part? Not anymore.
          </p>

          {/* Pullquote */}
          <div className="border-l-4 border-orange-400 pl-6 py-2 my-8 bg-orange-50 rounded-r-xl">
            <p className="text-stone-700 italic text-lg leading-relaxed mb-2">
              "We aren't anti-broker. We're anti-overcharge. Great service should cost a fair price — not a percentage that scales with the market regardless of effort."
            </p>
            <cite className="text-sm text-stone-500 not-italic">— Sumanth, Founder of nomore2percent</cite>
          </div>

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">Introducing nomore2percent</h2>
          <p className="text-stone-600 leading-relaxed mb-4">
            nomore2percent is a full-service real estate brokerage platform built specifically for Hyderabad. We list properties, manage leads, coordinate site visits, negotiate deals, and handle documentation — <strong className="text-stone-800">but we charge just 1% brokerage</strong>. That single number is our promise, our name, and our entire business model.
          </p>

          {/* Savings callout */}
          <div className="bg-gradient-to-br from-stone-900 to-orange-950 rounded-2xl p-8 my-8 text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-orange-300 mb-2">Client Savings in 2026</div>
            <div className="font-serif text-5xl font-bold text-white mb-2">₹1.24 Cr</div>
            <div className="text-stone-400 text-sm">saved by our clients collectively this year versus the industry-standard 2% brokerage rate</div>
          </div>

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">What the Platform Offers</h2>
          <p className="text-stone-600 leading-relaxed mb-6">
            We didn't just build a listings page. nomore2percent is a full broker management system — transparent to the client, powerful on the back end. Here's what we've shipped:
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            {[
              { title: 'Curated Property Listings', desc: 'Verified properties across Gachibowli, Madhapur, Banjara Hills, Jubilee Hills, Kondapur, and Hitech City — for sale and for rent.' },
              { title: 'Lead Management Dashboard', desc: 'Every enquiry is tracked with status (Hot, Warm, Cold, Closed), follow-up scheduling, and budget visibility — nothing slips through.' },
              { title: 'Analytics & Pipeline', desc: 'A live sales pipeline from inquiry to close, monthly revenue tracking, and area-wise lead distribution to keep our brokers focused.' },
              { title: 'Site Visit Scheduling', desc: 'Book a site visit directly from the property detail page. Slots are confirmed within the hour — no calling, no waiting.' },
            ].map((f) => (
              <div key={f.title} className="bg-white border border-stone-200 rounded-xl p-5">
                <div className="font-semibold text-stone-800 mb-2">{f.title}</div>
                <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">A Closer Look: The Property Detail Experience</h2>
          <p className="text-stone-600 leading-relaxed mb-6">
            The property detail page is where we've invested the most design and UX thinking. Homebuyers don't just want a list of amenities — they want to <em>feel</em> the property before they visit. Our listing pages include full photo galleries, an amenities breakdown, a transparent savings calculator, and direct WhatsApp contact with the assigned broker.
          </p>

          {/* Mockup */}
          <div className="bg-stone-900 rounded-2xl overflow-hidden my-8 border border-stone-700">
            <div className="bg-stone-800 px-4 py-3 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs text-stone-400 ml-2">nomore2percent.com · Property Detail</span>
            </div>
            <div className="p-6">
              <div className="font-serif text-xl font-bold text-white mb-1">Prestige Skyline Tower</div>
              <div className="text-sm text-stone-400 mb-5">Gachibowli, Hyderabad · 3BHK · 1850 sqft · ₹1.35 Cr</div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Bedrooms', value: '3 BHK' },
                  { label: 'Area', value: '1850 sqft' },
                  { label: 'Price/sqft', value: '₹7,297' },
                  { label: 'Your Savings', value: '₹1.35L', highlight: true },
                ].map((s) => (
                  <div key={s.label} className="bg-stone-800 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-stone-500 uppercase tracking-wide mb-1">{s.label}</div>
                    <div className={'font-semibold text-sm ' + (s.highlight ? 'text-emerald-400' : 'text-white')}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-stone-600 leading-relaxed mb-6">
            Every listing prominently displays the <strong className="text-stone-800">"Your Savings"</strong> figure — exactly how much you save by transacting through nomore2percent instead of a traditional broker. Transparency isn't a feature. It's the foundation.
          </p>

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-6">How It Works — From Enquiry to Keys</h2>
          <div className="space-y-4 mb-8">
            {[
              { num: '1', title: 'Browse & Shortlist', desc: 'Search verified properties by area, budget, and BHK configuration. Filter by sale or rental. Save favourites and compare.' },
              { num: '2', title: 'Book a Site Visit', desc: 'Schedule directly from the property page. A dedicated broker confirms the slot and accompanies you — fully prepared, no wasted time.' },
              { num: '3', title: 'Negotiate with Confidence', desc: 'Our brokers handle negotiation backed by real-time market data for the area. You walk in informed, not guessing.' },
              { num: '4', title: 'Close & Save', desc: 'Documentation, registration coordination, and loan liaison — all included. And when it\'s done, you\'ve paid just 1%. That\'s it.' },
            ].map((step) => (
              <div key={step.num} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-orange-400 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">{step.num}</div>
                <div>
                  <div className="font-semibold text-stone-800 mb-1">{step.title}</div>
                  <p className="text-sm text-stone-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <hr className="border-stone-200 my-10" />

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">Built for Hyderabad, Specifically</h2>
          <p className="text-stone-600 leading-relaxed mb-4">
            We're not a pan-India aggregator pretending to know the Hyderabad market. Every broker on our platform is Hyderabad-based, locality-specialized, and fluent in the nuances that matter: which projects have RERA compliance, which buildings have genuine OC (Occupancy Certificate), what's the real going rate on Road No. 36 vs Road No. 12 in Jubilee Hills, which Kondapur projects have metro connectivity.
          </p>
          <p className="text-stone-600 leading-relaxed mb-8">
            Hyderabad is a city of insiders. Our brokers are those insiders — now accessible at half the cost.
          </p>

          {/* CTA Banner */}
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-8 my-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-white mb-1">Ready to Find Your Home in Hyderabad?</h3>
              <p className="text-orange-100 text-sm">Browse verified listings across the city — and save lakhs in brokerage.</p>
            </div>
            <Link href="/properties" className="bg-white text-orange-600 font-bold rounded-xl px-6 py-3 text-sm hover:bg-orange-50 transition-colors whitespace-nowrap">
              Explore Properties
            </Link>
          </div>

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">What's Coming Next</h2>
          <p className="text-stone-600 leading-relaxed mb-4">
            We're just getting started. In the coming months, nomore2percent will be adding:
          </p>
          <p className="text-stone-600 leading-relaxed mb-4">
            <strong className="text-stone-800">Home Loan Connect</strong> — partner banks with pre-approved rates for our verified listings, so you know your financing before you visit. <strong className="text-stone-800">Legal Desk</strong> — on-platform property lawyers for sale agreement review, title verification, and registration support. <strong className="text-stone-800">NRI Corner</strong> — a dedicated module for non-resident Indians buying property in Hyderabad, with power-of-attorney support and virtual site tours.
          </p>
          <p className="text-stone-600 leading-relaxed">
            The mission doesn't change: make Hyderabad real estate fair, transparent, and affordable. The 2% era is over.
          </p>

        </div>

        {/* Back to blog */}
        <div className="mt-12 pt-8 border-t border-stone-200">
          <Link href="/blog" className="text-sm text-orange-500 hover:text-orange-600 font-medium">← Back to Blog</Link>
        </div>
      </div>
    </div>
  );
}
