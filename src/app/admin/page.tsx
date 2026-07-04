'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher-client';

interface Lead {
  id: number; name: string; phone: string; email: string | null; area: string | null;
  budget: string | null; property_type: string | null; status: string; source: string; created_at: string;
}
interface Prop {
  id: number; title: string; area: string; price: string; listing_type: string;
  status: string; bedrooms: number; sqft: number;
}
interface Conversation {
  id: number; visitor_name: string; visitor_phone: string | null; last_message_at: string;
  chat_messages: { count: number }[];
}
interface SurveyResponse {
  id: number; user_type: string; name: string | null; phone: string | null;
  willing_to_contact: boolean; area: string | null; locality: string | null;
  property_type: string | null; bhk: string | null; floor: string | null;
  building_age: string | null; society_name: string | null;
  purchase_year: string | null; purchase_price_range: string | null;
  purchase_price_exact: number | null; purchase_price_per_sqft: number | null;
  current_value_range: string | null; current_value_exact: number | null;
  appreciation_feel: string | null;
  rent_amount_range: string | null; rent_amount_exact: number | null;
  deposit_range: string | null; deposit_exact: number | null;
  rent_increase_last_year: string | null; rent_increase_amount: number | null;
  years_renting: string | null;
  infra_water: string | null; infra_road_width: string | null;
  infra_road_condition: string | null; infra_power: string | null;
  infra_drainage: string | null; infra_garbage: string | null;
  nearby_developments: string | null; metro_connectivity: string | null;
  new_projects_nearby: string | null; price_impact: string | null;
  builder_name: string | null; builder_rating: string | null;
  maintenance_charges: string | null; oc_status: string | null;
  society_quality: string | null;
  would_recommend: string | null; best_about_area: string | null; worst_about_area: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/40',
  sold: 'text-blue-400 bg-blue-950/40 border-blue-900/40',
  rented: 'text-purple-400 bg-purple-950/40 border-purple-900/40',
  inactive: 'text-stone-400 bg-stone-800/40 border-stone-700/40',
};

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'leads' | 'properties' | 'chat' | 'survey'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Prop[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [newMessageAlert, setNewMessageAlert] = useState(0);
  const [propStatusFilter, setPropStatusFilter] = useState<string>('all');
  const [surveyTypeFilter, setSurveyTypeFilter] = useState<'all' | 'owner' | 'renter'>('all');

  const loadLeads = useCallback(() => {
    fetch('/api/leads').then((r) => r.json()).then((d) => d.success && setLeads(d.leads));
  }, []);

  const loadProperties = useCallback(() => {
    fetch('/api/properties').then((r) => r.json()).then((d) => {
      if (d.success) setProperties(d.properties);
    });
  }, []);

  const loadConversations = useCallback(() => {
    fetch('/api/chat/conversations').then((r) => r.json()).then((d) => d.success && setConversations(d.conversations));
  }, []);

  const loadSurveyResponses = useCallback(() => {
    fetch('/api/market-survey').then((r) => r.json()).then((d) => d.success && setSurveyResponses(d.responses));
  }, []);

  useEffect(() => {
    loadLeads();
    loadProperties();
    loadConversations();
    loadSurveyResponses();
  }, [loadLeads, loadProperties, loadConversations, loadSurveyResponses]);

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

  const logout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const allProperties = properties;
  const filteredProperties = propStatusFilter === 'all'
    ? allProperties
    : allProperties.filter((p) => p.status === propStatusFilter);

  const stats = {
    total: leads.length,
    hot: leads.filter((l) => l.status === 'hot').length,
    closed: leads.filter((l) => l.status === 'closed').length,
    activeProps: properties.filter((p) => p.status === 'active').length,
  };

  return (
    <div className="flex-1 bg-stone-950 text-stone-100 min-h-screen">
      <div className="bg-stone-900 border-b border-stone-800 px-7 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="font-bold">nomore<span className="text-orange-400">2%</span> <span className="text-xs text-stone-500 font-normal">Admin</span></div>
        <div className="flex items-center gap-2.5">
          <Link href="/" className="border border-stone-800 rounded-lg px-3 py-1.5 text-xs hover:border-orange-400 hover:text-orange-400 transition-colors">View Site</Link>
          <button onClick={logout} className="border border-stone-800 rounded-lg px-3 py-1.5 text-xs hover:border-stone-700">Sign Out</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-7 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
          <StatCard label="Total Leads" value={stats.total} />
          <StatCard label="Hot Leads" value={stats.hot} color="text-red-400" />
          <StatCard label="Closed Deals" value={stats.closed} color="text-emerald-400" />
          <StatCard label="Active Listings" value={stats.activeProps} color="text-orange-400" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-stone-900 border border-stone-800 rounded-xl p-1 w-fit mb-5">
          <TabBtn active={tab === 'leads'} onClick={() => setTab('leads')}>Leads ({stats.total})</TabBtn>
          <TabBtn active={tab === 'properties'} onClick={() => setTab('properties')}>Properties ({properties.length})</TabBtn>
          <TabBtn active={tab === 'chat'} onClick={() => { setTab('chat'); setNewMessageAlert(0); }}>
            Live Chat {newMessageAlert > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5">{newMessageAlert}</span>}
          </TabBtn>
          <TabBtn active={tab === 'survey'} onClick={() => setTab('survey')}>Market Survey ({surveyResponses.length})</TabBtn>
        </div>

        {/* LEADS TAB */}
        {tab === 'leads' && (
          <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-800 bg-stone-950/40">
                  <th className="p-3.5">Name</th><th className="p-3.5">Phone</th><th className="p-3.5">Area</th>
                  <th className="p-3.5">Budget</th><th className="p-3.5">Source</th><th className="p-3.5">Status</th>
                  <th className="p-3.5">Date</th><th className="p-3.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-stone-800/50 hover:bg-stone-850/50">
                    <td className="p-3.5 font-medium">{l.name}</td>
                    <td className="p-3.5">{l.phone}</td>
                    <td className="p-3.5 text-stone-400">{l.area || '—'}</td>
                    <td className="p-3.5 text-orange-400">{l.budget || '—'}</td>
                    <td className="p-3.5"><span className="text-[10px] bg-stone-800 px-2 py-0.5 rounded text-stone-400">{l.source}</span></td>
                    <td className="p-3.5">
                      <select value={l.status} onChange={(e) => updateLeadStatus(l.id, e.target.value)} className="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs">
                        <option value="hot">Hot</option>
                        <option value="warm">Warm</option>
                        <option value="cold">Cold</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-stone-500 text-xs">{new Date(l.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="p-3.5">
                      <div className="flex gap-1.5">
                        <a href={'https://wa.me/91' + l.phone.replace(/\D/g, '').slice(-10)} target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 rounded px-2 py-1">WA</a>
                        <button onClick={() => deleteLead(l.id)} className="text-xs bg-red-950/40 text-red-400 border border-red-900/40 rounded px-2 py-1">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leads.length === 0 && <div className="p-10 text-center text-stone-500 text-sm">No leads yet.</div>}
          </div>
        )}

        {/* PROPERTIES TAB */}
        {tab === 'properties' && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <Link href="/admin/properties/new" className="inline-block bg-orange-500 text-stone-950 rounded-lg px-4 py-2 text-sm font-bold hover:bg-orange-400 transition-colors">
                + Add Property
              </Link>
              <div className="flex gap-2">
                {['all', 'active', 'sold', 'rented', 'inactive'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPropStatusFilter(s)}
                    className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ' + (
                      propStatusFilter === s
                        ? 'bg-orange-500 text-stone-950 border-orange-500'
                        : 'border-stone-800 text-stone-400 hover:border-stone-600'
                    )}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    {s !== 'all' && <span className="ml-1.5 opacity-60">({properties.filter((p) => p.status === s).length})</span>}
                    {s === 'all' && <span className="ml-1.5 opacity-60">({properties.length})</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-800 bg-stone-950/40">
                    <th className="p-3.5">Property</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((p) => (
                    <tr key={p.id} className="border-b border-stone-800/50 hover:bg-stone-850/50">
                      <td className="p-3.5">
                        <div className="font-medium text-sm">{p.title}</div>
                        <div className="text-xs text-stone-500">📍 {p.area}</div>
                      </td>
                      <td className="p-3.5 text-orange-400 font-semibold">₹{p.price}</td>
                      <td className="p-3.5">
                        <span className="text-[10px] bg-stone-800 px-2 py-0.5 rounded text-stone-400 uppercase">{p.listing_type}</span>
                      </td>
                      <td className="p-3.5">
                        <select
                          value={p.status}
                          onChange={(e) => updatePropertyStatus(p.id, e.target.value)}
                          className={'text-xs rounded px-2 py-1.5 border font-semibold bg-transparent ' + (STATUS_COLORS[p.status] || 'text-stone-400')}
                        >
                          <option value="active">Active</option>
                          <option value="sold">Sold</option>
                          <option value="rented">Rented</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => deleteProperty(p.id, p.title)}
                          className="text-xs bg-red-950/40 text-red-400 border border-red-900/40 rounded px-3 py-1.5 hover:bg-red-900/40 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProperties.length === 0 && (
                <div className="p-10 text-center text-stone-500 text-sm">
                  {propStatusFilter === 'all' ? 'No properties yet.' : 'No ' + propStatusFilter + ' properties.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {tab === 'chat' && <ChatInbox conversations={conversations} onRefresh={loadConversations} />}

        {/* SURVEY TAB */}
        {tab === 'survey' && (
          <SurveyResponses responses={surveyResponses} typeFilter={surveyTypeFilter} setTypeFilter={setSurveyTypeFilter} />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-stone-100' }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
      <div className="text-[11px] uppercase tracking-wide text-stone-500">{label}</div>
      <div className={'font-serif text-2xl font-bold mt-1 ' + color}>{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={'px-4 py-2 rounded-lg text-sm font-medium transition-colors ' + (active ? 'bg-orange-500 text-stone-950' : 'text-stone-400 hover:text-stone-100')}>
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
      <span className="text-stone-300">{value === null || value === undefined || value === '' ? '—' : value}</span>
    </div>
  );
}

function SurveyResponses({
  responses,
  typeFilter,
  setTypeFilter,
}: {
  responses: SurveyResponse[];
  typeFilter: 'all' | 'owner' | 'renter';
  setTypeFilter: (v: 'all' | 'owner' | 'renter') => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = typeFilter === 'all' ? responses : responses.filter((r) => r.user_type === typeFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2">
          {(['all', 'owner', 'renter'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ' + (
                typeFilter === t
                  ? 'bg-orange-500 text-stone-950 border-orange-500'
                  : 'border-stone-800 text-stone-400 hover:border-stone-600'
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
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-800 text-stone-300 hover:border-orange-400 hover:text-orange-400 transition-colors disabled:opacity-40 disabled:hover:border-stone-800 disabled:hover:text-stone-300"
        >
          Export CSV ({filtered.length})
        </button>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-800 bg-stone-950/40">
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Area / Locality</th>
              <th className="p-3.5">Property</th>
              <th className="p-3.5">Value / Rent</th>
              <th className="p-3.5">Contact</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <Fragment key={r.id}>
                <tr className="border-b border-stone-800/50 hover:bg-stone-850/50">
                  <td className="p-3.5">
                    <span className={'text-[10px] px-2 py-0.5 rounded uppercase font-semibold ' + (
                      r.user_type === 'owner' ? 'bg-blue-950/40 text-blue-400 border border-blue-900/40' : 'bg-purple-950/40 text-purple-400 border border-purple-900/40'
                    )}>
                      {r.user_type}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-medium">{r.area || '—'}</div>
                    <div className="text-xs text-stone-500">{r.locality || ''}</div>
                  </td>
                  <td className="p-3.5 text-stone-400">{[r.property_type, r.bhk].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="p-3.5 text-orange-400">
                    {r.user_type === 'owner'
                      ? (r.current_value_exact ? '₹' + r.current_value_exact.toLocaleString('en-IN') : r.current_value_range || '—')
                      : (r.rent_amount_exact ? '₹' + r.rent_amount_exact.toLocaleString('en-IN') + '/mo' : r.rent_amount_range || '—')}
                  </td>
                  <td className="p-3.5">
                    {r.willing_to_contact && r.phone ? (
                      <a href={'https://wa.me/91' + r.phone.replace(/\D/g, '').slice(-10)} target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 rounded px-2 py-1">
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
                      className="text-xs text-stone-400 hover:text-orange-400"
                    >
                      {expanded === r.id ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr className="border-b border-stone-800/50 bg-stone-950/40">
                    <td colSpan={7} className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5 text-xs">

                        <div>
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Contact</div>
                          <div className="space-y-1.5">
                            <DetailRow label="Name" value={r.name} />
                            <DetailRow label="Phone" value={r.phone} />
                            <DetailRow label="Willing to contact" value={r.willing_to_contact ? 'Yes' : 'No'} />
                          </div>
                        </div>

                        <div>
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Property Details</div>
                          <div className="space-y-1.5">
                            <DetailRow label="Floor" value={r.floor} />
                            <DetailRow label="Building age" value={r.building_age} />
                            <DetailRow label="Society name" value={r.society_name} />
                          </div>
                        </div>

                        {r.user_type === 'owner' ? (
                          <div>
                            <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Purchase & Pricing</div>
                            <div className="space-y-1.5">
                              <DetailRow label="Purchase year" value={r.purchase_year} />
                              <DetailRow label="Purchase price" value={r.purchase_price_exact ? '₹' + r.purchase_price_exact.toLocaleString('en-IN') : r.purchase_price_range} />
                              <DetailRow label="Price per sqft" value={r.purchase_price_per_sqft} />
                              <DetailRow label="Appreciation feel" value={r.appreciation_feel} />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Rent & Deposit</div>
                            <div className="space-y-1.5">
                              <DetailRow label="Deposit" value={r.deposit_exact ? '₹' + r.deposit_exact.toLocaleString('en-IN') : r.deposit_range} />
                              <DetailRow label="Years renting" value={r.years_renting} />
                              <DetailRow label="Rent increased last year" value={r.rent_increase_last_year} />
                              <DetailRow label="Increase amount" value={r.rent_increase_amount} />
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Infrastructure</div>
                          <div className="space-y-1.5">
                            <DetailRow label="Water supply" value={r.infra_water} />
                            <DetailRow label="Road width" value={r.infra_road_width} />
                            <DetailRow label="Road condition" value={r.infra_road_condition} />
                            <DetailRow label="Power cuts" value={r.infra_power} />
                            <DetailRow label="Drainage" value={r.infra_drainage} />
                            <DetailRow label="Garbage collection" value={r.infra_garbage} />
                          </div>
                        </div>

                        <div>
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Developments</div>
                          <div className="space-y-1.5">
                            <DetailRow label="Nearby developments" value={r.nearby_developments} />
                            <DetailRow label="Metro connectivity" value={r.metro_connectivity} />
                            <DetailRow label="New projects nearby" value={r.new_projects_nearby} />
                            <DetailRow label="Price impact" value={r.price_impact} />
                          </div>
                        </div>

                        <div>
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Builder & Society</div>
                          <div className="space-y-1.5">
                            <DetailRow label="Builder name" value={r.builder_name} />
                            <DetailRow label="Builder rating" value={r.builder_rating} />
                            <DetailRow label="Maintenance charges" value={r.maintenance_charges} />
                            <DetailRow label="OC status" value={r.oc_status} />
                            <DetailRow label="Society quality" value={r.society_quality} />
                          </div>
                        </div>

                        <div className="md:col-span-3">
                          <div className="text-orange-400 font-semibold uppercase tracking-wide mb-2 text-[10px]">Their View</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-1.5">
                            <DetailRow label="Would recommend area" value={r.would_recommend} />
                            <DetailRow label="Best about area" value={r.best_about_area} />
                            <DetailRow label="Worst about area" value={r.worst_about_area} />
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
        {filtered.length === 0 && (
          <div className="p-10 text-center text-stone-500 text-sm">
            {typeFilter === 'all' ? 'No survey responses yet.' : 'No ' + typeFilter + ' responses yet.'}
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
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden" style={{ height: 520 }}>
      <div className="border-r border-stone-800 overflow-y-auto">
        {conversations.map((c) => (
          <button key={c.id} onClick={() => setActiveConvo(c.id)} className={'w-full text-left p-3.5 border-b border-stone-800/50 hover:bg-stone-800/50 ' + (activeConvo === c.id ? 'bg-stone-800/50' : '')}>
            <div className="font-medium text-sm">{c.visitor_name}</div>
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
                <div key={m.id} className={'max-w-[75%] px-3 py-2 rounded-xl text-sm ' + (m.sender === 'admin' ? 'bg-orange-500 text-stone-950 self-end' : 'bg-stone-800 self-start')}>
                  {m.message}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-stone-800 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Reply to visitor..." className="flex-1 bg-stone-950 border border-stone-800 rounded-full px-4 py-2 text-sm outline-none focus:border-orange-400" />
              <button onClick={send} className="bg-orange-500 text-stone-950 rounded-full w-9 h-9 flex items-center justify-center font-bold">Send</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-500 text-sm">Select a conversation</div>
        )}
      </div>
    </div>
  );
}
