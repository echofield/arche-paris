import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { requireUserId } from '../_shared/auth.ts';

/**
 * inscriptions-create — Leave a sentence on a zone
 *
 * Requires: completed ritual in that zone (or zone entry)
 * Rate limit: 3 per zone per day
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

    const body = await req.json();
    const { zone_id, text, display_name, lat, lng } = body;

    // Validation
    if (!zone_id) {
      return new Response(JSON.stringify({
        ok: false,
        code: 'MISSING_ZONE_ID',
        message: 'zone_id is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({
        ok: false,
        code: 'MISSING_TEXT',
        message: 'text is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const trimmedText = text.trim();
    if (trimmedText.length < 5 || trimmedText.length > 140) {
      return new Response(JSON.stringify({
        ok: false,
        code: 'INVALID_TEXT_LENGTH',
        message: 'text must be 5-140 characters'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check zone exists
    const { data: zone } = await supabase
      .from('zones')
      .select('zone_id')
      .eq('zone_id', zone_id)
      .eq('active', true)
      .single();

    if (!zone) {
      return new Response(JSON.stringify({
        ok: false,
        code: 'ZONE_NOT_FOUND',
        message: `Zone ${zone_id} not found`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check user has entered this zone (earned the right to inscribe)
    const { data: progress } = await supabase
      .from('zone_progress')
      .select('entered')
      .eq('user_id', auth.userId)
      .eq('zone_id', zone_id)
      .single();

    if (!progress?.entered) {
      return new Response(JSON.stringify({
        ok: false,
        code: 'NOT_ENTERED',
        message: 'You must enter this zone before leaving an inscription'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Insert inscription
    const { data: inscription, error: insertError } = await supabase
      .from('zone_inscriptions')
      .insert({
        zone_id,
        user_id: auth.userId,
        text: trimmedText,
        display_name: display_name?.trim() || null,
        lat: lat ?? null,
        lng: lng ?? null,
        status: 'visible'
      })
      .select('inscription_id, created_at')
      .single();

    if (insertError) {
      // Rate limit hit (unique constraint on user_id, zone_id, date)
      if (insertError.code === '23505') {
        return new Response(JSON.stringify({
          ok: false,
          code: 'RATE_LIMIT',
          message: 'Maximum 3 inscriptions per zone per day'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw insertError;
    }

    return new Response(JSON.stringify({
      ok: true,
      inscription_id: inscription.inscription_id,
      zone_id,
      created_at: inscription.created_at
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
