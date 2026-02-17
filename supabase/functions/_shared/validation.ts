import { getServiceClient } from './supabase.ts';

// ============ Error Codes ============
export const ErrorCode = {
  // GPS / Coords
  NO_GPS: 'NO_GPS',
  BAD_COORDS: 'BAD_COORDS',
  ACCURACY_TOO_LOW: 'ACCURACY_TOO_LOW',

  // Zone
  OUTSIDE_ZONE: 'OUTSIDE_ZONE',
  ZONE_NOT_FOUND: 'ZONE_NOT_FOUND',
  NOT_ENTERED: 'NOT_ENTERED',

  // Ritual
  DWELL_TOO_SHORT: 'DWELL_TOO_SHORT',
  TOO_SLOW: 'TOO_SLOW',
  BAD_TIMING: 'BAD_TIMING',
  RUN_NOT_FOUND: 'RUN_NOT_FOUND',
  RUN_ALREADY_ENDED: 'RUN_ALREADY_ENDED',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

export interface ValidationError {
  code: ErrorCodeType;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  error?: ValidationError;
}

// ============ Global Constants ============
export const GLOBAL_MAX_ACCURACY_M = 50; // Global accuracy gate

// ============ Coordinate Validation ============

export function validateCoordsSanity(lat: number | null, lng: number | null): ValidationResult {
  if (lat === null || lng === null || lat === undefined || lng === undefined) {
    return {
      valid: false,
      error: { code: ErrorCode.NO_GPS, message: 'lat and lng are required' }
    };
  }

  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return {
      valid: false,
      error: { code: ErrorCode.BAD_COORDS, message: 'lat and lng must be valid numbers' }
    };
  }

  if (lat < -90 || lat > 90) {
    return {
      valid: false,
      error: { code: ErrorCode.BAD_COORDS, message: 'lat must be between -90 and 90', details: { lat } }
    };
  }

  if (lng < -180 || lng > 180) {
    return {
      valid: false,
      error: { code: ErrorCode.BAD_COORDS, message: 'lng must be between -180 and 180', details: { lng } }
    };
  }

  return { valid: true };
}

export function validateAccuracy(accuracy_m: number | null | undefined, max_accuracy_m?: number): ValidationResult {
  const maxAllowed = max_accuracy_m ?? GLOBAL_MAX_ACCURACY_M;

  if (accuracy_m === null || accuracy_m === undefined) {
    return {
      valid: false,
      error: { code: ErrorCode.ACCURACY_TOO_LOW, message: 'accuracy_m is required' }
    };
  }

  if (typeof accuracy_m !== 'number' || isNaN(accuracy_m) || accuracy_m < 0) {
    return {
      valid: false,
      error: { code: ErrorCode.ACCURACY_TOO_LOW, message: 'accuracy_m must be a positive number' }
    };
  }

  if (accuracy_m > maxAllowed) {
    return {
      valid: false,
      error: {
        code: ErrorCode.ACCURACY_TOO_LOW,
        message: `accuracy_m (${accuracy_m}m) exceeds maximum allowed (${maxAllowed}m)`,
        details: { accuracy_m, max_allowed: maxAllowed }
      }
    };
  }

  return { valid: true };
}

// ============ Zone Containment ============

export interface ZoneBbox {
  zone_id: string;
  min_lat: number;
  max_lat: number;
  min_lng: number;
  max_lng: number;
}

export function checkBboxContainment(lat: number, lng: number, bbox: ZoneBbox): ValidationResult {
  const { min_lat, max_lat, min_lng, max_lng } = bbox;

  // Standard bbox check (no dateline wrap for Paris)
  const latInside = lat >= min_lat && lat <= max_lat;
  const lngInside = lng >= min_lng && lng <= max_lng;

  if (!latInside || !lngInside) {
    return {
      valid: false,
      error: {
        code: ErrorCode.OUTSIDE_ZONE,
        message: `Coordinates (${lat}, ${lng}) are outside zone ${bbox.zone_id}`,
        details: {
          lat, lng,
          zone_id: bbox.zone_id,
          bbox: { min_lat, max_lat, min_lng, max_lng }
        }
      }
    };
  }

  return { valid: true };
}

export async function loadZoneBbox(zone_id: string): Promise<{ bbox: ZoneBbox | null; error?: string }> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('zones')
    .select('zone_id, min_lat, max_lat, min_lng, max_lng')
    .eq('zone_id', zone_id)
    .eq('active', true)
    .single();

  if (error || !data) {
    return { bbox: null, error: error?.message || 'Zone not found' };
  }

  return { bbox: data as ZoneBbox };
}

// ============ Zone Entry Check ============

export async function checkZoneEntryStatus(user_id: string, zone_id: string): Promise<{ entered: boolean; error?: ValidationError }> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('zone_progress')
    .select('entered')
    .eq('user_id', user_id)
    .eq('zone_id', zone_id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    return { entered: false, error: { code: ErrorCode.ZONE_NOT_FOUND, message: 'Failed to check zone progress' } };
  }

  if (!data || !data.entered) {
    return {
      entered: false,
      error: {
        code: ErrorCode.NOT_ENTERED,
        message: 'Tu dois d\'abord entrer dans la zone avant de commencer un rituel',
        details: { zone_id }
      }
    };
  }

  return { entered: true };
}

