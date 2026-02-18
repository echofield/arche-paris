import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { requireUserId } from '../_shared/auth.ts';
import { getServiceClient } from '../_shared/supabase.ts';

type EventRow = {
  event_type: string;
  ts: string;
  payload: Record<string, unknown> | null;
};

type CustodianRow = {
  user_id: string;
  claimed_at: string;
  expires_at: string;
  active: boolean;
};

type ZoneRow = {
  zone_id: string;
  city_code: string;
  center_lat: number;
  center_lng: number;
};

const RUN_STATUS_CLOSED = 'closed';
const RUN_STATUS_OPEN = 'open';

const EVENT_WEIGHT: Record<string, number> = {
  zone_entered: 0.8,
  zone_revealed: 1.2,
  zone_awakened: 2.2,
  ritual_started: 0.9,
  ritual_completed: 2.0,
  ritual_aborted: 0.4,
  ritual_shortcut: 0.5,
  engraving_created: 1.8,
  path_recorded: 1.2,
  challenge_created: 0.7,
  challenge_attempt_started: 0.6,
  challenge_attempt_completed: 1.3,
  challenge_attempt_aborted: 0.3,
  custody_claimed: 1.4,
  custody_lost: 1.0,
  decision_made: 0.8,
  inscription_created: 1.1,
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function getAgeDays(tsIso: string, nowMs: number): number {
  const tsMs = new Date(tsIso).getTime();
  return Math.max(0, (nowMs - tsMs) / (1000 * 60 * 60 * 24));
}

function normalizedEntropy(typeCounts: Record<string, number>): number {
  const values = Object.values(typeCounts).filter((v) => v > 0);
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0 || values.length <= 1) return 0;

  let h = 0;
  for (const c of values) {
    const p = c / total;
    h += -p * Math.log2(p);
  }
  const hMax = Math.log2(values.length);
  return hMax <= 0 ? 0 : clamp01(h / hMax);
}

