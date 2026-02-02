/**
 * ARCHÉ — Méridiens: three thresholds (Cosmic → Civil → Absolute).
 * Observation prompts (no quiz). Inscription to Carnet.
 */

export type ObservationPrompt = {
  id: string;
  textFR: string;
  textEN: string;
};

export type ThresholdId = 'saint-sulpice' | 'horloge' | 'point-zero';

export type Threshold = {
  id: ThresholdId;
  titleFR: string;
  titleEN: string;
  subtitleFR: string;
  subtitleEN: string;
  lat: number;
  lng: number;
  radiusM: number;
  arrivalContentFR: string;
  arrivalContentEN: string;
  prompts: ObservationPrompt[];
  inscriptionPromptFR: string;
  inscriptionPromptEN: string;
};

export type MeridienSession = {
  startedAt: string;
  thresholdsVisited: ThresholdId[];
  completed: boolean;
};

const THRESHOLDS: Threshold[] = [
  {
    id: 'saint-sulpice',
    titleFR: 'Le Regard Solaire',
    titleEN: 'The Solar Gaze',
    subtitleFR: 'Saint-Sulpice',
    subtitleEN: 'Saint-Sulpice',
    lat: 48.8512,
    lng: 2.3347,
    radiusM: 50,
    arrivalContentFR: `Vous êtes dans l'ombre de la Double Colonnade. Servandoni a conçu cette façade comme un écran de théâtre : le portail central, les deux tours. L'une achevée, l'autre jamais tout à fait. L'asymétrie n'est pas un accident ; c'est une leçon. La loggia au-dessus du portail capte la lumière. Debout devant l'église, vous apprenez à lire ce que le temps a laissé : l'inscription fantôme de 1794, les lettres à peine visibles. Le méridien traverse le bâtiment. Ici, l'heure était solaire avant d'être civile.`,
    arrivalContentEN: `You stand in the shadow of the Double Colonnade. Servandoni designed this façade as a theatrical screen: the central portal, the two towers. One completed, the other never quite. The asymmetry is not an accident; it is a lesson. The loggia above the portal catches the light. Standing before the church, you learn to read what time has left: the ghost inscription of 1794, the faint letters. The meridian runs through the building. Here, time was solar before it was civil.`,
    prompts: [
      { id: 'towers', textFR: 'Les deux tours. Se ressemblent-elles ?', textEN: 'The towers. Do they match?' },
      { id: 'portal', textFR: "Au-dessus du portail central, des lettres de 1794. Trouvez-les. Qu'annoncent-elles ?", textEN: 'Above the central portal, faint letters from 1794. Find them. What do they declare?' },
      { id: 'loggia', textFR: "Tenez-vous dans la loggia. Où tombe l'ombre ?", textEN: "Stand in the loggia. Where does the shadow fall?" }
    ],
    inscriptionPromptFR: "Qu'avez-vous vu qui n'était pas dans le prompt ?",
    inscriptionPromptEN: 'What did you see that wasn\'t in the prompt?'
  },
  {
    id: 'horloge',
    titleFR: 'La Machine du Roi',
    titleEN: 'The King\'s Machine',
    subtitleFR: 'Tour de l\'Horloge',
    subtitleEN: 'Tour de l\'Horloge',
    lat: 48.8534,
    lng: 2.3462,
    radiusM: 30,
    arrivalContentFR: `Charles V a fait de l'heure une affaire d'État. La Tour de l'Horloge du Palais de la Cité affichait le temps pour la ville : une machine de pouvoir. Le cadran, l'or, les inscriptions latines. Sous le cadran, une phrase avertit les juges : le temps ne pardonne pas. À droite, un écu : pas de fleurs de lys — un aigle. Le pouvoir se lit dans les détails. Les deux figures qui flanquent l'horloge tiennent des masses. Le temps civil est un temps de contrainte.`,
    arrivalContentEN: `Charles V made the hour a matter of state. The Tour de l'Horloge of the Palais de la Cité displayed time for the city: a machine of power. The dial, the gold, the Latin inscriptions. Beneath the dial, a phrase warns the judges: time does not forgive. On the right, a shield: not fleurs-de-lys—an eagle. Power is read in the details. The two figures flanking the clock hold maces. Civil time is a time of constraint.`,
    prompts: [
      { id: 'latin', textFR: "Lisez le latin sous le cadran. Qu'avertit-il ?", textEN: 'Read the Latin beneath the dial. What does it warn?' },
      { id: 'shield', textFR: "L'écu à droite : pas de fleurs de lys. Quel oiseau ?", textEN: 'The shield on the right: not fleurs-de-lys. What bird?' },
      { id: 'figures', textFR: "Les deux figures qui flanquent l'horloge. Que tiennent-elles ?", textEN: 'The two figures flanking the clock. What do they hold?' }
    ],
    inscriptionPromptFR: "Qu'avez-vous remarqué sur le pouvoir et le temps ?",
    inscriptionPromptEN: 'What did you notice about power and time?'
  },
  {
    id: 'point-zero',
    titleFR: "L'Ancre",
    titleEN: 'The Anchor',
    subtitleFR: 'Point Zéro',
    subtitleEN: 'Point Zéro',
    lat: 48.8534,
    lng: 2.3488,
    radiusM: 20,
    arrivalContentFR: `Au centre géodésique de la France, un modeste octogone de laiton. Point Zéro des routes. Ici, toutes les distances commencent. L'échelle de la Justice a disparu ; le point reste. Les pèlerins tournent, posent le pied, font selfie. Le rituel est récent ; le symbole est ancien. Vous êtes au centre. Rien ne bouge. L'espace absolu.`,
    arrivalContentEN: `At the geodetic center of France, a modest brass octagon. Point Zéro of the roads. Here, all distances begin. The Ladder of Justice is gone; the point remains. Pilgrims spin, place a foot, take selfies. The ritual is recent; the symbol is old. You are at the center. Nothing moves. Absolute space.`,
    prompts: [
      { id: 'octagon', textFR: "Trouvez l'octogone de laiton. Quels quatre mots le bordent ?", textEN: 'Find the brass octagon. What four words border it?' },
      { id: 'visitors', textFR: "Regardez les visiteurs. Que font-ils quand ils le trouvent ?", textEN: 'Watch the visitors. What do they do when they find it?' }
    ],
    inscriptionPromptFR: "Vous êtes au centre. Qu'est-ce que cela signifie pour vous ?",
    inscriptionPromptEN: 'You stand at the center. What does that mean to you?'
  }
];

export const MERIDIEN_THRESHOLDS = THRESHOLDS;

export function getThresholdById(id: ThresholdId): Threshold | undefined {
  return THRESHOLDS.find((t) => t.id === id);
}

export function getThresholds(): Threshold[] {
  return [...THRESHOLDS];
}
