import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { requireUserId } from '../_shared/auth.ts';

/**
 * zone-progress — Get user's progress across all zones
 *
 * Returns: array of zone progress with objectives
 */

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all zone progress for user
    const { data: progress, error: progressError } = await supabase
      .from('zone_progress')
      .select(`
        zone_id,
        entered,
        entered_at,
        presence_ritual,
        presence_ritual_at,
        observation_ritual,
        observation_ritual_at,
        engraved,
        engraved_at,
        is_custodian,
        custodian_since,
        objectives_complete,
        updated_at
      `)
      .eq('user_id', auth.userId)
      .order('updated_at', { ascending: false });

    if (progressError) throw progressError;

    // Get user complexion
    const { data: complexion } = await supabase
      .from('user_complexion')
      .select('presence_points, wisdom_points, shadow_points, completed_rituals_count, revealed')
      .eq('user_id', auth.userId)
      .single();

    // Calculate totals
    const zones = progress ?? [];
    const stats = {
      total_zones_touched: zones.length,
      total_objectives: zones.reduce((sum, z) => sum + (z.objectives_complete || 0), 0),
      zones_complete: zones.filter(z => z.objectives_complete === 5).length,
      total_rituals: zones.filter(z => z.presence_ritual || z.observation_ritual).length,
      total_engravings: zones.filter(z => z.engraved).length,
      custodianships: zones.filter(z => z.is_custodian).length
    };

    return new Response(JSON.stringify({
      ok: true,
      zones,
      stats,
      complexion: complexion ?? {
        presence_points: 0,
        wisdom_points: 0,
        shadow_points: 0,
        completed_rituals_count: 0,
        revealed: false
      }
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
