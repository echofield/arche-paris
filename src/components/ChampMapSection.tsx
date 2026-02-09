/**
 * ChampMapSection — Wrapper for CarteInteractive with sentence dot overlays
 * 
 * IMPORTANT: CarteInteractive must NEVER be modified.
 * All overlays and interactions live here.
 * 
 * This component wraps the animated Paris map and adds interactive dots
 * for shared sentences from Le Champ.
 */

import { useMemo } from 'react';
import { CarteInteractive, type MapVariant } from './CarteInteractive';

// ============================================================================
// TYPES
// ============================================================================

/**
 * A single item to display on the field map.
 */
export type FieldItem = {
  id: string;
  arrondissement: number;
  textExcerpt: string;
  timeLabel: string;
};

export type ChampMapSectionProps = {
  items: FieldItem[];
  onSelect?: (item: FieldItem) => void;
  selectedId?: string | null;
  mapVariant?: MapVariant;
};

// ============================================================================
// COORDINATE MAPPING
// ============================================================================

/**
 * SVG viewBox dimensions (matches CarteInteractive)
 */
const VIEWBOX = { w: 2037.566, h: 1615.5 };

/**
 * Approximate center coordinates for each Paris arrondissement (1-20).
 * Coordinates are in SVG viewBox space.
 */
const ARRONDISSEMENT_CENTERS: Record<number, { x: number; y: number }> = {
  1:  { x: 980, y: 720 },    // Louvre, center
  2:  { x: 1020, y: 640 },   // Bourse
  3:  { x: 1100, y: 680 },   // Temple
  4:  { x: 1120, y: 760 },   // Hôtel de Ville, Marais
  5:  { x: 1050, y: 880 },   // Panthéon, Latin Quarter
  6:  { x: 920, y: 870 },    // Saint-Germain
  7:  { x: 780, y: 820 },    // Eiffel Tower, Invalides
  8:  { x: 820, y: 600 },    // Champs-Élysées
  9:  { x: 950, y: 540 },    // Opéra
  10: { x: 1100, y: 520 },   // Gares du Nord/Est
  11: { x: 1200, y: 720 },   // Bastille, Oberkampf
  12: { x: 1350, y: 900 },   // Nation, Bercy
  13: { x: 1100, y: 1050 },  // Gobelins, Bibliothèque
  14: { x: 900, y: 1020 },   // Montparnasse
  15: { x: 680, y: 920 },    // Convention, south-west
  16: { x: 550, y: 680 },    // Passy, Trocadéro (west)
  17: { x: 700, y: 450 },    // Batignolles
  18: { x: 920, y: 380 },    // Montmartre
  19: { x: 1180, y: 400 },   // Buttes-Chaumont
  20: { x: 1300, y: 580 },   // Père-Lachaise, Belleville
};

/**
 * Get SVG coordinates for an arrondissement.
 */
function getArrondissementCoords(arr: number): { x: number; y: number } {
  return ARRONDISSEMENT_CENTERS[arr] || { x: VIEWBOX.w / 2, y: VIEWBOX.h / 2 };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ChampMapSection({
  items,
  onSelect,
  selectedId,
  mapVariant = 'draw',
}: ChampMapSectionProps) {
  // Memoize item positions to avoid recalculating on every render
  const itemPositions = useMemo(() => {
    return items.map(item => ({
      ...item,
      coords: getArrondissementCoords(item.arrondissement),
    }));
  }, [items]);

  const showOverlay = itemPositions.length > 0;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        aspectRatio: '2037.566 / 1615.5', // Fix: Ensure container has proper aspect ratio for SVG
      }}
    >
      {/* Animated Paris Map */}
      <CarteInteractive variant={mapVariant} />

      {/* Sentence dots overlay */}
      {showOverlay && (
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 'auto',
            pointerEvents: 'none',
          }}
          className="carte-interactive-svg"
        >
          <style>
            {`
              .champ-pin {
                fill: rgba(0, 61, 44, 0.08);
                stroke: #003D2C;
                stroke-width: 0.8;
                opacity: 0.5;
                cursor: pointer;
                pointer-events: all;
                transition: all 400ms ease;
              }
              .champ-pin:hover {
                opacity: 1;
                fill: rgba(0, 61, 44, 0.15);
                stroke-width: 1.2;
              }
              .champ-pin.selected {
                opacity: 1;
                fill: rgba(0, 61, 44, 0.2);
                stroke-width: 1.5;
              }
            `}
          </style>
          <g id="champ-items-overlay">
            {itemPositions.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <g key={item.id}>
                  <circle
                    className={`champ-pin ${isSelected ? 'selected' : ''}`}
                    cx={item.coords.x}
                    cy={item.coords.y}
                    r={isSelected ? 14 : 10}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect?.(item);
                    }}
                  />
                  {/* Small inner dot for visual weight */}
                  <circle
                    cx={item.coords.x}
                    cy={item.coords.y}
                    r={3}
                    fill="#003D2C"
                    opacity={isSelected ? 0.8 : 0.4}
                    pointerEvents="none"
                  />
                </g>
              );
            })}
          </g>
        </svg>
      )}
    </div>
  );
}
