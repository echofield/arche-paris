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
import { QuestRun } from './components/QuestRun';
import { CultureQuiz } from './components/CultureQuiz';
import { EtudesHub } from './components/EtudesHub';
import { CardEntry } from './components/CardEntry';
import { CardDrawer } from './components/CardDrawer';
import { ArcheSymbol } from './components/ArcheSymbol';
import { CompanionBlock } from './components/CompanionBlock';
import { AuraPage } from './components/AuraPage';
import { initializeCard, activateCard, type CardStatus } from './utils/card-service';
import { decayIfNeeded } from './utils/companion-service';
import { LanguageProvider } from './utils/i18n';
import { LanguageSelector } from './components/LanguageSelector';

type Screen = 'homepage' | 'origine' | 'quetes' | 'histoire' | 'detail' | 'questRun' | 'carnet' | 'collection' | 'seuil' | 'etudes' | 'aura';
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
  const [questRunId, setQuestRunId] = useState<string | null>(null);

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

  // Companion decay once per session (no timers)
  useEffect(() => {
    if (appState !== 'ready') return;
    try {
      if (sessionStorage.getItem('arche_companion_decay_done')) return;
      decayIfNeeded();
      sessionStorage.setItem('arche_companion_decay_done', '1');
    } catch {}
  }, [appState]);

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
      } else if (hash.startsWith('quest-run/')) {
        setQuestRunId(hash.slice('quest-run/'.length) || null);
        setCurrentScreen('questRun');
      } else if (hash === 'aura') {
        setCurrentScreen('aura');
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
        return <EtudesHub onClose={() => navigateTo('homepage')} />;
      case 'aura':
        return (
          <AuraPage
            onBack={() => navigateTo('homepage')}
            cardId={cardStatus?.cardId ?? null}
          />
        );
      default:
        return null;
    }
  };

  return (
    <LanguageProvider>
      <div style={{ minHeight: '100vh', width: '100%', maxWidth: '100%', overflowX: 'hidden', background: '#FAF8F2', position: 'relative' }}>
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

        {/* Glyph + Companion: left side, below Back so they never overlap. Click → /aura. Hidden on Aura page. */}
        {appState === 'ready' && currentScreen !== 'aura' && (
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
      </div>
    </LanguageProvider>
  );
}
