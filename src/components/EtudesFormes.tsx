/**
 * ÉTUDES — Secteur FORMES
 * 
 * Entraîner l'œil : structure, proportion, alignement.
 * 
 * Une seule porte en V1.
 * 
 * Structure :
 * - Ouverture : Texte de cadrage court (3 lignes max)
 * - Arche : Pattern visuel + diagramme + référence Paris
 * - Pratique : Instruction simple (regarder, dessiner, aligner)
 * - Clôture : Une phrase, retour au hub
 * 
 * Pas d'histoire de l'art, pas de galerie, pas de progression.
 */

import { useState } from 'react';

interface EtudesFormesProps {
  onReturn: () => void;
}

export function EtudesFormes({ onReturn }: EtudesFormesProps) {
  const [stage, setStage] = useState<'opening' | 'arche' | 'practice' | 'closure'>('opening');

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
        onClick={onReturn}
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
        ← ÉTUDES
      </button>

      {/* Container central */}
      <div 
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          paddingTop: '120px'
        }}
      >
        {stage === 'opening' && <Opening onContinue={() => setStage('arche')} />}
        {stage === 'arche' && <Arche onContinue={() => setStage('practice')} />}
        {stage === 'practice' && <Practice onContinue={() => setStage('closure')} />}
        {stage === 'closure' && <Closure onReturn={onReturn} />}
      </div>
    </div>
  );
}

// Ouverture
function Opening({ onContinue }: { onContinue: () => void }) {
  return (
    <div style={{ textAlign: 'center' }}>
      {/* Titre */}
      <div 
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#1A1A1A',
          opacity: 0.4,
          marginBottom: '24px'
        }}
      >
        FORMES
      </div>

      <h2 
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '32px',
          fontWeight: 400,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          color: '#1A1A1A',
          marginBottom: '48px'
        }}
      >
        La forme précède le sens.
      </h2>

      {/* Texte de cadrage */}
      <p 
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '17px',
          fontWeight: 400,
          lineHeight: 1.6,
          color: '#1A1A1A',
          opacity: 0.7,
          marginBottom: '64px',
          maxWidth: '500px',
          margin: '0 auto 64px'
        }}
      >
        Avant de nommer, on voit. Avant de comprendre, on reconnaît une structure.
        <br /><br />
        Cette étude entraîne l'œil à voir la géométrie sous-jacente.
      </p>

      {/* Bouton continuer */}
      <button
        onClick={onContinue}
        style={{
          background: 'transparent',
          border: '0.5px solid rgba(26, 26, 26, 0.2)',
          padding: '16px 32px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#1A1A1A',
          opacity: 0.6,
          cursor: 'pointer',
          transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.2)';
        }}
      >
        Continuer
      </button>
    </div>
  );
}

// Arche
function Arche({ onContinue }: { onContinue: () => void }) {
  return (
    <div>
      {/* Pattern géométrique : Axe de Paris (simplifié) */}
      <div 
        style={{
          marginBottom: '64px',
          background: 'white',
          border: '0.5px solid rgba(26, 26, 26, 0.1)',
          padding: '64px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px'
        }}
      >
        {/* Diagramme : Axe historique de Paris */}
        <svg width="500" height="300" viewBox="0 0 500 300">
          {/* Ligne centrale (axe) */}
          <line 
            x1="50" y1="150" 
            x2="450" y2="150" 
            stroke="#003D2C" 
            strokeWidth="1" 
            opacity="0.3"
          />
          
          {/* Points de repère */}
          <circle cx="100" cy="150" r="4" fill="#003D2C" opacity="0.6" />
          <text x="100" y="180" textAnchor="middle" fontSize="11" fill="#1A1A1A" opacity="0.5">
            Louvre
          </text>
          
          <circle cx="250" cy="150" r="4" fill="#003D2C" opacity="0.6" />
          <text x="250" y="180" textAnchor="middle" fontSize="11" fill="#1A1A1A" opacity="0.5">
            Concorde
          </text>
          
          <circle cx="400" cy="150" r="4" fill="#003D2C" opacity="0.6" />
          <text x="400" y="180" textAnchor="middle" fontSize="11" fill="#1A1A1A" opacity="0.5">
            Arc
          </text>
          
          {/* Rectangles (bâtiments stylisés) */}
          <rect x="85" y="130" width="30" height="40" fill="none" stroke="#1A1A1A" strokeWidth="0.75" opacity="0.3" />
          <rect x="385" y="120" width="30" height="60" fill="none" stroke="#1A1A1A" strokeWidth="0.75" opacity="0.3" />
          
          {/* Lignes de symétrie */}
          <line x1="250" y1="50" x2="250" y2="250" stroke="#003D2C" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.2" />
        </svg>
      </div>

      {/* Légende */}
      <p 
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '15px',
          fontWeight: 400,
          lineHeight: 1.6,
          color: '#1A1A1A',
          opacity: 0.6,
          textAlign: 'center',
          marginBottom: '48px'
        }}
      >
        L'axe historique de Paris : Louvre → Concorde → Arc de Triomphe.
        <br />
        Avant d'être des monuments, ce sont des points sur une ligne.
      </p>

      {/* Bouton continuer */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onContinue}
          style={{
            background: 'transparent',
            border: '0.5px solid rgba(26, 26, 26, 0.2)',
            padding: '16px 32px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#1A1A1A',
            opacity: 0.6,
            cursor: 'pointer',
            transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.6';
            e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.2)';
          }}
        >
          Pratique
        </button>
      </div>
    </div>
  );
}

