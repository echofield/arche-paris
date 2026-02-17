import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { requireUserId } from '../_shared/auth.ts';
import { writeEvent } from '../_shared/event-writer.ts';
import {
  loadRitualRun,
  validateRitualAbort,
  logRejection
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
    const { run_id, zone_id, reason, accuracy_m, client_ts, idempotency_key } = body;

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
      await logRejection(auth.userId, 'rituals-shortcut', body, runError!.code, { run_id });
      return new Response(JSON.stringify({
        ok: false,
        code: runError!.code,
        message: runError!.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============ Calculate Duration + Sanity Check ============

    const now = new Date();
    const startedAt = new Date(run.started_at);
    const duration_ms = now.getTime() - startedAt.getTime();

    const shortcutResult = validateRitualAbort(accuracy_m, duration_ms);
    if (!shortcutResult.valid) {
      await logRejection(auth.userId, 'rituals-shortcut', body, shortcutResult.error!.code, {
        ...shortcutResult.error!.details,
        run_id,
        duration_ms
      });
      return new Response(JSON.stringify({
        ok: false,
        code: shortcutResult.error!.code,
        message: shortcutResult.error!.message,
        details: shortcutResult.error!.details
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============ Write Event ============

    const result = await writeEvent({
      userId: auth.userId,
      eventType: 'ritual_shortcut',
      zoneId: zone_id || run.zone_id,
      payload: { run_id, reason, client_ts, duration_ms },
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
      run_id,
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
