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

import { useState, useEffect, useMemo, useCallback, useRef, type CSSProperties } from 'react';
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
import { project } from '../utils/map-project';
import { QUETES_DATA } from './QueteDetail';
import { CompanionBlock } from './CompanionBlock';
import { useTranslation } from '../utils/i18n';
import { getRefusedArrondissements, isRefused, setRefused } from '../utils/refused-arrondissements';
import { getMapState, postInscription } from '../utils/card-gate-map-client';
import { hasLocalSecret } from '../utils/card-gate-client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import type { QuestThreadTrace } from '../types/traces';
import type { MapState, MapInscription, EngravedSegment } from '../types/map-engraving';
import { emitEngraveEvent } from '../utils/engrave-events';
import { useZoneEntry, arrToZoneId } from '../hooks/useZoneEntry';
import { useGeolocation } from '../hooks/useGeolocation';
import { ZoneEntryFeedback } from './ZoneEntryFeedback';
import { ZoneDetailSheet } from './ZoneDetailSheet';
import { api, type ZoneProgressItem } from '../lib/api';

const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => i + 1);

interface PersonalMemoryMapProps {
  cardId: string;
  onBack: () => void;
  onOpenNotebook?: () => void;
}

interface MapPoint {
  symbol: Symbol;
  x: number;
  y: number;
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

const VIEWBOX_WIDTH = 2037.566;
const VIEWBOX_HEIGHT = 1615.5;

export function PersonalMemoryMap({ cardId, onBack, onOpenNotebook }: PersonalMemoryMapProps) {
  const { t } = useTranslation();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [showThreads, setShowThreads] = useState(true);
  const [showTemporalOnly, setShowTemporalOnly] = useState(false);
  const [popover, setPopover] = useState<{ runId: string; questId: string; nodeId: string; name: string; geste: string; evidenceCount: number } | null>(null);
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
  const [mapStateError, setMapStateError] = useState<string | null>(null);
  const previousMapStateRef = useRef<MapState | null>(null);
  const [showSegments, setShowSegments] = useState(true);
  const [showInscriptionsLayer, setShowInscriptionsLayer] = useState(true);
  const [ecrireSheetArr, setEcrireSheetArr] = useState<number | null>(null);
  const [ecrireDraft, setEcrireDraft] = useState('');
  const [ecrireSaving, setEcrireSaving] = useState(false);
  const [ecrireError, setEcrireError] = useState<string | null>(null);
  const [ecrireOptInField, setEcrireOptInField] = useState(false); // Share to Le Champ
  // ARCHÉ zone entry
  const zoneEntry = useZoneEntry();
  const [zoneEntryPromptArr, setZoneEntryPromptArr] = useState<number | null>(null);
  const [zoneDetailArr, setZoneDetailArr] = useState<number | null>(null);
  const [zoneProgressMap, setZoneProgressMap] = useState<Record<string, ZoneProgressItem>>({});
  // GPS location for "You are here" marker
  const geo = useGeolocation();

  // Load zone progress on mount
  useEffect(() => {
    api.zoneProgress().then(result => {
      if (result.data) {
        const map: Record<string, ZoneProgressItem> = {};
        result.data.zones.forEach(z => { map[z.zone_id] = z; });
        setZoneProgressMap(map);
      }
    }).catch(() => {});
  }, []);

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
    if (!hasLocalSecret(cardId)) return;
    loadMyParisNote(cardId).then(setNote);
  }, [cardId]);

  useEffect(() => {
    if (!hasLocalSecret(cardId)) return;
    setMapStateError(null);
    getMapState(cardId)
      .then((state) => {
        previousMapStateRef.current = state;
        setMapState(state);
      })
      .catch((err) => {
        setMapStateError(err instanceof Error ? err.message : 'Failed to load map state');
        setMapState(null);
        previousMapStateRef.current = null;
      });
  }, [cardId]);

  const refreshMapState = useCallback(() => {
    getMapState(cardId)
      .then((newState) => {
        const prevState = previousMapStateRef.current;
        
        // Detect verified status changes (pending → verified)
        if (prevState) {
          let hasNewlyVerified = false;
          
          // Check inscriptions
          for (const newInscription of newState.inscriptions) {
            const prevInscription = prevState.inscriptions.find((i) => i.id === newInscription.id);
            if (prevInscription && prevInscription.status === 'pending' && newInscription.status === 'verified') {
              hasNewlyVerified = true;
              break;
            }
          }
          
          // Check segments
          if (!hasNewlyVerified) {
            for (const newSegment of newState.segments) {
              const prevSegment = prevState.segments.find((s) => s.id === newSegment.id);
              if (prevSegment && prevSegment.status === 'pending' && newSegment.status === 'verified') {
                hasNewlyVerified = true;
                break;
              }
            }
          }
          
          // Check meridian proofs
          if (!hasNewlyVerified) {
            for (const newProof of newState.meridian_proofs) {
              const prevProof = prevState.meridian_proofs.find((p) => p.id === newProof.id);
              if (prevProof && prevProof.status === 'pending' && newProof.status === 'verified') {
                hasNewlyVerified = true;
                break;
              }
            }
          }
          
          // Emit verified event once per refresh if any newly verified items found
          if (hasNewlyVerified) {
            emitEngraveEvent('verified');
          }
        }
        
        previousMapStateRef.current = newState;
        setMapState(newState);
      })
      .catch(() => {});
  }, [cardId]);

  const handleNoteBlur = useCallback(() => {
    saveMyParisNote(cardId, note).catch(console.warn);
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
        setTimeout(() => setShareStatus('idle'), 2500);
      },
      () => {
        setShareStatus('error');
        setTimeout(() => setShareStatus('idle'), 2500);
      }
    );
  }, []);

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

      <style>{`
        @keyframes my-paris-breathe {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.22; transform: scale(1.02); }
        }
        .my-paris-map-breathe {
          animation: my-paris-breathe 8s ease-in-out infinite;
        }
        @keyframes you-are-here-pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
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
        {/* Layer toggles: ARCHÉ pill toggles (no blue checkboxes) */}
        {(() => {
          const visuallyHidden: CSSProperties = {
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0
          };
          const pillBase: CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            height: 32,
            padding: '0 12px',
            border: '1px solid #DBD4C6',
            background: '#FAF8F3',
            color: '#1F3B2E',
            borderRadius: 999,
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background 0.2s ease, border-color 0.2s ease'
          };
          const pillChecked: CSSProperties = {
            background: 'rgba(31,59,46,0.06)',
            borderColor: 'rgba(31,59,46,0.35)'
          };
          const dotBase: CSSProperties = {
            width: 6,
            height: 6,
            borderRadius: '50%',
            flexShrink: 0
          };
          const PillToggle = ({
            checked,
            onChange,
            label,
            ariaLabel
          }: { checked: boolean; onChange: () => void; label: string; ariaLabel: string }) => (
            <label
              style={{
                ...pillBase,
                ...(checked ? pillChecked : {}),
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!checked) e.currentTarget.style.background = 'rgba(31,59,46,0.04)';
              }}
              onMouseLeave={(e) => {
                if (!checked) e.currentTarget.style.background = '#FAF8F3';
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                style={visuallyHidden}
                aria-label={ariaLabel}
                onFocus={(e) => {
                  e.currentTarget.parentElement!.style.outline = '2px solid rgba(31,59,46,0.25)';
                  e.currentTarget.parentElement!.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.parentElement!.style.outline = 'none';
                  e.currentTarget.parentElement!.style.outlineOffset = '0';
                }}
              />
              <span
                style={{
                  ...dotBase,
                  background: checked ? 'rgba(31,59,46,0.55)' : 'transparent',
                  border: `1px solid ${checked ? 'rgba(31,59,46,0.55)' : '#DBD4C6'}`
                }}
              />
              <span>{label}</span>
            </label>
          );
          return (
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {(runs.length > 0 || temporalUnlocked) && (
                <>
                  <PillToggle
                    checked={showThreads}
                    onChange={() => setShowThreads((v) => !v)}
                    label="Threads"
                    ariaLabel="Threads"
                  />
                  {temporalUnlocked && (
                    <PillToggle
                      checked={showTemporalOnly}
                      onChange={() => setShowTemporalOnly((v) => !v)}
                      label="Temporal Meridians only"
                      ariaLabel="Temporal Meridians only"
                    />
                  )}
                </>
              )}
              <PillToggle
                checked={showSegments}
                onChange={() => setShowSegments((v) => !v)}
                label={t('myparis.layers.segments')}
                ariaLabel={t('myparis.layers.segments')}
              />
              <PillToggle
                checked={showInscriptionsLayer}
                onChange={() => setShowInscriptionsLayer((v) => !v)}
                label={t('myparis.layers.inscriptions')}
                ariaLabel={t('myparis.layers.inscriptions')}
              />
            </div>
          );
        })()}

        {/* Map: homepage size or a bit bigger, then all content below */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(280px, 50vw, 420px)',
            height: 'clamp(200px, 35vw, 320px)',
            marginBottom: '32px',
            flexShrink: 0
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
              pointerEvents: 'none'
            }}
          />
          {/* Layer 2 — Engraved segments (Card Gate) */}
          {showSegments && mapState?.segments && mapState.segments.length > 0 && (
            <svg
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            >
              {mapState.segments.map((seg: EngravedSegment) => {
                const fromP = seg.from?.lat != null && seg.from?.lng != null
                  ? project(seg.from.lat, seg.from.lng)
                  : seg.from?.arrondissement != null && ARRONDISSEMENT_MAP_POSITION[seg.from.arrondissement]
                    ? {
                        x: (ARRONDISSEMENT_MAP_POSITION[seg.from.arrondissement].x / 100) * VIEWBOX_WIDTH,
                        y: (ARRONDISSEMENT_MAP_POSITION[seg.from.arrondissement].y / 100) * VIEWBOX_HEIGHT
                      }
                    : null;
                const toP = seg.to?.lat != null && seg.to?.lng != null
                  ? project(seg.to.lat, seg.to.lng)
                  : seg.to?.arrondissement != null && ARRONDISSEMENT_MAP_POSITION[seg.to.arrondissement]
                    ? {
                        x: (ARRONDISSEMENT_MAP_POSITION[seg.to.arrondissement].x / 100) * VIEWBOX_WIDTH,
                        y: (ARRONDISSEMENT_MAP_POSITION[seg.to.arrondissement].y / 100) * VIEWBOX_HEIGHT
                      }
                    : null;
                if (!fromP || !toP) return null;
                const isPending = seg.status === 'pending';
                return (
                  <line
                    key={seg.id}
                    x1={fromP.x}
                    y1={fromP.y}
                    x2={toP.x}
                    y2={toP.y}
                    stroke="#003D2C"
                    strokeWidth={isPending ? 1.5 : 2}
                    strokeDasharray={isPending ? '4 4' : 'none'}
                    opacity={isPending ? 0.5 : 0.85}
                  />
                );
              })}
            </svg>
          )}
          {/* Layer 3 — Inscription marks (arrondissements with inscriptions) */}
          {showInscriptionsLayer && mapState?.inscriptions && mapState.inscriptions.length > 0 && (() => {
            const arrsWithInscriptions = new Set(
              mapState.inscriptions.map((i) => i.arrondissement).filter((a): a is number => a != null)
            );
            return (
              <>
                {Array.from(arrsWithInscriptions).map((arr) => {
                  const pos = ARRONDISSEMENT_MAP_POSITION[arr];
                  if (!pos) return null;
                  return (
                    <div
                      key={arr}
                      style={{
                        position: 'absolute',
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#003D2C',
                        opacity: 0.6,
                        pointerEvents: 'none'
                      }}
                    />
                  );
                })}
              </>
            );
          })()}
          {/* Quest threads overlay — polylines + stamps (from getRuns). TODO: optionally unify with traces_v1 for selected trace highlight. */}
          {showThreads && runs.length > 0 && (
            <svg
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            >
              {runs.map((run) => {
                const quete = QUETES_DATA[run.questId];
                const nodes = quete?.stops?.filter((s): s is typeof s & { nodeId: string; coordinates: { lat: number; lng: number } } => !!(s.nodeId && s.coordinates)) ?? [];
                const pts = nodes.map((s) => project(s.coordinates.lat, s.coordinates.lng));
                const pathD = pts.length > 1 ? `M ${pts.map((p) => `${p.x} ${p.y}`).join(' L ')}` : '';
                const stroke = run.closedAt ? '#003D2C' : '#8E8982';
                return (
                  <g key={run.runId} style={{ pointerEvents: 'auto' }}>
                    <path d={pathD} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} pointerEvents="none" />
                    {nodes.map((stop, i) => {
                      if (!run.visited[stop.nodeId]) return null;
                      const p = pts[i];
                      return (
                        <circle
                          key={stop.nodeId}
                          cx={p.x}
                          cy={p.y}
                          r={8}
                          fill="#003D2C"
                          opacity={0.9}
                          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPopover({
                              runId: run.runId,
                              questId: run.questId,
                              nodeId: stop.nodeId,
                              name: stop.name,
                              geste: stop.geste,
                              evidenceCount: run.visited[stop.nodeId]?.evidenceLocalIds?.length ?? 0
                            });
                          }}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          )}
          {/* Stamp popover */}
          {popover && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: 12,
                padding: 12,
                background: '#FAF8F2',
                border: '1px solid rgba(0,61,44,0.2)',
                borderRadius: 4,
                maxWidth: 260,
                zIndex: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
              }}
            >
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>{popover.name}</div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 12, fontStyle: 'italic', color: '#003D2C', opacity: 0.9, marginBottom: 10 }}>{popover.geste}</p>
              {popover.evidenceCount > 0 && (
                <button type="button" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 8, background: 'none', border: 'none', color: '#003D2C', opacity: 0.7, cursor: 'pointer' }}>
                  View evidence
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  window.location.hash = `quete/${popover.questId}`;
                  setPopover(null);
                }}
                style={{ fontSize: 10, textTransform: 'uppercase', background: 'none', border: 'none', color: '#003D2C', cursor: 'pointer', fontWeight: 500 }}
              >
                Continue
              </button>
            </div>
          )}
          {points.map(({ symbol, x, y }) => (
            <div
              key={symbol.id}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 2
              }}
              onMouseEnter={() => setHoveredId(symbol.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#003D2C',
                  cursor: 'default',
                  transition: 'transform 0.2s ease',
                  transform: hoveredId === symbol.id ? 'scale(1.4)' : 'scale(1)'
                }}
              />
              {hoveredId === symbol.id && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '8px',
                    padding: '6px 12px',
                    background: '#1A1A1A',
                    color: '#FAF8F2',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '10px',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    borderRadius: '2px'
                  }}
                >
                  {symbol.name}
                </div>
              )}
            </div>
          ))}
          {/* Clickable arrondissement zones with progress rings */}
          {ARRONDISSEMENTS.map((arr) => {
            const pos = ARRONDISSEMENT_MAP_POSITION[arr];
            if (!pos) return null;
            const zoneId = arrToZoneId(arr);
            const progress = zoneProgressMap[zoneId];
            const objectivesComplete = progress?.objectives_complete ?? 0;
            const progressPct = objectivesComplete * 20; // 5 objectives = 100%
            return (
              <button
                key={arr}
                type="button"
                aria-label={`${arr}e arrondissement - ${objectivesComplete}/5 objectifs`}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: objectivesComplete > 0
                    ? `conic-gradient(#003D2C ${progressPct}%, rgba(0,61,44,0.15) ${progressPct}%)`
                    : 'rgba(0,61,44,0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
                onClick={() => setZoneDetailArr(arr)}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#FAF8F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 9,
                    fontWeight: 500,
                    color: objectivesComplete > 0 ? '#003D2C' : '#8E8982',
                  }}
                >
                  {objectivesComplete === 5 ? '✓' : arr}
                </span>
              </button>
            );
          })}
          {/* "You are here" marker */}
          {geo.lat !== null && geo.lng !== null && (() => {
            const userPos = project(geo.lat, geo.lng);
            const xPct = (userPos.x / VIEWBOX_WIDTH) * 100;
            const yPct = (userPos.y / VIEWBOX_HEIGHT) * 100;
            // Only show if within reasonable bounds (Paris area)
            if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return null;
            return (
              <div
                style={{
                  position: 'absolute',
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                {/* Pulsing ring */}
                <div
                  style={{
                    position: 'absolute',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(0, 120, 80, 0.15)',
                    transform: 'translate(-50%, -50%)',
                    left: '50%',
                    top: '50%',
                    animation: 'you-are-here-pulse 2s ease-out infinite',
                  }}
                />
                {/* Center dot */}
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#007850',
                    border: '2px solid #FAF8F2',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}
                />
              </div>
            );
          })()}
        </div>

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
                      border: '1px dashed rgba(0, 61, 44, 0.3)',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      borderRadius: 2
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
            // Reload progress after closing
            api.zoneProgress().then(result => {
              if (result.data) {
                const map: Record<string, ZoneProgressItem> = {};
                result.data.zones.forEach(z => { map[z.zone_id] = z; });
                setZoneProgressMap(map);
              }
            }).catch(() => {});
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
                  if (!text || ecrireSheetArr == null) return;
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
                    setEcrireError(err instanceof Error ? err.message : 'Failed to engrave');
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
        <header style={{ textAlign: 'center', marginBottom: '24px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, right: 0 }}>
            <CompanionBlock />
          </div>
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
              fontSize: '12px',
              color: '#003D2C',
              opacity: 0.6
            }}
          >
            {t('myparis.savedOnDevice')}
          </p>
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
            Today
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
              Add a walk
            </button>
          ) : (
            <div style={{ marginTop: '12px' }}>
              <input
                type="text"
                placeholder="Label"
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
                placeholder="km (optional)"
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
                placeholder="minutes (optional)"
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
                    if (!label) return;
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
                  Save
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
                  Cancel
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
              padding: '14px 16px',
              fontFamily: 'var(--font-serif)',
              fontSize: '15px',
              fontWeight: 300,
              color: '#1A1A1A',
              background: 'transparent',
              border: '0.5px solid rgba(0, 61, 44, 0.2)',
              borderRadius: '2px',
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
              transition: 'all 0.3s ease',
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
    </div>
  );
}
