import { getServiceClient } from './supabase.ts';

const CANONICAL_EVENTS = new Set([
  'zone_entered', 'zone_revealed', 'zone_awakened',
  'ritual_started', 'ritual_completed', 'ritual_aborted', 'ritual_shortcut',
  'engraving_created', 'path_recorded',
  'challenge_created', 'challenge_attempt_started', 'challenge_attempt_completed', 'challenge_attempt_aborted',
  'custody_claimed', 'custody_lost'
]);

export interface WriteEventParams {
  userId: string;
  eventType: string;
  zoneId?: string | null;
  placeId?: string | null;
  lat?: number | null;
  lng?: number | null;
  accuracyM?: number | null;
  dwellMs?: number | null;
  payload?: Record<string, unknown>;
  idempotencyKey: string;
  requestId?: string | null;
}

export interface WriteEventResult {
  event?: Record<string, unknown>;
  isNew?: boolean;
  error?: string;
  status?: number;
}

export async function writeEvent(params: WriteEventParams): Promise<WriteEventResult> {
  const {
    userId,
    eventType,
    zoneId = null,
    placeId = null,
    lat = null,
    lng = null,
    accuracyM = null,
    dwellMs = null,
    payload = {},
    idempotencyKey,
    requestId = null
  } = params;

  if (!CANONICAL_EVENTS.has(eventType)) {
    return { error: `Invalid event_type: ${eventType}`, status: 400 };
  }

  if (!idempotencyKey) {
    return { error: 'idempotency_key is required', status: 400 };
  }

  const reqId = requestId || crypto.randomUUID();
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('arche_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      zone_id: zoneId,
      place_id: placeId,
      lat,
      lng,
      accuracy_m: accuracyM,
      dwell_ms: dwellMs,
      payload,
      idempotency_key: idempotencyKey,
      request_id: reqId
    })
    .select()
    .single();

  if (error) {
    // Check for duplicate (23505 = unique_violation)
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('arche_events')
        .select('*')
        .eq('user_id', userId)
        .eq('idempotency_key', idempotencyKey)
        .single();

      return { event: existing, isNew: false };
    }
    return { error: error.message, status: 500 };
  }

  return { event: data, isNew: true };
}

export { CANONICAL_EVENTS };
