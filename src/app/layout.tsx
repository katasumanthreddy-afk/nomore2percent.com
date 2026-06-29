import type { Metadata } from "next";
import "./globals.css";
import LiveChatWidget from "@/components/LiveChatWidget";

export const metadata: Metadata = {
  title: "nomore2percent — Hyderabad Real Estate Marketplace",
  description: "Buy, sell and rent properties in Hyderabad at just 1% brokerage. Browse verified listings across Gachibowli, Madhapur, Banjara Hills and more.",
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
        {/* Mounted globally so the chat bubble follows visitors across every page */}
        <LiveChatWidget />
      </body>
    </html>
  );
}
