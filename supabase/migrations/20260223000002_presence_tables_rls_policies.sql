-- Explicit RLS policies: only service_role (edge function) can write.
-- anon and authenticated have no grants (revoked in 20260223000001); these policies
-- ensure no permissive policy ever allows them to read or write.

-- presence_events: deny all for anon and authenticated (service_role bypasses RLS)
create policy "presence_events_no_anon_select"
  on public.presence_events for select to anon using (false);
create policy "presence_events_no_anon_insert"
  on public.presence_events for insert to anon with check (false);
create policy "presence_events_no_anon_update"
  on public.presence_events for update to anon using (false);
create policy "presence_events_no_anon_delete"
  on public.presence_events for delete to anon using (false);

create policy "presence_events_no_auth_select"
  on public.presence_events for select to authenticated using (false);
create policy "presence_events_no_auth_insert"
  on public.presence_events for insert to authenticated with check (false);
create policy "presence_events_no_auth_update"
  on public.presence_events for update to authenticated using (false);
create policy "presence_events_no_auth_delete"
  on public.presence_events for delete to authenticated using (false);

-- presence_telemetry: deny all for anon and authenticated
create policy "presence_telemetry_no_anon_select"
  on public.presence_telemetry for select to anon using (false);
create policy "presence_telemetry_no_anon_insert"
  on public.presence_telemetry for insert to anon with check (false);
create policy "presence_telemetry_no_anon_update"
  on public.presence_telemetry for update to anon using (false);
create policy "presence_telemetry_no_anon_delete"
  on public.presence_telemetry for delete to anon using (false);

create policy "presence_telemetry_no_auth_select"
  on public.presence_telemetry for select to authenticated using (false);
create policy "presence_telemetry_no_auth_insert"
  on public.presence_telemetry for insert to authenticated with check (false);
create policy "presence_telemetry_no_auth_update"
  on public.presence_telemetry for update to authenticated using (false);
create policy "presence_telemetry_no_auth_delete"
  on public.presence_telemetry for delete to authenticated using (false);
