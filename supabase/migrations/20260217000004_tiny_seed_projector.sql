create or replace function public.apply_event_projection(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  ev public.arche_events%rowtype;
  inserted_marker uuid;

  v_run_id uuid;
  v_ritual_type text;
  v_status text;

  d_presence int := 0;
  d_wisdom int := 0;
  d_shadow int := 0;
  v_total_completed int;

  v_stamp_id text;

  v_path_id uuid;
  v_from_event uuid;
  v_to_event uuid;
  v_from_ts timestamptz;
  v_to_ts timestamptz;
  v_zone_seq jsonb;

  v_challenge_id uuid;
  v_attempt_id uuid;
  v_score_total numeric;
  v_sim numeric;
  v_time numeric;
  v_fric numeric;
begin
  insert into public.event_projection_applied(event_id)
  values (p_event_id)
  on conflict do nothing
  returning event_id into inserted_marker;

  if inserted_marker is null then
    return;
  end if;

  select * into ev from public.arche_events where event_id = p_event_id;
  if not found then
    return;
  end if;

  -- ---- Monotonic zone state updates ----
  if ev.event_type in ('zone_entered','zone_revealed','zone_awakened') then
    if ev.zone_id is null then return; end if;

    insert into public.user_zone_state(user_id, zone_id, state, first_entered_at, revealed_at, awakened_at, updated_at)
    values (
      ev.user_id,
      ev.zone_id,
      case
        when ev.event_type = 'zone_awakened' then 'awakened'
        when ev.event_type = 'zone_revealed' then 'revealed'
        when ev.event_type = 'zone_entered' and coalesce(ev.dwell_ms,0) >= 10000 then 'revealed'
        else 'unknown'
      end,
      case when ev.event_type='zone_entered' then ev.ts else null end,
      case
        when ev.event_type='zone_revealed' then ev.ts
        when ev.event_type='zone_entered' and coalesce(ev.dwell_ms,0) >= 10000 then ev.ts
        else null end,
      case when ev.event_type='zone_awakened' then ev.ts else null end,
      now()
    )
    on conflict (user_id, zone_id) do update set
      state = case
        when public.user_zone_state.state = 'awakened' then 'awakened'
        when excluded.state = 'awakened' then 'awakened'
        when public.user_zone_state.state = 'revealed' then 'revealed'
        when excluded.state = 'revealed' then 'revealed'
        else 'unknown'
      end,
      first_entered_at = coalesce(public.user_zone_state.first_entered_at, excluded.first_entered_at),
      revealed_at = coalesce(public.user_zone_state.revealed_at, excluded.revealed_at),
      awakened_at = coalesce(public.user_zone_state.awakened_at, excluded.awakened_at),
      updated_at = now();
  end if;

  -- ---- Ritual started ----
  if ev.event_type = 'ritual_started' then
    v_run_id := (ev.payload ->> 'run_id')::uuid;
    v_ritual_type := ev.payload ->> 'ritual_type';
    if v_run_id is null or v_ritual_type is null or ev.zone_id is null then return; end if;

    insert into public.ritual_runs(
      run_id, user_id, ritual_type, zone_id, place_id, status, started_at, start_event_id
    ) values (
      v_run_id,
      ev.user_id,
      v_ritual_type,
      ev.zone_id,
      ev.place_id,
      'started',
      ev.ts,
      ev.event_id
    )
    on conflict (run_id) do nothing;
  end if;

  -- ---- Ritual terminal events -> finalize run + deltas + awaken ----
  if ev.event_type in ('ritual_completed','ritual_aborted','ritual_shortcut') then
    v_run_id := (ev.payload ->> 'run_id')::uuid;
    if v_run_id is null then return; end if;

    update public.ritual_runs
    set
      status = case
        when status <> 'started' then status
        when ev.event_type = 'ritual_completed' then 'completed'
        when ev.event_type = 'ritual_aborted' then 'aborted'
        else 'shortcut'
      end,
      ended_at = case when status = 'started' then ev.ts else ended_at end,
      end_event_id = case when status = 'started' then ev.event_id else end_event_id end,
      response = coalesce(response, ev.payload -> 'response')
    where run_id = v_run_id;

    -- deterministic deltas
    if ev.event_type = 'ritual_completed' then
      d_presence := 1; d_wisdom := 2; d_shadow := 0;
    elsif ev.event_type = 'ritual_aborted' then
      d_presence := 0; d_wisdom := 0; d_shadow := 1;
    else
      d_presence := 0; d_wisdom := 0; d_shadow := 2;
    end if;

    insert into public.complexion_deltas(user_id, event_id, d_presence, d_wisdom, d_shadow, reason)
    values (ev.user_id, ev.event_id, d_presence, d_wisdom, d_shadow, ev.event_type)
    on conflict do nothing;

    insert into public.user_complexion(user_id) values (ev.user_id)
    on conflict (user_id) do nothing;

    update public.user_complexion
    set
      presence_points = presence_points + d_presence,
      wisdom_points = wisdom_points + d_wisdom,
      shadow_points = shadow_points + d_shadow,
      completed_rituals_count = completed_rituals_count + case when ev.event_type='ritual_completed' then 1 else 0 end,
      last_delta = jsonb_build_object('presence', d_presence, 'wisdom', d_wisdom, 'shadow', d_shadow, 'event_id', ev.event_id),
      updated_at = now()
    where user_id = ev.user_id;

    select completed_rituals_count into v_total_completed
    from public.user_complexion where user_id = ev.user_id;

    if v_total_completed >= 5 then
      update public.user_complexion
      set revealed = true, updated_at = now()
      where user_id = ev.user_id and revealed = false;
    end if;

    -- awaken zone on successful ritual
    if ev.event_type='ritual_completed' and ev.zone_id is not null then
      insert into public.user_zone_state(user_id, zone_id, state, awakened_at, updated_at)
      values (ev.user_id, ev.zone_id, 'awakened', ev.ts, now())
      on conflict (user_id, zone_id) do update set
        state = 'awakened',
        awakened_at = coalesce(public.user_zone_state.awakened_at, ev.ts),
        revealed_at = coalesce(public.user_zone_state.revealed_at, ev.ts),
        updated_at = now();

      -- resonance bump
      insert into public.zone_resonance(user_id, zone_id, resonance_score, last_increase_at, updated_at)
      values (ev.user_id, ev.zone_id, 1, ev.ts, now())
      on conflict (user_id, zone_id) do update set
        resonance_score = public.zone_resonance.resonance_score + 1,
        last_increase_at = ev.ts,
        updated_at = now();

      -- custody claim threshold = 3 (writes claim row, but canonical event is custody_claimed; endpoint can emit it later if you want strictness)
      insert into public.zone_custodians(zone_id, user_id, claimed_at, expires_at, active)
      select ev.zone_id, ev.user_id, ev.ts, ev.ts + interval '7 days', true
      where (
        select resonance_score from public.zone_resonance
        where user_id = ev.user_id and zone_id = ev.zone_id
      ) >= 3
      on conflict (zone_id, user_id) do update set
        active = true,
        claimed_at = excluded.claimed_at,
        expires_at = excluded.expires_at;
    end if;
  end if;

  -- ---- Engraving ----
  if ev.event_type = 'engraving_created' then
    v_run_id := (ev.payload ->> 'run_id')::uuid;
    v_stamp_id := ev.payload ->> 'stamp_id';
    if v_run_id is null or v_stamp_id is null or ev.zone_id is null then return; end if;

    insert into public.engravings(
      engraving_id, user_id, zone_id, stamp_id, source_run_id, source_event_id, created_at
    ) values (
      coalesce((ev.payload ->> 'engraving_id')::uuid, gen_random_uuid()),
      ev.user_id,
      ev.zone_id,
      v_stamp_id,
      v_run_id,
      ev.event_id,
      ev.ts
    )
    on conflict (source_run_id) do nothing;

    insert into public.zone_engravings(zone_id, engraving_id, user_id, created_at)
    select e.zone_id, e.engraving_id, e.user_id, e.created_at
    from public.engravings e
    where e.source_run_id = v_run_id
    on conflict do nothing;
  end if;

  -- ---- Path recorded ----
  if ev.event_type = 'path_recorded' then
    v_path_id := coalesce((ev.payload ->> 'path_id')::uuid, gen_random_uuid());
    v_from_event := (ev.payload ->> 'from_event_id')::uuid;
    v_to_event := (ev.payload ->> 'to_event_id')::uuid;
    if v_from_event is null or v_to_event is null then return; end if;

    select ts into v_from_ts from public.arche_events where event_id = v_from_event and user_id = ev.user_id;
    select ts into v_to_ts from public.arche_events where event_id = v_to_event and user_id = ev.user_id;
    if v_from_ts is null or v_to_ts is null then return; end if;

    if v_to_ts < v_from_ts then
      -- swap
      perform 1;
      v_from_ts := v_from_ts + v_to_ts;
      v_to_ts := v_from_ts - v_to_ts;
      v_from_ts := v_from_ts - v_to_ts;
    end if;

    select jsonb_agg(s.zone_id order by s.first_ts) into v_zone_seq
    from (
      select zone_id, min(ts) as first_ts
      from public.arche_events
      where user_id = ev.user_id
        and ts between v_from_ts and v_to_ts
        and zone_id is not null
      group by zone_id
      order by min(ts)
    ) s;

    if v_zone_seq is null or jsonb_typeof(v_zone_seq) <> 'array' or jsonb_array_length(v_zone_seq) = 0 then
      return;
    end if;

    insert into public.paths(
      path_id, user_id, name, started_at, ended_at, zone_sequence, metrics, source_event_from, source_event_to, created_at
    ) values (
      v_path_id,
      ev.user_id,
      coalesce(ev.payload ->> 'name', 'Untitled Path'),
      v_from_ts,
      v_to_ts,
      v_zone_seq,
      coalesce(ev.payload -> 'metrics', '{}'::jsonb),
      v_from_event,
      v_to_event,
      ev.ts
    )
    on conflict (path_id) do nothing;
  end if;

  -- ---- Challenge ----
  if ev.event_type = 'challenge_created' then
    v_challenge_id := coalesce((ev.payload ->> 'challenge_id')::uuid, gen_random_uuid());
    insert into public.challenges(challenge_id, user_id, path_id, title, rules, created_at)
    values (
      v_challenge_id,
      ev.user_id,
      (ev.payload ->> 'path_id')::uuid,
      coalesce(ev.payload ->> 'title', 'Challenge'),
      coalesce(ev.payload -> 'rules', '{}'::jsonb),
      ev.ts
    )
    on conflict (challenge_id) do nothing;
  end if;

  if ev.event_type = 'challenge_attempt_started' then
    v_attempt_id := coalesce((ev.payload ->> 'attempt_id')::uuid, gen_random_uuid());
    insert into public.challenge_attempts(attempt_id, challenge_id, user_id, status, started_at, created_at)
    values (
      v_attempt_id,
      (ev.payload ->> 'challenge_id')::uuid,
      ev.user_id,
      'started',
      ev.ts,
      ev.ts
    )
    on conflict (attempt_id) do nothing;
  end if;

  if ev.event_type in ('challenge_attempt_completed','challenge_attempt_aborted') then
    v_attempt_id := (ev.payload ->> 'attempt_id')::uuid;
    if v_attempt_id is null then return; end if;

    if ev.event_type = 'challenge_attempt_completed' then
      v_sim := coalesce((ev.payload -> 'score_inputs' ->> 'similarity')::numeric, 0);
      v_time := coalesce((ev.payload -> 'score_inputs' ->> 'time_score')::numeric, 0);
      v_fric := coalesce((ev.payload -> 'score_inputs' ->> 'friction_score')::numeric, 0);
      v_score_total := round((v_sim * 0.5 + v_time * 0.2 + v_fric * 0.3)::numeric, 4);

      update public.challenge_attempts
      set status = case when status='started' then 'completed' else status end,
          ended_at = case when ended_at is null then ev.ts else ended_at end,
          score = case when score is null then jsonb_build_object(
            'similarity', v_sim,
            'time_score', v_time,
            'friction_score', v_fric,
            'total', v_score_total
          ) else score end
      where attempt_id = v_attempt_id;

      insert into public.personal_bests(user_id, challenge_id, attempt_id, score_total, updated_at)
      select ca.user_id, ca.challenge_id, ca.attempt_id, v_score_total, now()
      from public.challenge_attempts ca
      where ca.attempt_id = v_attempt_id
      on conflict (user_id, challenge_id) do update
      set attempt_id = excluded.attempt_id,
          score_total = excluded.score_total,
          updated_at = now()
      where excluded.score_total > public.personal_bests.score_total;

    else
      update public.challenge_attempts
      set status = case when status='started' then 'aborted' else status end,
          ended_at = case when ended_at is null then ev.ts else ended_at end
      where attempt_id = v_attempt_id;
    end if;
  end if;

  -- ---- Custody events (driven by decay endpoint) ----
  if ev.event_type = 'custody_claimed' and ev.zone_id is not null then
    insert into public.zone_custodians(zone_id, user_id, claimed_at, expires_at, active)
    values (
      ev.zone_id,
      ev.user_id,
      ev.ts,
      coalesce((ev.payload ->> 'expires_at')::timestamptz, ev.ts + interval '7 days'),
      true
    )
    on conflict (zone_id, user_id) do update set
      active = true,
      claimed_at = excluded.claimed_at,
      expires_at = excluded.expires_at;
  end if;

  if ev.event_type = 'custody_lost' and ev.zone_id is not null then
    update public.zone_custodians
    set active = false
    where zone_id = ev.zone_id and user_id = ev.user_id and active = true;
  end if;

end;
$$;

revoke all on function public.apply_event_projection(uuid) from public;
grant execute on function public.apply_event_projection(uuid) to service_role;

create or replace function public.tg_apply_event_projection()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.apply_event_projection(new.event_id);
  return new;
end;
$$;

drop trigger if exists trg_arche_events_project on public.arche_events;
create trigger trg_arche_events_project
after insert on public.arche_events
for each row
execute function public.tg_apply_event_projection();
