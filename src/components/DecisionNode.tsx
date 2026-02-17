/**
 * ARCHE Decision Node
 *
 * Presents interpretive choices, not correct/incorrect answers.
 * Silently modifies Aura based on chosen option.
 * No immediate feedback on the delta values.
 */

import { useState } from 'react';
import { api, generateIdempotencyKey, clientTs } from '../lib/api';

export interface DecisionOption {
  id: string;
  label: string;
  /** Aura deltas (hidden from player) */
  d_presence?: number;
  d_wisdom?: number;
  d_shadow?: number;
}

export interface DecisionNodeProps {
  nodeId: string;
  /** 1-2 line poetic prompt */
  prompt: string;
  /** Optional sub-prompt (smaller, faded) */
  subPrompt?: string;
  /** 2-3 interpretive options */
  options: DecisionOption[];
  /** Current zone ID for event context */
  zoneId?: string;
  /** GPS data for event context */
  gps?: { lat: number; lng: number; accuracy_m: number };
  /** Called after choice is made (with option id) */
  onDecision?: (optionId: string) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

export function DecisionNode({
  nodeId,
  prompt,
  subPrompt,
  options,
  zoneId,
  gps,
  onDecision,
  onError,
}: DecisionNodeProps) {
  const [selecting, setSelecting] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);

  const handleChoice = async (option: DecisionOption) => {
    if (chosen) return; // Already decided
    setSelecting(option.id);

    try {
      const result = await api.decisionMade({
        zone_id: zoneId,
        node_id: nodeId,
        choice: option.id,
        d_presence: option.d_presence ?? 0,
        d_wisdom: option.d_wisdom ?? 0,
        d_shadow: option.d_shadow ?? 0,
        lat: gps?.lat,
        lng: gps?.lng,
        accuracy_m: gps?.accuracy_m,
        client_ts: clientTs(),
        idempotency_key: generateIdempotencyKey(`decision:${nodeId}`),
      });

      if (result.error) {
        console.error('[DecisionNode] API error:', result.error);
        onError?.(result.error);
        setSelecting(null);
        return;
      }

      // Mark as chosen, notify parent
      setChosen(option.id);
      onDecision?.(option.id);
    } catch (err) {
      console.error('[DecisionNode] Error:', err);
      onError?.(err instanceof Error ? err.message : 'Unknown error');
      setSelecting(null);
    }
  };

  // After choice is made, fade out completely
  if (chosen) {
    return (
      <div
        style={{
          opacity: 0,
          transition: 'opacity 1.5s ease-out',
          pointerEvents: 'none',
        }}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        padding: '32px 24px',
        maxWidth: 400,
        margin: '0 auto',
      }}
    >
      {/* Poetic prompt */}
      <p
        style={{
          fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
          fontSize: 'clamp(16px, 3vw, 19px)',
          fontStyle: 'italic',
          color: '#1A1A1A',
          textAlign: 'center',
          lineHeight: 1.6,
          margin: 0,
          opacity: 0.85,
        }}
      >
        {prompt}
      </p>

      {/* Sub-prompt (optional) */}
      {subPrompt && (
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(13px, 2.5vw, 15px)',
            fontStyle: 'italic',
            color: '#6B6455',
            textAlign: 'center',
            lineHeight: 1.5,
            margin: 0,
            opacity: 0.6,
          }}
        >
          {subPrompt}
        </p>
      )}

      {/* Options */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: '100%',
          marginTop: 8,
        }}
      >
        {options.map((option) => {
          const isSelecting = selecting === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={selecting !== null}
              onClick={() => handleChoice(option)}
              style={{
                fontFamily: 'var(--font-sans, system-ui, sans-serif)',
                fontSize: 13,
                letterSpacing: '0.04em',
                color: '#003D2C',
                background: isSelecting
                  ? 'rgba(0, 61, 44, 0.08)'
                  : 'rgba(0, 61, 44, 0.03)',
                border: '1px solid rgba(0, 61, 44, 0.15)',
                borderRadius: 4,
                padding: '14px 20px',
                cursor: selecting ? 'default' : 'pointer',
                opacity: selecting && !isSelecting ? 0.4 : 1,
                transition: 'all 0.3s ease',
                textAlign: 'center',
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
