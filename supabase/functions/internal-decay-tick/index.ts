import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';
import { writeEvent } from '../_shared/event-writer.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify internal secret
    const internalSecret = Deno.env.get('INTERNAL_SECRET') || Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization');
    const providedSecret = authHeader?.replace('Bearer ', '') || req.headers.get('x-internal-secret');

    if (!internalSecret) {
      return new Response(JSON.stringify({ error: 'INTERNAL_SECRET not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (providedSecret !== internalSecret) {
      return new Response(JSON.stringify({ error: 'Invalid internal secret' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = getServiceClient();
    const now = new Date().toISOString();

    // Find expired custodianships
    const { data: expired, error: fetchError } = await supabase
      .from('zone_custodians')
      .select('zone_id, user_id')
      .eq('active', true)
      .lt('expires_at', now);

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!expired || expired.length === 0) {
      return new Response(JSON.stringify({
        processed: 0,
        message: 'No expired custodianships'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Emit custody_lost events
    const results: any[] = [];
    for (const custody of expired) {
      const idempotencyKey = `decay:${custody.zone_id}:${custody.user_id}:${now.slice(0, 10)}`;

      const eventResult = await writeEvent({
        userId: custody.user_id,
        eventType: 'custody_lost',
        zoneId: custody.zone_id,
        payload: { reason: 'expired', decay_tick_ts: now },
        idempotencyKey
      });

      results.push({
        zone_id: custody.zone_id,
        user_id: custody.user_id,
        success: !eventResult.error,
        isNew: eventResult.isNew
      });
    }

    const processed = results.filter(r => r.success && r.isNew).length;

    return new Response(JSON.stringify({
      processed,
      total_expired: expired.length,
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
