/**
 * ÉTUDES — FORMES V2 (7 LEÇONS COMPLÈTES)
 * 
 * Structure :
 * - Hub des leçons → Leçon individuelle → Retour hub
 * - Chaque leçon : 8 sections fixes
 * - Navigation libre entre les leçons
 * - Pas de progression, pas de validation
 */

import { useState } from 'react';
import { FormesAcceleration } from './FormesAcceleration';
import { LessonColonneV2 } from './LessonColonneV2';
import { FormesAxe } from './FormesAxe';
import { FormesSeuil } from './FormesSeuil';

interface EtudesFormesV2Props {
  onReturn: () => void;
}

type LessonId = 'colonne' | 'axe' | 'seuil';
type Stage = 'hub' | 'lesson' | 'acceleration' | 'colonne_v2' | 'axe_complet' | 'seuil_complet';

interface Lesson {
  id: LessonId;
  title: string;
  statement: string;
  structuralFunction: string[];
  historicalNecessity: string[];
  abstractSchema: string[];
  cityEmbodiment: string[];
  practiceDraw: string[];
  practiceRecognise: string[];
  closure: string;
}

const LESSONS: Lesson[] = [
  {
    id: 'colonne',
    title: 'COLONNE',
    statement: `La colonne élève la charge en la rendant lisible.`,
    structuralFunction: [
      `La colonne est un support vertical à section circulaire.`,
      `Elle concentre les forces et les transmet directement au sol.`,
      `Sa forme limite les points de rupture sous compression.`,
      `Sans colonne, la structure doit s'épaissir ou se fragmenter.`
    ],
    historicalNecessity: [
      `La colonne apparaît avec la pierre taillée.`,
      `Elle permet la hauteur sans élargissement massif.`,
      `Sa géométrie répond à la compression continue.`
    ],
    abstractSchema: [
      `Un axe vertical.`,
      `Une section circulaire constante.`,
      `Une base stabilisatrice.`,
      `Une charge descendante continue.`
    ],
    cityEmbodiment: [
      `Des colonnades organisent les portiques.`,
      `La distance entre colonnes détermine la portée.`,
      `La répétition structure l'espace avant toute décoration.`
    ],
    practiceDraw: [
      `Imagine un plafond lourd.`,
      `Place une colonne dessous.`,
      `Ajuste son diamètre jusqu'à sentir l'équilibre.`
    ],
    practiceRecognise: [
      `Observe un espace ouvert.`,
      `Repère ce qui joue le rôle de colonne, même sans cylindre.`
    ],
    closure: `Ce qui soutient n'a pas besoin de s'imposer.`
  },
  {
    id: 'axe',
    title: 'AXE',
    statement: `Un axe ordonne avant de guider.`,
    structuralFunction: [
      `L'axe hiérarchise l'espace.`,
      `Il crée une direction dominante.`,
      `Il relie sans enfermer.`,
      `Sans axe, les mouvements se dispersent.`
    ],
    historicalNecessity: [
      `L'axe apparaît avec la procession.`,
      `Il structure la marche, la vue, l'attente.`,
      `Il rend la distance intelligible.`
    ],
    abstractSchema: [
      `Une ligne continue.`,
      `Des points alignés.`,
      `Une orientation principale.`
    ],
    cityEmbodiment: [
      `Des perspectives traversent la ville.`,
      `Les monuments s'alignent sans se toucher.`,
      `L'axe dépasse les lieux qu'il relie.`
    ],
    practiceDraw: [
      `Trace mentalement une ligne droite.`,
      `Dispose trois éléments dessus.`,
      `Observe la hiérarchie créée.`
    ],
    practiceRecognise: [
      `Observe un espace urbain.`,
      `Repère la direction qui domine sans signal.`
    ],
    closure: `Ce qui oriente n'enferme pas.`
  },
  {
    id: 'seuil',
    title: 'SEUIL',
    statement: `Le seuil transforme le passage.`,
    structuralFunction: [
      `Le seuil marque un changement d'état.`,
      `Il ralentit, prépare, annonce.`,
      `Sans seuil, la transition disparaît.`
    ],
    historicalNecessity: [
      `Le seuil apparaît avec le rituel.`,
      `Il distingue l'intérieur de l'extérieur.`,
      `Il inscrit le corps dans l'espace.`
    ],
    abstractSchema: [
      `Une limite épaissie.`,
      `Un avant et un après.`,
      `Un point de bascule.`
    ],
    cityEmbodiment: [
      `Portes, marches, porches modulent l'entrée.`,
      `Le seuil engage le corps.`,
      `Il impose une conscience du passage.`
    ],
    practiceDraw: [
      `Imagine une entrée sans seuil.`,
      `Ajoute une épaisseur.`,
      `Observe l'effet mental.`
    ],
    practiceRecognise: [
      `Observe une entrée urbaine.`,
      `Identifie ce qui ralentit le pas.`
    ],
    closure: `Entrer est un acte.`
  }
];

