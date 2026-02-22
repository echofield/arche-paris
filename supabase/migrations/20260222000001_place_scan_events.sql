-- ============================================
-- Place Scan events (privacy-safe log for future Echo)
-- No lat/lon; card_id + zone_id + h3 + time/heading buckets only.
-- ============================================

create table if not exists public.place_scan_events (
  id uuid primary key default gen_random_uuid(),
  card_id text not null,
  zone_id text not null,
  h3 text,
  time_bucket text not null,
  heading_bucket integer,
  created_at timestamptz not null default now()
);

create index if not exists place_scan_events_card_created_idx
  on public.place_scan_events (card_id, created_at desc);

create index if not exists place_scan_events_zone_created_idx
  on public.place_scan_events (zone_id, created_at desc);

alter table public.place_scan_events enable row level security;

-- No direct client access; only service_role can insert/read (e.g. place-scan, future echo-engine).
revoke all on public.place_scan_events from anon, authenticated;

create policy place_scan_events_service_all
  on public.place_scan_events
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.place_scan_events is 'Append-only scan log for Lecture du Lieu; privacy-safe (no lat/lon). Used for future Echo and cooldown.';
