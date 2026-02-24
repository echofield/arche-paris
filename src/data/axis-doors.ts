/**
 * Axis Doors (Révélations): triggered when Meridian axis-lock reaches stable resonance.
 * Authored locally; no backend. Per-axis cooldown in localStorage.
 */

export type AxisDoorTrigger =
  | { kind: 'alignment'; minSeconds: number; maxHeadingDeg: number; maxDistM: number }
  | { kind: 'movement'; minSeconds: number; minSpeedMps: number; maxDistM: number }
  | { kind: 'arrival'; minSeconds: number; maxDistM: number };

export interface AxisDoor {
  axisId: number;
  key: string;
  title: { fr: string; en: string };
  voice: 'mascaron' | 'champ';
  line: { fr: string; en: string };
  suggestion: { fr: string; en: string };
  trigger: AxisDoorTrigger;
  cooldownMinutes: number;
  mapsQuery?: { lat: number; lng: number; label?: string };
}

/** Axis 0: Historical East–West (Louvre → La Défense), alignment */
/** Axis 2: Saint-Sulpice Solar Meridian Line, arrival */
/** Axis 3: Paris Meridian (Arago Medallions), movement */
/** Axis 4: Left-Bank North–South (Saint-Michel → Observatory), movement */

export const AXIS_DOORS: AxisDoor[] = [
  {
    axisId: 0,
    key: 'louvre_defense',
    title: { fr: 'L’axe du ciel', en: 'The sky axis' },
    voice: 'mascaron',
    line: {
      fr: 'Tu tiens la ligne. D’une arche à l’autre, la ville se plie en un seul corridor.',
      en: 'You hold the line. From one arch to the next, the city folds into a single corridor.',
    },
    suggestion: {
      fr: 'Continue. Garde l’alignement.',
      en: 'Continue. Keep the alignment.',
    },
    trigger: {
      kind: 'alignment',
      minSeconds: 4,
      maxHeadingDeg: 14,
      maxDistM: 130,
    },
    cooldownMinutes: 30,
    mapsQuery: { lat: 48.861, lng: 2.3362, label: 'Louvre' },
  },
  {
    axisId: 2,
    key: 'saint_sulpice_solar',
    title: { fr: 'La ligne de lumière', en: 'The line of light' },
    voice: 'mascaron',
    line: {
      fr: 'Ici le méridien solaire traverse la pierre. Le temps et l’espace se croisent sous tes pieds.',
      en: 'Here the solar meridian crosses the stone. Time and space meet under your feet.',
    },
    suggestion: {
      fr: 'Approche. Pose le pied sur la ligne.',
      en: 'Approach. Set your foot on the line.',
    },
    trigger: {
      kind: 'arrival',
      minSeconds: 5,
      maxDistM: 50,
    },
    cooldownMinutes: 45,
    mapsQuery: { lat: 48.8512, lng: 2.3347, label: 'Saint-Sulpice' },
  },
  {
    axisId: 3,
    key: 'arago_meridian',
    title: { fr: 'Les médaillons invisibles', en: 'The invisible medallions' },
    voice: 'champ',
    line: {
      fr: 'Sous le bitume, une ligne court. Les disques de bronze en sont les seuls témoins.',
      en: 'Under the asphalt, a line runs. The bronze disks are its only witnesses.',
    },
    suggestion: {
      fr: 'Marche. Cherche le prochain médaillon.',
      en: 'Walk. Seek the next medallion.',
    },
    trigger: {
      kind: 'movement',
      minSeconds: 5,
      minSpeedMps: 0.5,
      maxDistM: 100,
    },
    cooldownMinutes: 25,
    mapsQuery: { lat: 48.8383, lng: 2.3372, label: 'Observatoire' },
  },
  {
    axisId: 4,
    key: 'saint_michel_observatoire',
    title: { fr: 'La montée', en: 'The climb' },
    voice: 'champ',
    line: {
      fr: 'La pente te tire. Chaque pas remonte le cardo — la colonne vertébrale de la rive gauche.',
      en: 'The slope pulls you. Each step climbs the cardo — the spine of the left bank.',
    },
    suggestion: {
      fr: 'Monte. Ne tourne pas.',
      en: 'Climb. Don’t turn.',
    },
    trigger: {
      kind: 'movement',
      minSeconds: 4,
      minSpeedMps: 0.6,
      maxDistM: 120,
    },
    cooldownMinutes: 20,
    mapsQuery: { lat: 48.8462, lng: 2.3508, label: 'Panthéon' },
  },
];

const DOORS_BY_AXIS = new Map<number, AxisDoor>();
for (const door of AXIS_DOORS) {
  DOORS_BY_AXIS.set(door.axisId, door);
}

export function getAxisDoor(axisId: number): AxisDoor | undefined {
  return DOORS_BY_AXIS.get(axisId);
}
