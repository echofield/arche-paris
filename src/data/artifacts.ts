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
  /** If true, artifact only appears / responds between 22h and 5h. */
  nocturne?: boolean;
  /** Nocturne proof copy (e.g. "Photograph the absence." / "Record 10 seconds of silence.") */
  proofInstructionNocturneFR?: string;
  proofInstructionNocturneEN?: string;
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
  },
  {
    id: 'point-zero-nocturne',
    title: 'Point Zéro — Nuit',
    areaLabel: 'Notre-Dame',
    lat: 48.8534,
    lng: 2.3488,
    proofInstructionFR: 'Photographier l\'absence. Dix secondes de silence.',
    proofInstructionEN: 'Photograph the absence. Record 10 seconds of silence.',
    proofInstructionNocturneFR: 'Photographier l\'absence. Dix secondes de silence.',
    proofInstructionNocturneEN: 'Photograph the absence. Record 10 seconds of silence.',
    nocturne: true
  }
];

export function getArtifactById(id: string): Artifact | undefined {
  return ARTIFACTS.find((a) => a.id === id);
}