export function EtudesFormesV2({ onReturn }: EtudesFormesV2Props) {
  const [stage, setStage] = useState<Stage>('hub');
  const [currentLesson, setCurrentLesson] = useState<LessonId | null>(null);

  const handleSelectLesson = (lessonId: LessonId) => {
    if (lessonId === 'acceleration') {
      setStage('acceleration');
    } else if (lessonId === 'colonne') {
      setStage('colonne_v2');
    } else if (lessonId === 'axe') {
      setStage('axe_complet');
    } else if (lessonId === 'seuil') {
      setStage('seuil_complet');
    } else {
      setCurrentLesson(lessonId);
      setStage('lesson');
    }
  };

  const handleReturnToHub = () => {
    setCurrentLesson(null);
    setStage('hub');
  };

  if (stage === 'lesson' && currentLesson) {
    const lesson = LESSONS.find(l => l.id === currentLesson);
    if (lesson) {
      return <LessonView lesson={lesson} onReturn={handleReturnToHub} />;
    }
  }

  if (stage === 'acceleration') {
    return <FormesAcceleration onReturn={handleReturnToHub} />;
  }

  if (stage === 'colonne_v2') {
    return <LessonColonneV2 onReturn={handleReturnToHub} />;
  }

  if (stage === 'axe_complet') {
    return <FormesAxe onReturn={handleReturnToHub} />;
  }

  if (stage === 'seuil_complet') {
    return <FormesSeuil onReturn={handleReturnToHub} />;
  }

  // Hub des leçons
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
          maxWidth: '900px',
          margin: '0 auto',
          paddingTop: '120px'
        }}
      >
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: '96px' }}>
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
            Trois formes fondamentales
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
            Une grammaire, pas un catalogue.
          </p>
        </div>

        {/* Grille des leçons principales */}
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            marginBottom: '80px'
          }}
        >
          {LESSONS.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onClick={() => handleSelectLesson(lesson.id)}
            />
          ))}
        </div>

        {/* Section ACCÉLÉRATION (séparée) */}
        <div style={{ marginTop: '80px', paddingTop: '64px', borderTop: '0.5px solid rgba(26, 26, 26, 0.1)' }}>
          <div 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#1A1A1A',
              opacity: 0.4,
              marginBottom: '32px',
              textAlign: 'center'
            }}
          >
            EXERCICE PERCEPTIF
          </div>

          <button
            onClick={() => handleSelectLesson('acceleration' as LessonId)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.opacity = '0.7';
            }}
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '600px',
              margin: '0 auto',
              background: 'rgba(0, 61, 44, 0.03)',
              border: '0.5px solid rgba(0, 61, 44, 0.15)',
              padding: '40px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: 0.7
            }}
          >
            <div 
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '24px',
                fontWeight: 400,
                lineHeight: 1.3,
                color: '#003D2C',
                marginBottom: '12px'
              }}
            >
              ACCÉLÉRATION
            </div>
            
            <div 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#1A1A1A',
                opacity: 0.6
              }}
            >
              90 secondes d'exposition continue
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Carte de leçon
interface LessonCardProps {
  lesson: Lesson;
  onClick: () => void;
}

