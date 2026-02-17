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

    const supabase = getServiceClient();

    const { data: complexion, error } = await supabase
      .from('user_complexion')
      .select('*')
      .eq('user_id', auth.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = complexion || {
      presence_points: 0,
      wisdom_points: 0,
      shadow_points: 0,
      completed_rituals_count: 0,
      revealed: false,
      last_delta: {}
    };

    const { presence_points, wisdom_points, shadow_points } = result;
    const total = presence_points + wisdom_points + shadow_points;

    let dominant = null;
    if (total > 0) {
      if (presence_points >= wisdom_points && presence_points >= shadow_points) {
        dominant = 'presence';
      } else if (wisdom_points >= presence_points && wisdom_points >= shadow_points) {
        dominant = 'wisdom';
      } else {
        dominant = 'shadow';
      }
    }

    return new Response(JSON.stringify({
      presence_points: result.presence_points,
      wisdom_points: result.wisdom_points,
      shadow_points: result.shadow_points,
      total_points: total,
      completed_rituals_count: result.completed_rituals_count,
      revealed: result.revealed,
      dominant_axis: dominant,
      last_delta: result.last_delta,
      updated_at: result.updated_at
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
