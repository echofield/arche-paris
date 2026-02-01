/**
 * FIELD MODE — Champ perceptif
 * Pas une carte. Un instrument d'orientation.
 * 
 * ARCHITECTURE DES ÉTATS :
 * 
 * État I — SILENCE (0 - 0.35)
 *   Tu es dans la ville, mais elle ne te parle pas encore.
 *   Couleur neutre, aiguille stable, pas de vibration.
 *   Sensation : "Je marche, mais je ne suis pas encore regardé."
 * 
 * État II — RÉSONANCE (0.35 - 0.70)
 *   Tu entres dans un champ symbolique.
 *   Saturation monte, micro-pulsation, wobble magnétique.
 *   PAS DE TEXTE — le corps comprend avant l'intellect.
 *   Sensation : "Quelque chose me repère."
 * 
 * État III — PRÉSENCE (0.70 - 1.0)
 *   Tu es dans l'axe. Aligné.
 *   Couleur dense, aiguille fixe, vibration lente.
 *   Un ÉCHO apparaît. Pas une instruction. Une permission.
 *   Sensation : "Ici, quelque chose a commencé."
 * 
 * ÉCHOS — Mode Marche V2
 *   - Déclenchement toutes les 50-120m (simulé)
 *   - Intensité selon proximité
 *   - Jamais deux fois le même
 *   - Compatible vibration/couleur/son
 *   - Mode mental, pas savoir
 */

import { useState, useEffect } from 'react';
import echosData from '../data/echos.json';

interface FieldModeProps {
  onExit: () => void;
}

type FieldState = 'silence' | 'resonance' | 'presence';

interface Echo {
  id: string;
  zone: string;
  era_tag: string[];
  theme: string[];
  echo: string;
}

// Points d'ancrage parisiens (deprecated, remplacés par échos)
const ANCHOR_POINTS = echosData as Echo[];