function LessonCard({ lesson, onClick }: LessonCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Visuels générés simples pour chaque leçon
  const getVisual = (id: LessonId): JSX.Element => {
    if (id === 'colonne') {
      return (
        <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ display: 'block' }}>
          <line x1="60" y1="20" x2="60" y2="100" stroke="#1A1A1A" strokeWidth="1.5" opacity="0.3" />
          <rect x="50" y="20" width="20" height="80" fill="none" stroke="#1A1A1A" strokeWidth="0.5" opacity="0.4" />
          <circle cx="60" cy="20" r="8" fill="none" stroke="#1A1A1A" strokeWidth="0.5" opacity="0.3" />
          <line x1="45" y1="100" x2="75" y2="100" stroke="#1A1A1A" strokeWidth="1" opacity="0.4" />
        </svg>
      );
    }
    if (id === 'axe') {
      return (
        <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ display: 'block' }}>
          <line x1="20" y1="60" x2="100" y2="60" stroke="#1A1A1A" strokeWidth="1.5" opacity="0.3" />
          <circle cx="35" cy="60" r="4" fill="#1A1A1A" opacity="0.3" />
          <circle cx="60" cy="60" r="4" fill="#1A1A1A" opacity="0.3" />
          <circle cx="85" cy="60" r="4" fill="#1A1A1A" opacity="0.3" />
          <line x1="10" y1="60" x2="15" y2="60" stroke="#1A1A1A" strokeWidth="1" opacity="0.2" />
          <line x1="105" y1="60" x2="110" y2="60" stroke="#1A1A1A" strokeWidth="1" opacity="0.2" />
        </svg>
      );
    }
    if (id === 'seuil') {
      return (
        <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ display: 'block' }}>
          <line x1="50" y1="30" x2="50" y2="90" stroke="#1A1A1A" strokeWidth="0.5" opacity="0.3" />
          <line x1="70" y1="30" x2="70" y2="90" stroke="#1A1A1A" strokeWidth="0.5" opacity="0.3" />
          <rect x="48" y="55" width="24" height="10" fill="none" stroke="#1A1A1A" strokeWidth="1" opacity="0.4" />
          <line x1="30" y1="60" x2="48" y2="60" stroke="#1A1A1A" strokeWidth="0.5" opacity="0.2" strokeDasharray="2,2" />
          <line x1="72" y1="60" x2="90" y2="60" stroke="#1A1A1A" strokeWidth="0.5" opacity="0.2" strokeDasharray="2,2" />
        </svg>
      );
    }
    return <></>;
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr',
        gap: '32px',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(10px)',
        border: '0.5px solid rgba(26, 26, 26, 0.08)',
        padding: '32px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? '0 8px 24px rgba(26, 26, 26, 0.06)' 
          : '0 2px 8px rgba(26, 26, 26, 0.03)',
        opacity: isHovered ? 1 : 0.9
      }}
    >
      {/* Visuel généré à gauche */}
      <div 
        style={{
          width: '120px',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(250, 248, 242, 0.6)',
          border: '0.5px solid rgba(26, 26, 26, 0.06)'
        }}
      >
        {getVisual(lesson.id)}
      </div>

      {/* Texte à droite */}
      <div>
        <div 
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '28px',
            fontWeight: 400,
            lineHeight: 1.2,
            color: '#1A1A1A',
            marginBottom: '12px',
            opacity: 0.9
          }}
        >
          {lesson.title}
        </div>

        <div 
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            fontWeight: 400,
            lineHeight: 1.6,
            color: '#1A1A1A',
            opacity: 0.6
          }}
        >
          {lesson.statement}
        </div>
      </div>
    </button>
  );
}

// Vue de leçon complète
interface LessonViewProps {
  lesson: Lesson;
  onReturn: () => void;
}

