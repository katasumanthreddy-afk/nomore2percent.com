'use client';

import { useEffect, useState, useCallback, Fragment, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher-client';
import { titleCase } from '@/types/property';
import { Users, Flame, CheckCircle2, Home, Building2, MessageCircle, ClipboardList, Inbox, ImageOff, ArrowUpDown, Clock } from 'lucide-react';

interface Lead {
  id: number; name: string; phone: string; email: string | null; area: string | null;
  budget: string | null; property_type: string | null; status: string; source: string; created_at: string;
}
interface Prop {
  id: number; title: string; area: string; price: string; listing_type: string;
  status: string; bedrooms: number; sqft: number; images?: string[]; created_at?: string;
}
interface Conversation {
  id: number; visitor_name: string; visitor_phone: string | null; last_message_at: string;
  chat_messages: { count: number }[];
  mode?: 'ai' | 'human'; handoff_requested?: boolean;
}
interface SurveyResponse {
  id: number; user_type: string; name: string | null; phone: string | null;
  willing_to_contact: boolean; area: string | null;
  property_type: string | null; created_at: string;

  // v2 fields
  years_in_locality: string | null; landmark: string | null;
  property_size_value: number | null; property_size_unit: string | null;
  facing: string | null; corner_plot: boolean | null;
  purchase_year: string | null; purchase_price: number | null; purchase_price_per_unit: number | null;
  purchase_type: string | null;
  builder_rating_construction: number | null; builder_rating_amenities: number | null; builder_rating_value: number | null;
  current_value: number | null; price_growth_bucket: string | null; growth_main_reason: string | null;
  received_offers: boolean | null; highest_offer: number | null;
  rating_roads: number | null; rating_water: number | null; rating_electricity: number | null;
  rating_drainage_garbage: number | null; rating_safety: number | null; rating_traffic_parking: number | null;
  rating_public_transport: number | null; rating_schools_hospitals: number | null; rating_shopping: number | null;
  water_source: string | null; power_cuts: string | null;
  recent_developments_list: string[] | null; biggest_issues_list: string[] | null;
  investment_interest: string | null; investment_budget: string | null; preferred_property_type: string | null;
  preferred_location: string | null; holding_period: string | null; expected_return: string | null;
  price_trend_1yr: string | null; price_trend_5yr: string | null; recommend_score: number | null;
  planning_to_sell: string | null; expected_sale_price: number | null; sell_reason: string | null;
  monthly_rent: number | null; rental_demand: string | null;
  feedback_best_thing: string | null; feedback_govt_improvement: string | null; feedback_invest_reason: string | null;

  // legacy fields (older survey submissions)
  locality?: string | null; bhk?: string | null; floor?: string | null;
  building_age?: string | null; society_name?: string | null;
  purchase_price_range?: string | null; purchase_price_exact?: number | null; purchase_price_per_sqft?: number | null;
  current_value_range?: string | null; current_value_exact?: number | null; appreciation_feel?: string | null;
  rent_amount_range?: string | null; rent_amount_exact?: number | null;
  deposit_range?: string | null; deposit_exact?: number | null;
  rent_increase_last_year?: string | null; rent_increase_amount?: number | null; years_renting?: string | null;
  infra_water?: string | null; infra_road_width?: string | null; infra_road_condition?: string | null;
  infra_power?: string | null; infra_drainage?: string | null; infra_garbage?: string | null;
  nearby_developments?: string | null; metro_connectivity?: string | null;
  new_projects_nearby?: string | null; price_impact?: string | null;
  builder_name?: string | null; builder_rating?: string | null;
  maintenance_charges?: string | null; oc_status?: string | null; society_quality?: string | null;
  would_recommend?: string | null; best_about_area?: string | null; worst_about_area?: string | null;
}

interface SubmissionImage { id: number; storage_path: string; is_primary: boolean; }
interface PropertySubmission {
  id: number; owner_name: string; owner_phone: string; owner_email: string | null;
  title: string | null; description: string | null;
  property_type: string; listing_type: string; area: string; address: string | null;
  bedrooms: number | null; bathrooms: number | null; sqft: number | null; size_unit: string | null;
  lat: number | null; lng: number | null;
  price: string | null; floor: string | null; year_built: string | null;
  status: 'pending' | 'approved' | 'rejected'; admin_notes: string | null;
  created_at: string;
  property_submission_images: SubmissionImage[];
  broker_id: number | null;
  brokers: { id: number; name: string } | null;
}

interface Broker {
  id: number; name: string; phone: string; email: string;
  rera_agent_number: string | null; rera_verified: boolean; mou_signed: boolean;
  status: 'invited' | 'active' | 'suspended'; notes: string | null;
  submission_count: number; approved_count: number; created_at: string;
}

interface Project {
  id: number; project_name: string; developer_name: string; project_type: string;
  area: string; price_range: string | null; starting_price_num: number | null;
  status: 'upcoming' | 'under_construction' | 'ready_to_move';
  featured: boolean; is_active: boolean; possession_date: string | null;
  total_units: number | null; created_at: string; images?: string[];
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  sold: 'text-blue-600 bg-blue-50 border-blue-200',
  rented: 'text-purple-600 bg-purple-50 border-purple-200',
  inactive: 'text-stone-500 bg-stone-100 border-stone-300',
};

// Display-only formatting — doesn't touch stored data, just how it renders
// in the admin panel, so inconsistently-cased titles like "3bhk vila" or
// "agricultural in chikatmamidi" read as professional listings.
// (titleCase itself now lives in @/types/property, shared with public pages.)

function isThisWeek(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr).getTime();
  return Date.now() - date < 7 * 24 * 60 * 60 * 1000;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'leads' | 'properties' | 'projects' | 'chat' | 'survey' | 'submissions' | 'brokers'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Prop[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [submissions, setSubmissions] = useState<PropertySubmission[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [newMessageAlert, setNewMessageAlert] = useState(0);
  const [propStatusFilter, setPropStatusFilter] = useState<string>('all');
  const [propSort, setPropSort] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('all');
  const [surveyTypeFilter, setSurveyTypeFilter] = useState<'all' | 'owner' | 'tenant' | 'investor' | 'broker'>('all');

  const loadLeads = useCallback(() => {
    fetch('/api/leads').then((r) => r.json()).then((d) => d.success && setLeads(d.leads));
  }, []);

  const loadProperties = useCallback(() => {
    fetch('/api/properties').then((r) => r.json()).then((d) => {
      if (d.success) setProperties(d.properties);
    });
  }, []);

  const loadProjects = useCallback(() => {
    fetch('/api/developer-projects?all=1').then((r) => r.json()).then((d) => d.success && setProjects(d.projects));
  }, []);

  const loadBrokers = useCallback(() => {
    fetch('/api/brokers').then((r) => r.json()).then((d) => d.success && setBrokers(d.brokers));
  }, []);

  const loadConversations = useCallback(() => {
    fetch('/api/chat/conversations').then((r) => r.json()).then((d) => d.success && setConversations(d.conversations));
  }, []);

  const loadSurveyResponses = useCallback(() => {
    fetch('/api/market-survey').then((r) => r.json()).then((d) => d.success && setSurveyResponses(d.responses));
  }, []);

  const loadSubmissions = useCallback(() => {
    fetch('/api/property-submissions').then((r) => r.json()).then((d) => d.success && setSubmissions(d.submissions));
  }, []);

  useEffect(() => {
    loadLeads();
    loadProperties();
    loadProjects();
    loadBrokers();
    loadConversations();
    loadSurveyResponses();
    loadSubmissions();
  }, [loadLeads, loadProperties, loadProjects, loadBrokers, loadConversations, loadSurveyResponses, loadSubmissions]);

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe('admin-inbox');
    channel.bind('new-lead-message', () => {
      setNewMessageAlert((n) => n + 1);
      loadConversations();
    });
    return () => { channel.unbind_all(); pusher.unsubscribe('admin-inbox'); };
  }, [loadConversations]);

  const updateLeadStatus = async (id: number, status: string) => {
    await fetch('/api/leads/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    loadLeads();
  };

  const updateBroker = async (id: number, patch: Partial<Broker>) => {
    await fetch('/api/brokers/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    loadBrokers();
  };

  const deleteBroker = async (id: number, name: string) => {
    if (!confirm('Remove "' + name + '" from the broker network? This cannot be undone.')) return;
    await fetch('/api/brokers/' + id, { method: 'DELETE' });
    loadBrokers();
  };

  const deleteLead = async (id: number) => {
    if (!confirm('Delete this lead?')) return;
    await fetch('/api/leads/' + id, { method: 'DELETE' });
    loadLeads();
  };

  const updatePropertyStatus = async (id: number, status: string) => {
    await fetch('/api/properties/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    loadProperties();
  };

  const deleteProperty = async (id: number, title: string) => {
    if (!confirm('Permanently delete "' + title + '"? This cannot be undone.')) return;
    await fetch('/api/properties/' + id, { method: 'DELETE' });
    loadProperties();
  };

  const updateProjectStatus = async (id: number, status: string) => {
    await fetch('/api/developer-projects/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    loadProjects();
  };

  const toggleProjectFeatured = async (id: number, featured: boolean) => {
    await fetch('/api/developer-projects/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featured: !featured }) });
    loadProjects();
  };

  const toggleProjectActive = async (id: number, isActive: boolean) => {
    await fetch('/api/developer-projects/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !isActive }) });
    loadProjects();
  };

  const deleteProject = async (id: number, name: string) => {
    if (!confirm('Permanently delete "' + name + '"? This cannot be undone.')) return;
    await fetch('/api/developer-projects/' + id, { method: 'DELETE' });
    loadProjects();
  };

  const logout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const parsePriceForSort = (price: string): number => {
    const lower = price.toLowerCase();
    const num = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
    if (lower.includes('cr')) return num * 10000000;
    if (lower.includes('l')) return num * 100000;
    return num;
  };

  const allProperties = properties;
  const filteredProperties = useMemo(() => {
    let list = propStatusFilter === 'all' ? allProperties : allProperties.filter((p) => p.status === propStatusFilter);
    if (propSort === 'price_asc') list = [...list].sort((a, b) => parsePriceForSort(a.price) - parsePriceForSort(b.price));
    if (propSort === 'price_desc') list = [...list].sort((a, b) => parsePriceForSort(b.price) - parsePriceForSort(a.price));
    return list;
  }, [allProperties, propStatusFilter, propSort]);

  const stats = {
    total: leads.length,
    totalNew: leads.filter((l) => isThisWeek(l.created_at)).length,
    hot: leads.filter((l) => l.status === 'hot').length,
    closed: leads.filter((l) => l.status === 'closed').length,
    activeProps: properties.filter((p) => p.status === 'active').length,
    activePropsNew: properties.filter((p) => p.status === 'active' && isThisWeek(p.created_at)).length,
  };

  const recentActivity = useMemo(() => {
    type Item = { key: string; icon: React.ReactNode; text: string; sub: string; time: string };
    const items: Item[] = [
      ...leads.slice(0, 5).map((l) => ({
        key: 'lead-' + l.id, icon: <Users size={13} />, text: `New lead: ${l.name}`,
        sub: [l.area, l.budget].filter(Boolean).join(' · ') || l.source, time: l.created_at,
      })),
      ...submissions.slice(0, 5).map((s) => ({
        key: 'sub-' + s.id, icon: <ClipboardList size={13} />, text: `Property submitted by ${s.owner_name}`,
        sub: titleCase(s.title) || `${s.property_type} in ${s.area}`, time: s.created_at,
      })),
      ...surveyResponses.slice(0, 5).map((s) => ({
        key: 'survey-' + s.id, icon: <MessageCircle size={13} />, text: `Survey response from ${s.area || 'a visitor'}`,
        sub: s.name || 'Anonymous', time: s.created_at,
      })),
    ];
    return items
      .filter((i) => i.time)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);
  }, [leads, submissions, surveyResponses]);

  return (
    <div className="flex-1 bg-stone-50 text-stone-900 min-h-screen">
      <div className="bg-white border-b border-stone-200 px-7 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="font-bold">nomore<span className="text-orange-400">2%</span> <span className="text-xs text-stone-500 font-normal">Admin</span></div>
          <span className="hidden sm:inline text-xs text-stone-400 border-l border-stone-200 pl-3">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/" className="border border-stone-200 rounded-lg px-3 py-1.5 text-xs hover:border-orange-400 hover:text-orange-400 transition-colors">View Site</Link>
          <button onClick={logout} className="border border-stone-200 rounded-lg px-3 py-1.5 text-xs hover:border-stone-400">Sign Out</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-7 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
          <StatCard label="Total Leads" value={stats.total} icon={<Users size={16} />} iconBg="bg-stone-100 text-stone-500" sub={stats.totalNew > 0 ? `+${stats.totalNew} this week` : undefined} />
          <StatCard label="Hot Leads" value={stats.hot} color="text-red-600" icon={<Flame size={16} />} iconBg="bg-red-50 text-red-500" />
          <StatCard label="Closed Deals" value={stats.closed} color="text-emerald-600" icon={<CheckCircle2 size={16} />} iconBg="bg-emerald-50 text-emerald-500" />
          <StatCard label="Active Listings" value={stats.activeProps} color="text-orange-400" icon={<Home size={16} />} iconBg="bg-orange-50 text-orange-400" sub={stats.activePropsNew > 0 ? `+${stats.activePropsNew} this week` : undefined} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-stone-200 rounded-xl p-1 w-fit mb-5 max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TabBtn active={tab === 'leads'} onClick={() => setTab('leads')}>Leads ({stats.total})</TabBtn>
          <TabBtn active={tab === 'properties'} onClick={() => setTab('properties')}>Properties ({properties.length})</TabBtn>
          <TabBtn active={tab === 'projects'} onClick={() => setTab('projects')}>Developer Projects ({projects.length})</TabBtn>
          <TabBtn active={tab === 'brokers'} onClick={() => setTab('brokers')}>Brokers ({brokers.length})</TabBtn>
          <TabBtn active={tab === 'chat'} onClick={() => { setTab('chat'); setNewMessageAlert(0); }}>
            Live Chat ({conversations.length}) {newMessageAlert > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5">{newMessageAlert}</span>}
          </TabBtn>
          <TabBtn active={tab === 'survey'} onClick={() => setTab('survey')}>Market Survey ({surveyResponses.length})</TabBtn>
          <TabBtn active={tab === 'submissions'} onClick={() => setTab('submissions')}>
            Submissions ({submissions.length}) {submissions.filter((s) => s.status === 'pending').length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5">{submissions.filter((s) => s.status === 'pending').length}</span>
            )}
          </TabBtn>
        </div>

        {/* LEADS TAB */}
        {tab === 'leads' && (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-200 bg-stone-50">
                  <th className="p-3.5">Name</th><th className="p-3.5">Phone</th><th className="p-3.5">Area</th>
                  <th className="p-3.5">Budget</th><th className="p-3.5">Source</th><th className="p-3.5">Status</th>
                  <th className="p-3.5">Date</th><th className="p-3.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-stone-200/50 hover:bg-stone-50">
                    <td className="p-3.5 font-medium">{l.name}</td>
                    <td className="p-3.5">{l.phone}</td>
                    <td className="p-3.5 text-stone-500">{l.area || '—'}</td>
                    <td className="p-3.5 text-orange-400">{l.budget || '—'}</td>
                    <td className="p-3.5"><span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded text-stone-500">{l.source}</span></td>
                    <td className="p-3.5">
                      <select value={l.status} onChange={(e) => updateLeadStatus(l.id, e.target.value)} className="bg-stone-100 border border-stone-300 rounded px-2 py-1 text-xs">
                        <option value="hot">Hot</option>
                        <option value="warm">Warm</option>
                        <option value="cold">Cold</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-stone-500 text-xs">{new Date(l.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="p-3.5">
                      <div className="flex gap-1.5">
                        <a href={'https://wa.me/91' + l.phone.replace(/\D/g, '').slice(-10)} target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 rounded px-2 py-1">WA</a>
                        <button onClick={() => deleteLead(l.id)} className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-2 py-1">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {leads.length === 0 && (
              <div className="p-14 text-center">
                <Inbox size={28} className="text-stone-300 mx-auto mb-2" />
                <p className="text-stone-500 text-sm">No leads yet.</p>
                <p className="text-stone-400 text-xs mt-1">New enquiries from your site will show up here automatically.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'leads' && recentActivity.length > 0 && (
          <div className="mt-5">
            <div className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2.5 flex items-center gap-1.5"><Clock size={12} /> Recent Activity</div>
            <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
              {recentActivity.map((item) => (
                <div key={item.key} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center flex-shrink-0">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-stone-800 truncate">{item.text}</div>
                    <div className="text-xs text-stone-500 truncate">{item.sub}</div>
                  </div>
                  <div className="text-[11px] text-stone-400 flex-shrink-0">{new Date(item.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROPERTIES TAB */}
        {tab === 'properties' && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <Link href="/admin/properties/new" className="inline-block bg-orange-500 text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-orange-400 transition-colors">
                + Add Property
              </Link>
              <div className="flex gap-2 flex-wrap">
                {['all', 'active', 'sold', 'rented', 'inactive'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPropStatusFilter(s)}
                    className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ' + (
                      propStatusFilter === s
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'border-stone-200 text-stone-500 hover:border-stone-400'
                    )}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    {s !== 'all' && <span className="ml-1.5 opacity-60">({properties.filter((p) => p.status === s).length})</span>}
                    {s === 'all' && <span className="ml-1.5 opacity-60">({properties.length})</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-200 bg-stone-50">
                    <th className="p-3.5">Property</th>
                    <th className="p-3.5">
                      <button
                        onClick={() => setPropSort(propSort === 'price_asc' ? 'price_desc' : 'price_asc')}
                        className="flex items-center gap-1 hover:text-stone-800 transition-colors"
                      >
                        Price <ArrowUpDown size={11} />
                      </button>
                    </th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((p) => (
                    <tr key={p.id} className="border-b border-stone-200/50 hover:bg-stone-50">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageOff size={16} className="text-stone-300" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{titleCase(p.title)}</div>
                            <div className="text-xs text-stone-500">📍 {p.area}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-orange-400 font-semibold">₹{p.price}</td>
                      <td className="p-3.5">
                        <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded text-stone-500 uppercase">{p.listing_type}</span>
                      </td>
                      <td className="p-3.5">
                        <select
                          value={p.status}
                          onChange={(e) => updatePropertyStatus(p.id, e.target.value)}
                          className={'text-xs rounded px-2 py-1.5 border font-semibold bg-transparent ' + (STATUS_COLORS[p.status] || 'text-stone-500')}
                        >
                          <option value="active">Active</option>
                          <option value="sold">Sold</option>
                          <option value="rented">Rented</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="p-3.5">
                        <div className="flex gap-2">
                          <Link
                            href={'/admin/properties/edit/' + p.id}
                            className="text-xs bg-stone-100 text-stone-600 border border-stone-200 rounded px-3 py-1.5 hover:bg-stone-200 transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => deleteProperty(p.id, p.title)}
                            className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-3 py-1.5 hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              {filteredProperties.length === 0 && (
                <div className="p-14 text-center">
                  <Home size={28} className="text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-500 text-sm">{propStatusFilter === 'all' ? 'No properties yet.' : 'No ' + propStatusFilter + ' properties.'}</p>
                  {propStatusFilter === 'all' && <p className="text-stone-400 text-xs mt-1">Click "+ Add Property" above to list your first one.</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {tab === 'projects' && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <Link href="/admin/projects/new" className="inline-block bg-orange-500 text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-orange-400 transition-colors">
                + Add Developer Project
              </Link>
              <div className="flex gap-2 flex-wrap">
                {['all', 'upcoming', 'under_construction', 'ready_to_move'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setProjectStatusFilter(s)}
                    className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ' + (
                      projectStatusFilter === s
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'border-stone-200 text-stone-500 hover:border-stone-400'
                    )}
                  >
                    {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    <span className="ml-1.5 opacity-60">
                      ({s === 'all' ? projects.length : projects.filter((p) => p.status === s).length})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-200 bg-stone-50">
                      <th className="p-3.5">Project</th>
                      <th className="p-3.5">Price Range</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Featured</th>
                      <th className="p-3.5">Visible</th>
                      <th className="p-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(projectStatusFilter === 'all' ? projects : projects.filter((p) => p.status === projectStatusFilter)).map((p) => (
                      <tr key={p.id} className="border-b border-stone-200/50 hover:bg-stone-50">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {p.images?.[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <ImageOff size={16} className="text-stone-300" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{titleCase(p.project_name)}</div>
                              <div className="text-xs text-stone-500">{p.developer_name} · 📍 {p.area}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-orange-400 font-semibold">{p.price_range || '—'}</td>
                        <td className="p-3.5">
                          <select
                            value={p.status}
                            onChange={(e) => updateProjectStatus(p.id, e.target.value)}
                            className="text-xs rounded px-2 py-1.5 border font-semibold bg-transparent border-stone-200 text-stone-600"
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="under_construction">Under Construction</option>
                            <option value="ready_to_move">Ready to Move</option>
                          </select>
                        </td>
                        <td className="p-3.5">
                          <button onClick={() => toggleProjectFeatured(p.id, p.featured)} className={'text-xs rounded px-2 py-1 border font-semibold transition-colors ' + (p.featured ? 'bg-amber-50 text-amber-600 border-amber-200' : 'border-stone-200 text-stone-400')}>
                            {p.featured ? '★ Featured' : '☆ Feature'}
                          </button>
                        </td>
                        <td className="p-3.5">
                          <button onClick={() => toggleProjectActive(p.id, p.is_active)} className={'text-xs rounded px-2 py-1 border font-semibold transition-colors ' + (p.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-stone-100 text-stone-500 border-stone-200')}>
                            {p.is_active ? 'Live' : 'Hidden'}
                          </button>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => deleteProject(p.id, p.project_name)}
                            className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-3 py-1.5 hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {projects.filter((p) => projectStatusFilter === 'all' || p.status === projectStatusFilter).length === 0 && (
                <div className="p-14 text-center">
                  <Building2 size={28} className="text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-500 text-sm">No developer projects yet.</p>
                  <p className="text-stone-400 text-xs mt-1">Click "+ Add Developer Project" above to list your first one.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BROKERS TAB */}
        {tab === 'brokers' && <BrokersPanel brokers={brokers} onUpdate={updateBroker} onDelete={deleteBroker} onRefresh={loadBrokers} />}

        {/* CHAT TAB */}
        {tab === 'chat' && <ChatInbox conversations={conversations} onRefresh={loadConversations} />}

        {/* SURVEY TAB */}
        {tab === 'survey' && (
          <SurveyResponses responses={surveyResponses} typeFilter={surveyTypeFilter} setTypeFilter={setSurveyTypeFilter} />
        )}

        {/* SUBMISSIONS TAB */}
        {tab === 'submissions' && (
          <PropertySubmissions submissions={submissions} onRefresh={loadSubmissions} />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-stone-900', icon, iconBg = 'bg-stone-100 text-stone-500', sub }: { label: string; value: number; color?: string; icon?: React.ReactNode; iconBg?: string; sub?: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] uppercase tracking-wide text-stone-500">{label}</div>
        {icon && <div className={'w-7 h-7 rounded-lg flex items-center justify-center ' + iconBg}>{icon}</div>}
      </div>
      <div className={'font-serif text-2xl font-bold ' + color}>{value}</div>
      {sub && <div className="text-[11px] text-emerald-500 font-medium mt-0.5">{sub}</div>}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 whitespace-nowrap ' + (active ? 'bg-orange-500 text-white' : 'text-stone-500 hover:text-stone-900')}>
      {children}
    </button>
  );
}

function toCSV(rows: SurveyResponse[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]) as (keyof SurveyResponse)[];
  const escape = (val: unknown) => {
    if (val === null || val === undefined) return '';
    const s = String(val).replace(/"/g, '""');
    return '"' + s + '"';
  };
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ];
  return lines.join('\n');
}

function downloadCSV(rows: SurveyResponse[]) {
  const csv = toCSV(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'market-survey-responses-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <span className="text-stone-500">{label}:</span>{' '}
      <span className="text-stone-700">{value === null || value === undefined || value === '' ? '—' : value}</span>
    </div>
  );
}

function BrokersPanel({ brokers, onUpdate, onDelete, onRefresh }: { brokers: Broker[]; onUpdate: (id: number, patch: Partial<Broker>) => void; onDelete: (id: number, name: string) => void; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', rera_agent_number: '', notes: '' });

  const submit = async () => {
    setError('');
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setError('Name, phone, and email are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/brokers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Failed to add broker'); return; }
      setForm({ name: '', phone: '', email: '', rera_agent_number: '', notes: '' });
      setShowForm(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400";

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-orange-500 hover:bg-orange-400 text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors"
        >
          {showForm ? 'Cancel' : '+ Invite Broker'}
        </button>
        <p className="text-xs text-stone-400 max-w-md">
          Invite-only network — brokers don&apos;t self-register. They sign in with the same account system as buyers (email or Google); this list just marks who&apos;s a recognized partner.
        </p>
      </div>

      {showForm && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Broker name" className={inputClass} />
            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone number" className={inputClass} />
            <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email (must match how they'll sign in)" className={inputClass} />
            <input value={form.rera_agent_number} onChange={(e) => setForm((p) => ({ ...p, rera_agent_number: e.target.value }))} placeholder="RERA Agent Reg. No. (optional for now)" className={inputClass} />
          </div>
          <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" className={inputClass + ' h-16 resize-none mb-3'} />
          {error && <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">{error}</div>}
          <button onClick={submit} disabled={saving} className="bg-stone-900 text-white rounded-lg px-5 py-2 text-sm font-bold hover:bg-stone-800 transition-colors disabled:opacity-50">
            {saving ? 'Adding...' : 'Add Broker'}
          </button>
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-200 bg-stone-50">
                <th className="p-3.5">Broker</th>
                <th className="p-3.5">RERA</th>
                <th className="p-3.5">MOU</th>
                <th className="p-3.5">Listings</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brokers.map((b) => (
                <tr key={b.id} className="border-b border-stone-200/50 hover:bg-stone-50">
                  <td className="p-3.5">
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-stone-500">{b.email} · {b.phone}</div>
                  </td>
                  <td className="p-3.5">
                    {b.rera_agent_number ? (
                      <button
                        onClick={() => onUpdate(b.id, { rera_verified: !b.rera_verified })}
                        className={'text-xs rounded px-2 py-1 border font-semibold transition-colors ' + (b.rera_verified ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200')}
                        title={b.rera_agent_number}
                      >
                        {b.rera_verified ? '✓ Verified' : 'Unverified'}
                      </button>
                    ) : (
                      <span className="text-xs text-stone-400">No number on file</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => onUpdate(b.id, { mou_signed: !b.mou_signed })}
                      className={'text-xs rounded px-2 py-1 border font-semibold transition-colors ' + (b.mou_signed ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-stone-100 text-stone-500 border-stone-200')}
                    >
                      {b.mou_signed ? '✓ Signed' : 'Not Signed'}
                    </button>
                  </td>
                  <td className="p-3.5 text-stone-600">{b.approved_count} live / {b.submission_count} total</td>
                  <td className="p-3.5">
                    <select
                      value={b.status}
                      onChange={(e) => onUpdate(b.id, { status: e.target.value as Broker['status'] })}
                      className="text-xs rounded px-2 py-1.5 border font-semibold bg-transparent border-stone-200 text-stone-600"
                    >
                      <option value="invited">Invited</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => onDelete(b.id, b.name)}
                      className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-3 py-1.5 hover:bg-red-100 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {brokers.length === 0 && (
          <div className="p-14 text-center">
            <Users size={28} className="text-stone-300 mx-auto mb-2" />
            <p className="text-stone-500 text-sm">No brokers in the network yet.</p>
            <p className="text-stone-400 text-xs mt-1">Click &quot;+ Invite Broker&quot; to add your first partner.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SurveyResponses({
  responses,
  typeFilter,
  setTypeFilter,
}: {
  responses: SurveyResponse[];
  typeFilter: 'all' | 'owner' | 'tenant' | 'investor' | 'broker';
  setTypeFilter: (v: 'all' | 'owner' | 'tenant' | 'investor' | 'broker') => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = typeFilter === 'all' ? responses : responses.filter((r) => r.user_type === typeFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'owner', 'tenant', 'investor', 'broker'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ' + (
                typeFilter === t
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'border-stone-200 text-stone-500 hover:border-stone-400'
              )}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span className="ml-1.5 opacity-60">
                ({t === 'all' ? responses.length : responses.filter((r) => r.user_type === t).length})
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => downloadCSV(filtered)}
          disabled={filtered.length === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 text-stone-700 hover:border-orange-400 hover:text-orange-400 transition-colors disabled:opacity-40 disabled:hover:border-stone-300 disabled:hover:text-stone-700"
        >
          Export CSV ({filtered.length})
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-200 bg-stone-50">
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Area</th>
              <th className="p-3.5">Property</th>
              <th className="p-3.5">Value</th>
              <th className="p-3.5">Recommend</th>
              <th className="p-3.5">Contact</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <Fragment key={r.id}>
                <tr className="border-b border-stone-200/50 hover:bg-stone-50">
                  <td className="p-3.5">
                    <span className={'text-[10px] px-2 py-0.5 rounded uppercase font-semibold ' + (
                      r.user_type === 'owner' ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : r.user_type === 'tenant' || r.user_type === 'renter' ? 'bg-purple-50 text-purple-600 border border-purple-200'
                      : r.user_type === 'investor' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                    )}>
                      {r.user_type}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-medium">{r.area || '—'}</div>
                    <div className="text-xs text-stone-500">{r.landmark || r.locality || ''}</div>
                  </td>
                  <td className="p-3.5 text-stone-500">
                    {[r.property_type, r.property_size_value ? `${r.property_size_value} ${r.property_size_unit || 'sqft'}` : r.bhk].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="p-3.5 text-orange-400">
                    {r.current_value ? '₹' + r.current_value.toLocaleString('en-IN')
                      : r.current_value_exact ? '₹' + r.current_value_exact.toLocaleString('en-IN')
                      : r.monthly_rent ? '₹' + r.monthly_rent.toLocaleString('en-IN') + '/mo'
                      : '—'}
                  </td>
                  <td className="p-3.5 text-stone-500">{r.recommend_score ? `${r.recommend_score}/10` : '—'}</td>
                  <td className="p-3.5">
                    {r.willing_to_contact && r.phone ? (
                      <a href={'https://wa.me/91' + r.phone.replace(/\D/g, '').slice(-10)} target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 rounded px-2 py-1">
                        {r.name || 'WA'}
                      </a>
                    ) : (
                      <span className="text-xs text-stone-600">Anonymous</span>
                    )}
                  </td>
                  <td className="p-3.5 text-stone-500 text-xs">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="p-3.5">
                    <button
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      className="text-xs text-stone-500 hover:text-orange-400"
                    >
                      {expanded === r.id ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr className="border-b border-stone-200/50 bg-stone-50">
                    <td colSpan={8} className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5 text-xs">

                        <div>
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">About</div>
                          <div className="space-y-1.5">
                            <DetailRow label="Name" value={r.name} />
                            <DetailRow label="Phone" value={r.phone} />
                            <DetailRow label="Years in locality" value={r.years_in_locality} />
                            <DetailRow label="Facing" value={r.facing} />
                            <DetailRow label="Corner plot" value={r.corner_plot === null ? null : r.corner_plot ? 'Yes' : 'No'} />
                          </div>
                        </div>

                        <div>
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Purchase History</div>
                          <div className="space-y-1.5">
                            <DetailRow label="Purchase year" value={r.purchase_year} />
                            <DetailRow label="Purchase price" value={r.purchase_price ? '₹' + r.purchase_price.toLocaleString('en-IN') : r.purchase_price_exact ? '₹' + r.purchase_price_exact.toLocaleString('en-IN') : null} />
                            <DetailRow label="Price per unit" value={r.purchase_price_per_unit ? '₹' + r.purchase_price_per_unit.toLocaleString('en-IN') : null} />
                            <DetailRow label="Acquired via" value={r.purchase_type} />
                          </div>
                        </div>

                        <div>
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Current Value & Growth</div>
                          <div className="space-y-1.5">
                            <DetailRow label="Current value" value={r.current_value ? '₹' + r.current_value.toLocaleString('en-IN') : null} />
                            <DetailRow label="Growth" value={r.price_growth_bucket} />
                            <DetailRow label="Main reason" value={r.growth_main_reason} />
                            <DetailRow label="Highest offer" value={r.highest_offer ? '₹' + r.highest_offer.toLocaleString('en-IN') : null} />
                          </div>
                        </div>

                        <div>
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Infrastructure (1-5)</div>
                          <div className="space-y-1.5">
                            <DetailRow label="Roads" value={r.rating_roads} />
                            <DetailRow label="Water" value={r.rating_water} />
                            <DetailRow label="Electricity" value={r.rating_electricity} />
                            <DetailRow label="Drainage & garbage" value={r.rating_drainage_garbage} />
                            <DetailRow label="Safety" value={r.rating_safety} />
                            <DetailRow label="Traffic & parking" value={r.rating_traffic_parking} />
                            <DetailRow label="Public transport" value={r.rating_public_transport} />
                            <DetailRow label="Schools & hospitals" value={r.rating_schools_hospitals} />
                            <DetailRow label="Shopping" value={r.rating_shopping} />
                            <DetailRow label="Water source" value={r.water_source} />
                            <DetailRow label="Power cuts" value={r.power_cuts} />
                          </div>
                        </div>

                        <div>
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Developments & Issues</div>
                          <div className="space-y-1.5">
                            <DetailRow label="Developments" value={r.recent_developments_list?.join(', ')} />
                            <DetailRow label="Issues" value={r.biggest_issues_list?.join(', ')} />
                          </div>
                        </div>

                        <div>
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Investment Interest</div>
                          <div className="space-y-1.5">
                            <DetailRow label="Interested" value={r.investment_interest} />
                            <DetailRow label="Budget" value={r.investment_budget} />
                            <DetailRow label="Preferred type" value={r.preferred_property_type} />
                            <DetailRow label="Preferred location" value={r.preferred_location} />
                            <DetailRow label="Holding period" value={r.holding_period} />
                            <DetailRow label="Expected return" value={r.expected_return} />
                          </div>
                        </div>

                        <div>
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Future Outlook</div>
                          <div className="space-y-1.5">
                            <DetailRow label="1yr trend" value={r.price_trend_1yr} />
                            <DetailRow label="5yr trend" value={r.price_trend_5yr} />
                            <DetailRow label="Recommend score" value={r.recommend_score ? `${r.recommend_score}/10` : null} />
                          </div>
                        </div>

                        <div>
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">
                            {r.user_type === 'tenant' || r.user_type === 'renter' ? 'Rental Market' : 'Selling Intent'}
                          </div>
                          <div className="space-y-1.5">
                            {r.user_type === 'tenant' || r.user_type === 'renter' ? (
                              <>
                                <DetailRow label="Monthly rent" value={r.monthly_rent ? '₹' + r.monthly_rent.toLocaleString('en-IN') : null} />
                                <DetailRow label="Rental demand" value={r.rental_demand} />
                              </>
                            ) : (
                              <>
                                <DetailRow label="Planning to sell" value={r.planning_to_sell} />
                                <DetailRow label="Expected price" value={r.expected_sale_price ? '₹' + r.expected_sale_price.toLocaleString('en-IN') : null} />
                                <DetailRow label="Reason" value={r.sell_reason} />
                              </>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-3">
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Open Feedback</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-1.5">
                            <DetailRow label="Best thing" value={r.feedback_best_thing || r.best_about_area} />
                            <DetailRow label="Govt improvement" value={r.feedback_govt_improvement} />
                            <DetailRow label="Would invest if" value={r.feedback_invest_reason} />
                          </div>
                        </div>

                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
            </div>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-stone-500 text-sm">
            {typeFilter === 'all' ? 'No survey responses yet.' : 'No ' + typeFilter + ' responses yet.'}
          </div>
        )}
      </div>
    </div>
  );
}

function PropertySubmissions({ submissions, onRefresh }: { submissions: PropertySubmission[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkRejecting, setBulkRejecting] = useState(false);
  const [bulkRejectNote, setBulkRejectNote] = useState('');

  const filtered = filter === 'all' ? submissions : submissions.filter((s) => s.status === filter);
  const pendingInView = filtered.filter((s) => s.status === 'pending');

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (pendingInView.every((s) => prev.has(s.id)) && pendingInView.length > 0) return new Set();
      return new Set(pendingInView.map((s) => s.id));
    });
  };

  const approve = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/property-submissions/${id}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) alert(data.message || 'Failed to approve');
      onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: number) => {
    setBusyId(id);
    try {
      await fetch(`/api/property-submissions/${id}/reject`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: rejectNote || null }),
      });
      setRejectingId(null);
      setRejectNote('');
      onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const bulkApprove = async () => {
    if (!confirm(`Approve & publish ${selected.size} selected listing(s)?`)) return;
    setBulkBusy(true);
    try {
      const results = await Promise.allSettled(
        Array.from(selected).map((id) =>
          fetch(`/api/property-submissions/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        )
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) alert(`${failed} listing(s) failed to publish — check them individually.`);
      setSelected(new Set());
      onRefresh();
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkReject = async () => {
    setBulkBusy(true);
    try {
      await Promise.allSettled(
        Array.from(selected).map((id) =>
          fetch(`/api/property-submissions/${id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_notes: bulkRejectNote || null }) })
        )
      );
      setSelected(new Set());
      setBulkRejecting(false);
      setBulkRejectNote('');
      onRefresh();
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ' + (
              filter === f ? 'bg-orange-500 text-white border-orange-500' : 'border-stone-200 text-stone-500 hover:border-stone-400'
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 opacity-60">({f === 'all' ? submissions.length : submissions.filter((s) => s.status === f).length})</span>
          </button>
        ))}
        {pendingInView.length > 0 && (
          <label className="flex items-center gap-1.5 text-xs text-stone-500 ml-auto cursor-pointer">
            <input
              type="checkbox"
              checked={pendingInView.every((s) => selected.has(s.id))}
              onChange={toggleSelectAll}
            />
            Select all pending
          </label>
        )}
      </div>

      {selected.size > 0 && (
        <div className="sticky top-0 z-10 bg-stone-900 text-white rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap shadow-lg">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          {bulkRejecting ? (
            <div className="flex gap-2 items-center flex-1 min-w-[240px]">
              <input
                value={bulkRejectNote}
                onChange={(e) => setBulkRejectNote(e.target.value)}
                placeholder="Reason for all selected (optional)"
                className="flex-1 bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-orange-400 text-white placeholder:text-stone-500"
              />
              <button onClick={bulkReject} disabled={bulkBusy} className="text-xs bg-red-500 hover:bg-red-600 rounded px-3 py-1.5 font-semibold disabled:opacity-50 whitespace-nowrap">
                {bulkBusy ? 'Rejecting...' : 'Confirm Reject'}
              </button>
              <button onClick={() => { setBulkRejecting(false); setBulkRejectNote(''); }} className="text-xs text-stone-400 hover:text-stone-200">Cancel</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={bulkApprove} disabled={bulkBusy} className="text-xs bg-emerald-500 hover:bg-emerald-600 rounded px-3 py-1.5 font-semibold disabled:opacity-50">
                {bulkBusy ? 'Publishing...' : `✓ Approve & Publish ${selected.size}`}
              </button>
              <button onClick={() => setBulkRejecting(true)} disabled={bulkBusy} className="text-xs bg-stone-700 hover:bg-stone-600 rounded px-3 py-1.5 font-semibold disabled:opacity-50">
                Reject {selected.size}
              </button>
              <button onClick={() => setSelected(new Set())} className="text-xs text-stone-400 hover:text-stone-200">Clear</button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((s) => {
          const cover = s.property_submission_images?.find((i) => i.is_primary) || s.property_submission_images?.[0];
          return (
            <div key={s.id} className="bg-white border border-stone-200 rounded-xl p-4 flex gap-4">
              {s.status === 'pending' && (
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggleSelect(s.id)}
                  className="mt-1 flex-shrink-0"
                />
              )}
              <div className="w-24 h-24 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-3xl">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover.storage_path} alt="" className="w-full h-full object-cover" />
                ) : '🏠'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm">{s.title || `${s.property_type} in ${s.area}`}</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {s.area} · {s.property_type} · {s.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                      {s.price ? ` · ₹${s.price}` : ''}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {[s.bedrooms && `${s.bedrooms} BHK`, s.sqft && `${s.sqft} ${s.size_unit === 'sqyd' ? 'sq.yd' : s.size_unit === 'acres' ? 'acres' : 'sqft'}`, s.floor].filter(Boolean).join(' · ')}
                      {s.lat != null && s.lng != null && <span className="text-emerald-500 ml-2">📍 Location pinned</span>}
                      {s.brokers && <span className="text-blue-500 ml-2">🤝 via {s.brokers.name}</span>}
                    </div>
                  </div>
                  <span className={'text-[10px] px-2 py-0.5 rounded uppercase font-semibold flex-shrink-0 ' + (
                    s.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : s.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                  )}>
                    {s.status}
                  </span>
                </div>

                <div className="text-xs text-stone-500 mt-2">
                  {s.brokers ? 'Broker contact' : 'From'} <span className="text-stone-800">{s.owner_name}</span> ·{' '}
                  <a href={'https://wa.me/91' + s.owner_phone.replace(/\D/g, '').slice(-10)} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                    {s.owner_phone}
                  </a>
                  {s.owner_email ? ` · ${s.owner_email}` : ''}
                  {s.brokers && <span className="text-amber-500 ml-2">(seller details not shared by broker)</span>}
                </div>

                {s.description && <div className="text-xs text-stone-500 mt-2 line-clamp-2">{s.description}</div>}

                {s.property_submission_images?.length > 1 && (
                  <div className="flex gap-1.5 mt-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {s.property_submission_images.slice(0, 6).map((img) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={img.id} src={img.storage_path} alt="" className="w-9 h-9 flex-shrink-0 rounded object-cover border border-stone-200" />
                    ))}
                  </div>
                )}

                {s.status === 'pending' && (
                  <div className="mt-3">
                    {rejectingId === s.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          placeholder="Reason (optional)"
                          className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-orange-400"
                        />
                        <button onClick={() => reject(s.id)} disabled={busyId === s.id} className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-3 py-1.5 hover:bg-red-100 transition-colors disabled:opacity-50">
                          Confirm Reject
                        </button>
                        <button onClick={() => { setRejectingId(null); setRejectNote(''); }} className="text-xs text-stone-500 hover:text-stone-700">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => approve(s.id)} disabled={busyId === s.id} className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 rounded px-3 py-1.5 hover:bg-emerald-100 transition-colors disabled:opacity-50">
                          {busyId === s.id ? 'Publishing...' : '✓ Approve & Publish'}
                        </button>
                        <button onClick={() => setRejectingId(s.id)} disabled={busyId === s.id} className="text-xs bg-stone-100 text-stone-700 border border-stone-300 rounded px-3 py-1.5 hover:bg-stone-700 transition-colors disabled:opacity-50">
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {s.admin_notes && s.status === 'rejected' && (
                  <div className="text-xs text-stone-500 mt-2 italic">Note: {s.admin_notes}</div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-10 text-center text-stone-500 text-sm bg-white border border-stone-200 rounded-xl">
            No {filter !== 'all' ? filter : ''} submissions.
          </div>
        )}
      </div>
    </div>
  );
}

function ChatInbox({ conversations, onRefresh }: { conversations: Conversation[]; onRefresh: () => void }) {
  const [activeConvo, setActiveConvo] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!activeConvo) return;
    fetch('/api/chat/messages/' + activeConvo).then((r) => r.json()).then((d) => d.success && setMessages(d.messages));
    const pusher = getPusherClient();
    const channel = pusher.subscribe('chat-' + activeConvo);
    channel.bind('new-message', (msg: any) => setMessages((prev) => [...prev, msg]));
    return () => { channel.unbind_all(); pusher.unsubscribe('chat-' + activeConvo); };
  }, [activeConvo]);

  const send = async () => {
    if (!input.trim() || !activeConvo) return;
    const text = input.trim();
    setInput('');
    await fetch('/api/chat/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: activeConvo, sender: 'admin', message: text }),
    });
    onRefresh();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 bg-white border border-stone-200 rounded-xl overflow-hidden" style={{ height: 520 }}>
      <div className="border-r border-stone-200 overflow-y-auto">
        {conversations.map((c) => (
          <button key={c.id} onClick={() => setActiveConvo(c.id)} className={'w-full text-left p-3.5 border-b border-stone-200/50 hover:bg-stone-50 ' + (activeConvo === c.id ? 'bg-stone-100' : '')}>
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-sm">{c.visitor_name}</div>
              {c.handoff_requested && (
                <span className="text-[9px] font-bold uppercase tracking-wide bg-red-50 text-red-600 border border-red-200 rounded px-1.5 py-0.5 flex-shrink-0">
                  Needs you
                </span>
              )}
              {!c.handoff_requested && c.mode === 'ai' && (
                <span className="text-[9px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 flex-shrink-0">
                  AI
                </span>
              )}
            </div>
            <div className="text-xs text-stone-500">{c.visitor_phone || 'No phone'}</div>
            <div className="text-[10px] text-stone-600 mt-1">{new Date(c.last_message_at).toLocaleString('en-IN')}</div>
          </button>
        ))}
        {conversations.length === 0 && <div className="p-6 text-center text-stone-500 text-xs">No conversations yet.</div>}
      </div>
      <div className="flex flex-col">
        {activeConvo ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
              {messages.map((m) => (
                <div key={m.id} className={'flex flex-col gap-1 max-w-[75%] ' + (m.sender === 'admin' ? 'self-end items-end' : 'self-start items-start')}>
                  {m.sender === 'ai' && <span className="text-[9px] uppercase tracking-wide text-blue-600 font-semibold px-1">AI Assistant</span>}
                  <div className={'px-3 py-2 rounded-xl text-sm ' + (m.sender === 'admin' ? 'bg-orange-500 text-white' : m.sender === 'ai' ? 'bg-blue-50 border border-blue-200 text-stone-800' : 'bg-stone-100 text-stone-900')}>
                    {m.message}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-stone-200 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Reply to visitor..." className="flex-1 bg-white border border-stone-200 rounded-full px-4 py-2 text-sm outline-none focus:border-orange-400" />
              <button onClick={send} className="bg-orange-500 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold">Send</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-500 text-sm">Select a conversation</div>
        )}
      </div>
    </div>
  );
}
