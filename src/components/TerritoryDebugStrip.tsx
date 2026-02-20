/**
 * ARCHÉ — Dev-only territory/location debug strip for MVP-loop audit.
 * Shows: status, zoneForApi, currentZone (if different), accuracyM, samplesCount, locationTrust, outsideCoverage.
 * Visible only when NODE_ENV !== 'production' or VITE_DEBUG_TERRITORY=1.
 */

import { useTerritoryResolverContext } from '@/contexts/TerritoryResolverContext';
import { useSnapshotDebug } from '@/contexts/SnapshotDebugContext';

const DEBUG_ON =
  import.meta.env.DEV ||
  (typeof import.meta.env.VITE_DEBUG_TERRITORY !== 'undefined' && import.meta.env.VITE_DEBUG_TERRITORY === '1');

export function TerritoryDebugStrip() {
  const territory = useTerritoryResolverContext();
  const { locationTrust } = useSnapshotDebug();

  if (!DEBUG_ON) return null;

  const currentZone = territory.zoneId ?? '—';
  const zoneForApi = territory.zoneForApi ?? '—';
  const currentDiffers = currentZone !== '—' && zoneForApi !== '—' && currentZone !== zoneForApi;
  const accuracyStr =
    territory.accuracyM != null ? String(Math.round(territory.accuracyM)) : '—';
  const trustStr = locationTrust ?? '—';
  const outsideStr = territory.outsideCoverage ? 'yes' : 'no';

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        padding: '6px 10px',
        paddingTop: 'max(6px, env(safe-area-inset-top, 0px))',
        background: 'rgba(0,40,30,0.92)',
        color: '#c4e0d4',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '11px',
        lineHeight: 1.35,
        pointerEvents: 'none',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0 12px',
        alignItems: 'center',
      }}
    >
      <span>status: {territory.status}</span>
      <span>zoneForApi: {zoneForApi}</span>
      {currentDiffers && <span>currentZone: {currentZone}</span>}
      <span>accuracyM: {accuracyStr}</span>
      <span>samples: {territory.samplesCount}</span>
      <span>locationTrust: {trustStr}</span>
      <span>outsideCoverage: {outsideStr}</span>
    </div>
  );
}
