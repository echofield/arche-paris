-- Optional: restrict layer values to 0..1 (defense in depth; API already validates).
-- Run after 20260226000001_champs.sql. Idempotent: skip if constraint exists.

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.champs'::regclass and conname = 'champs_layers_values_check') then
    alter table public.champs
    add constraint champs_layers_values_check
    check (
      (layers->>'trace')::numeric between 0 and 1
      and (layers->>'alignment')::numeric between 0 and 1
      and (layers->>'cadence')::numeric between 0 and 1
      and (layers->>'echo')::numeric between 0 and 1
      and (layers->>'threshold')::numeric between 0 and 1
    );
  end if;
end $$;
