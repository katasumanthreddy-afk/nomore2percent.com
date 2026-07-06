'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200 h-16 flex items-center justify-between px-6 md:px-10">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-orange-400 text-white flex items-center justify-center font-serif font-bold text-sm">N2</div>
        <span className="font-serif font-bold text-lg">nomore<span className="text-orange-400">2%</span></span>
      </Link>

      <nav className="hidden md:flex items-center gap-1">
        <Link href="/" className="px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors">Home</Link>
        <Link href="/properties" className="px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors">Properties</Link>
        <Link href="/area-insights" className="px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors">Area Insights</Link>
        <Link href="/market-survey" className="px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors">Market Survey</Link>
        <Link href="/property-valuation" className="px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors">Valuation</Link>
        <Link href="/blog" className="px-3.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors">Blog</Link>
      </nav>

      <div className="hidden md:flex items-center gap-2">
        <Link href="/list-your-property" className="inline-flex items-center px-4 py-2 rounded-lg border border-orange-300 text-orange-500 text-sm font-bold hover:bg-orange-50 transition-colors">List Your Property</Link>
        <a href="https://wa.me/917013224895" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-400 text-white text-sm font-bold hover:bg-orange-500 transition-colors">WhatsApp Us</a>
      </div>

      <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-stone-200 flex flex-col p-4 gap-1 md:hidden">
          <Link href="/" className="py-2.5 text-sm text-stone-600 border-b border-stone-100" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/properties" className="py-2.5 text-sm text-stone-600 border-b border-stone-100" onClick={() => setMenuOpen(false)}>Properties</Link>
          <Link href="/area-insights" className="py-2.5 text-sm text-stone-600 border-b border-stone-100" onClick={() => setMenuOpen(false)}>Area Insights</Link>
          <Link href="/market-survey" className="py-2.5 text-sm text-stone-600 border-b border-stone-100" onClick={() => setMenuOpen(false)}>Market Survey</Link>
          <Link href="/property-valuation" className="py-2.5 text-sm text-stone-600 border-b border-stone-100" onClick={() => setMenuOpen(false)}>Valuation</Link>
          <Link href="/list-your-property" className="py-2.5 text-sm text-orange-500 font-semibold border-b border-stone-100" onClick={() => setMenuOpen(false)}>List Your Property</Link>
          <Link href="/blog" className="py-2.5 text-sm text-stone-600" onClick={() => setMenuOpen(false)}>Blog</Link>
        </div>
      )}
    </header>
  );
}
