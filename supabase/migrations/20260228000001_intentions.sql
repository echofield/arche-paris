-- ARCHÉ — Intentions table (missions / campaigns / strategic objectives)
-- Used to group leads under a specific mission context (e.g., arche-paris-q1)

create table if not exists public.intentions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text,
  status text not null default 'active',
  start_date date,
  end_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.intentions'::regclass and conname = 'intentions_status_check') then
    alter table public.intentions add constraint intentions_status_check check (status in ('draft', 'active', 'completed', 'archived'));
  end if;
end $$;

create index if not exists intentions_key_idx on public.intentions(key);
create index if not exists intentions_status_idx on public.intentions(status);

-- Seed the arche-paris-q1 intention
insert into public.intentions (key, name, description, status)
values ('arche-paris-q1', 'ARCHÉ Paris Q1 2026', 'Constellation activation - Paris cultural creators network', 'active')
on conflict (key) do nothing;

comment on table public.intentions is 'Strategic intentions/missions. Leads can be grouped under an intention via intention_id FK.';
