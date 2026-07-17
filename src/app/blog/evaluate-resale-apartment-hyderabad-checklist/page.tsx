import Link from 'next/link';
import Header from '@/components/Header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Evaluate a Resale Apartment in Hyderabad: A Practical Checklist | nomore2percent',
  description: 'A room-by-room, document-by-document checklist for evaluating a resale apartment in Hyderabad before you make an offer.',
};

export default function BlogPost() {
  return (
    <div className="flex-1 bg-stone-50">
      <Header />

      <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-orange-950 px-6 md:px-10 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-300 bg-orange-400/10 border border-orange-400/20 px-2.5 py-1 rounded-full">Buying Guide</span>
            <span className="text-stone-500 text-xs">· Hyderabad Real Estate</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
            How to Evaluate a <em className="text-orange-300 italic">Resale Apartment</em> in Hyderabad
          </h1>
          <p className="text-stone-300 text-sm md:text-base mb-6 leading-relaxed max-w-2xl">
            A practical, room-by-room and document-by-document checklist — for the things a good photo gallery won't tell you.
          </p>
          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span>By <strong className="text-stone-200">nomore2percent</strong></span>
            <span>·</span>
            <span>7 min read</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-12">
        <div className="prose-custom">

          <p className="text-lg text-stone-700 leading-relaxed font-medium mb-8 pb-8 border-b border-stone-200">
            A resale apartment comes with a track record a new-build doesn't — which is exactly what makes it worth checking properly. The building has already been lived in, the society already run for years, the maintenance already tested against real weather and real wear. Here's what to actually look at.
          </p>

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">1. The Paperwork, Before Anything Else</h2>
          <p className="text-stone-600 leading-relaxed mb-6">
            No amount of good lighting in listing photos matters if the paperwork doesn't hold up. Before you get emotionally attached to a unit, confirm:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            {[
              { title: 'Sale Deed & Title Chain', desc: 'Ask for the original sale deed and, ideally, the chain of ownership going back further than just the current seller. Gaps or inconsistencies here are the single biggest red flag in resale.' },
              { title: 'Encumbrance Certificate (EC)', desc: 'Confirms the property is free of legal or financial liabilities — pending loans, disputes, or claims registered against it. Get one covering at least the last 13-15 years.' },
              { title: 'Occupancy Certificate (OC)', desc: 'Confirms the building was constructed according to approved plans and is legally fit for occupation. A missing OC is common enough in Hyderabad to always ask about directly.' },
              { title: 'Property Tax Receipts', desc: 'Recent receipts confirm the seller has been paying municipal property tax — and that there\'s no backlog you\'d inherit.' },
            ].map((f) => (
              <div key={f.title} className="bg-white border border-stone-200 rounded-xl p-5">
                <div className="font-semibold text-stone-800 mb-2">{f.title}</div>
                <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">2. What to Physically Check On-Site</h2>
          <div className="space-y-4 mb-8">
            {[
              { title: 'Water seepage and dampness', desc: 'Check ceilings, corners, and around windows — especially if the visit is after a dry spell, when seepage is easiest to hide.' },
              { title: 'Plumbing and drainage', desc: "Run every tap, flush every toilet, and check water pressure on the highest floor of the flat if it's a duplex. Ask specifically about drainage issues on lower floors, which often carry water problems from units above." },
              { title: 'Electrical wiring and load', desc: 'Older buildings sometimes have wiring that hasn\'t been upgraded to handle modern appliance loads. Ask when the wiring was last redone, not just whether it "works fine."' },
              { title: 'Structural cracks', desc: "Hairline cracks in plaster are usually cosmetic. Cracks that run through structural beams or columns are not — if you're unsure which you're looking at, a structural engineer's opinion is worth the cost for an older building." },
              { title: 'Parking and storage', desc: 'Confirm exactly what\'s included — covered vs. open parking, and whether it\'s formally allotted in the sale deed or just an informal arrangement with the current owner.' },
            ].map((item, i) => (
              <div key={item.title} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-orange-400 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">{i + 1}</div>
                <div>
                  <div className="font-semibold text-stone-800 mb-1">{item.title}</div>
                  <p className="text-sm text-stone-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">3. The Society, Not Just the Flat</h2>
          <p className="text-stone-600 leading-relaxed mb-4">
            You're not just buying an apartment — you're buying into however that society is being run. Ask to see the maintenance charge history and confirm there's no outstanding dues attached to the specific unit (these can sometimes transfer to a new owner if not cleared before sale). It's also worth asking a few existing residents, not just the seller, how reliably water and power actually hold up, and how responsive the management is to complaints. A well-maintained building with an engaged, functioning residents' association tends to hold its value better over time than one that isn't.
          </p>

          <div className="border-l-4 border-orange-400 pl-6 py-2 my-8 bg-orange-50 rounded-r-xl">
            <p className="text-stone-700 italic text-lg leading-relaxed">
              The seller's photos show you the flat on its best day. The society's maintenance records show you what every other day actually looks like.
            </p>
          </div>

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">4. Factors That Actually Affect Resale Value Later</h2>
          <p className="text-stone-600 leading-relaxed mb-4">
            If you're not planning to hold this property forever, a few things matter more than they might seem to right now: floor and facing (higher, better-ventilated units generally hold value better), proximity to metro or major transit corridors, and whether nearby infrastructure projects are actually confirmed and RERA-registered versus just rumored. A locality's genuine growth trajectory — not just current price — is usually the better long-term signal.
          </p>
          <p className="text-stone-600 leading-relaxed mb-8">
            This is also exactly where independent, resident-sourced data helps more than a builder's or broker's pitch — real infrastructure ratings and price trends from people who actually live in the area, rather than marketing copy.
          </p>

          <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-8 my-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-white mb-1">Check the Locality Before You Check the Flat</h3>
              <p className="text-orange-100 text-sm">See real resident survey data and growth trends for any Hyderabad locality.</p>
            </div>
            <Link href="/area-insights" className="bg-white text-orange-600 font-bold rounded-xl px-6 py-3 text-sm hover:bg-orange-50 transition-colors whitespace-nowrap">
              Explore Area Insights
            </Link>
          </div>

          <p className="text-stone-500 text-xs leading-relaxed mt-10 pt-6 border-t border-stone-200">
            This checklist is general guidance, not a substitute for a qualified property lawyer's review of your specific sale agreement, or a structural engineer's assessment where warranted.
          </p>

        </div>

        <div className="mt-12 pt-8 border-t border-stone-200">
          <Link href="/blog" className="text-sm text-orange-500 hover:text-orange-600 font-medium">← Back to Blog</Link>
        </div>
      </div>
    </div>
  );
}
