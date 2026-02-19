import { ARRONDISSEMENT_MAP_POSITION } from '../../data/arrondissement-positions';
import { arrToZoneId } from '../../hooks/useZoneEntry';
import { project } from '../../utils/map-project';
import type { ZoneProgressItem } from '../../lib/api';
import type { MapLayerMode } from './MapLayers';

const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => i + 1);
const VIEWBOX_WIDTH = 2037.566;
const VIEWBOX_HEIGHT = 1615.5;

interface ZoneOverlayProps {
  mapMode: MapLayerMode;
  zoneProgressMap: Record<string, ZoneProgressItem>;
  zoneLawMap: Record<string, { allowed: boolean; reason_code?: string }>;
  onZoneSelect: (arr: number) => void;
  geoLat: number | null;
  geoLng: number | null;
}

export function ZoneOverlay({
  mapMode,
  zoneProgressMap,
  zoneLawMap,
  onZoneSelect,
  geoLat,
  geoLng,
}: ZoneOverlayProps) {
  return (
    <>
      {mapMode !== 'ville' && ARRONDISSEMENTS.map((arr) => {
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

        const getRituelFill = () => {
          if (isSealed) return '#4a7c59';
          if (hasEntered) return '#d4af37';
          return '#e5e5e5';
        };

        const custodyGlow = isCustodian ? {
          boxShadow: '0 0 12px 4px rgba(212,175,55,0.5), 0 2px 8px rgba(0,0,0,0.15)',
          border: '2px solid #d4af37',
        } : {};

        if (mapMode === 'rituels') {
          return (
            <button
              key={arr}
              type="button"
              aria-label={`${arr}e arrondissement - ${isSealed ? 'Scelle' : hasEntered ? 'Entre' : 'Inexplore'}${isLawLocked ? ` (${law?.reason_code ?? 'LOCKED'})` : ''}${isCustodian ? ' (Gardien)' : ''}`}
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
                opacity: isLawLocked ? 0.78 : 1,
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
              width: isComplete ? 36 : 32,
              height: isComplete ? 36 : 32,
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
              opacity: isLawLocked ? 0.86 : 1,
              ...(isCustodian ? custodyGlow : {
                border: isComplete ? '2px solid rgba(255,215,0,0.4)' : 'none',
                boxShadow: isComplete ? '0 2px 8px rgba(0,61,44,0.3)' : 'none',
              }),
            }}
            onClick={() => onZoneSelect(arr)}
          >
            <span
              style={{
                width: isComplete ? 28 : 24,
                height: isComplete ? 28 : 24,
                borderRadius: '50%',
                background: isComplete ? 'transparent' : '#FAF8F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-sans)',
                fontSize: isComplete ? 12 : 9,
                fontWeight: isComplete ? 600 : 500,
                color: isComplete ? '#FAF8F2' : objectivesComplete > 0 ? '#003D2C' : '#8E8982',
              }}
            >
              {isComplete ? 'OK' : isUnexplored ? 'O' : arr}
            </span>
          </button>
        );
      })}

      {geoLat !== null && geoLng !== null && (() => {
        const userPos = project(geoLat, geoLng);
        const xPct = (userPos.x / VIEWBOX_WIDTH) * 100;
        const yPct = (userPos.y / VIEWBOX_HEIGHT) * 100;
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
    </>
  );
}
