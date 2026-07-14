import Header from '@/components/Header';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hyderabad Neighborhood Guides | nomore2percent',
  description: 'Complete guides to buying, selling, and renting property in Hyderabad\'s key localities — Gachibowli, Madhapur, Banjara Hills, Kondapur, and more.',
};

const AREAS = [
  { name: 'Gachibowli', tag: 'IT Hub', desc: 'Financial District, top IT companies, premium apartments. Best for IT professionals and investors.', avgPsf: '₹7,000–9,500', yield: '3.2–3.8%' },
  { name: 'Madhapur', tag: 'Tech Corridor', desc: 'Heart of Hyderabad\'s tech scene. Metro connectivity, walkable amenities, strong rental demand.', avgPsf: '₹6,500–8,500', yield: '3.3–3.9%' },
  { name: 'Banjara Hills', tag: 'Premium', desc: 'Hyderabad\'s most prestigious address. High-end villas, luxury apartments, established neighbourhood.', avgPsf: '₹8,000–14,000', yield: '2.5–3.0%' },
  { name: 'Jubilee Hills', tag: 'Luxury', desc: 'Celebrity and HNI neighbourhood. Independent houses, upscale living, Road No. 36 address.', avgPsf: '₹9,000–15,000', yield: '2.4–2.8%' },
  { name: 'Kondapur', tag: 'High Growth', desc: 'Fast appreciation, proximity to IT hubs, excellent connectivity. Best value near Financial District.', avgPsf: '₹6,000–8,000', yield: '3.4–4.0%' },
  { name: 'Hitech City', tag: 'Commercial Hub', desc: 'Cyberabad\'s nerve centre. Mixed residential and commercial. Metro-connected, high footfall.', avgPsf: '₹7,000–9,000', yield: '3.5–4.0%' },
  { name: 'Kompally', tag: 'Affordable Growth', desc: 'North Hyderabad\'s fastest growing area. Budget-friendly with strong appreciation potential.', avgPsf: '₹3,500–5,500', yield: '4.0–5.0%' },
  { name: 'Yapral', tag: 'Emerging', desc: 'Peaceful residential area near Secunderabad. Lake views, good connectivity, rising values.', avgPsf: '₹3,800–5,200', yield: '4.2–5.2%' },
  { name: 'Alwal', tag: 'Stable', desc: 'Established North Hyderabad locality. Good GHMC services, railway connectivity, independent houses.', avgPsf: '₹3,500–4,800', yield: '3.8–4.5%' },
  { name: 'Kukatpally', tag: 'Well-Connected', desc: 'Metro station, IKEA nearby, established infrastructure. Strong mid-segment residential demand.', avgPsf: '₹4,500–6,500', yield: '3.7–4.3%' },
  { name: 'Miyapur', tag: 'Metro Access', desc: 'Metro terminal station. Growing residential hub with improving infrastructure and connectivity.', avgPsf: '₹4,000–5,800', yield: '3.8–4.5%' },
  { name: 'Dammaiguda', tag: 'Up & Coming', desc: 'Affordable North Hyderabad with good ORR access. Ideal for early-stage investment.', avgPsf: '₹3,200–4,500', yield: '4.0–5.0%' },
];

export default function AreaGuidesPage() {
  return (
    <div className="flex-1 flex flex-col bg-stone-50">
      <Header />
      <div className="flex-1">
        <div className="bg-gradient-to-br from-stone-900 to-orange-950 px-6 md:px-10 py-14">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">Hyderabad Neighborhood Guides</h1>
            <p className="text-stone-300 text-sm max-w-xl mb-2">Everything you need to know about buying, selling, or renting in Hyderabad's key localities — prices, yields, connectivity, and more.</p>
            <p className="text-stone-400 text-xs">Want live listing data instead? Try our <Link href="/area-insights" className="text-orange-400 hover:underline">Area Insights Tool</Link>.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {AREAS.map((area) => (
              <div key={area.name} className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-orange-400 hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-serif text-lg font-bold text-stone-900">{area.name}</h2>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">{area.tag}</span>
                </div>
                <p className="text-sm text-stone-500 leading-relaxed mb-4">{area.desc}</p>
                <div className="border-t border-stone-100 pt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">Avg ₹/sqft</div>
                    <div className="text-sm font-semibold text-stone-700">{area.avgPsf}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">Rental Yield</div>
                    <div className="text-sm font-semibold text-stone-700">{area.yield}</div>
                  </div>
                </div>
                <Link href={'/properties?area=' + encodeURIComponent(area.name)} className="mt-4 block text-center bg-orange-50 text-orange-600 border border-orange-200 rounded-lg py-2 text-xs font-bold hover:bg-orange-100 transition-colors">
                  View listings in {area.name}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-white border border-stone-200 rounded-2xl p-6 text-center">
            <p className="text-stone-500 text-sm mb-3">Not sure which area suits you? Talk to Sumanth directly.</p>
            <a href="https://wa.me/917013224895?text=Hi+Sumanth%2C+I+need+help+choosing+the+right+area+in+Hyderabad." target="_blank" rel="noopener noreferrer" className="inline-block bg-orange-400 text-white rounded-lg px-6 py-2.5 text-sm font-bold hover:bg-orange-500 transition-colors">
              WhatsApp for Area Advice
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
