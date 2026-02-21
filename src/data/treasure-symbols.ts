// ============================================================
// TRÉSOR CACHÉ — Montmartre Symbols
//
// 4 symbols hidden in Montmartre.
// Each has: riddle → clue → proof → seal.
// All validation is client-side (ritual, not security).
// ============================================================

export interface TreasureSymbol {
  id: string;
  name: string;
  nameEn: string;
  coordinates: { lat: number; lng: number };
  riddle: string;           // The question that reveals the clue
  riddleAnswer: string;     // Accepted answer (lowercase, trimmed)
  clue: string;             // Where to go once riddle is solved
  proofQuestion: string;    // Asked if GPS fails
  proofAnswers: string[];   // Accepted answers (lowercase)
  poeticLine: string;       // Revealed on seal
  atmosphere: string;        // Synesthetic description
  ghostQuote?: string;      // Literary echo
  ghostAuthor?: string;
}

export const MONTMARTRE_SYMBOLS: TreasureSymbol[] = [
  {
    id: 'sym-18-dalida',
    name: 'Le Buste de Dalida',
    nameEn: 'The Bust of Dalida',
    coordinates: { lat: 48.8865, lng: 2.3397 },
    riddle: 'Quelle chanteuse regarde éternellement vers la Place du Tertre, le bronze poli par les mains des passants ?',
    riddleAnswer: 'dalida',
    clue: 'Place Dalida, en haut de la rue de l\'Abreuvoir. Elle est tournée vers la colline.',
    proofQuestion: 'De quelle couleur est le banc devant le buste ?',
    proofAnswers: ['vert', 'verte'],
    poeticLine: 'Le bronze se souvient de chaque main qui l\'a touché.',
    atmosphere: 'Odeur de tilleul, murmures de touristes au loin, la pierre est tiède.',
    ghostQuote: 'Montmartre n\'est pas un quartier, c\'est un état d\'âme.',
    ghostAuthor: 'Francis Carco',
  },
  {
    id: 'sym-18-passe-muraille',
    name: 'Le Passe-Muraille',
    nameEn: 'The Man Who Walked Through Walls',
    coordinates: { lat: 48.8876, lng: 2.3382 },
    riddle: 'Quel personnage de Marcel Aymé est prisonnier du mur, à jamais entre deux mondes ?',
    riddleAnswer: 'dutilleul',
    clue: 'Place Marcel Aymé, le mur nord. Il sort de la pierre, les bras tendus.',
    proofQuestion: 'Combien de bras sont visibles hors du mur ?',
    proofAnswers: ['2', 'deux'],
    poeticLine: 'Entre l\'ici et l\'ailleurs, la pierre ne résiste plus.',
    atmosphere: 'Le métal est froid même en été. La place est silencieuse.',
    ghostQuote: 'Il y avait à Montmartre un excellent homme nommé Dutilleul qui possédait le don singulier de passer à travers les murs.',
    ghostAuthor: 'Marcel Aymé',
  },
  {
    id: 'sym-18-vigne',
    name: 'Le Clos Montmartre',
    nameEn: 'The Montmartre Vineyard',
    coordinates: { lat: 48.8876, lng: 2.3408 },
    riddle: 'Quel est le dernier vignoble de Paris, caché sur la pente nord de la butte ?',
    riddleAnswer: 'clos montmartre',
    clue: 'Rue des Saules, angle rue Saint-Vincent. Les vignes descendent la pente.',
    proofQuestion: 'Quel animal décore la grille d\'entrée ?',
    proofAnswers: ['lapin', 'un lapin'],
    poeticLine: 'La ville a oublié qu\'elle savait faire du vin.',
    atmosphere: 'Terre mouillée après la pluie, feuilles qui bruissent, le temps ralentit.',
    ghostQuote: 'Le vin de Montmartre : qui en boit pinte en pisse quarte.',
    ghostAuthor: 'Proverbe parisien',
  },
  {
    id: 'sym-18-jeteaime',
    name: 'Le Mur des Je t\'aime',
    nameEn: 'The Wall of Love',
    coordinates: { lat: 48.8843, lng: 2.3385 },
    riddle: 'En combien de langues peut-on lire « je t\'aime » sur ce mur de Montmartre ?',
    riddleAnswer: '250',
    clue: 'Square Jehan Rictus, Place des Abbesses. Le mur bleu couvert d\'écriture blanche.',
    proofQuestion: 'De quelle couleur sont les carreaux du mur ?',
    proofAnswers: ['bleu', 'bleus', 'bleu foncé'],
    poeticLine: 'Toutes les langues du monde disent la même chose.',
    atmosphere: 'Murmures en vingt langues, crayon sur papier, battements de cœur.',
  },
];

// GPS radius for proximity verification (meters)
export const GPS_RADIUS_METERS = 100;

// Riddle timer (seconds)
export const RIDDLE_TIME = 30;

// Cooldown after wrong answer (seconds)
export const COOLDOWN_TIME = 60;
