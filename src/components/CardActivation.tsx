import { useState, useRef, useEffect } from 'react';
import { GeometricBackground } from './GeometricBackground';

interface CardActivationProps {
  cardCode: string;
  onActivated: (cardData: { id: string; code: string; activated_at: string; password?: string }) => void;
  onBack?: () => void;
}

export function CardActivation({ cardCode, onActivated, onBack }: CardActivationProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleActivate = async () => {
    // Validation
    if (!password || password.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    // Prevent double submission
    if (isSubmitting) return;

    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsSubmitting(true);
    setError(null);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!projectId || !anonKey) {
        throw new Error('Configuration manquante. Vérifiez les variables d\'environnement.');
      }

      const baseUrl = import.meta.env.PROD
        ? '/api/card-auth'
        : `https://${projectId}.supabase.co/functions/v1/make-server-9060b10a`;
      const url = `${baseUrl}/activate-card`;
      console.log('[CardActivation] Activating card:', cardCode, 'URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`
        },
        body: JSON.stringify({
          code: cardCode,
          password
        }),
        signal: abortControllerRef.current?.signal
      });

      console.log('[CardActivation] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CardActivation] Response error:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Erreur serveur (${response.status})`);
        } catch {
          throw new Error(`Erreur réseau (${response.status}): ${errorText.slice(0, 100)}`);
        }
      }

      const data = await response.json();
      console.log('[CardActivation] Response data:', data);

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de l\'activation');
      }

      console.log('[CardActivation] Card activated successfully:', data.card);
      
      // Appeler onActivated avec les données de la carte + password
      onActivated({ ...data.card, password });

    } catch (err: any) {
      // Handle abort silently (user cancelled or component unmounted)
      if (err.name === 'AbortError') {
        console.log('[CardActivation] Request aborted');
        return;
      }

      console.error('[CardActivation] Activation error:', err);

      // Better error messages for network/CORS issues
      const msg = err.message || '';
      if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('Load failed')) {
        setError('Connexion impossible. Vérifiez votre réseau ou réessayez.');
      } else if (msg.includes('CORS') || msg.includes('Origin')) {
        setError('Erreur de configuration. Contactez le support.');
      } else {
        setError(msg || 'Erreur lors de l\'activation de la carte');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = password.length >= 4 && password === confirmPassword && !isSubmitting;

  const preLoginLayout = {
    minHeight: '100dvh',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    background: 'var(--paper)',
    position: 'relative' as const,
    padding: '0 max(24px, env(safe-area-inset-left, 0px))',
    paddingRight: 'max(24px, env(safe-area-inset-right, 0px))',
    paddingTop: 'env(safe-area-inset-top, 0px)',
    paddingBottom: 'max(24px, env(safe-area-inset-bottom, 0px))',
    boxSizing: 'border-box' as const,
    width: '100%'
  };

  return (
    <div className="min-h-screen flex flex-col" style={preLoginLayout}>
      <GeometricBackground composition="results" opacity={0.03} />

      {/* Header */}
      <div style={{ padding: 'max(32px, env(safe-area-inset-top, 0px)) 0 16px', position: 'relative', zIndex: 10, flexShrink: 0 }}>
        {onBack && (
          <button
            onClick={onBack}
            className="transition-opacity small-caps"
            style={{
              background: 'transparent',
              opacity: 0.5,
              transition: 'opacity var(--transition)',
              minHeight: '44px', // Touch target
              minWidth: '44px',
              padding: '12px 16px',
              marginLeft: '-16px' // Offset padding for visual alignment
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
          >
            ‹ Retour
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center" style={{ padding: '0 0 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 480, width: '100%', margin: '0 auto' }}>
          {/* Card Code Display */}
          <div 
            style={{
              textAlign: 'center',
              marginBottom: 'var(--space-xl)',
              paddingBottom: 'var(--space-lg)',
              borderBottom: `var(--border-thin) solid var(--grey-light)`
            }}
          >
            <p 
              className="small-caps" 
              style={{ 
                color: 'var(--gold)', 
                marginBottom: 'var(--space-sm)',
                opacity: 1
              }}
            >
              Activation de votre carte
            </p>
            <h1 style={{ 
              fontFamily: 'var(--font-sans)',
              fontSize: '32px',
              fontWeight: '600',
              letterSpacing: '0.15em',
              color: 'var(--green)'
            }}>
              {cardCode}
            </h1>
          </div>

          {/* Intro Text */}
          <p 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '17px',
              fontStyle: 'italic',
              lineHeight: '1.7',
              textAlign: 'center',
              marginBottom: 'var(--space-xl)',
              opacity: 0.8
            }}
          >
            Cette carte n'a jamais été ouverte.
            <br />
            Choisissez un mot de passe pour la protéger.
          </p>

          {/* Password Input */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label
              className="small-caps"
              style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                opacity: 1,
                color: 'var(--ink)'
              }}
            >
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 4 caractères"
              autoComplete="new-password"
              style={{
                width: '100%',
                background: 'transparent',
                border: '0.5px solid var(--grey-light)',
                borderRadius: '2px',
                padding: 'var(--space-md)',
                minHeight: '48px', // Touch target
                fontFamily: 'var(--font-serif)',
                fontSize: '17px', // Prevents iOS zoom
                fontWeight: '300',
                color: 'var(--ink)'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSubmit) {
                  handleActivate();
                }
              }}
            />
          </div>

          {/* Confirm Password Input */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label
              className="small-caps"
              style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                opacity: 1,
                color: 'var(--ink)'
              }}
            >
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Saisissez à nouveau"
              autoComplete="new-password"
              style={{
                width: '100%',
                background: 'transparent',
                border: '0.5px solid var(--grey-light)',
                borderRadius: '2px',
                padding: 'var(--space-md)',
                minHeight: '48px', // Touch target
                fontFamily: 'var(--font-serif)',
                fontSize: '17px', // Prevents iOS zoom
                fontWeight: '300',
                color: 'var(--ink)'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSubmit) {
                  handleActivate();
                }
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div 
              style={{
                background: 'rgba(220, 38, 38, 0.08)',
                border: '0.5px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '2px',
                padding: 'var(--space-md)',
                marginBottom: 'var(--space-lg)',
                fontFamily: 'var(--font-serif)',
                fontSize: '15px',
                fontStyle: 'italic',
                color: '#DC2626',
                textAlign: 'center'
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleActivate}
            disabled={!canSubmit}
            className="w-full transition-all"
            style={{
              background: canSubmit ? 'var(--green)' : 'var(--grey-light)',
              color: 'var(--paper)',
              padding: '20px 40px',
              minHeight: '56px', // Touch target (larger for primary action)
              borderRadius: '2px',
              fontFamily: 'var(--font-serif)',
              fontSize: '16px',
              fontWeight: '400',
              transition: 'all var(--transition)',
              opacity: canSubmit ? '1' : '0.5',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? 'inset 0 -1px 0 rgba(0,0,0,0.1)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (canSubmit) {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (canSubmit) {
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isSubmitting ? 'Activation en cours...' : 'Activer ma carte'}
          </button>

          {/* Warning */}
          <p 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '13px',
              fontStyle: 'italic',
              lineHeight: '1.6',
              textAlign: 'center',
              marginTop: 'var(--space-lg)',
              opacity: 0.5,
              color: 'var(--ink)'
            }}
          >
            Conservez précieusement ce mot de passe.
            <br />
            En cas d'oubli, la carte ne pourra plus être déverrouillée.
          </p>
        </div>
      </div>
    </div>
  );
}
