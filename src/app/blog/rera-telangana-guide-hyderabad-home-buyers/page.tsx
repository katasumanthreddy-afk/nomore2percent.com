import Link from 'next/link';
import Header from '@/components/Header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "A Home Buyer's Guide to RERA in Telangana | nomore2percent",
  description: 'What TS-RERA actually protects you from, how to verify a project or agent is registered, and the red flags that should make you walk away.',
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
            A Home Buyer's Guide to <em className="text-orange-300 italic">RERA</em> in Telangana
          </h1>
          <p className="text-stone-300 text-sm md:text-base mb-6 leading-relaxed max-w-2xl">
            RERA verification takes less than two minutes. Skipping it is how buyers end up in years-long disputes over delayed, unregistered, or misrepresented projects.
          </p>
          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span>By <strong className="text-stone-200">nomore2percent</strong></span>
            <span>·</span>
            <span>6 min read</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-12">
        <div className="prose-custom">

          <p className="text-lg text-stone-700 leading-relaxed font-medium mb-8 pb-8 border-b border-stone-200">
            If you're buying property in Telangana, there's one check that takes almost no effort but protects you more than any other single step: confirming the project is registered with TS-RERA. Here's what that actually means, and how to do it properly.
          </p>

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">What TS-RERA Actually Is</h2>
          <p className="text-stone-600 leading-relaxed mb-4">
            TS-RERA — the Telangana State Real Estate Regulatory Authority — was set up under the central RERA Act of 2016, with Telangana notifying its own rules in 2017. Its job is straightforward: keep a public, verifiable record of real estate projects and agents, so buyers aren't relying purely on a promoter's word.
          </p>
          <p className="text-stone-600 leading-relaxed mb-6">
            Under the Act, any residential or commercial project larger than 500 square metres, or with 8 or more units, has to register with TS-RERA <strong className="text-stone-800">before</strong> any marketing or sale can legally begin. Real estate agents operating in the state are required to be RERA-registered too — not just the builder.
          </p>

          <div className="border-l-4 border-orange-400 pl-6 py-2 my-8 bg-orange-50 rounded-r-xl">
            <p className="text-stone-700 italic text-lg leading-relaxed mb-2">
              A promoter is legally permitted to begin marketing a project only after it's registered with TS-RERA — not before.
            </p>
          </div>

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">What to Actually Check Before You Pay Anything</h2>
          <p className="text-stone-600 leading-relaxed mb-6">
            Before you hand over a booking amount or advance for any property in Telangana, run through this:
          </p>

          <div className="space-y-4 mb-8">
            {[
              { title: 'Confirm the RERA registration number', desc: "Every registered project gets a unique RERA number. Ask for it directly, then verify it independently on TS-RERA's own portal rather than trusting a number printed on a brochure." },
              { title: "Check the agent's own registration", desc: 'The person or firm brokering the deal needs to be separately RERA-registered — a legitimate project doesn\'t automatically mean the agent selling it to you is compliant.' },
              { title: 'Look at the approved completion timeline', desc: "TS-RERA records show the promoter's committed possession date and any officially approved extensions — useful for catching projects already running behind schedule." },
              { title: 'Search for existing complaints', desc: 'The portal maintains records of complaints filed against a promoter or project. A pattern of unresolved complaints is a real warning sign, not noise.' },
              { title: 'Confirm the escrow account is active', desc: 'RERA requires promoters to deposit a portion of buyer payments into a dedicated escrow account, used only for that project\'s construction. An inactive or unclear escrow status is worth asking hard questions about.' },
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

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">What Happens If a Promoter Skips Registration</h2>
          <p className="text-stone-600 leading-relaxed mb-4">
            This isn't a paperwork formality regulators ignore in practice. Promoters who market or sell an unregistered project face a penalty of up to 10% of the project's estimated cost. Agents who facilitate a sale without being RERA-registered themselves are liable for a penalty of ₹10,000 per day, or up to 5% of the transaction's cost — whichever framework applies.
          </p>
          <p className="text-stone-600 leading-relaxed mb-8">
            In practice, this means a builder or agent who's genuinely compliant has no reason to be evasive when you ask for a RERA number. Hesitation or a vague answer to a direct question about registration is itself useful information.
          </p>

          <h2 className="font-serif text-2xl font-bold text-stone-900 mt-10 mb-4">A Few Things RERA Doesn't Cover</h2>
          <p className="text-stone-600 leading-relaxed mb-4">
            Worth being clear-eyed about: RERA registration confirms a project is legally on record and subject to regulatory oversight. It doesn't independently verify construction quality, guarantee the developer's financial health beyond the escrow requirement, or replace the value of a lawyer reviewing your specific sale agreement before you sign. Some renovation work or resale of an existing, already-registered unit may also fall outside the registration requirement entirely — when in doubt, the portal itself is the way to check, not assumptions either way.
          </p>
          <p className="text-stone-600 leading-relaxed mb-8">
            Think of RERA verification as the floor, not the ceiling, of your due diligence — necessary, not sufficient on its own.
          </p>

          <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-8 my-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-white mb-1">Have a Specific Project in Mind?</h3>
              <p className="text-orange-100 text-sm">We can help you verify it before you commit to anything.</p>
            </div>
            <a href="https://wa.me/917013224895" target="_blank" rel="noopener noreferrer" className="bg-white text-orange-600 font-bold rounded-xl px-6 py-3 text-sm hover:bg-orange-50 transition-colors whitespace-nowrap">
              WhatsApp Us
            </a>
          </div>

          <p className="text-stone-500 text-xs leading-relaxed mt-10 pt-6 border-t border-stone-200">
            This article is for general informational purposes and reflects publicly available information about the RERA Act and TS-RERA's registration framework at the time of writing. It isn't legal advice — rules, thresholds, and portal procedures can change, so always confirm current requirements directly with TS-RERA or a qualified property lawyer before making a purchase decision.
          </p>

        </div>

        <div className="mt-12 pt-8 border-t border-stone-200">
          <Link href="/blog" className="text-sm text-orange-500 hover:text-orange-600 font-medium">← Back to Blog</Link>
        </div>
      </div>
    </div>
  );
}
