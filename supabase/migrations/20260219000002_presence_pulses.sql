create table if not exists public.presence_pulses (
  id uuid primary key default gen_random_uuid(),
  card_id text not null,
  h3 text not null,
  ts timestamptz not null default now(),
  speed_mps real,
  accuracy_m real,
  device_fingerprint text
);

create index if not exists presence_pulses_card_ts_idx
  on public.presence_pulses (card_id, ts desc);

create index if not exists presence_pulses_h3_ts_idx
  on public.presence_pulses (h3, ts desc);

alter table public.presence_pulses enable row level security;
revoke all on public.presence_pulses from anon, authenticated;
