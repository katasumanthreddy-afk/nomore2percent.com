import type { Metadata } from 'next';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'About Us | nomore2percent',
  description: "nomore2percent is a Hyderabad real estate brokerage built on real data and fair pricing — verified listings, resident survey data, and AI-powered area insights, backed by a flat 1% brokerage.",
};

const VALUES = [
  { icon: '💯', title: 'Fair Pricing', desc: 'One percent, always. No sliding scale, no hidden add-ons, no "final negotiable" surprises at closing.' },
  { icon: '🔍', title: 'Real Transparency', desc: 'Verified listings, honest photos, and straight answers — even when the answer is "this one isn\'t right for you."' },
  { icon: '📍', title: 'Local Expertise', desc: 'Deep, street-level knowledge of Hyderabad\'s neighborhoods — not just listing data pulled from a database.' },
  { icon: '🤝', title: 'Built on Trust', desc: 'We\'re not anti-broker. We\'re anti-overcharge. Good work deserves fair pay — not a cut that grows just because the market did.' },
];

export default function AboutPage() {
  return (
    <div className="flex-1 bg-stone-50">
      <Header />

      <div className="bg-gradient-to-br from-stone-900 to-orange-950 px-6 md:px-10 py-16 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">About nomore2percent</h1>
          <p className="text-stone-300 text-base leading-relaxed max-w-2xl mx-auto">
            We built nomore2percent because Hyderabad's home buyers deserve better than a quiet 2% tax — and better than guesswork. Real data, honest pricing.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-14">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-4">Our Story</h2>
        <p className="text-stone-600 leading-relaxed mb-4">
          Hyderabad's property market has boomed over the last several years — Gachibowli, Madhapur, Kondapur, Jubilee Hills, and dozens of emerging localities have seen real, sustained growth. But the traditional brokerage model hasn't kept pace. A 2% commission on a ₹1.5 crore home works out to ₹3 lakhs — often for work that today's buyers, armed with listing portals and their own research, have largely already done themselves.
        </p>
        <p className="text-stone-600 leading-relaxed mb-4">
          nomore2percent exists to fix that imbalance. We charge a flat 1% brokerage, always — on every sale, every rental, no exceptions buried in fine print. What you get in return is the part that actually matters: verified listings, honest guidance, and a broker who's invested in getting the deal right, not in maximizing a percentage.
        </p>
        <p className="text-stone-600 leading-relaxed mb-10">
          We're still early — a founder-led, Hyderabad-focused brokerage, not a national franchise. That's by design. It means every listing on this site has actually been looked at, every conversation goes to a real person, and every promise we make is one we can keep.
        </p>

        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-4">More Than a Listings Site</h2>
        <p className="text-stone-600 leading-relaxed mb-4">
          Fair pricing was the starting point — but it turned out to be only half the problem. The other half is that most buyers go into Hyderabad's property market with almost no real data: no sense of how a locality's infrastructure actually holds up, what current residents genuinely think of it, or whether a price is fair for the area, not just for the property.
        </p>
        <p className="text-stone-600 leading-relaxed mb-10">
          So alongside the listings, we built the tools we wished existed when we started: a resident-submitted <strong className="text-stone-800">Market Survey</strong> tracking real infrastructure ratings and growth trends locality by locality, an <strong className="text-stone-800">Area Insights</strong> tool built from our own live listing data, an AI assistant that can actually answer questions about specific properties, and a <strong className="text-stone-800">Property Health Score</strong> on every valuation. None of it replaces good judgment — it's there to make sure you're forming that judgment on real information, not a broker's word alone.
        </p>

        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">What We Stand For</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-white border border-stone-200 rounded-2xl p-5">
              <div className="text-2xl mb-2">{v.icon}</div>
              <div className="font-serif font-bold text-stone-900 mb-1.5">{v.title}</div>
              <p className="text-sm text-stone-600 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-7 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-800 text-white flex items-center justify-center font-serif font-bold text-2xl flex-shrink-0">S</div>
          <div className="text-center md:text-left">
            <div className="font-serif text-xl font-bold text-stone-900">Sumanth</div>
            <div className="text-sm text-orange-500 font-semibold mb-2">Founder & Senior Broker</div>
            <p className="text-sm text-stone-600 leading-relaxed">
              Sumanth founded nomore2percent to bring fair, transparent brokerage to Hyderabad's real estate market. He personally reviews every listing and leads on every deal that comes through the platform.
            </p>
          </div>
        </div>

        <div className="text-center mt-14">
          <a href="https://wa.me/917013224895" target="_blank" rel="noopener noreferrer" className="inline-block bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-8 py-3 text-sm font-bold transition-colors">
            Talk to Sumanth on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
