-- ============================================
-- ARCHÉ Rejections Audit Table
-- Tracks validation failures for forensic audit
-- Does NOT pollute gameplay ledger (arche_events)
-- ============================================

create table if not exists public.arche_rejections (
  rejection_id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null,
  attempted_payload jsonb not null default '{}'::jsonb,
  rejection_code text not null,
  details jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists idx_arche_rejections_user_ts
  on public.arche_rejections(user_id, created_at desc);

create index if not exists idx_arche_rejections_code_ts
  on public.arche_rejections(rejection_code, created_at desc);

-- RLS: service role only (no client access)
alter table public.arche_rejections enable row level security;

drop policy if exists arche_rejections_service_all on public.arche_rejections;
create policy arche_rejections_service_all
on public.arche_rejections
for all
to service_role
using (true)
with check (true);

-- Optional: auto-cleanup old rejections (> 30 days)
-- Uncomment if you want automatic pruning
-- create or replace function public.cleanup_old_rejections()
-- returns void
-- language sql
-- as $$
--   delete from public.arche_rejections
--   where created_at < now() - interval '30 days';
-- $$;
