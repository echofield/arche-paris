import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { requireUserId } from '../_shared/auth.ts';
import { writeEvent } from '../_shared/event-writer.ts';
import {
  validateCoordsSanity,
  validateAccuracy,
  loadZoneBbox,
  checkBboxContainment,
  logRejection,
  ErrorCode,
  GLOBAL_MAX_ACCURACY_M
} from '../_shared/validation.ts';

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
    const { zone_id, lat, lng, accuracy_m, dwell_ms, client_ts, idempotency_key } = body;

    // ============ Input Validation ============

    if (!zone_id) {
      return new Response(JSON.stringify({ ok: false, code: 'MISSING_ZONE_ID', message: 'zone_id is required' }), {
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

    // ============ GPS Validation ============

    // 1. Coordinate sanity check
    const coordsResult = validateCoordsSanity(lat, lng);
    if (!coordsResult.valid) {
      await logRejection(auth.userId, 'zones-enter', body, coordsResult.error!.code, coordsResult.error!.details);
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

    // 2. Accuracy gate (global max)
    const accuracyResult = validateAccuracy(accuracy_m, GLOBAL_MAX_ACCURACY_M);
    if (!accuracyResult.valid) {
      await logRejection(auth.userId, 'zones-enter', body, accuracyResult.error!.code, accuracyResult.error!.details);
      return new Response(JSON.stringify({
        ok: false,
        code: accuracyResult.error!.code,
        message: accuracyResult.error!.message,
        details: accuracyResult.error!.details
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============ Zone Containment ============

    // 3. Load zone bbox
    const { bbox, error: zoneError } = await loadZoneBbox(zone_id);
    if (!bbox) {
      await logRejection(auth.userId, 'zones-enter', body, ErrorCode.ZONE_NOT_FOUND, { zone_id });
      return new Response(JSON.stringify({
        ok: false,
        code: ErrorCode.ZONE_NOT_FOUND,
        message: `Zone ${zone_id} not found or inactive`,
        details: { zone_id }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Check spatial containment
    const containmentResult = checkBboxContainment(lat, lng, bbox);
    if (!containmentResult.valid) {
      await logRejection(auth.userId, 'zones-enter', body, containmentResult.error!.code, containmentResult.error!.details);
      return new Response(JSON.stringify({
        ok: false,
        code: containmentResult.error!.code,
        message: containmentResult.error!.message,
        details: containmentResult.error!.details
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============ Write Event ============

    const result = await writeEvent({
      userId: auth.userId,
      eventType: 'zone_entered',
      zoneId: zone_id,
      lat,
      lng,
      accuracyM: accuracy_m,
      dwellMs: dwell_ms,
      payload: { client_ts },
      idempotencyKey: idempotency_key
    });

    if (result.error) {
      return new Response(JSON.stringify({ ok: false, error: result.error }), {
        status: result.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      event_id: result.event?.event_id,
      zone_id,
      ts: result.event?.ts,
      accepted: true,
      isNew: result.isNew
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
