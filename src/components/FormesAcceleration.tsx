/**
 * ÉTUDES — FORMES / ACCÉLÉRATION PERCEPTIVE
 * 
 * Module : Exposition continue aux structures visuelles
 * Durée : 90 secondes
 * Vitesse : 300 → 900 mots/minute (progressive)
 * 
 * Objectif : Accélération de la perception visuelle
 * Méthode : Exposition, pas explication
 * Validation : Aucune
 */

import { useState, useEffect, useRef } from 'react';
import { AccelerationIntro } from './AccelerationIntro';

interface FormesAccelerationProps {
  onComplete: () => void;
}

// Texte d'accélération (750-850 mots)
const ACCELERATION_TEXT = `
Une ligne verticale.
Une ligne horizontale.
Elles se croisent.
Un angle se forme.
L'angle devient structure.

La verticale porte.
L'horizontale couvre.
La diagonale stabilise.
Trois directions organisent l'espace.

Un point d'appui au sol.
Une charge descend.
Le point concentre la force.
La masse se répartit.

Un mur monte.
Il sépare deux espaces.
Il ne ferme pas toujours.
Parfois il filtre.
Parfois il guide.

Une ouverture dans le mur.
Le vide devient actif.
Il appelle le passage.
Il organise le mouvement.

Deux verticales parallèles.
L'espace entre elles vibre.
La distance crée tension.
La tension crée attente.

Une colonne seule.
Puis une deuxième.
Puis une troisième.
Le rythme apparaît.
La répétition stabilise le regard.

Un axe invisible traverse l'espace.
Les éléments s'alignent.
L'alignement révèle l'intention.
L'intention ordonne sans contraindre.

Une masse pleine.
Une masse creuse.
Le plein absorbe.
Le vide accueille.
L'équilibre naît du contraste.

Cinq colonnes régulières.
Même distance entre chacune.
La cadence calme.
La rupture devient visible.

Un point haut.
Un point bas.
La gravité décide.
La structure répond.

Trois lignes horizontales superposées.
Elles divisent la hauteur.
Chaque division crée proportion.
La proportion organise la lecture.

Un pilier large.
Il stabilise par volume.
La masse rassure.
La finesse interroge.

Une ligne continue.
Elle traverse sans s'arrêter.
Elle relie des points distants.
L'axe dépasse les lieux qu'il organise.

Deux appuis au sol.
Un vide entre eux.
La portée mesure la confiance.
La portée révèle la maîtrise.

Une verticale qui monte.
Elle cherche le ciel.
Une horizontale qui s'étend.
Elle occupe le sol.
L'une élève.
L'autre ancre.

Un motif se répète.
Fenêtre après fenêtre.
Travée après travée.
La répétition n'est pas monotonie.
Elle est rythme.

Un seuil épaissit la limite.
Il ralentit le passage.
Il prépare la transition.
Entrer devient acte.

Trois masses inégales.
La plus grande domine.
Les autres suivent.
La hiérarchie guide l'œil.

Une ligne brisée.
Un angle aigu.
La direction change.
Le mouvement s'impose.

Un plan vertical.
Un plan horizontal.
Leur intersection crée l'angle droit.
L'angle droit stabilise.

Une façade régulière.
Chaque élément prévu.
La prévisibilité apaise.
La surprise déstabilise.

Un vide central.
Des masses autour.
Le vide organise.
Le plein entoure.

Une colonne fine.
Elle concentre la charge.
Sa section réduite exige précision.
La précision traduit confiance.

Deux lignes parallèles.
Elles ne se rencontrent jamais.
Leur distance reste constante.
La constance crée calme.

Un point de convergence.
Plusieurs lignes y mènent.
La convergence attire.
L'attention se concentre.

Une base large.
Un sommet étroit.
La pyramide se stabilise.
L'inverse interroge l'équilibre.

Une grille apparaît.
Verticales et horizontales se croisent.
Chaque intersection est un point.
La grille ordonne avant de remplir.

Un élément répété.
Puis une variation.
La variation devient événement.
L'événement marque la mémoire.

Une ligne d'horizon.
Elle sépare terre et ciel.
La séparation est nette.
La netteté oriente.

Un appui invisible.
La structure tient pourtant.
L'invisible structure autant que le visible.

Une ouverture haute.
Une ouverture basse.
La lumière entre différemment.
La différence crée atmosphère.

Trois piliers en triangle.
Ils forment base stable.
La stabilité libère la hauteur.

Une ligne courbe.
Elle dévie l'attente.
La déviation crée surprise.
La surprise ralentit le regard.

Un mur continu.
Pas d'ouverture.
La continuité ferme.
La fermeture concentre.

Cinq verticales.
Quatre intervalles.
Les intervalles comptent autant que les lignes.
Le vide structure.

Un axe central.
Tout se répartit de part et d'autre.
La symétrie naît.
La symétrie simplifie.

Une charge lourde.
Un support fin.
La tension est visible.
La visibilité interroge.

Deux masses égales.
Elles s'équilibrent.
L'équilibre satisfait.
Le déséquilibre alerte.

Une limite poreuse.
Elle laisse passer.
Elle filtre.
Elle module la relation.

Un motif simple.
Il se répète cent fois.
La répétition devient texture.
La texture devient fond.

Une diagonale monte.
Elle force le mouvement.
Le mouvement implique le corps.

Un volume plein.
Il occupe l'espace.
L'occupation affirme.
L'affirmation ancre.

Une ligne droite.
Le plus court chemin.
La droiture oriente.
L'orientation guide.

Un rectangle vertical.
Un rectangle horizontal.
Le vertical élève.
L'horizontal étend.

Trois points alignés.
L'alignement n'est pas hasard.
Il révèle intention.
L'intention organise.

Une structure visible.
Une structure cachée.
La cachée porte la visible.
Porter n'exige pas montrer.

Un rythme régulier.
Il apaise.
Un rythme brisé.
Il alerte.

La forme précède le sens.
La forme organise avant de signifier.
La reconnaissance suffit.
`.trim();

