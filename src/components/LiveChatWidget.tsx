'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { getPusherClient } from '@/lib/pusher-client';

interface ChatMessage {
  id: number;
  conversation_id: number;
  sender: 'visitor' | 'admin';
  message: string;
  created_at: string;
}

const STORAGE_KEY = 'n2p_chat_conversation_id';

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [hasUnread, setHasUnread] = useState(false);
  const [needsName, setNeedsName] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);

  // Restore existing conversation from this browser session
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const id = parseInt(saved, 10);
      setConversationId(id);
      setNeedsName(false);
      fetchHistory(id);
    }
  }, []);

  // Subscribe to real-time updates for this conversation once it exists
  useEffect(() => {
    if (!conversationId) return;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`chat-${conversationId}`);

    channel.bind('new-message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.sender === 'admin' && !isOpen) setHasUnread(true);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`chat-${conversationId}`);
    };
  }, [conversationId, isOpen]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const fetchHistory = async (id: number) => {
    const res = await fetch(`/api/chat/messages/${id}`);
    const data = await res.json();
    if (data.success) setMessages(data.messages);
  };

  const startConversation = useCallback(async () => {
    if (!name.trim()) return;
    const res = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_name: name, visitor_phone: phone }),
    });
    const data = await res.json();
    if (data.success) {
      setConversationId(data.conversation.id);
      localStorage.setItem(STORAGE_KEY, String(data.conversation.id));
      setNeedsName(false);
    }
  }, [name, phone]);

  const sendMessage = async () => {
    if (!input.trim() || !conversationId) return;
    const text = input.trim();
    setInput('');
    await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: conversationId, sender: 'visitor', message: text }),
    });
  };

  const toggleOpen = () => {
    setIsOpen((v) => !v);
    setHasUnread(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Open chat"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center font-bold">S</div>
            <div>
              <div className="font-semibold text-sm">Chat with Sumanth</div>
              <div className="text-xs text-stone-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Usually replies in minutes
              </div>
            </div>
          </div>

          {needsName ? (
            <div className="flex-1 flex flex-col gap-3 p-5 justify-center">
              <p className="text-sm text-gray-600 mb-1">Start a conversation — what's your name?</p>
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button
                onClick={startConversation}
                className="bg-orange-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                Start Chat
              </button>
            </div>
          ) : (
            <>
              <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-stone-50">
                {messages.length === 0 && (
                  <div className="text-center text-xs text-gray-400 mt-8">
                    👋 Send a message and Sumanth will reply here in real-time.
                  </div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      m.sender === 'visitor'
                        ? 'bg-orange-500 text-white self-end rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 self-start rounded-bl-sm'
                    }`}
                  >
                    {m.message}
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-100 flex items-center gap-2">
                <input
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-orange-400"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
