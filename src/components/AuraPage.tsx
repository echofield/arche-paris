/**
 * ARCHÉ — Aura page
 * Calm, breathing space. Phenomenological mirror.
 * Shows AURA profile from church quests (status, seals) when available.
 */

import { useState, useEffect, useCallback } from 'react';
import { ArcheSymbol } from './ArcheSymbol';
import { BackButton } from './BackButton';
import { MiroirSurface } from './MiroirSurface';
import { loadCompanion } from '../utils/companion-service';
import { getCompanionWord, getReflectiveQuestion, getAuraInterpretation } from '../data/oracle';
import { sealingStub } from '../utils/sealing-stub';
import { appendAuraSealToJournal } from '../utils/journal-sync';
import { getAuraProfile, type AuraProfileResult } from '../utils/card-gate-client';
import { useTranslation } from '../utils/i18n';
import { api, type ZoneProgressData, type ComplexionData } from '../lib/api';

// Hint templates based on what changed (French)
const COMPLEXION_HINTS: Record<string, string[]> = {
  presence_up: [
    'Ta présence s\'est affirmée.',
    'Le méridien te reconnaît.',
    'Tu t\'ancres dans la ligne.',
  ],
  wisdom_up: [
    'Ta sagesse s\'est densifiée.',
    'L\'étude porte ses fruits.',
    'Tu vois plus loin.',
  ],
  shadow_up: [
    'L\'ombre s\'est épaissie.',
    'Tu explores les marges.',
    'Le doute nourrit la clarté.',
  ],
  shadow_down: [
    'L\'ombre recule.',
    'La lumière gagne du terrain.',
  ],
  neutral: [
    'Quelque chose a changé en toi.',
    'Le chemin continue.',
  ],
};

// Get hint based on last_delta
function getComplexionHint(lastDelta: Record<string, unknown> | null | undefined): string | null {
  if (!lastDelta) return null;

  const dPresence = (lastDelta.d_presence as number) ?? 0;
  const dWisdom = (lastDelta.d_wisdom as number) ?? 0;
  const dShadow = (lastDelta.d_shadow as number) ?? 0;

  // Check if anything changed
  if (dPresence === 0 && dWisdom === 0 && dShadow === 0) return null;

  let category: keyof typeof COMPLEXION_HINTS;

  if (dPresence > dWisdom && dPresence > Math.abs(dShadow) && dPresence > 0) {
    category = 'presence_up';
  } else if (dWisdom > dPresence && dWisdom > Math.abs(dShadow) && dWisdom > 0) {
    category = 'wisdom_up';
  } else if (dShadow > 0 && dShadow > dPresence && dShadow > dWisdom) {
    category = 'shadow_up';
  } else if (dShadow < 0) {
    category = 'shadow_down';
  } else {
    category = 'neutral';
  }

  const lines = COMPLEXION_HINTS[category];
  // Deterministic: use today's date as seed
  const now = new Date();
  const daySeed = now.getFullYear() * 10000 + now.getMonth() * 100 + now.getDate();
  const index = daySeed % lines.length;

  return lines[index] ?? lines[0];
}

interface AuraPageProps {
  onBack: () => void;
  cardId?: string | null;
  onOpenKept?: () => void;
  onEnterChamp?: () => void;
}

/** Opacity by companion level (0=Quiet → 3=Bright). No animation. */
function glyphOpacity(level: 0 | 1 | 2 | 3): number {
  return 0.4 + level * 0.2; // 0.4, 0.6, 0.8, 1.0
}

