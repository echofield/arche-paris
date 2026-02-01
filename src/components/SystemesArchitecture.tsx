/**
 * SYSTÈMES — CARTE ARCHITECTURE
 * Forme · Fonction · Hiérarchie
 */

import { useState } from 'react';

interface SystemesArchitectureProps {
  onReturn: () => void;
}

const PRINCIPE = `L'architecture n'est jamais neutre. Elle est la fossilisation des volontés politiques, des structures économiques et des hiérarchies sociales. Lire Paris, c'est déchiffrer un palimpseste où les régimes successifs ont inscrit leurs idéologies dans la pierre de taille, le béton et le fer. Le Mur des Fermiers généraux (Ledoux, 1784) n'était pas défensif : c'était une frontière fiscale. Haussmann n'embellissait pas : il ouvrait des boulevards à canons pour briser les barricades. L'immeuble haussmannien stratifiait la société verticalement (bel étage → chambres de bonne). Les Grands Ensembles ont projeté le prolétariat en périphérie. La Prison de la Santé (1863) réalisait le Panoptique : architecture de visibilité totale. Aujourd'hui, les bancs anti-SDF et les pics d'or poursuivent le tri social. Le système est, indubitablement, dans la pierre.`;

const JALONS = [
  {
    periode: '1784–1790',
    titre: 'Mur des Fermiers généraux : La forteresse fiscale',
    texte: 'Contrairement aux enceintes médiévales (défense militaire), ce mur avait pour ennemi l\'intérieur : le contrebandier. But unique : percevoir l\'octroi (taxe sur les biens entrant dans Paris). 24 km, 3 mètres de haut. Ledoux conçut 60 "Propylées" (barrières monumentales) : Rotonde de la Villette, Barrière d\'Enfer. Vocabulaire néoclassique (dorique grec, rotondes) pour élever la perception fiscale au rang d\'art. Coût : 25 millions de livres. Résultat : colère populaire ("Le mur murant Paris rend Paris murmurant"). Incendie des barrières 12-13 juillet 1789 = prélude à la prise de la Bastille. L\'architecture fiscale perçue comme injuste déclenche la révolution.'
  },
  {
    periode: '1852–1870',
    titre: 'Haussmannisation : L\'embellissement stratégique',
    texte: 'Pas une rénovation esthétique, mais l\'application spatiale d\'un programme bonapartiste autoritaire. Triple impératif : 1. Sécurité (boulevards rectilignes = déploiement cavalerie/artillerie, impossibilité de barricades, "boulevards à canons"). 2. Circulation du capital (gares → centres commerce). 3. Hygiène (théories après choléra 1832/1849 : lumière, air, 600km d\'égouts). Arasement de la Butte des Moulins (percement Avenue de l\'Opéra) : effacer une géographie populaire, remplacer par perspective bourgeoise. Haussmann n\'a pas tracé des rues : il a nivelé le sol de la ville.'
  },
  {
    periode: '1950–1970',
    titre: 'Grands Ensembles : Ségrégation horizontale',
    texte: 'Après 1945, changement de paradigme : ne plus densifier Paris intra-muros, mais projeter la modernité en périphérie (ZUP : Sarcelles, Mourenx). Architecture dictée par le chemin de grue : forme (barres et tours) = optimisation du déplacement des grues sur rails. Vus du ciel : compositions géométriques rationnelles (État ordonnateur). Au sol : dissolution des liens sociaux (absence de rues, espaces verts indéfinis). Utopie technocratique : libérer l\'ouvrier par le confort (eau, chauffage). Résultat : ségrégation dans des silos périphériques. "Sarcellite" = pathologie sociale (ennui, isolement).'
  },
  {
    periode: '1990–2000',
    titre: 'Résidentialisation : L\'espace défendable',
    texte: 'Réaction à l\'échec du modernisme ouvert. Inspirée par Oscar Newman (Defensible Space, 1972). Dispositif : clôtures, grilles, digicodes, privatisation des pieds d\'immeubles. Objectif : redécouper l\'espace ouvert des grands ensembles, rétablir hiérarchie public/semi-privé/privé. Politique : transformer le locataire en "quasi-propriétaire" responsable, encourager surveillance naturelle (informal surveillance) par les habitants. Passage d\'un ordre imposé par l\'État (police) à un ordre maintenu par l\'architecture et l\'autocontrôle social. Architecture = prévention situationnelle du crime.'
  }
];

