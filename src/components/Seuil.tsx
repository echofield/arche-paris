/**
 * SEUIL — Épreuve de lecture active
 * Pas de quiz. Pas de score. Seulement une observation de comment tu lis.
 */

import { useState } from 'react';

// ============================================================
// TYPES
// ============================================================

type SeuilFormat = 'interpretatif' | 'correspondance' | 'regard' | 'temporel';

interface ChoixInterpretatif {
  format: 'interpretatif';
  question: string;
  options: {
    label: string;
    revelation: string; // Ce que ce choix révèle sur la lecture
  }[];
}

interface Correspondance {
  format: 'correspondance';
  question: string;
  items: { left: string; right: string }[];
  revelation: string; // Texte unique après interaction
}

interface TestRegard {
  format: 'regard';
  question: string;
  imagePlaceholder?: string; // Optionnel pour l'instant
  options: {
    label: string;
    revelation: string;
  }[];
}

interface LigneTemporelle {
  format: 'temporel';
  question: string;
  fragments: {
    periode: string;
    texte: string;
    revelation: string;
  }[];
}

type SeuilItem = ChoixInterpretatif | Correspondance | TestRegard | LigneTemporelle;

interface SeuilProps {
  items: SeuilItem[];
  onComplete: () => void;
  cta?: string; // "Passer le seuil", "Mettre à l'épreuve", etc.
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export function Seuil({ items, onComplete, cta = 'Passer le seuil' }: SeuilProps) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showRevelation, setShowRevelation] = useState(false);

  if (!started) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          background: '#FAF8F2',
          padding: '80px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ maxWidth: '500px', textAlign: 'center' }}>
          <div 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '28px',
              fontWeight: 400,
              lineHeight: 1.5,
              color: '#1A1A1A',
              marginBottom: '48px'
            }}
          >
            ARCHÉ n'évalue pas ce que tu sais.
            <br/><br/>
            Il observe comment tu lis.
          </div>

          <button
            onClick={() => setStarted(true)}
            style={{
              background: '#003D2C',
              border: 'none',
              padding: '16px 48px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#FAF8F2',
              cursor: 'pointer',
              transition: 'all 400ms ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {cta} →
          </button>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const isLast = currentIndex === items.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedChoice(null);
      setShowRevelation(false);
    }
  };

  // Rendu selon le format
  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        padding: '80px 40px'
      }}
    >
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Progress subtil */}
        <div 
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#1A1A1A',
            opacity: 0.2,
            marginBottom: '64px',
            textAlign: 'center'
          }}
        >
          {currentIndex + 1} / {items.length}
        </div>

        {/* Format Interprétatif */}
        {currentItem.format === 'interpretatif' && (
          <InterpretatifView
            item={currentItem}
            selectedChoice={selectedChoice}
            showRevelation={showRevelation}
            onSelect={(label, revelation) => {
              setSelectedChoice(label);
              setShowRevelation(true);
            }}
          />
        )}

        {/* Format Correspondance */}
        {currentItem.format === 'correspondance' && (
          <CorrespondanceView
            item={currentItem}
            showRevelation={showRevelation}
            onComplete={() => setShowRevelation(true)}
          />
        )}

        {/* Format Regard */}
        {currentItem.format === 'regard' && (
          <RegardView
            item={currentItem}
            selectedChoice={selectedChoice}
            showRevelation={showRevelation}
            onSelect={(label, revelation) => {
              setSelectedChoice(label);
              setShowRevelation(true);
            }}
          />
        )}

        {/* Format Temporel */}
        {currentItem.format === 'temporel' && (
          <TemporelView
            item={currentItem}
            selectedChoice={selectedChoice}
            showRevelation={showRevelation}
            onSelect={(periode, revelation) => {
              setSelectedChoice(periode);
              setShowRevelation(true);
            }}
          />
        )}

        {/* Navigation */}
        {showRevelation && (
          <div style={{ marginTop: '64px', textAlign: 'center' }}>
            <button
              onClick={handleNext}
              style={{
                background: '#003D2C',
                border: 'none',
                padding: '16px 48px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#FAF8F2',
                cursor: 'pointer',
                transition: 'all 400ms ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {isLast ? 'Terminer' : 'Suivant →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// VUES SPÉCIALISÉES
// ============================================================

function InterpretatifView({ 
  item, 
  selectedChoice, 
  showRevelation,
  onSelect 
}: { 
  item: ChoixInterpretatif; 
  selectedChoice: string | null;
  showRevelation: boolean;
  onSelect: (label: string, revelation: string) => void;
}) {
  const selectedOption = item.options.find(opt => opt.label === selectedChoice);

  return (
    <>
      {/* Question */}
      <div 
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '26px',
          fontWeight: 400,
          lineHeight: 1.5,
          color: '#1A1A1A',
          marginBottom: '56px',
          textAlign: 'center'
        }}
      >
        {item.question}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
        {item.options.map((option, i) => (
          <button
            key={i}
            onClick={() => !showRevelation && onSelect(option.label, option.revelation)}
            disabled={showRevelation}
            style={{
              background: selectedChoice === option.label ? 'rgba(0, 61, 44, 0.04)' : 'transparent',
              border: selectedChoice === option.label 
                ? '0.5px solid rgba(0, 61, 44, 0.25)' 
                : '0.5px solid rgba(26, 26, 26, 0.12)',
              padding: '20px 28px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#1A1A1A',
              textAlign: 'center',
              cursor: showRevelation ? 'default' : 'pointer',
              transition: 'all 400ms ease'
            }}
            onMouseEnter={(e) => {
              if (!showRevelation && selectedChoice !== option.label) {
                e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showRevelation && selectedChoice !== option.label) {
                e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.12)';
              }
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Révélation */}
      {showRevelation && selectedOption && (
        <div 
          style={{
            background: 'rgba(0, 61, 44, 0.03)',
            border: '0.5px solid rgba(0, 61, 44, 0.12)',
            padding: '40px',
            textAlign: 'center'
          }}
        >
          <div 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '20px',
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#1A1A1A',
              fontStyle: 'italic'
            }}
          >
            {selectedOption.revelation}
          </div>
        </div>
      )}
    </>
  );
}

function CorrespondanceView({ 
  item, 
  showRevelation,
  onComplete 
}: { 
  item: Correspondance;
  showRevelation: boolean;
  onComplete: () => void;
}) {
  return (
    <>
      {/* Question */}
      <div 
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '26px',
          fontWeight: 400,
          lineHeight: 1.5,
          color: '#1A1A1A',
          marginBottom: '56px',
          textAlign: 'center'
        }}
      >
        {item.question}
      </div>

      {/* Correspondances */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '48px' }}>
        {item.items.map((pair, i) => (
          <div 
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '24px',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: i < item.items.length - 1 ? '0.5px solid rgba(26, 26, 26, 0.08)' : 'none'
            }}
          >
            <div 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                fontWeight: 400,
                color: '#1A1A1A',
                textAlign: 'right'
              }}
            >
              {pair.left}
            </div>
            
            <div 
              style={{
                width: '32px',
                height: '1px',
                background: 'rgba(26, 26, 26, 0.2)'
              }}
            />
            
            <div 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                fontWeight: 400,
                color: '#1A1A1A',
                textAlign: 'left'
              }}
            >
              {pair.right}
            </div>
          </div>
        ))}
      </div>

      {!showRevelation && (
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <button
            onClick={onComplete}
            style={{
              background: 'transparent',
              border: '0.5px solid rgba(0, 61, 44, 0.2)',
              padding: '16px 32px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#003D2C',
              cursor: 'pointer',
              transition: 'all 400ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.2)';
            }}
          >
            Continuer
          </button>
        </div>
      )}

      {/* Révélation */}
      {showRevelation && (
        <div 
          style={{
            background: 'rgba(0, 61, 44, 0.03)',
            border: '0.5px solid rgba(0, 61, 44, 0.12)',
            padding: '40px',
            textAlign: 'center'
          }}
        >
          <div 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '20px',
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#1A1A1A',
              fontStyle: 'italic'
            }}
          >
            {item.revelation}
          </div>
        </div>
      )}
    </>
  );
}

