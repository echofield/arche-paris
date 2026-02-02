/**
 * SYSTÈMES — CARTE CITÉ
 * Flux · Métabolisme · Frontière
 * Layout aligned with Pouvoir: two columns (principle + exemples | jalons), no image.
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
  { auteur: 'Donald Reid', titre: 'Paris Sewers and Sewermen', pourquoi: 'Histoire technique et sociale du réseau souterrain parisien.' },
  { auteur: 'Annie Fourcaut', titre: 'La Banlieue en morceaux', pourquoi: 'Comprendre la frontière sociale Paris / périphérie.' },
  { auteur: 'Lewis Mumford', titre: 'La Cité à travers l\'histoire', pourquoi: 'Penser la ville comme organisme vivant.' }
];

export function SystemesCite({ onReturn, onTest }: SystemesCiteProps) {
  const [openExtra, setOpenExtra] = useState<'anecdotes' | 'livres' | null>(null);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        padding: 'clamp(24px, 5vw, 80px)'
      }}
    >
      {/* Header — Retour | Passer le test (like Pouvoir) */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto 64px',
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
            fontFamily: 'var(--font-sans), Inter, sans-serif',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#1A1A1A',
            opacity: 0.4,
            cursor: 'pointer',
            transition: 'opacity 400ms ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
        >
          ← Retour
        </button>

        <button
          onClick={onTest}
          style={{
            background: 'transparent',
            border: '0.5px solid rgba(0, 61, 44, 0.2)',
            padding: '12px 24px',
            fontFamily: 'var(--font-sans), Inter, sans-serif',
            fontSize: 10,
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
          Passer le test
        </button>
      </div>

      {/* Two columns — like Pouvoir: left = title + principle + exemples, right = jalons */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 'clamp(40px, 5vw, 80px)',
          alignItems: 'start'
        }}
        className="systemes-cite-layout"
      >
        {/* Left: Title + Principle + Paris exemples */}
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif), Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(48px, 6vw, 72px)',
              fontWeight: 400,
              lineHeight: 1.1,
              color: '#1A1A1A',
              marginBottom: 40
            }}
          >
            Cité
          </h1>

          <div
            style={{
              fontFamily: 'var(--font-sans), Inter, sans-serif',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#1A1A1A',
              opacity: 0.4,
              marginBottom: 32
            }}
          >
            Flux · Métabolisme · Frontière
          </div>

          <div
            style={{
              fontFamily: 'var(--font-sans), Inter, sans-serif',
              fontSize: 15,
              fontWeight: 400,
              lineHeight: 1.8,
              color: '#1A1A1A',
              marginBottom: 64
            }}
          >
            {PRINCIPE}
          </div>

          {/* Paris : exemples (like Anatomie du Commandement) */}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-sans), Inter, sans-serif',
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#1A1A1A',
                opacity: 0.4,
                marginBottom: 24
              }}
            >
              Paris : exemples
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {EXEMPLES.map((ex, i) => (
                <div key={i}>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif), Cormorant Garamond, Georgia, serif',
                      fontSize: 18,
                      fontWeight: 400,
                      lineHeight: 1.4,
                      color: '#1A1A1A',
                      marginBottom: 12
                    }}
                  >
                    {ex.nom}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans), Inter, sans-serif',
                      fontSize: 13,
                      fontWeight: 400,
                      lineHeight: 1.8,
                      color: '#1A1A1A',
                      opacity: 0.7
                    }}
                  >
                    {ex.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Jalons (timeline with dots, like Pouvoir) */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-sans), Inter, sans-serif',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#1A1A1A',
              opacity: 0.4,
              marginBottom: 32
            }}
          >
            Jalons
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {JALONS.map((jalon, i) => (
              <div
                key={i}
                style={{
                  borderLeft: '0.5px solid rgba(26, 26, 26, 0.15)',
                  paddingLeft: 32,
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: -4,
                    top: 6,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#1A1A1A'
                  }}
                />
                <div
                  style={{
                    fontFamily: 'var(--font-sans), Inter, sans-serif',
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    color: '#1A1A1A',
                    opacity: 0.5,
                    marginBottom: 8
                  }}
                >
                  {jalon.periode}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif), Cormorant Garamond, Georgia, serif',
                    fontSize: 20,
                    fontWeight: 400,
                    lineHeight: 1.3,
                    color: '#1A1A1A',
                    marginBottom: 12
                  }}
                >
                  {jalon.titre}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans), Inter, sans-serif',
                    fontSize: 14,
                    fontWeight: 400,
                    lineHeight: 1.8,
                    color: '#1A1A1A',
                    opacity: 0.7
                  }}
                >
                  {jalon.texte}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Optional: Anecdotes + Livres (collapsible) */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '64px auto 0',
          paddingTop: 48,
          borderTop: '0.5px solid rgba(26, 26, 26, 0.1)'
        }}
      >
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setOpenExtra(openExtra === 'anecdotes' ? null : 'anecdotes')}
            style={{
              background: 'transparent',
              border: '0.5px solid rgba(26, 26, 26, 0.15)',
              padding: '12px 20px',
              fontFamily: 'var(--font-sans), Inter, sans-serif',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#1A1A1A',
              opacity: 0.6,
              cursor: 'pointer'
            }}
          >
            Anecdotes
          </button>
          <button
            type="button"
            onClick={() => setOpenExtra(openExtra === 'livres' ? null : 'livres')}
            style={{
              background: 'transparent',
              border: '0.5px solid rgba(26, 26, 26, 0.15)',
              padding: '12px 20px',
              fontFamily: 'var(--font-sans), Inter, sans-serif',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#1A1A1A',
              opacity: 0.6,
              cursor: 'pointer'
            }}
          >
            Livres
          </button>
        </div>
        {openExtra === 'anecdotes' && (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ANECDOTES.map((anecdote, i) => (
              <p
                key={i}
                style={{
                  fontFamily: 'var(--font-sans), Inter, sans-serif',
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: '#1A1A1A',
                  opacity: 0.6,
                  paddingLeft: 16,
                  borderLeft: '1px solid rgba(26, 26, 26, 0.1)'
                }}
              >
                {anecdote}
              </p>
            ))}
          </div>
        )}
        {openExtra === 'livres' && (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {LIVRES.map((livre, i) => (
              <div
                key={i}
                style={{
                  borderLeft: '1px solid rgba(26, 26, 26, 0.15)',
                  paddingLeft: 20
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-serif), Cormorant Garamond, Georgia, serif',
                    fontSize: 16,
                    fontWeight: 500,
                    color: '#1A1A1A',
                    marginBottom: 4
                  }}
                >
                  {livre.auteur} — <span style={{ fontStyle: 'italic' }}>{livre.titre}</span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans), Inter, sans-serif',
                    fontSize: 13,
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
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .systemes-cite-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
