-- 009_mirror_kept.sql
-- Purpose: Tables for Miroir daily sentences and kept sentences
-- Access: service_role only (via Card Gate)

-- Table: mirror_daily
-- Stores daily sentence selection per card (one per day, Paris timezone)
create table if not exists public.mirror_daily (
  id uuid primary key default uuid_generate_v4(),
  card_id text not null,
  date_paris text not null, -- Format: "YYYY-MM-DD" (Paris date)
  sentence text not null,
  anecdote text, -- Historical anecdote from histoire-quotidienne.ts (optional)
  created_at timestamp with time zone default now(),
  unique(card_id, date_paris)
);

create index if not exists idx_mirror_daily_card_date on public.mirror_daily(card_id, date_paris desc);

-- Table: kept_sentences
-- Stores sentences saved by user (from mirror_daily)
create table if not exists public.kept_sentences (
  id uuid primary key default uuid_generate_v4(),
  card_id text not null,
  sentence text not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_kept_sentences_card on public.kept_sentences(card_id, created_at desc);

-- RLS: service_role only (no anon/auth access)
alter table public.mirror_daily enable row level security;
alter table public.kept_sentences enable row level security;

drop policy if exists "service_role_all_mirror_daily" on public.mirror_daily;
drop policy if exists "service_role_all_kept_sentences" on public.kept_sentences;

create policy "service_role_all_mirror_daily"
on public.mirror_daily
for all
to service_role
using (true)
with check (true);

create policy "service_role_all_kept_sentences"
on public.kept_sentences
for all
to service_role
using (true)
with check (true);