function RegardView({ 
  item, 
  selectedChoice,
  showRevelation,
  onSelect 
}: { 
  item: TestRegard;
  selectedChoice: string | null;
  showRevelation: boolean;
  onSelect: (label: string, revelation: string) => void;
}) {
  const selectedOption = item.options.find(opt => opt.label === selectedChoice);

  return (
    <>
      {/* Image placeholder si fournie */}
      {item.imagePlaceholder && (
        <div 
          style={{
            width: '100%',
            height: '280px',
            background: 'rgba(0, 61, 44, 0.05)',
            border: '0.5px solid rgba(0, 61, 44, 0.12)',
            marginBottom: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#1A1A1A',
            opacity: 0.3,
            fontStyle: 'italic'
          }}
        >
          {item.imagePlaceholder}
        </div>
      )}

      {/* Question */}
      <div 
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '26px',
          fontWeight: 400,
          lineHeight: 1.5,
          color: '#1A1A1A',
          marginBottom: '56px',
          textAlign: 'center'
        }}
      >
        {item.question}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
        {item.options.map((option, i) => (
          <button
            key={i}
            onClick={() => !showRevelation && onSelect(option.label, option.revelation)}
            disabled={showRevelation}
            style={{
              background: selectedChoice === option.label ? 'rgba(0, 61, 44, 0.04)' : 'transparent',
              border: selectedChoice === option.label 
                ? '0.5px solid rgba(0, 61, 44, 0.25)' 
                : '0.5px solid rgba(26, 26, 26, 0.12)',
              padding: '20px 28px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#1A1A1A',
              textAlign: 'center',
              cursor: showRevelation ? 'default' : 'pointer',
              transition: 'all 400ms ease'
            }}
            onMouseEnter={(e) => {
              if (!showRevelation && selectedChoice !== option.label) {
                e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showRevelation && selectedChoice !== option.label) {
                e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.12)';
              }
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Révélation */}
      {showRevelation && selectedOption && (
        <div 
          style={{
            background: 'rgba(0, 61, 44, 0.03)',
            border: '0.5px solid rgba(0, 61, 44, 0.12)',
            padding: '40px',
            textAlign: 'center'
          }}
        >
          <div 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '20px',
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#1A1A1A',
              fontStyle: 'italic'
            }}
          >
            {selectedOption.revelation}
          </div>
        </div>
      )}
    </>
  );
}

