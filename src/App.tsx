import { useState, useEffect } from 'react';
import { HomepageV1 } from './components/HomepageV1';
import { QuetesV1 } from './components/QuetesV1';
import { QueteDetail } from './components/QueteDetail';
import { OrigineMap } from './components/OrigineMap';
import { HistoireArchives } from './components/HistoireArchives';
import { CarnetParisien } from './components/CarnetParisien';
import { CollectionMap } from './components/CollectionMap';
import { PersonalMemoryMap } from './components/PersonalMemoryMap';
import { HunterMontmartre } from './components/HunterMontmartre';
import { CultureQuiz } from './components/CultureQuiz';
import { EtudesHub } from './components/EtudesHub';
import { CardEntry } from './components/CardEntry';
import { CardDrawer } from './components/CardDrawer';
import { ArcheSymbol } from './components/ArcheSymbol';
import { initializeCard, activateCard, type CardStatus } from './utils/card-service';
import { sealingStub } from './utils/sealing-stub';
import { LanguageProvider, useTranslation } from './utils/i18n';
import { LanguageSelector } from './components/LanguageSelector';

type Screen = 'homepage' | 'origine' | 'quetes' | 'histoire' | 'detail' | 'carnet' | 'collection' | 'seuil' | 'etudes';
type AppState = 'loading' | 'no_card' | 'validating' | 'invalid' | 'welcome' | 'ready';

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
  const [fadePanelOpen, setFadePanelOpen] = useState(false);

  // Initialize card on mount
  useEffect(() => {
    async function init() {
      const status = await initializeCard();

      if (!status) {
        setAppState('no_card');
        return;
      }

      setCardStatus(status);

      if (status.valid) {
        setAppState('welcome');
        setTimeout(() => setAppState('ready'), 1500);
      } else {
        setAppState('invalid');
      }
    }

    init();
  }, []);

  // Handle manual card entry
  const handleManualEntry = async (code: string) => {
    setAppState('validating');

    const url = new URL(window.location.href);
    url.searchParams.set('card', code);
    window.history.replaceState({}, '', url.toString());

    const status = await activateCard(code);
    setCardStatus(status);

    if (status.valid) {
      setAppState('welcome');
      setTimeout(() => setAppState('ready'), 1500);
    } else {
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
      } else if (hash === 'etudes') {
        setCurrentScreen('etudes');
      } else if (hash.startsWith('quete/')) {
        setSelectedQueteId(hash.split('/')[1]);
        setCurrentScreen('detail');
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
    } else {
      window.location.hash = screen;
    }
  };

  // Main app
  const renderScreen = () => {
    switch (currentScreen) {
      case 'homepage':
        return (
          <HomepageV1
            onEnterQuetes={() => navigateTo('quetes')}
            onEnterCarnet={() => navigateTo('carnet')}
            onEnterHunter={() => navigateTo('detail', 'hunter-montmartre')}
            onEnterCollection={() => navigateTo('collection')}
            onEnterSeuil={() => navigateTo('seuil')}
            onEnterEtudes={() => navigateTo('etudes')}
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
        return <EtudesHub onClose={() => navigateTo('homepage')} />;
      default:
        return null;
    }
  };

  return (
    <LanguageProvider>
      <div style={{ minHeight: '100vh', background: '#FAF8F2', position: 'relative' }}>
        {appState !== 'ready' ? (
          <CardEntry
            status={appState}
            cardStatus={cardStatus || undefined}
            onManualEntry={handleManualEntry}
            onContinue={() => setAppState('ready')}
          />
        ) : (
          <>
            <LanguageSelector />
            {renderScreen()}
            <CardDrawer />
          </>
        )}

        {/* Glyph from arch-citizen (Blason): single boundary symbol, always visible. No badge, count, tooltip. */}
        <button
          type="button"
          onClick={() => setFadePanelOpen((prev) => !prev)}
          aria-label="Presence"
          style={{
            position: 'fixed',
            top: 24,
            left: 24,
            zIndex: 10001,
            padding: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            opacity: 0.6,
            transition: 'opacity 0.4s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          <ArcheSymbol size={32} />
        </button>

        {/* Minimal Fade panel: opens only on glyph click. No lists, counts, or urgency. */}
        {fadePanelOpen && (
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
            onClick={() => setFadePanelOpen(false)}
          >
            <div
              style={{
                background: '#FAF8F2',
                border: '1px solid rgba(0, 61, 44, 0.15)',
                borderRadius: 4,
                padding: 32,
                maxWidth: 360,
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
                  marginBottom: 24
                }}
              >
                Some moments can be sealed. This is optional.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setFadePanelOpen(false)}
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
                  onClick={async () => {
                    await sealingStub.seal({
                      kind: 'card_activated',
                      id: `fade-${Date.now()}`,
                      cardId: cardStatus?.cardId,
                      completedAt: new Date().toISOString()
                    });
                    setFadePanelOpen(false);
                  }}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#003D2C',
                    background: 'transparent',
                    border: '0.5px solid rgba(0, 61, 44, 0.3)',
                    cursor: 'pointer',
                    padding: '8px 16px'
                  }}
                >
                  Seal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LanguageProvider>
  );
}
