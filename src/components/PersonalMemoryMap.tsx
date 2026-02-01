/**
 * PERSONAL MEMORY MAP — Ma Carte
 *
 * Based on petitsouvenir "My Paris" concept
 *
 * Rules:
 * - Same Paris map structure
 * - Scale reduced to ~1/3 size
 * - Small dots representing saved places/memories
 * - No GPS, no live tracking
 * - Memory map, not navigation
 *
 * "The place where users collect, save, and live the experience"
 */

import { useState } from 'react';
import { ParisStrokeMap } from './ParisStrokeMap';
import { BackButton } from './BackButton';
import { MamlukGrid } from './MamlukGrid';

interface MemoryPoint {
  id: string;
  name: string;
  x: number; // percentage position
  y: number;
  collected: boolean;
}

// Static memory points (placeholder data)
const MEMORY_POINTS: MemoryPoint[] = [
  { id: 'mp-1', name: 'Notre-Dame', x: 48, y: 52, collected: true },
  { id: 'mp-2', name: 'Sacre-Coeur', x: 52, y: 28, collected: true },
  { id: 'mp-3', name: 'Tour Eiffel', x: 28, y: 48, collected: true },
  { id: 'mp-4', name: 'Louvre', x: 45, y: 45, collected: false },
  { id: 'mp-5', name: 'Pantheon', x: 50, y: 58, collected: false },
  { id: 'mp-6', name: 'Pere Lachaise', x: 68, y: 45, collected: true },
  { id: 'mp-7', name: 'Montmartre', x: 50, y: 25, collected: false },
  { id: 'mp-8', name: 'Bastille', x: 58, y: 50, collected: true },
];

interface PersonalMemoryMapProps {
  onBack: () => void;
}

export function PersonalMemoryMap({ onBack }: PersonalMemoryMapProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  const collectedCount = MEMORY_POINTS.filter(p => p.collected).length;
  const totalCount = MEMORY_POINTS.length;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={2} />
      <BackButton onClick={onBack} />

      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 48px)',
          paddingTop: 'clamp(80px, 10vh, 100px)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: '400',
              color: '#1A1A1A',
              marginBottom: '12px',
              letterSpacing: '-0.02em'
            }}
          >
            Ma Carte
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '16px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.5,
              marginBottom: '8px'
            }}
          >
            Mes souvenirs de Paris
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              color: '#003D2C',
              opacity: 0.6
            }}
          >
            {collectedCount} / {totalCount} lieux
          </p>
        </header>

        {/* Map Container - Reduced size (~1/3) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            aspectRatio: '1 / 1',
            margin: '0 auto',
            background: 'rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(0, 61, 44, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
        >
          {/* Paris Stroke Map Background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ParisStrokeMap opacity={0.12} blur={0.5} />
          </div>

          {/* Memory Points */}
          {MEMORY_POINTS.map((point) => (
            <div
              key={point.id}
              style={{
                position: 'absolute',
                left: `${point.x}%`,
                top: `${point.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 20
              }}
              onMouseEnter={() => setHoveredPoint(point.id)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Dot */}
              <div
                style={{
                  width: point.collected ? '10px' : '6px',
                  height: point.collected ? '10px' : '6px',
                  borderRadius: '50%',
                  background: point.collected ? '#003D2C' : 'transparent',
                  border: point.collected ? 'none' : '1.5px solid rgba(0, 61, 44, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: hoveredPoint === point.id ? 'scale(1.5)' : 'scale(1)'
                }}
              />

              {/* Tooltip */}
              {hoveredPoint === point.id && (
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
                  {point.name}
                  {!point.collected && (
                    <span style={{ opacity: 0.5, marginLeft: '6px' }}>
                      (a decouvrir)
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Center label */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 5
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '14px',
                fontStyle: 'italic',
                color: '#1A1A1A',
                opacity: 0.3
              }}
            >
              Paris
            </p>
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            marginTop: '32px',
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
            Visite
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                border: '1.5px solid rgba(0, 61, 44, 0.3)'
              }}
            />
            A decouvrir
          </span>
        </div>

        {/* Footer message */}
        <footer
          style={{
            textAlign: 'center',
            marginTop: '48px',
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
            Une carte de memoire, pas de navigation.
          </p>
        </footer>
      </div>
    </div>
  );
}
