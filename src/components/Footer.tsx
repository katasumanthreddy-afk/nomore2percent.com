'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-auto">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-orange-400 text-white flex items-center justify-center font-serif font-bold text-sm">N2</div>
              <span className="font-serif font-bold text-lg text-white">nomore<span className="text-orange-400">2%</span></span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed mb-4">
              Hyderabad's fairest real estate brokerage. Buy, sell, or rent — at just 1% brokerage, always.
            </p>
            <div className="flex gap-3">
              <a href="https://wa.me/917013224895" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-green-600 flex items-center justify-center transition-colors text-sm font-bold" title="WhatsApp">WA</a>
              <a href="https://instagram.com/nomore2percent" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-stone-800 hover:bg-pink-600 flex items-center justify-center transition-colors text-sm font-bold" title="Instagram">IG</a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">Explore</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/" className="hover:text-orange-400 transition-colors">Home</Link></li>
              <li><Link href="/properties" className="hover:text-orange-400 transition-colors">Properties</Link></li>
              <li><Link href="/area-insights" className="hover:text-orange-400 transition-colors">Area Insights</Link></li>
              <li><Link href="/blog" className="hover:text-orange-400 transition-colors">Blog</Link></li>
              <li><Link href="/area-guides" className="hover:text-orange-400 transition-colors">Area Guides</Link></li>
              <li><Link href="/sitemap" className="hover:text-orange-400 transition-colors">Sitemap</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">Company</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="hover:text-orange-400 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-orange-400 transition-colors">Contact</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-orange-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/rera-disclaimer" className="hover:text-orange-400 transition-colors">RERA Disclaimer</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">Get in Touch</div>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="https://wa.me/917013224895" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors flex items-center gap-2">
                  <span className="text-green-400">+91 70132 24895</span>
                </a>
              </li>
              <li className="text-stone-400">Hyderabad, Telangana</li>
              <li>
                <a href="https://instagram.com/nomore2percent" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">@nomore2percent</a>
              </li>
            </ul>

            <div className="mt-6 bg-stone-800 rounded-xl p-4">
              <div className="text-xs text-stone-500 mb-1">1% Brokerage — Always</div>
              <div className="text-white font-serif text-lg font-bold">Save Lakhs.</div>
              <div className="text-stone-400 text-xs mt-1">On a ₹1.5 Cr home, you save ₹1.5L vs the industry standard.</div>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div>© 2026 nomore2percent · Hyderabad Real Estate · All rights reserved</div>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-stone-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-stone-300 transition-colors">Terms</Link>
            <Link href="/rera-disclaimer" className="hover:text-stone-300 transition-colors">RERA Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
