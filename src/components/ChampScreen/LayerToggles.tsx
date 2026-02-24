import { motion } from '../../design/motion';

export type ChampLayerMode = 'resonance' | 'aujourdhui' | 'invisible' | 'axes';

interface LayerTogglesProps {
  activeLayers: Set<ChampLayerMode>;
  onToggle: (layer: ChampLayerMode) => void;
  labels: Record<ChampLayerMode, string>;
}

const LAYERS: ChampLayerMode[] = ['resonance', 'aujourdhui', 'invisible', 'axes'];

const LAYER_COLORS: Record<ChampLayerMode, string> = {
  resonance: '#8B6914',
  aujourdhui: '#007850',
  invisible: '#003D2C',
  axes: '#6B4C8A',
};

export function LayerToggles({ activeLayers, onToggle, labels }: LayerTogglesProps) {
  return (
    <div style={{
      display: 'flex', gap: 8, justifyContent: 'center',
      flexWrap: 'wrap', marginBottom: 12,
    }}>
      {LAYERS.map((layer) => {
        const isActive = activeLayers.has(layer);
        return (
          <button
            key={layer}
            type="button"
            onClick={() => onToggle(layer)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: isActive ? LAYER_COLORS[layer] : '#8E8982',
              background: isActive ? `${LAYER_COLORS[layer]}0F` : 'transparent',
              border: `1px solid ${isActive ? `${LAYER_COLORS[layer]}4D` : 'rgba(0,61,44,0.14)'}`,
              borderRadius: 999, cursor: 'pointer',
              opacity: isActive ? 0.95 : 0.6,
              transition: motion.transition([
                { property: 'opacity', durationMs: motion.t('brisk'), easing: motion.ease('appear') },
                { property: 'background', durationMs: motion.t('brisk'), easing: motion.ease('appear') },
                { property: 'border-color', durationMs: motion.t('brisk'), easing: motion.ease('appear') },
              ]),
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: isActive ? LAYER_COLORS[layer] : '#C4BDB2',
            }} />
            {labels[layer]}
          </button>
        );
      })}
    </div>
  );
}
