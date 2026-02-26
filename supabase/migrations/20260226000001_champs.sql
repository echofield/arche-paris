-- ARCHÉ — Champs (Creator Engine / conducteur de champ)
-- Design: status draft|live|archived, visibility private|unlisted|public,
-- timezone-safe active window (active_start_minute, active_end_minute 0–1439),
-- layers JSONB with fixed keys (trace, alignment, ritual, echo, threshold) 0..1.
-- Owner: created_by TEXT (card_id). RLS enforced in card-gate API (service_role).

create table if not exists public.champs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  layers jsonb not null,
  tone text not null default 'whisper',
  active_start_minute int not null default 1050,
  active_end_minute int not null default 1380,
  timezone text not null default 'Europe/Paris',
  zone jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  visibility text not null default 'private',
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.champs'::regclass and conname = 'champs_layers_keys_check') then
    alter table public.champs add constraint champs_layers_keys_check
    check (layers ? 'trace' and layers ? 'alignment' and layers ? 'ritual' and layers ? 'echo' and layers ? 'threshold');
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.champs'::regclass and conname = 'champs_status_check') then
    alter table public.champs add constraint champs_status_check check (status in ('draft', 'live', 'archived'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.champs'::regclass and conname = 'champs_visibility_check') then
    alter table public.champs add constraint champs_visibility_check check (visibility in ('private', 'unlisted', 'public'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.champs'::regclass and conname = 'champs_active_minutes_check') then
    alter table public.champs add constraint champs_active_minutes_check
    check (active_start_minute >= 0 and active_start_minute <= 1439 and active_end_minute >= 0 and active_end_minute <= 1439);
  end if;
end $$;

create index if not exists champs_created_by_idx on public.champs(created_by);
create index if not exists champs_status_idx on public.champs(status);
create index if not exists champs_visibility_idx on public.champs(visibility);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_champs_updated_at on public.champs;
create trigger trg_champs_updated_at
before update on public.champs
for each row execute function public.set_updated_at();

-- Default active champ per card (session can override in client)
create table if not exists public.card_default_champ (
  card_id text primary key,
  champ_id uuid not null references public.champs(id) on delete cascade,
  updated_at timestamptz not null default now()
);

comment on table public.champs is 'Creator Engine champs: layer weights, time window, zone, status, visibility. Owner = created_by (card_id).';
comment on table public.card_default_champ is 'Per-card default active champ; card-gate enforces ownership.';
