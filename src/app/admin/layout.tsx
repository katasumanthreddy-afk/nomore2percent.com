import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'nomore2% Admin',
  manifest: '/admin-manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/admin-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/admin-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/admin-apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'nomore2% Admin',
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
