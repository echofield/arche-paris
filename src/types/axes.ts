export type ActivationMode = 'movement' | 'alignment' | 'arrival';

export interface CityAxis {
  name: string;
  type: string;
  anchor_points: string[];
  experiential_description: string;
  walkable_experience: boolean;
  perceptual_hint: string;
  strength: number;
  invisibility_level: 'obvious' | 'subtle' | 'hidden';
  scale: 'site' | 'district' | 'city';
  activation_mode: ActivationMode;
}
