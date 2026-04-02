-- Card-scoped progression persistence for collection/traces/walks/quest runs.
-- Access path: Supabase Edge Function card-gate (/progression/state).

create table if not exists public.card_progression_snapshots (
  card_id text not null,
  artifact text not null check (artifact in ('collection', 'traces', 'walks', 'quest_runs')),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (card_id, artifact)
);

create index if not exists idx_card_progression_snapshots_card_updated
  on public.card_progression_snapshots (card_id, updated_at desc);

alter table public.card_progression_snapshots enable row level security;

drop policy if exists "service_role_all_card_progression_snapshots" on public.card_progression_snapshots;
create policy "service_role_all_card_progression_snapshots"
on public.card_progression_snapshots for all to service_role using (true) with check (true);

comment on table public.card_progression_snapshots is 'Card-scoped progression snapshots (collection, traces, walks, quest_runs). Conflict resolution via updated_at in card-gate.';
