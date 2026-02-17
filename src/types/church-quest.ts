/**
 * ARCHÉ — Church / on-site quest types (code + timer + 3 questions).
 */

export type ChurchQuestId = "stlouis_ihs" | "st_sulpice_seuil";

export interface ChurchQuestion {
  id: string;
  prompt: string;
  type: "text" | "mcq";
  choices?: string[];
  /** Normalised correct answer(s) for server-side check */
  answer: string | string[];
  points: number;
}

export interface ChurchQuestRewards {
  aura_xp: number;
  seals?: string[];
  status_unlock?: string;
}

export interface ChurchQuest {
  id: ChurchQuestId;
  title: string;
  place_name: string;
  lat?: number;
  lng?: number;
  radius_m?: number;
  onsite_code: string;
  duration_sec: number;
  questions: ChurchQuestion[];
  rewards: ChurchQuestRewards;
}

export type ChurchQuestRunState = "running" | "completed" | "expired";

export interface ChurchQuestRun {
  id: string;
  card_id: string;
  quest_id: string;
  started_at: string;
  expires_at: string;
  completed_at?: string;
  state: ChurchQuestRunState;
  answers: Record<string, string>;
  score?: number;
  earned_seal?: boolean;
}

export type AuraStatus =
  | "Quiet"
  | "Marcheur"
  | "Lecteur de signes"
  | "Habitant du seuil"
  | "Gardien discret";

export interface AuraProfile {
  card_id: string;
  aura_level: number;
  aura_points: number;
  status: AuraStatus;
  last_quest_at?: string;
  seals: string[];
}
