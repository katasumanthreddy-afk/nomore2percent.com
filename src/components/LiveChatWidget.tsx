'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { MessageCircle, X, Send, UserRound } from 'lucide-react';
import { getPusherClient } from '@/lib/pusher-client';

interface PropertyResult {
  id: number; title: string; area: string; price: string; bedrooms: number;
  listing_type: string; url: string; image: string | null;
}
interface ChatMessage {
  id: number;
  conversation_id: number;
  sender: 'visitor' | 'admin' | 'ai';
  message: string;
  created_at: string;
  properties?: PropertyResult[];
}

const STORAGE_KEY = 'n2p_chat_conversation_id';

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [mode, setMode] = useState<'ai' | 'human'>('ai');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [hasUnread, setHasUnread] = useState(false);
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Restore an existing conversation from this browser session
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const id = parseInt(saved, 10);
      setConversationId(id);
      fetchHistory(id);
    }
  }, []);

  // Subscribe to real-time updates for this conversation (covers both the AI's
  // broadcast replies and Sumanth's messages once handed off to human mode)
  useEffect(() => {
    if (!conversationId) return;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`chat-${conversationId}`);

    channel.bind('new-message', (msg: ChatMessage) => {
      // Visitor and AI messages are already shown optimistically from this same
      // client's own API calls — only admin replies genuinely originate elsewhere.
      if (msg.sender !== 'admin') return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      if (!isOpen) setHasUnread(true);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`chat-${conversationId}`);
    };
  }, [conversationId, isOpen]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const fetchHistory = async (id: number) => {
    const res = await fetch(`/api/chat/messages/${id}`);
    const data = await res.json();
    if (data.success) {
      setMessages(data.messages);
      setMode(data.mode === 'human' ? 'human' : 'ai');
    }
  };

  const ensureConversation = useCallback(async (): Promise<number> => {
    if (conversationId) return conversationId;
    const res = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    const id = data.conversation.id;
    setConversationId(id);
    localStorage.setItem(STORAGE_KEY, String(id));
    return id;
  }, [conversationId]);

  const openWidget = async () => {
    setIsOpen(true);
    setHasUnread(false);
    if (!conversationId) {
      const id = await ensureConversation();
      // Greet immediately so the widget doesn't feel empty on first open
      setMessages([{
        id: -1, conversation_id: id, sender: 'ai',
        message: "Hi! I'm the nomore2percent assistant. Looking to buy, sell, or rent in Hyderabad? Tell me what you're after and I'll find real listings — or ask for Sumanth anytime.",
        created_at: new Date().toISOString(),
      }]);
    }
  };

  const toggleOpen = () => {
    if (!isOpen) openWidget();
    else setIsOpen(false);
  };

  const sendAI = async (text: string, id: number) => {
    setThinking(true);
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: id, message: text }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(), conversation_id: id, sender: 'ai',
            message: data.reply, created_at: new Date().toISOString(),
            properties: data.properties?.length ? data.properties : undefined,
          },
        ]);
        if (data.handoff) setMode('human');
      }
    } finally {
      setThinking(false);
    }
  };

  const sendHuman = async (text: string, id: number) => {
    await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: id, sender: 'visitor', message: text }),
    });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    const id = await ensureConversation();

    // Show the visitor's own message immediately for a snappy feel
    setMessages((prev) => [...prev, {
      id: Date.now() - 1, conversation_id: id, sender: 'visitor', message: text, created_at: new Date().toISOString(),
    }]);

    if (mode === 'human') {
      await sendHuman(text, id);
    } else {
      await sendAI(text, id);
    }
  };

  const requestHuman = async () => {
    const id = await ensureConversation();
    setMode('human');
    setMessages((prev) => [...prev, {
      id: Date.now(), conversation_id: id, sender: 'ai',
      message: "Sure — I've let Sumanth know. He usually replies within a few minutes. Feel free to keep typing here.",
      created_at: new Date().toISOString(),
    }]);
    await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: id, message: '[Visitor requested to speak with a human]' }),
    }).catch(() => {});
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Open chat"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] h-[540px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center font-bold">
              {mode === 'human' ? 'S' : 'AI'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{mode === 'human' ? 'Chat with Sumanth' : 'nomore2percent Assistant'}</div>
              <div className="text-xs text-stone-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {mode === 'human' ? 'Usually replies in minutes' : 'AI-powered · Ask me anything'}
              </div>
            </div>
            {mode === 'ai' && (
              <button
                onClick={requestHuman}
                title="Talk to Sumanth"
                className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <UserRound size={15} />
              </button>
            )}
          </div>

          <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-stone-50">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col gap-2 ${m.sender === 'visitor' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                    m.sender === 'visitor'
                      ? 'bg-orange-500 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {m.message}
                </div>
                {m.properties && m.properties.length > 0 && (
                  <div className="flex flex-col gap-2 w-[85%]">
                    {m.properties.map((p) => (
                      <Link
                        key={p.id}
                        href={p.url}
                        className="flex gap-2.5 bg-white border border-gray-200 rounded-xl p-2 hover:border-orange-300 transition-colors"
                      >
                        <div className="w-14 h-14 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-xl">
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                          ) : '🏠'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-gray-800 truncate">{p.title}</div>
                          <div className="text-[11px] text-gray-500">{p.area} · {p.bedrooms} BHK</div>
                          <div className="text-xs font-bold text-orange-500">₹{p.price}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {thinking && (
              <div className="self-start bg-white border border-gray-200 rounded-xl rounded-bl-sm px-3 py-2 text-sm text-gray-400">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                </span>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-100 flex items-center gap-2">
            <input
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-orange-400"
              placeholder={mode === 'human' ? 'Type a message...' : 'Ask about properties, areas, pricing...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-400 transition-colors flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
