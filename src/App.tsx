import { useState, useEffect, Suspense, lazy } from 'react';
import { HomepageV1 } from './components/HomepageV1';
import { QuetesV1 } from './components/QuetesV1';
import { QueteDetail } from './components/QueteDetail';
import { OrigineMap } from './components/OrigineMap';
import { HistoireArchives } from './components/HistoireArchives';
import { CarnetParisien } from './components/CarnetParisien';
import { CollectionMap } from './components/CollectionMap';
import { PersonalMemoryMap } from './components/PersonalMemoryMap';
import { HunterMontmartre } from './components/HunterMontmartre';
import { QuestRun } from './components/QuestRun';
import { CultureQuiz } from './components/CultureQuiz';
import { CardEntry } from './components/CardEntry';
import { CardDrawer } from './components/CardDrawer';
import { ArcheSymbol } from './components/ArcheSymbol';
import { CompanionBlock } from './components/CompanionBlock';
import { ArcheInterface } from './components/ArcheInterface';
import { ChampScreen } from './components/ChampScreen';
import { KeptSentences } from './components/KeptSentences';
import { ZoneTestPanel } from './components/ZoneTestPanel';
import { MeridianQuest } from './components/MeridianQuest';
import { initializeCard, afterCardGateAuthenticated, unpairCard, forceUnpairCard, AlreadyPairedError, RateLimitError, type CardStatus } from './utils/card-service';
import { CardGate } from './components/CardGate';
import { decayIfNeeded } from './utils/companion-service';
import { recordAppOpen, shouldShowSilencePrompt, markSilencePromptShown } from './utils/silence-prompt';
import { runEchoIfNeeded, runMilestonesIfNeeded } from './utils/echo-milestone-runner';
import { LanguageProvider } from './utils/i18n';
import { LanguageSelector } from './components/LanguageSelector';
import { SyncStateProvider } from './contexts/SyncStateContext';
import { WhisperProvider, Whisper } from './contexts/WhisperContext';

type Screen = 'homepage' | 'origine' | 'quetes' | 'histoire' | 'detail' | 'questRun' | 'carnet' | 'collection' | 'seuil' | 'etudes' | 'aura' | 'meridiens' | 'champ' | 'kept' | 'zone-test' | 'meridian-quest';
type AppState = 'loading' | 'no_card' | 'validating' | 'invalid' | 'welcome' | 'ready';

const LazyMeridiensLive = lazy(() =>
  import('./components/MeridiensLive').then((mod) => ({ default: mod.MeridiensLive }))
);
const LazyEtudesHub = lazy(() =>
  import('./components/EtudesHub').then((mod) => ({ default: mod.EtudesHub }))
);

/**
 * APP V1 — ARCHÉ
 *
 * Architecture:
 * - Each physical card has a unique QR: ?card=PS-0001
 * - Card is validated via Supabase, then stored locally
 * - First scan = activation (single use)
 * - Same device can always return
 * - Others can access but we track it
 */