// Convertir le texte en tableau de mots
const WORDS = ACCELERATION_TEXT.split(/\s+/).filter(w => w.length > 0);

export function FormesAcceleration({ onComplete }: FormesAccelerationProps) {
  const [stage, setStage] = useState<'intro' | 'running' | 'outro'>('intro');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const startTimeRef = useRef<number>(0);

  // Calculer la vitesse en fonction du temps écoulé
  const getIntervalForProgress = (progress: number): number => {
    // Vitesse : 300 WPM → 900 WPM
    // 300 WPM = 200ms par mot
    // 900 WPM = 66.6ms par mot
    // Progression linéaire
    const minInterval = 66.6; // 900 WPM
    const maxInterval = 200;  // 300 WPM
    return maxInterval - (progress * (maxInterval - minInterval));
  };

  // Démarrer l'accélération
  const handleStart = () => {
    setStage('running');
    startTimeRef.current = Date.now();
  };

  // Boucle d'affichage des mots
  useEffect(() => {
    if (stage !== 'running') return;

    const totalDuration = 90000; // 90 secondes
    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsed / totalDuration, 1);

    if (currentWordIndex >= WORDS.length || progress >= 1) {
      setStage('outro');
      setIsComplete(true);
      return;
    }

    const interval = getIntervalForProgress(progress);
    const timer = setTimeout(() => {
      setCurrentWordIndex(prev => prev + 1);
    }, interval);

    return () => clearTimeout(timer);
  }, [stage, currentWordIndex]);

  // Écran d'introduction
  if (stage === 'intro') {
    return (
      <AccelerationIntro
        context="FORMES"
        onEnter={handleStart}
      />
    );
  }

  // Écran d'accélération
  if (stage === 'running') {
    const currentWord = WORDS[currentWordIndex] || '';
    const progress = currentWordIndex / WORDS.length;

    return (
      <div 
        style={{
          minHeight: '100vh',
          background: '#FAF8F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          position: 'relative'
        }}
      >
        {/* Barre de progression discrète */}
        <div 
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: `${progress * 100}%`,
            height: '1px',
            background: '#003D2C',
            opacity: 0.2,
            transition: 'width 100ms linear'
          }}
        />

        {/* Mot actuel */}
        <div 
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 400,
            color: '#1A1A1A',
            opacity: 0.9,
            textAlign: 'center',
            lineHeight: 1.2
          }}
        >
          {currentWord}
        </div>
      </div>
    );
  }

  // Écran de sortie
  if (stage === 'outro') {
    return (
      <div 
        style={{
          minHeight: '100vh',
          background: '#FAF8F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px'
        }}
      >
        <div style={{ maxWidth: '600px', textAlign: 'center' }}>
          <p 
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '24px',
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#1A1A1A',
              opacity: 0.7,
              marginBottom: '64px',
              whiteSpace: 'pre-line'
            }}
          >
            {`Aucune validation.\nAucune réponse attendue.\nLa forme a travaillé d'elle-même.`}
          </p>

          <button
            onClick={onComplete}
            style={{
              background: 'transparent',
              border: '0.5px solid rgba(26, 26, 26, 0.2)',
              padding: '16px 48px',
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
            Continuer
          </button>
        </div>
      </div>
    );
  }

  return null;
}