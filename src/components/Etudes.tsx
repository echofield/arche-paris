/**
 * ÉTUDES — Hub d'apprentissage
 * 
 * Principe directeur :
 * Ce n'est pas un menu, c'est une surface.
 * L'incomplétude est intentionnelle.
 * 
 * 6 secteurs :
 * - 3 actifs : FORMES, LANGAGES, SYSTÈMES
 * - 3 verrouillés : HISTOIRES, PRATIQUES, ORDRES
 * 
 * Les secteurs verrouillés existent sans explication.
 * Ils créent le sentiment d'un monde, pas d'une roadmap.
 */

import { useState } from 'react';
import { EtudesFormesV2 } from './EtudesFormesV2';
import { EtudesLangages } from './EtudesLangages';
import { EtudesSystemes } from './EtudesSystemes';

type SectorState = 'closed' | 'formes' | 'langages' | 'systemes';

interface EtudesProps {
  onClose: () => void;
}

interface Sector {
  id: string;
  name: string;
  active: boolean;
  description?: string;
}

const SECTORS: Sector[] = [
  { id: 'formes', name: 'FORMES', active: true },
  { id: 'langages', name: 'LANGAGES', active: true },
  { id: 'systemes', name: 'SYSTÈMES', active: true },
  { id: 'histoires', name: 'HISTOIRES', active: false },
  { id: 'pratiques', name: 'PRATIQUES', active: false },
  { id: 'ordres', name: 'ORDRES', active: false }
];

export function Etudes({ onClose }: EtudesProps) {
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
      {/* Bouton retour discret */}
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
          maxWidth: '900px',
          margin: '0 auto',
          paddingTop: '120px'
        }}
      >
        {/* En-tête */}
        <div 
          style={{
            textAlign: 'center',
            marginBottom: '96px'
          }}
        >
          <h1 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '46px',
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#1A1A1A',
              marginBottom: '24px'
            }}
          >
            ÉTUDES
          </h1>
          
          <p 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '17px',
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#1A1A1A',
              opacity: 0.6,
              maxWidth: '500px',
              margin: '0 auto'
            }}
          >
            Six surfaces d'apprentissage.
            <br />
            Trois sont ouvertes.
          </p>
        </div>

        {/* Grille des secteurs */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '32px',
            marginBottom: '96px'
          }}
        >
          {SECTORS.map((sector) => (
            <SectorCard
              key={sector.id}
              sector={sector}
              onClick={() => {
                if (sector.active) {
                  setCurrentSector(sector.id as SectorState);
                }
              }}
            />
          ))}
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
      onClick={sector.active ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={!sector.active}
      style={{
        background: 'white',
        border: '0.5px solid rgba(26, 26, 26, 0.1)',
        borderRadius: '0',
        padding: '48px 32px',
        textAlign: 'center',
        cursor: sector.active ? 'pointer' : 'default',
        opacity: sector.active ? 1 : 0.3,
        transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: sector.active && isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: sector.active && isHovered 
          ? '0 4px 16px rgba(26, 26, 26, 0.05)' 
          : '0 2px 8px rgba(26, 26, 26, 0.04)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Nom du secteur */}
      <div 
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '24px',
          fontWeight: 400,
          lineHeight: 1.3,
          letterSpacing: '0',
          color: '#1A1A1A',
          marginBottom: '16px'
        }}
      >
        {sector.name}
      </div>

      {/* Indicateur visuel discret pour les secteurs actifs */}
      {sector.active && (
        <div 
          style={{
            width: '24px',
            height: '1px',
            background: '#003D2C',
            margin: '0 auto',
            opacity: isHovered ? 0.6 : 0.2,
            transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      )}
    </button>
  );
}

// Bouton d'accès à ÉTUDES (bottom-right de la homepage)
interface EtudesEntryProps {
  onClick: () => void;
}

export function EtudesEntry({ onClick }: EtudesEntryProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '40px',
        right: '40px',
        background: 'white',
        border: '0.5px solid rgba(26, 26, 26, 0.1)',
        borderRadius: '0',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isHovered 
          ? '0 4px 16px rgba(26, 26, 26, 0.08)' 
          : '0 2px 8px rgba(26, 26, 26, 0.04)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        zIndex: 50
      }}
    >
      {/* Icône livre ouvert (simple) */}
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 16 16" 
        fill="none"
        style={{
          opacity: 0.6
        }}
      >
        <path 
          d="M2 2V14H14V2H2Z" 
          stroke="#1A1A1A" 
          strokeWidth="0.75"
          fill="none"
        />
        <path 
          d="M8 2V14" 
          stroke="#1A1A1A" 
          strokeWidth="0.75"
        />
        <path 
          d="M4 5H6M4 7H6M4 9H6" 
          stroke="#1A1A1A" 
          strokeWidth="0.75"
          strokeLinecap="round"
        />
        <path 
          d="M10 5H12M10 7H12M10 9H12" 
          stroke="#1A1A1A" 
          strokeWidth="0.75"
          strokeLinecap="round"
        />
      </svg>

      {/* Label */}
      <span 
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#1A1A1A',
          opacity: 0.6
        }}
      >
        ÉTUDES
      </span>
    </button>
  );
}