-- ============================================
-- Replace plaintext card_id with card_hash (HMAC-SHA256 server-side).
-- Cooldown and future Echo use card_hash only; no lat/lon.
-- ============================================

alter table public.place_scan_events add column if not exists card_hash text;

update public.place_scan_events set card_hash = 'legacy' where card_hash is null;

alter table public.place_scan_events alter column card_hash set not null;

drop index if exists public.place_scan_events_card_created_idx;

alter table public.place_scan_events drop column if exists card_id;

create index if not exists place_scan_events_card_hash_created_idx
  on public.place_scan_events (card_hash, created_at desc);

comment on column public.place_scan_events.card_hash is 'HMAC-SHA256(card_id, server secret); never store plaintext card_id.';

-- Defense in depth: ensure table stays service-only after alter (no anon/auth access).
revoke all on public.place_scan_events from anon, authenticated;
