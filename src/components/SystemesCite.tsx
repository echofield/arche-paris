/**
 * SYSTÈMES — CARTE CITÉ
 * Flux · Métabolisme · Frontière
 */

import { useState } from 'react';

interface SystemesCiteProps {
  onReturn: () => void;
  onTest: () => void;
}

const PRINCIPE = `La cité est un organisme vivant. Elle respire, digère, excrète, se régénère. Paris comme système organique suppose une circulation constante : eau, nourriture, déchets, corps. Cette lecture refuse la ville-décor. Elle observe la ville-machine.`;

const JALONS = [
  {
    periode: 'XIIIe siècle',
    titre: 'Première ceinture de fortifications',
    texte: 'Philippe Auguste trace une limite nette : dedans / dehors. La frontière devient visible, défensive, politique.'
  },
  {
    periode: '1850–1860',
    titre: 'Belgrand et le réseau double',
    texte: 'Eau potable + égouts. La ville devient un corps technique. La cité moderne naît sous terre.'
  },
  {
    periode: '1920–1930',
    titre: 'Ceinture rouge (banlieue ouvrière)',
    texte: 'Paris déborde ses murs. La frontière devient sociale, électorale, symbolique.'
  },
  {
    periode: '1973',
    titre: 'Périphérique : nouvelle frontière',
    texte: 'Une autoroute circulaire devient frontière psychologique, administrative, fiscale.'
  }
];

const EXEMPLES = [
  {
    nom: 'Les Halles (1135–1971)',
    description: 'Ventre de Paris : alimentation centralisée, flux nocturnes, métabolisme commercial.'
  },
  {
    nom: 'Égouts de Paris (visitables)',
    description: 'Infrastructure organique souterraine. Le système digestif de la ville.'
  },
  {
    nom: 'Réseau de chaleur CPCU',
    description: 'Circulation d\'énergie sous les rues. Système sanguin thermique.'
  },
  {
    nom: 'Périphérique parisien',
    description: 'Frontière circulaire, flux automobile permanent, limite psychologique.'
  },
  {
    nom: 'Aqueducs (Arcueil, Médicis)',
    description: 'Alimentation en eau comme système vital. Infrastructure du métabolisme.'
  }
];

const ANECDOTES = [
  'Paris consomme 500 000 m³ d\'eau potable par jour. Le réseau fait 2 000 km.',
  'Avant Belgrand, l\'eau de la Seine servait à tout : boire, laver, évacuer.',
  'Le périphérique a créé une frontière psychologique plus forte que les anciennes murailles.',
  'Les égouts de Paris s\'étalent sur 2 400 km. Plus que le métro.',
  'La "ceinture rouge" désigne la banlieue ouvrière communiste qui entoure Paris.'
];

const LIVRES = [
  {
    auteur: 'Donald Reid',
    titre: 'Paris Sewers and Sewermen',
    pourquoi: 'Histoire technique et sociale du réseau souterrain parisien.'
  },
  {
    auteur: 'Annie Fourcaut',
    titre: 'La Banlieue en morceaux',
    pourquoi: 'Comprendre la frontière sociale Paris / périphérie.'
  },
  {
    auteur: 'Lewis Mumford',
    titre: 'La Cité à travers l\'histoire',
    pourquoi: 'Penser la ville comme organisme vivant.'
  }
];

export function SystemesCite({ onReturn, onTest }: SystemesCiteProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

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
          Cité
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
        className="systemes-layout"
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
            src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800"
            alt="Paris système cité"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div 
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '9px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#1A1A1A',
              opacity: 0.3
            }}
          >
            Visuel généré — ARCHÉ
          </div>
        </div>

        {/* Colonne droite — Contenu */}
        <div style={{ paddingBottom: '120px' }}>
          {/* Sous-titre */}
          <div 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              marginBottom: '32px'
            }}
          >
            Flux · Métabolisme · Frontière
          </div>

          {/* Principe */}
          <Section
            title="Principe"
            isOpen={openSection === 'principe'}
            onToggle={() => setOpenSection(openSection === 'principe' ? null : 'principe')}
          >
            <p 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                lineHeight: 1.7,
                color: '#1A1A1A',
                opacity: 0.7
              }}
            >
              {PRINCIPE}
            </p>
          </Section>

          {/* Jalons */}
          <Section
            title="Jalons"
            isOpen={openSection === 'jalons'}
            onToggle={() => setOpenSection(openSection === 'jalons' ? null : 'jalons')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {JALONS.map((jalon, i) => (
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
                    {jalon.periode} — {jalon.titre}
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
                    {jalon.texte}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Paris : exemples */}
          <Section
            title="Paris : exemples"
            isOpen={openSection === 'exemples'}
            onToggle={() => setOpenSection(openSection === 'exemples' ? null : 'exemples')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {EXEMPLES.map((ex, i) => (
                <div 
                  key={i}
                  style={{
                    borderLeft: '2px solid rgba(0, 61, 44, 0.2)',
                    paddingLeft: '16px'
                  }}
                >
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1A1A1A',
                      marginBottom: '6px'
                    }}
                  >
                    {ex.nom}
                  </div>
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      color: '#1A1A1A',
                      opacity: 0.6,
                      fontStyle: 'italic'
                    }}
                  >
                    {ex.description}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Anecdotes */}
          <Section
            title="Anecdotes"
            isOpen={openSection === 'anecdotes'}
            onToggle={() => setOpenSection(openSection === 'anecdotes' ? null : 'anecdotes')}
          >
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
          </Section>

          {/* Livres */}
          <Section
            title="Livres"
            isOpen={openSection === 'livres'}
            onToggle={() => setOpenSection(openSection === 'livres' ? null : 'livres')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {LIVRES.map((livre, i) => (
                <div 
                  key={i}
                  style={{
                    borderLeft: '1px solid rgba(26, 26, 26, 0.15)',
                    paddingLeft: '20px'
                  }}
                >
                  <div 
                    style={{
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#1A1A1A',
                      marginBottom: '4px'
                    }}
                  >
                    {livre.auteur} — <span style={{ fontStyle: 'italic' }}>{livre.titre}</span>
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
                    {livre.pourquoi}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* CTA */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '80px' }}>
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
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
            >
              Retour
            </button>
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .systemes-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// Section pliable
interface SectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, isOpen, onToggle, children }: SectionProps) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 0',
          cursor: 'pointer',
          borderBottom: '0.5px solid rgba(26, 26, 26, 0.1)'
        }}
      >
        <h2 
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#1A1A1A',
            opacity: 0.4
          }}
        >
          {title}
        </h2>

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

      {isOpen && (
        <div style={{ paddingTop: '24px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
