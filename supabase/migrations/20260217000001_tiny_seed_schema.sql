create extension if not exists pgcrypto;

-- =========================
-- Canonical event vocabulary
-- =========================
-- zone_entered, zone_revealed, zone_awakened,
-- ritual_started, ritual_completed, ritual_aborted, ritual_shortcut,
-- engraving_created, path_recorded,
-- challenge_created, challenge_attempt_started, challenge_attempt_completed, challenge_attempt_aborted,
-- custody_claimed, custody_lost

-- =========================
-- CORE: append-only truth
-- =========================
create table if not exists public.arche_events (
  event_id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_type text not null,
  zone_id text null,
  place_id text null,
  ts timestamptz not null default now(), -- server time only
  lat double precision null,
  lng double precision null,
  accuracy_m double precision null,
  dwell_ms integer null,
  payload jsonb not null default '{}'::jsonb, -- payload.client_ts goes here
  idempotency_key text not null,
  request_id text not null,
  created_at timestamptz not null default now(),
  check (event_type <> ''),
  check (dwell_ms is null or dwell_ms >= 0),
  check (accuracy_m is null or accuracy_m >= 0),
  unique (user_id, idempotency_key)
);

create index if not exists idx_arche_events_user_ts on public.arche_events(user_id, ts desc);
create index if not exists idx_arche_events_type_ts on public.arche_events(event_type, ts desc);
create index if not exists idx_arche_events_zone_ts on public.arche_events(zone_id, ts desc);

-- =========================
-- Rate limiting (server-side)
-- =========================
create table if not exists public.arche_rate_limits (
  rl_key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);

