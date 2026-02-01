/**
 * SYSTÈMES — CARTE POUVOIR (avec Seuil)
 * Légitimité · Coercition · Exception
 */

import { useState } from 'react';
import { Seuil } from './Seuil';

interface SystemesPouvoirSeuilProps {
  onReturn: () => void;
}

const PRINCIPE = `L'Arché (ἀρχή) porte une dualité : le commencement et le commandement.

À Paris, elle cesse d'être abstraite pour devenir minérale.

Le Palais de l'Élysée n'est pas qu'un bureau : c'est le cockpit de Jupiter, avec un bunker nucléaire enfoui sous les jardins.

Matignon administre.
Bourbon délibère.
Luxembourg tempère.

Mais le pouvoir réel circule ailleurs : dans les réseaux technocratiques (ENA, Polytechnique), les dîners du Siècle, et l'exception souveraine (le feu nucléaire, l'Article 16).

Ce qui frappe, c'est la continuité : malgré les révolutions, l'Arché reste centralisée, verticale, et sacrée.

Paris ne gouverne pas la France, elle l'ordonne.`;

const JALONS = [
  {
    periode: 'XIIe–XVIIe siècles',
    titre: 'De la féodalité à l\'absolutisme',
    texte: 'La féodalité fragmentait la souveraineté : le pouvoir était une possession privée, liée à la terre.\n\nLa monarchie capétienne détruit cet émiettement.\n\nLouis XIV domestique la noblesse à Versailles, la coupant de ses bases territoriales. L\'administration réelle est confiée aux Intendants (ancêtres des préfets), commis qui ne doivent leur statut qu\'au Roi.\n\nL\'absolutisme n\'est pas la tyrannie : c\'est la concentration du pouvoir régalien (justice, armée, impôt) dans une main unique, délié des liens féodaux.'
  },
  {
    periode: '1793–1794',
    titre: 'Jacobinisme : L\'unité radicale',
    texte: 'La Révolution transfère la souveraineté absolue du Roi à la "Nation".\n\nLe Jacobinisme (Comité de Salut Public, Pavillon de Flore) radicalise cette pulsion : haine des factions, désir d\'unité totale, combat contre les particularismes locaux.\n\nC\'est la dictature de nécessité, l\'état d\'exception où la loi est suspendue pour sauver la Révolution.\n\nLe Jacobinisme établit le principe que l\'État central est le seul représentant légitime de la volonté générale.'
  },
  {
    periode: '1799–1815',
    titre: 'Bonapartisme : La modernisation autoritaire',
    texte: 'Bonaparte réalise la synthèse : égalité civile (Code Civil) + autorité monarchique.\n\nLe Chef contourne les corps intermédiaires pour un lien direct avec le peuple (plébiscite).\n\nIl achève l\'État administratif (Préfets, Conseil d\'État) et fonde une élite méritocratique (Légion d\'honneur, Grandes Écoles).\n\nLe bonapartisme est technocratique avant la lettre : efficacité et ordre priment sur délibération.\n\nLa Ve République est largement un "bonapartisme parlementaire".'
  },
  {
    periode: '1958–présent',
    titre: 'Ve République : Jupiter présidentiel',
    texte: 'De Gaulle conçoit un Président fort, au-dessus des partis, élu au suffrage universel direct (1962).\n\nLe "domaine réservé" (défense, diplomatie) lui appartient.\n\nL\'Élysée devient une "monarchie nucléaire" : le Président seul peut déclencher le feu nucléaire. C\'est une concentration de pouvoir vertigineuse sur un individu.\n\nL\'Article 16 (pouvoirs exceptionnels en cas de crise) constitutionnalise la dictature temporaire.\n\nLa fonction présidentielle est sacralisée par le rituel, le protocole, et le secret.'
  }
];