function LessonView({ lesson, onReturn }: LessonViewProps) {
  const [currentSection, setCurrentSection] = useState(0);

  const sections = [
    { title: 'STATEMENT', content: lesson.statement, type: 'statement' },
    { title: 'STRUCTURAL FUNCTION', content: lesson.structuralFunction, type: 'list' },
    { title: 'HISTORICAL NECESSITY', content: lesson.historicalNecessity, type: 'list' },
    { title: 'ABSTRACT SCHEMA', content: lesson.abstractSchema, type: 'schema' },
    { title: 'CITY EMBODIMENT', content: lesson.cityEmbodiment, type: 'list' },
    { title: 'PRACTICE — DRAW', content: lesson.practiceDraw, type: 'practice' },
    { title: 'PRACTICE — RECOGNISE', content: lesson.practiceRecognise, type: 'practice' },
    { title: 'CLOSURE', content: lesson.closure, type: 'closure' }
  ];

  const currentSectionData = sections[currentSection];

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
        ← FORMES
      </button>

      {/* Container central */}
      <div 
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          paddingTop: '120px'
        }}
      >
        {/* En-tête de leçon */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#1A1A1A',
              opacity: 0.4,
              marginBottom: '16px'
            }}
          >
            {lesson.title}
          </div>

          <div 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 400,
              color: '#1A1A1A',
              opacity: 0.3
            }}
          >
            {currentSection + 1} / {sections.length}
          </div>
        </div>

        {/* Section actuelle */}
        <SectionContent section={currentSectionData} />

        {/* Navigation */}
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '64px'
          }}
        >
          <button
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
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
              opacity: currentSection === 0 ? 0.2 : 0.6,
              cursor: currentSection === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              if (currentSection !== 0) e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              if (currentSection !== 0) e.currentTarget.style.opacity = '0.6';
            }}
          >
            ← Précédent
          </button>

          {currentSection < sections.length - 1 ? (
            <button
              onClick={() => setCurrentSection(currentSection + 1)}
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
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            >
              Suivant →
            </button>
          ) : (
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
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            >
              Terminer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Rendu de section
interface SectionContentProps {
  section: {
    title: string;
    content: string | string[];
    type: string;
  };
}

function SectionContent({ section }: SectionContentProps) {
  return (
    <div>
      {/* Titre de section */}
      <h3 
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#1A1A1A',
          opacity: 0.4,
          marginBottom: '32px',
          textAlign: 'center'
        }}
      >
        {section.title}
      </h3>

      {/* Contenu selon type */}
      {section.type === 'statement' && (
        <p 
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '32px',
            fontWeight: 400,
            lineHeight: 1.3,
            letterSpacing: '0',
            color: '#1A1A1A',
            textAlign: 'center',
            opacity: 0.9
          }}
        >
          {section.content as string}
        </p>
      )}

      {section.type === 'list' && (
        <div 
          style={{
            background: 'white',
            border: '0.5px solid rgba(26, 26, 26, 0.1)',
            padding: '48px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          {(section.content as string[]).map((line, i) => (
            <p 
              key={i}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '17px',
                fontWeight: 400,
                lineHeight: 1.6,
                color: '#1A1A1A',
                opacity: 0.7
              }}
            >
              {line}
            </p>
          ))}
        </div>
      )}

      {section.type === 'schema' && (
        <div 
          style={{
            background: 'white',
            border: '0.5px solid rgba(26, 26, 26, 0.1)',
            padding: '48px',
            fontFamily: 'monospace',
            fontSize: '15px',
            lineHeight: 1.8,
            color: '#1A1A1A',
            opacity: 0.7,
            whiteSpace: 'pre-line'
          }}
        >
          {(section.content as string[]).map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {section.type === 'practice' && (
        <div 
          style={{
            background: 'white',
            border: '0.5px solid rgba(26, 26, 26, 0.1)',
            padding: '48px'
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
              paddingLeft: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {(section.content as string[]).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </div>
      )}

      {section.type === 'closure' && (
        <p 
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '24px',
            fontWeight: 400,
            lineHeight: 1.4,
            letterSpacing: '0',
            color: '#1A1A1A',
            textAlign: 'center',
            opacity: 0.7
          }}
        >
          {section.content as string}
        </p>
      )}
    </div>
  );
}