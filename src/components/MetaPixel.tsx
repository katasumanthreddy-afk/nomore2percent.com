'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

// Meta (Facebook/Instagram) Pixel for ad tracking on the PUBLIC site only.
// Turned on by setting NEXT_PUBLIC_META_PIXEL_ID in Vercel; without it
// nothing loads. Internal, admin, broker and scout pages are never tracked.

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const EXCLUDED = ['/internal', '/admin', '/broker', '/scout', '/account', '/login'];

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

export function isTrackedPath(pathname: string | null) {
  return !!pathname && !EXCLUDED.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

// Safe to call anywhere: does nothing when the pixel isn't configured,
// hasn't loaded, or the visitor is on an excluded page.
export function trackPixel(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.fbq || !isTrackedPath(window.location.pathname)) return;
  window.fbq('track', event, params);
}

export default function MetaPixel() {
  const pathname = usePathname();
  const tracked = isTrackedPath(pathname);
  const first = useRef(true);

  // The init snippet sends the first PageView; later client-side navigations
  // send their own.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (tracked) trackPixel('PageView');
  }, [pathname, tracked]);

  if (!PIXEL_ID || !/^\d{6,20}$/.test(PIXEL_ID) || !tracked) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${PIXEL_ID}');
        fbq('track', 'PageView');
      `}
    </Script>
  );
}