export function FieldMode({ onExit }: FieldModeProps) {
  const [worldRotation, setWorldRotation] = useState(0);
  const [needleRotation, setNeedleRotation] = useState(0);
  const [needleVelocity, setNeedleVelocity] = useState(0); // Vitesse de l'aiguille
  const [proximity, setProximity] = useState(0.15); // Commence en silence
  const [fieldState, setFieldState] = useState<FieldState>('silence');
  const [currentLabel, setCurrentLabel] = useState<string | null>(null);
  const [currentEchoId, setCurrentEchoId] = useState<string | null>(null);
  const [usedEchoIds, setUsedEchoIds] = useState<Set<string>>(new Set()); // Tracker les échos déjà montrés
  const [firstTime, setFirstTime] = useState(true);

  // Déterminer l'état du champ selon proximité
  const getFieldState = (prox: number): FieldState => {
    if (prox > 0.70) return 'presence';
    if (prox > 0.35) return 'resonance';
    return 'silence';
  };

  // Visuels selon l'état
  const getFieldVisuals = (state: FieldState) => {
    switch (state) {
      case 'silence':
        return {
          color: 'rgba(0, 61, 44, 0.03)',
          scale: 1,
          opacity: 0.3,
          pulseSpeed: 0,
          showRipples: false,
          showHalo: false,
          needleOpacity: 0.5
        };
      case 'resonance':
        return {
          color: 'rgba(0, 61, 44, 0.12)',
          scale: 1.05,
          opacity: 0.5,
          pulseSpeed: 4,
          showRipples: true,
          showHalo: false,
          needleOpacity: 0.65
        };
      case 'presence':
        return {
          color: 'rgba(0, 61, 44, 0.25)',
          scale: 1.08,
          opacity: 0.75,
          pulseSpeed: 6,
          showRipples: true,
          showHalo: true,
          needleOpacity: 0.8
        };
    }
  };

  // Message selon l'état
  const getStateMessage = (state: FieldState): string | null => {
    if (state === 'presence' && currentLabel) {
      return currentLabel;
    }
    // ÉTAT I — SILENCE : silence total, aucun texte
    return null;
  };

  // Calculer alignement entre aiguille et nord
  const getAlignment = () => {
    const diff = Math.abs((needleRotation % 360) - (worldRotation % 360));
    return diff < 15 || diff > 345;
  };

  // Simuler l'orientation du monde et la recherche magnétique
  useEffect(() => {
    // La croix cardinale tourne lentement (le monde tourne autour de toi)
    const worldInterval = setInterval(() => {
      setWorldRotation(prev => (prev + 0.3) % 360);
    }, 50);

    // L'aiguille cherche le nord avec friction
    const needleInterval = setInterval(() => {
      setNeedleRotation(prev => {
        const target = 0;
        const diff = target - (prev % 360);
        const friction = fieldState === 'presence' ? 0.08 : 0.05; // Plus stable en présence
        return prev + diff * friction;
      });
    }, 50);

    // Simulation de proximité (ondulation lente)
    let proximityValue = 0.15;
    let direction = 1;
    const proximityInterval = setInterval(() => {
      // Oscillation organique
      proximityValue += direction * 0.02;
      
      if (proximityValue > 0.9) direction = -1;
      if (proximityValue < 0.1) direction = 1;
      
      setProximity(proximityValue);
      
      // Mettre à jour l'état
      const newState = getFieldState(proximityValue);
      setFieldState(newState);
      
      // Label n'apparaît qu'en état PRÉSENCE
      if (newState === 'presence' && !currentLabel) {
        // Choisir un écho qui n'a pas encore été montré
        const availableEchos = ANCHOR_POINTS.filter(echo => !usedEchoIds.has(echo.id));
        
        // Si tous les échos ont été montrés, reset
        if (availableEchos.length === 0) {
          setUsedEchoIds(new Set());
        }
        
        const echosToUse = availableEchos.length > 0 ? availableEchos : ANCHOR_POINTS;
        const randomEcho = echosToUse[Math.floor(Math.random() * echosToUse.length)];
        
        setCurrentLabel(randomEcho.echo);
        setCurrentEchoId(randomEcho.id);
        setUsedEchoIds(prev => new Set([...prev, randomEcho.id]));
        
        // Le label disparaît après 5 secondes (définitivement)
        setTimeout(() => {
          setCurrentLabel(null);
          setCurrentEchoId(null);
        }, 5000);
      } else if (newState !== 'presence') {
        // Si on sort de l'état présence, le label disparaît
        setCurrentLabel(null);
        setCurrentEchoId(null);
      }
    }, 150);

    // Message de première fois disparaît après 6s
    const firstTimeTimeout = setTimeout(() => {
      setFirstTime(false);
    }, 6000);

    return () => {
      clearInterval(worldInterval);
      clearInterval(needleInterval);
      clearInterval(proximityInterval);
      clearTimeout(firstTimeTimeout);
    };
  }, [fieldState, currentLabel, usedEchoIds, currentEchoId]);

  const visuals = getFieldVisuals(fieldState);
  const message = getStateMessage(fieldState);
  const isAligning = getAlignment();

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#FAF8F2',
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        zIndex: 2000,
        transition: 'background-color 2s ease-out'
      }}
    >
      {/* Bouton sortie (minimal) */}
      <button
        onClick={onExit}
        style={{
          position: 'fixed',
          top: '40px',
          right: '40px',
          background: 'transparent',
          border: 'none',
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#1A1A1A',
          opacity: 0.2,
          cursor: 'pointer',
          transition: 'opacity 600ms ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.5'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.2'}
      >
        ×
      </button>

      {/* Champ central */}
      <div 
        style={{
          position: 'relative',
          width: '320px',
          height: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Cercles concentriques (seulement en RÉSONANCE et PRÉSENCE) */}
        {visuals.showRipples && (
          <>
            <div 
              style={{
                position: 'absolute',
                width: '280px',
                height: '280px',
                borderRadius: '50%',
                border: `0.5px solid ${visuals.color}`,
                transform: `scale(${visuals.scale})`,
                transition: 'all 2s ease-out',
                animation: `ripple ${visuals.pulseSpeed}s ease-out infinite`
              }}
            />
            <div 
              style={{
                position: 'absolute',
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                border: `0.5px solid ${visuals.color}`,
                transform: `scale(${visuals.scale})`,
                transition: 'all 2s ease-out',
                animation: `ripple ${visuals.pulseSpeed}s ease-out infinite 1.5s`
              }}
            />
          </>
        )}

        {/* Cercle principal */}
        <div 
          style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            border: '0.5px solid rgba(26, 26, 26, 0.15)',
            background: visuals.color,
            transform: `scale(${visuals.scale})`,
            transition: 'all 2s ease-out'
          }}
        />

        {/* CROIX CARDINALE (tourne avec le monde) */}
        <div 
          style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            transform: `rotate(${worldRotation}deg)`,
            transition: 'transform 0.3s ease-out'
          }}
        >
          {/* Tick Nord (autorité — plus long) */}
          <div 
            style={{
              position: 'absolute',
              top: '0',
              left: '50%',
              width: '0.5px',
              height: '18px',
              background: '#1A1A1A',
              opacity: 0.3,
              transform: 'translateX(-50%)'
            }}
          />
          {/* Tick Est (circulation — équilibré) */}
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              right: '0',
              width: '14px',
              height: '0.5px',
              background: '#1A1A1A',
              opacity: 0.2,
              transform: 'translateY(-50%)'
            }}
          />
          {/* Tick Sud (mémoire — plus léger) */}
          <div 
            style={{
              position: 'absolute',
              bottom: '0',
              left: '50%',
              width: '0.5px',
              height: '12px',
              background: '#1A1A1A',
              opacity: 0.15,
              transform: 'translateX(-50%)'
            }}
          />
          {/* Tick Ouest (circulation — équilibré) */}
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              width: '14px',
              height: '0.5px',
              background: '#1A1A1A',
              opacity: 0.2,
              transform: 'translateY(-50%)'
            }}
          />

          {/* Lettre N (seule autorité cardinale — serif, fine, respirante) */}
          <div 
            style={{
              position: 'absolute',
              top: '-32px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '16px',
              fontWeight: 300,
              letterSpacing: '0.2em',
              color: '#1A1A1A',
              opacity: 0.4
            }}
          >
            N
          </div>
        </div>

        {/* AIGUILLE (asymétrique, cherche le nord) */}
        <div 
          style={{
            position: 'absolute',
            width: '2px',
            height: '90px',
            background: `linear-gradient(to bottom, #003D2C 0%, #003D2C 45%, rgba(0, 61, 44, 0.3) 55%, rgba(0, 61, 44, 0.1) 100%)`,
            transform: `rotate(${needleRotation}deg) ${isAligning && fieldState === 'resonance' ? 'scale(1.02)' : 'scale(1)'}`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease-out',
            opacity: visuals.needleOpacity,
            animation: isAligning && fieldState === 'resonance' ? 'magneticWobble 0.4s ease-in-out infinite' : 'none'
          }}
        />

        {/* CENTRE = TOI (fixe, jamais ne bouge) */}
        <div 
          style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#003D2C',
            opacity: 0.6,
            boxShadow: '0 0 0 2px rgba(0, 61, 44, 0.1)'
          }}
        />

        {/* Halo de vibration (seulement en PRÉSENCE) */}
        {visuals.showHalo && (
          <div 
            style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 61, 44, 0.1) 0%, transparent 70%)',
              animation: 'pulsePresence 3s ease-in-out infinite'
            }}
          />
        )}
      </div>

      {/* Message de première fois */}
      {firstTime && (
        <div 
          style={{
            position: 'absolute',
            bottom: '160px',
            textAlign: 'center',
            animation: 'fadeInOut 6s ease-in-out'
          }}
        >
          <div 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '22px',
              fontWeight: 300,
              lineHeight: 1.8,
              color: '#1A1A1A',
              opacity: 0.6,
              letterSpacing: '0.02em'
            }}
          >
            Oriente-toi. La ville répond.
          </div>
        </div>
      )}

      {/* Message d'état (apparaît selon l'état) */}
      {!firstTime && message && (
        <div 
          key={message} // Force re-render pour animation
          style={{
            position: 'absolute',
            bottom: '120px',
            maxWidth: '400px',
            textAlign: 'center',
            animation: fieldState === 'presence' ? 'fadeInStay 2s ease-in-out forwards' : 'fadeInOutSlow 5s ease-in-out infinite'
          }}
        >
          <div 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: fieldState === 'presence' ? '20px' : '18px',
              fontWeight: 300,
              lineHeight: 1.8,
              color: '#1A1A1A',
              opacity: fieldState === 'presence' ? 0.75 : 0.3,
              letterSpacing: '0.02em',
              fontStyle: fieldState === 'silence' ? 'italic' : 'normal',
              transition: 'all 1.5s ease-out'
            }}
          >
            {message}
          </div>
        </div>
      )}

      {/* Indicateur d'état discret (debug, optionnel) */}
      <div 
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '8px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#1A1A1A',
          opacity: 0.15
        }}
      >
        {fieldState === 'silence' && '—'}
        {fieldState === 'resonance' && '· ·'}
        {fieldState === 'presence' && '●'}
      </div>

      <style>{`
        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        @keyframes pulsePresence {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.2;
          }
        }

        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          20%, 80% {
            opacity: 0.6;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-10px);
          }
        }

        @keyframes fadeInStay {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 0.75;
            transform: translateY(0);
          }
        }

        @keyframes fadeInOutSlow {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.35;
          }
        }

        @keyframes magneticWobble {
          0%, 100% {
            transform: rotate(${needleRotation}deg) scale(1);
          }
          25% {
            transform: rotate(${needleRotation - 0.8}deg) scale(1.02);
          }
          75% {
            transform: rotate(${needleRotation + 0.8}deg) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}