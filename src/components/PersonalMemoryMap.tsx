/**
 * PERSONAL MEMORY MAP — My Paris (Ma Carte)
 *
 * Full alignment with petitsouvenir "My Paris":
 * - Real collected symbols from collection-service (pins)
 * - Optional note → saved to journal_entries → appears in Carnet (notes)
 * - Share My Paris → copy link to #collection
 * - Link "In your notebook" → opens Carnet
 *
 * When user pins (collects) or writes here, it gets printed into notes (Carnet).
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BackButton } from './BackButton';
import { MamlukGrid } from './MamlukGrid';
import { getCollection } from '../utils/collection-service';
import { SYMBOLS, getSymbolById, type Symbol } from '../data/symbols';
import { ARRONDISSEMENT_MAP_POSITION } from '../data/arrondissement-positions';
import { loadMyParisNote, saveMyParisNote } from '../utils/journal-sync';
import { useTranslation } from '../utils/i18n';

interface PersonalMemoryMapProps {
  cardId: string;
  onBack: () => void;
  onOpenNotebook?: () => void;
}

interface MapPoint {
  symbol: Symbol;
  x: number;
  y: number;
}

function getCollectedPoints(): MapPoint[] {
  const collection = getCollection();
  if (!collection) return [];

  const byArr: Record<number, number> = {};
  return collection.symbols
    .map((cs) => {
      const symbol = getSymbolById(cs.symbolId);
      if (!symbol) return null;
      const pos = ARRONDISSEMENT_MAP_POSITION[symbol.arrondissement];
      if (!pos) return null;
      const jitter = (byArr[symbol.arrondissement] ?? 0) * 3;
      byArr[symbol.arrondissement] = (byArr[symbol.arrondissement] ?? 0) + 1;
      return {
        symbol,
        x: pos.x + (jitter % 5) - 2,
        y: pos.y + (Math.floor(jitter / 5) % 5) - 2
      };
    })
    .filter((p): p is MapPoint => p !== null);
}

export function PersonalMemoryMap({ cardId, onBack, onOpenNotebook }: PersonalMemoryMapProps) {
  const { t } = useTranslation();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const collection = getCollection();
  const points = useMemo(() => getCollectedPoints(), [collection?.symbols.length, collection?.lastUpdated]);
  const collectedCount = collection?.symbols.length ?? 0;
  const totalCount = SYMBOLS.length;

  useEffect(() => {
    loadMyParisNote(cardId).then(setNote);
  }, [cardId]);

  const handleNoteBlur = useCallback(() => {
    saveMyParisNote(cardId, note).catch(console.warn);
  }, [cardId, note]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}#collection`;
    navigator.clipboard.writeText(url).then(
      () => {
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2500);
      },
      () => {
        setShareStatus('error');
        setTimeout(() => setShareStatus('idle'), 2500);
      }
    );
  }, []);

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
          maxWidth: '560px',
          margin: '0 auto',
          padding: 'clamp(24px, 4vw, 48px)',
          paddingTop: 'clamp(80px, 10vh, 100px)',
          position: 'relative',
          zIndex: 10
        }}
      >
        <header style={{ textAlign: 'center', marginBottom: '24px' }}>
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
            {t('myparis.title')}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              color: '#003D2C',
              opacity: 0.6
            }}
          >
            {t('myparis.savedOnDevice')}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: '#003D2C',
              opacity: 0.5,
              marginTop: '4px'
            }}
          >
            {collectedCount} / {totalCount} {t('map.stats.symbols')}
          </p>
        </header>

        {/* Map */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            aspectRatio: '2037 / 1615',
            margin: '0 auto',
            background: 'rgba(255, 255, 255, 0.25)',
            border: '1px solid rgba(0, 61, 44, 0.12)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
        >
          <img
            src="/Parissvg.svg"
            alt="Paris"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: 0.2
            }}
          />
          {points.map(({ symbol, x, y }) => (
            <div
              key={symbol.id}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 20
              }}
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
                  transition: 'transform 0.2s ease',
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
        </div>

        {/* Optional note — saved to journal → appears in Carnet */}
        <div style={{ marginTop: '24px' }}>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              marginBottom: '8px'
            }}
          >
            {t('myparis.notePlaceholder').replace('…', '')}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder={t('myparis.notePlaceholder')}
            rows={3}
            style={{
              width: '100%',
              padding: '14px 16px',
              fontFamily: 'var(--font-serif)',
              fontSize: '15px',
              fontWeight: 300,
              color: '#1A1A1A',
              background: 'transparent',
              border: '0.5px solid rgba(0, 61, 44, 0.2)',
              borderRadius: '2px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Share My Paris */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={handleShare}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '14px 28px',
              background: 'transparent',
              color: '#0E3F2F',
              border: '0.5px solid rgba(14, 63, 47, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minHeight: 44
            }}
          >
            {t('myparis.share')}
          </button>
          {shareStatus === 'copied' && (
            <span style={{ fontSize: '11px', color: '#003D2C', opacity: 0.7 }}>
              {t('myparis.linkCopied')}
            </span>
          )}
          {shareStatus === 'error' && (
            <span style={{ fontSize: '11px', color: '#8B0000', opacity: 0.8 }}>
              {t('myparis.couldNotCopy')}
            </span>
          )}
        </div>

        {/* Link to notebook (notes) */}
        {onOpenNotebook && (
          <button
            type="button"
            onClick={onOpenNotebook}
            style={{
              marginTop: '20px',
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              color: '#003D2C',
              opacity: 0.5,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            {t('myparis.inNotebook')}
          </button>
        )}

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginTop: '28px',
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
            {t('myparis.legend.collected')}
          </span>
          <span>{t('myparis.legend.toDiscover')}</span>
        </div>

        <footer
          style={{
            textAlign: 'center',
            marginTop: '40px',
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
            {t('myparis.footer')}
          </p>
        </footer>
      </div>
    </div>
  );
}
