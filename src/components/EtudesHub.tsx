/**
 * ÉTUDES — Hub principal (version définitive V1)
 * 
 * Principe directeur :
 * "ARCHÉ n'enseigne pas. ARCHÉ rend visible."
 * 
 * Structure :
 * - 3 secteurs actifs : FORMES, LANGAGES, SYSTÈMES
 * - 1 exercice séparé : ACCÉLÉRATION
 * 
 * Design :
 * - Cartes claires, fond texturé
 * - Typographie élégante
 * - Cadres fins, rythme lent
 * - Traversée, pas cours
 */

import { useState } from 'react';
import { EtudesFormesV2 } from './EtudesFormesV2';
import { EtudesLangages } from './EtudesLangages';
import { EtudesSystemes } from './EtudesSystemes';
import { FormesAcceleration } from './FormesAcceleration';

type SectorState = 'closed' | 'formes' | 'langages' | 'systemes' | 'acceleration' | 'histoire';

interface EtudesHubProps {
  onClose: () => void;
}

interface Sector {
  id: string;
  name: string;
  subtitle: string;
  functions: string[];
}

const SECTORS: Sector[] = [
  {
    id: 'formes',
    name: 'FORMES',
    subtitle: 'Colonne · Axe · Seuil',
    functions: [
      'Voir avant de nommer',
      'Lire l\'espace',
      'Reconnaître les structures invisibles'
    ]
  },
  {
    id: 'langages',
    name: 'LANGAGES',
    subtitle: 'Mot · Rythme · Accélération',
    functions: [
      'Lire autrement',
      'Percevoir la vitesse',
      'Observer l\'effet du langage sur l\'attention'
    ]
  },
  {
    id: 'systemes',
    name: 'SYSTÈMES',
    subtitle: 'Flux · Organisation · Conséquences',
    functions: [
      'Comprendre sans juger',
      'Voir ce que les systèmes produisent'
    ]
  }
];

export function EtudesHub({ onClose }: EtudesHubProps) {
  const [currentSector, setCurrentSector] = useState<SectorState>('closed');

  // Rendu du secteur actif
  if (currentSector === 'formes') {
    return <EtudesFormesV2 onReturn={() => setCurrentSector('closed')} />;
  }
  
  if (currentSector === 'langages') {
    return <EtudesLangages onReturn={() => setCurrentSector('closed')} />;
  }
  
  if (currentSector === 'systemes') {
    return <EtudesSystemes onReturn={() => setCurrentSector('closed')} />;
  }

  if (currentSector === 'acceleration') {
    return <FormesAcceleration onComplete={() => setCurrentSector('closed')} />;
  }

  // Histoire section
  if (currentSector === 'histoire') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#FAF8F2',
          padding: 'clamp(24px, 5vw, 80px)',
          position: 'relative'
        }}
      >
        <button
          onClick={() => setCurrentSector('closed')}
          style={{
            position: 'fixed',
            top: '40px',
            left: '40px',
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
            transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 100
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
        >
          ← Retour
        </button>

        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            paddingTop: '120px'
          }}
        >
          <h1
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 400,
              color: '#1A1A1A',
              marginBottom: '48px',
              textAlign: 'center'
            }}
          >
            Histoire
          </h1>

          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '18px',
              lineHeight: 1.8,
              color: '#1A1A1A',
              opacity: 0.8
            }}
          >
            <p style={{ marginBottom: '24px' }}>
              Paris est une ville de couches. Chaque epoque a depose sa trace,
              visible ou invisible, dans la pierre, les noms, les gestes.
            </p>
            <p style={{ marginBottom: '24px' }}>
              L'Histoire, dans ARCHE, n'est pas un cours. C'est une traversee.
              Nous ne cherchons pas a tout savoir, mais a voir autrement ce qui
              est deja la.
            </p>
            <p style={{ marginBottom: '24px', fontStyle: 'italic', opacity: 0.6 }}>
              Contenu a venir...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Hub principal
  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        padding: 'clamp(24px, 5vw, 80px)',
        position: 'relative'
      }}
    >
      {/* Bouton retour */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '40px',
          left: '40px',
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
          transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 100
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
      >
        ← Retour
      </button>

      {/* Container central */}
      <div 
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '120px'
        }}
      >
        {/* Les 3 secteurs actifs - grille horizontale */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px',
            marginBottom: '120px'
          }}
        >
          {SECTORS.map((sector) => (
            <SectorCard
              key={sector.id}
              sector={sector}
              onClick={() => setCurrentSector(sector.id as SectorState)}
            />
          ))}
        </div>

        {/* HISTOIRE (section inside Etudes) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <button
            onClick={() => setCurrentSector('histoire')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.15)';
            }}
            style={{
              width: '100%',
              maxWidth: '400px',
              background: 'transparent',
              border: '0.5px solid rgba(0, 61, 44, 0.15)',
              padding: '48px 40px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '28px',
                fontWeight: 400,
                lineHeight: 1.3,
                color: '#003D2C',
                marginBottom: '20px'
              }}
            >
              Histoire
            </div>

            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 400,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#1A1A1A',
                opacity: 0.4
              }}
            >
              MEMOIRE · TRACES · COUCHES
            </div>
          </button>
        </div>

        {/* ACCELERATION (separee, plus petite) */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setCurrentSector('acceleration')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.15)';
            }}
            style={{
              width: '100%',
              maxWidth: '400px',
              background: 'transparent',
              border: '0.5px solid rgba(0, 61, 44, 0.15)',
              padding: '48px 40px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div 
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '28px',
                fontWeight: 400,
                lineHeight: 1.3,
                color: '#003D2C',
                marginBottom: '20px'
              }}
            >
              Accélération
            </div>
            
            <div 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 400,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#1A1A1A',
                opacity: 0.4
              }}
            >
              EXERCICE · PERCEPTIF
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Carte de secteur
interface SectorCardProps {
  sector: Sector;
  onClick: () => void;
}

function SectorCard({ sector, onClick }: SectorCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: '0.5px solid rgba(26, 26, 26, 0.15)',
        padding: '80px 40px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
        borderColor: isHovered ? 'rgba(26, 26, 26, 0.3)' : 'rgba(26, 26, 26, 0.15)',
        minHeight: '320px'
      }}
    >
      {/* Nom du secteur */}
      <div 
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '40px',
          fontWeight: 400,
          lineHeight: 1.2,
          color: '#1A1A1A',
          marginBottom: '32px'
        }}
      >
        {sector.name.charAt(0) + sector.name.slice(1).toLowerCase()}
      </div>

      {/* Sous-titre */}
      <div 
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          lineHeight: 1.8,
          color: '#1A1A1A',
          opacity: 0.4
        }}
      >
        {sector.subtitle}
      </div>
    </button>
  );
}