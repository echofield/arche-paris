/**
 * SYSTÈMES — CARTE POUVOIR
 * Légitimité · Coercition · Exception
 */

import { useState } from 'react';

interface SystemesPouvoirProps {
  onReturn: () => void;
}

const PRINCIPE = `L'Arché (ἀρχή) porte une dualité : le commencement et le commandement. À Paris, elle cesse d'être abstraite pour devenir minérale. Le Palais de l'Élysée n'est pas qu'un bureau : c'est le cockpit de Jupiter, avec un bunker nucléaire enfoui sous les jardins. Matignon administre, Bourbon délibère, Luxembourg tempère. Mais le pouvoir réel circule ailleurs : dans les réseaux technocratiques (ENA, Polytechnique), les dîners du Siècle, et l'exception souveraine (le feu nucléaire, l'Article 16). Ce qui frappe, c'est la continuité : malgré les révolutions, l'Arché reste centralisée, verticale, et sacrée. Paris ne gouverne pas la France, elle l'ordonne.`;

const JALONS = [
  {
    periode: 'XIIe–XVIIe siècles',
    titre: 'De la féodalité à l\'absolutisme : La pulsion centralisatrice',
    texte: 'La féodalité fragmentait la souveraineté : le pouvoir était une possession privée, liée à la terre. La monarchie capétienne détruit cet émiettement. Louis XIV domestique la noblesse à Versailles, la coupant de ses bases territoriales. L\'administration réelle est confiée aux Intendants (ancêtres des préfets), commis qui ne doivent leur statut qu\'au Roi. L\'absolutisme n\'est pas la tyrannie : c\'est la concentration du pouvoir régalien (justice, armée, impôt) dans une main unique, délié des liens féodaux.'
  },
  {
    periode: '1793–1794',
    titre: 'Jacobinisme : L\'unité radicale',
    texte: 'La Révolution transfère la souveraineté absolue du Roi à la "Nation". Le Jacobinisme (Comité de Salut Public, Pavillon de Flore) radicalise cette pulsion : haine des factions, désir d\'unité totale, combat contre les particularismes locaux. C\'est la dictature de nécessité, l\'état d\'exception où la loi est suspendue pour sauver la Révolution. Le Jacobinisme établit le principe que l\'État central est le seul représentant légitime de la volonté générale.'
  },
  {
    periode: '1799–1815',
    titre: 'Bonapartisme : La modernisation autoritaire',
    texte: 'Bonaparte réalise la synthèse : égalité civile (Code Civil) + autorité monarchique. Le Chef contourne les corps intermédiaires pour un lien direct avec le peuple (plébiscite). Il achève l\'État administratif (Préfets, Conseil d\'État) et fonde une élite méritocratique (Légion d\'honneur, Grandes Écoles). Le bonapartisme est technocratique avant la lettre : efficacité et ordre priment sur délibération. La Ve République est largement un "bonapartisme parlementaire".'
  },
  {
    periode: '1958–présent',
    titre: 'Ve République : Jupiter présidentiel',
    texte: 'De Gaulle conçoit un Président fort, au-dessus des partis, élu au suffrage universel direct (1962). Le "domaine réservé" (défense, diplomatie) lui appartient. L\'Élysée devient une "monarchie nucléaire" : le Président seul peut déclencher le feu nucléaire. C\'est une concentration de pouvoir vertigineuse sur un individu. L\'Article 16 (pouvoirs exceptionnels en cas de crise) constitutionnalise la dictature temporaire. La fonction présidentielle est sacralisée par le rituel, le protocole, et le secret.'
  }
];

const MECANISMES = [
  {
    nom: 'Les 5 Bases du Pouvoir (French & Raven)',
    description: '1. Légitime : obéir à la fonction, pas à la personne (écharpe tricolore, robe du juge). 2. Coercitif : capacité de punir (justice, police, "mort sociale"). 3. Récompense : distribution d\'honneurs (Légion d\'honneur), de postes, de prestige. 4. Expert : domination par le savoir technique (technocratie, Grands Corps). 5. Référence : charisme du leader (homme providentiel). Le système français utilise les cinq simultanément, mais privilégie la légitimité formelle et l\'expertise.'
  },
  {
    nom: 'Les Lieux Physiques du Commandement',
    description: 'Élysée : Salon Doré (souveraineté) + PC Jupiter (bunker nucléaire, 20m sous terre, cage de Faraday). Matignon : moteur administratif, jardin secret, tradition de planter un arbre. Bourbon : Hémicycle (géométrie Gauche/Droite), cellule de dégrisement, souterrains. Luxembourg : sagesse du Sénat, bunker de la Luftwaffe (Occupation). Pavillon de Flore : ancien Comité de Salut Public (Terreur 1793), spectre de l\'exception révolutionnaire.'
  },
  {
    nom: 'L\'Exception Souveraine : Le Feu Nucléaire',
    description: 'Le Président seul décide du déclenchement nucléaire. Pas de filtre, pas de vote. C\'est la définition ultime de la souveraineté : le pouvoir de vie et de mort sur la Nation. La "sacoche nucléaire" qui le suit partout est le regalia moderne. Cela sacralise la fonction : il devient "monarque de l\'apocalypse". L\'Article 16 complète : en cas de crise grave, le Président absorbe tous les pouvoirs. C\'est une dictature constitutionnalisée, héritée du droit romain et des crises du XXe siècle.'
  }
];