const MECANISMES = [
  {
    nom: 'Stratification Verticale : L\'Immeuble Haussmannien',
    description: 'Microcosme de la société XIXe. Avant l\'ascenseur : statut social inversement proportionnel au nombre d\'étages. 2ème étage (Bel Étage) : noblesse/grande bourgeoisie, plafonds 3-4m, grand balcon filant, décorations riches. 3ème-4ème : petite bourgeoisie, fenêtres standard. 6ème (Combles) : domestiques, chambres de bonne <9m², toits mansardés, absence de confort. Escalier de service : circulation parallèle invisible, domestiques ne croisent pas la bourgeoisie dans l\'escalier d\'honneur. Aujourd\'hui : chambres de bonne = refuge de population précaire (étudiants, travailleurs pauvres). Ghettoïsation verticale au cœur des quartiers riches.'
  },
  {
    nom: 'Institutions Disciplinaires : Le Panoptique Réalisé',
    description: 'Prison de la Santé (1863-1867, Vaudremer) : plan panoptique (Bentham). Ailes de cellules rayonnant autour d\'un noyau central de surveillance. Un seul gardien voit tous les couloirs simultanément. Géométrie impose au détenu visibilité consciente et permanente : il intériorise la contrainte. "L\'architecture assure le fonctionnement automatique du pouvoir" (Foucault). Lycée Jules-Ferry (1913) : hygiénisme (système Cottancin : ciment armé + briques = grandes baies vitrées), terrasses-solariums. Ségrégation des sexes dans la pierre : plan en V protégeant les jeunes filles des regards de la rue (vertu). Hôpital Lariboisière (1854) : modèle pavillonnaire "en peigne", bâtiments isolés = empêcher contagion (miasmes). Architecture elle-même = remède.'
  },
  {
    nom: 'Architecture Hostile : Le Design de l\'Exclusion',
    description: 'Contrôle social agressif dans la ville néolibérale. Banc anti-SDF : modèles segmentés par accoudoirs, "assis-debout", sièges baquets individuels = empêcher position allongée. Pics d\'or : pics métalliques devant vitrines, plans inclinés, jets d\'eau automatiques. Politique "Zéro Tolérance" envers sans-abri. Architecture devient arme passive qui nie le droit de cité aux corps indésirables, rendant le sommeil impossible. Vespasiennes (urinoir public) : détournement en lieux de rencontres homosexuelles ("tasses"). Disparition + remplacement par Sanisettes (closes, payantes) = autant hygiène que répression des mœurs.'
  }
];

