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

    const [zoneStatesRes, engravingsRes, resonanceRes, custodianshipsRes] = await Promise.all([
      supabase.from('user_zone_state')
        .select('zone_id, state, first_entered_at, revealed_at, awakened_at')
        .eq('user_id', auth.userId),
      supabase.from('engravings')
        .select('zone_id, stamp_id, created_at')
        .eq('user_id', auth.userId),
      supabase.from('zone_resonance')
        .select('zone_id, resonance_score')
        .eq('user_id', auth.userId),
      supabase.from('zone_custodians')
        .select('zone_id, claimed_at, expires_at')
        .eq('user_id', auth.userId)
        .eq('active', true)
    ]);

    const zoneStates = zoneStatesRes.data || [];
    const engravings = engravingsRes.data || [];
    const resonance = resonanceRes.data || [];
    const custodianships = custodianshipsRes.data || [];

    // Build map by zone
    const zoneMap: Record<string, any> = {};

    for (const z of zoneStates) {
      zoneMap[z.zone_id] = {
        state: z.state,
        first_entered_at: z.first_entered_at,
        revealed_at: z.revealed_at,
        awakened_at: z.awakened_at,
        engravings: [],
        resonance_score: 0,
        is_custodian: false
      };
    }

    for (const e of engravings) {
      if (zoneMap[e.zone_id]) {
        zoneMap[e.zone_id].engravings.push({ stamp_id: e.stamp_id, created_at: e.created_at });
      }
    }

    for (const r of resonance) {
      if (zoneMap[r.zone_id]) {
        zoneMap[r.zone_id].resonance_score = r.resonance_score;
      }
    }

    for (const c of custodianships) {
      if (zoneMap[c.zone_id]) {
        zoneMap[c.zone_id].is_custodian = true;
        zoneMap[c.zone_id].custody_expires_at = c.expires_at;
      }
    }

    const stats = {
      total_zones: Object.keys(zoneMap).length,
      revealed: Object.values(zoneMap).filter((z: any) => z.state === 'revealed' || z.state === 'awakened').length,
      awakened: Object.values(zoneMap).filter((z: any) => z.state === 'awakened').length,
      total_engravings: engravings.length,
      custodianships: custodianships.length
    };

    return new Response(JSON.stringify({ zones: zoneMap, stats }), {
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