export function AuraPage({ onBack, cardId, onOpenKept, onEnterChamp }: AuraPageProps) {
  const { t } = useTranslation();
  const [sealOpen, setSealOpen] = useState(false);
  const [sealContent, setSealContent] = useState('');
  const [sealSaved, setSealSaved] = useState(false);
  const [auraProfile, setAuraProfile] = useState<AuraProfileResult | null>(null);
  const [auraProfileLoading, setAuraProfileLoading] = useState(false);
  const [zoneProgress, setZoneProgress] = useState<ZoneProgressData | null>(null);
  const [complexion, setComplexion] = useState<ComplexionData | null>(null);
  const [complexionHint, setComplexionHint] = useState<string | null>(null);
  const state = loadCompanion();
  const level = (state.level ?? 0) as 0 | 1 | 2 | 3;
  const word = getCompanionWord(level);

  // Load ARCHÉ zone progress + complexion (real backend data)
  const loadComplexionData = useCallback(async () => {
    try {
      const [zoneResult, complexionResult] = await Promise.all([
        api.zoneProgress(),
        api.meComplexion(),
      ]);

      if (zoneResult.data) {
        setZoneProgress(zoneResult.data);
      }

      if (complexionResult.data) {
        setComplexion(complexionResult.data);
        // Generate hint from last_delta
        const hint = getComplexionHint(complexionResult.data.last_delta);
        setComplexionHint(hint);
      }
    } catch (err) {
      console.error('[AuraPage] Failed to load complexion:', err);
    }
  }, []);

  useEffect(() => {
    loadComplexionData();
  }, [loadComplexionData]);

  useEffect(() => {
    if (!cardId || cardId === 'DEMO-DEV') return;
    let cancelled = false;
    setAuraProfileLoading(true);
    getAuraProfile(cardId)
      .then((p) => { if (!cancelled) setAuraProfile(p); })
      .catch(() => { if (!cancelled) setAuraProfile(null); })
      .finally(() => { if (!cancelled) setAuraProfileLoading(false); });
    return () => { cancelled = true; };
  }, [cardId]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#FAF8F2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 48px)',
        boxSizing: 'border-box'
      }}
    >
      <BackButton onClick={onBack} />

      {/* Header — minimal */}
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(28px, 6vw, 36px)',
          fontWeight: 400,
          color: '#1A1A1A',
          letterSpacing: '0.08em',
          marginBottom: 4
        }}
      >
        AURA
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          color: '#003D2C',
          opacity: 0.5,
          letterSpacing: '0.1em',
          marginBottom: 8
        }}
      >
        {auraProfileLoading ? '…' : auraProfile?.status ?? 'Présence'}
      </p>
      {auraProfile && auraProfile.seals.length > 0 && (
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            color: '#003D2C',
            opacity: 0.5,
            letterSpacing: '0.06em',
            marginBottom: 'clamp(24px, 6vw, 48px)'
          }}
        >
          {auraProfile.seals.length === 1
            ? t('aura.oneMark')
            : t('aura.marks', { count: auraProfile.seals.length })}
          {auraProfile.seals.length > 0 && (
            <> — {t('aura.lastSeal', { seal: auraProfile.seals[auraProfile.seals.length - 1] })}</>
          )}
        </p>
      )}
      {(!auraProfile || auraProfile.seals.length === 0) && !auraProfileLoading && (
        <div style={{ marginBottom: 'clamp(24px, 6vw, 48px)' }} />
      )}

      {/* Central visual — ArcheSymbol, opacity by companion level */}
      <div
        style={{
          opacity: glyphOpacity(level),
          marginBottom: 'clamp(20px, 4vw, 32px)'
        }}
      >
        <ArcheSymbol size={140} />
      </div>

      {/* Companion state — one word */}
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(18px, 4vw, 22px)',
          fontStyle: 'italic',
          color: '#003D2C',
          opacity: 0.7,
          marginBottom: 'clamp(16px, 4vw, 24px)'
        }}
      >
        {word}
      </p>

      {/* Miroir — daily sentence with historical anecdote */}
      <MiroirSurface cardId={cardId} onOpenKept={onOpenKept} />

      {/* ARCHÉ State Dashboard — Poetic dots, one rare number */}
      {(zoneProgress || complexion) && (
        <div
          style={{
            marginTop: 'clamp(24px, 5vw, 40px)',
            padding: '20px 24px',
            background: 'rgba(0, 61, 44, 0.03)',
            borderRadius: 8,
            maxWidth: 320,
            width: '100%',
          }}
        >
          {/* Complexion hint — feedback after action */}
          {complexionHint && (
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                fontStyle: 'italic',
                color: '#B8860B',
                textAlign: 'center',
                marginBottom: 16,
                padding: '8px 12px',
                background: 'rgba(212,175,55,0.08)',
                borderRadius: 4,
              }}
            >
              {complexionHint}
            </p>
          )}

          {/* Complexion with dots (●●●○○○) — driven by real backend data */}
          {(() => {
            // Use direct complexion data if available, fallback to zoneProgress
            const data = complexion ?? zoneProgress?.complexion;
            if (!data) return null;

            const { presence_points, wisdom_points, shadow_points } = data;
            const total = presence_points + wisdom_points + shadow_points;

            // Convert points to dots (6 max, thresholds: 0, 5, 15, 30, 50, 75)
            const pointsToDots = (points: number): number => {
              if (points >= 75) return 6;
              if (points >= 50) return 5;
              if (points >= 30) return 4;
              if (points >= 15) return 3;
              if (points >= 5) return 2;
              if (points > 0) return 1;
              return 0;
            };

            const presenceDots = pointsToDots(presence_points);
            const wisdomDots = pointsToDots(wisdom_points);
            const shadowDots = pointsToDots(shadow_points);

            // Determine dominant
            let dominant: 'presence' | 'wisdom' | 'shadow' | null = null;
            if (total > 0) {
              if (presence_points >= wisdom_points && presence_points >= shadow_points) {
                dominant = 'presence';
              } else if (shadow_points >= presence_points && shadow_points >= wisdom_points) {
                dominant = 'shadow';
              } else {
                dominant = 'wisdom';
              }
            }

            // Render dots
            const renderDots = (filled: number, total: number = 6, color: string) => (
              <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 4 }}>
                {Array.from({ length: total }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: i < filled ? color : 'transparent',
                      border: `1px solid ${i < filled ? color : 'rgba(0,0,0,0.15)'}`,
                    }}
                  />
                ))}
              </div>
            );

            return (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                  {/* Presence */}
                  <div style={{ textAlign: 'center', opacity: dominant === 'presence' ? 1 : 0.7 }}>
                    <span style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 10,
                      color: '#6B6455',
                      fontWeight: dominant === 'presence' ? 600 : 400,
                      letterSpacing: '0.05em',
                    }}>Présence</span>
                    {renderDots(presenceDots, 6, '#007850')}
                  </div>
                  {/* Wisdom */}
                  <div style={{ textAlign: 'center', opacity: dominant === 'wisdom' ? 1 : 0.7 }}>
                    <span style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 10,
                      color: '#6B6455',
                      fontWeight: dominant === 'wisdom' ? 600 : 400,
                      letterSpacing: '0.05em',
                    }}>Sagesse</span>
                    {renderDots(wisdomDots, 6, '#003D2C')}
                  </div>
                  {/* Shadow */}
                  <div style={{ textAlign: 'center', opacity: dominant === 'shadow' ? 1 : 0.7 }}>
                    <span style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 10,
                      color: '#6B6455',
                      fontWeight: dominant === 'shadow' ? 600 : 400,
                      letterSpacing: '0.05em',
                    }}>Ombre</span>
                    {renderDots(shadowDots, 6, '#1A1A1A')}
                  </div>
                </div>

                {/* Poetic interpretation */}
                {total > 0 && (
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 13,
                      fontStyle: 'italic',
                      color: '#1A1A1A',
                      textAlign: 'center',
                      marginTop: 16,
                      opacity: 0.7,
                      lineHeight: 1.5,
                    }}
                  >
                    {getAuraInterpretation(dominant)}
                  </p>
                )}
              </div>
            );
          })()}

          {/* One rare number: Zones éveillées */}
          <div
            style={{
              paddingTop: 16,
              borderTop: '1px solid rgba(0, 61, 44, 0.08)',
              textAlign: 'center',
            }}
          >
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: '#003D2C',
              opacity: 0.8,
            }}>
              Zones éveillées: <strong>{zoneProgress.stats.zones_complete}/20</strong>
            </p>
          </div>

          {/* Next seal goal */}
          {(() => {
            const { total_rituals, zones_complete, custodianships } = zoneProgress.stats;
            const seals = auraProfile?.seals ?? [];

            // Calculate next goal
            let nextGoal: string | null = null;
            if (!seals.includes('lutece') && total_rituals < 5) {
              nextGoal = `${5 - total_rituals} rituel${5 - total_rituals > 1 ? 's' : ''} pour Sceau de Lutèce`;
            } else if (!seals.includes('meridien') && zones_complete < 3) {
              nextGoal = `${3 - zones_complete} zone${3 - zones_complete > 1 ? 's' : ''} pour Sceau du Méridien`;
            } else if (!seals.includes('gardien') && custodianships < 1) {
              nextGoal = `Devenir gardien pour Sceau du Gardien`;
            }

            if (!nextGoal) return null;

            return (
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  background: 'rgba(212,175,55,0.1)',
                  borderRadius: 6,
                  border: '1px solid rgba(212,175,55,0.2)',
                }}
              >
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  color: '#B8860B',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}>
                  Prochain seuil
                </p>
                <p style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: '#1A1A1A',
                  opacity: 0.8,
                }}>
                  {nextGoal}
                </p>
              </div>
            );
          })()}

          {/* Revealed status */}
          {(complexion?.revealed || zoneProgress?.complexion?.revealed) && (
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 12,
                fontStyle: 'italic',
                color: '#007850',
                textAlign: 'center',
                marginTop: 16,
                opacity: 0.8,
              }}
            >
              Complexion révélée
            </p>
          )}
        </div>
      )}

      {/* Optional: Graver un moment */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setSealOpen(true)}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            letterSpacing: '0.08em',
            color: '#003D2C',
            opacity: 0.5,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 16px',
            textDecoration: 'underline',
            textUnderlineOffset: 2
          }}
        >
          Graver un moment
        </button>
        {onEnterChamp && (
          <button
            type="button"
            onClick={onEnterChamp}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              letterSpacing: '0.08em',
              color: '#003D2C',
              opacity: 0.4,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 12px',
              textDecoration: 'underline',
              textUnderlineOffset: 2
            }}
          >
            Le Champ
          </button>
        )}
      </div>

      {/* Seal modal — same logic as former Fade panel; optional, discreet */}
      {sealOpen && (
        <div
          role="dialog"
          aria-label="Seal a moment"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: 24
          }}
          onClick={() => {
            setSealOpen(false);
            setSealContent('');
            setSealSaved(false);
          }}
        >
          <div
            style={{
              background: '#FAF8F2',
              border: '1px solid rgba(0, 61, 44, 0.15)',
              borderRadius: 4,
              padding: 32,
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                fontWeight: 400,
                color: '#1A1A1A',
                marginBottom: 12
              }}
            >
              Seal a moment
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                color: '#003D2C',
                opacity: 0.7,
                lineHeight: 1.5,
                marginBottom: 12
              }}
            >
              Some moments can be sealed. This is optional.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 13,
                fontStyle: 'italic',
                color: '#003D2C',
                opacity: 0.6,
                marginBottom: 16
              }}
            >
              {getReflectiveQuestion()}
            </p>
            <textarea
              value={sealContent}
              onChange={(e) => setSealContent(e.target.value)}
              placeholder="What did you notice?"
              rows={4}
              disabled={sealSaved}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: 12,
                marginBottom: 20,
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                color: '#1A1A1A',
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(0, 61, 44, 0.2)',
                borderRadius: 0,
                resize: 'vertical',
                minHeight: 80
              }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setSealOpen(false);
                  setSealContent('');
                  setSealSaved(false);
                }}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#003D2C',
                  opacity: 0.7,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 16px'
                }}
              >
                Not now
              </button>
              <button
                type="button"
                disabled={sealSaved || !sealContent.trim()}
                onClick={async () => {
                  if (!cardId || !sealContent.trim()) return;
                  await appendAuraSealToJournal(cardId, sealContent.trim());
                  await sealingStub.seal({
                    kind: 'card_activated',
                    id: `fade-${Date.now()}`,
                    cardId: cardId ?? undefined,
                    completedAt: new Date().toISOString()
                  });
                  setSealSaved(true);
                  setTimeout(() => {
                    setSealOpen(false);
                    setSealContent('');
                    setSealSaved(false);
                  }, 1200);
                }}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: sealSaved ? '#003D2C' : '#003D2C',
                  background: sealSaved ? 'transparent' : 'transparent',
                  border: '0.5px solid rgba(0, 61, 44, 0.3)',
                  cursor: sealSaved || !sealContent.trim() ? 'default' : 'pointer',
                  padding: '8px 16px',
                  opacity: sealSaved || sealContent.trim() ? 1 : 0.5
                }}
              >
                {sealSaved ? 'Saved to Carnet' : 'Seal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