// Pratique
function Practice({ onContinue }: { onContinue: () => void }) {
  return (
    <div style={{ textAlign: 'center' }}>
      {/* Instructions */}
      <h3 
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '24px',
          fontWeight: 400,
          lineHeight: 1.3,
          letterSpacing: '0',
          color: '#1A1A1A',
          marginBottom: '32px'
        }}
      >
        Exercice
      </h3>

      <div 
        style={{
          background: 'white',
          border: '0.5px solid rgba(26, 26, 26, 0.1)',
          padding: '48px',
          marginBottom: '48px',
          textAlign: 'left'
        }}
      >
        <ol 
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '17px',
            fontWeight: 400,
            lineHeight: 1.8,
            color: '#1A1A1A',
            opacity: 0.7,
            paddingLeft: '20px'
          }}
        >
          <li style={{ marginBottom: '16px' }}>
            Regarde l'espace autour de toi.
          </li>
          <li style={{ marginBottom: '16px' }}>
            Identifie trois lignes : une horizontale, une verticale, une diagonale.
          </li>
          <li style={{ marginBottom: '16px' }}>
            Dessine-les mentalement. Pas besoin de papier.
          </li>
          <li>
            Reste immobile 30 secondes.
          </li>
        </ol>
      </div>

      <p 
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '15px',
          fontWeight: 400,
          lineHeight: 1.6,
          color: '#1A1A1A',
          opacity: 0.5,
          fontStyle: 'italic',
          marginBottom: '48px'
        }}
      >
        Pas de validation. Pas de résultat à uploader.
        <br />
        La pratique est l'attention elle-même.
      </p>

      {/* Bouton terminer */}
      <button
        onClick={onContinue}
        style={{
          background: 'transparent',
          border: '0.5px solid rgba(26, 26, 26, 0.2)',
          padding: '16px 32px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#1A1A1A',
          opacity: 0.6,
          cursor: 'pointer',
          transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.2)';
        }}
      >
        Terminer
      </button>
    </div>
  );
}

// Clôture
function Closure({ onReturn }: { onReturn: () => void }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p 
        style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '24px',
          fontWeight: 400,
          lineHeight: 1.4,
          letterSpacing: '0',
          color: '#1A1A1A',
          marginBottom: '64px',
          opacity: 0.7
        }}
      >
        La géométrie ne s'apprend pas.
        <br />
        Elle se reconnaît.
      </p>

      {/* Bouton retour */}
      <button
        onClick={onReturn}
        style={{
          background: 'transparent',
          border: '0.5px solid rgba(26, 26, 26, 0.2)',
          padding: '16px 32px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#1A1A1A',
          opacity: 0.6,
          cursor: 'pointer',
          transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.2)';
        }}
      >
        Retour aux études
      </button>
    </div>
  );
}
