import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackButton } from './BackButton';
import { useTranslation } from '../utils/i18n';

interface OrigineMapProps {
  onBack: () => void;
}

// --- DATA MODEL : 6 POINTS DE QUÊTE ---

type PoiData = {
  id: string;
  numeral: string;
  name: string;
  phrase: string;
  validationType: 'photo' | 'text';
  x: number;
  y: number;
  weight: 'normal' | 'ancient' | 'light' | 'heavy' | 'mute' | 'central';
  revealRadius: number;
};

// Technical data (non-translatable) - keyed by translation ID
const POI_TECHNICAL: Record<string, {
  poiId: string;
  validationType: 'photo' | 'text';
  x: number;
  y: number;
  weight: 'normal' | 'ancient' | 'light' | 'heavy' | 'mute' | 'central';
  revealRadius: number;
}> = {
  'p01': { poiId: 'poi_01', validationType: 'photo', x: 52, y: 48, weight: 'normal', revealRadius: 18 },
  'p02': { poiId: 'poi_02', validationType: 'photo', x: 38, y: 52, weight: 'ancient', revealRadius: 22 },
  'p03': { poiId: 'poi_03', validationType: 'photo', x: 58, y: 44, weight: 'light', revealRadius: 12 },
  'p04': { poiId: 'poi_04', validationType: 'photo', x: 48, y: 62, weight: 'heavy', revealRadius: 20 },
  'p05': { poiId: 'poi_05', validationType: 'text', x: 42, y: 38, weight: 'mute', revealRadius: 15 },
  'p06': { poiId: 'poi_06', validationType: 'photo', x: 48, y: 50, weight: 'central', revealRadius: 25 }
};

// --- TYPES GRAPHIQUES ---

type Point = {
  id: string;
  x: number;
  y: number;
  type: 'void' | 'node' | 'poi';
  poiId?: string;
};

type Edge = {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'street' | 'axis' | 'seine';
};

// --- PARAMÈTRES ---

const CANVAS_SIZE = 100; // viewBox 100x100
const NODE_COUNT = 350;
const CONNECTIVITY_RADIUS = 6;
const REVEAL_RADIUS = 18;

const distance = (p1: Point, p2: Point) => 
  Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

/**
 * ORIGINE — THRESHOLD MAP
 * Système de révélation progressive par validation de points de quête.
 */
