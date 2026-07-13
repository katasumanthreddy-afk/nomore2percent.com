import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import LiveChatWidget from "@/components/LiveChatWidget";
import Footer from "@/components/Footer";
import InstallPWA from "@/components/InstallPWA";

export const viewport: Viewport = {
  themeColor: '#fb923c',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nomore2percent.com'),
  title: {
    default: 'nomore2percent — Hyderabad Real Estate Marketplace',
    template: '%s',
  },
  description: 'Buy, sell and rent properties in Hyderabad at just 1% brokerage. Browse verified listings across Gachibowli, Madhapur, Banjara Hills and more.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'nomore2%',
  },
  openGraph: {
    siteName: 'nomore2percent',
    title: 'nomore2percent — Hyderabad Real Estate Marketplace',
    description: 'Buy, sell and rent properties in Hyderabad at just 1% brokerage. Browse verified listings across Gachibowli, Madhapur, Banjara Hills and more.',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'nomore2percent — Hyderabad Real Estate Marketplace',
    description: 'Buy, sell and rent properties in Hyderabad at just 1% brokerage.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" className="h-full antialiased overflow-x-hidden">
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden">
        {gaId && (
          <>
            {/* Google Analytics (gtag.js) — afterInteractive so it never
                blocks the page from rendering/becoming interactive first. */}
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        {children}
        {/* Footer mounted globally so it appears on every page */}
        <Footer />
        {/* LiveChat mounted globally so the chat bubble follows visitors across every page */}
        <LiveChatWidget />
        {/* Install prompt: registers the service worker + shows a native/iOS install nudge */}
        <InstallPWA />
      </body>
    </html>
  );
}
