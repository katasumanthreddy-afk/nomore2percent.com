import type { Metadata } from "next";
import "./globals.css";
import LiveChatWidget from "@/components/LiveChatWidget";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nomore2percent.com'),
  title: {
    default: 'nomore2percent — Hyderabad Real Estate Marketplace',
    template: '%s',
  },
  description: 'Buy, sell and rent properties in Hyderabad at just 1% brokerage. Browse verified listings across Gachibowli, Madhapur, Banjara Hills and more.',
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
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        {children}
        {/* Footer mounted globally so it appears on every page */}
        <Footer />
        {/* LiveChat mounted globally so the chat bubble follows visitors across every page */}
        <LiveChatWidget />
      </body>
    </html>
  );
}