// ============ Ritual Template Validation ============

export interface RitualTemplate {
  ritual_type: string;
  min_dwell_ms: number;
  max_duration_ms: number;
  max_accuracy_m: number;
}

export interface RitualRun {
  run_id: string;
  user_id: string;
  ritual_type: string;
  zone_id: string;
  status: string;
  started_at: string;
}

export async function loadRitualRun(run_id: string, user_id: string): Promise<{ run: RitualRun | null; error?: ValidationError }> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('ritual_runs')
    .select('run_id, user_id, ritual_type, zone_id, status, started_at')
    .eq('run_id', run_id)
    .eq('user_id', user_id)
    .single();

  if (error || !data) {
    return {
      run: null,
      error: { code: ErrorCode.RUN_NOT_FOUND, message: `Ritual run ${run_id} not found for user` }
    };
  }

  if (data.status !== 'started') {
    return {
      run: null,
      error: { code: ErrorCode.RUN_ALREADY_ENDED, message: `Ritual run ${run_id} already ended with status: ${data.status}` }
    };
  }

  return { run: data as RitualRun };
}

export async function loadRitualTemplate(ritual_type: string): Promise<{ template: RitualTemplate | null; error?: ValidationError }> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('ritual_templates')
    .select('ritual_type, min_dwell_ms, max_duration_ms, max_accuracy_m')
    .eq('ritual_type', ritual_type)
    .single();

  if (error || !data) {
    return {
      template: null,
      error: { code: ErrorCode.TEMPLATE_NOT_FOUND, message: `Ritual template ${ritual_type} not found` }
    };
  }

  return { template: data as RitualTemplate };
}

export function validateRitualCompletion(
  dwell_ms: number | null | undefined,
  duration_ms: number,
  accuracy_m: number | null | undefined,
  template: RitualTemplate
): ValidationResult {
  // 1. Accuracy check (use template max or global max)
  const maxAccuracy = Math.min(template.max_accuracy_m, GLOBAL_MAX_ACCURACY_M);
  const accuracyResult = validateAccuracy(accuracy_m, maxAccuracy);
  if (!accuracyResult.valid) {
    return accuracyResult;
  }

  // 2. Dwell check
  if (dwell_ms === null || dwell_ms === undefined || dwell_ms < template.min_dwell_ms) {
    return {
      valid: false,
      error: {
        code: ErrorCode.DWELL_TOO_SHORT,
        message: `dwell_ms (${dwell_ms ?? 0}ms) is less than required (${template.min_dwell_ms}ms)`,
        details: { dwell_ms, min_dwell_ms: template.min_dwell_ms }
      }
    };
  }

  // 3. Duration check (too slow = took too long)
  if (duration_ms > template.max_duration_ms) {
    return {
      valid: false,
      error: {
        code: ErrorCode.TOO_SLOW,
        message: `duration (${duration_ms}ms) exceeds maximum allowed (${template.max_duration_ms}ms)`,
        details: { duration_ms, max_duration_ms: template.max_duration_ms }
      }
    };
  }

  // 4. Timing sanity (negative duration)
  if (duration_ms < 0) {
    return {
      valid: false,
      error: {
        code: ErrorCode.BAD_TIMING,
        message: 'Completion time cannot be before start time',
        details: { duration_ms }
      }
    };
  }

  return { valid: true };
}

export function validateRitualAbort(
  accuracy_m: number | null | undefined,
  duration_ms: number
): ValidationResult {
  // For abort/shortcut: only sanity checks, no dwell requirement

  // 1. Basic accuracy check (global max only, more permissive)
  if (accuracy_m !== null && accuracy_m !== undefined) {
    if (accuracy_m > GLOBAL_MAX_ACCURACY_M * 2) { // 100m max for aborts
      return {
        valid: false,
        error: {
          code: ErrorCode.ACCURACY_TOO_LOW,
          message: `accuracy_m (${accuracy_m}m) is too imprecise even for abort`,
          details: { accuracy_m, max_allowed: GLOBAL_MAX_ACCURACY_M * 2 }
        }
      };
    }
  }

  // 2. Timing sanity
  if (duration_ms < 0) {
    return {
      valid: false,
      error: {
        code: ErrorCode.BAD_TIMING,
        message: 'Abort time cannot be before start time',
        details: { duration_ms }
      }
    };
  }

  return { valid: true };
}

// ============ Rejection Logging ============

export async function logRejection(
  user_id: string,
  endpoint: string,
  attempted_payload: Record<string, unknown>,
  rejection_code: ErrorCodeType,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = getServiceClient();
    await supabase.from('arche_rejections').insert({
      user_id,
      endpoint,
      attempted_payload,
      rejection_code,
      details,
      created_at: new Date().toISOString()
    });
  } catch {
    // Silent fail - rejection logging should not break the flow
  }
}