async function resolveZoneByH3(
  supabase: ReturnType<typeof getServiceClient>,
  h3: string
): Promise<ZoneRow | null> {
  const direct = await supabase
    .from('zones')
    .select('zone_id, city_code, center_lat, center_lng')
    .eq('zone_id', h3)
    .eq('active', true)
    .maybeSingle();

  if (direct.data) return direct.data as ZoneRow;

  const hintEvents = await supabase
    .from('arche_events')
    .select('zone_id')
    .filter('payload->>h3', 'eq', h3)
    .not('zone_id', 'is', null)
    .limit(2000);

  if (hintEvents.error || !hintEvents.data || hintEvents.data.length === 0) return null;

  const freq: Record<string, number> = {};
  for (const row of hintEvents.data as Array<{ zone_id: string | null }>) {
    if (!row.zone_id) continue;
    freq[row.zone_id] = (freq[row.zone_id] || 0) + 1;
  }
  const winner = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!winner) return null;

  const zone = await supabase
    .from('zones')
    .select('zone_id, city_code, center_lat, center_lng')
    .eq('zone_id', winner)
    .eq('active', true)
    .maybeSingle();

  return (zone.data as ZoneRow) ?? null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const auth = await requireUserId(req, { allowCardSession: true });
    if ('error' in auth) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(req.url);
    let h3 = (url.searchParams.get('h3') || '').trim();
    if (!h3 && req.method !== 'GET') {
      try {
        const body = await req.json();
        if (typeof body?.h3 === 'string') h3 = body.h3.trim();
      } catch {
        // no-op: keep query-based flow
      }
    }
    if (!h3) {
      return new Response(JSON.stringify({ error: 'h3 query param required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = getServiceClient();
    const zone = await resolveZoneByH3(supabase, h3);
    if (!zone) {
      return new Response(JSON.stringify({ error: 'Zone not found for provided h3' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const [eventsRes, custodiansRes] = await Promise.all([
      supabase
        .from('arche_events')
        .select('event_type, ts, payload')
        .eq('zone_id', zone.zone_id)
        .order('ts', { ascending: true })
        .limit(10000),
      supabase
        .from('zone_custodians')
        .select('user_id, claimed_at, expires_at, active')
        .eq('zone_id', zone.zone_id),
    ]);

    if (eventsRes.error) {
      return new Response(JSON.stringify({ error: eventsRes.error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (custodiansRes.error) {
      return new Response(JSON.stringify({ error: custodiansRes.error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const events = (eventsRes.data ?? []) as EventRow[];
    const custodians = (custodiansRes.data ?? []) as CustodianRow[];
    const nowMs = Date.now();

    const eventSummary: Record<string, number> = {};
    const ritualRunStatus = new Map<string, 'open' | 'closed'>();
    const attemptStatus = new Map<string, 'open' | 'closed'>();

    let revealedCount = 0;
    let awakenedCount = 0;
    let completedRitualCount = 0;
    let startedRitualCount = 0;
    let resonanceRaw = 0;

    for (const e of events) {
      eventSummary[e.event_type] = (eventSummary[e.event_type] || 0) + 1;
      if (e.event_type === 'zone_revealed') revealedCount += 1;
      if (e.event_type === 'zone_awakened') awakenedCount += 1;
      if (e.event_type === 'ritual_completed') completedRitualCount += 1;
      if (e.event_type === 'ritual_started') startedRitualCount += 1;

      const ageDays = getAgeDays(e.ts, nowMs);
      const recency = Math.exp(-ageDays / 45);
      const weight = EVENT_WEIGHT[e.event_type] ?? 0.75;
      resonanceRaw += weight * recency;

      const runId = typeof e.payload?.run_id === 'string' ? e.payload.run_id : null;
      if (runId && e.event_type === 'ritual_started') ritualRunStatus.set(runId, RUN_STATUS_OPEN);
      if (runId && (e.event_type === 'ritual_completed' || e.event_type === 'ritual_aborted' || e.event_type === 'ritual_shortcut')) {
        ritualRunStatus.set(runId, RUN_STATUS_CLOSED);
      }

      const attemptId = typeof e.payload?.attempt_id === 'string' ? e.payload.attempt_id : null;
      if (attemptId && e.event_type === 'challenge_attempt_started') attemptStatus.set(attemptId, RUN_STATUS_OPEN);
      if (attemptId && (e.event_type === 'challenge_attempt_completed' || e.event_type === 'challenge_attempt_aborted')) {
        attemptStatus.set(attemptId, RUN_STATUS_CLOSED);
      }
    }

    const unresolvedRitualThreads = Array.from(ritualRunStatus.values()).filter((v) => v === RUN_STATUS_OPEN).length;
    const unresolvedChallengeThreads = Array.from(attemptStatus.values()).filter((v) => v === RUN_STATUS_OPEN).length;
    const unresolvedThreads = unresolvedRitualThreads + unresolvedChallengeThreads;

    const entropy = normalizedEntropy(eventSummary);
    const resonance = clamp01(1 - Math.exp(-resonanceRaw / 24));

    const activeCustodians = custodians.filter((c) => c.active);
    const guardiansTotal = activeCustodians.length;
    let guardianDecay = 1;
    if (guardiansTotal > 0) {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const decayValues = activeCustodians.map((c) => {
        const remaining = new Date(c.expires_at).getTime() - nowMs;
        const ratio = clamp01(remaining / sevenDaysMs);
        return 1 - ratio;
      });
      guardianDecay = clamp01(decayValues.reduce((a, b) => a + b, 0) / decayValues.length);
    }

    const completionRatio = startedRitualCount > 0 ? completedRitualCount / startedRitualCount : 0;
    const phase =
      resonance >= 0.55 && guardianDecay < 0.5 ? 'resonant' :
      unresolvedThreads >= 3 || entropy >= 0.75 ? 'volatile' :
      resonance >= 0.18 || revealedCount > 0 ? 'stirring' :
      'dormant';

    const lastEventAt = events.length > 0 ? events[events.length - 1].ts : null;

    return new Response(JSON.stringify({
      ok: true,
      h3,
      zone_id: zone.zone_id,
      derived_from: 'event_ledger_replay_v1',
      metrics: {
        entropy,
        resonance,
        unresolved_threads: unresolvedThreads,
        unresolved_ritual_threads: unresolvedRitualThreads,
        unresolved_challenge_threads: unresolvedChallengeThreads,
        guardian_decay: guardianDecay,
      },
      zone_state: {
        phase,
        total_events: events.length,
        last_event_at: lastEventAt,
        revealed_events: revealedCount,
        awakened_events: awakenedCount,
        ritual_completion_ratio: completionRatio,
        active_guardians: guardiansTotal,
      },
      replay: {
        event_summary: eventSummary,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
