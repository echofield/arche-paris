/**
 * ARCHÉ — Internationalization System
 *
 * Simple, elegant i18n without heavy libraries.
 * Language is a "channel", not a section.
 *
 * Supported: FR (default), EN
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported languages
export type Language = 'fr' | 'en';

// Import all locale files
import frHome from '../locales/fr/home.json';
import frHistory from '../locales/fr/history.json';
import frOrigin from '../locales/fr/origin.json';
import frMap from '../locales/fr/map.json';
import frTreasure from '../locales/fr/treasure.json';
import frSeuil from '../locales/fr/seuil.json';
import frMeridiens from '../locales/fr/meridiens.json';
import frChurch from '../locales/fr/church.json';
import frChamp from '../locales/fr/champ.json';
import frPaths from '../locales/fr/paths.json';
import frMiroir from '../locales/fr/miroir.json';

import enHome from '../locales/en/home.json';
import enHistory from '../locales/en/history.json';
import enOrigin from '../locales/en/origin.json';
import enMap from '../locales/en/map.json';
import enTreasure from '../locales/en/treasure.json';
import enSeuil from '../locales/en/seuil.json';
import enMeridiens from '../locales/en/meridiens.json';
import enChurch from '../locales/en/church.json';
import enChamp from '../locales/en/champ.json';

// Merge all translations per language
const translations: Record<Language, Record<string, any>> = {
  fr: { ...frHome, ...frHistory, ...frOrigin, ...frMap, ...frTreasure, ...frSeuil, ...frMeridiens, ...frChurch, ...frChamp, ...frPaths, ...frMiroir },
  en: { ...enHome, ...enHistory, ...enOrigin, ...enMap, ...enTreasure, ...enSeuil, ...enMeridiens, ...enChurch, ...enChamp }
};

// Storage key
const LANGUAGE_KEY = 'arche_language';

// Context
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tArray: (key: string) => any[];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

// Provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check localStorage first
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'fr') {
      return stored;
    }
    // Default to French
    return 'fr';
  });

  // Persist language choice
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
  };

  // Translation function - supports flat keys like "map.title"
  const t = (key: string, params?: Record<string, string | number>): string => {
    // First try flat key lookup (e.g., "map.title" as a literal key)
    let value: any = translations[language][key];

    // Fallback to French if not found in current language
    if (value === undefined) {
      value = translations['fr'][key];
    }

    // If still not found, return the key
    if (value === undefined || typeof value !== 'string') {
      return key;
    }

    // Replace parameters {param}
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) =>
        String(params[paramKey] ?? `{${paramKey}}`)
      );
    }

    return value;
  };

  // Get array translations (for moments, points, symbols, etc.)
  const tArray = (key: string): any[] => {
    // First try flat key lookup
    let value: any = translations[language][key];

    // Fallback to French if not found
    if (value === undefined) {
      value = translations['fr'][key];
    }

    return Array.isArray(value) ? value : [];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tArray }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use translations
export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
