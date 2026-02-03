/**
 * ARCHÉ — Les Traces
 *
 * The sediment of memory.
 * Display traces from previous walkers.
 * Allow current walker to leave their mark.
 *
 * Aesthetic: Quiet, contemplative, like finding notes in old books.
 */

import { useState, useEffect } from 'react';
import {
  getTraces,
  leaveTrace,
  hasLeftTrace,
  formatCardId,
  formatTraceDate,
  type Trace
} from '../utils/traces-service';
import { getOfflineMessage } from '../utils/card-gate-client';
import { useSyncState, COMPRESSED_MESSAGE } from '../contexts/SyncStateContext';

interface TracesProps {
  cardId: string;
  questId: string;
  etapeId: string;
  etapeName?: string;
}

export function Traces({ cardId, questId, etapeId, etapeName }: TracesProps) {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [hasLeft, setHasLeft] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const { pendingCount, isSyncing, showCompressedMessage, flushNow } = useSyncState();

  // Load traces on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const [fetchedTraces, alreadyLeft] = await Promise.all([
        getTraces(cardId, questId, etapeId, 3),
        hasLeftTrace(cardId, questId, etapeId)
      ]);
      setTraces(fetchedTraces);
      setHasLeft(alreadyLeft);
      setIsLoading(false);
    }
    load();
  }, [cardId, questId, etapeId]);

  // Handle submission
  const handleSubmit = async () => {
    if (!inputValue.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    const result = await leaveTrace(cardId, questId, etapeId, inputValue);

    if (result.success) {
      setHasLeft(true);
      setShowInput(false);
      setSubmitMessage('Trace laissée.');
      // Add the new trace to display
      setTraces(prev => [...prev, {
        content: inputValue.trim(),
        card_id: cardId,
        created_at: new Date().toISOString()
      }]);
    } else {
      setSubmitMessage(result.message);
      // pendingCount updates via SyncState when CARD_GATE_OFFLINE
    }

    setIsSubmitting(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{ opacity: 0.4, fontStyle: 'italic', fontSize: '14px', padding: '20px 0' }}>
        ...
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 'var(--space-xl)',
        paddingTop: 'var(--space-lg)',
        borderTop: '1px solid rgba(0, 61, 44, 0.1)'
      }}
    >
      {/* Header */}
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '9px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#003D2C',
          opacity: 0.4,
          marginBottom: 'var(--space-md)'
        }}
      >
        Traces
      </p>

      {/* Offline: traces gardées, graveront au retour du réseau */}
      {pendingCount > 0 && (
        <div
          style={{
            marginBottom: 'var(--space-lg)',
            padding: '12px 16px',
            background: 'rgba(0, 61, 44, 0.06)',
            border: '1px solid rgba(0, 61, 44, 0.15)',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#003D2C',
          }}
        >
          <p style={{ margin: 0, marginBottom: '6px' }}>{getOfflineMessage()}</p>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '12px' }}>{pendingCount} en attente</p>
          {showCompressedMessage && (
            <p style={{ margin: 0, marginTop: '4px', fontSize: '11px', opacity: 0.8 }}>{COMPRESSED_MESSAGE}</p>
          )}
          <button
            type="button"
            disabled={isSyncing}
            onClick={() => {
              flushNow(cardId).then((sent) => {
                if (sent > 0) {
                  setHasLeft(true);
                  setShowInput(false);
                  getTraces(cardId, questId, etapeId, 3).then(setTraces);
                }
              });
            }}
            style={{
              marginTop: '8px',
              padding: '6px 12px',
              border: '1px solid rgba(0, 61, 44, 0.3)',
              borderRadius: '4px',
              background: 'transparent',
              color: '#003D2C',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              cursor: isSyncing ? 'wait' : 'pointer',
              opacity: isSyncing ? 0.7 : 1,
            }}
          >
            {isSyncing ? '…' : 'Réessayer'}
          </button>
        </div>
      )}

      {/* Display existing traces */}
      {traces.length > 0 && (
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          {traces.map((trace, index) => (
            <div
              key={index}
              style={{
                marginBottom: 'var(--space-md)',
                paddingLeft: 'var(--space-md)',
                borderLeft: '2px solid rgba(0, 61, 44, 0.08)'
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '15px',
                  fontStyle: 'italic',
                  color: '#1A1A1A',
                  lineHeight: '1.6',
                  marginBottom: '4px'
                }}
              >
                "{trace.content}"
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '10px',
                  color: '#1A1A1A',
                  opacity: 0.35
                }}
              >
                — {formatCardId(trace.card_id)}, {formatTraceDate(trace.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* No traces yet */}
      {traces.length === 0 && !hasLeft && (
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '14px',
            fontStyle: 'italic',
            color: '#1A1A1A',
            opacity: 0.4,
            marginBottom: 'var(--space-lg)'
          }}
        >
          Aucune trace ici. Soyez le premier.
        </p>
      )}

      {/* Leave trace section */}
      {!hasLeft && !showInput && (
        <button
          onClick={() => setShowInput(true)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(0, 61, 44, 0.2)',
            padding: '12px 20px',
            fontFamily: 'var(--font-serif)',
            fontSize: '13px',
            fontStyle: 'italic',
            color: '#003D2C',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            opacity: 0.7
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
            e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.2)';
          }}
        >
          Laisser une trace
        </button>
      )}

      {/* Input field */}
      {showInput && !hasLeft && (
        <div style={{ marginTop: 'var(--space-sm)' }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Une pensée, une image, un mot..."
            maxLength={140}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px 16px',
              border: '1px solid rgba(0, 61, 44, 0.2)',
              background: '#FFFFFF',
              fontFamily: 'var(--font-serif)',
              fontSize: '15px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              resize: 'none',
              outline: 'none',
              lineHeight: '1.6'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.4)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.2)';
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'var(--space-sm)'
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                color: '#1A1A1A',
                opacity: 0.3
              }}
            >
              {inputValue.length}/140
            </span>

            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button
                onClick={() => {
                  setShowInput(false);
                  setInputValue('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 16px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  color: '#1A1A1A',
                  opacity: 0.5,
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>

              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isSubmitting}
                style={{
                  background: inputValue.trim() ? '#003D2C' : '#E7E1D8',
                  color: inputValue.trim() ? '#FAF8F2' : '#999',
                  border: 'none',
                  padding: '8px 20px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSubmitting ? '...' : 'Laisser'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Already left trace */}
      {hasLeft && submitMessage && (
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '13px',
            fontStyle: 'italic',
            color: '#003D2C',
            opacity: 0.6,
            marginTop: 'var(--space-sm)'
          }}
        >
          {submitMessage}
        </p>
      )}

      {hasLeft && !submitMessage && (
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '13px',
            fontStyle: 'italic',
            color: '#1A1A1A',
            opacity: 0.4,
            marginTop: 'var(--space-sm)'
          }}
        >
          Vous avez laissé votre trace ici.
        </p>
      )}
    </div>
  );
}
