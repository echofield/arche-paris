import { ARRONDISSEMENT_MAP_POSITION } from '../../data/arrondissement-positions';
import { arrToZoneId } from '../../hooks/useZoneEntry';
import { project, projectLinear, projectWithMeta, VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../../utils/map-project';
import type { ZoneProgressItem } from '../../lib/api';
import type { MapLayerMode } from './MapLayers';

const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => i + 1);

interface ZoneOverlayProps {
  mapMode: MapLayerMode;
  zoneProgressMap: Record<string, ZoneProgressItem>;
  zoneLawMap: Record<string, { allowed: boolean; reason_code?: string }>;
  anchorZoneMap: Record<string, boolean>;
  onZoneSelect: (arr: number) => void;
  activeArrondissement: number | null;
  marker: { lat: number; lng: number; moving: boolean; pulsePaused: boolean } | null;
  globalPulseActive: boolean;
  youAreHereLabel: string;
  recognitionLine: string | null;
}

export function ZoneOverlay({
  mapMode,
  zoneProgressMap,
  zoneLawMap,
  anchorZoneMap,
  onZoneSelect,
  activeArrondissement,
  marker,
  globalPulseActive,
  youAreHereLabel,
  recognitionLine,
}: ZoneOverlayProps) {
  return (
    <>
      {globalPulseActive && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'rgba(0, 120, 80, 0.15)',
              border: '1px solid rgba(0, 120, 80, 0.35)',
              animation: 'you-are-here-pulse 4.6s ease-out infinite',
            }}
          />
        </div>
      )}

      {/* Presence mode: radial aura on active arrondissement, all others muted */}
      {mapMode === 'presence' && activeArrondissement && (() => {
        const pos = ARRONDISSEMENT_MAP_POSITION[activeArrondissement];
        if (!pos) return null;
        const cx = (pos.x / 100) * VIEWBOX_WIDTH;
        const cy = (pos.y / 100) * VIEWBOX_HEIGHT;
        return (
          <>
            <svg
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}
            >
              <defs>
                <radialGradient id="presence-aura-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgb(0,120,80)" stopOpacity="0.18" />
                  <stop offset="60%" stopColor="rgb(0,120,80)" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="rgb(0,120,80)" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle
                cx={cx} cy={cy} r="180"
                fill="url(#presence-aura-grad)"
                style={{
                  transformOrigin: `${cx}px ${cy}px`,
                  animation: 'presence-breathe 7s ease-in-out infinite',
                }}
              />
            </svg>
            {ARRONDISSEMENTS.map((arr) => {
              const arrPos = ARRONDISSEMENT_MAP_POSITION[arr];
              if (!arrPos) return null;
              const isActive = arr === activeArrondissement;
              return (
                <div
                  key={`presence-${arr}`}
                  style={{
                    position: 'absolute',
                    left: `${arrPos.x}%`,
                    top: `${arrPos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: isActive ? 32 : 24,
                    height: isActive ? 32 : 24,
                    borderRadius: '50%',
                    background: isActive ? 'rgba(0,120,80,0.12)' : 'rgba(0,61,44,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 3,
                    pointerEvents: 'none',
                    opacity: isActive ? 0.95 : 0.3,
                    transition: 'opacity 1.5s ease-in-out, width 1.5s ease-in-out, height 1.5s ease-in-out',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: isActive ? 11 : 8,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#003D2C' : '#8E8982',
                      opacity: isActive ? 0.9 : 0.5,
                    }}
                  >
                    {arr}
                  </span>
                </div>
              );
            })}
          </>
        );
      })()}

      {/* Presence mode with no active arrondissement: show all muted */}
      {mapMode === 'presence' && !activeArrondissement && ARRONDISSEMENTS.map((arr) => {
        const pos = ARRONDISSEMENT_MAP_POSITION[arr];
        if (!pos) return null;
        return (
          <div
            key={`presence-idle-${arr}`}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'rgba(0,61,44,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
              pointerEvents: 'none',
              opacity: 0.3,
            }}
          >
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, color: '#8E8982', opacity: 0.5 }}>
              {arr}
            </span>
          </div>
        );
      })}

      {/* Inscriptions + Constellation modes: zone circles with progress */}
      {mapMode !== 'presence' && ARRONDISSEMENTS.map((arr) => {
        const pos = ARRONDISSEMENT_MAP_POSITION[arr];
        if (!pos) return null;
        const zoneId = arrToZoneId(arr);
        const progress = zoneProgressMap[zoneId];
        const law = zoneLawMap[zoneId];
        const isLawLocked = Boolean(law && law.allowed === false);
        const objectivesComplete = progress?.objectives_complete ?? 0;
        const progressPct = objectivesComplete * 20;
        const isUnexplored = objectivesComplete === 0;
        const isComplete = objectivesComplete === 5;
        const isCustodian = progress?.is_custodian === true;
        const hasPresence = progress?.presence_ritual === true;
        const hasObservation = progress?.observation_ritual === true;
        const isSealed = hasPresence && hasObservation;
        const hasEntered = progress?.entered === true;
        const isAnchorZone = anchorZoneMap[zoneId] === true;

        const getRituelFill = () => {
          if (isSealed) return '#4a7c59';
          if (hasEntered) return '#d4af37';
          return '#e5e5e5';
        };

        const custodyGlow = isCustodian ? {
          boxShadow: '0 0 12px 4px rgba(212,175,55,0.5), 0 2px 8px rgba(0,0,0,0.15)',
          border: '2px solid #d4af37',
        } : {};

        if (mapMode === 'constellation') {
          return (
            <button
              key={arr}
              type="button"
              aria-label={`${arr}e arrondissement - ${isSealed ? 'Scellé' : hasEntered ? 'Entré' : 'Inexploré'}${isCustodian ? ' (Gardien)' : ''}`}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: getRituelFill(),
                border: isCustodian ? '2px solid #d4af37' : isLawLocked ? '1px dashed rgba(139,0,0,0.45)' : '1px solid rgba(0,0,0,0.1)',
                opacity: isAnchorZone ? 0.96 : isLawLocked ? 0.64 : 0.78,
                cursor: 'pointer',
                zIndex: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                ...custodyGlow,
              }}
              onClick={() => onZoneSelect(arr)}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 9,
                  fontWeight: 500,
                  color: isSealed ? '#FAF8F2' : hasEntered ? '#1A1A1A' : '#8E8982',
                }}
              >
                {arr}
              </span>
            </button>
          );
        }

        return (
          <button
            key={arr}
            type="button"
            aria-label={`${arr}e arrondissement - ${objectivesComplete}/5 objectifs${isLawLocked ? ` (${law?.reason_code ?? 'LOCKED'})` : ''}${isCustodian ? ' (Gardien)' : ''}`}
            className={isUnexplored ? 'zone-unexplored' : ''}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              width: isComplete ? 34 : 28,
              height: isComplete ? 34 : 28,
              borderRadius: '50%',
              background: isComplete
                ? 'linear-gradient(135deg, #007850 0%, #003D2C 100%)'
                : objectivesComplete > 0
                  ? `conic-gradient(#003D2C ${progressPct}%, rgba(0,61,44,0.15) ${progressPct}%)`
                  : 'rgba(0,61,44,0.08)',
              cursor: 'pointer',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              opacity: isAnchorZone ? 0.92 : isLawLocked ? 0.58 : 0.72,
              ...(isCustodian ? custodyGlow : {
                border: isComplete ? '2px solid rgba(255,215,0,0.4)' : 'none',
                boxShadow: isComplete ? '0 2px 8px rgba(0,61,44,0.3)' : 'none',
              }),
            }}
            onClick={() => onZoneSelect(arr)}
          >
            <span
              style={{
                width: isComplete ? 26 : 20,
                height: isComplete ? 26 : 20,
                borderRadius: '50%',
                background: isComplete ? 'transparent' : '#FAF8F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-sans)',
                fontSize: isComplete ? 11 : 9,
                fontWeight: isComplete ? 600 : 500,
                color: isComplete ? '#FAF8F2' : objectivesComplete > 0 ? '#003D2C' : '#8E8982',
              }}
            >
              {isComplete ? 'OK' : isUnexplored ? '•' : arr}
            </span>
          </button>
        );
      })}

      {/* Precise marker: only in non-presence modes (inscriptions/constellation) */}
      {mapMode !== 'presence' && marker && (() => {
        const pt = project(marker.lat, marker.lng);
        const pulseDur = marker.moving ? '2.5s' : '4.2s';
        return (
          <svg
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}
          >
            <defs>
              <filter id="marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#000" floodOpacity="0.22" />
              </filter>
            </defs>
            <circle
              cx={pt.x} cy={pt.y} r="160"
              fill="rgba(0, 120, 80, 0.08)"
              style={{
                transformOrigin: `${pt.x}px ${pt.y}px`,
                animation: `you-are-here-pulse ${pulseDur} ease-out infinite`,
                animationPlayState: marker.pulsePaused ? 'paused' : 'running',
              }}
            />
            <circle cx={pt.x} cy={pt.y} r="50" fill="#007850" stroke="#FAF8F2" strokeWidth="10" filter="url(#marker-shadow)" />
            <foreignObject x={pt.x - 80} y={pt.y + 65} width="250" height="100" style={{ overflow: 'visible' }}>
              <div style={{
                padding: '4px 10px',
                borderRadius: 10,
                background: 'rgba(250,248,242,0.92)',
                border: '1px solid rgba(0,61,44,0.14)',
                fontFamily: 'var(--font-sans)',
                fontSize: 22,
                color: '#003D2C',
                opacity: 0.82,
                whiteSpace: 'nowrap',
                width: 'fit-content',
              }}>
                {youAreHereLabel}
              </div>
              {recognitionLine && (
                <div style={{
                  marginTop: 12,
                  fontFamily: 'var(--font-serif)',
                  fontSize: 24,
                  fontStyle: 'italic',
                  color: '#003D2C',
                  opacity: 0.78,
                  whiteSpace: 'nowrap',
                  animation: 'presence-recognition 4s ease-in-out forwards',
                }}>
                  {recognitionLine}
                </div>
              )}
            </foreignObject>
          </svg>
        );
      })()}

      {/* Debug overlay: env var OR ?debug URL param — ONLY place coordinates are ever shown */}
      {(import.meta.env.VITE_DEBUG_TERRITORY || new URLSearchParams(window.location.search).has('debug')) && marker && (() => {
        const warped = projectWithMeta(marker.lat, marker.lng);
        const linear = projectLinear(marker.lat, marker.lng);
        const wPct = { x: (warped.x / VIEWBOX_WIDTH) * 100, y: (warped.y / VIEWBOX_HEIGHT) * 100 };
        const lPct = { x: (linear.x / VIEWBOX_WIDTH) * 100, y: (linear.y / VIEWBOX_HEIGHT) * 100 };
        return (
          <>
            <svg
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9 }}
            >
              <circle cx={linear.x} cy={linear.y} r="30" fill="rgba(120,120,120,0.25)" />
              <circle cx={linear.x} cy={linear.y} r="12" fill="#888" stroke="#fff" strokeWidth="3" opacity="0.6" />
            </svg>
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                left: 4,
                zIndex: 99,
                background: 'rgba(0,0,0,0.88)',
                color: '#0f0',
                fontFamily: 'monospace',
                fontSize: 10,
                padding: '6px 8px',
                borderRadius: 4,
                lineHeight: 1.5,
                pointerEvents: 'none',
              }}
            >
              {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}<br />
              <span style={{ color: '#0f0' }}>warp</span> {wPct.x.toFixed(1)}%,{wPct.y.toFixed(1)}% tri:{warped.triangleIndex}<br />
              <span style={{ color: '#888' }}>lin</span>&nbsp; {lPct.x.toFixed(1)}%,{lPct.y.toFixed(1)}%
              {activeArrondissement != null && <><br />arr: {activeArrondissement}e</>}
            </div>
          </>
        );
      })()}

      <style>{`
        @keyframes presence-breathe {
          0%, 100% { opacity: 0.10; transform: scale(1); }
          50% { opacity: 0.22; transform: scale(1.06); }
        }
      `}</style>
    </>
  );
}
