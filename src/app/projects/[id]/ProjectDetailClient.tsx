'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { DeveloperProject, projectStatusLabel } from '@/types/developer-project';
import { Building2, MapPin, Calendar, FileCheck, LandPlot, Layers } from 'lucide-react';

const PropertySingleMap = dynamic(() => import('@/components/PropertySingleMap'), {
  ssr: false,
  loading: () => <div className="h-72 rounded-xl bg-stone-200 animate-pulse" />,
});

export default function ProjectDetailClient({ project }: { project: DeveloperProject }) {
  const [activeImg, setActiveImg] = useState(0);

  const waMsg = `Hi+Sumanth%2C+I%27m+interested+in+%22${encodeURIComponent(project.project_name)}%22+by+${encodeURIComponent(project.developer_name)}+in+${encodeURIComponent(project.area)}.+Please+share+more+details.`;

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex gap-2 mb-2">
            <span className="text-xs font-semibold bg-orange-100 text-orange-500 px-2.5 py-1 rounded-full">{projectStatusLabel(project.status)}</span>
            {project.rera_number && <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">RERA ✓</span>}
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">{project.project_name}</h1>
          <p className="text-stone-500 text-sm mt-1">by {project.developer_name} · 📍 {project.address || `${project.area}, Hyderabad`}</p>
        </div>
        <div className="text-right">
          <div className="font-serif text-2xl font-bold text-orange-500">{project.price_range || 'Price on request'}</div>
          {project.possession_date && <div className="text-xs text-stone-500 mt-1">Possession: {project.possession_date}</div>}
        </div>
      </div>

      {/* Gallery */}
      <div className="rounded-2xl overflow-hidden h-80 bg-stone-200 mb-4 flex items-center justify-center">
        {project.images?.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.images[activeImg]} alt={project.project_name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl opacity-20">🏗️</span>
        )}
      </div>
      {project.images?.length > 1 && (
        <div className="flex gap-2 mb-8 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {project.images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img} onClick={() => setActiveImg(i)} className={`w-16 h-16 flex-shrink-0 rounded-lg object-cover cursor-pointer border-2 ${i === activeImg ? 'border-orange-500' : 'border-transparent'}`} alt="" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div>
          {/* Quick facts */}
          <div className="flex flex-wrap border border-stone-200 rounded-xl overflow-hidden mb-8 bg-white">
            {project.total_units && <Fact icon={<Building2 size={18} />} val={project.total_units} label="Total Units" />}
            {project.land_area && <Fact icon={<LandPlot size={18} />} val={project.land_area} label="Land Area" />}
            {project.possession_date && <Fact icon={<Calendar size={18} />} val={project.possession_date} label="Possession" />}
            {project.rera_number && <Fact icon={<FileCheck size={18} />} val={project.rera_number} label="RERA" />}
          </div>

          {project.unit_types && project.unit_types.length > 0 && (
            <>
              <h2 className="font-serif text-lg font-bold mb-3 flex items-center gap-2"><Layers size={18} className="text-orange-400" /> Unit Types</h2>
              <div className="flex flex-wrap gap-2 mb-8">
                {project.unit_types.map((u) => (
                  <span key={u} className="bg-orange-50 border border-orange-200 text-orange-600 rounded-lg px-3 py-2 text-sm font-semibold">{u}</span>
                ))}
              </div>
            </>
          )}

          {project.description && (
            <>
              <h2 className="font-serif text-lg font-bold mb-3">About this Project</h2>
              <p className="text-sm text-stone-700 leading-relaxed mb-8 whitespace-pre-line">{project.description}</p>
            </>
          )}

          {project.amenities && project.amenities.length > 0 && (
            <>
              <h2 className="font-serif text-lg font-bold mb-3">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-8">
                {project.amenities.map((a) => (
                  <div key={a} className="bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700">✓ {a}</div>
                ))}
              </div>
            </>
          )}

          <h2 className="font-serif text-lg font-bold mb-3">Location</h2>
          <PropertySingleMap lat={project.lat} lng={project.lng} area={project.area} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-3">Interested in this project?</div>
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
            <div className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2 flex items-center gap-1.5"><MapPin size={13} /> Location</div>
            <p className="text-sm text-stone-700">{project.address || `${project.area}, Hyderabad`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({ icon, val, label }: { icon: React.ReactNode; val: string | number; label: string }) {
  return (
    <div className="flex-1 min-w-[110px] p-4 text-center border-r border-b border-stone-200 last:border-r-0">
      <div className="flex justify-center text-stone-400 mb-1.5">{icon}</div>
      <div className="font-serif text-sm font-bold truncate px-1">{val}</div>
      <div className="text-[10px] uppercase tracking-wide text-stone-400 mt-0.5">{label}</div>
    </div>
  );
}