const MECANISMES = [
  {
    nom: 'Les 5 Bases du Pouvoir',
    texte: '1. Légitime : obéir à la fonction, pas à la personne (écharpe tricolore, robe du juge).\n\n2. Coercitif : capacité de punir (justice, police, "mort sociale").\n\n3. Récompense : distribution d\'honneurs (Légion d\'honneur), de postes, de prestige.\n\n4. Expert : domination par le savoir technique (technocratie, Grands Corps).\n\n5. Référence : charisme du leader (homme providentiel).\n\nLe système français utilise les cinq simultanément, mais privilégie la légitimité formelle et l\'expertise.'
  },
  {
    nom: 'Les Lieux Physiques du Commandement',
    texte: 'Élysée : Salon Doré (souveraineté) + PC Jupiter (bunker nucléaire, 20m sous terre, cage de Faraday).\n\nMatignon : moteur administratif, jardin secret, tradition de planter un arbre.\n\nBourbon : Hémicycle (géométrie Gauche/Droite), cellule de dégrisement, souterrains.\n\nLuxembourg : sagesse du Sénat, bunker de la Luftwaffe (Occupation).\n\nPavillon de Flore : ancien Comité de Salut Public (Terreur 1793), spectre de l\'exception révolutionnaire.'
  },
  {
    nom: 'L\'Exception Souveraine : Le Feu Nucléaire',
    texte: 'Le Président seul décide du déclenchement nucléaire.\n\nPas de filtre, pas de vote.\n\nC\'est la définition ultime de la souveraineté : le pouvoir de vie et de mort sur la Nation.\n\nLa "sacoche nucléaire" qui le suit partout est le regalia moderne.\n\nCela sacralise la fonction : il devient "monarque de l\'apocalypse".\n\nL\'Article 16 complète : en cas de crise grave, le Président absorbe tous les pouvoirs. C\'est une dictature constitutionnalisée, héritée du droit romain et des crises du XXe siècle.'
  }
];

// SEUIL : Épreuves de lecture
const SEUIL_ITEMS = [
  {
    format: 'interpretatif' as const,
    question: 'Ce que tu viens de lire te parle surtout de :',
    options: [
      {
        label: 'Contrôle',
        revelation: 'Tu lis Paris par ses mécanismes de surveillance et de maîtrise des corps.'
      },
      {
        label: 'Rituel',
        revelation: 'Tu perçois d\'abord la dimension symbolique et sacrée du pouvoir.'
      },
      {
        label: 'Continuité',
        revelation: 'Ce qui te frappe, c\'est la permanence des structures malgré les ruptures.'
      },
      {
        label: 'Exception',
        revelation: 'Tu identifies immédiatement les moments où la loi est suspendue.'
      }
    ]
  },
  {
    format: 'correspondance' as const,
    question: 'Associe instinctivement.',
    items: [
      { left: 'Élysée', right: 'Souveraineté' },
      { left: 'Matignon', right: 'Administration' },
      { left: 'Bourbon', right: 'Délibération' },
      { left: 'PC Jupiter', right: 'Exception' }
    ],
    revelation: 'À Paris, chaque lieu de pouvoir a une fonction précise. L\'architecture n\'est jamais arbitraire : elle incarne la division du travail politique.'
  },
  {
    format: 'temporel' as const,
    question: 'Lequel te semble encore actif aujourd\'hui ?',
    fragments: [
      {
        periode: 'Absolutisme (XVIIe)',
        texte: 'Concentration du pouvoir dans une main unique, rituel du chef',
        revelation: 'Tu identifies la permanence du verticalisme dans la fonction présidentielle moderne.'
      },
      {
        periode: 'Jacobinisme (1793)',
        texte: 'État d\'exception, suspension de la loi pour sauver la nation',
        revelation: 'Tu reconnais la logique de l\'urgence qui justifie les pleins pouvoirs (Article 16, états d\'urgence).'
      },
      {
        periode: 'Bonapartisme (1799)',
        texte: 'Chef plébiscitaire + technocratie méritocratique',
        revelation: 'Tu vois clairement la structure de la Ve République : Président élu au suffrage universel + élite de l\'ENA/Polytechnique.'
      }
    ]
  }
];

export function SystemesPouvoirSeuil({ onReturn }: SystemesPouvoirSeuilProps) {
  const [showSeuil, setShowSeuil] = useState(false);
  const [seuilCompleted, setSeuilCompleted] = useState(false);

  // Seuil flow
  if (showSeuil && !seuilCompleted) {
    return (
      <Seuil
        items={SEUIL_ITEMS}
        onComplete={() => {
          setSeuilCompleted(true);
          setShowSeuil(false);
        }}
        cta="Mettre à l'épreuve"
      />
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
          onClick={() => setShowSeuil(true)}
          style={{
            background: 'transparent',
            border: '0.5px solid rgba(0, 61, 44, 0.2)',
            padding: '12px 24px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: seuilCompleted ? '#003D2C' : 'rgba(0, 61, 44, 0.5)',
            cursor: 'pointer',
            transition: 'all 400ms ease',
            opacity: seuilCompleted ? 1 : 0.7
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.4)';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 61, 44, 0.2)';
            e.currentTarget.style.opacity = seuilCompleted ? '1' : '0.7';
          }}
        >
          {seuilCompleted ? 'Seuil franchi ✓' : 'Passer le seuil →'}
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
              marginBottom: '64px',
              whiteSpace: 'pre-line'
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
                      opacity: 0.7,
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {mecanisme.texte}
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
                    opacity: 0.7,
                    whiteSpace: 'pre-line'
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
