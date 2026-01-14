/**
 * ARCHÉ — Language Selector
 *
 * Discreet selector in top-right corner.
 * Style: editorial / atlas, not app store.
 *
 * FR / EN
 */

import { useTranslation, Language } from '../utils/i18n';

interface LanguageSelectorProps {
  position?: 'header' | 'fixed';
}

export function LanguageSelector({ position = 'fixed' }: LanguageSelectorProps) {
  const { language, setLanguage } = useTranslation();

  const languages: { code: Language; label: string }[] = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' }
  ];

  const baseStyle = position === 'fixed' ? {
    position: 'fixed' as const,
    top: 'var(--space-lg, 24px)',
    right: 'var(--space-lg, 24px)',
    zIndex: 1000
  } : {};

  return (
    <div
      style={{
        ...baseStyle,
        display: 'flex',
        gap: '8px',
        fontFamily: 'var(--font-sans)',
        fontSize: '10px',
        letterSpacing: '0.1em'
      }}
    >
      {languages.map((lang, index) => (
        <span key={lang.code} style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setLanguage(lang.code)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px 8px',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              letterSpacing: 'inherit',
              color: language === lang.code ? '#003D2C' : '#1A1A1A',
              opacity: language === lang.code ? 1 : 0.35,
              fontWeight: language === lang.code ? '600' : '400',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (language !== lang.code) {
                e.currentTarget.style.opacity = '0.6';
              }
            }}
            onMouseLeave={(e) => {
              if (language !== lang.code) {
                e.currentTarget.style.opacity = '0.35';
              }
            }}
          >
            {lang.label}
          </button>
          {index < languages.length - 1 && (
            <span style={{ color: '#1A1A1A', opacity: 0.2 }}>/</span>
          )}
        </span>
      ))}
    </div>
  );
}
