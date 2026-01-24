import { useState, useMemo } from 'react';
import { MamlukGrid } from './MamlukGrid';
import { BackButton } from './BackButton';
import { SYMBOLS, getSymbolsByArrondissement, type Symbol } from '../data/symbols';
import { GAME_CARDS, type GameCard } from '../data/game-cards';
import { getCollectionStats, collectSymbol, isSymbolCollected } from '../utils/collection-service';
import { useTranslation } from '../utils/i18n';

// Get matching game card for a symbol (by location/name matching)
function getMatchingGameCard(symbol: Symbol): GameCard | undefined {
  const symbolNameLower = symbol.name.toLowerCase();
  const symbolLocationLower = symbol.location.toLowerCase();

  // Direct ID mappings for known matches
  const directMatches: Record<string, string> = {
    'sym-4-01': 'point-zero',        // Le Point Zéro
    'sym-14-01': 'catacombes',       // Les Catacombes Supérieures
    'sym-5-02': 'thermes-cluny',     // Les Thermes Oubliés
    'sym-8-01': 'obelisque',         // L'Obélisque Silencieux
    'sym-5-01': 'rue-saint-jacques', // La Colonne Vertébrale (Rue Saint-Jacques)
    'sym-9-01': 'opera-garnier',     // Les Abeilles de l'Empereur
    'sym-19-01': 'buttes-chaumont',  // Le Temple de la Sibylle
    'sym-15-01': 'statue-liberte',   // La Statue de la Liberté
    'sym-2-01': 'passage-panoramas', // La Galerie des Reflets
    'sym-6-01': 'dragon-rennes',     // Le Dragon de la Cour
    'sym-16-01': 'fontaine-varsovie',// Les Fontaines Jumelles (Trocadéro)
    'sym-6-02': 'medaillons-arago',  // Le Méridien de Paris
    'sym-18-03': 'passage-sorciere', // Le Rocher de la Sorcière
    'sym-3-01': '51-archives',       // L'Enseigne du Temps (Rue des Archives)
    'sym-1-02': 'conciergerie',      // Le Mascaron rieur (close to Conciergerie area)
  };

  // Check direct mapping first
  if (directMatches[symbol.id]) {
    return GAME_CARDS.find(card => card.id === directMatches[symbol.id]);
  }

  // Fallback to fuzzy matching
  return GAME_CARDS.find(card => {
    const cardNameLower = card.name.toLowerCase();
    const cardLocationLower = card.location.toLowerCase();

    return cardNameLower.includes(symbolNameLower) ||
           symbolNameLower.includes(cardNameLower) ||
           cardLocationLower.includes(symbolLocationLower) ||
           symbolLocationLower.includes(cardLocationLower) ||
           // Keyword matches
           (symbolNameLower.includes('point zéro') && cardNameLower.includes('point zéro')) ||
           (symbolNameLower.includes('catacombes') && cardNameLower.includes('catacombes')) ||
           (symbolNameLower.includes('thermes') && cardNameLower.includes('thermes')) ||
           (symbolNameLower.includes('dragon') && cardNameLower.includes('dragon')) ||
           (symbolNameLower.includes('méridien') && cardNameLower.includes('arago')) ||
           (symbolNameLower.includes('obélisque') && cardNameLower.includes('obélisque')) ||
           (symbolNameLower.includes('statue') && symbolNameLower.includes('liberté') && cardNameLower.includes('statue')) ||
           (symbolNameLower.includes('sibylle') && cardNameLower.includes('buttes')) ||
           (symbolNameLower.includes('sorcière') && cardNameLower.includes('sorcière')) ||
           (symbolNameLower.includes('reflets') && cardNameLower.includes('panoramas')) ||
           (symbolLocationLower.includes('opéra') && cardNameLower.includes('opéra')) ||
           (symbolLocationLower.includes('trocadéro') && cardLocationLower.includes('trocadéro'));
  });
}