export function OrigineMap({ onBack }: OrigineMapProps) {
  const { t, tArray } = useTranslation();

  // Merge translations with technical data
  const QUETE_POINTS = useMemo((): PoiData[] => {
    const points = tArray('origin.points') as { id: string; numeral: string; name: string; phrase: string }[];
    return points.map(p => {
      const tech = POI_TECHNICAL[p.id];
      return {
        id: tech?.poiId || p.id,
        numeral: p.numeral,
        name: p.name,
        phrase: p.phrase,
        validationType: tech?.validationType || 'photo',
        x: tech?.x || 50,
        y: tech?.y || 50,
        weight: tech?.weight || 'normal',
        revealRadius: tech?.revealRadius || 18
      };
    });
  }, [tArray]);

  // --- ÉTAT ---
  const [nodes, setNodes] = useState<Point[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [revealedEdgeIds, setRevealedEdgeIds] = useState<Set<string>>(new Set());
  const [completedPois, setCompletedPois] = useState<Set<string>>(new Set());
  const [activePoi, setActivePoi] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');

  // --- GÉNÉRATION PROCÉDURALE (MOUNT) ---
  useEffect(() => {
    const newNodes: Point[] = [];
    const newEdges: Edge[] = [];

    // 1. AXES HARDCODÉS — SEINE (courbe sinueuse centrale)
    const seineNodes: Point[] = [];
    for (let i = 0; i <= 20; i++) {
      const x = (i / 20) * 100;
      const y = 50 + Math.sin(i * 0.4) * 8 + Math.sin(i * 0.15) * 3;
      const p: Point = { id: `seine_${i}`, x, y, type: 'void' };
      newNodes.push(p);
      seineNodes.push(p);
      
      if (i > 0) {
        newEdges.push({
          id: `seine_edge_${i}`,
          sourceId: seineNodes[i - 1].id,
          targetId: p.id,
          type: 'seine'
        });
      }
    }

    // 2. ÎLE DE LA CITÉ (ellipse centrale)
    const ileCenter = { x: 48, y: 50 };
    const ileNodes: Point[] = [];
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const x = ileCenter.x + Math.cos(angle) * 8;
      const y = ileCenter.y + Math.sin(angle) * 3;
      const p: Point = { id: `ile_${angle}`, x, y, type: 'void' };
      newNodes.push(p);
      ileNodes.push(p);
    }
    // Connecter l'île en boucle
    ileNodes.forEach((n, i) => {
      const next = ileNodes[(i + 1) % ileNodes.length];
      newEdges.push({
        id: `ile_edge_${i}`,
        sourceId: n.id,
        targetId: next.id,
        type: 'axis'
      });
    });

    // 3. CARDO MAXIMUS (axe vertical sud)
    for (let y = 50; y <= 75; y += 5) {
      const p: Point = { id: `cardo_${y}`, x: 48, y, type: 'void' };
      newNodes.push(p);
      if (y > 50) {
        const prev = newNodes.find(n => n.id === `cardo_${y - 5}`);
        if (prev) {
          newEdges.push({
            id: `cardo_edge_${y}`,
            sourceId: prev.id,
            targetId: p.id,
            type: 'axis'
          });
        }
      }
    }

    // 4. REMPART (arc incomplet nord)
    for (let angle = Math.PI * 0.8; angle <= Math.PI * 2.2; angle += Math.PI / 12) {
      const x = 48 + Math.cos(angle) * 18;
      const y = 50 + Math.sin(angle) * 18;
      const p: Point = { id: `rempart_${angle}`, x, y, type: 'void' };
      newNodes.push(p);
    }

    // 5. TISSU URBAIN PROCÉDURAL (300-350 nodes)
    let attempts = 0;
    while (newNodes.length < NODE_COUNT && attempts < 3000) {
      attempts++;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      
      // Densité plus forte au centre
      const distFromCenter = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
      const acceptance = Math.max(0.1, 1 - (distFromCenter / 40));
      
      if (Math.random() > acceptance) continue;

      // Vérif distance min
      const tooClose = newNodes.some(n => 
        Math.sqrt(Math.pow(n.x - x, 2) + Math.pow(n.y - y, 2)) < 2
      );
      
      if (!tooClose) {
        newNodes.push({ id: `n_${newNodes.length}`, x, y, type: 'node' });
      }
    }

    // 6. TISSER LE RÉSEAU (connexions organiques)
    newNodes.forEach(node => {
      const neighbors = newNodes
        .map(n => ({ n, d: distance(node, n) }))
        .filter(item => item.d > 0 && item.d < CONNECTIVITY_RADIUS)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);

      neighbors.forEach(({ n }) => {
        const edgeId = [node.id, n.id].sort().join('-');
        if (!newEdges.some(e => e.id === edgeId)) {
          if (Math.random() > 0.2) {
            newEdges.push({ 
              id: edgeId, 
              sourceId: node.id, 
              targetId: n.id, 
              type: 'street' 
            });
          }
        }
      });
    });

    // 7. PLACER LES POIS
    QUETE_POINTS.forEach(poi => {
      const poiNode: Point = {
        id: poi.id,
        x: poi.x,
        y: poi.y,
        type: 'poi',
        poiId: poi.id
      };
      newNodes.push(poiNode);
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  // --- RÉVÉLATION AUTOUR D'UN POI ---
  const revealAround = (poiNode: Point) => {
    const toReveal = new Set(revealedEdgeIds);
    const poi = QUETE_POINTS.find(p => p.poiId === poiNode.poiId);
    const radius = poi?.revealRadius || REVEAL_RADIUS;

    edges.forEach(e => {
      const s = nodes.find(n => n.id === e.sourceId);
      const t = nodes.find(n => n.id === e.targetId);
      if (!s || !t) return;

      const d1 = distance(poiNode, s);
      const d2 = distance(poiNode, t);

      if (d1 < radius || d2 < radius) {
        toReveal.add(e.id);
      }
    });

    setRevealedEdgeIds(toReveal);
  };

  // --- VALIDATION ---
  const handleValidation = () => {
    if (!activePoi) return;

    const poi = QUETE_POINTS.find(p => p.id === activePoi);
    if (!poi) return;

    // Validation simple : confiance au geste
    if (poi.validationType === 'photo' && !uploadedFile) return;
    if (poi.validationType === 'text' && !textInput.trim()) return;

    // Marquer comme complété
    setCompletedPois(prev => new Set(prev).add(activePoi));

    // Révéler l'encre autour
    const poiNode = nodes.find(n => n.poiId === activePoi);
    if (poiNode) {
      revealAround(poiNode);
    }

    // Reset et fermeture
    setModalOpen(false);
    setActivePoi(null);
    setUploadedFile(null);
    setTextInput('');
  };

  const openValidation = (poiId: string) => {
    setActivePoi(poiId);
    setModalOpen(true);
  };

  // --- RENDU ---
  const currentPoiData = activePoi ? QUETE_POINTS.find(p => p.id === activePoi) : null;

  return (
    <div className="w-full h-screen bg-[#FAF8F2] relative overflow-hidden" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
      
      {/* Paper grain texture */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none'
        }}
      />

      {/* Back button */}
      <BackButton onClick={onBack} />

      {/* Titre page */}
      <div
        style={{
          position: 'fixed',
          top: 'clamp(24px, 4vw, 32px)',
          right: 'clamp(24px, 4vw, 32px)',
          fontSize: 'clamp(9px, 1.5vw, 10px)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#8B7F6E',
          opacity: 0.25,
          zIndex: 100
        }}
      >
        {t('origin.title')}
      </div>

      {/* CARTE CENTRALE */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ padding: 'clamp(16px, 3vw, 32px)' }}>
        <div className="relative w-full max-w-[900px]" style={{ height: 'clamp(400px, 80vh, 700px)' }}>
          
          <svg 
            width="100%" 
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            style={{
              filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.03))'
            }}
          >
            {/* SVG FILTERS — Texture encre gravée */}
            <defs>
              {/* Ink bleed effect */}
              <filter id="inkTexture">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.4" />
              </filter>

              {/* Edge fade subtil */}
              <radialGradient id="edgeFade">
                <stop offset="0%" stopColor="#FAF8F2" stopOpacity="0" />
                <stop offset="85%" stopColor="#FAF8F2" stopOpacity="0" />
                <stop offset="100%" stopColor="#FAF8F2" stopOpacity="0.6" />
              </radialGradient>

              {/* Mask de révélation */}
              <mask id="revealMask">
                <rect x="0" y="0" width="100" height="100" fill="black" />
                {/* Zones révélées = blanc */}
                {Array.from(revealedEdgeIds).map(id => {
                  const e = edges.find(ed => ed.id === id);
                  if (!e) return null;
                  const s = nodes.find(n => n.id === e.sourceId);
                  const t = nodes.find(n => n.id === e.targetId);
                  if (!s || !t) return null;

                  return (
                    <motion.circle
                      key={`mask_${id}`}
                      cx={(s.x + t.x) / 2}
                      cy={(s.y + t.y) / 2}
                      r={3}
                      fill="white"
                      initial={{ r: 0, opacity: 0 }}
                      animate={{ r: 3, opacity: 1 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                  );
                })}
              </mask>
            </defs>

            {/* LAYER 1: Système de révélation (encre verte noble) */}
            <g style={{ filter: 'url(#inkTexture)' }} mask="url(#revealMask)">
              <AnimatePresence>
                {Array.from(revealedEdgeIds).map(id => {
                  const e = edges.find(ed => ed.id === id);
                  if (!e) return null;
                  const s = nodes.find(n => n.id === e.sourceId);
                  const t = nodes.find(n => n.id === e.targetId);
                  if (!s || !t) return null;

                  // SEINE — Triple trait noble
                  if (e.type === 'seine') {
                    return (
                      <g key={`ink_${e.id}`}>
                        <motion.line 
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 0.9 }}
                          transition={{ duration: 1.8, ease: 'easeOut' }}
                          x1={s.x} y1={s.y - 0.5} x2={t.x} y2={t.y - 0.5}
                          stroke="#003D2C"
                          strokeWidth={1.4}
                          strokeLinecap="round"
                        />
                        <motion.line 
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 0.7 }}
                          transition={{ duration: 1.8, ease: 'easeOut', delay: 0.15 }}
                          x1={s.x} y1={s.y + 0.5} x2={t.x} y2={t.y + 0.5}
                          stroke="#003D2C"
                          strokeWidth={1.0}
                          strokeLinecap="round"
                        />
                      </g>
                    );
                  }

                  // AXES — Trait double marqué
                  if (e.type === 'axis') {
                    return (
                      <g key={`ink_${e.id}`}>
                        <motion.line 
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 0.85 }}
                          transition={{ duration: 1.4, ease: 'circOut' }}
                          x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                          stroke="#003D2C"
                          strokeWidth={1.1}
                          strokeLinecap="round"
                        />
                      </g>
                    );
                  }

                  // RUES — Trait organique
                  const strokeVar = 0.7 + Math.random() * 0.25;
                  return (
                    <motion.line 
                      key={`ink_${e.id}`}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.75 }}
                      transition={{ duration: 1.3, ease: 'circOut' }}
                      x1={s.x} y1={s.y} x2={t.x} y2={t.y} 
                      stroke="#003D2C"
                      strokeWidth={strokeVar}
                      strokeLinecap="round"
                    />
                  );
                })}
              </AnimatePresence>
            </g>

            {/* POIS */}
            {QUETE_POINTS.map(poi => {
              const isCompleted = completedPois.has(poi.id);
              const isActive = activePoi === poi.id;
              const canActivate = !isCompleted && !activePoi;

              // Poids visuels différenciés
              const getPointSize = () => {
                switch (poi.weight) {
                  case 'heavy': return isCompleted ? 2.6 : 2.2; // Plus visible
                  case 'central': return isCompleted ? 2.4 : 2.0; // Convergence
                  case 'normal': return isCompleted ? 2.2 : 1.8; // Standard
                  case 'ancient': return isCompleted ? 2.0 : 1.6; // Plus discret
                  case 'light': return isCompleted ? 1.8 : 1.4; // Presque invisible
                  case 'mute': return isCompleted ? 1.6 : 1.2; // Le plus discret
                  default: return isCompleted ? 2.2 : 1.8;
                }
              };

              const getNumeralOpacity = () => {
                switch (poi.weight) {
                  case 'heavy': return isCompleted ? 0.9 : 0.6;
                  case 'central': return isCompleted ? 0.85 : 0.55;
                  case 'normal': return isCompleted ? 0.85 : 0.5;
                  case 'ancient': return isCompleted ? 0.75 : 0.4;
                  case 'light': return isCompleted ? 0.7 : 0.3;
                  case 'mute': return isCompleted ? 0.6 : 0.25; // Presque invisible
                  default: return isCompleted ? 0.85 : 0.5;
                }
              };

              return (
                <g 
                  key={poi.id}
                  style={{ cursor: canActivate ? 'pointer' : 'default' }}
                  onClick={() => canActivate && openValidation(poi.id)}
                >
                  {/* Halo si actif — adapté au poids */}
                  {isActive && (
                    <motion.circle 
                      cx={poi.x} cy={poi.y} 
                      r={poi.weight === 'central' ? 4.0 : 3.5}
                      fill="none" 
                      stroke="#003D2C" 
                      strokeWidth={poi.weight === 'mute' ? 0.2 : 0.3}
                      opacity={poi.weight === 'mute' ? 0.2 : 0.3}
                      animate={{ scale: [1, 1.6], opacity: [poi.weight === 'mute' ? 0.2 : 0.3, 0] }}
                      transition={{ repeat: Infinity, duration: poi.weight === 'mute' ? 3.5 : 2.5, ease: 'easeOut' }}
                    />
                  )}
                  
                  {/* Point physique — double cercle gravé avec taille différenciée */}
                  <circle 
                    cx={poi.x} cy={poi.y} 
                    r={getPointSize()}
                    fill={isCompleted ? '#003D2C' : 'none'}
                    stroke="#003D2C"
                    strokeWidth={poi.weight === 'heavy' ? 0.9 : (poi.weight === 'mute' ? 0.5 : 0.7)}
                    opacity={poi.weight === 'light' || poi.weight === 'mute' ? 0.7 : 1}
                  />
                  {!isCompleted && (
                    <circle 
                      cx={poi.x} cy={poi.y} 
                      r={poi.weight === 'mute' ? 0.7 : 1.0}
                      fill="none"
                      stroke="#003D2C"
                      strokeWidth={poi.weight === 'mute' ? 0.3 : 0.4}
                      opacity={poi.weight === 'mute' ? 0.4 : 0.6}
                    />
                  )}

                  {/* Chiffre romain — opacity différenciée */}
                  <text
                    x={poi.x}
                    y={poi.y - (poi.weight === 'heavy' ? 4.0 : (poi.weight === 'mute' ? 3.0 : 3.5))}
                    textAnchor="middle"
                    style={{
                      fontSize: poi.weight === 'heavy' ? '2.6px' : (poi.weight === 'mute' ? '2.0px' : '2.4px'),
                      fill: '#6B6455',
                      opacity: getNumeralOpacity(),
                      fontFamily: 'Cormorant Garamond, serif',
                      fontWeight: poi.weight === 'heavy' ? '400' : '300',
                      letterSpacing: '0.02em',
                      pointerEvents: 'none'
                    }}
                  >
                    {poi.numeral}
                  </text>
                </g>
              );
            })}

            {/* Edge fade */}
            <rect 
              x="0" y="0" width="100" height="100"
              fill="url(#edgeFade)"
              pointerEvents="none"
            />
          </svg>
        </div>
      </div>

      {/* PROTOCOLE DE MARCHE (bas droite) — RESPONSIVE */}
      <div 
        className="protocole-marche"
        style={{
          position: 'fixed',
          bottom: 'clamp(16px, 3vw, 32px)',
          right: 'clamp(16px, 3vw, 32px)',
          width: 'clamp(260px, 90vw, 280px)',
          maxWidth: '90vw',
          background: 'rgba(250, 248, 242, 0.92)',
          border: '0.5px solid rgba(107, 100, 85, 0.15)',
          padding: 'clamp(20px, 4vw, 24px)',
          zIndex: 100,
          backdropFilter: 'blur(4px)'
        }}
      >
        <h2 
          style={{
            fontSize: 'clamp(8px, 1.4vw, 9px)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#6B6455',
            opacity: 0.5,
            marginBottom: 'clamp(16px, 3vw, 20px)',
            paddingBottom: 'clamp(6px, 1.5vw, 8px)',
            borderBottom: '0.5px solid rgba(107, 100, 85, 0.1)'
          }}
        >
          {t('origin.protocol')}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vw, 14px)' }}>
          {QUETE_POINTS.map(poi => {
            const isCompleted = completedPois.has(poi.id);
            const isActive = activePoi === poi.id;
            const canActivate = !isCompleted && !activePoi;

            // État : ◯ locked, ◑ active, ● done
            const stateIcon = isCompleted ? '●' : (isActive ? '◑' : '◯');

            return (
              <div 
                key={poi.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  opacity: isCompleted || canActivate ? 1 : 0.35,
                  cursor: canActivate ? 'pointer' : 'default',
                  transition: 'opacity 300ms'
                }}
                onClick={() => canActivate && openValidation(poi.id)}
              >
                {/* État */}
                <span 
                  style={{
                    fontSize: '14px',
                    color: isCompleted ? '#003D2C' : '#6B6455',
                    marginTop: '2px'
                  }}
                >
                  {stateIcon}
                </span>

                <div style={{ flex: 1 }}>
                  <div 
                    style={{
                      fontSize: '10px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#1A1A1A',
                      marginBottom: '4px',
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      textDecorationThickness: '0.5px'
                    }}
                  >
                    {poi.name}
                  </div>

                  {(isCompleted || canActivate) && (
                    <p 
                      style={{
                        fontSize: '11px',
                        fontStyle: 'italic',
                        lineHeight: '1.6',
                        color: '#6B6455',
                        opacity: 0.8
                      }}
                    >
                      « {poi.phrase} »
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODALE DE VALIDATION */}
      <AnimatePresence>
        {modalOpen && currentPoiData && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(250, 248, 242, 0.96)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div 
              style={{
                maxWidth: '480px',
                width: '90%',
                background: '#FDFBF7',
                border: '1px solid rgba(107, 100, 85, 0.2)',
                padding: '40px',
                position: 'relative'
              }}
            >
              {/* Barre haut */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: '#003D2C'
                }}
              />

              {/* Titre */}
              <h2 
                style={{
                  fontSize: '18px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  color: '#1A1A1A',
                  marginBottom: '24px'
                }}
              >
                {currentPoiData.name}
              </h2>

              {/* Phrase-indice */}
              <p 
                style={{
                  fontSize: '13px',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  color: '#6B6455',
                  marginBottom: '32px',
                  lineHeight: '1.7'
                }}
              >
                « {currentPoiData.phrase} »
              </p>

              {/* Upload photo ou texte */}
              {currentPoiData.validationType === 'photo' ? (
                <div 
                  style={{
                    border: '1.5px dashed rgba(107, 100, 85, 0.25)',
                    height: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8B7F6E',
                    cursor: 'pointer',
                    transition: 'all 300ms',
                    marginBottom: '24px',
                    background: uploadedFile ? 'rgba(0, 61, 44, 0.03)' : 'transparent'
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files[0]) {
                      setUploadedFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                      if (e.target.files[0]) {
                        setUploadedFile(e.target.files[0]);
                      }
                    };
                    input.click();
                  }}
                >
                  {uploadedFile ? (
                    <span style={{ fontSize: '11px', textAlign: 'center' }}>
                      {uploadedFile.name}
                    </span>
                  ) : (
                    <span 
                      style={{
                        fontSize: '10px',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase'
                      }}
                    >
                      {t('origin.modal.submit')}
                    </span>
                  )}
                </div>
              ) : (
                <input 
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t('origin.modal.describe')}
                  style={{
                    width: '100%',
                    border: 'none',
                    borderBottom: '1px solid rgba(107, 100, 85, 0.25)',
                    padding: '12px 0',
                    fontSize: '13px',
                    fontFamily: 'Cormorant Garamond, serif',
                    textAlign: 'center',
                    background: 'transparent',
                    outline: 'none',
                    marginBottom: '24px',
                    color: '#1A1A1A'
                  }}
                />
              )}

              {/* Bouton validation */}
              <button 
                onClick={handleValidation}
                disabled={
                  currentPoiData.validationType === 'photo' 
                    ? !uploadedFile 
                    : !textInput.trim()
                }
                style={{
                  width: '100%',
                  background: '#003D2C',
                  color: '#FAF8F2',
                  border: 'none',
                  padding: '14px',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'opacity 300ms',
                  opacity: (currentPoiData.validationType === 'photo' ? uploadedFile : textInput.trim()) ? 1 : 0.3
                }}
              >
                {t('origin.modal.seal')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}