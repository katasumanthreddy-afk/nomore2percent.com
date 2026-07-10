'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Property, savingsLabel, sizeUnitLabel } from '@/types/property';
import { Bed, Bath, Maximize, Car, Calendar, Layers, X, ChevronLeft, ChevronRight } from 'lucide-react';

const PropertySingleMap = dynamic(() => import('@/components/PropertySingleMap'), {
  ssr: false,
  loading: () => <div className="h-72 rounded-xl bg-stone-200 animate-pulse" />,
});

export default function PropertyDetailClient({ property }: { property: Property }) {
  const router = useRouter();
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);

  const imageCount = property.images?.length || 0;
  const nextImg = () => setActiveImg((i) => (i + 1) % imageCount);
  const prevImg = () => setActiveImg((i) => (i - 1 + imageCount) % imageCount);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') nextImg();
      if (e.key === 'ArrowLeft') prevImg();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, imageCount]);

  const sendEnquiry = async () => {
    if (!name.trim() || !phone.trim()) {
      alert('Please enter your name and phone.');
      return;
    }
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, phone, area: property.area, budget: `₹${property.price}`,
        property_type: property.property_type, source: 'property-detail',
      }),
    });
    setSent(true);
    setName(''); setPhone('');
    setTimeout(() => setSent(false), 4000);
  };

  const saving = savingsLabel(property.price_num, property.listing_type);
  const waMsg = `Hi+Sumanth%2C+I%27m+interested+in+%22${encodeURIComponent(property.title)}%22+in+${encodeURIComponent(property.area)}.+Please+share+more+details.`;

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
      <button onClick={() => router.push('/properties')} className="text-sm text-stone-500 hover:text-orange-400 mb-5 flex items-center gap-1">← Back to listings</button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex gap-2 mb-2">
            <span className="text-xs font-semibold bg-orange-100 text-orange-500 px-2.5 py-1 rounded-full">{property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}</span>
            {property.rera_number && <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">RERA ✓</span>}
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">{property.title}</h1>
          <p className="text-stone-500 text-sm mt-1">📍 {property.address || `${property.area}, Hyderabad`}</p>
        </div>
        <div className="text-right">
          <div className="font-serif text-3xl font-bold">₹{property.price}</div>
          {property.price_per_sqft && <div className="text-xs text-stone-500">₹{property.price_per_sqft}/sqft</div>}
          {saving && <div className="text-sm text-emerald-600 font-semibold mt-1">You save {saving} vs 2% broker</div>}
        </div>
      </div>

      {/* Gallery */}
      <div
        onClick={() => property.images?.length > 0 && setLightboxOpen(true)}
        className={`rounded-2xl overflow-hidden h-80 bg-stone-200 mb-8 flex items-center justify-center ${property.images?.length > 0 ? 'cursor-zoom-in' : ''}`}
      >
        {property.images?.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={property.images[activeImg]} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl opacity-20">🏠</span>
        )}
      </div>
      {property.images?.length > 1 && (
        <div className="flex gap-2 mb-8 -mt-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {property.images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img} onClick={() => setActiveImg(i)} className={`w-16 h-16 flex-shrink-0 rounded-lg object-cover cursor-pointer border-2 ${i === activeImg ? 'border-orange-500' : 'border-transparent'}`} alt="" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div>
          {/* Specs */}
          <div className="flex border border-stone-200 rounded-xl overflow-hidden mb-8 bg-white">
            {property.bedrooms > 0 && <Spec icon={<Bed size={18} />} val={property.bedrooms} label="Bedrooms" />}
            {property.bathrooms > 0 && <Spec icon={<Bath size={18} />} val={property.bathrooms} label="Bathrooms" />}
            {property.sqft > 0 && <Spec icon={<Maximize size={18} />} val={property.sqft.toLocaleString('en-IN')} label={sizeUnitLabel(property.size_unit) === 'sqft' ? 'Sq.ft' : sizeUnitLabel(property.size_unit) === 'sqyd' ? 'Sq.yd' : 'Acres'} />}
            {property.floor && <Spec icon={<Layers size={18} />} val={property.floor} label="Floor" />}
            {property.parking > 0 && <Spec icon={<Car size={18} />} val={property.parking} label="Parking" />}
            {property.year_built && <Spec icon={<Calendar size={18} />} val={property.year_built} label="Built" />}
          </div>

          {property.description && (
            <>
              <h2 className="font-serif text-lg font-bold mb-3">About this Property</h2>
              <p className="text-sm text-stone-700 leading-relaxed mb-8">{property.description}</p>
            </>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <>
              <h2 className="font-serif text-lg font-bold mb-3">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-8">
                {property.amenities.map((a) => (
                  <div key={a} className="bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700">✓ {a}</div>
                ))}
              </div>
            </>
          )}

          <h2 className="font-serif text-lg font-bold mb-3">Location</h2>
          <PropertySingleMap lat={property.lat} lng={property.lng} area={property.area} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {saving && (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5">
              <div className="text-xs font-bold uppercase tracking-wide text-orange-400 mb-1">Your Savings</div>
              <div className="font-serif text-2xl font-bold text-orange-400">{saving}</div>
              <div className="text-xs text-stone-500 mt-1">vs 2% industry brokerage</div>
            </div>
          )}

          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-3">Your Broker</div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-orange-800 text-white flex items-center justify-center font-bold">S</div>
              <div>
                <div className="font-bold text-sm">Sumanth</div>
                <div className="text-xs text-stone-500">Senior Broker · nomore2percent</div>
              </div>
            </div>
            <a href={`https://wa.me/917013224895?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="block bg-[#25D366] text-white rounded-lg py-2.5 text-center text-sm font-bold mb-2 hover:opacity-90 transition-opacity">💬 WhatsApp</a>
            <a href="tel:+917013224895" className="block bg-orange-50 text-orange-400 border border-orange-200 rounded-lg py-2.5 text-center text-sm font-bold hover:bg-orange-100 transition-colors">📞 +91 70132 24895</a>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-3">Quick Enquiry</div>
            {sent && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-3 py-2 mb-3">✅ Sumanth will contact you shortly!</div>}
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-orange-400" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 your number" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-orange-400" />
            <button onClick={sendEnquiry} className="w-full bg-stone-900 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-stone-800 transition-colors">Send Enquiry</button>
          </div>
        </div>
      </div>

      {lightboxOpen && property.images?.length > 0 && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-10"
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {imageCount > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImg(); }}
              className="absolute left-2 md:left-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={property.images[activeImg]}
            alt={property.title}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg"
          />

          {imageCount > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImg(); }}
              className="absolute right-2 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {imageCount > 1 && (
            <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
              {activeImg + 1} / {imageCount}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Spec({ icon, val, label }: { icon: React.ReactNode; val: string | number; label: string }) {
  return (
    <div className="flex-1 p-4 text-center border-r border-stone-200 last:border-r-0">
      <div className="flex justify-center text-stone-400 mb-1.5">{icon}</div>
      <div className="font-serif text-base font-bold">{val}</div>
      <div className="text-[10px] uppercase tracking-wide text-stone-400 mt-0.5">{label}</div>
    </div>
  );
}