const QUIZ_QUESTIONS = [
  {
    question: 'Que signifie "Arché" (ἀρχή) dans le contexte du pouvoir parisien ?',
    options: [
      'Un style architectural grec',
      'Le commencement ET le commandement : origine et autorité fusionnés',
      'Un type de gouvernement démocratique',
      'Une école philosophique'
    ],
    correct: 1,
    explication: 'L\'Arché porte une dualité fondatrice : elle désigne à la fois le commencement (le point d\'origine) et le commandement (l\'autorité qui ordonne). À Paris, cette fusion devient tangible : le pouvoir se concentre géographiquement dans des lieux qui sont à la fois l\'origine historique de la souveraineté (Palais, bunkers) et les centres actuels de décision.'
  },
  {
    question: 'Qu\'est-ce que le "PC Jupiter" enfoui sous les jardins de l\'Élysée ?',
    options: [
      'Une salle de réception pour les chefs d\'État',
      'Un bunker antiatomique où se réunit le Conseil de Défense et d\'où peut être déclenché le feu nucléaire',
      'Un abri pour les archives présidentielles',
      'Un parking souterrain'
    ],
    correct: 1,
    explication: 'Le PC Jupiter est un Poste de Commandement enfoui sous l\'Élysée, conçu pour résister à une frappe nucléaire. C\'est une cage de Faraday où se réunit le Conseil de Défense. C\'est le lieu ultime de la souveraineté : le Président y exerce son "domaine réservé" (défense, diplomatie) et peut y déclencher le feu nucléaire. C\'est le noyau dur de l\'État, invisible mais omniprésent.'
  },
  {
    question: 'Selon le modèle de French & Raven, quelle base de pouvoir est hypertrophiée en France ?',
    options: [
      'Le pouvoir de récompense',
      'Le pouvoir coercitif',
      'Le pouvoir de l\'Expert (technocratie : ENA, Polytechnique, Grands Corps)',
      'Le pouvoir de référence'
    ],
    correct: 2,
    explication: 'La France est l\'État technocratique par excellence. Le Pouvoir de l\'Expert découle de la possession de connaissances techniques. Les Grands Corps (Inspection des Finances, Conseil d\'État) exercent une influence immense non parce qu\'ils sont élus, mais parce qu\'ils "savent". Ce savoir confère une autorité qui supplante souvent la volonté politique démocratique.'
  },
  {
    question: 'Pourquoi la Ve République est-elle qualifiée de "bonapartisme parlementaire" ?',
    options: [
      'Parce qu\'elle admire Napoléon',
      'Parce qu\'elle combine un Chef fort (lien direct avec le peuple) et une technocratie méritocratique, comme Bonaparte',
      'Parce qu\'elle est militariste',
      'Parce qu\'elle rejette la démocratie'
    ],
    correct: 1,
    explication: 'Le bonapartisme réalise la synthèse entre héritage révolutionnaire (égalité, souveraineté populaire via plébiscite) et autorité monarchique (centralisation, prééminence de l\'exécutif). La Ve République reproduit ce schéma : Président élu au suffrage universel direct, contournant les corps intermédiaires, appuyé sur une technocratie (ENA). De Gaulle a consciemment réactivé ce modèle.'
  },
  {
    question: 'Que symbolise le Pavillon de Flore (Louvre) dans l\'histoire du pouvoir parisien ?',
    options: [
      'La résidence des rois de France',
      'Le siège du Comité de Salut Public (1793-1794) : la Terreur, l\'état d\'exception révolutionnaire',
      'Le premier musée de France',
      'Un lieu de festivités royales'
    ],
    correct: 1,
    explication: 'Le Pavillon de Flore abritait le Comité de Salut Public pendant la Révolution (alors nommé Pavillon de l\'Égalité). C\'est là que Robespierre et Saint-Just ont orchestré la Terreur, gérant la guerre et la guillotine. Il représente la "face sombre" de la République : l\'état d\'exception où la loi est suspendue pour sauver la Révolution. C\'est le monument de la "dictature de la vertu".'
  }
];

export function SystemesPouvoir({ onReturn }: SystemesPouvoirProps) {
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
              Le pouvoir en France n'est jamais nu.
              <br/><br/>
              Il est habillé de rituels,
              <br/>
              enfoui dans des bunkers,
              <br/>
              et sacralisé par l'exception.
              <br/><br/>
              L'Arché est la permanence sous les régimes.
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
            Pouvoir
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
            Légitimité · Coercition · Exception
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
              Anatomie du Commandement
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
