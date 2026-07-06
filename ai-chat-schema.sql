-- ════════════════════════════════════════
-- AI VISITOR CHAT ASSISTANT — SCHEMA UPDATE
-- ════════════════════════════════════════
-- Run this in Supabase → SQL Editor → New Query → Run
-- Extends the existing chat tables to support an AI-first assistant
-- that hands off to Sumanth on request.

-- Allow 'ai' as a message sender alongside the existing 'visitor' / 'admin'
alter table chat_messages drop constraint if exists chat_messages_sender_check;
alter table chat_messages add constraint chat_messages_sender_check
  check (sender in ('visitor', 'admin', 'ai'));

-- Track whether a conversation is currently being handled by the AI or has
-- been handed off to a real person, plus whether a handoff was requested.
alter table chat_conversations add column if not exists mode text default 'ai' check (mode in ('ai', 'human'));
alter table chat_conversations add column if not exists handoff_requested boolean default false;

create index if not exists idx_chat_conversations_mode on chat_conversations(mode);
