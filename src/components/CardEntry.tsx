/**
 * ARCHÉ — Card Entry Screen
 *
 * Shown when:
 * - No card in URL or localStorage
 * - Card is being validated
 * - Card is invalid
 *
 * Minimal, elegant, on-brand.
 */

import { useState } from 'react';
import { MamlukGrid } from './MamlukGrid';
import type { CardStatus } from '../utils/card-service';

interface CardEntryProps {
  status: 'loading' | 'no_card' | 'validating' | 'invalid' | 'welcome';
  cardStatus?: CardStatus;
  onManualEntry?: (code: string) => void;
  onContinue?: () => void;
}

export function CardEntry({ status, cardStatus, onManualEntry, onContinue }: CardEntryProps) {
  const [manualCode, setManualCode] = useState('');

  const preLoginLayout = {
    minHeight: '100dvh',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
    boxSizing: 'border-box' as const,
    background: '#FAF8F2',
    width: '100%',
    position: 'relative' as const
  };
  const preLoginInner = { width: '100%', maxWidth: 400, margin: '0 auto', textAlign: 'center' as const, position: 'relative' as const, zIndex: 10 };

  // Loading state
  if (status === 'loading' || status === 'validating') {
    return (
      <div className="min-h-screen" style={preLoginLayout}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={1} />
        </div>
        <div style={preLoginInner}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '2px solid #E7E1D8',
              borderTop: '2px solid #003D2C',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto var(--space-lg)'
            }}
          />
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '16px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.5
            }}
          >
            {status === 'validating' ? 'Activation en cours...' : 'Chargement...'}
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Welcome state (card validated, brief welcome message)
  if (status === 'welcome' && cardStatus) {
    return (
      <div className="min-h-screen" style={preLoginLayout}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={1} />
        </div>
        <div style={preLoginInner}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '48px',
              fontWeight: '400',
              color: '#1A1A1A',
              marginBottom: 'var(--space-md)',
              letterSpacing: '0.05em'
            }}
          >
            ARCHÉ
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '18px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.7,
              marginBottom: 'var(--space-xl)',
              lineHeight: '1.6'
            }}
          >
            {cardStatus.message}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: '#1A1A1A',
              opacity: 0.3,
              marginTop: 'var(--space-xl)'
            }}
          >
            CARTE {cardStatus.cardId}
          </p>
        </div>
      </div>
    );
  }

  // No card or invalid card - show manual entry
  return (
    <div className="min-h-screen" style={preLoginLayout}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={1} />
      </div>
      <div style={preLoginInner}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '48px',
            fontWeight: '400',
            color: '#1A1A1A',
            marginBottom: 'var(--space-md)',
            letterSpacing: '0.05em'
          }}
        >
          ARCHÉ
        </h1>

        {status === 'invalid' ? (
          <>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '16px',
                color: '#DC2626',
                marginBottom: '12px',
                lineHeight: '1.6'
              }}
            >
              {cardStatus?.message || 'Carte non reconnue.'}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                color: '#1A1A1A',
                opacity: 0.65,
                marginBottom: 'var(--space-lg)',
                lineHeight: '1.5'
              }}
            >
              Si le réseau est instable, réessayez dans quelques secondes.
            </p>
          </>
        ) : (
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '18px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.7,
              marginBottom: 'var(--space-xl)',
              lineHeight: '1.6'
            }}
          >
            Scannez votre carte ARCHÉ<br />ou entrez le code ci-dessous.
          </p>
        )}

        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="PS-0001"
            style={{
              width: '100%',
              maxWidth: '200px',
              padding: '14px 20px',
              border: '1px solid #DBD4C6',
              background: '#FFFFFF',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              letterSpacing: '0.1em',
              textAlign: 'center',
              color: '#1A1A1A',
              outline: 'none'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualCode.trim() && onManualEntry) {
                onManualEntry(manualCode.trim());
              }
            }}
          />
        </div>

        <button
          onClick={() => manualCode.trim() && onManualEntry && onManualEntry(manualCode.trim())}
          disabled={!manualCode.trim()}
          style={{
            background: manualCode.trim() ? '#003D2C' : '#E7E1D8',
            color: manualCode.trim() ? '#FAF8F2' : '#999',
            border: 'none',
            padding: '16px 40px',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease'
          }}
        >
          Activer ma carte
        </button>

        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '13px',
            fontStyle: 'italic',
            color: '#1A1A1A',
            opacity: 0.4,
            marginTop: 'var(--space-xxl)',
            lineHeight: '1.6'
          }}
        >
          Pas de carte ? Procurez-vous une carte ARCHÉ<br />pour découvrir Paris autrement.
        </p>
      </div>
    </div>
  );
}
