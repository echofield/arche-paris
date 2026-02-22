/**
 * ARCHÉ — Meridian Quest (Archetype)
 *
 * The core gameplay experience that defines ARCHÉ.
 * GPS vs Perception conflict. Interpretive choices. Silent Aura modification.
 * Presence Protocol: phase transitions and trust gated by verify(); no raw meters in production.
 */

import { useState, useEffect, useRef } from 'react';
import { BackButton } from './BackButton';
import { DecisionNode, type DecisionOption } from './DecisionNode';
import { usePerceptionState } from '../hooks/usePerceptionState';
import { usePresence } from '../hooks/usePresence';
import { useWhisper } from '../contexts/WhisperContext';
import { getDecisionWhisper } from '../data/oracle';
import { useTranslation } from '../utils/i18n';
import { isGradeSufficientForSoftConfirmation } from '../utils/meridien-presence-gate';
import { MERIDIAN_LNG } from '../utils/meridien-geo';

const MERIDIAN_ZONE_ID = 'MERIDIAN_LINE';
const MERIDIAN_VERIFY_COOLDOWN_MS = 30000;

type QuestPhase =
  | 'intro'
  | 'approaching'
  | 'perception_prompt'
  | 'conflict_decision'
  | 'continuation'
  | 'ending';

interface MeridianQuestProps {
  onBack: () => void;
  onComplete?: () => void;
}

