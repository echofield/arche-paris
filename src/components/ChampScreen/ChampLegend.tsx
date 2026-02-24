import type { ChampLayerMode } from './LayerToggles';

interface ChampLegendProps {
  activeLayers: Set<ChampLayerMode>;
  legendTitle: string;
  resonanceLabel: string;
  aujourdhuiLabel: string;
  invisibleLabel: string;
  noDataLabel: string;
  invisibleCount: number;
  aujourdhuiCount: number;
}

const DOT_STYLE = { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 } as const;
const ROW_STYLE = { display: 'flex', alignItems: 'center', gap: 8 } as const;
const LABEL_STYLE = {
  fontFamily: 'var(--font-sans)', fontSize: 11,
  color: '#003D2C', opacity: 0.7,
} as const;

export function ChampLegend({
  activeLayers,
  legendTitle,
  resonanceLabel,
  aujourdhuiLabel,
  invisibleLabel,
  noDataLabel,
  invisibleCount,
  aujourdhuiCount,
}: ChampLegendProps) {
  if (activeLayers.size === 0) return null;

  return (
    <div style={{
      width: '100%', maxWidth: 400, margin: '0 auto',
      padding: '12px 16px',
      border: '1px solid rgba(0,61,44,0.08)',
      borderRadius: 8, background: 'rgba(250,248,242,0.6)',
    }}>
      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: 10,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: '#6B6455', opacity: 0.6, marginBottom: 8,
      }}>
        {legendTitle}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {activeLayers.has('resonance') && (
          <div style={ROW_STYLE}>
            <span style={{ ...DOT_STYLE, background: 'rgba(139,105,20,0.6)', boxShadow: '0 0 4px rgba(139,105,20,0.3)' }} />
            <span style={LABEL_STYLE}>{resonanceLabel}</span>
          </div>
        )}

        {activeLayers.has('aujourdhui') && (
          <div style={ROW_STYLE}>
            <span style={{ ...DOT_STYLE, background: '#007850', animation: 'champ-pulse-legend 2s ease-in-out infinite' }} />
            <span style={LABEL_STYLE}>
              {aujourdhuiLabel}
              {aujourdhuiCount > 0 && <span style={{ opacity: 0.5 }}> ({aujourdhuiCount})</span>}
            </span>
          </div>
        )}

        {activeLayers.has('invisible') && (
          <div style={ROW_STYLE}>
            <span style={{ ...DOT_STYLE, background: '#003D2C', opacity: 0.4 }} />
            <span style={LABEL_STYLE}>
              {invisibleCount > 0
                ? <>{invisibleLabel} <span style={{ opacity: 0.5 }}>({invisibleCount})</span></>
                : noDataLabel}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes champ-pulse-legend {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
