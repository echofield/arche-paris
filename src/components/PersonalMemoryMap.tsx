/**
 * PERSONAL MEMORY MAP — My Paris (Ma Carte)
 *
 * Full alignment with petitsouvenir "My Paris":
 * - Real collected symbols from collection-service (pins)
 * - Optional note → saved to journal_entries → appears in Carnet (notes)
 * - Share My Paris → copy link to #collection
 * - Link "In your notebook" → opens Carnet
 *
 * When user pins (collects) or writes here, it gets printed into notes (Carnet).
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BackButton } from './BackButton';
import { MamlukGrid } from './MamlukGrid';
import { getCollection } from '../utils/collection-service';
import { SYMBOLS, getSymbolById, type Symbol } from '../data/symbols';
import { ARRONDISSEMENT_MAP_POSITION } from '../data/arrondissement-positions';
import { loadMyParisNote, saveMyParisNote, appendWalkToJournal } from '../utils/journal-sync';
import { listTraces, loadTracesV1 } from '../utils/trace-service';
import { getTodayKey, getTodaySummary, addManualWalk } from '../utils/walk-service';
import { bump } from '../utils/companion-service';
import { getRuns, isTemporalMeridiansUnlocked } from '../utils/quest-run-service';
import { useTranslation } from '../utils/i18n';
import { getRefusedArrondissements, isRefused, setRefused } from '../utils/refused-arrondissements';
import { postInscription } from '../utils/card-gate-map-client';
import { hasLocalSecret } from '../utils/card-gate-client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import type { QuestThreadTrace } from '../types/traces';
import type { MapState, MapInscription, CityMapState } from '../types/map-engraving';
import { emitEngraveEvent } from '../utils/engrave-events';
import { ZoneDetailSheet } from './ZoneDetailSheet';
import { AsyncState } from './AsyncState';
import { api, type ZoneProgressItem, type WorldSnapshotData, type MonParisReading } from '../lib/api';
import { useWorldSnapshot } from '../contexts/WorldSnapshotContext';
import { MapLayers, type MapLayerMode } from './PersonalMemoryMap/MapLayers';
import { TraceRenderer } from './PersonalMemoryMap/TraceRenderer';
import { ZoneOverlay } from './PersonalMemoryMap/ZoneOverlay';
import { InstrumentReadingLayer, type InstrumentState } from './PersonalMemoryMap/InstrumentReadingLayer';
import { ReadingCard } from './PersonalMemoryMap/ReadingCard';
import { LIEUX_PARIS, type Lieu } from '../data/lieux-paris';
import { project } from '../utils/map-project';
import { motion } from '../design/motion';
import { useStabilizedPosition } from '../hooks/useStabilizedPosition';

const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => i + 1);
const MAP_VIEWBOX_WIDTH = 2037.566;
const MAP_VIEWBOX_HEIGHT = 1615.5;
type RitualStartLaw = {
  allowed: boolean;
  reason_code?: string;
  message?: string;
  next_unlock_hint?: string | null;
};

interface PersonalMemoryMapProps {
  cardId: string | null;
  onBack: () => void;
  onOpenNotebook?: () => void;
}

interface MapPoint {
  symbol: Symbol;
  x: number;
  y: number;
}

const MARKER_MIN_MOVE_M = 6;
const TERRITORY_FIX_STREAK_REQUIRED = 3;
const PRESENCE_PULSE_INTERVAL_MS = 30_000;
const MARKER_LERP_ALPHA = 0.25;
const PARIS_TERRITORY_BOUNDS = {
  minLat: 48.810,
  maxLat: 48.910,
  minLng: 2.220,
  maxLng: 2.430,
};

function isInsideParisTerritory(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return (
    lat >= PARIS_TERRITORY_BOUNDS.minLat &&
    lat <= PARIS_TERRITORY_BOUNDS.maxLat &&
    lng >= PARIS_TERRITORY_BOUNDS.minLng &&
    lng <= PARIS_TERRITORY_BOUNDS.maxLng
  );
}

function getCollectedPoints(): MapPoint[] {
  const collection = getCollection();
  if (!collection) return [];

  const byArr: Record<number, number> = {};
  return collection.symbols
    .map((cs) => {
      const symbol = getSymbolById(cs.symbolId);
      if (!symbol) return null;
      const pos = ARRONDISSEMENT_MAP_POSITION[symbol.arrondissement];
      if (!pos) return null;
      const jitter = (byArr[symbol.arrondissement] ?? 0) * 3;
      byArr[symbol.arrondissement] = (byArr[symbol.arrondissement] ?? 0) + 1;
      return {
        symbol,
        x: pos.x + (jitter % 5) - 2,
        y: pos.y + (Math.floor(jitter / 5) % 5) - 2
      };
    })
    .filter((p): p is MapPoint => p !== null);
}

function inferArrondissementFromGeo(lat: number, lng: number): number | null {
  if (!isInsideParisTerritory(lat, lng)) return null;
  const p = project(lat, lng);
  const xPct = (p.x / MAP_VIEWBOX_WIDTH) * 100;
  const yPct = (p.y / MAP_VIEWBOX_HEIGHT) * 100;
  if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) return null;
  if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return null;
  let bestArr: number | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let arr = 1; arr <= 20; arr++) {
    const center = ARRONDISSEMENT_MAP_POSITION[arr];
    if (!center) continue;
    const dx = center.x - xPct;
    const dy = center.y - yPct;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < bestDist) {
      bestDist = d;
      bestArr = arr;
    }
  }
  return bestArr;
}

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2), Math.sqrt(1 - (s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2)));
  return R * c;
}

function lerpPoint(from: { lat: number; lng: number }, to: { lat: number; lng: number }, alpha: number): { lat: number; lng: number } {
  return {
    lat: from.lat + (to.lat - from.lat) * alpha,
    lng: from.lng + (to.lng - from.lng) * alpha,
  };
}

export function PersonalMemoryMap({ cardId, onBack, onOpenNotebook }: PersonalMemoryMapProps) {
  const { t, language } = useTranslation();
  const [note, setNote] = useState('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [showThreads, setShowThreads] = useState(true);
  const [showTemporalOnly, setShowTemporalOnly] = useState(false);
  const [showAddWalk, setShowAddWalk] = useState(false);
  const [addWalkLabel, setAddWalkLabel] = useState('');
  const [addWalkKm, setAddWalkKm] = useState('');
  const [addWalkMinutes, setAddWalkMinutes] = useState('');
  const [selectedTraceV1, setSelectedTraceV1] = useState<QuestThreadTrace | null>(null);
  const [walkLogRefresh, setWalkLogRefresh] = useState(0);
  const [refusedList, setRefusedList] = useState<number[]>(() => getRefusedArrondissements());
  const [unmarkedPromptArr, setUnmarkedPromptArr] = useState<number | null>(null);
  // Map engraving (Card Gate): 3 layers
  const [mapState, setMapState] = useState<MapState | null>(null);
  const [cityMapState, setCityMapState] = useState<CityMapState | null>(null);
  const [showSegments, setShowSegments] = useState(true);
  const [showInscriptionsLayer, setShowInscriptionsLayer] = useState(true);
  const [mapMode, setMapMode] = useState<MapLayerMode>('traces');
  const [ecrireSheetArr, setEcrireSheetArr] = useState<number | null>(null);
  const [ecrireDraft, setEcrireDraft] = useState('');
  const [ecrireSaving, setEcrireSaving] = useState(false);
  const [ecrireError, setEcrireError] = useState<string | null>(null);
  const [ecrireOptInField, setEcrireOptInField] = useState(false); // Share to Le Champ
  const [zoneDetailArr, setZoneDetailArr] = useState<number | null>(null);
  const [zoneProgressMap, setZoneProgressMapLocal] = useState<Record<string, ZoneProgressItem>>({});
  const [zoneLawMap, setZoneLawMap] = useState<Record<string, RitualStartLaw>>({});
  const [anchorZoneMap, setAnchorZoneMap] = useState<Record<string, boolean>>({});
  const [worldSnapshotState, setWorldSnapshotState] = useState<WorldSnapshotData | null>(null);
  const { snapshot: ctxSnapshot, zoneProgress: ctxZoneProgress, error: ctxError, refresh: ctxRefresh, refreshZoneProgress: ctxRefreshZoneProgress } = useWorldSnapshot();
  const snapshotError = !!ctxError && !worldSnapshotState;
  const [outsideCoverage, setOutsideCoverage] = useState(false);
  // Instrument reading layer (quiet → reading → interpretation)
  const [instrumentState, setInstrumentState] = useState<InstrumentState>('quiet');
  const [activeLieu, setActiveLieu] = useState<Lieu | null>(null);
  // GPS + perception marker
  const [presenceMarker, setPresenceMarker] = useState<{ lat: number; lng: number; moving: boolean; pulsePaused: boolean } | null>(null);
  const presenceMarkerRef = useRef<{ lat: number; lng: number; moving: boolean; pulsePaused: boolean } | null>(null);
  const [recognitionLine, setRecognitionLine] = useState<string | null>(null);
  const lastPulseAtRef = useRef<number>(0);
  const lastPulsePosRef = useRef<{ lat: number; lng: number } | null>(null);
  const pulseRetryUntilRef = useRef<number>(0);
  const inFlightPulseRef = useRef(false);
  const markerTargetRef = useRef<{ lat: number; lng: number } | null>(null);
  const markerLastMoveAtRef = useRef<number>(0);
  const markerAnimationRef = useRef<number | null>(null);
  const stoneReleaseRef = useRef<(() => void) | null>(null);
  const recognitionShownRef = useRef(false);
  const recognitionHideTimerRef = useRef<number | null>(null);
  const pulsePauseTimerRef = useRef<number | null>(null);
  const lastSnapshotRefreshAtRef = useRef<number>(0);
  const lastZoneWhisperRef = useRef<string | null>(null);
  const outsideFixStreakRef = useRef(0);
  const insideFixStreakRef = useRef(0);

  useEffect(() => {
    presenceMarkerRef.current = presenceMarker;
  }, [presenceMarker]);

  useEffect(() => {
    if (!ctxZoneProgress) return;
    const map: Record<string, ZoneProgressItem> = {};
    ctxZoneProgress.zones.forEach(z => { map[z.zone_id] = z; });
    setZoneProgressMapLocal(map);
  }, [ctxZoneProgress]);

  const collection = getCollection();
  const points = useMemo(() => getCollectedPoints(), [collection?.symbols.length, collection?.lastUpdated]);
  const collectedCount = collection?.symbols.length ?? 0;
  const totalCount = SYMBOLS.length;
  const traces = useMemo(() => listTraces().filter((tr) => tr.kind === 'quest_walk'), []);
  const todaySummary = useMemo(() => getTodaySummary(), [walkLogRefresh]);
  const tracesV1 = useMemo(() => loadTracesV1(), []);
  const runs = useMemo(() => {
    const list = getRuns();
    if (showTemporalOnly && isTemporalMeridiansUnlocked()) return list.filter((r) => r.questId === 'temporal-meridians');
    return list;
  }, [showThreads, showTemporalOnly]);
  const temporalUnlocked = isTemporalMeridiansUnlocked();
  const mapPanOffset = useMemo(() => {
    if (!presenceMarker) return { xPct: 0, yPct: 0 };
    const p = project(presenceMarker.lat, presenceMarker.lng);
    const xPct = (p.x / MAP_VIEWBOX_WIDTH) * 100;
    const yPct = (p.y / MAP_VIEWBOX_HEIGHT) * 100;
    const outsideParis = !isInsideParisTerritory(presenceMarker.lat, presenceMarker.lng) || xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100;
    if (!outsideParis) return { xPct: 0, yPct: 0 };
    return {
      xPct: 50 - xPct,
      yPct: 50 - yPct,
    };
  }, [presenceMarker]);

  // Arrondissements with 0 collected symbols (unvisited)
  const visitedArrondissements = useMemo(() => {
    const set = new Set<number>();
    collection?.symbols.forEach((cs) => {
      const sym = getSymbolById(cs.symbolId);
      if (sym) set.add(sym.arrondissement);
    });
    return set;
  }, [collection?.symbols.length, collection?.lastUpdated]);
  const unvisitedArrondissements = useMemo(
    () => ARRONDISSEMENTS.filter((arr) => !visitedArrondissements.has(arr)),
    [visitedArrondissements]
  );
  const unvisitedNotRefused = unvisitedArrondissements.filter((arr) => !refusedList.includes(arr));
  const unvisitedRefused = unvisitedArrondissements.filter((arr) => refusedList.includes(arr));

  useEffect(() => {
    if (!cardId || !hasLocalSecret(cardId)) return;
    loadMyParisNote(cardId).then(setNote);
  }, [cardId]);

  const parseArrondissementFromH3 = (h3: string): number | null => {
    const m = h3.match(/^PAR-(\d{1,2})$/i);
    if (!m) return null;
    const arr = Number.parseInt(m[1], 10);
    return Number.isFinite(arr) && arr >= 1 && arr <= 20 ? arr : null;
  };

  const toZoneIdFromH3 = (h3: string): string | null => {
    const arr = parseArrondissementFromH3(h3);
    return arr ? `paris-${arr}` : null;
  };

  const applySnapshot = useCallback((snap: WorldSnapshotData) => {
    setWorldSnapshotState(snap);
    const mappedMapState: MapState = {
      inscriptions: (snap.world.map.inscriptions ?? []).map((ins) => {
        const arr = parseArrondissementFromH3(ins.h3);
        return {
          id: ins.id,
          kind: 'arrondissement',
          status: 'verified',
          arrondissement: arr ?? undefined,
          text: ins.excerpt,
          createdAt: ins.ts,
          immutable: true as const,
        };
      }),
      segments: [],
      meridian_proofs: [],
    };

    const mappedCityState: CityMapState = {
      generatedAt: snap.now,
      windowDays: 90,
      arrondissements: (snap.world.zones ?? [])
        .map((z) => {
          const arr = parseArrondissementFromH3(z.h3);
          if (!arr) return null;
          const inscriptionsRecent = z.signals?.inscriptions_recent ?? 0;
          const champRecent = z.signals?.champ_recent ?? 0;
          const weighted = inscriptionsRecent + champRecent * 0.5;
          const signalStrength = Math.max(0, Math.min(1, weighted / 8));
          return {
            arrondissement: arr,
            signalStrength,
            inscriptionCount: inscriptionsRecent,
            verifiedInscriptions: inscriptionsRecent,
            pendingInscriptions: 0,
            segmentCount: champRecent,
            lastActivityAt: null,
            sampleLines: [],
          };
        })
        .filter((v): v is CityMapState['arrondissements'][number] => v !== null),
    };

    const mappedLaw: Record<string, RitualStartLaw> = {};
    const mappedAnchors: Record<string, boolean> = {};
    (snap.world.zones ?? []).forEach((z) => {
      const zoneId = toZoneIdFromH3(z.h3);
      if (!zoneId) return;
      const law = z.law?.['ritual.start'] as RitualStartLaw | undefined;
      if (law) mappedLaw[zoneId] = law;
      mappedAnchors[zoneId] = (z.anchors?.length ?? 0) > 0;
    });

    setMapState(mappedMapState);
    setCityMapState(mappedCityState);
    setZoneLawMap(mappedLaw);
    setAnchorZoneMap(mappedAnchors);

    const marker = markerTargetRef.current;
    if (!marker) return;
    const arr = inferArrondissementFromGeo(marker.lat, marker.lng);
    if (!arr) {
      lastZoneWhisperRef.current = null;
      return;
    }
    const zoneH3 = `PAR-${String(arr).padStart(2, '0')}`;
    const meZone = snap.me.zones?.[zoneH3];
    const pulses20m = meZone?.presence?.pulses_20m ?? 0;
    if (!recognitionShownRef.current && pulses20m >= 5) {
      recognitionShownRef.current = true;
      const line = t('map.presenceMatters');
      setRecognitionLine(line);
      if (recognitionHideTimerRef.current != null) {
        window.clearTimeout(recognitionHideTimerRef.current);
      }
      recognitionHideTimerRef.current = window.setTimeout(() => {
        setRecognitionLine(null);
      }, motion.t('contemplative') * 4);
    }

    const zone = (snap.world.zones ?? []).find((z) => z.h3 === zoneH3);
    const whisper = zone?.signals?.whisper ?? null;
    if (whisper && whisper !== lastZoneWhisperRef.current) {
      setPresenceMarker((prev) => (prev ? { ...prev, pulsePaused: true } : prev));
      if (pulsePauseTimerRef.current != null) {
        window.clearTimeout(pulsePauseTimerRef.current);
      }
      pulsePauseTimerRef.current = window.setTimeout(() => {
        setPresenceMarker((prev) => (prev ? { ...prev, pulsePaused: false } : prev));
      }, motion.t('contemplative'));
    }
    lastZoneWhisperRef.current = whisper;
  }, [language]);

  useEffect(() => {
    if (ctxSnapshot) applySnapshot(ctxSnapshot);
  }, [ctxSnapshot, applySnapshot]);

  const refreshMapState = ctxRefresh;

  const encounter = useMemo(() => {
    if (outsideCoverage) return null;
    return worldSnapshotState?.me?.character ?? null;
  }, [outsideCoverage, worldSnapshotState]);

  // Snapshot is now provided by WorldSnapshotContext; no per-mount fetch needed.

  // Shared stabilized GPS — single source of truth for all GPS consumers
  const stabilized = useStabilizedPosition();

  const animateMarker = useCallback((from: { lat: number; lng: number }, to: { lat: number; lng: number }, durationMs: number) => {
    if (motion.prefersReducedMotion()) {
      setPresenceMarker((prev) => ({
        lat: to.lat,
        lng: to.lng,
        moving: false,
        pulsePaused: prev?.pulsePaused ?? false,
      }));
      return;
    }
    if (markerAnimationRef.current != null) {
      cancelAnimationFrame(markerAnimationRef.current);
    }
    if (stoneReleaseRef.current) {
      stoneReleaseRef.current();
      stoneReleaseRef.current = null;
    }
    const releaseStone = motion.acquireStone('presence-marker');
    if (!releaseStone) {
      setPresenceMarker((prev) => ({
        lat: to.lat,
        lng: to.lng,
        moving: false,
        pulsePaused: prev?.pulsePaused ?? false,
      }));
      return;
    }
    stoneReleaseRef.current = releaseStone;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = motion.interpolate('transition', t);
      const lat = from.lat + (to.lat - from.lat) * eased;
      const lng = from.lng + (to.lng - from.lng) * eased;
      setPresenceMarker((prev) => ({
        lat,
        lng,
        moving: prev?.moving ?? true,
        pulsePaused: prev?.pulsePaused ?? false,
      }));
      if (t < 1) {
        markerAnimationRef.current = requestAnimationFrame(tick);
      } else {
        markerAnimationRef.current = null;
        if (stoneReleaseRef.current) {
          stoneReleaseRef.current();
          stoneReleaseRef.current = null;
        }
      }
    };
    markerAnimationRef.current = requestAnimationFrame(tick);
  }, []);

  // React to stabilized position changes: territory hysteresis + marker animation
  useEffect(() => {
    if (!stabilized.pos) return;
    const { lat, lng } = stabilized.pos;

    // Territory hysteresis
    const outside = !isInsideParisTerritory(lat, lng);
    if (outside) {
      outsideFixStreakRef.current += 1;
      insideFixStreakRef.current = 0;
      if (outsideFixStreakRef.current >= TERRITORY_FIX_STREAK_REQUIRED) {
        setOutsideCoverage(true);
      }
    } else {
      insideFixStreakRef.current += 1;
      outsideFixStreakRef.current = 0;
      if (insideFixStreakRef.current >= TERRITORY_FIX_STREAK_REQUIRED) {
        setOutsideCoverage(false);
      }
    }

    const incoming = { lat, lng };
    const now = Date.now();
    const prevTarget = markerTargetRef.current;
    if (!prevTarget) {
      markerTargetRef.current = incoming;
      markerLastMoveAtRef.current = now;
      setPresenceMarker({ ...incoming, moving: false, pulsePaused: false });
      return;
    }
    const movedMeters = distanceMeters(prevTarget, incoming);
    if (movedMeters < MARKER_MIN_MOVE_M) return;
    markerTargetRef.current = incoming;
    markerLastMoveAtRef.current = now;
    const from = presenceMarkerRef.current
      ? { lat: presenceMarkerRef.current.lat, lng: presenceMarkerRef.current.lng }
      : prevTarget;
    const smoothedIncoming = lerpPoint(from, incoming, MARKER_LERP_ALPHA);
    const minMs = motion.t('paper');
    const maxMs = motion.t('glass');
    const durationMs = Math.max(minMs, Math.min(maxMs, Math.round(minMs + movedMeters * 12)));
    markerTargetRef.current = smoothedIncoming;
    setPresenceMarker((prev) => ({ lat: from.lat, lng: from.lng, moving: true, pulsePaused: prev?.pulsePaused ?? false }));
    animateMarker(from, smoothedIncoming, durationMs);
  }, [stabilized.pos, animateMarker]);

  // Moving ticker
  useEffect(() => {
    const movingTicker = window.setInterval(() => {
      const isMoving = Date.now() - markerLastMoveAtRef.current < 5000;
      setPresenceMarker((prev) => (prev ? { ...prev, moving: isMoving } : prev));
    }, 800);
    return () => {
      window.clearInterval(movingTicker);
      if (markerAnimationRef.current != null) {
        cancelAnimationFrame(markerAnimationRef.current);
        markerAnimationRef.current = null;
      }
      if (stoneReleaseRef.current) {
        stoneReleaseRef.current();
        stoneReleaseRef.current = null;
      }
      if (recognitionHideTimerRef.current != null) {
        window.clearTimeout(recognitionHideTimerRef.current);
      }
      if (pulsePauseTimerRef.current != null) {
        window.clearTimeout(pulsePauseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!cardId || !hasLocalSecret(cardId)) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const shouldPulse = (coords: GeolocationCoordinates): boolean => {
      const now = Date.now();
      if (document.visibilityState !== 'visible') return false;
      if (now < pulseRetryUntilRef.current) return false;
      if (now - lastPulseAtRef.current < PRESENCE_PULSE_INTERVAL_MS) return false;
      if (coords.accuracy > MARKER_MAX_ACCURACY_M) return false;
      const speed = typeof coords.speed === 'number' && Number.isFinite(coords.speed) ? coords.speed : null;
      if (speed !== null && speed >= 0.35) return true;
      const prev = lastPulsePosRef.current;
      if (!prev) return true;
      return distanceMeters(prev, { lat: coords.latitude, lng: coords.longitude }) >= 20;
    };

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        if (pos.coords.accuracy > MARKER_MAX_ACCURACY_M) return;
        if (!shouldPulse(pos.coords) || inFlightPulseRef.current) return;
        if (!isInsideParisTerritory(pos.coords.latitude, pos.coords.longitude)) return;
        const arr = inferArrondissementFromGeo(pos.coords.latitude, pos.coords.longitude);
        if (!arr) return;
        inFlightPulseRef.current = true;
        try {
          const h3 = `PAR-${String(arr).padStart(2, '0')}`;
          const speedMps = typeof pos.coords.speed === 'number' && Number.isFinite(pos.coords.speed)
            ? Math.max(0, pos.coords.speed)
            : undefined;
          const result = await api.presencePulse({
            h3,
            ts: new Date(pos.timestamp).toISOString(),
            speed_mps: speedMps,
            accuracy_m: pos.coords.accuracy,
          });
          if (result.data?.accepted) {
            lastPulseAtRef.current = Date.now();
            lastPulsePosRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            if (Date.now() - lastSnapshotRefreshAtRef.current > 60_000) {
              lastSnapshotRefreshAtRef.current = Date.now();
              refreshMapState();
            }
          } else if (result.data?.retry_after_ms) {
            pulseRetryUntilRef.current = Date.now() + result.data.retry_after_ms;
          } else if (result.error?.includes('429')) {
            pulseRetryUntilRef.current = Date.now() + PRESENCE_PULSE_INTERVAL_MS;
          }
        } finally {
          inFlightPulseRef.current = false;
        }
      },
      () => {
        // Silent fail: heartbeat is best effort.
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [cardId, refreshMapState]);

  const handleNoteBlur = useCallback(() => {
    if (cardId) saveMyParisNote(cardId, note).catch(console.warn);
  }, [cardId, note]);

  // RUE + HEURE: text must start with "Rue X — HH:MM" (e.g. Rue Réaumur — 18:32)
  const validateRueHeure = (text: string): boolean =>
    /^Rue\s+.+?\s+—\s*\d{1,2}:\d{2}/.test(text.trim());
  const wordCount = (text: string): number =>
    text.trim().split(/\s+/).filter(Boolean).length;
  const inscriptionsForArr = useMemo(
    () => (ecrireSheetArr == null || !mapState?.inscriptions)
      ? []
      : mapState.inscriptions.filter((i) => i.arrondissement === ecrireSheetArr),
    [mapState?.inscriptions, ecrireSheetArr]
  );

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}#collection`;
    navigator.clipboard.writeText(url).then(
      () => {
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), motion.t('stone') * 2);
      },
      () => {
        setShareStatus('error');
        setTimeout(() => setShareStatus('idle'), motion.t('stone') * 2);
      }
    );
  }, []);

  const mapLoading = Boolean(cardId && hasLocalSecret(cardId) && !worldSnapshotState && !snapshotError);
  const mapError = snapshotError && !worldSnapshotState;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        position: 'relative',
        overflow: 'auto'
      }}
    >
      <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={2} />
      <BackButton onClick={onBack} />

      {(mapLoading || mapError) ? (
        <AsyncState
          loading={mapLoading}
          error={mapError ? { message: t('async.connectionInterrupted') } : null}
          onRetry={refreshMapState}
          onBack={onBack}
        />
      ) : (
        <>
      {/* Stale handling moved to WorldSnapshotContext */}

      <style>{`
        @keyframes my-paris-breathe {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.22; transform: scale(1.02); }
        }
        .my-paris-map-breathe {
          animation: my-paris-breathe ${motion.t('contemplative') * 8}ms ${motion.ease('transition')} infinite;
        }
        @keyframes you-are-here-pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
        @keyframes presence-recognition {
          0% { opacity: 0; transform: translateY(4px); }
          20% { opacity: 0.78; transform: translateY(0); }
          80% { opacity: 0.78; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-2px); }
        }
        @keyframes zone-invite {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
        }
        .zone-unexplored {
          animation: zone-invite ${motion.t('contemplative') * 3}ms ${motion.ease('transition')} infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .my-paris-map-breathe,
          .zone-unexplored {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: '560px',
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 48px)',
          paddingTop: 'clamp(80px, 10vh, 100px)',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <header style={{ textAlign: 'center', marginBottom: '20px', width: '100%' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: '400',
              color: '#1A1A1A',
              marginBottom: '8px',
              letterSpacing: '-0.02em'
            }}
          >
            {t('myparis.title')}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: '#003D2C',
              opacity: 0.5,
              marginTop: '4px'
            }}
          >
            {collectedCount} / {totalCount} {t('map.stats.symbols')}
          </p>
        </header>

        <MapLayers
          mapMode={mapMode}
          setMapMode={setMapMode}
          showThreads={showThreads}
          setShowThreads={setShowThreads}
          showTemporalOnly={showTemporalOnly}
          setShowTemporalOnly={setShowTemporalOnly}
          temporalUnlocked={temporalUnlocked}
          runsLength={runs.length}
          showSegments={showSegments}
          setShowSegments={setShowSegments}
          showInscriptionsLayer={showInscriptionsLayer}
          setShowInscriptionsLayer={setShowInscriptionsLayer}
          segmentsLabel={t('myparis.layers.segments')}
          inscriptionsLabel={t('myparis.layers.inscriptions')}
          tracesTabLabel={t('map.tabs.traces')}
          cityTabLabel={t('map.tabs.city')}
          momentsTabLabel={t('map.tabs.moments')}
          tracesHint={t('map.tabs.tracesHint')}
          cityHint={t('map.tabs.cityHint')}
          momentsHint={t('map.tabs.momentsHint')}
        />

        {encounter && mapMode === 'ville' && (
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              marginBottom: 12,
              padding: '10px 12px',
              border: '1px solid rgba(0,61,44,0.12)',
              borderRadius: 6,
              background: 'rgba(0,61,44,0.02)',
              textAlign: 'left',
            }}
          >
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              color: '#003D2C',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.72,
            }}>
              {t('map.encounter')}
            </p>
            <p style={{
              margin: '6px 0 8px',
              fontFamily: 'var(--font-serif)',
              fontSize: 15,
              color: '#1A1A1A',
              opacity: 0.88,
            }}>
              {encounter.name}
            </p>
            {encounter.lines.slice(0, 2).map((line, idx) => (
              <p
                key={`${encounter.id}-map-line-${idx}`}
                style={{
                  margin: idx === 0 ? '0 0 6px' : 0,
                  fontFamily: 'var(--font-serif)',
                  fontSize: 13,
                  color: '#1A1A1A',
                  opacity: 0.8,
                  lineHeight: 1.45,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {line}
              </p>
            ))}
            {encounter.echo?.location_hint && (
              <p
                style={{
                  margin: '8px 0 0',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  color: '#003D2C',
                  opacity: 0.62,
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                }}
              >
                {language === 'fr'
                  ? `Écho: ${encounter.echo.location_hint}`
                  : `Echo: ${encounter.echo.location_hint}`}
              </p>
            )}
          </div>
        )}

        {/* Map: homepage size or a bit bigger, then all content below */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(280px, 50vw, 420px)',
            aspectRatio: '2037.566 / 1615.5',
            marginBottom: '32px',
            flexShrink: 0
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translate(${mapPanOffset.xPct}%, ${mapPanOffset.yPct}%)`,
            }}
          >
          <img
            src="/Parissvg.svg"
            alt=""
            className="my-paris-map-breathe"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
              opacity: 0.92,
              filter: 'contrast(1.08)'
            }}
          />
          <TraceRenderer
            mapMode={mapMode}
            showSegments={showSegments}
            showInscriptionsLayer={showInscriptionsLayer}
            showThreads={showThreads}
            mapState={mapState}
            cityMapState={cityMapState}
            runs={runs}
            points={points}
            anchorZoneMap={anchorZoneMap}
          />
          <ZoneOverlay
            mapMode={mapMode}
            zoneProgressMap={zoneProgressMap}
            zoneLawMap={zoneLawMap}
            anchorZoneMap={anchorZoneMap}
            onZoneSelect={setZoneDetailArr}
            marker={presenceMarker}
            globalPulseActive={outsideCoverage}
            youAreHereLabel={outsideCoverage ? t('map.parisWaiting') : t('map.youAreHere')}
            recognitionLine={recognitionLine}
          />
          <InstrumentReadingLayer
            lieux={LIEUX_PARIS}
            instrumentState={instrumentState}
            activeLieu={activeLieu}
            onLieuTap={(lieu) => {
              if (activeLieu?.id === lieu.id && instrumentState !== 'quiet') {
                setInstrumentState('quiet');
                setActiveLieu(null);
              } else {
                setActiveLieu(lieu);
                setInstrumentState('reading');
              }
            }}
            onBackgroundTap={() => {
              setInstrumentState('quiet');
              setActiveLieu(null);
            }}
            onTransitionToInterpretation={() => setInstrumentState('interpretation')}
            onTransitionToQuiet={() => {
              setInstrumentState('quiet');
              setActiveLieu(null);
            }}
          />
        </div>
        </div>
        <p
          style={{
            marginTop: -10,
            marginBottom: 24,
            fontFamily: 'var(--font-serif)',
            fontSize: 13,
            fontStyle: 'italic',
            color: '#003D2C',
            opacity: 0.5,
            textAlign: 'center',
            letterSpacing: '0.01em',
          }}
        >
          {worldSnapshotState?.me?.monParis?.entry?.text ?? t('tagline.walkReveal')}
          {(() => {
            const link = worldSnapshotState?.me?.monParis?.entry?.link;
            return link ? (
              <>
                {' · '}
                <a
                  href={link.href}
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 13,
                    fontStyle: 'italic',
                    color: '#003D2C',
                    opacity: 0.7,
                    letterSpacing: '0.01em',
                    textDecoration: 'none',
                  }}
                >
                  {link.label}
                </a>
              </>
            ) : null;
          })()}
          {import.meta.env.VITE_DEBUG_TERRITORY && (worldSnapshotState?.me?.monParis?.entry?.code || worldSnapshotState?.me?.monParis?.reading?.code) && (
            <span style={{ fontSize: 10, opacity: 0.4, marginLeft: 6 }} title="Mon Paris state">
              [{[worldSnapshotState?.me?.monParis?.entry?.code, worldSnapshotState?.me?.monParis?.reading?.code].filter(Boolean).join(' | ')}]
            </span>
          )}
        </p>

        {worldSnapshotState?.me?.monParis?.reading && (
          <ReadingCard reading={worldSnapshotState.me.monParis.reading as MonParisReading} />
        )}

        {/* Absence (Unmarked) — arrondissements with 0 symbols: tappable → "Is this choice?" → refused */}
        {(unvisitedArrondissements.length > 0 || unvisitedRefused.length > 0) && (
          <div
            style={{
              width: '100%',
              marginBottom: '24px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(0, 61, 44, 0.08)'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#003D2C',
                opacity: 0.6,
                marginBottom: '10px'
              }}
            >
              {t('myparis.absence.title')}
            </div>
            {unvisitedNotRefused.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                {unvisitedNotRefused.map((arr) => (
                  <button
                    key={arr}
                    type="button"
                    onClick={() => setUnmarkedPromptArr(arr)}
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '12px',
                      color: '#003D2C',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(0, 61, 44, 0.26)',
                      padding: '2px 0',
                      cursor: 'pointer',
                      borderRadius: 0,
                      opacity: 0.78,
                    }}
                  >
                    {arr}e
                  </button>
                ))}
              </div>
            )}
            {unvisitedRefused.length > 0 && (
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '12px', color: '#6B6455', fontStyle: 'italic' }}>
                <span style={{ marginRight: '6px' }}>{t('myparis.absence.refused')}</span>
                <span style={{ textDecoration: 'line-through' }}>
                  {unvisitedRefused.map((arr) => `${arr}e`).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Zone detail sheet (replaces old entry prompt) */}
        <ZoneDetailSheet
          arrondissement={zoneDetailArr}
          onClose={() => {
            setZoneDetailArr(null);
            ctxRefreshZoneProgress();
          }}
          onOpenEcrire={(arr) => {
            setZoneDetailArr(null);
            setEcrireSheetArr(arr);
          }}
        />

        {/* Refusal prompt modal */}
        {unmarkedPromptArr != null && (
          <div
            role="dialog"
            aria-label={t('myparis.absence.promptTitle')}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10002,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.2)',
              padding: 24
            }}
            onClick={() => setUnmarkedPromptArr(null)}
          >
            <div
              style={{
                background: '#FAF8F2',
                border: '1px solid rgba(0, 61, 44, 0.15)',
                borderRadius: 4,
                padding: 24,
                maxWidth: 320,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                textAlign: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#1A1A1A', marginBottom: 20 }}>
                {t('myparis.absence.prompt')}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setRefused(unmarkedPromptArr, true);
                    setRefusedList((prev) => (prev.includes(unmarkedPromptArr) ? prev : [...prev, unmarkedPromptArr]));
                    setUnmarkedPromptArr(null);
                  }}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#003D2C',
                    background: 'rgba(0, 61, 44, 0.1)',
                    border: 'none',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    borderRadius: 4
                  }}
                >
                  {t('myparis.absence.yes')}
                </button>
                <button
                  type="button"
                  onClick={() => setUnmarkedPromptArr(null)}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#6B6455',
                    background: 'transparent',
                    border: '1px solid rgba(0, 61, 44, 0.2)',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    borderRadius: 4
                  }}
                >
                  {t('myparis.absence.no')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Écrire sheet — arrondissement inscription (Card Gate) */}
        <Sheet open={ecrireSheetArr !== null} onOpenChange={(open) => { if (!open) setEcrireSheetArr(null); setEcrireError(null); }}>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto"
            style={{ background: '#FAF8F2', borderColor: 'rgba(0,61,44,0.15)' }}
          >
            <SheetHeader>
              <SheetTitle style={{ fontFamily: 'var(--font-serif)', color: '#1A1A1A' }}>
                {t('myparis.ecrire.title')}
                {ecrireSheetArr != null && ` — ${ecrireSheetArr}e`}
              </SheetTitle>
            </SheetHeader>
            <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6455' }}>
                {t('myparis.ecrire.helper')}
              </p>
              <textarea
                value={ecrireDraft}
                onChange={(e) => { setEcrireDraft(e.target.value); setEcrireError(null); }}
                placeholder={t('myparis.ecrire.placeholder')}
                rows={5}
                style={{
                  width: '100%',
                  padding: 14,
                  fontFamily: 'var(--font-serif)',
                  fontSize: 14,
                  color: '#1A1A1A',
                  background: 'transparent',
                  border: '1px solid rgba(0,61,44,0.2)',
                  borderRadius: 4,
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6455' }}>
                {wordCount(ecrireDraft)} / 80–120
              </div>
              
              {/* Opt-in to Le Champ */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  color: '#003D2C',
                  opacity: 0.6,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={ecrireOptInField}
                  onChange={(e) => setEcrireOptInField(e.target.checked)}
                  style={{
                    width: 14,
                    height: 14,
                    cursor: 'pointer',
                    accentColor: '#003D2C',
                  }}
                />
                <span>Partager au Champ</span>
              </label>
              
              {ecrireError && (
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#8B0000' }}>{ecrireError}</p>
              )}
              <button
                type="button"
                disabled={ecrireSaving}
                onClick={async () => {
                  const text = ecrireDraft.trim();
                  if (!cardId || !text || ecrireSheetArr == null) return;
                  const words = wordCount(text);
                  if (words < 80 || words > 120) {
                    setEcrireError(t('myparis.ecrire.errorWords'));
                    return;
                  }
                  if (!validateRueHeure(text)) {
                    setEcrireError(t('myparis.ecrire.errorRueHeure'));
                    return;
                  }
                  setEcrireSaving(true);
                  setEcrireError(null);
                  try {
                    await postInscription(cardId, {
                      kind: 'arrondissement',
                      arrondissement: ecrireSheetArr,
                      text,
                      idempotency_key: `arr-${ecrireSheetArr}-${Date.now()}`,
                      opt_in_field: ecrireOptInField
                    });
                    refreshMapState();
                    setEcrireDraft('');
                    setEcrireOptInField(false); // Reset checkbox
                    bump('presence');
                    emitEngraveEvent('inscription');
                  } catch (err) {
                    setEcrireError(err instanceof Error ? err.message : t('map.failedToEngrave'));
                  } finally {
                    setEcrireSaving(false);
                  }
                }}
                style={{
                  padding: '10px 20px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#003D2C',
                  background: 'rgba(0,61,44,0.1)',
                  border: '1px solid rgba(0,61,44,0.3)',
                  borderRadius: 4,
                  cursor: ecrireSaving ? 'not-allowed' : 'pointer'
                }}
              >
                {ecrireSaving ? '…' : t('myparis.ecrire.graver')}
              </button>
              {inscriptionsForArr.length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid rgba(0,61,44,0.08)' }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#003D2C', opacity: 0.6, marginBottom: 8 }}>
                    {t('myparis.ecrire.inscriptions')}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {inscriptionsForArr.map((ins: MapInscription) => (
                      <li
                        key={ins.id}
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: 13,
                          color: '#1A1A1A',
                          opacity: ins.status === 'pending' ? 0.75 : 1,
                          marginBottom: 8,
                          paddingBottom: 8,
                          borderBottom: '1px solid rgba(0,61,44,0.06)'
                        }}
                      >
                        {ins.text.slice(0, 120)}{ins.text.length > 120 ? '…' : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Content below the map — full width of container */}
        <div style={{ width: '100%' }}>

        {/* Today — walking summary (no tracking: quest closes + manual only) */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(0, 61, 44, 0.08)'
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              marginBottom: '6px'
            }}
          >
            {language === 'fr' ? "Aujourd'hui" : 'Today'}
          </div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: '#1A1A1A', marginBottom: '8px' }}>
            {todaySummary.approxKm === 0
              ? `${t('home.walk')} —`
              : `${t('home.walk')} : ~${todaySummary.approxKm.toFixed(1)} km`}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {todaySummary.entries.slice(0, 3).map((e, i) => (
              <li
                key={`${e.at}-${i}`}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  color: '#6B6455',
                  marginBottom: '2px'
                }}
              >
                {e.label} — {new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </li>
            ))}
          </ul>
          {!showAddWalk ? (
            <button
              type="button"
              onClick={() => setShowAddWalk(true)}
              style={{
                marginTop: '8px',
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#003D2C',
                opacity: 0.7,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              {t('map.addWalk')}
            </button>
          ) : (
            <div style={{ marginTop: '12px' }}>
              <input
                type="text"
                placeholder={language === 'fr' ? 'Libelle' : 'Label'}
                value={addWalkLabel}
                onChange={(e) => setAddWalkLabel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  marginBottom: '6px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  border: '1px solid rgba(0,61,44,0.2)',
                  borderRadius: 4,
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="text"
                placeholder={t('map.kmOptional')}
                value={addWalkKm}
                onChange={(e) => setAddWalkKm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  marginBottom: '6px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  border: '1px solid rgba(0,61,44,0.2)',
                  borderRadius: 4,
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="text"
                placeholder={t('map.minutesOptional')}
                value={addWalkMinutes}
                onChange={(e) => setAddWalkMinutes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  border: '1px solid rgba(0,61,44,0.2)',
                  borderRadius: 4,
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    const label = addWalkLabel.trim();
                    if (!cardId || !label) return;
                    const kmRaw = addWalkKm.trim() ? parseFloat(addWalkKm) : NaN;
                    const minRaw = addWalkMinutes.trim() ? parseFloat(addWalkMinutes) : NaN;
                    const km = Number.isFinite(kmRaw) ? kmRaw : undefined;
                    const min = Number.isFinite(minRaw) ? minRaw : undefined;
                    addManualWalk(getTodayKey(), label, km, min);
                    const content = `Walk — ${label}` + (km != null ? ` (~${km} km)` : '');
                    await appendWalkToJournal(cardId, content);
                    bump('presence');
                    setAddWalkLabel('');
                    setAddWalkKm('');
                    setAddWalkMinutes('');
                    setShowAddWalk(false);
                    setWalkLogRefresh((r) => r + 1);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    color: '#003D2C',
                    background: 'rgba(0,61,44,0.08)',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  {language === 'fr' ? 'Sauver' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddWalk(false);
                    setAddWalkLabel('');
                    setAddWalkKm('');
                    setAddWalkMinutes('');
                  }}
                  style={{
                    padding: '6px 12px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    color: '#6B6455',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Traces (v1) — quest thread traces with stamps */}
        {tracesV1.length > 0 && (
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(0, 61, 44, 0.08)'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#003D2C',
                opacity: 0.6,
                marginBottom: '8px'
              }}
            >
              Traces
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {tracesV1.slice(0, 10).map((tr) => (
                <li
                  key={tr.traceId}
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '13px',
                    color: '#1A1A1A',
                    opacity: 0.85,
                    marginBottom: '6px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  onClick={() => setSelectedTraceV1(tr)}
                >
                  {tr.title} — {(tr.closedAt || tr.createdAt) && new Date(tr.closedAt || tr.createdAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Trace v1 detail panel (stamps: label + time + oracleLine) */}
        {selectedTraceV1 && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24
            }}
            onClick={() => setSelectedTraceV1(null)}
          >
            <div
              style={{
                background: '#FAF8F2',
                border: '1px solid rgba(0,61,44,0.15)',
                borderRadius: 4,
                padding: 20,
                maxWidth: 360,
                maxHeight: '80vh',
                overflow: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', marginBottom: '12px', color: '#003D2C' }}>
                {selectedTraceV1.title}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {selectedTraceV1.stamps.map((s, i) => (
                  <li
                    key={`${s.stopId}-${s.at}`}
                    style={{
                      marginBottom: '12px',
                      paddingBottom: '12px',
                      borderBottom: i < selectedTraceV1.stamps.length - 1 ? '1px solid rgba(0,61,44,0.08)' : 'none'
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: '#1A1A1A' }}>
                      {s.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#6B6455', marginTop: '2px' }}>
                      {new Date(s.at).toLocaleString()}
                    </div>
                    {s.oracleLine && (
                      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '12px', fontStyle: 'italic', color: '#003D2C', opacity: 0.9, marginTop: '4px' }}>
                        {s.oracleLine}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setSelectedTraceV1(null)}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  color: '#003D2C',
                  background: 'none',
                  border: '1px solid rgba(0,61,44,0.3)',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Quest walks trace (Fade-safe: list only, no counts) — legacy */}
        {traces.length > 0 && (
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(0, 61, 44, 0.08)'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#003D2C',
                opacity: 0.6,
                marginBottom: '8px'
              }}
            >
              Walks
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {traces.map((t, i) => (
                <li
                  key={`${t.questId}-${t.closedAt}-${i}`}
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '13px',
                    color: '#1A1A1A',
                    opacity: 0.85,
                    marginBottom: '4px'
                  }}
                >
                  {t.title} — {new Date(t.closedAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Optional note — saved to journal → appears in Carnet */}
        <div style={{ marginTop: '24px' }}>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              marginBottom: '8px'
            }}
          >
            {t('myparis.notePlaceholder').replace('…', '')}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder={t('myparis.notePlaceholder')}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 0',
              fontFamily: 'var(--font-serif)',
              fontSize: '15px',
              fontWeight: 300,
              color: '#1A1A1A',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(0, 61, 44, 0.26)',
              borderRadius: 0,
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Share My Paris */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={handleShare}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '14px 28px',
              background: 'transparent',
              color: '#0E3F2F',
              border: '0.5px solid rgba(14, 63, 47, 0.3)',
              cursor: 'pointer',
              transition: motion.transition([
                { property: 'opacity', durationMs: motion.t('brisk'), easing: motion.ease('appear') },
                { property: 'transform', durationMs: motion.t('brisk'), easing: motion.ease('appear') },
                { property: 'filter', durationMs: motion.t('brisk'), easing: motion.ease('appear') },
              ]),
              minHeight: 44
            }}
          >
            {t('myparis.share')}
          </button>
          {shareStatus === 'copied' && (
            <span style={{ fontSize: '11px', color: '#003D2C', opacity: 0.7 }}>
              {t('myparis.linkCopied')}
            </span>
          )}
          {shareStatus === 'error' && (
            <span style={{ fontSize: '11px', color: '#8B0000', opacity: 0.8 }}>
              {t('myparis.couldNotCopy')}
            </span>
          )}
          <span style={{ fontSize: '10px', color: '#6B6455', opacity: 0.6 }}>
            {t('myparis.staysOnDevice')}
          </span>
          <span style={{ fontSize: '10px', color: '#6B6455', opacity: 0.52 }}>
            {t('myparis.savedOnDevice')}
          </span>
        </div>

        {/* Link to notebook (notes) */}
        {onOpenNotebook && (
          <button
            type="button"
            onClick={onOpenNotebook}
            style={{
              marginTop: '20px',
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              color: '#003D2C',
              opacity: 0.5,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            {t('myparis.inNotebook')}
          </button>
        )}

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginTop: '28px',
            fontSize: '11px',
            fontFamily: 'var(--font-sans)',
            color: '#1A1A1A',
            opacity: 0.5
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#003D2C'
              }}
            />
            {t('myparis.legend.collected')}
          </span>
          <span>{t('myparis.legend.toDiscover')}</span>
        </div>

        <footer
          style={{
            textAlign: 'center',
            marginTop: '40px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(0, 61, 44, 0.08)'
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '14px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.4
            }}
          >
            {t('myparis.footer')}
          </p>
        </footer>
        </div>
      </div>
      </> )}
    </div>
  );
}

