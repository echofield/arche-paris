/**
 * ARCHE -- Le Champ
 * The city's collective layered observatory.
 * "What is alive in Paris right now? Where are the fields?"
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BackButton } from './BackButton';
import { ChampMapSection, type ResonancePlace, type ArrondissementCount } from './ChampMapSection';
import { LayerToggles, type ChampLayerMode } from './ChampScreen/LayerToggles';
import { ChampLegend } from './ChampScreen/ChampLegend';
import { PlaceDetailSheet, type PlaceDetail } from './ChampScreen/PlaceDetailSheet';
import { useTranslation } from '../utils/i18n';
import { loadChampItems, type FieldItem } from '../utils/card-gate-client';
import { postInscription } from '../utils/card-gate-map-client';
import { normalizeDisplayText } from '../utils/text-normalize';
import { useGeolocation } from '../hooks/useGeolocation';
import { project } from '../utils/map-project';
import { ARRONDISSEMENT_MAP_POSITION } from '../data/arrondissement-positions';
import { LIEUX_PARIS } from '../data/lieux-paris';
import { GAME_CARDS } from '../data/game-cards';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { AsyncState } from './AsyncState';

interface ChampScreenProps {
  cardId: string | null;
  onBack: () => void;
}

const CHAMP_WORDS_MIN = 80;
const CHAMP_WORDS_MAX = 120;
const CHAMP_HEADER_PATTERN = /^Rue\s+.+\s+-\s+(?:[01]\d|2[0-3]):[0-5]\d(?:\s|$)/;
const VIEWBOX_W = 2037.566;
const VIEWBOX_H = 1615.5;

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
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

function parseChampParams(): { arr: number | null; layers: ChampLayerMode[] } {
  const hash = window.location.hash.replace(/^#/, '');
  const qIdx = hash.indexOf('?');
  if (qIdx < 0) return { arr: null, layers: [] };
  const params = new URLSearchParams(hash.slice(qIdx + 1));
  const arrStr = params.get('arr');
  const arr = arrStr ? parseInt(arrStr, 10) : null;
  const layersStr = params.get('layers');
  const validLayers: ChampLayerMode[] = ['resonance', 'aujourdhui', 'invisible'];
  const layers = layersStr
    ? layersStr.split(',').filter((l): l is ChampLayerMode => validLayers.includes(l as ChampLayerMode))
    : [];
  return { arr: Number.isFinite(arr) ? arr : null, layers };
}

function inferArrondissementFromGeo(lat: number, lng: number): number | null {
  const p = project(lat, lng);
  const xPct = (p.x / VIEWBOX_W) * 100;
  const yPct = (p.y / VIEWBOX_H) * 100;
  if (!Number.isFinite(xPct) || !Number.isFinite(yPct)) return null;
  let bestArr: number | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let arr = 1; arr <= 20; arr++) {
    const center = ARRONDISSEMENT_MAP_POSITION[arr];
    if (!center) continue;
    const dx = center.x - xPct;
    const dy = center.y - yPct;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < bestDist) { bestDist = d; bestArr = arr; }
  }
  return bestArr;
}

export function ChampScreen({ cardId, onBack }: ChampScreenProps) {
  const { t } = useTranslation();
  const geo = useGeolocation();

  // URL params from Mon Paris bridge
  const [initParams] = useState(() => parseChampParams());
  const [highlightArr, setHighlightArr] = useState<number | null>(initParams.arr);
  const [showBridgeBanner, setShowBridgeBanner] = useState(initParams.arr !== null);

  // Layers (stackable)
  const [activeLayers, setActiveLayers] = useState<Set<ChampLayerMode>>(() => {
    const initial = new Set<ChampLayerMode>(initParams.layers);
    if (initial.size === 0) initial.add('resonance');
    return initial;
  });

  const toggleLayer = useCallback((layer: ChampLayerMode) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }, []);

  // Champ items (for aujourdhui + invisible layers)
  const [champItems, setChampItems] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const isCardEligible = cardId && cardId !== 'DEMO-DEV';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (!cardId || cardId === 'DEMO-DEV') {
      setChampItems([]);
      setLoading(false);
      return;
    }
    loadChampItems(cardId)
      .then((data) => {
        if (!cancelled) {
          setLoadError(false);
          setChampItems(
            data
              .filter((item): item is FieldItem & { arrondissement: number } => item.arrondissement != null)
              .map(item => ({
                ...item,
                textExcerpt: normalizeDisplayText(item.textExcerpt),
              }))
          );
        }
      })
      .catch(() => { if (!cancelled) { setChampItems([]); setLoadError(true); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cardId]);

  // Resonance places (lieux + game cards projected to SVG)
  const resonancePlaces = useMemo<ResonancePlace[]>(() => {
    const fromLieux: ResonancePlace[] = LIEUX_PARIS.map(l => {
      const p = project(l.coordinates.lat, l.coordinates.lng);
      return { id: `lieu-${l.id}`, name: l.name, x: p.x, y: p.y };
    });
    const fromCards: ResonancePlace[] = GAME_CARDS.map(c => {
      const p = project(c.gps.lat, c.gps.lng);
      return { id: `card-${c.id}`, name: c.name, x: p.x, y: p.y, weight: c.weight };
    });
    return [...fromLieux, ...fromCards];
  }, []);

  // Aggregate champ items by arrondissement
  const now24h = useMemo(() => Date.now() - 24 * 60 * 60 * 1000, []);

  const aujourdhuiCounts = useMemo<ArrondissementCount[]>(() => {
    const map = new Map<number, number>();
    champItems.forEach(item => {
      const ts = (item as FieldItem & { created_at?: string }).created_at;
      if (ts && new Date(ts).getTime() > now24h) {
        map.set(item.arrondissement, (map.get(item.arrondissement) ?? 0) + 1);
      }
    });
    if (map.size === 0) {
      champItems.slice(0, 5).forEach(item => {
        map.set(item.arrondissement, (map.get(item.arrondissement) ?? 0) + 1);
      });
    }
    return Array.from(map.entries()).map(([arrondissement, count]) => ({ arrondissement, count }));
  }, [champItems, now24h]);

  const invisibleCounts = useMemo<ArrondissementCount[]>(() => {
    const map = new Map<number, number>();
    champItems.forEach(item => {
      map.set(item.arrondissement, (map.get(item.arrondissement) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([arrondissement, count]) => ({ arrondissement, count }));
  }, [champItems]);

  // Place detail sheet
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetail | null>(null);

  const handlePlaceSelect = useCallback((place: ResonancePlace) => {
    const lieu = LIEUX_PARIS.find(l => `lieu-${l.id}` === place.id);
    const card = GAME_CARDS.find(c => `card-${c.id}` === place.id);
    setSelectedPlace({
      id: place.id,
      name: place.name,
      description: lieu?.poeticLine ?? card?.reveal ?? '',
      arrondissement: lieu?.arrondissement ?? card?.arrondissement ?? '?',
      weight: card?.weight,
      coordinates: lieu?.coordinates ?? card?.gps,
    });
  }, []);

  // Add trace sheet (preserved from original)
  const [showAddTrace, setShowAddTrace] = useState(false);
  const [traceDraft, setTraceDraft] = useState('');
  const [traceSaving, setTraceSaving] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);
  const traceValidationError = validateChampTrace(traceDraft);
  const traceWordCount = countWords(traceDraft);
  const canSubmitTrace = !traceSaving && isCardEligible && geo.lat !== null && geo.lng !== null && traceDraft.trim().length > 0 && !traceValidationError;

  const handleRetry = () => {
    if (!cardId || cardId === 'DEMO-DEV') return;
    setLoadError(false);
    setLoading(true);
    loadChampItems(cardId)
      .then((data) => {
        setChampItems(
          data
            .filter((item): item is FieldItem & { arrondissement: number } => item.arrondissement != null)
            .map(item => ({ ...item, textExcerpt: normalizeDisplayText(item.textExcerpt) }))
        );
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  const layerLabels: Record<ChampLayerMode, string> = {
    resonance: t('champ.layer.resonance'),
    aujourdhui: t('champ.layer.aujourdhui'),
    invisible: t('champ.layer.invisible'),
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%', maxWidth: '100%',
      background: 'var(--paper, #FAF8F2)', padding: '0 0 80px 0',
    }}>
      <BackButton onClick={onBack} />

      {/* Header */}
      <section style={{
        maxWidth: 680, margin: '0 auto',
        padding: '100px 24px 24px', textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 40px)',
          fontWeight: 400, letterSpacing: '0.02em',
          color: 'var(--green, #003D2C)', marginBottom: 8, lineHeight: 1.2,
        }}>
          {t('champ.title')}
        </h1>
        <p style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(14px, 2.5vw, 16px)',
          fontWeight: 300, fontStyle: 'italic',
          color: 'var(--ink, #1A1A1A)', opacity: 0.55,
          lineHeight: 1.7, maxWidth: 380, margin: '0 auto',
        }}>
          {t('champ.subtitle')}
        </p>
      </section>

      {/* Layer Toggles */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
        <LayerToggles
          activeLayers={activeLayers}
          onToggle={toggleLayer}
          labels={layerLabels}
        />
      </section>

      {/* Bridge banner */}
      {showBridgeBanner && highlightArr && (
        <div style={{
          maxWidth: 680, margin: '0 auto 8px', padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,120,80,0.05)', border: '1px solid rgba(0,120,80,0.12)',
          borderRadius: 6,
        }}>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: 11,
            color: '#003D2C', opacity: 0.7,
          }}>
            {t('champ.filter.fromPresence', { arr: t(`map.arrondissements.${highlightArr}`) })}
          </span>
          <button
            type="button"
            onClick={() => { setShowBridgeBanner(false); setHighlightArr(null); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: 14,
              color: '#003D2C', opacity: 0.5, padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Map */}
      <section style={{
        maxWidth: 720, margin: '0 auto', padding: '0 24px',
        position: 'relative',
      }}>
        <AsyncState
          loading={loading}
          error={loadError ? { message: t('champ.loadError') } : null}
          onRetry={handleRetry}
          onBack={onBack}
        >
          <ChampMapSection
            activeLayers={activeLayers}
            resonancePlaces={resonancePlaces}
            aujourdhuiCounts={aujourdhuiCounts}
            invisibleCounts={invisibleCounts}
            highlightArr={highlightArr}
            onPlaceSelect={handlePlaceSelect}
            mapVariant="draw"
          />
        </AsyncState>
      </section>

      {/* Legend */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '16px 24px 0' }}>
        <ChampLegend
          activeLayers={activeLayers}
          legendTitle={t('champ.legend.title')}
          resonanceLabel={t('champ.legend.resonance')}
          aujourdhuiLabel={t('champ.legend.aujourdhui')}
          invisibleLabel={t('champ.legend.invisible')}
          noDataLabel={t('champ.legend.noData')}
          invisibleCount={champItems.length}
          aujourdhuiCount={aujourdhuiCounts.reduce((sum, c) => sum + c.count, 0)}
        />
      </section>

      {/* Add trace CTA */}
      <div style={{
        textAlign: 'center', marginTop: 20, paddingBottom: 24,
        position: 'relative', zIndex: 2,
      }}>
        <button
          type="button"
          onClick={() => setShowAddTrace(true)}
          aria-label={t('champ.leaveTrace')}
          style={{
            padding: '14px 28px',
            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#003D2C', background: 'rgba(0, 61, 44, 0.12)',
            border: '1px solid rgba(0, 61, 44, 0.35)',
            borderRadius: 6, cursor: 'pointer', minHeight: 44,
          }}
        >
          {t('champ.leaveTrace')}
        </button>
      </div>

      {/* Place detail sheet (bridge to Mon Paris) */}
      <PlaceDetailSheet
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        titleLabel={t('champ.detail.title')}
        approachLabel={t('champ.detail.approachToSeal')}
        weightLabel={t('champ.detail.weight')}
        arrondissementLabel={t('champ.detail.arrondissement')}
      />

      {/* Add trace sheet */}
      <Sheet open={showAddTrace} onOpenChange={setShowAddTrace}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto"
          style={{ background: '#FAF8F2', borderColor: 'rgba(0,61,44,0.15)' }}
        >
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'var(--font-serif)', color: '#1A1A1A' }}>
              {t('champ.leaveTrace')}
            </SheetTitle>
          </SheetHeader>
          <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontStyle: 'italic', color: '#6B6455' }}>
              Une pensée, une observation, un fragment de la ville.
            </p>

            {!isCardEligible && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#B43232', opacity: 0.9 }}>
                Une carte activée est requise pour partager au Champ.
              </p>
            )}
            {geo.lat !== null && geo.lng !== null ? (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#007850', opacity: 0.7 }}>
                {t('presence.signalSettling')}
              </p>
            ) : (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#B43232', opacity: 0.7 }}>
                Position GPS requise pour laisser une trace
              </p>
            )}

            <textarea
              value={traceDraft}
              onChange={(e) => { setTraceDraft(e.target.value); if (traceError) setTraceError(null); }}
              placeholder="Rue ... - HH:MM ..."
              rows={4}
              maxLength={280}
              style={{
                width: '100%', padding: 14,
                fontFamily: 'var(--font-serif)', fontSize: 15,
                color: '#1A1A1A', background: 'transparent',
                border: '1px solid rgba(0,61,44,0.2)',
                borderRadius: 4, resize: 'vertical', boxSizing: 'border-box',
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
                      kind: 'arrondissement', arrondissement,
                      text: traceDraft.trim(), idempotency_key: idempotencyKey,
                      opt_in_field: true,
                    });
                    const data = await loadChampItems(cardId);
                    setChampItems(
                      data
                        .filter((item): item is FieldItem & { arrondissement: number } => item.arrondissement != null)
                        .map(item => ({ ...item, textExcerpt: normalizeDisplayText(item.textExcerpt) }))
                    );
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
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: canSubmitTrace ? '#FAF8F2' : '#8E8982',
                  background: canSubmitTrace ? '#003D2C' : 'rgba(0,0,0,0.05)',
                  border: canSubmitTrace ? '1px solid rgba(0,61,44,0.4)' : '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 6, cursor: canSubmitTrace ? 'pointer' : 'not-allowed',
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
