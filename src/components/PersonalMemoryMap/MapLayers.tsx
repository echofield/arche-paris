import type { CSSProperties } from 'react';

export type MapLayerMode = 'traces' | 'ville' | 'rituels';

interface MapLayersProps {
  mapMode: MapLayerMode;
  setMapMode: (mode: MapLayerMode) => void;
  showThreads: boolean;
  setShowThreads: (value: boolean) => void;
  showTemporalOnly: boolean;
  setShowTemporalOnly: (value: boolean) => void;
  temporalUnlocked: boolean;
  runsLength: number;
  showSegments: boolean;
  setShowSegments: (value: boolean) => void;
  showInscriptionsLayer: boolean;
  setShowInscriptionsLayer: (value: boolean) => void;
  segmentsLabel: string;
  inscriptionsLabel: string;
}

export function MapLayers({
  mapMode,
  setMapMode,
  showThreads,
  setShowThreads,
  showTemporalOnly,
  setShowTemporalOnly,
  temporalUnlocked,
  runsLength,
  showSegments,
  setShowSegments,
  showInscriptionsLayer,
  setShowInscriptionsLayer,
  segmentsLabel,
  inscriptionsLabel,
}: MapLayersProps) {
  return (
    <>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, justifyContent: 'center' }}>
        {(['traces', 'ville', 'rituels'] as const).map((mode) => {
          const labels = { traces: 'Mes traces', ville: 'La Ville', rituels: 'Rituels' };
          const isActive = mapMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setMapMode(mode)}
              style={{
                padding: '8px 16px',
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isActive ? '#FAF8F2' : '#003D2C',
                background: isActive ? '#003D2C' : 'transparent',
                border: `1px solid ${isActive ? '#003D2C' : 'rgba(0,61,44,0.2)'}`,
                borderRadius: mode === 'traces' ? '4px 0 0 4px' : mode === 'rituels' ? '0 4px 4px 0' : 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {labels[mode]}
            </button>
          );
        })}
      </div>

      {mapMode === 'traces' && (
        (() => {
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
              {(runsLength > 0 || temporalUnlocked) && (
                <>
                  <PillToggle
                    checked={showThreads}
                    onChange={() => setShowThreads(!showThreads)}
                    label="Threads"
                    ariaLabel="Threads"
                  />
                  {temporalUnlocked && (
                    <PillToggle
                      checked={showTemporalOnly}
                      onChange={() => setShowTemporalOnly(!showTemporalOnly)}
                      label="Temporal Meridians only"
                      ariaLabel="Temporal Meridians only"
                    />
                  )}
                </>
              )}
              <PillToggle
                checked={showSegments}
                onChange={() => setShowSegments(!showSegments)}
                label={segmentsLabel}
                ariaLabel={segmentsLabel}
              />
              <PillToggle
                checked={showInscriptionsLayer}
                onChange={() => setShowInscriptionsLayer(!showInscriptionsLayer)}
                label={inscriptionsLabel}
                ariaLabel={inscriptionsLabel}
              />
            </div>
          );
        })()
      )}

      {mapMode === 'rituels' && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, justifyContent: 'center', fontSize: 10, fontFamily: 'var(--font-sans)', color: '#6B6455' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#e5e5e5', border: '1px solid #ccc' }} />
            Inexplore
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#d4af37' }} />
            Entre
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4a7c59' }} />
            Scelle
          </span>
        </div>
      )}
    </>
  );
}
