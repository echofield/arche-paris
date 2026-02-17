import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * inscriptions-list — Get inscriptions for a zone
 *
 * Public endpoint (no auth required)
 * Returns visible inscriptions, most recent first
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const zone_id = url.searchParams.get('zone_id');
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 50);
    const offset = parseInt(url.searchParams.get('offset') ?? '0');

    if (!zone_id) {
      return new Response(JSON.stringify({
        ok: false,
        code: 'MISSING_ZONE_ID',
        message: 'zone_id query param is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: inscriptions, error } = await supabase
      .from('zone_inscriptions')
      .select('inscription_id, text, display_name, created_at')
      .eq('zone_id', zone_id)
      .eq('status', 'visible')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get total count for pagination
    const { count } = await supabase
      .from('zone_inscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('zone_id', zone_id)
      .eq('status', 'visible');

    return new Response(JSON.stringify({
      ok: true,
      zone_id,
      inscriptions: inscriptions ?? [],
      total: count ?? 0,
      limit,
      offset
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
