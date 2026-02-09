/**
 * ARCHÉ — Le Champ
 * Collective, anonymous, fading. Displays Paris map ready for traces.
 *
 * Map extracted from petitsouvenir (CarteInteractive.tsx, MapSection.tsx)
 */

import { useState, useEffect } from 'react';
import { BackButton } from './BackButton';
import { ChampMapSection, type FieldItem as ChampFieldItem } from './ChampMapSection';
import { useTranslation } from '../utils/i18n';
import { loadChampItems, type FieldItem } from '../utils/card-gate-client';

interface ChampScreenProps {
  cardId: string;
  onBack: () => void;
}

export function ChampScreen({ cardId, onBack }: ChampScreenProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ChampFieldItem[]>([]);
  const [fullItems, setFullItems] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ChampFieldItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Dev mode: skip API calls, show empty map immediately
    const isDevMode = cardId === 'DEMO-DEV' || cardId === 'unknown';
    if (isDevMode) {
      console.log('[ChampScreen] Dev mode - skipping API call, showing empty map');
      setItems([]);
      setFullItems([]);
      setLoading(false);
      return;
    }

    loadChampItems(cardId)
      .then((data) => {
        if (!cancelled) {
          const mappedItems: ChampFieldItem[] = data
            .filter((item): item is FieldItem & { arrondissement: number } => item.arrondissement != null)
            .map((item) => ({
              id: item.id,
              arrondissement: item.arrondissement,
              textExcerpt: item.textExcerpt,
              timeLabel: item.timeLabel,
            }));

          // Store full items with full text for modal
          setFullItems(data.filter((item): item is FieldItem & { arrondissement: number; textFull?: string } => item.arrondissement != null));
          setItems(mappedItems);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[ChampScreen] Failed to load items:', e);
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [cardId]);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        background: 'var(--paper, #FAF8F2)',
        padding: '0 0 80px 0',
      }}
    >
      <BackButton onClick={onBack} />

      {/* Header */}
      <section
        style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: '100px 24px 32px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: 400,
            letterSpacing: '0.02em',
            color: 'var(--green, #003D2C)',
            marginBottom: 16,
            lineHeight: 1.2,
          }}
        >
          {t('champ.title')}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
            fontSize: 'clamp(15px, 2.5vw, 17px)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'var(--ink, #1A1A1A)',
            opacity: 0.6,
            lineHeight: 1.7,
            maxWidth: 400,
            margin: '0 auto',
          }}
        >
          {t('champ.placeholder')}
        </p>
      </section>

      {/* Paris Map */}
      <section
        style={{
          maxWidth: 720, // Reduced from 900 (20% smaller: 900 * 0.8 = 720)
          margin: '0 auto',
          padding: '24px 24px 0',
        }}
      >
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 24px',
              fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
              fontSize: 15,
              color: '#6B6455',
              opacity: 0.6,
            }}
          >
            …
          </div>
        ) : (
          <>
            {/* Always show map, even if no items */}
            <ChampMapSection 
              items={items} 
              onSelect={(item) => setSelectedItem(item)}
              selectedId={selectedItem?.id ?? null}
              mapVariant="draw"
            />
            {/* Show message if no items */}
            {items.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 24px',
                  marginTop: -40,
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-sans, Inter, sans-serif)',
                    fontSize: 12,
                    fontWeight: 400,
                    letterSpacing: '0.04em',
                    color: 'var(--ink, #1A1A1A)',
                    opacity: 0.35,
                    lineHeight: 1.6,
                  }}
                >
                  Les traces apparaitront ici.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Sentence modal — shows full text when dot is clicked */}
      {selectedItem && (
        <div
          role="dialog"
          aria-label="Sentence"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: 24,
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            style={{
              background: '#FAF8F2',
              border: '1px solid rgba(0, 61, 44, 0.15)',
              borderRadius: 4,
              padding: 32,
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    color: '#003D2C',
                    opacity: 0.5,
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  {selectedItem.arrondissement}e arrondissement · {selectedItem.timeLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 18,
                  color: '#003D2C',
                  opacity: 0.5,
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(15px, 2.5vw, 17px)',
                fontStyle: 'italic',
                color: '#1A1A1A',
                opacity: 0.7,
                lineHeight: 1.7,
              }}
            >
              {fullItems.find(f => f.id === selectedItem.id)?.textFull || selectedItem.textExcerpt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
