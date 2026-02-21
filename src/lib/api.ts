/**
 * ARCHÉ Tiny Seed v0.1 API Client
 * Wraps Supabase Edge Functions for type-safe calls
 */
import { supabase } from '@/utils/supabase/client';
import { getSessionCardCode } from '@/utils/card-gate-client';

type ApiResult<T> = { data: T; error: null } | { data: null; error: string };

async function invoke<T>(
  fn: string,
  body?: Record<string, unknown>,
  options?: { includeCardHeader?: boolean; requireUserSession?: boolean }
): Promise<ApiResult<T>> {
  const includeCardHeader = options?.includeCardHeader ?? true;
  const requireUserSession = options?.requireUserSession ?? false;
  if (requireUserSession) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      return { data: null, error: 'AUTH_SKIPPED_NO_USER_SESSION' };
    }
  }
  const cardCode = getSessionCardCode();
  const headers = includeCardHeader && cardCode ? { 'X-ARCHE-CARD-CODE': cardCode } : undefined;
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
  return invokeCardGateRequest<T>('GET', path);
}

async function invokeCardGateRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>
): Promise<ApiResult<T>> {
  try {
    const cardCode = getSessionCardCode();
    const headers: Record<string, string> = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (cardCode) headers['X-ARCHE-CARD-CODE'] = cardCode;
    const res = await fetch(`/api/card-gate/${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
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

export interface LawRequirement {
  type: string;
  status?: 'ok' | 'missing' | 'blocked';
  min?: number;
  within_minutes?: number;
  count?: number;
}

export interface LawEvaluateData {
  allowed: boolean;
  reason_code: 'OK' | 'AUTH_REQUIRED' | 'UNKNOWN_ZONE' | 'NEEDS_ACTIVATION' | 'SILENCE_WINDOW' | 'COOLDOWN_ACTIVE' | 'THRESHOLD_NOT_MET' | string;
  message: string;
  next_unlock_hint?: string | null;
  retry_after_seconds?: number;
  requirements: LawRequirement[];
  policy: {
    law_version: string;
    intent: string;
  };
  context: {
    h3: string;
    zone_id?: string;
  } | null;
}

export interface WorldZoneSnapshot {
  h3: string;
  title: string;
  fog: { level: number };
  anchors?: Array<{ id: string; type: string }>;
  signals: {
    inscriptions_recent: number;
    champ_recent: number;
    whisper?: string | null;
  };
  law: Record<string, LawEvaluateData>;
}

export interface WorldMeZoneProgress {
  zone_id: string;
  entered: boolean;
  entered_at: string | null;
  engraved: boolean;
  engraved_at: string | null;
}

export interface WorldMeZoneOverlay {
  progress: WorldMeZoneProgress | null;
  activation: LawEvaluateData | null;
  presence?: {
    pulses_20m: number;
    last_ts: string | null;
  };
}

/** Mon Paris entry line — always present, one sentence, optional link. */
export interface MonParisEntry {
  text: string;
  link?: { label: string; href: string };
  code?: string;
}

/** Mon Paris reading card — optional, one sentence, daily gated. */
export interface MonParisReading {
  layer: 'TRACE' | 'RELATION' | 'ECHO';
  text: string;
  code?: string;
}

/** Mon Paris state — entry (always) + optional reading. */
export interface MonParisState {
  entry: MonParisEntry;
  reading?: MonParisReading;
}

/** Passport (civic participation) — snapshot only. */
export interface PassportSnapshot {
  hasPassport: boolean;
  since: string | null;
  tier?: 'standard' | 'founder' | null;
}

/** Last allocation from the fund (redistribution proof). */
export interface LastAllocation {
  kind: string;
  date: string;
  proofId?: string;
}

/** Fund (Fonds) — redistribution ledger. */
export interface FundSnapshot {
  enabled: boolean;
  total: number;
  lastAllocation?: LastAllocation;
  userContribution?: number;
  monumentPhase: 'reserve' | 'chamber' | 'sanctuary' | 'archive';
}

/** Reliquaire — civic object for passport holders; statueKey/phaseKey drives geometry variant. */
export interface ReliquaireSnapshot {
  status: string;
  hint?: string | null;
  statueKey?: string | null;
  phaseKey?: string;
}

/** Single source of truth for Aura page. Backend projects this from events/aura_profiles. */
export interface AuraSnapshot {
  mode: 'seek' | 'scan' | 'archive' | 'ritual';
  title: string;
  nextTitle?: string | null;
  axes: {
    clarte: number;
    anchorage: number;
    echo: number;
    mouvement: number;
    alignement: number;
    ombre: number;
  };
  reading: { cycle: number; tension: number; trend: -1 | 0 | 1; waveSeed: string };
  vestige: {
    status: 'none' | 'detected' | 'crystallizing' | 'figure' | 'named';
    hint?: string | null;
    statueKey?: string | null;
    revealLocked?: boolean;
  };
  questCallout: {
    id: string;
    title: string;
    subtitle?: string | null;
    ctaLabel: string;
    action: 'open_oracle' | 'open_place' | 'open_map' | 'none';
    locked?: boolean;
    reasonLocked?: string | null;
  } | null;
  oracle: {
    eligible: boolean;
    message: string | null;
    source: 'daily' | 'event' | 'manual';
    cooldownEndsAt: string | null;
  };
  seals: string[];
  reliquaire?: ReliquaireSnapshot;
}

export interface WorldSnapshotData {
  now: string;
  policy: {
    world_version: string;
    cache: { public_s_maxage: number; public_swr: number };
  };
  world: {
    zones: WorldZoneSnapshot[];
    map: { inscriptions: Array<{ id: string; h3: string; ts: string; excerpt: string }> };
    champ: { items: Array<{ id: string; h3: string; ts: string; excerpt: string }> };
  };
  me: {
    authenticated: boolean;
    card_id: string | null;
    zones: Record<string, WorldMeZoneOverlay>;
    character?: {
      id: string;
      name: string;
      lines: string[];
      echo?: {
        location_hint: string;
        symbol: string;
      };
    } | null;
    /** Present when backend extends world/snapshot with me.aura (single source of truth for Aura page). */
    aura?: AuraSnapshot;
    /** Mon Paris entry line + optional reading card; deterministic from snapshot. */
    monParis?: MonParisState;
    /** Passport (civic participation); enables PassportLayerModule when hasPassport && fund.enabled. */
    passport?: PassportSnapshot;
    /** Fund (Fonds) redistribution ledger; module renders only when passport.hasPassport && fund.enabled. */
    fund?: FundSnapshot;
  };
}

export interface PresencePulseData {
  ok: boolean;
  accepted: boolean;
  cooldown_ms: number;
  retry_after_ms?: number;
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

  meComplexion: () =>
    invoke<ComplexionData>('me-complexion', undefined, {
      includeCardHeader: false,
      requireUserSession: true,
    }),

  // Feed
  feedNext: (params?: { lat?: number; lng?: number }) =>
    invoke<FeedNextData>('feed-next', params),

  zoneConsciousness: (h3: string) =>
    invokeCardGate<ZoneConsciousnessData>(`zone-consciousness?h3=${encodeURIComponent(h3)}`),

  lawEvaluate: (intent: string, h3: string) =>
    invokeCardGate<LawEvaluateData>(`law/evaluate?intent=${encodeURIComponent(intent)}&h3=${encodeURIComponent(h3)}`),

  presencePulse: (params: {
    h3: string;
    ts?: string;
    speed_mps?: number;
    accuracy_m?: number;
  }) => invokeCardGateRequest<PresencePulseData>('POST', 'presence/pulse', params),

  worldSnapshot: (params?: {
    bbox?: string;
    h3_center?: string;
    k?: number;
    include?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.bbox) qs.set('bbox', params.bbox);
    if (params?.h3_center) qs.set('h3_center', params.h3_center);
    if (typeof params?.k === 'number') qs.set('k', String(params.k));
    if (params?.include) qs.set('include', params.include);
    const tail = qs.toString();
    return invokeCardGate<WorldSnapshotData>(`world/snapshot${tail ? `?${tail}` : ''}`);
  },

  worldSnapshotForZone: (h3: string, include: string = 'law,map,champ') =>
    api.worldSnapshot({ include, h3_center: h3, k: 0 }),

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
