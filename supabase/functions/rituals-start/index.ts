import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { requireUserId } from '../_shared/auth.ts';
import { writeEvent } from '../_shared/event-writer.ts';
import { checkZoneEntryStatus } from '../_shared/validation.ts';

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
    const { zone_id, ritual_type, place_id, lat, lng, accuracy_m, client_ts, idempotency_key } = body;

    if (!zone_id) {
      return new Response(JSON.stringify({ error: 'zone_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!ritual_type || !['presence', 'observation'].includes(ritual_type)) {
      return new Response(JSON.stringify({ error: 'ritual_type must be presence or observation' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!idempotency_key) {
      return new Response(JSON.stringify({ error: 'idempotency_key is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check zone entry status - user must have entered zone first
    const entryCheck = await checkZoneEntryStatus(auth.userId, zone_id);
    if (!entryCheck.entered) {
      return new Response(JSON.stringify({
        ok: false,
        code: entryCheck.error!.code,
        message: entryCheck.error!.message,
        details: entryCheck.error!.details
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate deterministic run_id from idempotency_key for true idempotency
    const encoder = new TextEncoder();
    const data = encoder.encode(`${auth.userId}:${idempotency_key}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const runUuid = `${hashHex.slice(0,8)}-${hashHex.slice(8,12)}-4${hashHex.slice(13,16)}-8${hashHex.slice(17,20)}-${hashHex.slice(20,32)}`;

    const result = await writeEvent({
      userId: auth.userId,
      eventType: 'ritual_started',
      zoneId: zone_id,
      placeId: place_id,
      lat,
      lng,
      accuracyM: accuracy_m,
      payload: {
        run_id: runUuid,
        ritual_type,
        client_ts
      },
      idempotencyKey: idempotency_key
    });

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // CRITICAL: Always return run_id from existing event payload for duplicates
    const returnedRunId = (result.event?.payload as Record<string, unknown>)?.run_id || runUuid;

    return new Response(JSON.stringify({
      event_id: result.event?.event_id,
      run_id: returnedRunId,
      ts: result.event?.ts,
      isNew: result.isNew
    }), {
      status: result.isNew ? 201 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
