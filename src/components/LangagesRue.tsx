/**
 * LANGAGES — CARTE RUE
 * Argot · Métiers · Détournements
 */

import { useState } from 'react';
import { unsplash_tool } from '../tools';

interface LangagesRueProps {
  onReturn: () => void;
  onTest: () => void;
}

interface LexiqueEntry {
  mot: string;
  sens: string;
  contexte: string;
  anecdote: string;
  equivalent: string;
}

const LEXIQUE: LexiqueEntry[] = [
  {
    mot: 'Thune',
    sens: 'Argent',
    contexte: 'J\'ai plus une thune.',
    anecdote: 'Mot très ancien, passé partout',
    equivalent: 'Argent'
  },
  {
    mot: 'Daron',
    sens: 'Père / autorité',
    contexte: 'Mon daron…',
    anecdote: 'Garde l\'idée de hiérarchie domestique',
    equivalent: 'Père'
  },
  {
    mot: 'Poulet',
    sens: 'Policier',
    contexte: 'Les poulets…',
    anecdote: 'Vient d\'un lieu, pas de l\'animal',
    equivalent: 'Policier'
  },
  {
    mot: 'Rousse',
    sens: 'La police',
    contexte: 'La rousse…',
    anecdote: 'Ancien argot, toujours compris',
    equivalent: 'Police'
  },
  {
    mot: 'Charrette',
    sens: 'Urgence de rendu',
    contexte: 'Je suis en charrette.',
    anecdote: 'Beaux-Arts → devenu pro',
    equivalent: 'Débordé'
  },
  {
    mot: 'Mastroquet',
    sens: 'Patron de bar',
    contexte: 'Le mastroquet…',
    anecdote: 'Paris populaire (bistrots)',
    equivalent: 'Cafetier'
  },
  {
    mot: 'Titi',
    sens: 'Gamin de Paris',
    contexte: 'Un titi…',
    anecdote: 'Figure culturelle parisienne',
    equivalent: 'Gamin'
  },
  {
    mot: 'Hess',
    sens: 'Galère',
    contexte: 'C\'est la hess.',
    anecdote: 'Mot de manque / tension quotidienne',
    equivalent: 'Galère'
  },
  {
    mot: 'Relou',
    sens: 'Pénible',
    contexte: 'C\'est relou.',
    anecdote: 'Langue de rue devenue standard',
    equivalent: 'Pénible'
  },
  {
    mot: 'Chelou',
    sens: 'Étrange',
    contexte: 'C\'est chelou.',
    anecdote: 'Déformation devenue normale',
    equivalent: 'Bizarre'
  }
];

const REPERES = [
  {
    periode: 'XVe siècle',
    titre: 'Argot crypté',
    texte: 'La langue devient un écran contre la surveillance.'
  },
  {
    periode: 'XIXe siècle',
    titre: 'Métiers & faubourgs',
    texte: 'Les jargons sédimentent Paris par profession.'
  },
  {
    periode: '1871',
    titre: 'Toponymie & police',
    texte: 'Le vocabulaire naît aussi de lieux précis.'
  }
];

const ANECDOTES = [
  '"En charrette" vient littéralement d\'une charrette de rendus.',
  'Certains argots de métiers servaient à parler sans être compris des clients.',
  'Des mots naissent d\'un bâtiment, d\'un quartier, d\'un déplacement.',
  'Les mêmes termes migrent de la marge au centre en quelques décennies.',
  'Paris conserve les mots même quand le lieu disparaît.'
];