export function MeridianQuest({ onBack, onComplete }: MeridianQuestProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<QuestPhase>('intro');
  const [lastDecisionDelta, setLastDecisionDelta] = useState<{
    d_presence: number;
    d_wisdom: number;
    d_shadow: number;
  } | null>(null);

  const perception = usePerceptionState();
  const { show: showWhisper } = useWhisper();
  const {
    grade: presenceGrade,
    readyToVerify,
    verify: presenceVerify,
    lastResponse: lastVerifyResponse,
  } = usePresence({ durationMs: 8000, intervalMs: 750 });
  const lastVerifyTsRef = useRef<number>(0);

  // Track if we've shown the conflict decision
  const [conflictResolved, setConflictResolved] = useState(false);

  // Move to approaching phase after intro
  useEffect(() => {
    if (phase === 'intro') {
      const timer = setTimeout(() => setPhase('approaching'), 3000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Presence-gated: only transition to perception_prompt when near meridian AND verify grade >= MED (once per approaching)
  const hasTriedVerifyForApproachingRef = useRef(false);
  useEffect(() => {
    if (phase !== 'approaching' || !perception.isNearMeridian || !readyToVerify) return;
    if (hasTriedVerifyForApproachingRef.current) return;
    const inHeuristicWindow =
      perception.gps != null && Math.abs(perception.gps.lng - MERIDIAN_LNG) * 73000 < 150;
    const now = Date.now();
    if (!inHeuristicWindow && now - lastVerifyTsRef.current < MERIDIAN_VERIFY_COOLDOWN_MS) return;

    hasTriedVerifyForApproachingRef.current = true;
    let cancelled = false;
    presenceVerify(MERIDIAN_ZONE_ID).then((res) => {
      if (cancelled) return;
      lastVerifyTsRef.current = Date.now();
      const grade = res?.grade ?? presenceGrade;
      if (isGradeSufficientForSoftConfirmation(grade)) {
        setPhase('perception_prompt');
      }
    });
    return () => { cancelled = true; };
  }, [phase, perception.isNearMeridian, perception.gps, readyToVerify, presenceVerify, presenceGrade]);
  useEffect(() => {
    if (phase !== 'approaching') hasTriedVerifyForApproachingRef.current = false;
  }, [phase]);

  // After perception is set, check for conflict
  useEffect(() => {
    if (phase === 'perception_prompt' && perception.conflict?.inConflict && !conflictResolved) {
      setPhase('conflict_decision');
    }
  }, [phase, perception.conflict, conflictResolved]);

  // Handle decision completion with delayed whisper
  const handleDecision = (optionId: string, delta: { d_presence: number; d_wisdom: number; d_shadow: number }) => {
    setLastDecisionDelta(delta);

    // Show whisper after brief pause (creates sense of reflection)
    setTimeout(() => {
      showWhisper(getDecisionWhisper(delta), 6000);
    }, 800);

    if (phase === 'conflict_decision') {
      setConflictResolved(true);
      perception.resolveConflict();

      // Move to continuation after whisper fades
      setTimeout(() => setPhase('continuation'), 4000);
    } else if (phase === 'continuation') {
      // Move to ending
      setTimeout(() => setPhase('ending'), 4000);
    }
  };

  // Ending sequence
  useEffect(() => {
    if (phase === 'ending') {
      // First whisper
      showWhisper('The meridian has noted your passage.', 4000);

      // Second whisper
      setTimeout(() => {
        showWhisper('You will be called when the next layer opens.', 5000);
      }, 5000);

      // Navigate away silently
      setTimeout(() => {
        onComplete?.();
      }, 11000);
    }
  }, [phase, showWhisper, onComplete]);

  // Perception prompt options
  const handlePerceptionChoice = (choice: 'close' | 'medium' | 'far') => {
    const distanceMap = { close: 5, medium: 25, far: 60 };
    const confidenceMap = { close: 'high', medium: 'medium', far: 'low' } as const;

    perception.setPerceivedDistance(distanceMap[choice], confidenceMap[choice]);

    // If no conflict emerges, move to continuation
    setTimeout(() => {
      if (phase === 'perception_prompt') {
        setPhase('continuation');
      }
    }, 1500);
  };

  // Trust decision options (the core Méchain choice)
  const trustDecisionOptions: DecisionOption[] = [
    {
      id: 'trust_instrument',
      label: 'Trust the instrument',
      d_presence: 2,
      d_wisdom: 0,
      d_shadow: 0,
    },
    {
      id: 'trust_observation',
      label: 'Trust your observation',
      d_presence: 0,
      d_wisdom: 0,
      d_shadow: 2,
    },
    {
      id: 'hold_both',
      label: 'Hold both truths',
      d_presence: 0,
      d_wisdom: 2,
      d_shadow: 0,
    },
  ];

  // Continuation decision (after conflict or if no conflict)
  const continuationOptions: DecisionOption[] = [
    {
      id: 'follow_line',
      label: 'Follow the line north',
      d_presence: 1,
      d_wisdom: 0,
      d_shadow: 0,
    },
    {
      id: 'deviate',
      label: 'Step away from the axis',
      d_presence: 0,
      d_wisdom: 0,
      d_shadow: 1,
    },
    {
      id: 'observe',
      label: 'Remain and observe',
      d_presence: 0,
      d_wisdom: 1,
      d_shadow: 0,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'var(--paper, #FAF8F2)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <BackButton onClick={onBack} />

      {/* Intro phase */}
      {phase === 'intro' && (
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(16px, 3vw, 19px)',
              fontStyle: 'italic',
              color: '#1A1A1A',
              lineHeight: 1.7,
              opacity: 0.8,
            }}
          >
            The line runs through the city.
            <br />
            <br />
            Find it.
          </p>
        </div>
      )}

      {/* Approaching phase */}
      {phase === 'approaching' && (
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(14px, 2.5vw, 16px)',
              fontStyle: 'italic',
              color: '#1A1A1A',
              lineHeight: 1.7,
              opacity: 0.7,
              marginBottom: 24,
            }}
          >
            Walk toward the meridian.
          </p>

          {/* GPS status — no meters/coords in production */}
          {perception.gps ? (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                color: '#007850',
                opacity: 0.6,
                marginBottom: 16,
              }}
            >
              {import.meta.env.DEV && import.meta.env.VITE_DEBUG_TERRITORY && perception.instrumentDistanceM != null
                ? `${Math.round(perception.instrumentDistanceM)}m from the axis`
                : t('presence.signalSettling')}
            </p>
          ) : (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                color: '#B43232',
                opacity: 0.7,
                marginBottom: 16,
              }}
            >
              {t('presence.signalWeak')}
            </p>
          )}

          {/* Dev skip button for testing */}
          {process.env.NODE_ENV === 'development' && (
            <button
              type="button"
              onClick={() => setPhase('perception_prompt')}
              style={{
                marginTop: 32,
                padding: '8px 16px',
                fontSize: 10,
                opacity: 0.3,
                background: 'transparent',
                border: '1px dashed #999',
                cursor: 'pointer',
              }}
            >
              [dev: skip to perception]
            </button>
          )}
        </div>
      )}

      {/* Perception prompt phase */}
      {phase === 'perception_prompt' && (
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(16px, 3vw, 19px)',
              fontStyle: 'italic',
              color: '#1A1A1A',
              lineHeight: 1.7,
              opacity: 0.8,
              marginBottom: 8,
            }}
          >
            Look around you.
          </p>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(13px, 2.5vw, 15px)',
              fontStyle: 'italic',
              color: '#6B6455',
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            How close is the meridian marker?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { id: 'close', label: 'Within arm\'s reach' },
              { id: 'medium', label: 'A few steps away' },
              { id: 'far', label: 'I cannot see it clearly' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handlePerceptionChoice(option.id as 'close' | 'medium' | 'far')}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: '#003D2C',
                  background: 'rgba(0, 61, 44, 0.03)',
                  border: '1px solid rgba(0, 61, 44, 0.15)',
                  borderRadius: 4,
                  padding: '14px 20px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conflict decision phase */}
      {phase === 'conflict_decision' && (
        <DecisionNode
          nodeId="meridian_trust"
          prompt="The instrument says you stand on the axis."
          subPrompt="Your eyes see the marker elsewhere."
          options={trustDecisionOptions}
          gps={import.meta.env.PROD ? undefined : (perception.gps ?? undefined)}
          onDecision={(optionId) => {
            const option = trustDecisionOptions.find((o) => o.id === optionId);
            if (option) {
              handleDecision(optionId, {
                d_presence: option.d_presence ?? 0,
                d_wisdom: option.d_wisdom ?? 0,
                d_shadow: option.d_shadow ?? 0,
              });
            }
          }}
        />
      )}

      {/* Continuation phase */}
      {phase === 'continuation' && (
        <DecisionNode
          nodeId="meridian_continue"
          prompt="The axis stretches north and south."
          subPrompt="What do you do?"
          options={continuationOptions}
          gps={import.meta.env.PROD ? undefined : (perception.gps ?? undefined)}
          onDecision={(optionId) => {
            const option = continuationOptions.find((o) => o.id === optionId);
            if (option) {
              handleDecision(optionId, {
                d_presence: option.d_presence ?? 0,
                d_wisdom: option.d_wisdom ?? 0,
                d_shadow: option.d_shadow ?? 0,
              });
            }
          }}
        />
      )}

      {/* Ending phase - just whispers, no visible UI */}
      {phase === 'ending' && (
        <div style={{ opacity: 0.3 }}>
          {/* Empty - whispers handle the transition */}
        </div>
      )}
    </div>
  );
}