export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [cardStatus, setCardStatus] = useState<CardStatus | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('homepage');
  const [selectedQueteId, setSelectedQueteId] = useState<string | null>(null);
  const [questRunId, setQuestRunId] = useState<string | null>(null);
  const [showSilencePrompt, setShowSilencePrompt] = useState(false);

  // Force-unpair state (when session expired but card still paired on server)
  const [showForceUnpairPrompt, setShowForceUnpairPrompt] = useState(false);
  const [forceUnpairCardId, setForceUnpairCardId] = useState<string | null>(null);
  const [forceUnpairPassword, setForceUnpairPassword] = useState('');
  const [forceUnpairError, setForceUnpairError] = useState<string | null>(null);
  const [forceUnpairLoading, setForceUnpairLoading] = useState(false);

  // Initialize card on mount
  useEffect(() => {
    async function init() {
      const isBrowser = typeof window !== 'undefined';
      const pathname = isBrowser ? window.location.pathname : '';
      const isLegacyDevRoute = pathname === '/dev' || pathname.startsWith('/dev/');

      // Keep /demo as the explicit demo surface and normalize legacy /dev links.
      if (isLegacyDevRoute) {
        const nextPath = pathname.replace(/^\/dev(?=\/|$)/, '/demo');
        window.history.replaceState({}, '', `${nextPath}${window.location.search}${window.location.hash}`);
      }

      const isDemo = pathname.startsWith('/demo') || isLegacyDevRoute;
      if (isDemo) {
        const demoStatus: CardStatus = {
          valid: true,
          status: 'DEMO',
          message: 'Mode démo.',
          cardId: 'DEMO-DEV',
        };
        setCardStatus(demoStatus);
        setAppState('ready');
        return;
      }

      const status = await initializeCard();

      if (!status) {
        setAppState('no_card');
        return;
      }

      setCardStatus(status);

      if (status.valid) {
        setAppState('welcome');
        setTimeout(() => setAppState('ready'), 1500);
      } else if (status.status === 'NEEDS_GATE' && status.cardCode) {
        setAppState('validating');
      } else {
        setAppState('invalid');
      }
    }

    init();
  }, []);

  // Companion decay once per session (no timers)
  useEffect(() => {
    if (appState !== 'ready') return;
    try {
      if (sessionStorage.getItem('arche_companion_decay_done')) return;
      decayIfNeeded();
      sessionStorage.setItem('arche_companion_decay_done', '1');
    } catch {}
  }, [appState]);

  // Last open + silence prompt check + delayed resonance (echo) + silent milestones on ready
  useEffect(() => {
    if (appState !== 'ready') return;
    try {
      const showSilence = shouldShowSilencePrompt();
      setShowSilencePrompt(showSilence);
      recordAppOpen();
      runEchoIfNeeded();
      runMilestonesIfNeeded();
    } catch {}
  }, [appState]);

  // Déconnecter : libérer la carte sur cet appareil pour pouvoir l'utiliser sur un autre (ex. téléphone)
  const handleDisconnect = async () => {
    const result = await unpairCard();

    // If session expired but card still paired on server, show password prompt
    if (result.needsPassword && result.cardId) {
      setForceUnpairCardId(result.cardId);
      setForceUnpairPassword('');
      setForceUnpairError(result.message || null);
      setShowForceUnpairPrompt(true);
      return;
    }

    // Normal disconnect succeeded
    setCardStatus(null);
    setCurrentScreen('homepage');
    setAppState('no_card');
    const url = new URL(window.location.href);
    url.searchParams.delete('card');
    window.history.replaceState({}, '', url.toString());
  };

  // Handle force-unpair with password
  const handleForceUnpair = async () => {
    if (!forceUnpairCardId || !forceUnpairPassword) return;

    setForceUnpairLoading(true);
    setForceUnpairError(null);

    try {
      const result = await forceUnpairCard(forceUnpairCardId, forceUnpairPassword);

      if (result.ok) {
        // Success - complete the disconnect
        setShowForceUnpairPrompt(false);
        setCardStatus(null);
        setCurrentScreen('homepage');
        setAppState('no_card');
        const url = new URL(window.location.href);
        url.searchParams.delete('card');
        window.history.replaceState({}, '', url.toString());
      } else {
        setForceUnpairError(result.message || 'Échec de la déconnexion');
      }
    } catch (err) {
      setForceUnpairError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setForceUnpairLoading(false);
    }
  };

  // Cancel force-unpair (stay logged in locally)
  const handleCancelForceUnpair = () => {
    setShowForceUnpairPrompt(false);
    setForceUnpairCardId(null);
    setForceUnpairPassword('');
    setForceUnpairError(null);
  };

  // From demo: show card entry so user can log in with a real card
  const handleSwitchToLogin = () => {
    setCardStatus(null);
    setAppState('no_card');
  };

  // Manual card entry: show CardGate (check-card → activation or login)
  const handleManualEntry = (code: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('card', code);
    window.history.replaceState({}, '', url.toString());
    setCardStatus({
      valid: false,
      status: 'NEEDS_GATE',
      message: 'Vérifiez la carte.',
      cardId: '',
      cardCode: code,
    });
    setAppState('validating');
  };

  // After CardGate activation/login: pair, validate, store card, then ready
  const handleCardGateAuthenticated = async (cardData: { id: string; code: string; activated_at: string; password?: string }) => {
    try {
      await afterCardGateAuthenticated(cardData);
      setCardStatus({
        valid: true,
        status: 'WELCOME_BACK',
        message: 'Bon retour.',
        cardId: cardData.id,
      });
      setAppState('welcome');
      setTimeout(() => setAppState('ready'), 900);
    } catch (err) {
      console.error('Card Gate after auth:', err);

      // Handle "already paired" - need password to transfer
      if (err instanceof AlreadyPairedError) {
        setCardStatus({
          valid: false,
          status: 'NEEDS_GATE',
          message: err.message,
          cardId: '',
          cardCode: cardData.code,
        });
        setAppState('validating');
        return;
      }

      // Handle rate limit - show clear message, stay on current screen
      if (err instanceof RateLimitError) {
        setCardStatus({
          valid: false,
          status: 'ERROR',
          message: err.message,
          cardId: cardData.id,
        });
        setAppState('invalid');
        return;
      }

      // Handle abort/cancel errors silently (user cancelled or navigated away)
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('abort') || errMsg.includes('cancel') || errMsg === 'The operation was aborted.') {
        console.log('[App] Connection aborted by user');
        return;
      }

      setCardStatus({
        valid: false,
        status: 'ERROR',
        message: errMsg || 'Connexion limitée. Réessayez.',
        cardId: cardData.id,
      });
      setAppState('invalid');
    }
  };

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);

      if (!hash) {
        setCurrentScreen('homepage');
      } else if (hash === 'origine') {
        setCurrentScreen('origine');
      } else if (hash === 'histoire') {
        setCurrentScreen('histoire');
      } else if (hash === 'carnet') {
        setCurrentScreen('carnet');
      } else if (hash === 'collection') {
        setCurrentScreen('collection');
      } else if (hash === 'seuil') {
        setCurrentScreen('seuil');
      } else if (hash === 'etudes') {
        setCurrentScreen('etudes');
      } else if (hash === 'quetes') {
        setCurrentScreen('quetes');
      } else if (hash === 'quetes/marches') {
        setCurrentScreen('quetes');
      } else if (hash === 'etudes') {
        setCurrentScreen('etudes');
      } else if (hash.startsWith('quete/')) {
        const queteId = hash.split('/')[1]?.trim();
        if (queteId) {
          setSelectedQueteId(queteId);
          setCurrentScreen('detail');
        } else {
          setCurrentScreen('quetes');
        }
      } else if (hash.startsWith('quest-run/')) {
        const runId = hash.slice('quest-run/'.length).trim() || null;
        if (runId) {
          setQuestRunId(runId);
          setCurrentScreen('questRun');
        } else {
          setCurrentScreen('quetes');
        }
      } else if (hash === 'aura') {
        setCurrentScreen('aura');
      } else if (hash === 'meridiens') {
        setCurrentScreen('meridiens');
      } else if (hash === 'champ') {
        setCurrentScreen('champ');
      } else if (hash === 'kept') {
        setCurrentScreen('kept');
      } else if (hash === 'zone-test') {
        setCurrentScreen('zone-test');
      } else if (hash === 'meridian-quest') {
        setCurrentScreen('meridian-quest');
      } else {
        setCurrentScreen('homepage');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (screen: Screen, queteId?: string) => {
    if (screen === 'homepage') {
      window.location.hash = '';
    } else if (screen === 'detail' && queteId) {
      window.location.hash = `quete/${queteId}`;
    } else if (screen === 'questRun' && queteId) {
      window.location.hash = `quest-run/${queteId}`;
    } else if (screen === 'quetes') {
      window.location.hash = 'quetes';
    } else {
      window.location.hash = screen;
    }
  };

  const renderScreenLoading = (label = 'Chargement...') => (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#003D2C',
        fontFamily: 'var(--font-sans)',
        fontSize: 12,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        opacity: 0.7,
      }}
    >
      {label}
    </div>
  );

  // Main app
  const renderScreen = () => {
    switch (currentScreen) {
      case 'homepage':
        return (
          <HomepageV1
            cardId={cardStatus?.cardId ?? null}
            showSilencePrompt={showSilencePrompt}
            onSilencePromptShown={() => {
              markSilencePromptShown();
              setShowSilencePrompt(false);
            }}
            onEnterQuetes={() => navigateTo('quetes')}
            onEnterCarnet={() => navigateTo('carnet')}
            onEnterHunter={() => navigateTo('detail', 'hunter-montmartre')}
            onEnterCollection={() => navigateTo('collection')}
            onEnterChamp={() => navigateTo('champ')}
            onEnterAura={() => navigateTo('aura')}
            onEnterSeuil={() => navigateTo('seuil')}
            onOpenKept={() => navigateTo('kept')}
            onEnterEtudes={() => navigateTo('etudes')}
            onEnterMeridiens={() => navigateTo('meridiens')}
            onDisconnect={cardStatus?.cardId === 'DEMO-DEV' ? undefined : handleDisconnect}
            onLogin={cardStatus?.cardId === 'DEMO-DEV' ? handleSwitchToLogin : undefined}
          />
        );
      case 'origine':
        return <OrigineMap onBack={() => navigateTo('homepage')} />;
      case 'histoire':
        return <HistoireArchives onBack={() => navigateTo('homepage')} />;
      case 'quetes':
        return (
          <QuetesV1
            onBack={() => navigateTo('homepage')}
            onSelectQuete={(id) => navigateTo('detail', id)}
          />
        );
      case 'detail':
        if (!selectedQueteId) {
          navigateTo('quetes');
          return null;
        }
        // Hunter: Montmartre has its own treasure hunt component
        if (selectedQueteId === 'hunter-montmartre') {
          return <HunterMontmartre onBack={() => navigateTo('homepage')} />;
        }
        return <QueteDetail queteId={selectedQueteId} onBack={() => navigateTo('quetes')} />;
      case 'questRun':
        if (!questRunId) {
          navigateTo('quetes');
          return null;
        }
        return (
          <QuestRun
            questId={questRunId}
            cardId={cardStatus?.cardId ?? null}
            onBack={() => { setQuestRunId(null); navigateTo('quetes'); }}
            onClose={() => { setQuestRunId(null); window.location.hash = 'quetes'; }}
          />
        );
      case 'carnet':
        return <CarnetParisien cardId={cardStatus?.cardId || 'unknown'} onBack={() => navigateTo('homepage')} />;
      case 'collection':
        return (
          <PersonalMemoryMap
            cardId={cardStatus?.cardId || 'unknown'}
            onBack={() => navigateTo('homepage')}
            onOpenNotebook={() => navigateTo('carnet')}
          />
        );
      case 'seuil':
        return <CultureQuiz onBack={() => navigateTo('homepage')} />;
      case 'etudes':
        return (
          <Suspense fallback={renderScreenLoading('Chargement des Etudes...')}>
            <LazyEtudesHub onClose={() => navigateTo('homepage')} />
          </Suspense>
        );
      case 'aura':
        return (
          <ArcheInterface
            onExit={() => navigateTo('homepage')}
          />
        );
      case 'kept':
        return (
          <KeptSentences
            onBack={() => navigateTo('aura')}
            cardId={cardStatus?.cardId ?? null}
          />
        );
      case 'meridiens':
        return (
          <Suspense fallback={renderScreenLoading('Chargement des Meridiens...')}>
            <LazyMeridiensLive
              onBack={() => navigateTo('homepage')}
              cardId={cardStatus?.cardId ?? null}
            />
          </Suspense>
        );
      case 'champ':
        return (
          <ChampScreen
            cardId={cardStatus?.cardId || 'unknown'}
            onBack={() => navigateTo('homepage')}
          />
        );
      case 'zone-test':
        return (
          <ZoneTestPanel
            onBack={() => navigateTo('homepage')}
          />
        );
      case 'meridian-quest':
        return (
          <MeridianQuest
            onBack={() => navigateTo('homepage')}
            onComplete={() => navigateTo('aura')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <LanguageProvider>
      <WhisperProvider>
      <SyncStateProvider>
      <div style={{ minHeight: '100vh', width: '100%', maxWidth: '100%', overflowX: 'hidden', background: '#FAF8F2', position: 'relative' }}>
        {appState !== 'ready' ? (
          cardStatus?.status === 'NEEDS_GATE' && cardStatus?.cardCode ? (
            <CardGate
              cardCode={cardStatus.cardCode}
              onAuthenticated={handleCardGateAuthenticated}
              onBack={() => {
                setCardStatus(null);
                setAppState('no_card');
                const url = new URL(window.location.href);
                url.searchParams.delete('card');
                window.history.replaceState({}, '', url.toString());
              }}
            />
          ) : (
            <CardEntry
              status={appState}
              cardStatus={cardStatus || undefined}
              onManualEntry={handleManualEntry}
              onContinue={() => setAppState('ready')}
            />
          )
        ) : (
          <>
            <LanguageSelector />
            {renderScreen()}
            <CardDrawer />
          </>
        )}

        {/* Glyph + Companion: left side, below Back so they never overlap. Click → /aura. Hidden on Aura and Kept pages. */}
        {appState === 'ready' && currentScreen !== 'aura' && currentScreen !== 'kept' && (
          <div
            style={{
              position: 'fixed',
              top: 72,
              left: 'clamp(24px, 4vw, 40px)',
              right: 'auto',
              zIndex: 10001,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <button
              type="button"
              onClick={() => navigateTo('aura')}
              aria-label="Presence"
              style={{
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                opacity: 0.85,
                transition: 'opacity 0.3s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
            >
              <ArcheSymbol size={48} />
            </button>
            <CompanionBlock />
          </div>
        )}

        {/* Force-unpair modal: shown when session expired but card still paired on server */}
        {showForceUnpairPrompt && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20000,
              padding: '24px'
            }}
            onClick={handleCancelForceUnpair}
          >
            <div
              style={{
                background: 'var(--paper, #FAF8F2)',
                borderRadius: '4px',
                padding: '32px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: '16px', color: 'var(--ink, #1A1A1A)' }}>
                Session expirée
              </h3>
              <p style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--ink, #1A1A1A)', opacity: 0.7 }}>
                Entrez votre mot de passe pour déconnecter cette carte.
              </p>
              <input
                type="password"
                value={forceUnpairPassword}
                onChange={(e) => setForceUnpairPassword(e.target.value)}
                placeholder="Mot de passe"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  border: '1px solid var(--grey-light, #E8E5DE)',
                  borderRadius: '2px',
                  fontSize: '16px',
                  fontFamily: 'var(--font-sans)',
                  minHeight: '48px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && forceUnpairPassword) handleForceUnpair();
                }}
              />
              {forceUnpairError && (
                <p style={{ fontSize: '13px', color: '#B22222', marginBottom: '16px' }}>
                  {forceUnpairError}
                </p>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCancelForceUnpair}
                  style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    border: '1px solid var(--grey-light, #E8E5DE)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    minHeight: '44px'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleForceUnpair}
                  disabled={!forceUnpairPassword || forceUnpairLoading}
                  style={{
                    padding: '12px 24px',
                    background: forceUnpairPassword ? 'var(--green, #003D2C)' : 'var(--grey-light, #E8E5DE)',
                    color: forceUnpairPassword ? 'white' : 'var(--ink, #1A1A1A)',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: forceUnpairPassword ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    opacity: forceUnpairLoading ? 0.6 : 1,
                    minHeight: '44px'
                  }}
                >
                  {forceUnpairLoading ? 'Déconnexion...' : 'Déconnecter'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Global whisper overlay for poetic feedback */}
        <Whisper />
      </div>
      </SyncStateProvider>
      </WhisperProvider>
    </LanguageProvider>
  );
}
