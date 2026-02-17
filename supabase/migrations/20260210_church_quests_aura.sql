-- Church quest runs + AURA profiles (service_role only via Card Gate)

-- Table: church_quest_runs
create table if not exists public.church_quest_runs (
  id uuid primary key default gen_random_uuid(),
  card_id text not null,
  quest_id text not null,
  started_at timestamptz not null,
  expires_at timestamptz not null,
  completed_at timestamptz,
  state text not null default 'running' check (state in ('running', 'completed', 'expired')),
  answers jsonb not null default '{}',
  score int,
  earned_seal boolean default false
);

create index if not exists idx_church_quest_runs_card on public.church_quest_runs(card_id, started_at desc);
create index if not exists idx_church_quest_runs_quest on public.church_quest_runs(quest_id, card_id);

-- Table: aura_profiles
create table if not exists public.aura_profiles (
  card_id text primary key,
  aura_level int not null default 0,
  aura_points int not null default 0,
  status text not null default 'Quiet' check (status in ('Quiet', 'Marcheur', 'Lecteur de signes', 'Habitant du seuil', 'Gardien discret')),
  last_quest_at timestamptz,
  seals jsonb not null default '[]'
);

-- RLS: service_role only
alter table public.church_quest_runs enable row level security;
alter table public.aura_profiles enable row level security;

drop policy if exists "service_role_all_church_quest_runs" on public.church_quest_runs;
drop policy if exists "service_role_all_aura_profiles" on public.aura_profiles;

create policy "service_role_all_church_quest_runs"
on public.church_quest_runs for all to service_role using (true) with check (true);

create policy "service_role_all_aura_profiles"
on public.aura_profiles for all to service_role using (true) with check (true);
