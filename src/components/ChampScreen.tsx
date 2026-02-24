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
import { postInscription } from '../utils/card-gate-map-client';
import { normalizeDisplayText } from '../utils/text-normalize';
import { ARRONDISSEMENT_MAP_POSITION } from '../data/arrondissement-positions';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { AsyncState } from './AsyncState';

interface ChampScreenProps {
  cardId: string | null;
  onBack: () => void;
}

const CHAMP_WORDS_MIN = 80;
const CHAMP_WORDS_MAX = 120;
const CHAMP_HEADER_PATTERN = /^Rue\s+.+\s+-\s+(?:[01]\d|2[0-3]):[0-5]\d(?:\s|$)/;

function countWords(value: string): number {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function validateChampTrace(value: string): string | null {
  const normalized = value.trim();
  if (!CHAMP_HEADER_PATTERN.test(normalized)) {
    return 'Format requis: "Rue ... - HH:MM" en debut de texte.';
  }
  const words = countWords(normalized);
  if (words < CHAMP_WORDS_MIN || words > CHAMP_WORDS_MAX) {
    return `Longueur requise: ${CHAMP_WORDS_MIN}-${CHAMP_WORDS_MAX} mots (actuel: ${words}).`;
  }
  return null;
}

export function ChampScreen({ cardId, onBack }: ChampScreenProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ChampFieldItem[]>([]);
  const [fullItems, setFullItems] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ChampFieldItem | null>(null);

  // GPS for "You are here"
  const geo = useGeolocation();

  // Add trace sheet
  const [showAddTrace, setShowAddTrace] = useState(false);
  const [traceDraft, setTraceDraft] = useState('');
  const [traceSaving, setTraceSaving] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);
  const traceValidationError = validateChampTrace(traceDraft);
  const traceWordCount = countWords(traceDraft);
  const isCardEligible = cardId && cardId !== 'DEMO-DEV';
  const canSubmitTrace =
    !traceSaving &&
    isCardEligible &&
    geo.lat !== null &&
    geo.lng !== null &&
    traceDraft.trim().length > 0 &&
    !traceValidationError;

  const inferArrondissementFromGeo = (lat: number, lng: number): number | null => {
    const VIEWBOX_WIDTH = 2037.566;
    const VIEWBOX_HEIGHT = 1615.5;
    const p = project(lat, lng);
    const xPct = (p.x / VIEWBOX_WIDTH) * 100;
    const yPct = (p.y / VIEWBOX_HEIGHT) * 100;
    if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) return null;
    let bestArr: number | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let arr = 1; arr <= 20; arr++) {
      const center = ARRONDISSEMENT_MAP_POSITION[arr];
      if (!center) continue;
      const dx = center.x - xPct;
      const dy = center.y - yPct;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist) {
        bestDist = d;
        bestArr = arr;
      }
    }
    return bestArr;
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // No card or demo mode: skip API calls, show empty map immediately
    if (!cardId || cardId === 'DEMO-DEV') {
      console.log('[ChampScreen] No card or demo mode - skipping API call, showing empty map');
      setItems([]);
      setFullItems([]);
      setLoading(false);
      return;
    }

    loadChampItems(cardId)
      .then((data) => {
        if (!cancelled) {
          setLoadError(false);
          const mappedItems: ChampFieldItem[] = data
            .filter((item): item is FieldItem & { arrondissement: number } => item.arrondissement != null)
            .map((item) => ({
              id: item.id,
              arrondissement: item.arrondissement,
              textExcerpt: normalizeDisplayText(item.textExcerpt),
              timeLabel: item.timeLabel,
            }));

          // Store full items with full text for modal
          setFullItems(
            data
              .filter((item): item is FieldItem & { arrondissement: number; textFull?: string } => item.arrondissement != null)
              .map((item) => ({
                ...item,
                textExcerpt: normalizeDisplayText(item.textExcerpt),
                textFull: item.textFull ? normalizeDisplayText(item.textFull) : item.textFull,
              }))
          );
          setItems(mappedItems);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('[ChampScreen] Failed to load items:', e);
          setItems([]);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [cardId]);

  const handleRetryChamp = () => {
    if (!cardId || cardId === 'DEMO-DEV') return;
    setLoadError(false);
    setLoading(true);
    loadChampItems(cardId)
      .then((data) => {
        const mappedItems: ChampFieldItem[] = data
          .filter((item): item is FieldItem & { arrondissement: number } => item.arrondissement != null)
          .map((item) => ({
            id: item.id,
            arrondissement: item.arrondissement,
            textExcerpt: normalizeDisplayText(item.textExcerpt),
            timeLabel: item.timeLabel,
          }));
        setFullItems(
          data
            .filter((item): item is FieldItem & { arrondissement: number; textFull?: string } => item.arrondissement != null)
            .map((item) => ({
              ...item,
              textExcerpt: normalizeDisplayText(item.textExcerpt),
              textFull: item.textFull ? normalizeDisplayText(item.textFull) : item.textFull,
            }))
        );
        setItems(mappedItems);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

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
        <AsyncState
          loading={loading}
          error={loadError ? { message: t('champ.loadError') } : null}
          onRetry={handleRetryChamp}
          onBack={onBack}
        >
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
        </AsyncState>

        {/* Add trace CTA — position relative + z-index so it stays clickable above map */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 16,
            paddingBottom: 24,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <button
            type="button"
            onClick={() => setShowAddTrace(true)}
            aria-label={t('champ.leaveTrace')}
            style={{
              padding: '14px 28px',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#003D2C',
              background: 'rgba(0, 61, 44, 0.12)',
              border: '1px solid rgba(0, 61, 44, 0.35)',
              borderRadius: 6,
              cursor: 'pointer',
              minHeight: 44,
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
                whiteSpace: 'pre-wrap',
              }}
            >
              {normalizeDisplayText(fullItems.find(f => f.id === selectedItem.id)?.textFull || selectedItem.textExcerpt)}
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

            {/* Card required for Le Champ */}
            {!isCardEligible && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#B43232', opacity: 0.9 }}>
                Une carte activée est requise pour partager au Champ.
              </p>
            )}
            {/* GPS status — no raw coords/accuracy in production */}
            {geo.lat !== null && geo.lng !== null ? (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#007850', opacity: 0.7 }}>
                {import.meta.env.DEV && import.meta.env.VITE_DEBUG_TERRITORY
                  ? `📍 ${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)} ${geo.accuracy_m != null ? `(±${Math.round(geo.accuracy_m)}m)` : ''}`
                  : t('presence.signalSettling')}
              </p>
            ) : (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#B43232', opacity: 0.7 }}>
                ⚠️ Position GPS requise pour laisser une trace
              </p>
            )}

            <textarea
              value={traceDraft}
              onChange={(e) => {
                setTraceDraft(e.target.value);
                if (traceError) setTraceError(null);
              }}
              placeholder="Rue ... - HH:MM ..."
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
                {traceWordCount} mots - {traceDraft.length} / 280
              </span>
              <button
                type="button"
                disabled={!canSubmitTrace}
                aria-disabled={!canSubmitTrace}
                onClick={async () => {
                  if (!cardId || !canSubmitTrace || geo.lat === null || geo.lng === null) return;
                  setTraceSaving(true);
                  setTraceError(null);
                  try {
                    const arrondissement = inferArrondissementFromGeo(geo.lat, geo.lng);
                    if (!arrondissement) throw new Error('Position hors zone');
                    const idempotencyKey = `champ:${arrondissement}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
                    await postInscription(cardId, {
                      kind: 'arrondissement',
                      arrondissement,
                      text: traceDraft.trim(),
                      idempotency_key: idempotencyKey,
                      opt_in_field: true,
                    });

                    const data = await loadChampItems(cardId);
                    const mappedItems: ChampFieldItem[] = data
                      .filter((item): item is FieldItem & { arrondissement: number } => item.arrondissement != null)
                      .map((item) => ({
                        id: item.id,
                        arrondissement: item.arrondissement,
                        textExcerpt: normalizeDisplayText(item.textExcerpt),
                        timeLabel: item.timeLabel,
                      }));
                    setFullItems(
                      data
                        .filter((item): item is FieldItem & { arrondissement: number; textFull?: string } => item.arrondissement != null)
                        .map((item) => ({
                          ...item,
                          textExcerpt: normalizeDisplayText(item.textExcerpt),
                          textFull: item.textFull ? normalizeDisplayText(item.textFull) : item.textFull,
                        }))
                    );
                    setItems(mappedItems);
                    setTraceDraft('');
                    setShowAddTrace(false);
                  } catch (err) {
                    console.error('Failed to save trace:', err);
                    setTraceError(err instanceof Error ? err.message : t('champ.sendError'));
                  } finally {
                    setTraceSaving(false);
                  }
                }}
                style={{
                  padding: '12px 28px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: canSubmitTrace ? '#FAF8F2' : '#8E8982',
                  background: canSubmitTrace ? '#003D2C' : 'rgba(0,0,0,0.05)',
                  border: canSubmitTrace ? '1px solid rgba(0,61,44,0.4)' : '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 6,
                  cursor: canSubmitTrace ? 'pointer' : 'not-allowed',
                  minHeight: 44,
                }}
              >
                {traceSaving ? '...' : 'Envoyer'}
              </button>
            </div>
            {traceDraft.trim().length > 0 && traceValidationError && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#B43232', textAlign: 'left' }}>
                {traceValidationError}
              </p>
            )}
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#6B6455', opacity: 0.5, textAlign: 'center' }}>
              Ta trace apparaîtra sur la carte publique. Anonyme. Éphémère.
            </p>
            {traceError && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#B43232', textAlign: 'center' }}>
                {traceError}
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