const QUIZ_QUESTIONS = [
  {
    question: 'Pourquoi le Mur des Fermiers généraux (1784-1790) a-t-il été construit ?',
    options: [
      'Pour défendre Paris des armées étrangères',
      'Pour percevoir l\'octroi (taxe fiscale) sur les marchandises entrant dans Paris',
      'Pour embellir la ville',
      'Pour séparer les riches des pauvres'
    ],
    correct: 1,
    explication: 'Contrairement aux enceintes militaires, ce mur avait pour ennemi l\'intérieur : le contrebandier. Son but unique était de forcer le passage des marchandises par des points de contrôle (les Propylées de Ledoux) afin de percevoir l\'octroi. Cette frontière fiscale monumentale cristallisa la colère populaire : son incendie (12-13 juillet 1789) fut le prélude à la prise de la Bastille.'
  },
  {
    question: 'Quelle était la fonction politique des boulevards haussmanniens au-delà de l\'embellissement ?',
    options: [
      'Créer des promenades agréables',
      'Ouvrir des voies rectilignes pour déployer cavalerie/artillerie et empêcher les barricades ("boulevards à canons")',
      'Augmenter la valeur immobilière',
      'Imiter Londres'
    ],
    correct: 1,
    explication: 'Le Paris médiéval, avec ses ruelles étroites, était le terrain idéal pour les barricades (1830, 1848). Haussmann a percé des boulevards rectilignes (Sébastopol, Saint-Germain) à travers les quartiers ouvriers séditieux. Ces "percées" permettaient le déploiement rapide de la cavalerie et de l\'artillerie, l\'impossibilité physique de bloquer la rue avec des pavés, et le tir au canon en ligne droite. C\'est une application spatiale d\'un programme bonapartiste autoritaire.'
  },
  {
    question: 'Comment fonctionnait la stratification sociale verticale dans l\'immeuble haussmannien ?',
    options: [
      'Les riches habitaient au rez-de-chaussée',
      'Tous les étages étaient identiques',
      'Le statut social était inversement proportionnel aux étages : 2ème (Bel Étage) = noblesse, 6ème (Combles) = domestiques',
      'Les pauvres habitaient les caves'
    ],
    correct: 2,
    explication: 'Avant l\'ascenseur, le statut social était inversement proportionnel au nombre d\'étages à gravir. Le 2ème étage (Bel Étage) accueillait la noblesse/grande bourgeoisie avec plafonds de 3-4m et grand balcon. Le 6ème étage (Combles) logeait les domestiques dans des chambres de bonne minuscules (<9m²) sous les toits mansardés. L\'escalier de service créait une circulation parallèle invisible : les domestiques ne croisaient jamais la bourgeoisie.'
  },
  {
    question: 'Qu\'est-ce que le "Panoptique" réalisé à la Prison de la Santé (1863) ?',
    options: [
      'Un système de punition publique',
      'Un plan architectural où des ailes de cellules rayonnent autour d\'un noyau central de surveillance, imposant une visibilité totale permanente',
      'Un tribunal à l\'intérieur de la prison',
      'Une bibliothèque pour les détenus'
    ],
    correct: 1,
    explication: 'Le Panoptique (théorisé par Bentham) est une géométrie architecturale où un seul gardien, placé au centre, peut surveiller tous les couloirs et cellules simultanément. Le détenu, ne sachant jamais s\'il est observé, doit intérioriser la contrainte. L\'architecture impose un état de visibilité consciente et permanente qui "assure le fonctionnement automatique du pouvoir" (Foucault). C\'est la machine disciplinaire pure.'
  },
  {
    question: 'Que vise l\'"Architecture Hostile" (bancs anti-SDF, pics d\'or) dans la ville contemporaine ?',
    options: [
      'Améliorer le confort urbain',
      'Empêcher la position allongée et rendre le sommeil impossible aux sans-abri, les expulsant de l\'espace public',
      'Protéger les monuments historiques',
      'Décorer la ville'
    ],
    correct: 1,
    explication: 'L\'architecture hostile (ou design défensif) est la matérialisation physique d\'une politique "Zéro Tolérance" envers les sans-abri. Les bancs sont segmentés par des accoudoirs, remplacés par des "assis-debout". Les pics métalliques devant les vitrines, les plans inclinés et les jets d\'eau automatiques sont conçus pour empêcher la position allongée. L\'architecture devient une arme passive qui nie le droit de cité aux corps indésirables. C\'est le contrôle social par la pierre.'
  }
];

