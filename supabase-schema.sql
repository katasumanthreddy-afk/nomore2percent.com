-- ════════════════════════════════════════
-- nomore2percent — SUPABASE DATABASE SCHEMA
-- ════════════════════════════════════════
-- Run this in Supabase → SQL Editor → New Query → paste & run

-- Leads table
create table if not exists leads (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  email text,
  area text,
  budget text,
  property_type text,
  message text,
  status text default 'warm' check (status in ('hot','warm','cold','closed')),
  source text default 'website',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Properties table
create table if not exists properties (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  price text not null,
  price_num bigint,
  price_per_sqft text,
  area text not null,
  address text,
  property_type text default 'apartment' check (property_type in ('apartment','villa','plot','commercial')),
  listing_type text default 'sale' check (listing_type in ('sale','rent')),
  bedrooms int default 0,
  bathrooms int default 0,
  sqft int default 0,
  floor text,
  parking int default 0,
  year_built text,
  rera_number text,
  amenities text[],
  status text default 'active' check (status in ('active','sold','rented','inactive')),
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Property images
create table if not exists property_images (
  id bigint generated always as identity primary key,
  property_id bigint references properties(id) on delete cascade,
  storage_path text not null,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- Chat conversations (one per visitor session)
create table if not exists chat_conversations (
  id bigint generated always as identity primary key,
  visitor_name text,
  visitor_phone text,
  status text default 'open' check (status in ('open','closed')),
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Chat messages
create table if not exists chat_messages (
  id bigint generated always as identity primary key,
  conversation_id bigint references chat_conversations(id) on delete cascade,
  sender text not null check (sender in ('visitor','admin')),
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Admin users (simple table; auth handled via Supabase Auth in practice)
create table if not exists admin_users (
  id bigint generated always as identity primary key,
  username text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_created on leads(created_at desc);
create index if not exists idx_properties_status on properties(status);
create index if not exists idx_properties_area on properties(area);
create index if not exists idx_chat_messages_conversation on chat_messages(conversation_id);

-- Enable Row Level Security (RLS) — required by Supabase for client-side access
alter table leads enable row level security;
alter table properties enable row level security;
alter table property_images enable row level security;
alter table chat_conversations enable row level security;
alter table chat_messages enable row level security;

-- Public can READ active properties + their images (for the marketplace)
create policy "Public can view active properties" on properties
  for select using (status = 'active');

create policy "Public can view property images" on property_images
  for select using (true);

-- Public can INSERT leads (lead capture form) but not read others' leads
create policy "Public can insert leads" on leads
  for insert with check (true);

-- Public can create chat conversations and insert their own messages
create policy "Public can create conversations" on chat_conversations
  for insert with check (true);

create policy "Public can view their conversation" on chat_conversations
  for select using (true);

create policy "Public can insert chat messages" on chat_messages
  for insert with check (true);

create policy "Public can view chat messages" on chat_messages
  for select using (true);

-- NOTE: Admin-only operations (viewing all leads, editing properties, etc.)
-- are done via the Next.js API routes using the SERVICE ROLE key (server-side only),
-- which bypasses RLS. The anon/public key used in the browser only gets what
-- the policies above allow.

-- Sample data
insert into properties (title, description, price, price_num, price_per_sqft, area, address, property_type, listing_type, bedrooms, bathrooms, sqft, floor, parking, year_built, rera_number, amenities, status, featured)
values (
  'Prestige Skyline Tower 3BHK',
  'Premium 3BHK apartment in Gachibowli with stunning views of the Financial District.',
  '1.35 Cr', 13500000, '7,297', 'Gachibowli',
  'Plot 42, Financial District, Gachibowli, Hyderabad 500032',
  'apartment', 'sale', 3, 3, 1850, '14th', 2, '2022',
  'P02400012345',
  array['Swimming Pool','Gym','Landscaped Garden','24/7 Security','Covered Parking','Power Backup'],
  'active', true
);
