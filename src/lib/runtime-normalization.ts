import type {
  LawEvaluateData,
  MonParisState,
  MonParisReading,
  WorldMeZoneOverlay,
  WorldSnapshotData,
  WorldZoneSnapshot,
  ZoneProgressData,
  ZoneProgressItem,
} from './api';
import { emitDiagnostic } from './runtime-diagnostics';

type UnknownRecord = Record<string, unknown>;

const EMPTY_ZONE_PROGRESS_STATS: ZoneProgressData['stats'] = {
  total_zones_touched: 0,
  total_objectives: 0,
  zones_complete: 0,
  total_rituals: 0,
  total_engravings: 0,
  custodianships: 0,
};

const EMPTY_ZONE_PROGRESS_COMPLEXION: ZoneProgressData['complexion'] = {
  presence_points: 0,
  wisdom_points: 0,
  shadow_points: 0,
  completed_rituals_count: 0,
  revealed: false,
};

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null ? (value as UnknownRecord) : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asStringOrNull(value: unknown): string | null {
  if (value == null) return null;
  return typeof value === 'string' ? value : null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function warnBoundary(
  module: string,
  code: string,
  message: string,
  details: Record<string, unknown>,
  onceKey?: string,
): void {
  emitDiagnostic(
    {
      level: 'warn',
      module,
      code,
      message,
      details,
      degraded: true,
    },
    { onceKey },
  );
}

export function zoneIdToArrondissement(zoneId: string): number | null {
  const normalized = zoneId.trim();
  const parisMatch = /^paris-(\d{1,2})$/i.exec(normalized);
  const parMatch = /^PAR-(\d{1,2})$/i.exec(normalized);
  const raw = parisMatch?.[1] ?? parMatch?.[1] ?? null;
  if (!raw) return null;
  const arr = Number.parseInt(raw, 10);
  return Number.isFinite(arr) && arr >= 1 && arr <= 20 ? arr : null;
}

export function canonicalZoneId(zoneId: string): string | null {
  const arr = zoneIdToArrondissement(zoneId);
  if (!arr) return null;
  return `PAR-${String(arr).padStart(2, '0')}`;
}

function normalizeZoneProgressItem(raw: unknown, index: number, source: string): ZoneProgressItem | null {
  const record = asRecord(raw);
  if (!record) {
    warnBoundary(
      'ZoneProgress',
      'INVALID_ZONE_ITEM',
      'Dropped malformed zone-progress item.',
      { source, index, reason: 'not-an-object' },
      `ZoneProgress:INVALID_ZONE_ITEM:${source}:${index}`,
    );
    return null;
  }

  const rawZoneId = asString(record.zone_id);
  if (!rawZoneId) {
    warnBoundary(
      'ZoneProgress',
      'MISSING_ZONE_ID',
      'Dropped zone-progress item without zone_id.',
      { source, index },
      `ZoneProgress:MISSING_ZONE_ID:${source}:${index}`,
    );
    return null;
  }

  const normalizedZoneId = canonicalZoneId(rawZoneId) ?? rawZoneId;
  if (normalizedZoneId !== rawZoneId) {
    warnBoundary(
      'ZoneProgress',
      'ZONE_ID_NORMALIZED',
      'Normalized legacy zone_id format.',
      { source, from: rawZoneId, to: normalizedZoneId },
      `ZoneProgress:ZONE_ID_NORMALIZED:${source}:${rawZoneId}`,
    );
  }

  return {
    zone_id: normalizedZoneId,
    entered: asBoolean(record.entered, false),
    entered_at: asStringOrNull(record.entered_at),
    presence_ritual: asBoolean(record.presence_ritual, false),
    presence_ritual_at: asStringOrNull(record.presence_ritual_at),
    observation_ritual: asBoolean(record.observation_ritual, false),
    observation_ritual_at: asStringOrNull(record.observation_ritual_at),
    engraved: asBoolean(record.engraved, false),
    engraved_at: asStringOrNull(record.engraved_at),
    is_custodian: asBoolean(record.is_custodian, false),
    custodian_since: asStringOrNull(record.custodian_since),
    custody_expires_at: asStringOrNull(record.custody_expires_at),
    objectives_complete: Math.max(0, Math.floor(asNumber(record.objectives_complete, 0))),
    updated_at: asString(record.updated_at) ?? new Date().toISOString(),
  };
}

function normalizeZoneProgressStats(raw: unknown, zones: ZoneProgressItem[], source: string): ZoneProgressData['stats'] {
  const record = asRecord(raw);
  const computed: ZoneProgressData['stats'] = {
    total_zones_touched: zones.length,
    total_objectives: zones.reduce((sum, zone) => sum + zone.objectives_complete, 0),
    zones_complete: zones.filter((zone) => zone.objectives_complete >= 5).length,
    total_rituals: zones.filter((zone) => zone.presence_ritual || zone.observation_ritual).length,
    total_engravings: zones.filter((zone) => zone.engraved).length,
    custodianships: zones.filter((zone) => zone.is_custodian).length,
  };

  if (!record) {
    warnBoundary(
      'ZoneProgress',
      'MISSING_STATS',
      'zone-progress stats missing; using computed fallback.',
      { source },
      `ZoneProgress:MISSING_STATS:${source}`,
    );
    return computed;
  }

  return {
    total_zones_touched: asNumber(record.total_zones_touched, computed.total_zones_touched),
    total_objectives: asNumber(record.total_objectives, computed.total_objectives),
    zones_complete: asNumber(record.zones_complete, computed.zones_complete),
    total_rituals: asNumber(record.total_rituals, computed.total_rituals),
    total_engravings: asNumber(record.total_engravings, computed.total_engravings),
    custodianships: asNumber(record.custodianships, computed.custodianships),
  };
}

function normalizeZoneProgressComplexion(
  raw: unknown,
  zones: ZoneProgressItem[],
  source: string,
): ZoneProgressData['complexion'] {
  const record = asRecord(raw);
  if (!record) {
    warnBoundary(
      'ZoneProgress',
      'MISSING_COMPLEXION',
      'zone-progress complexion missing; using neutral fallback.',
      { source },
      `ZoneProgress:MISSING_COMPLEXION:${source}`,
    );
    return {
      ...EMPTY_ZONE_PROGRESS_COMPLEXION,
      revealed: zones.length > 0,
    };
  }

  return {
    presence_points: asNumber(record.presence_points, 0),
    wisdom_points: asNumber(record.wisdom_points, 0),
    shadow_points: asNumber(record.shadow_points, 0),
    completed_rituals_count: asNumber(record.completed_rituals_count, 0),
    revealed: asBoolean(record.revealed, zones.length > 0),
  };
}

export function normalizeZoneProgressData(raw: unknown, source = 'unknown'): ZoneProgressData {
  const record = asRecord(raw);
  if (!record) {
    warnBoundary(
      'ZoneProgress',
      'INVALID_ROOT',
      'zone-progress payload is not an object; using empty fallback.',
      { source, receivedType: typeof raw },
      `ZoneProgress:INVALID_ROOT:${source}`,
    );
    return {
      zones: [],
      stats: EMPTY_ZONE_PROGRESS_STATS,
      complexion: EMPTY_ZONE_PROGRESS_COMPLEXION,
    };
  }

  const rawZones = Array.isArray(record.zones) ? record.zones : [];
  if (!Array.isArray(record.zones)) {
    warnBoundary(
      'ZoneProgress',
      'MISSING_ZONES_ARRAY',
      'zone-progress payload missing zones array; using empty array fallback.',
      { source, keys: Object.keys(record) },
      `ZoneProgress:MISSING_ZONES_ARRAY:${source}`,
    );
  }

  const zones: ZoneProgressItem[] = [];
  let droppedCount = 0;
  rawZones.forEach((item, index) => {
    const normalized = normalizeZoneProgressItem(item, index, source);
    if (normalized) zones.push(normalized);
    else droppedCount += 1;
  });

  if (droppedCount > 0) {
    warnBoundary(
      'ZoneProgress',
      'ZONE_ITEMS_DROPPED',
      'Dropped malformed zone-progress items during normalization.',
      { source, droppedCount, totalReceived: rawZones.length },
      `ZoneProgress:ZONE_ITEMS_DROPPED:${source}:${droppedCount}:${rawZones.length}`,
    );
  }

  const normalized: ZoneProgressData = {
    zones,
    stats: normalizeZoneProgressStats(record.stats, zones, source),
    complexion: normalizeZoneProgressComplexion(record.complexion, zones, source),
  };

  if (record.ok === true) normalized.ok = true;
  return normalized;
}

export function buildZoneProgressMap(data: ZoneProgressData | null | undefined, source = 'unknown'): Record<string, ZoneProgressItem> {
  if (!data) return {};
  const normalized = normalizeZoneProgressData(data, source);
  const map: Record<string, ZoneProgressItem> = {};

  normalized.zones.forEach((zone) => {
    map[zone.zone_id] = zone;
    const arr = zoneIdToArrondissement(zone.zone_id);
    if (!arr) return;
    const canonical = `PAR-${String(arr).padStart(2, '0')}`;
    const legacy = `paris-${arr}`;
    map[canonical] = zone;
    map[legacy] = zone;
  });

  return map;
}

function normalizeWorldZone(raw: unknown, index: number, source: string): WorldZoneSnapshot | null {
  const record = asRecord(raw);
  if (!record) {
    warnBoundary(
      'WorldSnapshot',
      'INVALID_WORLD_ZONE',
      'Dropped malformed world zone entry.',
      { source, index, reason: 'not-an-object' },
      `WorldSnapshot:INVALID_WORLD_ZONE:${source}:${index}`,
    );
    return null;
  }

  const h3 = asString(record.h3);
  if (!h3) {
    warnBoundary(
      'WorldSnapshot',
      'MISSING_WORLD_ZONE_H3',
      'Dropped world zone entry without h3.',
      { source, index },
      `WorldSnapshot:MISSING_WORLD_ZONE_H3:${source}:${index}`,
    );
    return null;
  }

  const signalsRecord = asRecord(record.signals);
  const fogRecord = asRecord(record.fog);
  const lawRecord = asRecord(record.law) ?? {};
  const anchorsRaw = Array.isArray(record.anchors) ? record.anchors : [];
  const anchors = anchorsRaw
    .map((anchor) => {
      const anchorRecord = asRecord(anchor);
      if (!anchorRecord) return null;
      const id = asString(anchorRecord.id);
      const type = asString(anchorRecord.type);
      if (!id || !type) return null;
      return { id, type };
    })
    .filter((anchor): anchor is { id: string; type: string } => anchor !== null);

  const zone: WorldZoneSnapshot = {
    h3,
    title: asString(record.title) ?? h3,
    fog: { level: asNumber(fogRecord?.level, 0) },
    signals: {
      inscriptions_recent: asNumber(signalsRecord?.inscriptions_recent, 0),
      champ_recent: asNumber(signalsRecord?.champ_recent, 0),
      whisper: asStringOrNull(signalsRecord?.whisper),
    },
    law: lawRecord as Record<string, LawEvaluateData>,
  };

  if (anchors.length > 0) zone.anchors = anchors;
  return zone;
}

function normalizeMapInscriptions(
  raw: unknown,
  source: string,
): Array<{ id: string; h3: string; ts: string; excerpt: string }> {
  const entries = Array.isArray(raw) ? raw : [];
  if (!Array.isArray(raw)) {
    warnBoundary(
      'WorldSnapshot',
      'MISSING_MAP_INSCRIPTIONS',
      'world.map.inscriptions missing array; using empty fallback.',
      { source },
      `WorldSnapshot:MISSING_MAP_INSCRIPTIONS:${source}`,
    );
  }

  const out: Array<{ id: string; h3: string; ts: string; excerpt: string }> = [];
  entries.forEach((entry, index) => {
    const record = asRecord(entry);
    if (!record) return;
    const id = asString(record.id);
    const h3 = asString(record.h3);
    if (!id || !h3) {
      warnBoundary(
        'WorldSnapshot',
        'INVALID_MAP_INSCRIPTION',
        'Dropped malformed map inscription item.',
        { source, index },
        `WorldSnapshot:INVALID_MAP_INSCRIPTION:${source}:${index}`,
      );
      return;
    }
    out.push({
      id,
      h3,
      ts: asString(record.ts) ?? new Date().toISOString(),
      excerpt: asString(record.excerpt) ?? '',
    });
  });
  return out;
}

function normalizeChampItems(
  raw: unknown,
  source: string,
): Array<{ id: string; h3: string; ts: string; excerpt: string }> {
  const entries = Array.isArray(raw) ? raw : [];
  if (!Array.isArray(raw)) {
    warnBoundary(
      'WorldSnapshot',
      'MISSING_CHAMP_ITEMS',
      'world.champ.items missing array; using empty fallback.',
      { source },
      `WorldSnapshot:MISSING_CHAMP_ITEMS:${source}`,
    );
  }

  const out: Array<{ id: string; h3: string; ts: string; excerpt: string }> = [];
  entries.forEach((entry, index) => {
    const record = asRecord(entry);
    if (!record) return;
    const id = asString(record.id);
    const h3 = asString(record.h3);
    if (!id || !h3) {
      warnBoundary(
        'WorldSnapshot',
        'INVALID_CHAMP_ITEM',
        'Dropped malformed champ item.',
        { source, index },
        `WorldSnapshot:INVALID_CHAMP_ITEM:${source}:${index}`,
      );
      return;
    }
    out.push({
      id,
      h3,
      ts: asString(record.ts) ?? new Date().toISOString(),
      excerpt: asString(record.excerpt) ?? '',
    });
  });
  return out;
}

function normalizeMeZones(raw: unknown, source: string): Record<string, WorldMeZoneOverlay> {
  const record = asRecord(raw);
  if (!record) {
    warnBoundary(
      'WorldSnapshot',
      'MISSING_ME_ZONES',
      'me.zones missing object; using empty fallback.',
      { source },
      `WorldSnapshot:MISSING_ME_ZONES:${source}`,
    );
    return {};
  }

  const zones: Record<string, WorldMeZoneOverlay> = {};
  for (const [h3, zoneRaw] of Object.entries(record)) {
    const zoneRecord = asRecord(zoneRaw);
    if (!zoneRecord) continue;

    const progressRecord = asRecord(zoneRecord.progress);
    const activationRecord = asRecord(zoneRecord.activation);
    const presenceRecord = asRecord(zoneRecord.presence);

    const rawZoneId = asString(progressRecord?.zone_id) ?? h3;
    const normalizedZoneId = canonicalZoneId(rawZoneId) ?? rawZoneId;

    const zone: WorldMeZoneOverlay = {
      progress: progressRecord
        ? {
            zone_id: normalizedZoneId,
            entered: asBoolean(progressRecord.entered, false),
            entered_at: asStringOrNull(progressRecord.entered_at),
            engraved: asBoolean(progressRecord.engraved, false),
            engraved_at: asStringOrNull(progressRecord.engraved_at),
          }
        : null,
      activation: activationRecord ? (activationRecord as unknown as LawEvaluateData) : null,
    };

    if (presenceRecord) {
      zone.presence = {
        pulses_20m: Math.max(0, Math.floor(asNumber(presenceRecord.pulses_20m, 0))),
        last_ts: asStringOrNull(presenceRecord.last_ts),
      };
    }

    zones[h3] = zone;
  }

  return zones;
}

function normalizeCharacter(raw: unknown): WorldSnapshotData['me']['character'] {
  const record = asRecord(raw);
  if (!record) return null;

  const id = asString(record.id);
  const name = asString(record.name);
  if (!id || !name) return null;

  const rawLines = Array.isArray(record.lines) ? record.lines : [];
  const lines = rawLines.filter((line): line is string => typeof line === 'string' && line.trim().length > 0);

  const echoRecord = asRecord(record.echo);
  const locationHint = asString(echoRecord?.location_hint);
  const symbol = asString(echoRecord?.symbol);

  return {
    id,
    name,
    lines,
    ...(locationHint && symbol ? { echo: { location_hint: locationHint, symbol } } : {}),
  };
}

function normalizeMonParis(raw: unknown): MonParisState | undefined {
  const record = asRecord(raw);
  if (!record) return undefined;

  const entryRecord = asRecord(record.entry);
  if (!entryRecord) return undefined;

  const entryText = asString(entryRecord.text) ?? '';
  const entry: MonParisState['entry'] = { text: entryText };

  const entryCode = asString(entryRecord.code);
  if (entryCode) entry.code = entryCode;

  const linkRecord = asRecord(entryRecord.link);
  const linkLabel = asString(linkRecord?.label);
  const linkHref = asString(linkRecord?.href);
  if (linkLabel && linkHref) {
    entry.link = { label: linkLabel, href: linkHref };
  }

  const readingRecord = asRecord(record.reading);
  if (!readingRecord) return { entry };

  const readingLayer = asString(readingRecord.layer);
  const readingText = asString(readingRecord.text);
  if (!readingLayer || !readingText || !['TRACE', 'RELATION', 'ECHO'].includes(readingLayer)) {
    return { entry };
  }

  return {
    entry,
    reading: {
      layer: readingLayer as MonParisReading['layer'],
      text: readingText,
      ...(asString(readingRecord.code) ? { code: asString(readingRecord.code) as string } : {}),
    },
  };
}

export function normalizeWorldSnapshotData(raw: unknown, source = 'unknown'): WorldSnapshotData | null {
  const record = asRecord(raw);
  if (!record) {
    warnBoundary(
      'WorldSnapshot',
      'INVALID_ROOT',
      'world/snapshot payload is not an object.',
      { source, receivedType: typeof raw },
      `WorldSnapshot:INVALID_ROOT:${source}`,
    );
    return null;
  }

  const worldRecord = asRecord(record.world);
  const meRecord = asRecord(record.me);
  if (!worldRecord || !meRecord) {
    warnBoundary(
      'WorldSnapshot',
      'MISSING_WORLD_OR_ME',
      'world/snapshot payload missing world or me root nodes.',
      { source, keys: Object.keys(record) },
      `WorldSnapshot:MISSING_WORLD_OR_ME:${source}`,
    );
    return null;
  }

  const rawWorldZones = Array.isArray(worldRecord.zones) ? worldRecord.zones : [];
  if (!Array.isArray(worldRecord.zones)) {
    warnBoundary(
      'WorldSnapshot',
      'MISSING_WORLD_ZONES',
      'world.zones missing array; using empty fallback.',
      { source },
      `WorldSnapshot:MISSING_WORLD_ZONES:${source}`,
    );
  }

  const worldZones = rawWorldZones
    .map((zone, index) => normalizeWorldZone(zone, index, source))
    .filter((zone): zone is WorldZoneSnapshot => zone !== null);

  const mapRecord = asRecord(worldRecord.map);
  const champRecord = asRecord(worldRecord.champ);
  const policyRecord = asRecord(record.policy);
  const cacheRecord = asRecord(policyRecord?.cache);

  const normalized: WorldSnapshotData = {
    now: asString(record.now) ?? new Date().toISOString(),
    policy: {
      world_version: asString(policyRecord?.world_version) ?? 'unknown',
      cache: {
        public_s_maxage: asNumber(cacheRecord?.public_s_maxage, 0),
        public_swr: asNumber(cacheRecord?.public_swr, 0),
      },
    },
    world: {
      zones: worldZones,
      map: {
        inscriptions: normalizeMapInscriptions(mapRecord?.inscriptions, source),
      },
      champ: {
        items: normalizeChampItems(champRecord?.items, source),
      },
    },
    me: {
      authenticated: asBoolean(meRecord.authenticated, false),
      card_id: asString(meRecord.card_id),
      zones: normalizeMeZones(meRecord.zones, source),
      character: normalizeCharacter(meRecord.character),
    },
  };

  if (normalized.me.card_id == null) normalized.me.card_id = null;

  const monParis = normalizeMonParis(meRecord.monParis);
  if (monParis) normalized.me.monParis = monParis;

  if (asRecord(meRecord.aura)) normalized.me.aura = meRecord.aura as WorldSnapshotData['me']['aura'];
  if (asRecord(meRecord.passport)) normalized.me.passport = meRecord.passport as WorldSnapshotData['me']['passport'];
  if (asRecord(meRecord.fund)) normalized.me.fund = meRecord.fund as WorldSnapshotData['me']['fund'];

  return normalized;
}

