-- ════════════════════════════════════════
-- LIST YOUR PROPERTY — MAP SUPPORT
-- ════════════════════════════════════════
-- Run this in Supabase → SQL Editor → New Query → Run

alter table property_submissions add column if not exists lat numeric;
alter table property_submissions add column if not exists lng numeric;

NOTIFY pgrst, 'reload schema';
