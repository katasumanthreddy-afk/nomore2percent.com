// ── PRIVACY POLICY ──
// src/app/privacy-policy/page.tsx

import Header from '@/components/Header';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | nomore2percent',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex-1 flex flex-col bg-stone-50">
      <Header />
      <div className="flex-1 max-w-3xl mx-auto px-6 md:px-10 py-12 w-full">
        <h1 className="font-serif text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-stone-400 text-xs mb-8">Last updated: 1 July 2026</p>

        <div className="space-y-8 text-stone-600 text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">1. Information We Collect</h2>
            <p>When you use nomore2percent, we may collect your name, phone number, email address, and property preferences when you submit an enquiry or contact us. We also collect standard usage data such as pages visited and time spent on the site.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">2. How We Use Your Information</h2>
            <p>We use your information solely to respond to property enquiries, follow up on leads, and improve our service. We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">3. Data Storage</h2>
            <p>Your enquiry data is stored securely in our database (hosted on Supabase, Singapore region). We retain lead data for a maximum of 2 years, after which it is deleted. You may request deletion of your data at any time by contacting us on WhatsApp.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">4. Cookies</h2>
            <p>We use minimal cookies for session management (login state for our admin panel) and basic analytics. We do not use advertising or tracking cookies.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">5. Your Rights</h2>
            <p>You have the right to access, correct, or delete any personal data we hold about you. Contact us on WhatsApp at +91 70132 24895 to make any such request.</p>
          </section>
          <section>
            <h2 className="font-semibold text-stone-800 text-base mb-2">6. Contact</h2>
            <p>For any privacy-related queries, contact Sumanth Reddy at <a href="https://wa.me/917013224895" className="text-orange-500">+91 70132 24895</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
