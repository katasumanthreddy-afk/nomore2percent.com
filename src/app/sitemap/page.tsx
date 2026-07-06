import Header from '@/components/Header';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sitemap | nomore2percent',
};

const SECTIONS = [
  {
    title: 'Main Pages',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Properties', href: '/properties' },
      { label: 'Area Insights Tool', href: '/area-insights' },
      { label: 'Area Guides', href: '/area-guides' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'RERA Disclaimer', href: '/rera-disclaimer' },
    ],
  },
  {
    title: 'Blog',
    links: [
      { label: "Why Hyderabad's Home Buyers Deserve Better Than 2%", href: '/blog/why-hyderabad-buyers-deserve-better-than-2-percent' },
    ],
  },
  {
    title: 'Areas We Cover',
    links: [
      'Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Kondapur',
      'Hitech City', 'Kompally', 'Yapral', 'Alwal', 'Kukatpally', 'Miyapur', 'Dammaiguda',
    ].map((area) => ({ label: area, href: '/properties?area=' + encodeURIComponent(area) })),
  },
];

export default function SitemapPage() {
  return (
    <div className="flex-1 flex flex-col bg-stone-50">
      <Header />
      <div className="flex-1 max-w-3xl mx-auto px-6 md:px-10 py-12 w-full">
        <h1 className="font-serif text-3xl font-bold mb-2">Sitemap</h1>
        <p className="text-stone-500 text-sm mb-10">All pages on nomore2percent.</p>

        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3 pb-2 border-b border-stone-200">{section.title}</div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-orange-500 hover:text-orange-600 hover:underline transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
