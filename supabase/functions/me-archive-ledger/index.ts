import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { requireUserId } from '../_shared/auth.ts';
import { getServiceClient } from '../_shared/supabase.ts';

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

    const url = new URL(req.url);
    const day = url.searchParams.get('day');

    if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      return new Response(JSON.stringify({ error: 'day query param required in YYYY-MM-DD format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const dayStart = `${day}T00:00:00.000Z`;
    const dayEnd = `${day}T23:59:59.999Z`;

    const supabase = getServiceClient();

    const { data: events, error } = await supabase
      .from('arche_events')
      .select('event_id, event_type, zone_id, place_id, ts, lat, lng, dwell_ms, payload')
      .eq('user_id', auth.userId)
      .gte('ts', dayStart)
      .lte('ts', dayEnd)
      .order('ts', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const summary: Record<string, number> = {};
    for (const e of events || []) {
      summary[e.event_type] = (summary[e.event_type] || 0) + 1;
    }

    return new Response(JSON.stringify({
      day,
      event_count: events?.length || 0,
      summary,
      events: events || []
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
