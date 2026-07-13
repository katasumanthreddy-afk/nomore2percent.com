'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import { DeveloperProject, projectStatusLabel } from '@/types/developer-project';
import { List, MapIcon } from 'lucide-react';

const ProjectMap = dynamic(() => import('@/components/ProjectMap'), {
  ssr: false,
  loading: () => <div className="h-[600px] rounded-2xl bg-stone-200 animate-pulse" />,
});

const STATUS_BADGE: Record<string, string> = {
  upcoming: 'bg-purple-50 text-purple-600 border-purple-200',
  under_construction: 'bg-amber-50 text-amber-600 border-amber-200',
  ready_to_move: 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

export default function ProjectsClient() {
  const [projects, setProjects] = useState<DeveloperProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('default');
  const [view, setView] = useState<'list' | 'map'>('list');

  useEffect(() => {
    fetch('/api/developer-projects')
      .then((r) => r.json())
      .then((data) => { if (data.success) setProjects(data.projects); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...projects];
    if (areaFilter) list = list.filter((p) => p.area === areaFilter);
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (sort === 'price_asc') list.sort((a, b) => (a.starting_price_num || 0) - (b.starting_price_num || 0));
    if (sort === 'price_desc') list.sort((a, b) => (b.starting_price_num || 0) - (a.starting_price_num || 0));
    if (sort === 'newest') list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [projects, areaFilter, statusFilter, sort]);

  const areas = Array.from(new Set(projects.map((p) => p.area))).sort();

  return (
    <div className="flex-1 bg-stone-50">
      <Header />
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
        <h1 className="font-serif text-3xl font-bold mb-1">New Projects</h1>
        <p className="text-stone-500 text-sm mb-6">New launches and ongoing developments across Hyderabad, at just 1% brokerage.</p>

        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="">All Areas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="under_construction">Under Construction</option>
            <option value="ready_to_move">Ready to Move</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="default">Sort: Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
          <div className="flex border border-stone-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors ${view === 'list' ? 'bg-orange-500 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors ${view === 'map' ? 'bg-orange-500 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              <MapIcon size={14} /> Map
            </button>
          </div>
          <span className="text-sm text-stone-500 ml-auto"><strong className="text-stone-800">{filtered.length}</strong> projects</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-72 bg-stone-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length > 0 ? (
          view === 'map' ? (
            <ProjectMap projects={filtered} />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="group bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-orange-400 hover:-translate-y-1 transition-all shadow-sm hover:shadow-lg flex flex-col">
                <div className="h-44 relative bg-stone-100 overflow-hidden">
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.project_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">🏗️</div>
                  )}
                  <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${STATUS_BADGE[p.status]}`}>
                      {projectStatusLabel(p.status)}
                    </span>
                    {p.featured && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-white/90 text-stone-700">★ Featured</span>}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-serif font-bold text-stone-900 mb-0.5">{p.project_name}</h3>
                  <p className="text-xs text-stone-500 mb-2">{p.developer_name} · 📍 {p.area}</p>
                  {p.unit_types && p.unit_types.length > 0 && (
                    <p className="text-xs text-stone-500 mb-2">{p.unit_types.join(' · ')}</p>
                  )}
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="font-serif font-bold text-orange-500">{p.price_range || 'Price on request'}</span>
                    {p.possession_date && <span className="text-[11px] text-stone-400">{p.possession_date}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          )
        ) : (
          <div className="text-center py-20 text-stone-400">
            <div className="text-5xl mb-3 opacity-20">🏗️</div>
            No projects match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