interface CollectionMapProps {
  onBack: () => void;
}

// Role evolution based on collection progress
interface WalkerRole {
  id: string;
  name: string;
  title: string;
  threshold: number;
}

// Role thresholds (non-translatable)
const ROLE_THRESHOLDS: { id: string; threshold: number }[] = [
  { id: 'traveler', threshold: 0 },
  { id: 'guide', threshold: 6 },
  { id: 'hero', threshold: 16 },
  { id: 'guardian', threshold: 26 }
];

function getWalkerRole(collected: number, roles: WalkerRole[]): WalkerRole {
  for (let i = roles.length - 1; i >= 0; i--) {
    if (collected >= roles[i].threshold) {
      return roles[i];
    }
  }
  return roles[0];
}

function getNextRole(collected: number, roles: WalkerRole[]): { role: WalkerRole; remaining: number } | null {
  const currentIndex = roles.findIndex((r, i) =>
    collected >= r.threshold && (i === roles.length - 1 || collected < roles[i + 1].threshold)
  );
  if (currentIndex < roles.length - 1) {
    const next = roles[currentIndex + 1];
    return { role: next, remaining: next.threshold - collected };
  }
  return null;
}

// SVG Paths for Paris arrondissements (escargot pattern from center)
const ARRONDISSEMENT_PATHS: { arr: number; path: string; labelX: number; labelY: number }[] = [
  // 1er - Louvre (centre)
  { arr: 1, path: "M360,280 L390,275 L395,300 L385,320 L360,315 Z", labelX: 375, labelY: 300 },
  // 2e - Bourse (nord du 1er)
  { arr: 2, path: "M390,275 L420,270 L425,295 L395,300 Z", labelX: 407, labelY: 285 },
  // 3e - Temple (est du 2e)
  { arr: 3, path: "M420,270 L460,280 L455,310 L425,295 Z", labelX: 440, labelY: 290 },
  // 4e - Hôtel-de-Ville (sud du 3e)
  { arr: 4, path: "M395,300 L425,295 L455,310 L450,340 L410,350 L385,320 Z", labelX: 420, labelY: 320 },
  // 5e - Panthéon (sud du 4e)
  { arr: 5, path: "M385,320 L410,350 L420,390 L380,400 L350,370 L360,315 Z", labelX: 385, labelY: 360 },
  // 6e - Luxembourg (ouest du 5e)
  { arr: 6, path: "M310,340 L360,315 L350,370 L380,400 L340,420 L290,380 Z", labelX: 335, labelY: 370 },
  // 7e - Palais-Bourbon (ouest du 6e)
  { arr: 7, path: "M220,310 L310,340 L290,380 L340,420 L280,450 L200,400 L180,340 Z", labelX: 260, labelY: 375 },
  // 8e - Élysée (nord du 7e)
  { arr: 8, path: "M250,220 L330,240 L360,280 L310,340 L220,310 L180,340 L170,280 L200,230 Z", labelX: 270, labelY: 280 },
  // 9e - Opéra (est du 8e)
  { arr: 9, path: "M330,240 L380,230 L390,275 L360,280 Z", labelX: 365, labelY: 255 },
  // 10e - Enclos-St-Laurent (est du 9e)
  { arr: 10, path: "M380,230 L460,210 L480,250 L460,280 L420,270 L390,275 Z", labelX: 430, labelY: 250 },
  // 11e - Popincourt (sud-est du 10e)
  { arr: 11, path: "M460,280 L520,270 L540,330 L500,370 L450,340 L455,310 Z", labelX: 495, labelY: 320 },
  // 12e - Reuilly (sud du 11e)
  { arr: 12, path: "M450,340 L500,370 L540,330 L600,380 L580,480 L480,450 L420,390 L410,350 Z", labelX: 510, labelY: 410 },
  // 13e - Gobelins (sud-ouest du 12e)
  { arr: 13, path: "M380,400 L420,390 L480,450 L500,520 L400,540 L350,480 Z", labelX: 420, labelY: 475 },
  // 14e - Observatoire (ouest du 13e)
  { arr: 14, path: "M280,450 L340,420 L380,400 L350,480 L400,540 L320,560 L250,500 Z", labelX: 330, labelY: 490 },
  // 15e - Vaugirard (nord-ouest du 14e)
  { arr: 15, path: "M120,380 L200,400 L280,450 L250,500 L320,560 L200,570 L100,500 Z", labelX: 200, labelY: 480 },
  // 16e - Passy (nord du 15e)
  { arr: 16, path: "M80,240 L170,280 L180,340 L120,380 L100,500 L60,420 L40,320 Z", labelX: 110, labelY: 360 },
  // 17e - Batignolles-Monceau (nord-est du 16e)
  { arr: 17, path: "M170,120 L280,140 L330,180 L330,240 L250,220 L200,230 L170,280 L80,240 L100,160 Z", labelX: 200, labelY: 195 },
  // 18e - Butte-Montmartre (est du 17e)
  { arr: 18, path: "M280,140 L380,120 L430,150 L460,210 L380,230 L330,240 L330,180 Z", labelX: 375, labelY: 180 },
  // 19e - Buttes-Chaumont (est du 18e)
  { arr: 19, path: "M430,150 L540,140 L600,200 L560,250 L520,270 L460,280 L480,250 L460,210 Z", labelX: 515, labelY: 210 },
  // 20e - Ménilmontant (sud du 19e)
  { arr: 20, path: "M520,270 L560,250 L600,200 L640,280 L600,380 L540,330 Z", labelX: 575, labelY: 300 }
];

