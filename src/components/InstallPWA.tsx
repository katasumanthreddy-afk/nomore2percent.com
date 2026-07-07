'use client';

import { useEffect, useState } from 'react';
import { X, Share, Plus } from 'lucide-react';

const DISMISSED_KEY = 'n2p_install_prompt_dismissed';

export default function InstallPWA() {
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Register the service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err);
      });
    }

    if (localStorage.getItem(DISMISSED_KEY)) return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return; // already installed, nothing to prompt

    // Android/Chrome/Edge: listen for the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari has no install-prompt API — show manual instructions instead,
    // but only on actual iOS Safari (not Chrome-on-iOS, which can't install anyway).
    const ua = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|chrome/i.test(ua);
    if (isIos && isSafari) {
      const timer = setTimeout(() => {
        setShowIosHint(true);
        setVisible(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  const install = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-xs animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xl p-4 relative">
        <button onClick={dismiss} aria-label="Dismiss" className="absolute top-2.5 right-2.5 text-stone-400 hover:text-stone-600">
          <X size={16} />
        </button>

        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-9 h-9 rounded-lg bg-orange-400 text-white flex items-center justify-center font-serif font-bold text-xs flex-shrink-0">N2</div>
          <div className="font-bold text-sm text-stone-900">Install nomore2percent</div>
        </div>

        {showIosHint ? (
          <p className="text-xs text-stone-500 leading-relaxed">
            Tap <Share size={12} className="inline mx-0.5 -mt-0.5" /> Share, then{' '}
            <Plus size={12} className="inline mx-0.5 -mt-0.5" /> "Add to Home Screen" for one-tap access.
          </p>
        ) : (
          <>
            <p className="text-xs text-stone-500 mb-3">Get one-tap access, faster loading, and a home screen icon.</p>
            <button onClick={install} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg py-2 transition-colors">
              Install App
            </button>
          </>
        )}
      </div>
    </div>
  );
}
