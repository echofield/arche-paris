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
    const { attempt_id, challenge_id, reason, client_ts, idempotency_key } = body;

    if (!attempt_id) {
      return new Response(JSON.stringify({ error: 'attempt_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!challenge_id) {
      return new Response(JSON.stringify({ error: 'challenge_id is required' }), {
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

    const result = await writeEvent({
      userId: auth.userId,
      eventType: 'challenge_attempt_aborted',
      payload: { attempt_id, challenge_id, reason, client_ts },
      idempotencyKey: idempotency_key
    });

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      event_id: result.event?.event_id,
      attempt_id,
      challenge_id,
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
