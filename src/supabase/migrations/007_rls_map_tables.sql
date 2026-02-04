-- 007_rls_map_tables.sql
-- Purpose: Explicit RLS policies for ARCHÉ map engraving tables
-- Principle: no anon/auth access; only service_role (Card Gate) can access.

-- Ensure RLS is enabled (idempotent safety)
alter table public.inscriptions enable row level security;
alter table public.engraved_segments enable row level security;
alter table public.meridian_proofs enable row level security;

-- Clean old policies if re-running (optional safety)
drop policy if exists "service_role_all_inscriptions" on public.inscriptions;
drop policy if exists "service_role_all_engraved_segments" on public.engraved_segments;
drop policy if exists "service_role_all_meridian_proofs" on public.meridian_proofs;

-- INSCRIPTIONS — service_role full access
create policy "service_role_all_inscriptions"
on public.inscriptions
for all
to service_role
using (true)
with check (true);

-- ENGRAVED SEGMENTS — service_role full access
create policy "service_role_all_engraved_segments"
on public.engraved_segments
for all
to service_role
using (true)
with check (true);

-- MERIDIAN PROOFS — service_role full access
create policy "service_role_all_meridian_proofs"
on public.meridian_proofs
for all
to service_role
using (true)
with check (true);

-- NOTE:
-- No policies are created for anon/auth, so they get zero access under RLS.