export function CollectionMap({ onBack }: CollectionMapProps) {
  const { t } = useTranslation();
  const [selectedArr, setSelectedArr] = useState<number | null>(null);
  const [stats, setStats] = useState(getCollectionStats(SYMBOLS));
  const [showSymbolDetail, setShowSymbolDetail] = useState<Symbol | null>(null);

  // Build roles with translations
  const walkerRoles = useMemo((): WalkerRole[] => {
    return ROLE_THRESHOLDS.map(r => ({
      id: r.id,
      name: t(`map.roles.${r.id}.name`),
      title: t(`map.roles.${r.id}.title`),
      threshold: r.threshold
    }));
  }, [t]);

  // Refresh stats when collecting
  const refreshStats = () => {
    setStats(getCollectionStats(SYMBOLS));
  };

  const handleCollect = (symbolId: string) => {
    collectSymbol(symbolId);
    refreshStats();
    setShowSymbolDetail(null);
  };

  const symbols = selectedArr ? getSymbolsByArrondissement(selectedArr) : [];
  const currentRole = getWalkerRole(stats.collected, walkerRoles);
  const nextRole = getNextRole(stats.collected, walkerRoles);

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: '#FAF8F2',
        overflow: 'hidden'
      }}
    >
      <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={2} />
      <BackButton onClick={onBack} />

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 48px)',
          paddingTop: 'clamp(80px, 10vh, 100px)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '32px' }}>
          {/* Role Badge */}
          <div
            style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: 'rgba(0, 61, 44, 0.08)',
              border: '1px solid rgba(0, 61, 44, 0.2)',
              marginBottom: '16px'
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#003D2C',
                marginBottom: '4px'
              }}
            >
              {t('map.stats.yourRank')}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                fontWeight: '600',
                color: '#003D2C'
              }}
            >
              {currentRole.name}
            </p>
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
            {t('map.title')}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '16px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.6,
              marginBottom: '8px'
            }}
          >
            {stats.collected} / {stats.total} {t('map.stats.collected')}
          </p>
          {nextRole && (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                color: '#003D2C',
                opacity: 0.5
              }}
            >
              {t('map.stats.nextRole', { role: nextRole.role.name, count: nextRole.remaining })}
            </p>
          )}
        </header>

        {/* Map Container */}
        <div
          className="collection-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: selectedArr ? '1fr 1fr' : '1fr',
            gap: '32px',
            alignItems: 'start'
          }}
        >
          {/* SVG Map */}
          <div
            style={{
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(0, 61, 44, 0.1)',
              padding: '24px',
              position: 'relative'
            }}
          >
            <svg
              viewBox="0 0 800 600"
              style={{
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto',
                display: 'block'
              }}
            >
              {/* Paris Arrondissements Map */}
              {ARRONDISSEMENT_PATHS.map(({ arr, path, labelX, labelY }) => {
                const arrStats = stats.byArrondissement[arr];
                const isSelected = selectedArr === arr;
                const hasSymbols = arrStats.total > 0;
                const isComplete = arrStats.collected === arrStats.total && arrStats.total > 0;
                const hasProgress = arrStats.collected > 0 && !isComplete;

                return (
                  <g key={arr}>
                    <path
                      d={path}
                      fill={
                        isComplete ? 'rgba(0, 61, 44, 0.25)' :
                        hasProgress ? 'rgba(0, 61, 44, 0.12)' :
                        'transparent'
                      }
                      stroke={isSelected ? '#003D2C' : 'rgba(0, 61, 44, 0.4)'}
                      strokeWidth={isSelected ? 2 : 0.8}
                      style={{
                        cursor: hasSymbols ? 'pointer' : 'default',
                        transition: 'all 0.3s ease',
                        opacity: isSelected ? 1 : 0.7
                      }}
                      onClick={() => hasSymbols && setSelectedArr(isSelected ? null : arr)}
                      onMouseEnter={(e) => {
                        if (hasSymbols) {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.strokeWidth = '1.5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.opacity = '0.7';
                          e.currentTarget.style.strokeWidth = '0.8';
                        }
                      }}
                    />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-sans)',
                        fill: isComplete ? '#003D2C' : 'rgba(0, 61, 44, 0.5)',
                        fontWeight: isSelected ? '600' : '300',
                        pointerEvents: 'none'
                      }}
                    >
                      {arr}
                    </text>
                    {/* Collection dot indicator */}
                    {arrStats.collected > 0 && (
                      <circle
                        cx={labelX + 12}
                        cy={labelY - 8}
                        r={4}
                        fill="#003D2C"
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                marginTop: '16px',
                fontSize: '11px',
                fontFamily: 'var(--font-sans)',
                color: '#1A1A1A',
                opacity: 0.6
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'rgba(0, 61, 44, 0.1)',
                    border: '1px solid rgba(0, 61, 44, 0.3)'
                  }}
                />
                {t('map.legend.toDiscover')}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'rgba(0, 61, 44, 0.3)',
                    border: '1px solid rgba(0, 61, 44, 0.3)'
                  }}
                />
                {t('map.legend.inProgress')}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'rgba(0, 61, 44, 0.6)',
                    border: '1px solid rgba(0, 61, 44, 0.3)'
                  }}
                />
                {t('map.legend.completed')}
              </span>
            </div>
          </div>

          {/* Symbol List Panel */}
          {selectedArr && (
            <div
              style={{
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(0, 61, 44, 0.1)',
                padding: '24px'
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1A1A1A',
                  marginBottom: '8px'
                }}
              >
                {selectedArr}
                <sup style={{ fontSize: '12px', marginLeft: '2px' }}>e</sup> Arrondissement
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  color: '#003D2C',
                  opacity: 0.6,
                  marginBottom: '24px',
                  letterSpacing: '0.05em'
                }}
              >
                {stats.byArrondissement[selectedArr].collected} / {stats.byArrondissement[selectedArr].total} {t('map.stats.symbols')}
              </p>

              {/* Symbol List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {symbols.map(symbol => {
                  const collected = isSymbolCollected(symbol.id);
                  const gameCard = getMatchingGameCard(symbol);

                  return (
                    <div
                      key={symbol.id}
                      style={{
                        padding: '12px',
                        background: collected ? 'rgba(0, 61, 44, 0.05)' : 'transparent',
                        border: `1px solid ${collected ? 'rgba(0, 61, 44, 0.2)' : 'rgba(0, 61, 44, 0.1)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setShowSymbolDetail(symbol)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Thumbnail */}
                        {gameCard ? (
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              flexShrink: 0,
                              background: '#1A1A1A',
                              border: collected ? '2px solid #003D2C' : '2px solid rgba(0, 61, 44, 0.2)'
                            }}
                          >
                            <img
                              src={gameCard.image}
                              alt={gameCard.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: collected ? 'none' : 'grayscale(100%) brightness(0.4)'
                              }}
                            />
                          </div>
                        ) : (
                          <span
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '4px',
                              background: collected ? '#003D2C' : 'transparent',
                              border: '2px solid #003D2C',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FAF8F2',
                              fontSize: '16px',
                              flexShrink: 0
                            }}
                          >
                            {collected ? '◆' : '?'}
                          </span>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3
                            style={{
                              fontFamily: 'var(--font-serif)',
                              fontSize: '15px',
                              fontWeight: '600',
                              color: '#1A1A1A',
                              marginBottom: '4px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {gameCard?.name || symbol.name}
                          </h3>
                          <p
                            style={{
                              fontFamily: 'var(--font-sans)',
                              fontSize: '10px',
                              color: '#003D2C',
                              opacity: 0.5,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em'
                            }}
                          >
                            {gameCard?.location || symbol.location}
                          </p>
                        </div>

                        {/* Weight dots */}
                        {gameCard && (
                          <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                            {Array.from({ length: gameCard.weight }).map((_, i) => (
                              <span
                                key={i}
                                style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  background: collected ? '#003D2C' : 'rgba(0, 61, 44, 0.3)'
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Symbol Detail Modal */}
        {showSymbolDetail && (() => {
          const gameCard = getMatchingGameCard(showSymbolDetail);
          const collected = isSymbolCollected(showSymbolDetail.id);

          return (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '24px'
              }}
              onClick={() => setShowSymbolDetail(null)}
            >
              <div
                style={{
                  background: '#FAF8F2',
                  maxWidth: '480px',
                  width: '100%',
                  border: '1px solid rgba(0, 61, 44, 0.2)',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Card Image */}
                {gameCard && (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '4 / 3',
                      background: '#1A1A1A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={gameCard.image}
                      alt={gameCard.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: collected ? 'none' : 'grayscale(80%) brightness(0.6)'
                      }}
                    />
                    {!collected && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0, 0, 0, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: '14px',
                            color: 'rgba(255,255,255,0.7)',
                            fontStyle: 'italic'
                          }}
                        >
                          {t('map.detail.discoverOnSite')}
                        </span>
                      </div>
                    )}
                    {/* Weight badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        padding: '6px 10px',
                        display: 'flex',
                        gap: '4px'
                      }}
                    >
                      {Array.from({ length: gameCard.weight }).map((_, i) => (
                        <span
                          key={i}
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#C4A35A'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div style={{ padding: '24px' }}>
                  <h2
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '28px',
                      fontWeight: '600',
                      color: '#1A1A1A',
                      marginBottom: '8px'
                    }}
                  >
                    {gameCard?.name || showSymbolDetail.name}
                  </h2>

                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      color: '#003D2C',
                      opacity: 0.6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: '16px'
                    }}
                  >
                    {gameCard?.location || showSymbolDetail.location} · {showSymbolDetail.arrondissement}e arr.
                  </p>

                  {/* Reveal text - shown only when collected */}
                  {collected && gameCard && (
                    <p
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '16px',
                        fontStyle: 'italic',
                        color: '#1A1A1A',
                        lineHeight: '1.7',
                        marginBottom: '20px',
                        padding: '16px',
                        background: 'rgba(0, 61, 44, 0.04)',
                        borderLeft: '3px solid #003D2C'
                      }}
                    >
                      {gameCard.reveal}
                    </p>
                  )}

                  {/* Hint - shown when not collected */}
                  {!collected && (
                    <p
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '15px',
                        fontStyle: 'italic',
                        color: '#1A1A1A',
                        opacity: 0.7,
                        lineHeight: '1.6',
                        marginBottom: '20px',
                        padding: '16px',
                        background: 'rgba(0, 61, 44, 0.03)',
                        borderLeft: '3px solid rgba(0, 61, 44, 0.2)'
                      }}
                    >
                      "{showSymbolDetail.hint}"
                    </p>
                  )}

                  {/* GPS Coordinates - shown when collected */}
                  {collected && gameCard && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '20px',
                        padding: '12px',
                        background: 'rgba(0, 61, 44, 0.03)',
                        border: '1px dashed rgba(0, 61, 44, 0.2)'
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>📍</span>
                      <div>
                        <p
                          style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '10px',
                            color: '#003D2C',
                            opacity: 0.6,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '4px'
                          }}
                        >
                          {t('map.detail.gpsCoords')}
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '12px',
                            color: '#1A1A1A'
                          }}
                        >
                          {gameCard.gps.lat.toFixed(6)}, {gameCard.gps.lng.toFixed(6)}
                        </p>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${gameCard.gps.lat},${gameCard.gps.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          marginLeft: 'auto',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '10px',
                          color: '#003D2C',
                          textDecoration: 'none',
                          padding: '6px 10px',
                          border: '1px solid rgba(0, 61, 44, 0.3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        {t('map.detail.viewMap')}
                      </a>
                    </div>
                  )}

                  {showSymbolDetail.agent && (
                    <p
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px',
                        color: '#003D2C',
                        marginBottom: '20px'
                      }}
                    >
                      {t('map.detail.guardian')} <strong>{showSymbolDetail.agent}</strong>
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '12px' }}>
                    {!collected ? (
                      <button
                        onClick={() => handleCollect(showSymbolDetail.id)}
                        style={{
                          flex: 1,
                          background: '#003D2C',
                          color: '#FAF8F2',
                          border: 'none',
                          padding: '14px 24px',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '12px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          cursor: 'pointer'
                        }}
                      >
                        {t('map.detail.iFoundIt')}
                      </button>
                    ) : (
                      <div
                        style={{
                          flex: 1,
                          background: 'rgba(0, 61, 44, 0.1)',
                          color: '#003D2C',
                          padding: '14px 24px',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '12px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          textAlign: 'center'
                        }}
                      >
                        ◆ {t('map.detail.inCollection')}
                      </div>
                    )}
                    <button
                      onClick={() => setShowSymbolDetail(null)}
                      style={{
                        background: 'transparent',
                        color: '#1A1A1A',
                        border: '1px solid rgba(0, 61, 44, 0.2)',
                        padding: '14px 24px',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '12px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      {t('map.detail.close')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Footer */}
        <footer
          style={{
            textAlign: 'center',
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(0, 61, 44, 0.1)'
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '14px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.5
            }}
          >
            {t('map.footer')}
          </p>
        </footer>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .collection-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .collection-grid > div:first-child {
            padding: 16px !important;
          }
          .collection-grid > div:first-child svg {
            max-width: 100% !important;
          }
          .collection-grid > div:last-child {
            padding: 16px !important;
            max-height: 50vh;
            overflow-y: auto;
          }
        }
        @media (max-width: 480px) {
          .collection-grid {
            gap: 16px !important;
          }
          .collection-grid > div:first-child {
            padding: 12px !important;
          }
          .collection-grid > div:last-child {
            padding: 12px !important;
            max-height: 40vh;
          }
        }
      `}</style>
    </div>
  );
}
