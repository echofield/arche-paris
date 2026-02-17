import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { requireUserId } from '../_shared/auth.ts';
import { writeEvent } from '../_shared/event-writer.ts';
import { getServiceClient } from '../_shared/supabase.ts';
import {
  validateCoordsSanity,
  validateAccuracy,
  loadRitualRun,
  loadRitualTemplate,
  validateRitualCompletion,
  logRejection,
  ErrorCode,
  GLOBAL_MAX_ACCURACY_M
} from '../_shared/validation.ts';

interface ZoneProgressItem {
  zone_id: string;
  entered: boolean;
  presence_ritual: boolean;
  observation_ritual: boolean;
  engraved: boolean;
  is_custodian: boolean;
  objectives_complete: number;
}

interface ComplexionData {
  presence_points: number;
  wisdom_points: number;
  shadow_points: number;
  completed_rituals_count: number;
}

async function loadZoneProgressAndComplexion(userId: string, zoneId: string): Promise<{
  zone_progress: ZoneProgressItem | null;
  complexion: ComplexionData | null;
}> {
  const supabase = getServiceClient();

  const [progressResult, complexionResult] = await Promise.all([
    supabase
      .from('zone_progress')
      .select('zone_id, entered, presence_ritual, observation_ritual, engraved, is_custodian, objectives_complete')
      .eq('user_id', userId)
      .eq('zone_id', zoneId)
      .single(),
    supabase
      .from('user_complexion')
      .select('presence_points, wisdom_points, shadow_points, completed_rituals_count')
      .eq('user_id', userId)
      .single()
  ]);

  return {
    zone_progress: progressResult.data as ZoneProgressItem | null,
    complexion: complexionResult.data as ComplexionData | null
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const auth = await requireUserId(req);
    if ('error' in auth) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { run_id, zone_id, dwell_ms, lat, lng, accuracy_m, response, client_ts, idempotency_key } = body;

    // ============ Input Validation ============

    if (!run_id) {
      return new Response(JSON.stringify({ ok: false, code: 'MISSING_RUN_ID', message: 'run_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!idempotency_key) {
      return new Response(JSON.stringify({ ok: false, code: 'MISSING_IDEMPOTENCY_KEY', message: 'idempotency_key is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============ Load Ritual Run ============

    const { run, error: runError } = await loadRitualRun(run_id, auth.userId);
    if (!run) {
      await logRejection(auth.userId, 'rituals-complete', body, runError!.code, { run_id });
      return new Response(JSON.stringify({
        ok: false,
        code: runError!.code,
        message: runError!.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============ Load Ritual Template ============

    const { template, error: templateError } = await loadRitualTemplate(run.ritual_type);
    if (!template) {
      await logRejection(auth.userId, 'rituals-complete', body, templateError!.code, { ritual_type: run.ritual_type });
      return new Response(JSON.stringify({
        ok: false,
        code: templateError!.code,
        message: templateError!.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============ GPS Validation (if provided) ============

    if (lat !== undefined && lng !== undefined) {
      const coordsResult = validateCoordsSanity(lat, lng);
      if (!coordsResult.valid) {
        await logRejection(auth.userId, 'rituals-complete', body, coordsResult.error!.code, coordsResult.error!.details);
        return new Response(JSON.stringify({
          ok: false,
          code: coordsResult.error!.code,
          message: coordsResult.error!.message,
          details: coordsResult.error!.details
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ============ Calculate Duration ============

    const now = new Date();
    const startedAt = new Date(run.started_at);
    const duration_ms = now.getTime() - startedAt.getTime();

    // ============ Template Constraint Validation ============

    const completionResult = validateRitualCompletion(dwell_ms, duration_ms, accuracy_m, template);
    if (!completionResult.valid) {
      await logRejection(auth.userId, 'rituals-complete', body, completionResult.error!.code, {
        ...completionResult.error!.details,
        run_id,
        ritual_type: run.ritual_type,
        duration_ms,
        started_at: run.started_at
      });
      return new Response(JSON.stringify({
        ok: false,
        code: completionResult.error!.code,
        message: completionResult.error!.message,
        details: completionResult.error!.details
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============ Write Event ============

    const result = await writeEvent({
      userId: auth.userId,
      eventType: 'ritual_completed',
      zoneId: zone_id || run.zone_id,
      lat,
      lng,
      accuracyM: accuracy_m,
      dwellMs: dwell_ms,
      payload: { run_id, response, client_ts, duration_ms },
      idempotencyKey: idempotency_key
    });

    if (result.error) {
      return new Response(JSON.stringify({ ok: false, error: result.error }), {
        status: result.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Load updated zone_progress and complexion after event triggers run
    const effectiveZoneId = zone_id || run.zone_id;
    const { zone_progress, complexion } = await loadZoneProgressAndComplexion(auth.userId, effectiveZoneId);

    return new Response(JSON.stringify({
      ok: true,
      event_id: result.event?.event_id,
      run_id,
      ts: result.event?.ts,
      accepted: true,
      isNew: result.isNew,
      zone_progress,
      complexion
    }), {
      status: result.isNew ? 201 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
