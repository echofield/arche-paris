// QUESTS ENRICHED DATA
// Fusion des données techniques (coordonnées, URLs Google Maps) 
// + données curatoriales Gemini (descriptions, citations, tags, archétypes)

import { QUESTS_DATA, Quest, QuestNode } from './quests';

// Types enrichis
export interface QuestBadges {
  cost: 'GRATUIT' | 'PAYANT';
  environment: 'INTÉRIEUR' | 'EXTÉRIEUR' | 'MIXTE';
  pace: 'CONTEMPLATIF' | 'MODÉRÉ' | 'SPORTIF';
}

export interface QuestQuote {
  text: string;
  author: string;
}

export interface EnrichedQuest extends Quest {
  poeticSubtitle: string;
  curatedDescription: string;
  quote: QuestQuote;
  miniQuest: string;
  tags: string[];
  badges: QuestBadges;
  archetype: string;
}

// Données Gemini enrichies
const GEMINI_ENRICHMENT: Record<string, Omit<EnrichedQuest, keyof Quest>> = {
  passages: {
    poeticSubtitle: "Les arcades silencieuses, fragments d'une ville réinventée",
    curatedDescription: "Les passages couverts de Paris suspendent le temps sous leurs verrières. Construits au début du XIXe siècle comme des rues commerçantes à l'abri de la pluie, ils forment aujourd'hui un réseau secret de galeries où l'on passe d'une époque à l'autre. Le Passage des Panoramas, le plus ancien, abrite encore des graveurs et des marchands de cartes postales anciennes. Le Passage des Princes, plus confidentiel, est une parenthèse élégante. Enfin, la Galerie Vivienne déploie ses mosaïques sous une coupole de verre. Ces lieux fonctionnent comme des seuils : ni dehors ni dedans, ni passé ni présent. Nous marchons différemment, le bruit de la ville s'éteint et l'on perçoit le murmure du commerce d'antan, une architecture conçue pour la promenade contemplative, loin de la boue et du tumulte des boulevards.",
    quote: {
      text: "Les passages sont des maisons ou des couloirs qui n'ont pas de côté extérieur — comme le rêve.",
      author: "Walter Benjamin"
    },
    miniQuest: "À l'entrée du Passage Jouffroy, trouve l'horloge murale qui indique le temps exact et note la devise latine inscrite sous son cadran.",
    tags: ["intérieur", "historique", "architecture", "calme", "central", "gratuit"],
    badges: {
      cost: "GRATUIT",
      environment: "INTÉRIEUR",
      pace: "CONTEMPLATIF"
    },
    archetype: "Seuil"
  },

  flaneur: {
    poeticSubtitle: "L'art déambulatoire, entre mélancolie baudelairienne et classicisme royal",
    curatedDescription: "La flânerie n'est pas une simple marche, mais une méthode pour lire la ville. Cette quête commence sur l'ordonnancement parfait de la Place des Vosges, un carré de briques et d'arches, espace de méditation dans le Marais historique. Nous rejoignons ensuite le Pont des Arts, qui offre un instant de suspension sur la Seine, ancrant le regard entre l'Académie et le Louvre. Au Palais Royal, l'enclos intime d'Arc et Colonne contraste avec la perspective infinie des Tuileries, autrefois jardin de Catherine de Médicis. Le flâneur traverse ces scènes, absorbant les conversations, les textures, les jeux de lumière. C'est un voyage qui célèbre la distance critique : être dans la foule, mais jamais tout à fait d'elle. Nous cherchons moins une destination qu'un état d'esprit, celui de l'observateur invisible qui archive l'éphémère.",
    quote: {
      text: "Être hors de chez soi, et se sentir pourtant comme chez soi, habiter partout, et habiter le monde.",
      author: "Charles Baudelaire"
    },
    miniQuest: "Au Jardin du Palais Royal, compte le nombre exact de colonnes blanches qui composent la colonnade des sculptures de Daniel Buren.",
    tags: ["extérieur", "contemplatif", "historique", "central", "art", "gratuit", "modéré"],
    badges: {
      cost: "GRATUIT",
      environment: "EXTÉRIEUR",
      pace: "MODÉRÉ"
    },
    archetype: "Liberté"
  },

  jardins: {
    poeticSubtitle: "L'architecture du vivant, du caprice romantique à la rigueur scientifique",
    curatedDescription: "Paris est tissé de sanctuaires végétaux, chacun racontant une histoire de maîtrise ou de lâcher-prise. Cette quête explore la diversité des refuges verts. Le Parc Monceau, avec ses fausses ruines et ses colonnades à l'italienne, incarne le caprice aristocratique du XVIIIe siècle, une mise en scène du rêve. Le Square du Vert-Galant, pointe de l'Île de la Cité, offre un point d'ancrage fluvial, embrassant la Seine. La rigueur classique du Jardin du Luxembourg, espace de politique et d'enfance, contraste avec la luxuriante Bibliothèque botanique du Jardin des Plantes. Ce parcours est une leçon d'écologie urbaine, révélant comment l'homme a importé et stylisé la nature au cœur de la pierre. On quitte l'agitation pour le silence des feuillages, retrouvant une échelle plus humaine du temps.",
    quote: {
      text: "La nature est un temple où des piliers vivants Laissent parfois sortir de confuses paroles.",
      author: "Charles Baudelaire"
    },
    miniQuest: "Devant la Naumachie du Parc Monceau, compte le nombre exact de colonnes corinthiennes qui entourent le bassin.",
    tags: ["extérieur", "nature", "calme", "historique", "long", "architecture"],
    badges: {
      cost: "GRATUIT",
      environment: "EXTÉRIEUR",
      pace: "MODÉRÉ"
    },
    archetype: "Refuge"
  },

  caviste: {
    poeticSubtitle: "De la culture de bistrot au savoir-faire des maisons d'exception",
    curatedDescription: "Cette route honore le vin, liquide qui incarne l'esprit de convivialité et le savoir-faire français. Elle débute au Baron Rouge, un comptoir brut du 12e arrondissement où le vin s'achète au fût, célébrant une tradition populaire et l'ancrage local. Nous traversons la Seine vers La Dernière Goutte, institution de Saint-Germain spécialisée dans les vins naturels, révélant le goût contemporain pour le terroir sans artifice. L'arrêt chez Verjus offre une perspective culinaire raffinée, pont entre la cave et la haute gastronomie. La quête se conclut à la maison Ryst-Dupeyron, un lieu qui honore l'artisanat du spiritueux d'exception, Armagnac et Cognac. Le vin est à Paris un langage, un médium pour comprendre la ville, ses échanges et la pérennité de ses savoir-faire les plus subtils. C'est une invitation au partage et à la découverte des palais.",
    quote: {
      text: "Paris n'est pas fait pour marcher, il est fait pour boire.",
      author: "Pierre-Henri Cami"
    },
    miniQuest: "Chez Ryst-Dupeyron (Rue du Bac), identifie et note la plus ancienne année millésimée visible sur une bouteille de Cognac ou d'Armagnac exposée en vitrine.",
    tags: ["gourmand", "intérieur", "historique", "vivant", "partage", "payant"],
    badges: {
      cost: "PAYANT",
      environment: "MIXTE",
      pace: "MODÉRÉ"
    },
    archetype: "Partage"
  },

  hauteurs: {
    poeticSubtitle: "Les lignes de fuite de la ville, une cartographie du ciel parisien",
    curatedDescription: "Regarder Paris d'en haut est un acte de souveraineté intellectuelle, transformant le désordre en une géométrie lisible. Cette quête est une étude comparée de l'élévation. Le Parc de Belleville offre une vue populaire et dégagée de l'Est, un regard sur la densité des toits contemporains. Montmartre, dominé par le Sacré-Cœur, propose une perspective romantique et mythique. Le Panthéon, monument de la nation, donne accès à un point de vue plus historique et institutionnel, dominant le Quartier Latin. Enfin, la Tour Montparnasse, souvent décriée, révèle paradoxalement la cohérence haussmannienne de l'Ouest. Ce parcours exige un effort, récompensé par la prise de conscience de l'immensité organisée de la capitale. Nous passons de l'éphémère à l'éternel, du sacré au séculier, toujours en quête de la ligne d'horizon.",
    quote: {
      text: "L'histoire se déploie à nos pieds comme une carte muette.",
      author: "Patrick Modiano"
    },
    miniQuest: "Sur la façade du Panthéon, cherche l'inscription latine au-dessus du péristyle (Aux Grands Hommes, La Patrie Reconnaissante) et note le nombre de mots exacts qui la composent.",
    tags: ["extérieur", "élévation", "architecture", "historique", "sportif", "vue", "mixte"],
    badges: {
      cost: "PAYANT",
      environment: "MIXTE",
      pace: "SPORTIF"
    },
    archetype: "Élévation"
  },

  reliques: {
    poeticSubtitle: "Plonger dans les strates du temps, de l'os au vitrail",
    curatedDescription: "Paris est une ville palimpseste, où chaque niveau de sol cache des siècles de vie et de mort. Cette quête est une descente dans la mémoire. Les Catacombes offrent un face-à-face avec la mortalité, une fondation macabre de la ville moderne. La Crypte archéologique de l'île de la Cité révèle les vestiges des époques gallo-romaine et médiévale, le squelette même de Lutèce. En remontant vers la lumière, la Sainte-Chapelle déploie le récit des reliques sacrées, où la couleur transcende la pierre. Nous concluons à Carnavalet, musée dédié à l'histoire de Paris elle-même, qui rassemble les objets et les fantômes. Ce parcours expose les contrastes fondamentaux : du sous-sol sépulcral à la lumière divine, nous confrontons ce qui est perdu et ce qui est préservé, explorant les multiples façons dont Paris conserve ses histoires les plus profondes.",
    quote: {
      text: "Les villes, comme les hommes, ont leurs mystères profonds, et leurs énigmes à peine dites.",
      author: "Victor Hugo"
    },
    miniQuest: "Dans la Sainte-Chapelle (chambre haute), identifie le vitrail représentant le Déluge et compte le nombre de personnages exacts se trouvant dans l'arche de Noé.",
    tags: ["intérieur", "historique", "mystère", "payant", "mémoire", "profond", "contemplatif"],
    badges: {
      cost: "PAYANT",
      environment: "INTÉRIEUR",
      pace: "CONTEMPLATIF"
    },
    archetype: "Mémoire"
  },

  // ============================================
  // NEW QUESTS - EXPANSION 2025
  // ============================================

  'memoire-encre': {
    poeticSubtitle: "Sur la rive gauche, traquer les fantômes de papier et les hôtels de l'existentialisme",
    curatedDescription: "Le Quartier Latin et Saint-Germain ne sont pas de simples décors ; ce sont des palimpsestes. Sous les enseignes de mode, l'encre des siècles passés résiste. Cette quête est une dérive silencieuse dans la géographie mentale des écrivains. Nous partons d'une ancienne boucherie devenue sanctuaire de poésie surréaliste pour glisser vers le silence cinématographique de la Place de Furstemberg, où Delacroix peignait la lumière. Nous touchons les murs de l'Hôtel La Louisiane, cette 'anti-maison' où Sartre et Beauvoir ont réinventé la liberté sans cuisine ni salon. Nous finissons à Shakespeare and Company, refuge des tumbleweeds littéraires. C'est une promenade pour ceux qui écoutent ce que les murs ont à dire. Ici, la ville se lit avant de se voir.",
    quote: {
      text: "Bien sûr, j'avais toujours eu le goût de m'introduire dans la vie des autres, par curiosité et aussi par un besoin de mieux les comprendre et de démêler les fils embrouillés de leur vie.",
      author: "Patrick Modiano"
    },
    miniQuest: "Devant la librairie Le Pont Traversé, repère les sculptures de têtes de bœuf sur la façade : combien y en a-t-il exactement?",
    tags: ["historique", "littéraire", "calme", "extérieur", "gratuit", "central", "contemplatif", "art"],
    badges: {
      cost: "GRATUIT",
      environment: "EXTÉRIEUR",
      pace: "CONTEMPLATIF"
    },
    archetype: "Mémoire"
  },

  'nuit-pigalle': {
    poeticSubtitle: "Entre velours rouge et cocktails interdits, la cartographie du désir parisien",
    curatedDescription: "Il existe deux Paris : celui qui se réveille et celui qui se couche. Cette quête explore la frontière, le 'Seuil'. Pigalle, jadis 'Le Ventre' du vice, s'est métamorphosé sans perdre son âme sulfureuse. Nous commençons devant une ancienne maison close de la Belle Époque, dont les lanternes rouges brûlent encore, mémoire d'un temps où le plaisir était une industrie. Nous traversons le salon où Bizet composa Carmen, aujourd'hui hanté par les oiseaux de nuit. Le Sans Souci nous offre un poste d'observation du théâtre de rue contemporain. Nous terminons dans le jardin caché de l'Hôtel Amour, refuge végétal au cœur du demi-monde. C'est une plongée dans le 'Paris de la Nuit' décrit par Fitzgerald : une magie diffuse, une promesse de danger élégant.",
    quote: {
      text: "Mais Paris, après minuit... c'est de la magie.",
      author: "F. Scott Fitzgerald"
    },
    miniQuest: "À l'entrée de la Maison Souquet, compte exactement le nombre de lanternes rouges allumées qui marquent le seuil discret.",
    tags: ["nocturne", "vivant", "mystère", "payant", "architecture", "intérieur", "partage", "historique"],
    badges: {
      cost: "PAYANT",
      environment: "MIXTE",
      pace: "MODÉRÉ"
    },
    archetype: "Seuil"
  },

  'mains-or': {
    poeticSubtitle: "L'écho du rabot et le silence des cours pavées : le Paris qui fabrique",
    curatedDescription: "Loin des ors de Versailles, le Faubourg Saint-Antoine est le véritable trône du savoir-faire français. C'est ici, dans un dédale de passages secrets et de cours industrielles, que bat le cœur de l'artisanat parisien depuis le Moyen-Âge. Cette quête est une célébration du geste. Du Passage de la Main d'Or, qui semble figé en 1850, aux voûtes du Viaduc des Arts où le design contemporain s'expose, nous traçons la ligne de vie des objets. Le bas-relief de l'ébéniste au travail, les ateliers de souffleurs de verre et d'orfèvres témoignent de la persistance des mains expertes. Nous finissons au Marché d'Aligre, 'Ventre' populaire et bruyant, pour nous rappeler que Paris est d'abord une ville de mains, de bruit et de matière.",
    quote: {
      text: "L'épluchure des légumes, les boues des Halles... Paris pourrissait tout, rendait tout à la terre qui, sans jamais se lasser, réparait la mort.",
      author: "Émile Zola"
    },
    miniQuest: "Dans le Passage de la Main d'Or, trouve le bas-relief au numéro 18 : quel métier l'artisan sculpté est-il en train d'exercer?",
    tags: ["historique", "artisanat", "extérieur", "gratuit", "vivant", "modéré", "central"],
    badges: {
      cost: "GRATUIT",
      environment: "EXTÉRIEUR",
      pace: "MODÉRÉ"
    },
    archetype: "Liberté"
  },

  // ============================================
  // QUEST RUN — Temporal Meridians
  // ============================================

  'temporal-meridians': {
    poeticSubtitle: 'Saint-Sulpice, the clock, the zero.',
    curatedDescription: 'A short walk along time: the meridian at Saint-Sulpice, civil time at the Conciergerie (Charles V, 1370–1371), and the point from which distances are measured.',
    quote: {
      text: 'Walk slowly. The city is precise when you are.',
      author: 'ARCHÉ'
    },
    miniQuest: 'Reach each stop and, if you wish, add a proof.',
    tags: ['extérieur', 'historique', 'calme', 'gratuit', 'contemplatif', 'quest-run'],
    badges: {
      cost: 'GRATUIT',
      environment: 'EXTÉRIEUR',
      pace: 'CONTEMPLATIF'
    },
    archetype: 'Seuil'
  },

  // ============================================
  // HUNTER: MONTMARTRE — Chasse aux symboles
  // ============================================

  'hunter-montmartre': {
    poeticSubtitle: "Sept symboles. Une colline. Apprendre à voir.",
    curatedDescription: "Hunter n'est pas une promenade. C'est une méthode. Montmartre est un organisme vivant, cicatrisé par les siècles — du gypse antique aux cabarets de la Belle Époque. Chaque strate laisse une empreinte pour qui sait la lire. Cette chasse vous invite à reconnaître sept symboles dispersés sur la Butte : un homme figé dans la pierre, un rocher maudit, une plaque britannique au cœur de Paris, un cadran solaire crypté, un moulin fantôme, la tombe d'un maître des chats, et le mensonge fondateur d'un mot que vous utilisez chaque jour. Il n'y a pas de séquence. Pas de carte à suivre. Juste des indices. Quand tu le vois, tu sais.",
    quote: {
      text: "Le passant qui lève les yeux vers le ciel ne voit pas les pierres du chemin. Mais c'est dans les pierres que se cache l'histoire.",
      author: "Proverbe montmartrois"
    },
    miniQuest: "Trouve l'homme dont la main gauche est d'or. Serre-la. Tu fais désormais partie de la chaîne.",
    tags: ["extérieur", "mystère", "historique", "contemplatif", "gratuit", "symboles", "chasse"],
    badges: {
      cost: "GRATUIT",
      environment: "EXTÉRIEUR",
      pace: "CONTEMPLATIF"
    },
    archetype: "Reconnaissance"
  }
};

// Fonction de fusion
function enrichQuest(baseQuest: Quest): EnrichedQuest {
  const enrichment = GEMINI_ENRICHMENT[baseQuest.id];
  
  if (!enrichment) {
    throw new Error(`No enrichment data found for quest: ${baseQuest.id}`);
  }

  return {
    ...baseQuest,
    ...enrichment
  };
}

// Export des quêtes enrichies
export const ENRICHED_QUESTS: EnrichedQuest[] = QUESTS_DATA.map(enrichQuest);

// Helpers
export function getEnrichedQuestById(id: string): EnrichedQuest | undefined {
  return ENRICHED_QUESTS.find(q => q.id === id);
}

export function getAllEnrichedQuests(): EnrichedQuest[] {
  return ENRICHED_QUESTS;
}

export function getQuestsByArchetype(archetype: string): EnrichedQuest[] {
  return ENRICHED_QUESTS.filter(q => q.archetype === archetype);
}

export function getQuestsByTags(tags: string[]): EnrichedQuest[] {
  return ENRICHED_QUESTS.filter(q => 
    tags.some(tag => q.tags.includes(tag))
  );
}