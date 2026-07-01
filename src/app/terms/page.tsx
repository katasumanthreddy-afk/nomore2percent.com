import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | nomore2percent',
};

export default function TermsPage() {
  return (
    <div className="flex-1 flex flex-col bg-stone-50">
      <Header />
      <div className="flex-1 max-w-3xl mx-auto px-6 md:px-10 py-12 w-full">
        <h1 className="font-serif text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-stone-400 text-xs mb-8">Last updated: 1 July 2026</p>

        <div className="space-y-8 text-stone-600 text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">1. Services</h2>
            <p>nomore2percent provides real estate brokerage services in Hyderabad, Telangana, India. Our services include property listing, buyer and tenant representation, site visit coordination, negotiation support, and documentation assistance.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">2. Brokerage Fee</h2>
            <p>Our standard brokerage fee is 1% of the transaction value for sale transactions, and one month's rent for rental transactions, unless otherwise agreed in writing. This fee is payable upon successful completion of a transaction.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">3. Property Information</h2>
            <p>Property details on our platform are provided in good faith based on information available at the time of listing. We endeavour to verify listings but cannot guarantee absolute accuracy of all information. Buyers and tenants are advised to independently verify all property details, legal status, and documentation before transacting.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">4. Market Data</h2>
            <p>Market research data, price estimates, growth projections, and rental yield figures on this platform are indicative only and should not be relied upon as investment advice. Always conduct independent research and consult a qualified financial advisor before making property investment decisions.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">5. Limitation of Liability</h2>
            <p>nomore2percent shall not be liable for any loss or damage arising from reliance on information provided on this platform, or from any transaction that does not proceed to completion.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">6. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Hyderabad, Telangana.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">7. Contact</h2>
            <p>For any queries regarding these terms, contact us at <a href="https://wa.me/917013224895" className="text-orange-500">+91 70132 24895</a>.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
