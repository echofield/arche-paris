create or replace function public.arche_events_deny_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'arche_events is append-only: UPDATE and DELETE are forbidden';
end;
$$;

drop trigger if exists trg_arche_events_append_only on public.arche_events;
create trigger trg_arche_events_append_only
before update or delete on public.arche_events
for each row execute function public.arche_events_deny_mutation();
