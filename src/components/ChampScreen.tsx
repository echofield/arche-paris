/**
 * ARCHE -- Le Champ
 * The city's collective layered observatory.
 * "What is alive in Paris right now? Where are the fields?"
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BackButton } from './BackButton';
import { ChampMapSection, type ResonancePlace, type ArrondissementCount, type AxisMarker } from './ChampMapSection';
import { LayerToggles, type ChampLayerMode } from './ChampScreen/LayerToggles';
import { ChampLegend } from './ChampScreen/ChampLegend';
import { PlaceDetailSheet, type PlaceDetail } from './ChampScreen/PlaceDetailSheet';
import { useTranslation } from '../utils/i18n';
import { loadChampItems, type FieldItem } from '../utils/card-gate-client';
import { postInscription, type InscriptionTarget } from '../utils/card-gate-map-client';
import { normalizeDisplayText } from '../utils/text-normalize';
import { useGeolocation } from '../hooks/useGeolocation';
import { project } from '../utils/map-project';
import { ARRONDISSEMENT_MAP_POSITION } from '../data/arrondissement-positions';
import { LIEUX_PARIS } from '../data/lieux-paris';
import { GAME_CARDS } from '../data/game-cards';
import { CITY_AXES, getAxisAnchorsOnMap, getAxisArrondissementSequence } from '../data/axes';
import { setActiveAxis } from '../stores/active-axis-store';
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
  const validLayers: ChampLayerMode[] = ['resonance', 'aujourdhui', 'invisible', 'axes'];
  const layers = layersStr
    ? layersStr.split(',').filter((l): l is ChampLayerMode => validLayers.includes(l as ChampLayerMode))
    : [];
  return { arr: Number.isFinite(arr) ? arr : null, layers };
}

function placeArrondissementToNumber(arr: number | string): number | null {
  if (typeof arr === 'number' && Number.isFinite(arr) && arr >= 1 && arr <= 20) return arr;
  if (typeof arr !== 'string') return null;
  const m = arr.trim().match(/^(?:1er|\d+e)$/i);
  if (!m) return null;
  if (m[0].toLowerCase() === '1er') return 1;
  const n = parseInt(m[0], 10);
  return Number.isFinite(n) && n >= 1 && n <= 20 ? n : null;
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
      return { id: `lieu-${l.id}`, name: l.name, x: p.x, y: p.y, isAnchor: l.isAnchor };
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

  // Arrondissement tap sheet (aujourdhui / invisible)
  const [arrSheet, setArrSheet] = useState<{ arr: number; layer: 'aujourdhui' | 'invisible' } | null>(null);

  const handleArrTap = useCallback((arr: number, layer: 'aujourdhui' | 'invisible') => {
    setArrSheet({ arr, layer });
  }, []);

  const arrSheetData = useMemo(() => {
    if (!arrSheet) return null;
    const { arr, layer } = arrSheet;
    if (layer === 'aujourdhui') {
      const count = aujourdhuiCounts.find(c => c.arrondissement === arr)?.count ?? 0;
      const recentItems = champItems
        .filter(item => item.arrondissement === arr)
        .sort((a, b) => {
          const tsA = (a as FieldItem & { created_at?: string }).created_at;
          const tsB = (b as FieldItem & { created_at?: string }).created_at;
          return (tsB ? new Date(tsB).getTime() : 0) - (tsA ? new Date(tsA).getTime() : 0);
        });
      const lastTs = (recentItems[0] as FieldItem & { created_at?: string })?.created_at;
      let relativeTime = '';
      if (lastTs) {
        const diffMs = Date.now() - new Date(lastTs).getTime();
        const diffMin = Math.floor(diffMs / 60_000);
        if (diffMin < 60) relativeTime = `${diffMin}min`;
        else if (diffMin < 1440) relativeTime = `${Math.floor(diffMin / 60)}h`;
        else relativeTime = `${Math.floor(diffMin / 1440)}j`;
      }
      return { count, relativeTime, layer };
    }
    const count = invisibleCounts.find(c => c.arrondissement === arr)?.count ?? 0;
    return { count, relativeTime: '', layer };
  }, [arrSheet, aujourdhuiCounts, invisibleCounts, champItems]);

  // Place detail: preview card (in flow) + full sheet (on "More")
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetail | null>(null);
  const [showPlaceSheet, setShowPlaceSheet] = useState(false);

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
    setShowPlaceSheet(false);
  }, []);

  const openPlaceSheet = useCallback(() => setShowPlaceSheet(true), []);
  const closePlaceSheet = useCallback(() => {
    setShowPlaceSheet(false);
    setSelectedPlace(null);
  }, []);

  const openLeaveTraceFromPlace = useCallback(() => {
    if (!selectedPlace) return;
    const arr = placeArrondissementToNumber(selectedPlace.arrondissement);
    if (arr != null) setTraceContextArrondissement(arr);
    setTraceTarget({ kind: 'place', id: selectedPlace.id, name: selectedPlace.name });
    closePlaceSheet();
    setShowAddTrace(true);
  }, [selectedPlace, closePlaceSheet]);

  const openLeaveTraceFromAxis = useCallback(() => {
    if (axisSheet == null || !axisSheetData) return;
    const seq = getAxisArrondissementSequence(axisSheet);
    const firstArr = seq[0] ?? null;
    if (firstArr != null) setTraceContextArrondissement(firstArr);
    setTraceTarget({ kind: 'axis', id: String(axisSheet), name: axisSheetData.name });
    setAxisSheet(null);
    setShowAddTrace(true);
  }, [axisSheet, axisSheetData]);

  // Axes layer data
  const axisMarkers = useMemo<AxisMarker[]>(() => {
    const anchors = getAxisAnchorsOnMap();
    const seen = new Set<number>();
    return anchors.filter(a => {
      if (seen.has(a.axisIndex)) return false;
      seen.add(a.axisIndex);
      return true;
    }).map(a => ({ axisIndex: a.axisIndex, axisName: a.axisName, arrondissement: a.arrondissement }));
  }, []);

  const allAxisMarkers = useMemo<AxisMarker[]>(() => {
    return getAxisAnchorsOnMap().map(a => ({
      axisIndex: a.axisIndex,
      axisName: a.axisName,
      arrondissement: a.arrondissement,
    }));
  }, []);

  const [axisSheet, setAxisSheet] = useState<number | null>(null);

  const handleAxisTap = useCallback((axisIndex: number) => {
    setAxisSheet(axisIndex);
  }, []);

  const axisSheetData = useMemo(() => {
    if (axisSheet == null || !CITY_AXES[axisSheet]) return null;
    return CITY_AXES[axisSheet];
  }, [axisSheet]);

  const handleActivateAxis = useCallback(() => {
    if (axisSheetData) {
      setActiveAxis(axisSheetData.name, axisSheetData.activation_mode);
      setAxisSheet(null);
    }
  }, [axisSheetData]);

  // Add trace sheet: optional arrondissement when opened from a place/axis; optional target (place | axis | arrondissement)
  const [showAddTrace, setShowAddTrace] = useState(false);
  const [traceContextArrondissement, setTraceContextArrondissement] = useState<number | null>(null);
  const [traceTarget, setTraceTarget] = useState<InscriptionTarget | null>(null);
  const [traceDraft, setTraceDraft] = useState('');
  const [traceSaving, setTraceSaving] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);
  const traceValidationError = validateChampTrace(traceDraft);
  const traceWordCount = countWords(traceDraft);
  const hasTraceArrondissement = traceContextArrondissement != null || (geo.lat != null && geo.lng != null);
  const canSubmitTrace = !traceSaving && isCardEligible && traceDraft.trim().length > 0 && !traceValidationError && hasTraceArrondissement;

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
    axes: t('champ.layer.axes'),
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
            axisMarkers={allAxisMarkers}
            highlightArr={highlightArr}
            onPlaceSelect={handlePlaceSelect}
            onArrTap={handleArrTap}
            onAxisTap={handleAxisTap}
            mapVariant="draw"
          />
        </AsyncState>
      </section>

      {/* Place preview card: name + one line, in flow below map (mobile-friendly) */}
      {selectedPlace && (
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '12px 24px 0' }}>
          <button
            type="button"
            onClick={openPlaceSheet}
            style={{
              width: '100%', textAlign: 'left',
              padding: '14px 16px',
              background: 'rgba(139,105,20,0.06)',
              border: '1px solid rgba(139,105,20,0.18)',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 500,
              color: '#1A1A1A', marginBottom: 4,
            }}>
              {selectedPlace.name}
            </div>
            {selectedPlace.description && (
              <p style={{
                margin: 0, fontFamily: 'var(--font-serif)', fontSize: 13,
                fontStyle: 'italic', color: '#1A1A1A', opacity: 0.8,
                lineHeight: 1.45,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {selectedPlace.description}
              </p>
            )}
            <span style={{
              display: 'inline-block', marginTop: 8,
              fontFamily: 'var(--font-sans)', fontSize: 11,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#8B6914', opacity: 0.9,
            }}>
              {t('champ.detail.more')} →
            </span>
          </button>
        </section>
      )}

      {/* Legend */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '16px 24px 0' }}>
        <ChampLegend
          activeLayers={activeLayers}
          legendTitle={t('champ.legend.title')}
          resonanceLabel={t('champ.legend.resonance')}
          aujourdhuiLabel={t('champ.legend.aujourdhui')}
          invisibleLabel={t('champ.legend.invisible')}
          axesLabel={t('champ.legend.axes')}
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

      {/* Arrondissement sheet (aujourdhui / invisible tap) */}
      <Sheet open={arrSheet !== null} onOpenChange={(open) => { if (!open) setArrSheet(null); }}>
        <SheetContent
          side="bottom"
          className="max-h-[55vh] overflow-y-auto"
          style={{ background: '#FAF8F2', borderColor: 'rgba(0,61,44,0.15)' }}
        >
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'var(--font-serif)', color: '#1A1A1A' }}>
              {arrSheet ? t(`map.arrondissements.${arrSheet.arr}`) : ''}
            </SheetTitle>
          </SheetHeader>
          {arrSheetData && arrSheet && (
            <div style={{ padding: '0 1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{
                margin: 0, fontFamily: 'var(--font-sans)', fontSize: 10,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: arrSheetData.layer === 'aujourdhui' ? '#007850' : '#003D2C', opacity: 0.7,
              }}>
                {arrSheetData.layer === 'aujourdhui'
                  ? t('champ.aujourdhui.sheetTitle')
                  : t('champ.invisible.sheetTitle')}
              </p>

              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8,
              }}>
                <span style={{
                  fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 500,
                  color: '#1A1A1A',
                }}>
                  {arrSheetData.count}
                </span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#6B6455' }}>
                  {arrSheetData.layer === 'aujourdhui'
                    ? t('champ.aujourdhui.count', { count: arrSheetData.count })
                    : t('champ.invisible.count', { count: arrSheetData.count })}
                </span>
              </div>

              {arrSheetData.layer === 'aujourdhui' && arrSheetData.relativeTime && (
                <p style={{
                  margin: 0, fontFamily: 'var(--font-sans)', fontSize: 11, color: '#003D2C', opacity: 0.6,
                }}>
                  {t('champ.aujourdhui.lastActivity')}: {t('champ.aujourdhui.ago', { value: arrSheetData.relativeTime })}
                </p>
              )}

              {arrSheetData.count === 0 && arrSheetData.layer === 'aujourdhui' && (
                <p style={{
                  margin: 0, fontFamily: 'var(--font-serif)', fontSize: 13,
                  fontStyle: 'italic', color: '#8E8982', opacity: 0.7,
                }}>
                  {t('champ.aujourdhui.empty')}
                </p>
              )}

              <p style={{
                margin: '4px 0 0', fontFamily: 'var(--font-serif)', fontSize: 13,
                fontStyle: 'italic', color: '#1A1A1A', opacity: 0.55, lineHeight: 1.6,
              }}>
                {arrSheetData.layer === 'aujourdhui'
                  ? t('champ.aujourdhui.sheetLine')
                  : t('champ.invisible.sheetLine')}
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Axis detail sheet */}
      <Sheet open={axisSheet !== null} onOpenChange={(open) => { if (!open) setAxisSheet(null); }}>
        <SheetContent
          side="bottom"
          className="max-h-[70vh] overflow-y-auto"
          style={{ background: '#FAF8F2', borderColor: 'rgba(107,76,138,0.2)' }}
        >
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'var(--font-serif)', color: '#1A1A1A' }}>
              {axisSheetData?.name ?? t('champ.axes.sheetTitle')}
            </SheetTitle>
          </SheetHeader>
          {axisSheetData && (
            <div style={{ padding: '0 1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B4C8A', opacity: 0.8 }}>
                  {axisSheetData.type.replace(/_/g, ' ')}
                </span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6455' }}>
                  {t(`axes.activation.${axisSheetData.activation_mode}`)}
                </span>
              </div>

              <p style={{
                margin: 0, fontFamily: 'var(--font-serif)',
                fontSize: 13, color: '#1A1A1A', opacity: 0.85, lineHeight: 1.5,
              }}>
                {axisSheetData.perceptual_hint}
              </p>

              <p style={{
                margin: 0, fontFamily: 'var(--font-serif)',
                fontSize: 14, fontStyle: 'italic',
                color: '#1A1A1A', opacity: 0.7, lineHeight: 1.6,
              }}>
                {axisSheetData.experiential_description}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6455' }}>
                  {t('champ.axes.strength')}: {axisSheetData.strength}/5
                </span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6455' }}>
                  {t('champ.axes.scale')}: {axisSheetData.scale}
                </span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6455' }}>
                  {t('champ.axes.walkable')}: {axisSheetData.walkable_experience ? t('champ.axes.walkableYes') : t('champ.axes.walkableNo')}
                </span>
              </div>

              <p style={{
                margin: '4px 0 0', fontFamily: 'var(--font-serif)',
                fontSize: 13, fontStyle: 'italic', color: '#6B4C8A', opacity: 0.7, lineHeight: 1.5,
              }}>
                {t(`axes.hint.${axisSheetData.activation_mode}`)}
              </p>

              <button
                type="button"
                onClick={handleActivateAxis}
                style={{
                  marginTop: 4, width: '100%', padding: '12px 0',
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: '#FAF8F2', background: '#6B4C8A',
                  border: '1px solid rgba(107,76,138,0.5)',
                  borderRadius: 6, cursor: 'pointer', minHeight: 44,
                }}
              >
                {t('champ.axes.activate')}
              </button>

              <button
                type="button"
                onClick={openLeaveTraceFromAxis}
                style={{
                  marginTop: 8, width: '100%', padding: '12px 0',
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: '#003D2C', background: 'transparent',
                  border: '1px solid rgba(0,61,44,0.35)',
                  borderRadius: 6, cursor: 'pointer', minHeight: 44,
                }}
              >
                {t('champ.detail.leaveTraceOnAxis')}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (axisSheet != null) {
                    window.location.hash = `meridiens?axisId=${axisSheet}`;
                    setAxisSheet(null);
                  }
                }}
                style={{
                  marginTop: 8, width: '100%', padding: '12px 0',
                  fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: '#6B4C8A', background: 'transparent',
                  border: '1px solid rgba(107,76,138,0.4)',
                  borderRadius: 6, cursor: 'pointer', minHeight: 44,
                }}
              >
                {t('meridiens.cta.guidance')}
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Place detail sheet (bridge to Mon Paris) — opens from "More" on preview card */}
      <PlaceDetailSheet
        place={showPlaceSheet ? selectedPlace : null}
        onClose={closePlaceSheet}
        titleLabel={t('champ.detail.title')}
        approachLabel={t('champ.detail.approachToSeal')}
        instrumentsLabel={t('champ.detail.openInstruments')}
        weightLabel={t('champ.detail.weight')}
        arrondissementLabel={t('champ.detail.arrondissement')}
        openInMapsLabel={t('champ.detail.openInMaps')}
        onLeaveTrace={openLeaveTraceFromPlace}
        leaveTraceLabel={t('champ.detail.leaveTraceHere')}
        moreLeadsTo={t('champ.detail.moreLeadsTo')}
      />

      {/* Add trace sheet */}
      <Sheet open={showAddTrace} onOpenChange={(open) => { setShowAddTrace(open); if (!open) { setTraceContextArrondissement(null); setTraceTarget(null); } }}>
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
            {traceTarget != null && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#003D2C', opacity: 0.8 }}>
                {t('champ.trace.targeting', { name: traceTarget.name ?? traceTarget.id })}
              </p>
            )}
            {traceContextArrondissement != null ? (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#007850', opacity: 0.7 }}>
                {t('champ.traceInArrondissement', { arr: t(`map.arrondissements.${traceContextArrondissement}`) })}
              </p>
            ) : geo.lat !== null && geo.lng !== null ? (
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
                  if (!cardId || !canSubmitTrace) return;
                  const arrondissement = traceContextArrondissement ?? (geo.lat != null && geo.lng != null ? inferArrondissementFromGeo(geo.lat, geo.lng) : null);
                  if (!arrondissement) throw new Error('Position hors zone');
                  setTraceSaving(true);
                  setTraceError(null);
                  try {
                    const idempotencyKey = `champ:${arrondissement}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
                    await postInscription(cardId, {
                      kind: 'arrondissement', arrondissement,
                      text: traceDraft.trim(), idempotency_key: idempotencyKey,
                      opt_in_field: true,
                      target: traceTarget ?? undefined,
                    });
                    const data = await loadChampItems(cardId);
                    setChampItems(
                      data
                        .filter((item): item is FieldItem & { arrondissement: number } => item.arrondissement != null)
                        .map(item => ({ ...item, textExcerpt: normalizeDisplayText(item.textExcerpt) }))
                    );
                    setTraceDraft('');
                    setTraceContextArrondissement(null);
                    setTraceTarget(null);
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
