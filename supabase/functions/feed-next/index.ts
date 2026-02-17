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
    const userLat = parseFloat(url.searchParams.get('lat') || '') || null;
    const userLng = parseFloat(url.searchParams.get('lng') || '') || null;

    const supabase = getServiceClient();

    const [complexionRes, zoneStatesRes, zonesRes] = await Promise.all([
      supabase.from('user_complexion').select('*').eq('user_id', auth.userId).single(),
      supabase.from('user_zone_state').select('zone_id, state').eq('user_id', auth.userId),
      supabase.from('zones').select('*').eq('active', true)
    ]);

    const complexion = complexionRes.data;
    const zoneStates = zoneStatesRes.data || [];
    const zones = zonesRes.data || [];

    if (zones.length === 0) {
      return new Response(JSON.stringify({
        why_line: 'Explore the city to discover hidden zones.',
        target_zone_id: null,
        distance_m: null,
        recommended_ritual: 'presence',
        requirements: []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stateMap: Record<string, string> = {};
    for (const z of zoneStates) {
      stateMap[z.zone_id] = z.state;
    }

    // Find zones not yet awakened
    const candidates: any[] = [];
    for (const zone of zones) {
      const state = stateMap[zone.zone_id] || 'unknown';
      if (state !== 'awakened') {
        let distance = null;
        if (userLat && userLng) {
          distance = haversineDistance(userLat, userLng, zone.center_lat, zone.center_lng);
        }
        candidates.push({ ...zone, state, distance });
      }
    }

    // Sort: revealed first, then by distance
    candidates.sort((a, b) => {
      const stateOrder: Record<string, number> = { revealed: 0, unknown: 1 };
      const aOrder = stateOrder[a.state] ?? 2;
      const bOrder = stateOrder[b.state] ?? 2;
      if (aOrder !== bOrder) return aOrder - bOrder;
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      return 0;
    });

    const target = candidates[0] || null;

    // Generate why_line
    let whyLine = 'A new zone awaits your presence.';
    const ritualCount = complexion?.completed_rituals_count || 0;

    if (ritualCount === 0) {
      whyLine = 'Begin your journey. Find a zone and perform your first ritual.';
    } else if (ritualCount < 5) {
      whyLine = 'Continue building your connection to the city.';
    } else if (!complexion?.revealed) {
      whyLine = 'You are close to revealing your true complexion.';
    } else {
      const dominant = getDominantAxis(complexion);
      const lines: Record<string, string> = {
        presence: 'Your presence resonates. Seek zones that call to you.',
        wisdom: 'Your wisdom grows. Observe what others miss.',
        shadow: 'The shadow path unfolds. Embrace the hidden corners.'
      };
      whyLine = lines[dominant] || whyLine;
    }

    const requirements: string[] = [];
    if (target?.state === 'unknown') {
      requirements.push('Enter the zone to reveal it');
    }
    if (target?.state === 'revealed') {
      requirements.push('Complete a ritual to awaken the zone');
    }

    return new Response(JSON.stringify({
      why_line: whyLine,
      target_zone_id: target?.zone_id || null,
      target_zone_center: target ? { lat: target.center_lat, lng: target.center_lng } : null,
      distance_m: target?.distance ? Math.round(target.distance) : null,
      recommended_ritual: 'presence',
      requirements
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

function getDominantAxis(complexion: any): string {
  if (!complexion) return 'presence';
  const { presence_points, wisdom_points, shadow_points } = complexion;
  if (presence_points >= wisdom_points && presence_points >= shadow_points) return 'presence';
  if (wisdom_points >= presence_points && wisdom_points >= shadow_points) return 'wisdom';
  return 'shadow';
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * Math.PI / 180;
}
