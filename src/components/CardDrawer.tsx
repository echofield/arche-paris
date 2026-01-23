import { useState, useEffect } from 'react';
import type { ArcheCardData } from '../shared/types';
import { hasCard } from '../shared/entitlements';
import archeIds from '../shared/arche.ids.json';
import { ArcheCard } from './ArcheCard';
import { useTranslation } from '../utils/i18n';

/**
 * CardDrawer
 *
 * Discreet entry to latent cards.
 * Diamond trigger bottom-right. Overlay drawer.
 * Visible only if entitled.
 */
export function CardDrawer() {
  const { language: lang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [ownedCards, setOwnedCards] = useState<ArcheCardData[]>([]);

  // Filter to owned cards
  useEffect(() => {
    const cards = (archeIds.cards as ArcheCardData[]).filter((card) =>
      hasCard(card.card_id)
    );
    setOwnedCards(cards);
  }, []);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // No cards entitled — render nothing
  if (ownedCards.length === 0) {
    return null;
  }

  return (
    <>
      {/* Trigger — bottom right */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9000,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          fontFamily: 'var(--font-serif)',
          fontSize: '1.25rem',
          color: 'var(--ink)',
          opacity: 0.35,
          transition: 'opacity var(--transition)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.35')}
        aria-label={lang === 'fr' ? 'Ouvrir' : 'Open'}
      >
        &#9671;
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(250, 248, 242, 0.97)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'archeCardFadeIn 0.4s ease-out',
          }}
        >
          <style>
            {`
              @keyframes archeCardFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}
          </style>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '480px',
              width: '100%',
              margin: '0 16px',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '-48px',
                right: '0',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-serif)',
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                opacity: 0.5,
                transition: 'opacity var(--transition)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
            >
              {lang === 'fr' ? 'Fermer' : 'Close'}
            </button>

            {/* Card */}
            {ownedCards[0] && <ArcheCard card={ownedCards[0]} lang={lang} />}
          </div>
        </div>
      )}
    </>
  );
}
