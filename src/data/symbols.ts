/**
 * ARCHÉ — Symboles par Arrondissement
 *
 * Chaque arrondissement contient des symboles cachés.
 * Le marcheur les collecte en les trouvant dans la ville.
 *
 * Structure:
 * - id: identifiant unique
 * - name: nom du symbole
 * - hint: indice poétique pour le trouver
 * - location: description vague du lieu
 * - arrondissement: 1-20
 * - type: catégorie (mascaron, inscription, architecture, etc.)
 */

export interface Symbol {
  id: string;
  name: string;
  hint: string;
  location: string;
  arrondissement: number;
  type: 'mascaron' | 'inscription' | 'architecture' | 'sculpture' | 'passage' | 'cadran' | 'enseigne';
  agent?: string; // L'agent-gardien lié à ce symbole
}

// Symboles initiaux - on commence avec quelques-uns par arrondissement
export const SYMBOLS: Symbol[] = [
  // 1er - Louvre, Palais Royal
  {
    id: 'sym-1-01',
    name: 'Le Cadran du Roi',
    hint: 'Là où le temps s\'arrête sous les arcades, cherche l\'horloge qui ne compte plus.',
    location: 'Palais Royal',
    arrondissement: 1,
    type: 'cadran',
    agent: 'L\'Archiviste oublié'
  },
  {
    id: 'sym-1-02',
    name: 'Le Mascaron rieur',
    hint: 'Une bouche de pierre crache l\'eau depuis des siècles. Elle rit de ceux qui passent sans voir.',
    location: 'Fontaine des Innocents',
    arrondissement: 1,
    type: 'mascaron'
  },

  // 2e - Bourse, Passages
  {
    id: 'sym-2-01',
    name: 'La Galerie des Reflets',
    hint: 'Dans le passage le plus ancien, les miroirs se souviennent de ceux qui sont passés.',
    location: 'Passage des Panoramas',
    arrondissement: 2,
    type: 'passage'
  },

  // 3e - Marais Nord
  {
    id: 'sym-3-01',
    name: 'L\'Enseigne du Temps',
    hint: 'Une horloge sans aiguilles veille sur la rue des Archives.',
    location: 'Rue des Archives',
    arrondissement: 3,
    type: 'enseigne'
  },

  // 4e - Notre-Dame, Marais
  {
    id: 'sym-4-01',
    name: 'Le Point Zéro',
    hint: 'Toutes les routes de France partent de tes pieds. Regarde en bas.',
    location: 'Parvis Notre-Dame',
    arrondissement: 4,
    type: 'inscription',
    agent: 'L\'Archiviste oublié'
  },
  {
    id: 'sym-4-02',
    name: 'Le Mascaron de l\'Île',
    hint: 'Sur la plus vieille maison de Paris, un visage te regarde depuis le XVe siècle.',
    location: 'Rue François Miron',
    arrondissement: 4,
    type: 'mascaron'
  },

  // 5e - Quartier Latin
  {
    id: 'sym-5-01',
    name: 'La Colonne Vertébrale',
    hint: 'La rue la plus ancienne monte droit vers le ciel. Elle était là avant Paris.',
    location: 'Rue Saint-Jacques',
    arrondissement: 5,
    type: 'architecture',
    agent: 'L\'Archiviste oublié'
  },
  {
    id: 'sym-5-02',
    name: 'Les Thermes Oubliés',
    hint: 'Sous le musée, les Romains se baignaient. La pierre garde leur chaleur.',
    location: 'Musée de Cluny',
    arrondissement: 5,
    type: 'architecture'
  },

  // 6e - Saint-Germain
  {
    id: 'sym-6-01',
    name: 'Le Dragon de la Cour',
    hint: 'Dans une cour cachée, un dragon de fer protège l\'entrée depuis toujours.',
    location: 'Cour du Dragon',
    arrondissement: 6,
    type: 'sculpture'
  },

  // 6e - Saint-Germain (continued)
  {
    id: 'sym-6-02',
    name: 'Le Méridien de Paris',
    hint: 'Une ligne invisible traverse la ville du nord au sud. Cherche les médaillons au sol.',
    location: 'Rue de Rennes / Boulevard Saint-Germain',
    arrondissement: 6,
    type: 'inscription'
  },

  // 7e - Tour Eiffel, Invalides
  {
    id: 'sym-7-01',
    name: 'Le Dôme Doré',
    hint: 'Un empereur dort sous l\'or. Le soleil s\'y reflète depuis des siècles.',
    location: 'Les Invalides',
    arrondissement: 7,
    type: 'architecture'
  },

  // 8e - Champs-Élysées
  {
    id: 'sym-8-01',
    name: 'L\'Obélisque Silencieux',
    hint: 'Il a vu les pharaons, il a vu les rois, il voit maintenant les voitures. Il ne dit rien.',
    location: 'Place de la Concorde',
    arrondissement: 8,
    type: 'architecture'
  },

  // 9e - Opéra
  {
    id: 'sym-9-01',
    name: 'Les Abeilles de l\'Empereur',
    hint: 'Sur le toit de l\'Opéra, des abeilles fabriquent le miel de Paris.',
    location: 'Opéra Garnier',
    arrondissement: 9,
    type: 'sculpture'
  },

  // 10e - Gares
  {
    id: 'sym-10-01',
    name: 'Le Canal des Écluses',
    hint: 'L\'eau monte et descend, les bateaux passent sous tes pieds sans que tu le saches.',
    location: 'Canal Saint-Martin',
    arrondissement: 10,
    type: 'architecture'
  },

  // 11e - Bastille
  {
    id: 'sym-11-01',
    name: 'Le Génie de la Liberté',
    hint: 'Il danse sur une colonne là où une prison s\'élevait. Regarde vers le ciel.',
    location: 'Place de la Bastille',
    arrondissement: 11,
    type: 'sculpture'
  },

  // 12e - Bercy, Bois de Vincennes
  {
    id: 'sym-12-01',
    name: 'Les Chais Endormis',
    hint: 'Le vin coulait ici à flots. Les pierres s\'en souviennent.',
    location: 'Bercy Village',
    arrondissement: 12,
    type: 'architecture'
  },

  // 13e - Butte aux Cailles
  {
    id: 'sym-13-01',
    name: 'Le Street Art Sacré',
    hint: 'Les murs parlent. Cherche l\'œil qui te regarde.',
    location: 'Butte aux Cailles',
    arrondissement: 13,
    type: 'inscription'
  },

  // 14e - Montparnasse
  {
    id: 'sym-14-01',
    name: 'Les Catacombes Supérieures',
    hint: 'Avant d\'être un cimetière, c\'était une carrière. La ville est bâtie sur des trous.',
    location: 'Cimetière du Montparnasse',
    arrondissement: 14,
    type: 'architecture'
  },

  // 15e - Grenelle
  {
    id: 'sym-15-01',
    name: 'La Statue de la Liberté',
    hint: 'Elle regarde vers l\'ouest, vers sa grande sœur. Peu savent qu\'elle est là.',
    location: 'Île aux Cygnes',
    arrondissement: 15,
    type: 'sculpture'
  },

  // 16e - Trocadéro, Passy
  {
    id: 'sym-16-01',
    name: 'Les Fontaines Jumelles',
    hint: 'L\'eau danse devant la tour de fer. La nuit, elle devient lumière.',
    location: 'Trocadéro',
    arrondissement: 16,
    type: 'architecture'
  },

  // 17e - Batignolles
  {
    id: 'sym-17-01',
    name: 'Le Passage Secret',
    hint: 'Une rue porte le nom d\'une bataille. Elle cache un jardin.',
    location: 'Batignolles',
    arrondissement: 17,
    type: 'passage'
  },

  // 18e - Montmartre
  {
    id: 'sym-18-01',
    name: 'Le Passe-Muraille',
    hint: 'Un homme traverse le mur. Il est resté coincé pour l\'éternité.',
    location: 'Place Marcel Aymé',
    arrondissement: 18,
    type: 'sculpture',
    agent: 'L\'Archiviste oublié'
  },
  {
    id: 'sym-18-02',
    name: 'Le Cadran du Coq',
    hint: 'QUAND SONNERA JE CHANTERAY. Un N s\'est retourné.',
    location: 'Rue de l\'Abreuvoir',
    arrondissement: 18,
    type: 'cadran',
    agent: 'L\'Archiviste oublié'
  },
  {
    id: 'sym-18-03',
    name: 'Le Rocher de la Sorcière',
    hint: 'Dans un jardin interdit, une pierre brute refuse d\'être civilisée.',
    location: 'Avenue Junot',
    arrondissement: 18,
    type: 'sculpture'
  },
  {
    id: 'sym-18-04',
    name: 'La Vigne Sacrée',
    hint: 'Du vin pousse encore sur la Butte. Cherche les vendanges de Montmartre.',
    location: 'Rue des Saules',
    arrondissement: 18,
    type: 'architecture'
  },

  // 19e - Buttes Chaumont
  {
    id: 'sym-19-01',
    name: 'Le Temple de la Sibylle',
    hint: 'Un temple grec au sommet d\'une colline artificielle. Paris joue à être Rome.',
    location: 'Buttes Chaumont',
    arrondissement: 19,
    type: 'architecture'
  },

  // 20e - Père Lachaise
  {
    id: 'sym-20-01',
    name: 'Le Mur des Fédérés',
    hint: 'Ici s\'est terminée la Commune. Le mur porte encore les impacts.',
    location: 'Père Lachaise',
    arrondissement: 20,
    type: 'inscription'
  },
  {
    id: 'sym-20-02',
    name: 'La Tombe du Baiser',
    hint: 'Deux amants s\'embrassent pour l\'éternité. Tout le monde vient les voir.',
    location: 'Père Lachaise',
    arrondissement: 20,
    type: 'sculpture'
  }
];

// Fonction pour obtenir les symboles d'un arrondissement
export function getSymbolsByArrondissement(arr: number): Symbol[] {
  return SYMBOLS.filter(s => s.arrondissement === arr);
}

// Fonction pour obtenir un symbole par ID
export function getSymbolById(id: string): Symbol | undefined {
  return SYMBOLS.find(s => s.id === id);
}

// Stats par arrondissement
export function getArrondissementStats(): Record<number, { total: number; types: string[] }> {
  const stats: Record<number, { total: number; types: Set<string> }> = {};

  for (let i = 1; i <= 20; i++) {
    stats[i] = { total: 0, types: new Set() };
  }

  SYMBOLS.forEach(s => {
    stats[s.arrondissement].total++;
    stats[s.arrondissement].types.add(s.type);
  });

  const result: Record<number, { total: number; types: string[] }> = {};
  for (const [key, value] of Object.entries(stats)) {
    result[parseInt(key)] = { total: value.total, types: Array.from(value.types) };
  }

  return result;
}
