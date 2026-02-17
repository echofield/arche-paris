/**
 * ARCHÉ — Aura page
 * Calm, breathing space. Phenomenological mirror.
 * Shows AURA profile from church quests (status, seals) when available.
 */

import { useState, useEffect } from 'react';
import { ArcheSymbol } from './ArcheSymbol';
import { BackButton } from './BackButton';
import { MiroirSurface } from './MiroirSurface';
import { loadCompanion } from '../utils/companion-service';
import { getCompanionWord, getReflectiveQuestion, getAuraInterpretation } from '../data/oracle';
import { sealingStub } from '../utils/sealing-stub';
import { appendAuraSealToJournal } from '../utils/journal-sync';
import { getAuraProfile, type AuraProfileResult } from '../utils/card-gate-client';
import { useTranslation } from '../utils/i18n';
import { api, type ZoneProgressData } from '../lib/api';

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
  const state = loadCompanion();
  const level = (state.level ?? 0) as 0 | 1 | 2 | 3;
  const word = getCompanionWord(level);

  // Load ARCHÉ zone progress
  useEffect(() => {
    api.zoneProgress().then(result => {
      if (result.data) {
        setZoneProgress(result.data);
      }
    }).catch(() => {});
  }, []);

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

      {/* ARCHÉ State Dashboard */}
      {zoneProgress && (
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
          {/* Complexion (Presence / Wisdom / Shadow) - No raw numbers */}
          {(() => {
            const { presence_points, wisdom_points, shadow_points } = zoneProgress.complexion;
            const total = presence_points + wisdom_points + shadow_points;

            // Determine dominant axis
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

            // Calculate proportions for rings (without showing actual numbers)
            const maxPoints = Math.max(presence_points, wisdom_points, shadow_points, 1);
            const presencePct = (presence_points / maxPoints) * 100;
            const wisdomPct = (wisdom_points / maxPoints) * 100;
            const shadowPct = (shadow_points / maxPoints) * 100;

            return (
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#003D2C',
                    opacity: 0.5,
                    marginBottom: 12,
                  }}
                >
                  Complexion
                </p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                  {/* Presence */}
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: `conic-gradient(#007850 ${presencePct}%, rgba(0,120,80,0.15) 0%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px',
                        opacity: dominant === 'presence' ? 1 : 0.6,
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#FAF8F2',
                        }}
                      />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 9,
                      color: '#6B6455',
                      fontWeight: dominant === 'presence' ? 600 : 400,
                    }}>Présence</span>
                  </div>
                  {/* Wisdom */}
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: `conic-gradient(#003D2C ${wisdomPct}%, rgba(0,61,44,0.15) 0%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px',
                        opacity: dominant === 'wisdom' ? 1 : 0.6,
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#FAF8F2',
                        }}
                      />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 9,
                      color: '#6B6455',
                      fontWeight: dominant === 'wisdom' ? 600 : 400,
                    }}>Sagesse</span>
                  </div>
                  {/* Shadow */}
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: `conic-gradient(#1A1A1A ${shadowPct}%, rgba(26,26,26,0.15) 0%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 6px',
                        opacity: dominant === 'shadow' ? 1 : 0.6,
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#FAF8F2',
                        }}
                      />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 9,
                      color: '#6B6455',
                      fontWeight: dominant === 'shadow' ? 600 : 400,
                    }}>Ombre</span>
                  </div>
                </div>
                {/* Poetic interpretation based on dominant */}
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

          {/* Zone Progress Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              paddingTop: 16,
              borderTop: '1px solid rgba(0, 61, 44, 0.08)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#003D2C', fontWeight: 500 }}>
                {zoneProgress.stats.zones_complete}
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#6B6455', opacity: 0.7 }}>
                Zones maîtrisées
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#003D2C', fontWeight: 500 }}>
                {zoneProgress.stats.total_rituals}
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#6B6455', opacity: 0.7 }}>
                Rituels
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#003D2C', fontWeight: 500 }}>
                {zoneProgress.stats.total_engravings}
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#6B6455', opacity: 0.7 }}>
                Gravures
              </div>
            </div>
          </div>

          {/* Revealed status */}
          {zoneProgress.complexion.revealed && (
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