export function SystemesArchitecture({ onReturn }: SystemesArchitectureProps) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  // Quiz flow
  if (showQuiz) {
    const question = QUIZ_QUESTIONS[currentQuestion];
    const isCorrect = selectedAnswer === question.options[question.correct];

    if (quizFinished) {
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
          <div style={{ maxWidth: '600px', textAlign: 'center' }}>
            <div 
              style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '32px',
                fontWeight: 400,
                lineHeight: 1.4,
                color: '#1A1A1A',
                marginBottom: '40px'
              }}
            >
              L'architecture n'est jamais neutre.
              <br/><br/>
              C'est la continuation de la politique
              <br/>
              par d'autres moyens.
              <br/><br/>
              Le système est, indubitablement,
              <br/>
              dans la pierre.
            </div>

            <button
              onClick={() => setShowQuiz(false)}
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
                transition: 'all 400ms ease',
                marginRight: '16px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.2)';
              }}
            >
              Retour à la carte
            </button>

            <button
              onClick={onReturn}
              style={{
                background: '#003D2C',
                border: 'none',
                padding: '16px 32px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#FAF8F2',
                cursor: 'pointer',
                transition: 'all 400ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.85';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Retour SYSTÈMES →
            </button>
          </div>
        </div>
      );
    }

    return (
      <div 
        style={{
          minHeight: '100vh',
          background: '#FAF8F2',
          padding: '80px 40px'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Progress */}
          <div 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#1A1A1A',
              opacity: 0.3,
              marginBottom: '40px',
              textAlign: 'center'
            }}
          >
            Question {currentQuestion + 1} / {QUIZ_QUESTIONS.length}
          </div>

          {/* Question */}
          <div 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '28px',
              fontWeight: 400,
              lineHeight: 1.5,
              color: '#1A1A1A',
              marginBottom: '48px',
              textAlign: 'center'
            }}
          >
            {question.question}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedAnswer(option);
                  setShowExplanation(true);
                }}
                disabled={showExplanation}
                style={{
                  background: selectedAnswer === option 
                    ? (i === question.correct ? 'rgba(0, 61, 44, 0.05)' : 'rgba(200, 0, 0, 0.05)')
                    : 'transparent',
                  border: selectedAnswer === option
                    ? (i === question.correct ? '0.5px solid rgba(0, 61, 44, 0.3)' : '0.5px solid rgba(200, 0, 0, 0.3)')
                    : '0.5px solid rgba(26, 26, 26, 0.15)',
                  padding: '20px 24px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color: '#1A1A1A',
                  textAlign: 'left',
                  cursor: showExplanation ? 'default' : 'pointer',
                  transition: 'all 400ms ease'
                }}
                onMouseEnter={(e) => {
                  if (!showExplanation) {
                    e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showExplanation && selectedAnswer !== option) {
                    e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.15)';
                  }
                }}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div 
              style={{
                background: 'rgba(0, 61, 44, 0.03)',
                border: '0.5px solid rgba(0, 61, 44, 0.15)',
                padding: '32px',
                marginBottom: '40px'
              }}
            >
              <div 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: isCorrect ? '#003D2C' : '#8B0000',
                  marginBottom: '16px'
                }}
              >
                {isCorrect ? 'Correct' : 'Incorrect'}
              </div>
              <div 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: 1.8,
                  color: '#1A1A1A'
                }}
              >
                {question.explication}
              </div>
            </div>
          )}

          {/* Navigation */}
          {showExplanation && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => {
                  if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
                    setCurrentQuestion(currentQuestion + 1);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                  } else {
                    setQuizFinished(true);
                  }
                }}
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.85';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {currentQuestion < QUIZ_QUESTIONS.length - 1 ? 'Suivant →' : 'Terminer'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main card view
  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        padding: 'clamp(24px, 5vw, 80px)'
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: '1400px', margin: '0 auto 64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            transition: 'opacity 400ms ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
        >
          ← Retour
        </button>

        <button
          onClick={() => setShowQuiz(true)}
          style={{
            background: 'transparent',
            border: '0.5px solid rgba(0, 61, 44, 0.2)',
            padding: '12px 24px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
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
          Quiz →
        </button>
      </div>

      {/* Content grid */}
      <div 
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 'clamp(40px, 5vw, 80px)',
          alignItems: 'start'
        }}
      >
        {/* Left: Title + Principle */}
        <div>
          <h1 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(48px, 6vw, 72px)',
              fontWeight: 400,
              lineHeight: 1.1,
              color: '#1A1A1A',
              marginBottom: '40px'
            }}
          >
            Architecture
          </h1>

          <div 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#1A1A1A',
              opacity: 0.4,
              marginBottom: '32px'
            }}
          >
            Forme · Fonction · Hiérarchie
          </div>

          <div 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 400,
              lineHeight: 1.8,
              color: '#1A1A1A',
              marginBottom: '64px'
            }}
          >
            {PRINCIPE}
          </div>

          {/* Mécanismes */}
          <div>
            <div 
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#1A1A1A',
                opacity: 0.4,
                marginBottom: '24px'
              }}
            >
              Mécanismes Architecturaux
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {MECANISMES.map((mecanisme, i) => (
                <div key={i}>
                  <div 
                    style={{
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      fontSize: '18px',
                      fontWeight: 400,
                      lineHeight: 1.4,
                      color: '#1A1A1A',
                      marginBottom: '12px'
                    }}
                  >
                    {mecanisme.nom}
                  </div>
                  <div 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      fontWeight: 400,
                      lineHeight: 1.8,
                      color: '#1A1A1A',
                      opacity: 0.7
                    }}
                  >
                    {mecanisme.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Timeline */}
        <div>
          <div 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#1A1A1A',
              opacity: 0.4,
              marginBottom: '32px'
            }}
          >
            Jalons Historiques
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {JALONS.map((jalon, i) => (
              <div 
                key={i}
                style={{
                  borderLeft: '0.5px solid rgba(26, 26, 26, 0.15)',
                  paddingLeft: '32px',
                  position: 'relative'
                }}
              >
                {/* Dot */}
                <div 
                  style={{
                    position: 'absolute',
                    left: '-4px',
                    top: '6px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#1A1A1A'
                  }}
                />

                {/* Period */}
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
                  {jalon.periode}
                </div>

                {/* Title */}
                <div 
                  style={{
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    fontSize: '20px',
                    fontWeight: 400,
                    lineHeight: 1.3,
                    color: '#1A1A1A',
                    marginBottom: '12px'
                  }}
                >
                  {jalon.titre}
                </div>

                {/* Text */}
                <div 
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
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
    </div>
  );
}
