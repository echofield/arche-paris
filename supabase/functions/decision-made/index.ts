/**
 * ARCHÉ — Decision Made
 * Records a player decision at a Decision Node.
 * Silently applies Aura deltas via event projector.
 * No feedback to player about the actual delta values.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { requireUserId } from '../_shared/auth.ts';
import { writeEvent } from '../_shared/event-writer.ts';

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
    const {
      zone_id,
      node_id,
      choice,
      d_presence = 0,
      d_wisdom = 0,
      d_shadow = 0,
      lat,
      lng,
      accuracy_m,
      client_ts,
      idempotency_key
    } = body;

    // Validate required fields
    if (!node_id) {
      return new Response(JSON.stringify({ ok: false, code: 'MISSING_NODE_ID', message: 'node_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!choice) {
      return new Response(JSON.stringify({ ok: false, code: 'MISSING_CHOICE', message: 'choice is required' }), {
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

    // Write decision event (projector handles Aura delta application silently)
    const result = await writeEvent({
      userId: auth.userId,
      eventType: 'decision_made',
      zoneId: zone_id || null,
      lat,
      lng,
      accuracyM: accuracy_m,
      payload: {
        node_id,
        choice,
        d_presence,
        d_wisdom,
        d_shadow,
        client_ts
      },
      idempotencyKey: idempotency_key
    });

    if (result.error) {
      return new Response(JSON.stringify({ ok: false, error: result.error }), {
        status: result.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Return minimal response - no delta feedback to player
    return new Response(JSON.stringify({
      ok: true,
      event_id: result.event?.event_id,
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
