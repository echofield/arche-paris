/**
 * ARCHÉ Tiny Seed v0.1 API Client
 * Wraps Supabase Edge Functions for type-safe calls
 */
import { supabase } from '@/utils/supabase/client';

type ApiResult<T> = { data: T; error: null } | { data: null; error: string };

function getRuntimeCardCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('arche_card_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { code?: string; card_id?: string };
    if (typeof parsed?.code === 'string' && parsed.code.trim()) return parsed.code.trim();
    if (typeof parsed?.card_id === 'string' && parsed.card_id.trim()) return parsed.card_id.trim();
    return null;
  } catch {
    return null;
  }
}

async function invoke<T>(fn: string, body?: Record<string, unknown>): Promise<ApiResult<T>> {
  const cardCode = getRuntimeCardCode();
  const headers = cardCode ? { 'X-ARCHE-CARD-CODE': cardCode } : undefined;
  const { data, error } = await supabase.functions.invoke(fn, {
    body: body ? JSON.stringify(body) : undefined,
    headers,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as T, error: null };
}

async function invokeCardGate<T>(path: string): Promise<ApiResult<T>> {
  try {
    const cardCode = getRuntimeCardCode();
    const headers: Record<string, string> = {};
    if (cardCode) headers['X-ARCHE-CARD-CODE'] = cardCode;
    const res = await fetch(`/api/card-gate/${path}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: data?.error ?? `Card Gate ${res.status}` };
    }
    return { data: data as T, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Card Gate request failed' };
  }
}

// ============ Types ============

export interface EventResponse {
  event_id: string;
  ts: string;
  isNew: boolean;
}

export interface RitualStartResponse extends EventResponse {
  run_id: string;
}

export interface RitualEndResponse extends EventResponse {
  run_id: string;
  zone_progress?: ZoneProgressItem;
  complexion?: {
    presence_points: number;
    wisdom_points: number;
    shadow_points: number;
    completed_rituals_count: number;
  };
}

export interface EngravingResponse extends EventResponse {
  engraving_id: string;
}

export interface PathResponse extends EventResponse {
  path_id: string;
}

export interface ChallengeResponse extends EventResponse {
  challenge_id: string;
}

export interface AttemptResponse extends EventResponse {
  attempt_id: string;
  challenge_id: string;
}

export interface ZoneMapData {
  zones: Record<string, {
    state: 'unknown' | 'revealed' | 'awakened';
    first_entered_at: string | null;
    revealed_at: string | null;
    awakened_at: string | null;
    engravings: { stamp_id: string; created_at: string }[];
    resonance_score: number;
    is_custodian: boolean;
    custody_expires_at?: string;
  }>;
  stats: {
    total_zones: number;
    revealed: number;
    awakened: number;
    total_engravings: number;
    custodianships: number;
  };
}

export interface LedgerData {
  day: string;
  event_count: number;
  summary: Record<string, number>;
  events: Array<{
    event_id: string;
    event_type: string;
    zone_id: string | null;
    ts: string;
    payload: Record<string, unknown>;
  }>;
}

export interface ComplexionData {
  presence_points: number;
  wisdom_points: number;
  shadow_points: number;
  study_points?: number;
  student_rank?: number;
  total_points: number;
  completed_rituals_count: number;
  revealed: boolean;
  dominant_axis: 'presence' | 'wisdom' | 'shadow' | null;
  last_delta: Record<string, unknown>;
  updated_at: string;
}

export interface FeedNextData {
  why_line: string;
  target_zone_id: string | null;
  target_zone_center: { lat: number; lng: number } | null;
  distance_m: number | null;
  recommended_ritual: string;
  requirements: string[];
}

export interface ZoneConsciousnessData {
  ok: boolean;
  h3: string;
  zone_id: string;
  derived_from: string;
  metrics: {
    entropy: number;
    resonance: number;
    unresolved_threads: number;
    unresolved_ritual_threads: number;
    unresolved_challenge_threads: number;
    guardian_decay: number;
  };
  zone_state: {
    phase: 'dormant' | 'stirring' | 'resonant' | 'volatile';
    total_events: number;
    last_event_at: string | null;
    revealed_events: number;
    awakened_events: number;
    ritual_completion_ratio: number;
    active_guardians: number;
  };
  replay: {
    event_summary: Record<string, number>;
  };
}

export interface ZoneProgressItem {
  zone_id: string;
  entered: boolean;
  entered_at: string | null;
  presence_ritual: boolean;
  presence_ritual_at: string | null;
  observation_ritual: boolean;
  observation_ritual_at: string | null;
  engraved: boolean;
  engraved_at: string | null;
  is_custodian: boolean;
  custodian_since: string | null;
  custody_expires_at?: string | null;
  objectives_complete: number;
  updated_at: string;
}

export interface ZoneProgressData {
  zones: ZoneProgressItem[];
  stats: {
    total_zones_touched: number;
    total_objectives: number;
    zones_complete: number;
    total_rituals: number;
    total_engravings: number;
    custodianships: number;
  };
  complexion: {
    presence_points: number;
    wisdom_points: number;
    shadow_points: number;
    completed_rituals_count: number;
    revealed: boolean;
  };
}

export interface Inscription {
  inscription_id: string;
  text: string;
  display_name: string | null;
  created_at: string;
}

export interface InscriptionListData {
  zone_id: string;
  inscriptions: Inscription[];
  total: number;
  limit: number;
  offset: number;
}

export interface InscriptionCreateResponse {
  inscription_id: string;
  zone_id: string;
  created_at: string;
}

// ============ API Methods ============

export const api = {
  // Zones
  zonesEnter: (params: {
    zone_id: string;
    lat?: number;
    lng?: number;
    accuracy_m?: number;
    dwell_ms?: number;
    client_ts?: string;
    idempotency_key: string;
  }) => invoke<EventResponse>('zones-enter', params),

  // Rituals
  ritualsStart: (params: {
    zone_id: string;
    ritual_type: 'presence' | 'observation';
    place_id?: string;
    lat?: number;
    lng?: number;
    accuracy_m?: number;
    client_ts?: string;
    idempotency_key: string;
  }) => invoke<RitualStartResponse>('rituals-start', params),

  ritualsComplete: (params: {
    run_id: string;
    zone_id?: string;
    dwell_ms?: number;
    lat?: number;
    lng?: number;
    accuracy_m?: number;
    response?: Record<string, unknown>;
    client_ts?: string;
    idempotency_key: string;
  }) => invoke<RitualEndResponse>('rituals-complete', params),

  ritualsAbort: (params: {
    run_id: string;
    zone_id?: string;
    reason?: string;
    client_ts?: string;
    idempotency_key: string;
  }) => invoke<RitualEndResponse>('rituals-abort', params),

  ritualsShortcut: (params: {
    run_id: string;
    zone_id?: string;
    reason?: string;
    client_ts?: string;
    idempotency_key: string;
  }) => invoke<RitualEndResponse>('rituals-shortcut', params),

  // Engravings
  engravingsCreate: (params: {
    run_id: string;
    zone_id: string;
    stamp_id: string;
    client_ts?: string;
    idempotency_key: string;
  }) => invoke<EngravingResponse>('engravings-create', params),

  // Paths
  pathsRecord: (params: {
    name?: string;
    from_event_id: string;
    to_event_id: string;
    metrics?: Record<string, unknown>;
    client_ts?: string;
    idempotency_key: string;
  }) => invoke<PathResponse>('paths-record', params),

  // Challenges
  challengesCreate: (params: {
    path_id: string;
    title?: string;
    rules?: Record<string, unknown>;
    client_ts?: string;
    idempotency_key: string;
  }) => invoke<ChallengeResponse>('challenges-create', params),

  challengeAttemptStart: (params: {
    challenge_id: string;
    client_ts?: string;
    idempotency_key: string;
  }) => invoke<AttemptResponse>('challenge-attempt-start', params),

  challengeAttemptComplete: (params: {
    attempt_id: string;
    challenge_id: string;
    score_inputs?: Record<string, unknown>;
    client_ts?: string;
    idempotency_key: string;
  }) => invoke<AttemptResponse>('challenge-attempt-complete', params),

  challengeAttemptAbort: (params: {
    attempt_id: string;
    challenge_id: string;
    reason?: string;
    client_ts?: string;
    idempotency_key: string;
  }) => invoke<AttemptResponse>('challenge-attempt-abort', params),

  // User data
  meArchiveMap: () => invoke<ZoneMapData>('me-archive-map'),

  meArchiveLedger: (day: string) =>
    invoke<LedgerData>('me-archive-ledger', { day }),

  meComplexion: () => invoke<ComplexionData>('me-complexion'),

  // Feed
  feedNext: (params?: { lat?: number; lng?: number }) =>
    invoke<FeedNextData>('feed-next', params),

  zoneConsciousness: (h3: string) =>
    invokeCardGate<ZoneConsciousnessData>(`zone-consciousness?h3=${encodeURIComponent(h3)}`),

  // Zone Progress
  zoneProgress: () => invokeCardGate<ZoneProgressData>('zone-progress'),

  // Inscriptions
  inscriptionsCreate: (params: {
    zone_id: string;
    text: string;
    display_name?: string;
    lat?: number;
    lng?: number;
  }) => invoke<InscriptionCreateResponse>('inscriptions-create', params),

  inscriptionsList: (zone_id: string, limit?: number, offset?: number) =>
    invoke<InscriptionListData>('inscriptions-list', { zone_id, limit, offset }),

  // Decision Nodes (silent Aura modification)
  decisionMade: (params: {
    zone_id?: string;
    node_id: string;
    choice: string;
    d_presence?: number;
    d_wisdom?: number;
    d_shadow?: number;
    lat?: number;
    lng?: number;
    accuracy_m?: number;
    client_ts?: string;
    idempotency_key: string;
  }) => invoke<{ ok: boolean; event_id?: string; isNew?: boolean }>('decision-made', params),
};

// ============ Helpers ============

export function generateIdempotencyKey(prefix: string): string {
  return `${prefix}:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
}

export function clientTs(): string {
  return new Date().toISOString();
}
