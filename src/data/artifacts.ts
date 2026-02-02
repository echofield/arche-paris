/**
 * ARCHÉ — Artifact targets for Trésor Caché / Compass.
 * Static list only. No server. Proof-based, not GPS-validated.
 */

export interface Artifact {
  id: string;
  title: string;
  areaLabel: string;
  lat: number;
  lng: number;
  proofInstructionFR: string;
  proofInstructionEN: string;
  proofCodeHint?: string;
  /** Quest id for "See the linked walk" (e.g. temporal-meridians, hunter-montmartre) */
  linkedQuestId?: string;
}

export const ARTIFACTS: Artifact[] = [
  {
    id: 'saint-sulpice-meridian',
    title: 'Saint-Sulpice — Méridien',
    areaLabel: 'Saint-Sulpice',
    lat: 48.8512,
    lng: 2.3347,
    proofInstructionFR: 'Une photo du gnomon ou des médaillons d\'Arago. Pas de localisation enregistrée.',
    proofInstructionEN: 'A photo of the gnomon or Arago medallions. No location is stored.',
    proofCodeHint: 'gnomon / médaillons',
    linkedQuestId: 'temporal-meridians'
  },
  {
    id: 'montmartre-passe-muraille',
    title: 'Le Passe-Muraille',
    areaLabel: 'Montmartre',
    lat: 48.8867,
    lng: 2.3372,
    proofInstructionFR: 'Une photo de la statue ou du mur. Pas de localisation enregistrée.',
    proofInstructionEN: 'A photo of the statue or the wall. No location is stored.',
    proofCodeHint: 'Marcel Aymé',
    linkedQuestId: 'hunter-montmartre'
  }
];

export function getArtifactById(id: string): Artifact | undefined {
  return ARTIFACTS.find((a) => a.id === id);
}
