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
import { useGeolocation } from '../hooks/useGeolocation';
import { project } from '../utils/map-project';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';

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

  // GPS for "You are here"
  const geo = useGeolocation();

  // Add trace sheet
  const [showAddTrace, setShowAddTrace] = useState(false);
  const [traceDraft, setTraceDraft] = useState('');
  const [traceSaving, setTraceSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Dev mode: skip API calls, show empty map immediately
    const isDemoMode = cardId === 'DEMO-DEV' || cardId === 'unknown';
    if (isDemoMode) {
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
          maxWidth: 720,
          margin: '0 auto',
          padding: '24px 24px 0',
          position: 'relative',
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
          <div style={{ position: 'relative' }}>
            {/* Map with traces */}
            <ChampMapSection
              items={items}
              onSelect={(item) => setSelectedItem(item)}
              selectedId={selectedItem?.id ?? null}
              mapVariant="draw"
            />

            {/* "You are here" GPS marker */}
            {geo.lat !== null && geo.lng !== null && (() => {
              const userPos = project(geo.lat, geo.lng);
              const VIEWBOX_WIDTH = 2037.566;
              const VIEWBOX_HEIGHT = 1615.5;
              const xPct = (userPos.x / VIEWBOX_WIDTH) * 100;
              const yPct = (userPos.y / VIEWBOX_HEIGHT) * 100;
              // Only show if within reasonable bounds
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
                  {/* Pulsing ring */}
                  <div
                    style={{
                      position: 'absolute',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'rgba(0, 120, 80, 0.15)',
                      transform: 'translate(-50%, -50%)',
                      left: '50%',
                      top: '50%',
                      animation: 'champ-pulse 2s ease-out infinite',
                    }}
                  />
                  {/* Center dot */}
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#007850',
                      border: '2px solid #FAF8F2',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  />
                </div>
              );
            })()}

            {/* Trace count or invitation */}
            <div
              style={{
                textAlign: 'center',
                padding: '24px 24px 16px',
              }}
            >
              {items.length > 0 ? (
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    color: '#003D2C',
                    opacity: 0.5,
                  }}
                >
                  {items.length} trace{items.length > 1 ? 's' : ''} dans la cité
                </p>
              ) : (
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 14,
                    fontStyle: 'italic',
                    color: '#1A1A1A',
                    opacity: 0.4,
                  }}
                >
                  Le champ attend ses premières traces.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Add trace CTA */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button
            type="button"
            onClick={() => setShowAddTrace(true)}
            style={{
              padding: '14px 28px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#003D2C',
              background: 'rgba(0, 61, 44, 0.06)',
              border: '1px solid rgba(0, 61, 44, 0.2)',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Laisser une trace
          </button>
        </div>

        {/* Pulse animation */}
        <style>{`
          @keyframes champ-pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
            100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
          }
        `}</style>
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

      {/* Add trace sheet */}
      <Sheet open={showAddTrace} onOpenChange={setShowAddTrace}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto"
          style={{ background: '#FAF8F2', borderColor: 'rgba(0,61,44,0.15)' }}
        >
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'var(--font-serif)', color: '#1A1A1A' }}>
              Laisser une trace
            </SheetTitle>
          </SheetHeader>
          <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontStyle: 'italic', color: '#6B6455' }}>
              Une pensée, une observation, un fragment de la ville.
            </p>

            {/* GPS status */}
            {geo.lat !== null && geo.lng !== null ? (
              <p style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: '#007850', opacity: 0.7 }}>
                📍 Position: {geo.lat.toFixed(4)}, {geo.lng.toFixed(4)} {geo.accuracy_m && `(±${Math.round(geo.accuracy_m)}m)`}
              </p>
            ) : (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#B43232', opacity: 0.7 }}>
                ⚠️ Position GPS requise pour laisser une trace
              </p>
            )}

            <textarea
              value={traceDraft}
              onChange={(e) => setTraceDraft(e.target.value)}
              placeholder="Ce que tu observes, ressens, penses..."
              rows={4}
              maxLength={280}
              style={{
                width: '100%',
                padding: 14,
                fontFamily: 'var(--font-serif)',
                fontSize: 15,
                color: '#1A1A1A',
                background: 'transparent',
                border: '1px solid rgba(0,61,44,0.2)',
                borderRadius: 4,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6455' }}>
                {traceDraft.length} / 280
              </span>
              <button
                type="button"
                disabled={traceSaving || traceDraft.trim().length < 5 || geo.lat === null}
                onClick={async () => {
                  if (traceDraft.trim().length < 5 || geo.lat === null || geo.lng === null) return;
                  setTraceSaving(true);
                  try {
                    // TODO: Call API to save trace
                    // For now, just close and show feedback
                    console.log('Trace submitted:', traceDraft, { lat: geo.lat, lng: geo.lng });
                    setTraceDraft('');
                    setShowAddTrace(false);
                  } catch (err) {
                    console.error('Failed to save trace:', err);
                  } finally {
                    setTraceSaving(false);
                  }
                }}
                style={{
                  padding: '12px 24px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: (traceSaving || traceDraft.trim().length < 5 || geo.lat === null) ? '#8E8982' : '#003D2C',
                  background: (traceSaving || traceDraft.trim().length < 5 || geo.lat === null) ? 'rgba(0,0,0,0.03)' : 'rgba(0,61,44,0.1)',
                  border: 'none',
                  borderRadius: 4,
                  cursor: (traceSaving || traceDraft.trim().length < 5 || geo.lat === null) ? 'not-allowed' : 'pointer',
                }}
              >
                {traceSaving ? '...' : 'Envoyer'}
              </button>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#6B6455', opacity: 0.5, textAlign: 'center' }}>
              Ta trace apparaîtra sur la carte publique. Anonyme. Éphémère.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