export function LangagesRue({ onReturn, onTest }: LangagesRueProps) {
  const [openLexique, setOpenLexique] = useState<number | null>(null);

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        padding: 'clamp(24px, 5vw, 80px)',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div 
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          marginBottom: '64px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <button
          onClick={onReturn}
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#1A1A1A',
            opacity: 0.4,
            cursor: 'pointer',
            transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
        >
          ← Retour
        </button>

        <h1 
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 400,
            color: '#1A1A1A'
          }}
        >
          Rue
        </h1>

        <div style={{ width: '80px' }} />
      </div>

      {/* Layout principal : 2 colonnes */}
      <div 
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 'clamp(40px, 5vw, 80px)',
          alignItems: 'start'
        }}
        className="langages-layout"
      >
        {/* Colonne gauche — Visuel */}
        <div 
          style={{
            position: 'sticky',
            top: '80px',
            aspectRatio: '4 / 5',
            background: '#E7E1D8',
            border: '1px solid #DBD4C6',
            overflow: 'hidden'
          }}
        >
          <img 
            src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800"
            alt="Paris rue"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>

        {/* Colonne droite — Contenu */}
        <div style={{ paddingBottom: '120px' }}>
          {/* A) Ouverture */}
          <div 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(20px, 2.5vw, 28px)',
              fontWeight: 400,
              lineHeight: 1.5,
              fontStyle: 'italic',
              color: '#1A1A1A',
              marginBottom: '80px',
              textAlign: 'center',
              opacity: 0.7
            }}
          >
            La rue invente pour survivre, rire et se reconnaître.
          </div>

          {/* B) Repères */}
          <div style={{ marginBottom: '80px' }}>
            <h2 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#1A1A1A',
                opacity: 0.4,
                marginBottom: '32px'
              }}
            >
              Repères
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {REPERES.map((repere, i) => (
                <div 
                  key={i}
                  style={{
                    borderLeft: '1px solid rgba(26, 26, 26, 0.15)',
                    paddingLeft: '20px'
                  }}
                >
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '10px',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#003D2C',
                      marginBottom: '8px'
                    }}
                  >
                    {repere.periode} — {repere.titre}
                  </div>
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: '#1A1A1A',
                      opacity: 0.7
                    }}
                  >
                    {repere.texte}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* C) Lexique */}
          <div style={{ marginBottom: '80px' }}>
            <h2 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#1A1A1A',
                opacity: 0.4,
                marginBottom: '32px'
              }}
            >
              Lexique
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {LEXIQUE.map((entry, i) => (
                <LexiqueCard
                  key={i}
                  entry={entry}
                  isOpen={openLexique === i}
                  onClick={() => setOpenLexique(openLexique === i ? null : i)}
                />
              ))}
            </div>
          </div>

          {/* D) Anecdotes */}
          <div style={{ marginBottom: '80px' }}>
            <h2 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#1A1A1A',
                opacity: 0.4,
                marginBottom: '32px'
              }}
            >
              Anecdotes
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {ANECDOTES.map((anecdote, i) => (
                <div 
                  key={i}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    lineHeight: 1.7,
                    color: '#1A1A1A',
                    opacity: 0.6,
                    paddingLeft: '16px',
                    borderLeft: '1px solid rgba(26, 26, 26, 0.1)'
                  }}
                >
                  {anecdote}
                </div>
              ))}
            </div>
          </div>

          {/* E) Exercice */}
          <div 
            style={{
              background: 'rgba(0, 61, 44, 0.03)',
              border: '1px solid rgba(0, 61, 44, 0.15)',
              padding: '32px',
              marginBottom: '64px'
            }}
          >
            <h2 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#003D2C',
                marginBottom: '16px'
              }}
            >
              Exercice
            </h2>

            <p 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                lineHeight: 1.7,
                color: '#1A1A1A',
                opacity: 0.7
              }}
            >
              Écoute une conversation dans un café. Repère un mot "de rue". Note ce qu'il remplace en français standard.
            </p>
          </div>

          {/* F) CTA */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button
              onClick={onTest}
              style={{
                background: 'transparent',
                border: '0.5px solid rgba(0, 61, 44, 0.25)',
                padding: '16px 32px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#003D2C',
                cursor: 'pointer',
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 61, 44, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.25)';
              }}
            >
              Passer le test
            </button>

            <button
              onClick={onReturn}
              style={{
                background: 'transparent',
                border: '0.5px solid rgba(26, 26, 26, 0.15)',
                padding: '16px 32px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#1A1A1A',
                opacity: 0.5,
                cursor: 'pointer',
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.5';
              }}
            >
              Retour
            </button>
          </div>
        </div>
      </div>

      {/* Responsive: mobile stacking */}
      <style>{`
        @media (max-width: 900px) {
          .langages-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// Carte lexique pliable
interface LexiqueCardProps {
  entry: LexiqueEntry;
  isOpen: boolean;
  onClick: () => void;
}

function LexiqueCard({ entry, isOpen, onClick }: LexiqueCardProps) {
  return (
    <div 
      style={{
        border: '0.5px solid rgba(26, 26, 26, 0.15)',
        background: isOpen ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
        transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Header cliquable */}
      <button
        onClick={onClick}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <div 
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '18px',
            fontWeight: 500,
            color: '#1A1A1A'
          }}
        >
          {entry.mot}
        </div>

        <div 
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '20px',
            color: '#1A1A1A',
            opacity: 0.3,
            transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        >
          ↓
        </div>
      </button>

      {/* Contenu dépliable */}
      {isOpen && (
        <div 
          style={{
            padding: '0 20px 20px 20px',
            borderTop: '0.5px solid rgba(26, 26, 26, 0.1)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <div>
              <div 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#1A1A1A',
                  opacity: 0.4,
                  marginBottom: '4px'
                }}
              >
                Sens
              </div>
              <div 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#1A1A1A'
                }}
              >
                {entry.sens}
              </div>
            </div>

            <div>
              <div 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#1A1A1A',
                  opacity: 0.4,
                  marginBottom: '4px'
                }}
              >
                Contexte
              </div>
              <div 
                style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: '16px',
                  fontStyle: 'italic',
                  color: '#1A1A1A',
                  opacity: 0.7
                }}
              >
                "{entry.contexte}"
              </div>
            </div>

            <div>
              <div 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#1A1A1A',
                  opacity: 0.4,
                  marginBottom: '4px'
                }}
              >
                Anecdote
              </div>
              <div 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: '#1A1A1A',
                  opacity: 0.6
                }}
              >
                {entry.anecdote}
              </div>
            </div>

            <div>
              <div 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#1A1A1A',
                  opacity: 0.4,
                  marginBottom: '4px'
                }}
              >
                Équivalent standard
              </div>
              <div 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#003D2C',
                  fontWeight: 500
                }}
              >
                {entry.equivalent}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
