-- ARCHÉ — Add economic_role to leads table
--
-- Economic roles define the relationship type:
--   - partner: standard distribution/collaboration partner (default)
--   - client: paying customer for ARCHÉ services
--   - operator: Passeport participants who receive the system and help spread ARCHÉ locally
--   - observer: watching/monitoring, not yet engaged
--
-- Operators (Passeport) influence projection weight but are not counted as direct conversions.

-- Create the enum type
do $$ begin
  if not exists (select 1 from pg_type where typname = 'lead_economic_role') then
    create type lead_economic_role as enum (
      'partner',
      'client',
      'operator',
      'observer'
    );
  end if;
end $$;

-- Add the column to leads table
alter table public.leads
add column if not exists economic_role lead_economic_role not null default 'partner';

-- Index for filtering by role
create index if not exists leads_economic_role_idx on public.leads(economic_role);

-- Comment
comment on column public.leads.economic_role is 'Economic relationship type: partner (distribution), client (paying), operator (Passeport local spreaders), observer (watching)';
