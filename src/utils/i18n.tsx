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

import enHome from '../locales/en/home.json';
import enHistory from '../locales/en/history.json';
import enOrigin from '../locales/en/origin.json';
import enMap from '../locales/en/map.json';
import enTreasure from '../locales/en/treasure.json';

// Merge all translations per language
const translations: Record<Language, Record<string, any>> = {
  fr: { ...frHome, ...frHistory, ...frOrigin, ...frMap, ...frTreasure },
  en: { ...enHome, ...enHistory, ...enOrigin, ...enMap, ...enTreasure }
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

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to French if key not found
        value = translations['fr'];
        for (const fk of keys) {
          if (value && typeof value === 'object' && fk in value) {
            value = value[fk];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
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
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return [];
      }
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
