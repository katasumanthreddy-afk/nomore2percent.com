import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RERA Disclaimer | nomore2percent',
};

export default function ReraDisclaimerPage() {
  return (
    <div className="flex-1 flex flex-col bg-stone-50">
      <Header />
      <div className="flex-1 max-w-3xl mx-auto px-6 md:px-10 py-12 w-full">
        <h1 className="font-serif text-3xl font-bold mb-2">RERA Disclaimer</h1>
        <p className="text-stone-400 text-xs mb-8">Last updated: 1 July 2026</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-sm text-amber-800">
          <strong>Important:</strong> nomore2percent is in the process of obtaining its RERA registration under the Real Estate (Regulation and Development) Act, 2016 with the Telangana Real Estate Regulatory Authority (TSRERA). Our registration application is pending.
        </div>

        <div className="space-y-8 text-stone-600 text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">About RERA</h2>
            <p>The Real Estate (Regulation and Development) Act, 2016 (RERA) is a central Act that regulates the real estate sector in India. It mandates registration of real estate agents and projects to protect home buyers and promote transparency.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">Our Registration Status</h2>
            <p>nomore2percent is currently operating as a real estate brokerage in Hyderabad, Telangana. We are in the process of completing our RERA agent registration with TSRERA. Our registration number will be published on this page upon completion.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">Project RERA Numbers</h2>
            <p>Where available, RERA registration numbers for individual projects listed on our platform are displayed on the respective property listing pages. Buyers are advised to verify project RERA status independently at <a href="https://tsrera.telangana.gov.in" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600">tsrera.telangana.gov.in</a>.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">Buyer Advisory</h2>
            <p>All buyers and tenants are strongly advised to verify the RERA registration of any project before transacting. RERA registration provides legal protection and ensures the project meets regulatory standards. Do not rely solely on information provided by any broker — always verify independently.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">Contact TSRERA</h2>
            <p>For RERA-related queries, you may contact the Telangana Real Estate Regulatory Authority at <a href="https://tsrera.telangana.gov.in" target="_blank" rel="noopener noreferrer" className="text-orange-500">tsrera.telangana.gov.in</a>.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