function TemporelView({ 
  item,
  selectedChoice,
  showRevelation,
  onSelect 
}: { 
  item: LigneTemporelle;
  selectedChoice: string | null;
  showRevelation: boolean;
  onSelect: (periode: string, revelation: string) => void;
}) {
  const selectedFragment = item.fragments.find(frag => frag.periode === selectedChoice);

  return (
    <>
      {/* Question */}
      <div 
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '26px',
          fontWeight: 400,
          lineHeight: 1.5,
          color: '#1A1A1A',
          marginBottom: '56px',
          textAlign: 'center'
        }}
      >
        {item.question}
      </div>

      {/* Fragments temporels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '48px' }}>
        {item.fragments.map((fragment, i) => (
          <button
            key={i}
            onClick={() => !showRevelation && onSelect(fragment.periode, fragment.revelation)}
            disabled={showRevelation}
            style={{
              background: selectedChoice === fragment.periode ? 'rgba(0, 61, 44, 0.04)' : 'transparent',
              border: selectedChoice === fragment.periode 
                ? '0.5px solid rgba(0, 61, 44, 0.25)' 
                : '0.5px solid rgba(26, 26, 26, 0.12)',
              padding: '24px',
              textAlign: 'left',
              cursor: showRevelation ? 'default' : 'pointer',
              transition: 'all 400ms ease'
            }}
            onMouseEnter={(e) => {
              if (!showRevelation && selectedChoice !== fragment.periode) {
                e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showRevelation && selectedChoice !== fragment.periode) {
                e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.12)';
              }
            }}
          >
            <div 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                color: '#1A1A1A',
                opacity: 0.5,
                marginBottom: '8px'
              }}
            >
              {fragment.periode}
            </div>
            <div 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#1A1A1A'
              }}
            >
              {fragment.texte}
            </div>
          </button>
        ))}
      </div>

      {/* Révélation */}
      {showRevelation && selectedFragment && (
        <div 
          style={{
            background: 'rgba(0, 61, 44, 0.03)',
            border: '0.5px solid rgba(0, 61, 44, 0.12)',
            padding: '40px',
            textAlign: 'center'
          }}
        >
          <div 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '20px',
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#1A1A1A',
              fontStyle: 'italic'
            }}
          >
            {selectedFragment.revelation}
          </div>
        </div>
      )}
    </>
  );
}
