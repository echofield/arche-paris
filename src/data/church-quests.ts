/**
 * ARCHÉ — Church / on-site quest definitions (code + 3 questions + timer).
 * Used by frontend for display; server has its own copy for validation/scoring.
 */

import type { ChurchQuest } from "../types/church-quest";

export const CHURCH_QUESTS: ChurchQuest[] = [
  {
    id: "stlouis_ihs",
    title: "IHS",
    place_name: "Église Saint-Louis-en-l'Île",
    onsite_code: "IHS",
    duration_sec: 210,
    questions: [
      {
        id: "q1",
        prompt: "Entre les trois lettres sur le triangle.",
        type: "text",
        answer: "IHS",
        points: 1,
      },
      {
        id: "q2",
        prompt: "Ce triangle signifie surtout :",
        type: "mcq",
        choices: ["Trinité", "Royalty", "Ordre militaire"],
        answer: "Trinité",
        points: 1,
      },
      {
        id: "q3",
        prompt: "Sur la plaque : quel jour / mois / année ?",
        type: "text",
        answer: "10 MARS 1805",
        points: 1,
      },
    ],
    rewards: {
      aura_xp: 10,
      seals: ["IHS"],
      status_unlock: "Lecteur de signes",
    },
  },
  {
    id: "st_sulpice_seuil",
    title: "Seuil",
    place_name: "Saint-Sulpice",
    onsite_code: "MERIDIEN",
    duration_sec: 210,
    questions: [
      {
        id: "q1",
        prompt: "Entre le mot trouvé sur place.",
        type: "text",
        answer: "MERIDIEN",
        points: 1,
      },
      {
        id: "q2",
        prompt: "Cette ligne sert à :",
        type: "mcq",
        choices: ["Mesurer le temps", "Définir le nord", "Marquer le méridien"],
        answer: "Marquer le méridien",
        points: 1,
      },
      {
        id: "q3",
        prompt: "En une phrase : qu'as-tu observé ?",
        type: "text",
        answer: "*",
        points: 1,
      },
    ],
    rewards: {
      aura_xp: 12,
      seals: ["SEUIL"],
      status_unlock: "Habitant du seuil",
    },
  },
];

export function getChurchQuestById(id: string): ChurchQuest | undefined {
  return CHURCH_QUESTS.find((q) => q.id === id);
}
