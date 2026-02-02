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

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import type { QuestThreadTrace } from '../types/traces';

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

  useEffect(() => {
    loadMyParisNote(cardId).then(setNote);
  }, [cardId]);

  const handleNoteBlur = useCallback(() => {
    saveMyParisNote(cardId, note).catch(console.warn);
  }, [cardId, note]);

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
        {/* Threads / Temporal Meridians toggles */}
        {(runs.length > 0 || temporalUnlocked) && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)', fontSize: 11, cursor: 'pointer' }}>
              <input type="checkbox" checked={showThreads} onChange={() => setShowThreads((v) => !v)} />
              Threads
            </label>
            {temporalUnlocked && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)', fontSize: 11, cursor: 'pointer' }}>
                <input type="checkbox" checked={showTemporalOnly} onChange={() => setShowTemporalOnly((v) => !v)} />
                Temporal Meridians only
              </label>
            )}
          </div>
        )}

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
        </div>

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
            Walking: ~{todaySummary.approxKm.toFixed(1)} km
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
