alter table public.arche_events enable row level security;
alter table public.zones enable row level security;
alter table public.user_zone_state enable row level security;
alter table public.ritual_templates enable row level security;
alter table public.ritual_runs enable row level security;
alter table public.engraving_stamps enable row level security;
alter table public.engravings enable row level security;
alter table public.zone_engravings enable row level security;
alter table public.user_complexion enable row level security;
alter table public.complexion_deltas enable row level security;
alter table public.paths enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_attempts enable row level security;
alter table public.personal_bests enable row level security;
alter table public.zone_resonance enable row level security;
alter table public.zone_custodians enable row level security;
alter table public.event_projection_applied enable row level security;

-- service-only writes to truth + projector marker
drop policy if exists arche_events_service_all on public.arche_events;
create policy arche_events_service_all
on public.arche_events
for all
to service_role
using (true)
with check (true);

drop policy if exists event_projection_applied_service on public.event_projection_applied;
create policy event_projection_applied_service
on public.event_projection_applied
for all
to service_role
using (true)
with check (true);

-- static reads
drop policy if exists zones_read on public.zones;
create policy zones_read on public.zones for select to authenticated using (true);

drop policy if exists ritual_templates_read on public.ritual_templates;
create policy ritual_templates_read on public.ritual_templates for select to authenticated using (true);

drop policy if exists engraving_stamps_read on public.engraving_stamps;
create policy engraving_stamps_read on public.engraving_stamps for select to authenticated using (true);

-- own-row reads
drop policy if exists user_zone_state_read on public.user_zone_state;
create policy user_zone_state_read on public.user_zone_state for select to authenticated using (auth.uid() = user_id);

drop policy if exists ritual_runs_read on public.ritual_runs;
create policy ritual_runs_read on public.ritual_runs for select to authenticated using (auth.uid() = user_id);

drop policy if exists engravings_read on public.engravings;
create policy engravings_read on public.engravings for select to authenticated using (auth.uid() = user_id);

drop policy if exists zone_engravings_read on public.zone_engravings;
create policy zone_engravings_read on public.zone_engravings for select to authenticated using (auth.uid() = user_id);

drop policy if exists user_complexion_read on public.user_complexion;
create policy user_complexion_read on public.user_complexion for select to authenticated using (auth.uid() = user_id);

drop policy if exists complexion_deltas_read on public.complexion_deltas;
create policy complexion_deltas_read on public.complexion_deltas for select to authenticated using (auth.uid() = user_id);

drop policy if exists paths_read on public.paths;
create policy paths_read on public.paths for select to authenticated using (auth.uid() = user_id);

drop policy if exists challenges_read on public.challenges;
create policy challenges_read on public.challenges for select to authenticated using (auth.uid() = user_id);

drop policy if exists challenge_attempts_read on public.challenge_attempts;
create policy challenge_attempts_read on public.challenge_attempts for select to authenticated using (auth.uid() = user_id);

drop policy if exists personal_bests_read on public.personal_bests;
create policy personal_bests_read on public.personal_bests for select to authenticated using (auth.uid() = user_id);

drop policy if exists zone_resonance_read on public.zone_resonance;
create policy zone_resonance_read on public.zone_resonance for select to authenticated using (auth.uid() = user_id);

drop policy if exists zone_custodians_read on public.zone_custodians;
create policy zone_custodians_read on public.zone_custodians for select to authenticated using (auth.uid() = user_id);
