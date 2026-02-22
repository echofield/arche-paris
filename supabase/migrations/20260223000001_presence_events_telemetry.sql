-- Last successful presence per card (quantized ~11m); for teleport rejection.
create table if not exists public.presence_events (
  card_id text primary key,
  ts timestamptz not null default now(),
  lat double precision not null,
  lng double precision not null,
  grade text not null,
  zone_id text
);

create index if not exists presence_events_ts_idx on public.presence_events (ts);

alter table public.presence_events enable row level security;
revoke all on public.presence_events from anon, authenticated;

-- Privacy-safe telemetry: no raw samples, no exact coords.
create table if not exists public.presence_telemetry (
  id uuid primary key default gen_random_uuid(),
  card_id text not null,
  zone_id text,
  grade text not null,
  ok boolean not null,
  reason_code text,
  accuracy_bucket text not null check (accuracy_bucket in ('<=20', '20-60', '60-80', '>80')),
  ts timestamptz not null default now()
);

create index if not exists presence_telemetry_ts_idx on public.presence_telemetry (ts);
create index if not exists presence_telemetry_zone_idx on public.presence_telemetry (zone_id, ts desc);

alter table public.presence_telemetry enable row level security;
revoke all on public.presence_telemetry from anon, authenticated;
