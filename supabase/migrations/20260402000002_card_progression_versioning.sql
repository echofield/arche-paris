-- Server-authoritative versioning for card-scoped progression snapshots.
-- Requires: 20260402000001_card_progression_snapshots.sql

do $$
begin
  if to_regclass('public.card_progression_snapshots') is null then
    raise notice 'Skipping progression versioning migration because card_progression_snapshots does not exist yet.';
    return;
  end if;

  alter table public.card_progression_snapshots
    add column if not exists version bigint;

  update public.card_progression_snapshots
  set version = 1
  where version is null or version < 1;

  alter table public.card_progression_snapshots
    alter column version set default 1;

  alter table public.card_progression_snapshots
    alter column version set not null;

  alter table public.card_progression_snapshots
    add column if not exists client_updated_at timestamptz;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'card_progression_snapshots_version_nonnegative'
  ) then
    alter table public.card_progression_snapshots
      add constraint card_progression_snapshots_version_nonnegative check (version >= 0);
  end if;
end
$$;

comment on column public.card_progression_snapshots.version
  is 'Server-authoritative monotonic version per (card_id, artifact). Used for compare-and-set writes.';

comment on column public.card_progression_snapshots.client_updated_at
  is 'Client-observed update timestamp for diagnostics only. Not used for conflict authority.';

comment on table public.card_progression_snapshots
  is 'Card-scoped progression snapshots with server-authoritative versioning and compare-and-set conflict semantics.';
