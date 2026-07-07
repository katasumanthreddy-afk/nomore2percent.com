'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, ClipboardList } from 'lucide-react';

const DISMISSED_KEY = 'n2p_survey_popup_dismissed';
const DELAY_MS = 30000;

export default function SurveyPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show again this browser if already dismissed or submitted
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 max-w-sm animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-5 relative">
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-3 text-stone-500 hover:text-stone-300 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="w-10 h-10 rounded-xl bg-orange-400/10 flex items-center justify-center mb-3">
          <ClipboardList size={20} className="text-orange-400" />
        </div>

        <h3 className="font-serif text-lg font-bold text-white mb-1.5 pr-4">
          See how your locality really stacks up
        </h3>
        <p className="text-stone-400 text-sm mb-4 leading-relaxed">
          Answer a few quick questions about your property and area &mdash; pricing, infrastructure,
          growth &mdash; and get a feel for how it compares. Takes 5&ndash;7 minutes, stays anonymous unless you choose otherwise.
        </p>

        <div className="flex gap-2">
          <Link
            href="/market-survey"
            onClick={dismiss}
            className="flex-1 text-center bg-orange-400 text-stone-950 rounded-lg px-4 py-2 text-sm font-bold hover:bg-orange-300 transition-colors"
          >
            Check My Locality
          </Link>
          <button
            onClick={dismiss}
            className="px-4 py-2 rounded-lg text-sm font-medium text-stone-400 hover:text-stone-200 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