create or replace function public.consume_arche_rate_limit(
  p_key text,
  p_max_attempts integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_count integer;
  v_reset timestamptz;
begin
  select count, reset_at into v_count, v_reset
  from public.arche_rate_limits
  where rl_key = p_key;

  if v_count is null or v_reset < v_now then
    insert into public.arche_rate_limits(rl_key, count, reset_at)
    values (p_key, 1, v_now + (p_window_seconds || ' seconds')::interval)
    on conflict (rl_key) do update
      set count = 1,
          reset_at = excluded.reset_at;
    return true;
  end if;

  if v_count >= p_max_attempts then
    return false;
  end if;

  update public.arche_rate_limits
  set count = count + 1
  where rl_key = p_key;

  return true;
end;
$$;

-- =========================
-- STATIC MAP GRID
-- =========================
create table if not exists public.zones (
  zone_id text primary key,
  city_code text not null default 'PAR',
  min_lat double precision not null,
  min_lng double precision not null,
  max_lat double precision not null,
  max_lng double precision not null,
  center_lat double precision not null,
  center_lng double precision not null,
  active boolean not null default true,
  check (min_lat <= max_lat),
  check (min_lng <= max_lng)
);

create index if not exists idx_zones_city_active on public.zones(city_code, active);

-- =========================
-- USER ZONE STATE
-- =========================
create table if not exists public.user_zone_state (
  user_id uuid not null,
  zone_id text not null references public.zones(zone_id) on delete cascade,
  state text not null check (state in ('unknown','revealed','awakened')),
  first_entered_at timestamptz null,
  revealed_at timestamptz null,
  awakened_at timestamptz null,
  updated_at timestamptz not null default now(),
  primary key (user_id, zone_id)
);

create index if not exists idx_user_zone_state_user_state on public.user_zone_state(user_id, state);

-- =========================
-- RITUALS
-- =========================
create table if not exists public.ritual_templates (
  ritual_type text primary key check (ritual_type in ('presence','observation')),
  min_dwell_ms integer not null,
  max_duration_ms integer not null,
  max_accuracy_m integer not null,
  zone_mode boolean not null default true
);

insert into public.ritual_templates(ritual_type, min_dwell_ms, max_duration_ms, max_accuracy_m, zone_mode)
values
  ('presence', 20000, 60000, 35, true),
  ('observation', 15000, 60000, 35, true)
on conflict (ritual_type) do nothing;

create table if not exists public.ritual_runs (
  run_id uuid primary key,
  user_id uuid not null,
  ritual_type text not null references public.ritual_templates(ritual_type),
  zone_id text not null references public.zones(zone_id),
  place_id text null,
  status text not null check (status in ('started','completed','aborted','shortcut')),
  started_at timestamptz not null,
  ended_at timestamptz null,
  start_event_id uuid not null references public.arche_events(event_id),
  end_event_id uuid null references public.arche_events(event_id),
  response jsonb null,
  created_at timestamptz not null default now(),
  check (
    (status = 'started' and ended_at is null and end_event_id is null)
    or
    (status <> 'started' and ended_at is not null and end_event_id is not null)
  ),
  check (ended_at is null or ended_at >= started_at)
);

create index if not exists idx_ritual_runs_user_started on public.ritual_runs(user_id, started_at desc);

-- =========================
-- ENGRAVINGS
-- =========================
create table if not exists public.engraving_stamps (
  stamp_id text primary key,
  label text not null
);

insert into public.engraving_stamps(stamp_id, label)
values
  ('seal_sun','Seal Sun'),
  ('seal_moon','Seal Moon'),
  ('seal_arch','Seal Arch'),
  ('seal_shadow','Seal Shadow')
on conflict (stamp_id) do nothing;

create table if not exists public.engravings (
  engraving_id uuid primary key,
  user_id uuid not null,
  zone_id text not null references public.zones(zone_id),
  stamp_id text not null references public.engraving_stamps(stamp_id),
  source_run_id uuid not null references public.ritual_runs(run_id),
  source_event_id uuid not null references public.arche_events(event_id),
  created_at timestamptz not null default now(),
  unique (source_run_id)
);

create index if not exists idx_engravings_user_created on public.engravings(user_id, created_at desc);
create index if not exists idx_engravings_zone_created on public.engravings(zone_id, created_at desc);

create table if not exists public.zone_engravings (
  zone_id text not null references public.zones(zone_id),
  engraving_id uuid not null references public.engravings(engraving_id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null,
  primary key (zone_id, engraving_id)
);

-- =========================
-- COMPLEXION (3 axes)
-- =========================
create table if not exists public.user_complexion (
  user_id uuid primary key,
  presence_points integer not null default 0,
  wisdom_points integer not null default 0,
  shadow_points integer not null default 0,
  completed_rituals_count integer not null default 0,
  revealed boolean not null default false,
  last_delta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.complexion_deltas (
  user_id uuid not null,
  event_id uuid not null references public.arche_events(event_id) on delete cascade,
  d_presence integer not null default 0,
  d_wisdom integer not null default 0,
  d_shadow integer not null default 0,
  reason text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- =========================
-- PATHS + CHALLENGES
-- =========================
create table if not exists public.paths (
  path_id uuid primary key,
  user_id uuid not null,
  name text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  zone_sequence jsonb not null,
  metrics jsonb not null default '{}'::jsonb,
  source_event_from uuid not null references public.arche_events(event_id),
  source_event_to uuid not null references public.arche_events(event_id),
  created_at timestamptz not null default now(),
  check (ended_at >= started_at),
  check (jsonb_typeof(zone_sequence) = 'array'),
  check (jsonb_array_length(zone_sequence) > 0)
);

create index if not exists idx_paths_user_created on public.paths(user_id, created_at desc);

create table if not exists public.challenges (
  challenge_id uuid primary key,
  user_id uuid not null,
  path_id uuid not null references public.paths(path_id),
  title text not null,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_challenges_user_created on public.challenges(user_id, created_at desc);

create table if not exists public.challenge_attempts (
  attempt_id uuid primary key,
  challenge_id uuid not null references public.challenges(challenge_id),
  user_id uuid not null,
  status text not null check (status in ('started','completed','aborted')),
  started_at timestamptz not null,
  ended_at timestamptz null,
  score jsonb null,
  created_at timestamptz not null default now(),
  check (
    (status = 'started' and ended_at is null)
    or
    (status <> 'started' and ended_at is not null)
  ),
  check (ended_at is null or ended_at >= started_at)
);

create index if not exists idx_attempts_user_started on public.challenge_attempts(user_id, started_at desc);

create table if not exists public.personal_bests (
  user_id uuid not null,
  challenge_id uuid not null references public.challenges(challenge_id),
  attempt_id uuid not null references public.challenge_attempts(attempt_id),
  score_total numeric not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

-- =========================
-- ZONE CUSTODY (v0.1: zone-first)
-- =========================
create table if not exists public.zone_resonance (
  user_id uuid not null,
  zone_id text not null references public.zones(zone_id),
  resonance_score integer not null default 0,
  last_increase_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, zone_id)
);

create table if not exists public.zone_custodians (
  zone_id text not null references public.zones(zone_id),
  user_id uuid not null,
  claimed_at timestamptz not null,
  expires_at timestamptz not null,
  active boolean not null default true,
  primary key (zone_id, user_id)
);

create index if not exists idx_zone_custodians_active
  on public.zone_custodians(zone_id, active, expires_at);

-- =========================
-- projector dedupe
-- =========================
create table if not exists public.event_projection_applied (
  event_id uuid primary key references public.arche_events(event_id) on delete cascade,
  applied_at timestamptz not null default now()
);
