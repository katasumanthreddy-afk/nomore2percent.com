'use client';

import { useEffect, useState, useCallback } from 'react';
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

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'leads' | 'properties' | 'chat'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Prop[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessageAlert, setNewMessageAlert] = useState(0);

  const loadLeads = useCallback(() => {
    fetch('/api/leads').then((r) => r.json()).then((d) => d.success && setLeads(d.leads));
  }, []);
  const loadProperties = useCallback(() => {
    fetch('/api/properties').then((r) => r.json()).then((d) => d.success && setProperties(d.properties));
  }, []);
  const loadConversations = useCallback(() => {
    fetch('/api/chat/conversations').then((r) => r.json()).then((d) => d.success && setConversations(d.conversations));
  }, []);

  useEffect(() => {
    loadLeads();
    loadProperties();
    loadConversations();
  }, [loadLeads, loadProperties, loadConversations]);

  // Subscribe to the global admin inbox channel — fires whenever ANY visitor
  // sends a new message, anywhere on the site, in real-time.
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe('admin-inbox');
    channel.bind('new-lead-message', () => {
      setNewMessageAlert((n) => n + 1);
      loadConversations();
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe('admin-inbox');
    };
  }, [loadConversations]);

  const updateLeadStatus = async (id: number, status: string) => {
    await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    loadLeads();
  };
  const deleteLead = async (id: number) => {
    if (!confirm('Delete this lead?')) return;
    await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    loadLeads();
  };
  const logout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const stats = {
    total: leads.length,
    hot: leads.filter((l) => l.status === 'hot').length,
    closed: leads.filter((l) => l.status === 'closed').length,
    activeProps: properties.filter((p) => p.status === 'active').length,
  };

  return (
    <div className="flex-1 bg-stone-950 text-stone-100 min-h-screen">
      {/* Topbar */}
      <div className="bg-stone-900 border-b border-stone-800 h-15 px-7 flex items-center justify-between sticky top-0 z-10">
        <div className="font-bold flex items-center gap-2">nomore<span className="text-orange-400">2%</span> <span className="text-xs text-stone-500 font-normal">Admin</span></div>
        <div className="flex items-center gap-2.5 text-sm text-stone-400">
          <Link href="/" className="border border-stone-800 rounded-lg px-3 py-1.5 text-xs hover:border-orange-400 hover:text-orange-400 transition-colors">🏠 View Marketplace</Link>
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
          <TabBtn active={tab === 'leads'} onClick={() => setTab('leads')}>👥 Leads ({stats.total})</TabBtn>
          <TabBtn active={tab === 'properties'} onClick={() => setTab('properties')}>🏢 Properties ({properties.length})</TabBtn>
          <TabBtn active={tab === 'chat'} onClick={() => { setTab('chat'); setNewMessageAlert(0); }}>
            💬 Live Chat {newMessageAlert > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5">{newMessageAlert}</span>}
          </TabBtn>
        </div>

        {tab === 'leads' && (
          <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-850 text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-800">
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
                        <option value="hot">🔥 Hot</option><option value="warm">🌤 Warm</option>
                        <option value="cold">❄️ Cold</option><option value="closed">✅ Closed</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-stone-500 text-xs">{new Date(l.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="p-3.5">
                      <div className="flex gap-1.5">
                        <a href={`https://wa.me/91${l.phone.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 rounded px-2 py-1">💬</a>
                        <button onClick={() => deleteLead(l.id)} className="text-xs bg-red-950/40 text-red-400 border border-red-900/40 rounded px-2 py-1">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leads.length === 0 && <div className="p-10 text-center text-stone-500 text-sm">No leads yet.</div>}
          </div>
        )}

        {tab === 'properties' && (
          <div>
            <Link href="/admin/properties/new" className="inline-block mb-4 bg-orange-500 text-stone-950 rounded-lg px-4 py-2 text-sm font-bold hover:bg-orange-400 transition-colors">+ Add Property</Link>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {properties.map((p) => (
                <div key={p.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] bg-orange-950/40 text-orange-400 rounded px-2 py-0.5">{p.listing_type.toUpperCase()}</span>
                    <span className="text-[10px] bg-emerald-950/40 text-emerald-400 rounded px-2 py-0.5">{p.status}</span>
                  </div>
                  <div className="font-semibold text-sm">{p.title}</div>
                  <div className="text-xs text-stone-500 mb-2">📍 {p.area}</div>
                  <div className="text-orange-400 font-bold">₹{p.price}</div>
                </div>
              ))}
            </div>
            {properties.length === 0 && <div className="p-10 text-center text-stone-500 text-sm">No properties yet.</div>}
          </div>
        )}

        {tab === 'chat' && <ChatInbox conversations={conversations} onRefresh={loadConversations} />}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-stone-100' }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
      <div className="text-[11px] uppercase tracking-wide text-stone-500">{label}</div>
      <div className={`font-serif text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-orange-500 text-stone-950' : 'text-stone-400 hover:text-stone-100'}`}>
      {children}
    </button>
  );
}

function ChatInbox({ conversations, onRefresh }: { conversations: Conversation[]; onRefresh: () => void }) {
  const [activeConvo, setActiveConvo] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!activeConvo) return;
    fetch(`/api/chat/messages/${activeConvo}`).then((r) => r.json()).then((d) => d.success && setMessages(d.messages));

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`chat-${activeConvo}`);
    channel.bind('new-message', (msg: any) => setMessages((prev) => [...prev, msg]));
    return () => { channel.unbind_all(); pusher.unsubscribe(`chat-${activeConvo}`); };
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
          <button key={c.id} onClick={() => setActiveConvo(c.id)} className={`w-full text-left p-3.5 border-b border-stone-800/50 hover:bg-stone-850 ${activeConvo === c.id ? 'bg-stone-850' : ''}`}>
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
                <div key={m.id} className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${m.sender === 'admin' ? 'bg-orange-500 text-stone-950 self-end' : 'bg-stone-800 self-start'}`}>
                  {m.message}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-stone-800 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Reply to visitor..." className="flex-1 bg-stone-950 border border-stone-800 rounded-full px-4 py-2 text-sm outline-none focus:border-orange-400" />
              <button onClick={send} className="bg-orange-500 text-stone-950 rounded-full w-9 h-9 flex items-center justify-center font-bold">→</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-500 text-sm">Select a conversation</div>
        )}
      </div>
    </div>
  );
}
