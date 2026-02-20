import { useState } from 'react';
import { ARRONDISSEMENT_MAP_POSITION } from '../../data/arrondissement-positions';
import { project } from '../../utils/map-project';
import { QUETES_DATA } from '../QueteDetail';
import type { MapState, EngravedSegment, CityMapState } from '../../types/map-engraving';
import type { MapLayerMode } from './MapLayers';
import { motion } from '../../design/motion';

const VIEWBOX_WIDTH = 2037.566;
const VIEWBOX_HEIGHT = 1615.5;

interface TracePoint {
  symbol: { id: string; name: string };
  x: number;
  y: number;
}

interface QuestRunLike {
  runId: string;
  questId: string;
  closedAt?: string | null;
  visited: Record<string, { evidenceLocalIds?: string[] } | undefined>;
}

interface TraceRendererProps {
  mapMode: MapLayerMode;
  showSegments: boolean;
  showInscriptionsLayer: boolean;
  showThreads: boolean;
  mapState: MapState | null;
  cityMapState: CityMapState | null;
  runs: QuestRunLike[];
  points: TracePoint[];
  anchorZoneMap: Record<string, boolean>;
}

export function TraceRenderer({
  mapMode,
  showSegments,
  showInscriptionsLayer,
  showThreads,
  mapState,
  cityMapState,
  runs,
  points,
  anchorZoneMap,
}: TraceRendererProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [popover, setPopover] = useState<{ runId: string; questId: string; nodeId: string; name: string; geste: string; evidenceCount: number } | null>(null);

  return (
    <>
      {mapMode === 'ville' && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(250,248,242,0.25)',
              zIndex: 4,
              pointerEvents: 'none',
            }}
          />
          {(cityMapState?.arrondissements ?? []).map((sig) => {
            const pos = ARRONDISSEMENT_MAP_POSITION[sig.arrondissement];
            if (!pos) return null;
            const size = 10 + sig.signalStrength * 22;
            const zoneId = `paris-${sig.arrondissement}`;
            const anchorBoost = anchorZoneMap[zoneId] ? 0.08 : 0;
            const opacity = Math.min(0.9, 0.2 + sig.signalStrength * 0.55 + anchorBoost);
            return (
              <div
                key={`city-${sig.arrondissement}`}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  background: sig.verifiedInscriptions > 0 ? '#003D2C' : '#6B6455',
                  opacity,
                  boxShadow: `0 0 ${8 + sig.signalStrength * 18}px rgba(0,61,44,${0.15 + sig.signalStrength * 0.35})`,
                  zIndex: 6,
                }}
                title={`${sig.arrondissement}e · ${sig.inscriptionCount} traces · ${sig.segmentCount} lignes`}
              />
            );
          })}
          {(cityMapState?.arrondissements?.length ?? 0) === 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 6,
                pointerEvents: 'none',
              }}
            >
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 13, fontStyle: 'italic', color: '#6B6455', opacity: 0.8 }}>
                La Ville est calme pour l instant.
              </p>
            </div>
          )}
        </>
      )}

      {mapMode === 'traces' && showSegments && mapState?.segments && mapState.segments.length > 0 && (
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
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
                opacity={isPending ? 0.35 : 0.56}
              />
            );
          })}
        </svg>
      )}

      {mapMode === 'traces' && showInscriptionsLayer && mapState?.inscriptions && mapState.inscriptions.length > 0 && (() => {
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
                    opacity: 0.4,
                    pointerEvents: 'none'
                  }}
                />
              );
            })}
          </>
        );
      })()}

      {mapMode === 'traces' && showThreads && runs.length > 0 && (
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
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

      {mapMode === 'traces' && points.map(({ symbol, x, y }) => (
        <div
          key={symbol.id}
          style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', zIndex: 2 }}
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
              opacity: hoveredId === symbol.id ? 0.94 : 0.82,
              transition: motion.transition([
                { property: 'opacity', durationMs: motion.t('brisk'), easing: motion.ease('appear') },
                { property: 'transform', durationMs: motion.t('brisk'), easing: motion.ease('appear') },
                { property: 'filter', durationMs: motion.t('brisk'), easing: motion.ease('appear') },
              ]),
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
    </>
  );
}
