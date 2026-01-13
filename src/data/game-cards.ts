/**
 * ARCHÉ — Game Cards
 *
 * 18 cards. Weights 1-5. Target 20.
 * Paris has 20 arrondissements. Try to hold it.
 */

export interface GameCard {
  id: string;
  name: string;
  weight: number;
  reveal: string;
  location: string;
  arrondissement: number;
  gps: { lat: number; lng: number };
  image: string;
}

export const GAME_CARDS: GameCard[] = [
  // WEIGHT 5 — Origin / Death
  {
    id: 'point-zero',
    name: 'Point Zéro',
    weight: 5,
    reveal: 'The omphalos. All roads begin here. Step on the bronze star and you are bound to return.',
    location: 'Parvis Notre-Dame',
    arrondissement: 4,
    gps: { lat: 48.853397, lng: 2.348797 },
    image: '/app/symbols/point-zero.png'
  },
  {
    id: 'catacombes',
    name: 'Catacombes',
    weight: 5,
    reveal: 'Empire of death. Six million bones stacked by Héricart de Thury. The goldfish went blind.',
    location: 'Place Denfert-Rochereau',
    arrondissement: 14,
    gps: { lat: 48.833830, lng: 2.332420 },
    image: '/app/symbols/catacombes.png'
  },
  {
    id: 'conciergerie',
    name: 'Conciergerie',
    weight: 5,
    reveal: 'Antechamber of the guillotine. 2,700 spent their last days here. The toilette was for cutting hair.',
    location: 'Île de la Cité',
    arrondissement: 1,
    gps: { lat: 48.856100, lng: 2.345600 },
    image: '/app/symbols/conciergerie.png'
  },

  // WEIGHT 4 — Ancient / Sacred
  {
    id: 'thermes-cluny',
    name: 'Thermes de Cluny',
    weight: 4,
    reveal: 'A 2,000-year-old roof. The Nautes carved ship prows into the stone. The boatmen still rule Paris.',
    location: 'Musée de Cluny',
    arrondissement: 5,
    gps: { lat: 48.850200, lng: 2.344400 },
    image: '/app/symbols/thermes-cluny.png'
  },
  {
    id: 'obelisque',
    name: 'Obélisque de Louxor',
    weight: 4,
    reveal: 'Oldest monument in Paris. Ramses II. The baboons were too scandalous. The tip is new gold.',
    location: 'Place de la Concorde',
    arrondissement: 8,
    gps: { lat: 48.865500, lng: 2.321100 },
    image: '/app/symbols/obelisque.png'
  },
  {
    id: 'rue-saint-jacques',
    name: 'Rue Saint-Jacques',
    weight: 4,
    reveal: 'The Roman matrix. Via Superior. The oldest street. 2,000 years of footsteps in a straight line.',
    location: 'Quartier Latin',
    arrondissement: 5,
    gps: { lat: 48.846000, lng: 2.343000 },
    image: '/app/symbols/rue-saint-jacques.png'
  },

  // WEIGHT 3 — Power / Spectacle
  {
    id: 'opera-garnier',
    name: 'Opéra Garnier',
    weight: 3,
    reveal: 'The eagle survived the Republic. They purged all the N\'s but missed one. High on the west façade.',
    location: 'Place de l\'Opéra',
    arrondissement: 9,
    gps: { lat: 48.871900, lng: 2.331600 },
    image: '/app/symbols/opera-garnier.png'
  },
  {
    id: 'buttes-chaumont',
    name: 'Buttes Chaumont',
    weight: 3,
    reveal: 'Beauty built over the gibbet. The suicide bridge has mesh now. The stalactites are concrete.',
    location: 'Parc des Buttes-Chaumont',
    arrondissement: 19,
    gps: { lat: 48.880300, lng: 2.383000 },
    image: '/app/symbols/buttes-chaumont.png'
  },
  {
    id: 'palais-cite',
    name: 'Palais de la Cité',
    weight: 3,
    reveal: 'Where kings became prisoners. Marie-Antoinette\'s cell is now a chapel. Memory erasing memory.',
    location: 'Île de la Cité',
    arrondissement: 1,
    gps: { lat: 48.856100, lng: 2.345600 },
    image: '/app/symbols/conciergerie.png'
  },
  {
    id: 'statue-liberte',
    name: 'Statue de la Liberté',
    weight: 3,
    reveal: 'Two revolutions in one equation. IV JUILLET 1776 = XIV JUILLET 1789. She faces New York.',
    location: 'Île aux Cygnes',
    arrondissement: 15,
    gps: { lat: 48.850000, lng: 2.279600 },
    image: '/app/symbols/statue-liberte.png'
  },

  // WEIGHT 2 — Passage / Commerce
  {
    id: 'passage-panoramas',
    name: 'Passage des Panoramas',
    weight: 2,
    reveal: 'The oldest passage. First gas lights in Paris, 1817. The panorama rotundas are gone. The name remains.',
    location: 'Boulevard Montmartre',
    arrondissement: 2,
    gps: { lat: 48.871400, lng: 2.342200 },
    image: '/app/symbols/passage-panoramas.png'
  },
  {
    id: 'folies-bergere',
    name: 'Folies Bergère',
    weight: 2,
    reveal: 'Lila Nikolska in stone. The dancer frozen mid-movement. A billboard that became a monument.',
    location: 'Rue Richer',
    arrondissement: 9,
    gps: { lat: 48.874200, lng: 2.344900 },
    image: '/app/symbols/folies-bergere.png'
  },
  {
    id: 'dragon-rennes',
    name: 'Dragon de la Rue de Rennes',
    weight: 2,
    reveal: 'Ghost of the Cour du Dragon. The original is in the Louvre. This one guards a memory.',
    location: '50 Rue de Rennes',
    arrondissement: 6,
    gps: { lat: 48.853500, lng: 2.329400 },
    image: '/app/symbols/dragon-rennes.png'
  },
  {
    id: 'fontaine-varsovie',
    name: 'Fontaine de Varsovie',
    weight: 2,
    reveal: 'Golden bestiary of 1937. Bull, deer, horse, dog. They stood between the Nazi and Soviet pavilions.',
    location: 'Trocadéro',
    arrondissement: 16,
    gps: { lat: 48.861150, lng: 2.289960 },
    image: '/app/symbols/fontaine-varsovie.png'
  },

  // WEIGHT 1 — Trace / Camouflage
  {
    id: 'medaillons-arago',
    name: 'Médaillons Arago',
    weight: 1,
    reveal: 'The invisible meridian. 135 bronze discs. Many stolen or paved over. The broken line is the art.',
    location: 'Various (Louvre to Cité U)',
    arrondissement: 6,
    gps: { lat: 48.861000, lng: 2.335800 },
    image: '/app/symbols/medaillons-arago.png'
  },
  {
    id: 'passage-sorciere',
    name: 'Passage de la Sorcière',
    weight: 1,
    reveal: 'The witch\'s rock. Sourcière became sorcière. A boulder in a private garden. The wild Maquis persists.',
    location: 'Avenue Junot',
    arrondissement: 18,
    gps: { lat: 48.888500, lng: 2.336800 },
    image: '/app/symbols/passage-sorciere.png'
  },
  {
    id: '51-archives',
    name: '51 Rue des Archives',
    weight: 1,
    reveal: 'A fake façade. No door handle. No mail slot. Inside: an electrical transformer. Urban camouflage.',
    location: 'Le Marais',
    arrondissement: 3,
    gps: { lat: 48.860600, lng: 2.355300 },
    image: '/app/symbols/51-archives.png'
  },
  {
    id: '61-archives',
    name: '61 Rue des Archives',
    weight: 1,
    reveal: 'Cathedral of the telephone. Caryatids guarding communication. Art Nouveau meets infrastructure.',
    location: 'Le Marais',
    arrondissement: 3,
    gps: { lat: 48.862200, lng: 2.358900 },
    image: '/app/symbols/61-archives.png'
  }
];

// Weight distribution
export const WEIGHT_STATS = {
  weight5: GAME_CARDS.filter(c => c.weight === 5).length, // 3 cards = 15 pts
  weight4: GAME_CARDS.filter(c => c.weight === 4).length, // 3 cards = 12 pts
  weight3: GAME_CARDS.filter(c => c.weight === 3).length, // 4 cards = 12 pts
  weight2: GAME_CARDS.filter(c => c.weight === 2).length, // 4 cards = 8 pts
  weight1: GAME_CARDS.filter(c => c.weight === 1).length, // 4 cards = 4 pts
  totalCards: GAME_CARDS.length,                          // 18 cards
  totalWeight: GAME_CARDS.reduce((sum, c) => sum + c.weight, 0) // 51 pts
};

// Shuffle function
export function shuffleDeck(cards: GameCard[]): GameCard[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get card by ID
export function getCardById(id: string): GameCard | undefined {
  return GAME_CARDS.find(c => c.id === id);
}

// Get cards by arrondissement
export function getCardsByArrondissement(arr: number): GameCard[] {
  return GAME_CARDS.filter(c => c.arrondissement === arr);
}
