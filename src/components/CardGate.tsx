import { useState, useEffect, useRef } from 'react';
import { CardActivation } from './CardActivation';
import { CardLogin } from './CardLogin';

interface CardGateProps {
  cardCode: string;
  onAuthenticated: (cardData: { id: string; code: string; activated_at: string; password?: string }) => void;
  onBack?: () => void;
}

type CardState = 'loading' | 'not_found' | 'needs_activation' | 'needs_login';

export function CardGate({ cardCode, onAuthenticated, onBack }: CardGateProps) {
  const [cardState, setCardState] = useState<CardState>('loading');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Abort previous request if cardCode changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    checkCardStatus();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cardCode]);

  const checkCardStatus = async () => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!projectId || !anonKey) {
        console.error('[CardGate] Missing environment variables:', { projectId: !!projectId, anonKey: !!anonKey });
        setError('Configuration manquante. Vérifiez les variables d\'environnement.');
        setCardState('not_found');
        return;
      }

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-9060b10a/check-card`;
      console.log('[CardGate] Checking card:', cardCode, 'URL:', url);

      // Normalize card code (trim whitespace, uppercase)
      const normalizedCode = cardCode.trim().toUpperCase();
      console.log('[CardGate] Normalized code:', normalizedCode);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`
        },
        credentials: 'include', // For cookie-based sessions
        body: JSON.stringify({ code: normalizedCode }),
        signal: abortControllerRef.current?.signal
      });

      console.log('[CardGate] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CardGate] Response error:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Erreur serveur (${response.status})`);
        } catch {
          throw new Error(`Erreur réseau (${response.status}): ${errorText.slice(0, 100)}`);
        }
      }

      const data = await response.json();
      console.log('[CardGate] Response data:', data);

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la vérification de la carte');
      }

      const { card } = data;

      if (!card.exists) {
        console.error('[CardGate] Card not found:', normalizedCode, 'Response:', data);
        setCardState('not_found');
        setError(`Code ${normalizedCode} non reconnu`);
        return;
      }

      if (!card.is_activated) {
        setCardState('needs_activation');
      } else {
        setCardState('needs_login');
      }

    } catch (err: any) {
      // Handle abort silently
      if (err.name === 'AbortError') {
        console.log('[CardGate] Request aborted');
        return;
      }

      console.error('[CardGate] Error checking card status:', err);

      // Better error messages for network/CORS issues
      const msg = err.message || '';
      if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('Load failed')) {
        setError('Connexion impossible. Vérifiez votre réseau et réessayez.');
      } else if (msg.includes('CORS') || msg.includes('Origin')) {
        setError('Erreur de connexion. Vérifiez l\'URL ou contactez le support.');
      } else {
        setError(msg || 'Erreur lors de la vérification de la carte');
      }
      setCardState('not_found');
    }
  };

  const preLoginLayout = {
    minHeight: '100dvh',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
    boxSizing: 'border-box' as const,
    background: '#FAF8F2',
    width: '100%'
  };
  const preLoginInner = { width: '100%', maxWidth: 400, margin: '0 auto', textAlign: 'center' as const };

  // Loading state
  if (cardState === 'loading') {
    return (
      <div className="min-h-screen" style={preLoginLayout}>
        <div style={preLoginInner}>
          <div 
            style={{
              width: '60px',
              height: '60px',
              border: '3px solid #E7E1D8',
              borderTop: '3px solid #003D2C',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 24px'
            }}
          />
          <p 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '16px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.6
            }}
          >
            Vérification de la carte...
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

  // Card not found
  if (cardState === 'not_found') {
    return (
      <div className="min-h-screen" style={preLoginLayout}>
        <div style={{ ...preLoginInner, maxWidth: 480 }}>
          <h2 style={{ marginBottom: 'var(--space-md)', color: '#DC2626' }}>
            Carte introuvable
          </h2>
          <p style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: '17px', 
            fontStyle: 'italic', 
            lineHeight: '1.7',
            marginBottom: 'var(--space-lg)',
            opacity: 0.8
          }}>
            Le code <strong>{cardCode}</strong> ne correspond à aucune carte ARCHÉ.
          </p>
          {error && (
            <p style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: '15px', 
              color: '#DC2626',
              marginBottom: 'var(--space-lg)'
            }}>
              {error}
            </p>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="transition-all"
              style={{
                background: 'var(--green)',
                color: 'var(--paper)',
                padding: '16px 32px',
                borderRadius: '2px',
                fontFamily: 'var(--font-serif)',
                fontSize: '15px'
              }}
            >
              Retour
            </button>
          )}
        </div>
      </div>
    );
  }

  // Card needs activation
  if (cardState === 'needs_activation') {
    return (
      <CardActivation 
        cardCode={cardCode} 
        onActivated={onAuthenticated}
        onBack={onBack}
      />
    );
  }

  // Card needs login
  if (cardState === 'needs_login') {
    return (
      <CardLogin 
        cardCode={cardCode} 
        onLoggedIn={onAuthenticated}
        onBack={onBack}
      />
    );
  }

  return null;
}