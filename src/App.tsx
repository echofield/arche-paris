import { useState, useEffect } from 'react';
import { HomepageV1 } from './components/HomepageV1';
import { QuetesV1 } from './components/QuetesV1';
import { QueteDetail } from './components/QueteDetail';
import { OrigineMap } from './components/OrigineMap';
import { HistoireArchives } from './components/HistoireArchives';
import { CarnetParisien } from './components/CarnetParisien';
import { CollectionMap } from './components/CollectionMap';
import { HunterMontmartre } from './components/HunterMontmartre';
import { CultureQuiz } from './components/CultureQuiz';
import { CardEntry } from './components/CardEntry';
import { CardDrawer } from './components/CardDrawer';
import { initializeCard, activateCard, type CardStatus } from './utils/card-service';
import { LanguageProvider, useTranslation } from './utils/i18n';
import { LanguageSelector } from './components/LanguageSelector';

type Screen = 'homepage' | 'origine' | 'quetes' | 'histoire' | 'detail' | 'carnet' | 'collection' | 'seuil';
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
      } else if (hash === 'quetes') {
        setCurrentScreen('quetes');
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

  // Card entry/validation states
  if (appState !== 'ready') {
    return (
      <CardEntry
        status={appState}
        cardStatus={cardStatus || undefined}
        onManualEntry={handleManualEntry}
        onContinue={() => setAppState('ready')}
      />
    );
  }

  // Main app
  const renderScreen = () => {
    switch (currentScreen) {
      case 'homepage':
        return (
          <HomepageV1
            onEnterQuetes={() => navigateTo('quetes')}
            onEnterOrigine={() => navigateTo('origine')}
            onEnterHistoire={() => navigateTo('histoire')}
            onEnterCarnet={() => navigateTo('carnet')}
            onEnterHunter={() => navigateTo('detail', 'hunter-montmartre')}
            onEnterCollection={() => navigateTo('collection')}
            onEnterSeuil={() => navigateTo('seuil')}
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
        return <CollectionMap onBack={() => navigateTo('homepage')} />;
      case 'seuil':
        return <CultureQuiz onBack={() => navigateTo('homepage')} />;
      default:
        return null;
    }
  };

  return (
    <LanguageProvider>
      <div style={{ minHeight: '100vh', background: '#FAF8F2' }}>
        <LanguageSelector />
        {renderScreen()}
        <CardDrawer />
      </div>
    </LanguageProvider>
  );
}
