/**
 * ARCHÉ — Quiz Culture Parisienne
 *
 * Ignition only: dopamine autorisée ici.
 * Aucune pression de complétion, aucun streak, aucun score public.
 *
 * L'excitation existe au seuil, jamais dans le territoire.
 */

export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  echo: string; // La résonance poétique — la graine plantée
  level: 1 | 2 | 3 | 4 | 5;
  category: string;
  hint: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "Q001",
    question: "Combien d'arrondissements compte Paris ?",
    choices: ["A. 18", "B. 20", "C. 16", "D. 22"],
    answer: "B",
    explanation: "Paris est divisée en 20 arrondissements municipaux depuis 1860, numérotés en spirale à partir du centre.",
    echo: "Paris se lit en spirale. Une ville qui tourne autour de son cœur.",
    level: 1,
    category: "Repères",
    hint: "En 1860, Paris est passée de 12 à 20 arrondissements."
  },
  {
    id: "Q002",
    question: "Quel fleuve traverse Paris ?",
    choices: ["A. La Loire", "B. La Seine", "C. Le Rhône", "D. La Garonne"],
    answer: "B",
    explanation: "La Seine traverse Paris d'est en ouest sur environ 13 km. Son cours découpe la ville en deux rives.",
    echo: "La ville n'est pas posée sur l'eau. Elle est fendue par une mémoire qui coule.",
    level: 1,
    category: "Origines",
    hint: "Il a donné son nom aux départements de la petite couronne."
  },
  {
    id: "Q003",
    question: "Quelle tour métallique est le symbole de Paris ?",
    choices: ["A. Tour Montparnasse", "B. Tour Eiffel", "C. Tour de Londres", "D. Tour de Pise"],
    answer: "B",
    explanation: "La tour Eiffel a été construite pour l'Exposition universelle de 1889. Elle mesure aujourd'hui environ 324 m avec ses antennes.",
    echo: "Un squelette de fer devenu repère intérieur.",
    level: 1,
    category: "Belle Époque",
    hint: "Exposition universelle de 1889."
  },
  {
    id: "Q004",
    question: "Quel musée abrite la Joconde ?",
    choices: ["A. Musée d'Orsay", "B. Musée du Louvre", "C. Centre Pompidou", "D. Musée Rodin"],
    answer: "B",
    explanation: "La Joconde est exposée au musée du Louvre, ancien palais royal devenu musée national.",
    echo: "Avant d'être un musée, c'était un palais. Le lieu est la première œuvre.",
    level: 1,
    category: "Art & Lettres",
    hint: "Le plus grand musée de Paris."
  },
  {
    id: "Q005",
    question: "Quelle célèbre cathédrale gothique se trouve sur l'Île de la Cité à Paris ?",
    choices: ["A. Notre-Dame de Paris", "B. Basilique Saint-Denis", "C. Basilique du Sacré-Cœur", "D. Église Saint-Paul"],
    answer: "A",
    explanation: "Notre-Dame de Paris, commencée au XIIe siècle, est un grand monument de l'art gothique sur l'Île de la Cité.",
    echo: "Une pierre qui prie depuis des siècles, même quand on ne croit plus.",
    level: 1,
    category: "Moyen Âge",
    hint: "Un roman de Victor Hugo porte son nom."
  },
  {
    id: "Q006",
    question: "Quel monument religieux au dôme blanc domine la butte Montmartre ?",
    choices: ["A. Cathédrale Notre-Dame", "B. Basilique du Sacré-Cœur", "C. Église Saint-Sulpice", "D. Le Panthéon"],
    answer: "B",
    explanation: "La basilique du Sacré-Cœur domine Montmartre. Son dôme clair est visible de loin.",
    echo: "Un sommet blanc: la ville se regarde depuis sa propre altitude.",
    level: 1,
    category: "Belle Époque",
    hint: "Montmartre, dôme blanc, panorama."
  },
  {
    id: "Q007",
    question: "Quelle grande avenue parisienne relie l'Arc de Triomphe à la Place de la Concorde ?",
    choices: ["A. Avenue des Champs-Élysées", "B. Avenue Montaigne", "C. Boulevard Saint-Germain", "D. Rue de Rivoli"],
    answer: "A",
    explanation: "Les Champs-Élysées s'étendent entre la Concorde et l'Arc de Triomphe, axe majeur de cérémonies et défilés.",
    echo: "Un couloir de pouvoir déguisé en promenade.",
    level: 1,
    category: "XIXe siècle",
    hint: "Le grand défilé du 14 Juillet y passe."
  },
  {
    id: "Q008",
    question: "Quel surnom désigne Paris pour son rayonnement intellectuel et ses lumières ?",
    choices: ["A. La Ville Lumière", "B. La Ville Éternelle", "C. La Cité des Anges", "D. La Venise du Nord"],
    answer: "A",
    explanation: "« Ville Lumière » évoque le Paris des Lumières et l'essor de l'éclairage urbain, autant que son influence culturelle.",
    echo: "La lumière ici n'est pas un décor. C'est une idée.",
    level: 1,
    category: "Art & Lettres",
    hint: "Un surnom lié aux Lumières et à l'éclairage."
  },
  {
    id: "Q009",
    question: "En quelle année a eu lieu la prise de la Bastille, début symbolique de la Révolution française ?",
    choices: ["A. 1776", "B. 1789", "C. 1792", "D. 1815"],
    answer: "B",
    explanation: "La prise de la Bastille a eu lieu le 14 juillet 1789. L'événement est devenu un symbole fondateur.",
    echo: "Un mur tombe, et tout le siècle devient instable.",
    level: 1,
    category: "Révolution",
    hint: "Un 14 juillet."
  },
  {
    id: "Q010",
    question: "Quelle prison-forteresse a été prise d'assaut le 14 juillet 1789 ?",
    choices: ["A. La Conciergerie", "B. La Bastille", "C. Le Temple", "D. L'Hôtel-Dieu"],
    answer: "B",
    explanation: "La Bastille était une forteresse devenue prison d'État. Sa chute symbolise la contestation de l'autorité absolue.",
    echo: "Un lieu devient un signe. Et le signe devient une date.",
    level: 1,
    category: "Révolution",
    hint: "À l'emplacement de l'actuelle place de la Bastille."
  },
  {
    id: "Q011",
    question: "Quel roi de France régnait lors de la Révolution de 1789 ?",
    choices: ["A. Louis XIV", "B. Louis XV", "C. Louis XVI", "D. Napoléon Ier"],
    answer: "C",
    explanation: "Louis XVI régnait en 1789. Il a été exécuté en 1793 à Paris.",
    echo: "Un règne se termine quand la ville ne reconnaît plus la couronne.",
    level: 1,
    category: "Révolution",
    hint: "Époux de Marie-Antoinette."
  },
  {
    id: "Q012",
    question: "Quel instrument d'exécution est devenu un symbole de la Révolution française ?",
    choices: ["A. La potence", "B. La guillotine", "C. La chaise électrique", "D. Le bûcher"],
    answer: "B",
    explanation: "La guillotine, adoptée pendant la Révolution, est associée à la Terreur. Elle fut pensée comme un instrument « égalitaire ».",
    echo: "Quand l'égalité se fait machine, l'époque devient tranchante.",
    level: 1,
    category: "Révolution",
    hint: "« Rasoir national »."
  },
  {
    id: "Q013",
    question: "Quel cabaret parisien est symbolisé par un grand moulin rouge ?",
    choices: ["A. Le Lido", "B. Le Crazy Horse", "C. Le Moulin Rouge", "D. Les Folies Bergère"],
    answer: "C",
    explanation: "Le Moulin Rouge, fondé en 1889 à Pigalle, est un cabaret célèbre de la vie nocturne parisienne.",
    echo: "Une nuit de Paris: plus vraie parfois que le jour.",
    level: 1,
    category: "Belle Époque",
    hint: "Pigalle, 1889, affiches de Toulouse-Lautrec."
  },
  {
    id: "Q014",
    question: "Dans quel monument parisien Napoléon Ier est-il enterré ?",
    choices: ["A. Le Panthéon", "B. Les Invalides", "C. La Basilique Saint-Denis", "D. Notre-Dame de Paris"],
    answer: "B",
    explanation: "Le tombeau de Napoléon Ier se trouve aux Invalides, sous le dôme doré.",
    echo: "Un empire se réduit à un cercle de pierre, au centre du silence.",
    level: 1,
    category: "XIXe siècle",
    hint: "Grand dôme recouvert d'or."
  },
  {
    id: "Q015",
    question: "Quel gratte-ciel de 210 mètres, construit en 1973, est le seul de ce type dans Paris intra-muros ?",
    choices: ["A. La tour Eiffel", "B. La tour Montparnasse", "C. La tour Saint-Jacques", "D. La tour First"],
    answer: "B",
    explanation: "La tour Montparnasse, achevée en 1973, culmine à environ 210 m et reste une exception dans le centre de Paris.",
    echo: "Une verticalité qui rappelle qu'une ville choisit ses limites.",
    level: 1,
    category: "XXe siècle",
    hint: "Près de la gare Montparnasse."
  },
  {
    id: "Q016",
    question: "Quel quartier d'affaires est connu pour ses gratte-ciel et sa Grande Arche ?",
    choices: ["A. La Villette", "B. La Défense", "C. Bercy", "D. Montorgueil"],
    answer: "B",
    explanation: "La Défense est un grand quartier d'affaires à l'ouest de Paris, marqué par la Grande Arche inaugurée en 1989.",
    echo: "Là où la ville devient diagramme.",
    level: 1,
    category: "XXe siècle",
    hint: "Alignée avec l'Arc de Triomphe."
  },
  {
    id: "Q017",
    question: "En quelle année Paris a-t-elle été libérée de l'occupation nazie ?",
    choices: ["A. 1940", "B. 1944", "C. 1945", "D. 1939"],
    answer: "B",
    explanation: "Paris a été libérée le 25 août 1944, après quatre années d'occupation allemande.",
    echo: "Une ville se libère aussi de sa peur.",
    level: 1,
    category: "XXe siècle",
    hint: "25 août."
  },
  {
    id: "Q018",
    question: "Que s'est-il passé à Paris en mai 1968 ?",
    choices: ["A. Une révolte étudiante et une grève générale", "B. Une Exposition universelle", "C. Les Jeux olympiques d'été", "D. L'inauguration du métro de Paris"],
    answer: "A",
    explanation: "Mai 1968 a vu des manifestations étudiantes et une grande grève, transformant durablement la vie sociale et politique.",
    echo: "Quand les murs parlent, la ville devient tribune.",
    level: 1,
    category: "XXe siècle",
    hint: "Barricades au Quartier Latin."
  },
  {
    id: "Q019",
    question: "Quel est le plus grand cimetière de Paris, connu pour ses tombes de célébrités ?",
    choices: ["A. Montmartre", "B. Père-Lachaise", "C. Montparnasse", "D. Passy"],
    answer: "B",
    explanation: "Le Père-Lachaise (1804) est le plus grand cimetière intra-muros et l'un des plus visités.",
    echo: "À Paris, même la mort a une adresse.",
    level: 1,
    category: "Paris Secret",
    hint: "Dans le 20e arrondissement."
  },
  {
    id: "Q020",
    question: "Comment appelle-t-on les bateaux touristiques qui naviguent sur la Seine ?",
    choices: ["A. Bateaux-Mouches", "B. Batobus", "C. Gondoles", "D. Péniches"],
    answer: "A",
    explanation: "Les Bateaux-Mouches proposent des croisières sur la Seine pour voir Paris depuis le fleuve.",
    echo: "Une ville se comprend aussi à hauteur d'eau.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Départ souvent près du pont de l'Alma."
  },
  {
    id: "Q021",
    question: "Quel sandwich simple se compose d'une baguette, de beurre et de jambon ?",
    choices: ["A. Jambon-beurre", "B. Croque-monsieur", "C. Pan bagnat", "D. Hot-dog"],
    answer: "A",
    explanation: "Le jambon-beurre est un classique parisien: demi-baguette, beurre, jambon.",
    echo: "À Paris, la simplicité peut être une signature.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "On le trouve dans presque toutes les boulangeries."
  },
  {
    id: "Q022",
    question: "Quel plat traditionnel à base d'oignons gratinés de fromage est associé aux nuits des Halles ?",
    choices: ["A. Soupe à l'oignon", "B. Pot-au-feu", "C. Bouillabaisse", "D. Gratin dauphinois"],
    answer: "A",
    explanation: "La soupe à l'oignon gratinée était servie tard dans la nuit, notamment autour des anciennes Halles.",
    echo: "Une ville finit la nuit avec un bol chaud et du bruit dans les rues.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Oignons + gratin + pain."
  },
  {
    id: "Q023",
    question: "Quel petit gâteau rond, popularisé par Ladurée, est une spécialité parisienne ?",
    choices: ["A. Macaron", "B. Madeleine", "C. Croissant", "D. Éclair"],
    answer: "A",
    explanation: "Le macaron parisien est une coque de meringue garnie, décliné en de nombreuses saveurs.",
    echo: "Une douceur minuscule qui contient un cérémonial.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Souvent vendu en coffrets multicolores."
  },
  {
    id: "Q024",
    question: "Quelle danse est associée aux cabarets parisiens comme le Moulin Rouge ?",
    choices: ["A. French cancan", "B. Charleston", "C. Valse", "D. Tango"],
    answer: "A",
    explanation: "Le French cancan, célèbre à la Belle Époque, est une danse énergique de cabaret.",
    echo: "Quand la ville danse, elle oublie ses règles un instant.",
    level: 1,
    category: "Belle Époque",
    hint: "Danse à coups de jambes levées."
  },
  {
    id: "Q025",
    question: "Quel café de Saint-Germain-des-Prés est associé à Sartre et Beauvoir ?",
    choices: ["A. Les Deux Magots", "B. Café de Flore", "C. Le Procope", "D. La Coupole"],
    answer: "A",
    explanation: "Les Deux Magots, à Saint-Germain-des-Prés, est un lieu emblématique de la vie littéraire et intellectuelle parisienne.",
    echo: "Un café peut devenir un atelier d'idées.",
    level: 1,
    category: "Art & Lettres",
    hint: "Face à l'église Saint-Germain-des-Prés."
  },
  {
    id: "Q026",
    question: "Quelle date commémore la prise de la Bastille et est célébrée comme fête nationale ?",
    choices: ["A. 14 juillet", "B. 1er janvier", "C. 11 novembre", "D. 4 août"],
    answer: "A",
    explanation: "Le 14 juillet est la fête nationale française, associée à 1789 et aux célébrations républicaines.",
    echo: "Une date devient un rythme collectif.",
    level: 1,
    category: "Révolution",
    hint: "On dit souvent simplement « le 14 juillet »."
  },
  {
    id: "Q027",
    question: "Quel roi, surnommé le « Roi Soleil », a régné très longtemps et marqué l'époque classique ?",
    choices: ["A. François Ier", "B. Louis XIV", "C. Henri IV", "D. Louis XVI"],
    answer: "B",
    explanation: "Louis XIV a régné de 1643 à 1715. Il incarne la monarchie absolue et l'âge classique.",
    echo: "Un règne si long qu'il plie l'architecture à sa durée.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "1643–1715."
  },
  {
    id: "Q028",
    question: "Quel écrivain a écrit « Les Misérables » et « Notre-Dame de Paris » ?",
    choices: ["A. Alexandre Dumas", "B. Victor Hugo", "C. Émile Zola", "D. Gustave Flaubert"],
    answer: "B",
    explanation: "Victor Hugo a écrit « Notre-Dame de Paris » (1831) et « Les Misérables » (1862), deux œuvres liées à Paris.",
    echo: "Parfois, une ville devient un personnage.",
    level: 1,
    category: "Art & Lettres",
    hint: "Grand auteur romantique du XIXe siècle."
  },
  {
    id: "Q029",
    question: "Quelle chanteuse, surnommée « la Môme Piaf », a interprété « La Vie en rose » ?",
    choices: ["A. Dalida", "B. Édith Piaf", "C. Barbara", "D. Juliette Gréco"],
    answer: "B",
    explanation: "Édith Piaf est une figure majeure de la chanson française, associée à Paris et à ses mythologies.",
    echo: "Une voix suffit parfois à faire une ville.",
    level: 1,
    category: "Art & Lettres",
    hint: "« Piaf » signifie « moineau » en argot."
  },
  {
    id: "Q030",
    question: "Quel peintre espagnol, auteur de « Guernica », a longtemps vécu à Paris ?",
    choices: ["A. Pablo Picasso", "B. Salvador Dalí", "C. Francisco Goya", "D. Joan Miró"],
    answer: "A",
    explanation: "Pablo Picasso a vécu et travaillé à Paris, notamment au début du XXe siècle, fréquentant Montmartre puis Montparnasse.",
    echo: "Paris n'a pas seulement des monuments. Elle attire des forces.",
    level: 1,
    category: "Art & Lettres",
    hint: "Bateau-Lavoir, Montmartre."
  },
  {
    id: "Q031",
    question: "Quel musée d'art parisien est installé dans une ancienne gare et célèbre l'impressionnisme ?",
    choices: ["A. Louvre", "B. Musée d'Orsay", "C. Centre Pompidou", "D. Orangerie"],
    answer: "B",
    explanation: "Le musée d'Orsay occupe l'ancienne gare d'Orsay et conserve de grandes collections du XIXe siècle (impressionnisme, etc.).",
    echo: "Une gare arrêtée dans le temps pour faire passer d'autres voyages.",
    level: 1,
    category: "Art & Lettres",
    hint: "Ancienne gare construite pour 1900."
  },
  {
    id: "Q032",
    question: "Quel bois à l'ouest de Paris est connu pour ses lacs et jardins ?",
    choices: ["A. Bois de Vincennes", "B. Buttes-Chaumont", "C. Bois de Boulogne", "D. Fontainebleau"],
    answer: "C",
    explanation: "Le bois de Boulogne est un vaste espace vert à l'ouest de Paris, avec lacs, allées et jardins.",
    echo: "La ville garde un bord sauvage, comme une respiration.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Proche du 16e arrondissement."
  },
  {
    id: "Q033",
    question: "Quel bois à l'est de Paris abrite notamment le Parc Floral et le lac Daumesnil ?",
    choices: ["A. Bois de Boulogne", "B. Parc Montsouris", "C. Bois de Vincennes", "D. Parc de Belleville"],
    answer: "C",
    explanation: "Le bois de Vincennes est un grand espace vert à l'est de Paris, avec le Parc Floral et le lac Daumesnil.",
    echo: "Deux bois: deux portes vertes pour sortir sans quitter la ville.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Au sud-est de Paris."
  },
  {
    id: "Q034",
    question: "Quelle est la population approximative de Paris intra-muros ?",
    choices: ["A. Environ 2,2 millions", "B. Environ 10 millions", "C. Environ 500 000", "D. Environ 8 millions"],
    answer: "A",
    explanation: "Paris intra-muros compte un peu plus de 2 millions d'habitants. L'aire urbaine, elle, est bien plus large.",
    echo: "Une densité: pas seulement des gens, des histoires superposées.",
    level: 1,
    category: "Repères",
    hint: "L'agglomération dépasse largement Paris intra-muros."
  },
  {
    id: "Q035",
    question: "Où réside officiellement le Président de la République à Paris ?",
    choices: ["A. Palais Bourbon", "B. Hôtel de Ville", "C. Matignon", "D. Élysée"],
    answer: "D",
    explanation: "La résidence officielle du Président de la République est le palais de l'Élysée (rue du Faubourg-Saint-Honoré).",
    echo: "Le pouvoir a une adresse. La ville aussi.",
    level: 1,
    category: "Repères",
    hint: "Présidence ≠ Gouvernement (Matignon)."
  },
  {
    id: "Q036",
    question: "Dans quel arrondissement se trouve la tour Eiffel ?",
    choices: ["A. 5ᵉ", "B. 7ᵉ", "C. 18ᵉ", "D. 1ᵉʳ"],
    answer: "B",
    explanation: "La tour Eiffel se situe dans le 7ᵉ arrondissement, près du Champ-de-Mars.",
    echo: "Un repère mondial, une adresse très précise.",
    level: 1,
    category: "Repères",
    hint: "Rive gauche, proche des Invalides."
  },
  {
    id: "Q037",
    question: "Dans quel arrondissement se trouve Montmartre et le Sacré-Cœur ?",
    choices: ["A. 18ᵉ", "B. 5ᵉ", "C. 12ᵉ", "D. 7ᵉ"],
    answer: "A",
    explanation: "Montmartre et la basilique du Sacré-Cœur se trouvent dans le 18ᵉ arrondissement.",
    echo: "Un village au-dessus de la ville, toujours là.",
    level: 1,
    category: "Repères",
    hint: "Nord de Paris."
  },
  {
    id: "Q038",
    question: "Dans quel arrondissement se trouve le musée du Louvre ?",
    choices: ["A. 1ᵉʳ", "B. 4ᵉ", "C. 7ᵉ", "D. 6ᵉ"],
    answer: "A",
    explanation: "Le Louvre est dans le 1ᵉʳ arrondissement, au cœur de Paris, près des Tuileries.",
    echo: "Le centre n'est pas un point. C'est une densité.",
    level: 1,
    category: "Repères",
    hint: "Voisin du jardin des Tuileries."
  },
  {
    id: "Q039",
    question: "Dans quel arrondissement se trouve Notre-Dame (Île de la Cité) ?",
    choices: ["A. 4ᵉ", "B. 1ᵉʳ", "C. 5ᵉ", "D. 7ᵉ"],
    answer: "A",
    explanation: "Notre-Dame se situe dans le 4ᵉ arrondissement, sur l'Île de la Cité.",
    echo: "Au milieu de l'eau, une pierre qui fait centre.",
    level: 1,
    category: "Repères",
    hint: "Île de la Cité."
  },
  {
    id: "Q040",
    question: "Quel monument égyptien se dresse au centre de la place de la Concorde ?",
    choices: ["A. Statue de Ramsès", "B. Pierre de Rosette", "C. Obélisque de Louxor", "D. Pyramide de Khéops"],
    answer: "C",
    explanation: "L'obélisque de Louxor, offert au XIXe siècle, est installé place de la Concorde depuis 1836.",
    echo: "Un fragment d'Égypte planté dans l'axe de Paris.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Installé en 1836."
  },
  {
    id: "Q041",
    question: "Quel grand jardin entre le Louvre et la place de la Concorde était lié au palais des Tuileries ?",
    choices: ["A. Jardin des Tuileries", "B. Jardin du Luxembourg", "C. Parc Monceau", "D. Parc Montsouris"],
    answer: "A",
    explanation: "Le jardin des Tuileries a été aménagé au XVIe siècle et se situe entre le Louvre et la place de la Concorde.",
    echo: "Entre deux pierres de pouvoir, la marche devient calme.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Il longe la rue de Rivoli et les bassins sont célèbres."
  },
  {
    id: "Q042",
    question: "Quel marché aux puces, tout près de Paris, est associé à Saint-Ouen ?",
    choices: ["A. Marché d'Aligre", "B. Puces de Saint-Ouen", "C. Marché des Enfants Rouges", "D. Marché Raspail"],
    answer: "B",
    explanation: "Les Puces de Saint-Ouen sont un vaste ensemble de marchés d'antiquités et de brocante, aux portes de Paris.",
    echo: "La ville garde tout, même ce qu'elle a laissé partir.",
    level: 1,
    category: "Paris Secret",
    hint: "On y va souvent le week-end pour chiner."
  },
  {
    id: "Q043",
    question: "Quel pont Beaux-Arts, inauguré pour l'Exposition universelle de 1900, est célèbre pour ses candélabres dorés ?",
    choices: ["A. Pont de Bir-Hakeim", "B. Pont Alexandre-III", "C. Pont Neuf", "D. Pont des Arts"],
    answer: "B",
    explanation: "Le pont Alexandre-III a été inauguré en 1900 et se distingue par une décoration Beaux-Arts très riche.",
    echo: "Un trait d'or posé sur l'eau.",
    level: 1,
    category: "Belle Époque",
    hint: "Il relie le secteur des Invalides au Grand Palais."
  },
  {
    id: "Q044",
    question: "Dans quel arrondissement se trouve la gare de Lyon ?",
    choices: ["A. 4e", "B. 10e", "C. 12e", "D. 15e"],
    answer: "C",
    explanation: "La gare de Lyon se situe dans le 12e arrondissement, près de la Seine et de la place de la Bastille.",
    echo: "Les trains partent, la ville reste.",
    level: 1,
    category: "Repères",
    hint: "Elle est proche de Bercy et du quai d'Austerlitz."
  },
  {
    id: "Q045",
    question: "Quelle librairie anglophone emblématique se trouve face à Notre-Dame, sur la rive gauche ?",
    choices: ["A. Galignani", "B. Shakespeare and Company", "C. La Hune", "D. Gibert Joseph"],
    answer: "B",
    explanation: "Shakespeare and Company est une librairie anglophone mythique située près de la Seine, en face de Notre-Dame.",
    echo: "Un refuge de papier, à portée de cloche.",
    level: 1,
    category: "Art & Lettres",
    hint: "Son nom est en anglais et elle est près de Saint-Michel."
  },
  {
    id: "Q046",
    question: "Quelle avenue relie la place de la Concorde à l'Arc de Triomphe ?",
    choices: ["A. Avenue des Champs-Élysées", "B. Boulevard Saint-Germain", "C. Rue de Rivoli", "D. Avenue Montaigne"],
    answer: "A",
    explanation: "L'avenue des Champs-Élysées s'étire entre la Concorde et l'Arc de Triomphe et fait partie de l'axe historique parisien.",
    echo: "Une ligne de désir tirée dans la ville.",
    level: 1,
    category: "XIXe siècle",
    hint: "On y célèbre souvent les grandes victoires et fêtes nationales."
  },
  {
    id: "Q047",
    question: "Quel grand centre de spectacles et de congrès se trouve porte Maillot ?",
    choices: ["A. Palais des Congrès de Paris", "B. Grand Palais", "C. Maison de la Radio", "D. Philharmonie de Paris"],
    answer: "A",
    explanation: "Le Palais des Congrès de Paris est situé porte Maillot et accueille concerts, conférences et salons.",
    echo: "Là où la ville rassemble ses voix.",
    level: 1,
    category: "XXe siècle",
    hint: "À côté de la place de la Porte Maillot."
  },
  {
    id: "Q048",
    question: "Quelle île de Paris, connue pour ses hôtels particuliers, se trouve juste à l'est de l'île de la Cité ?",
    choices: ["A. Île aux Cygnes", "B. Île Saint-Louis", "C. Île de la Jatte", "D. Île Saint-Germain"],
    answer: "B",
    explanation: "L'île Saint-Louis est célèbre pour son architecture du XVIIe siècle et son atmosphère résidentielle.",
    echo: "Une île qui écoute le fleuve passer.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Elle est entre les deux bras de la Seine."
  },
  {
    id: "Q049",
    question: "Quel édifice médiéval visible aujourd'hui est une tour du XVe siècle située rue Étienne-Marcel (près de Réaumur) ?",
    choices: ["A. Tour Jean-sans-Peur", "B. Conciergerie", "C. Hôtel de Sens", "D. Maison de Nicolas Flamel"],
    answer: "A",
    explanation: "La tour Jean-sans-Peur est un vestige médiéval du XVe siècle, lié aux ducs de Bourgogne.",
    echo: "Une pierre verticale qui n'a rien oublié.",
    level: 1,
    category: "Moyen Âge",
    hint: "Elle est dans le 2e arrondissement."
  },
  {
    id: "Q050",
    question: "Quel grand magasin est célèbre pour sa grande coupole en verre au boulevard Haussmann ?",
    choices: ["A. Le Bon Marché", "B. Galeries Lafayette", "C. BHV Marais", "D. La Samaritaine"],
    answer: "B",
    explanation: "Les Galeries Lafayette Haussmann sont connues pour leur coupole Art nouveau et leur bâtiment historique.",
    echo: "Sous une voûte de verre, la foule devient rituel.",
    level: 1,
    category: "XIXe siècle",
    hint: "Proche de l'Opéra Garnier."
  },
  {
    id: "Q051",
    question: "Quelle place parisienne est célèbre pour sa forme octogonale et ses joailliers ?",
    choices: ["A. Place des Vosges", "B. Place Vendôme", "C. Place de la République", "D. Place du Tertre"],
    answer: "B",
    explanation: "La place Vendôme est une place octogonale réputée pour ses hôtels et ses maisons de joaillerie.",
    echo: "La géométrie du prestige, en silence.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "On y trouve aussi un palace très connu."
  },
  {
    id: "Q052",
    question: "Comment s'appelle le grand opéra historique de Paris inauguré en 1875 ?",
    choices: ["A. Opéra Bastille", "B. Opéra Garnier", "C. Théâtre du Châtelet", "D. Opéra Comique"],
    answer: "B",
    explanation: "L'Opéra Garnier, inauguré en 1875, est un monument majeur du Paris du XIXe siècle.",
    echo: "Un escalier où la ville se met en scène.",
    level: 1,
    category: "XIXe siècle",
    hint: "Il est près de la station Opéra."
  },
  {
    id: "Q053",
    question: "Quel parc du 19e arrondissement est connu pour ses falaises, son lac et le temple de la Sibylle ?",
    choices: ["A. Parc Montsouris", "B. Parc des Buttes-Chaumont", "C. Parc Monceau", "D. Jardin des Plantes"],
    answer: "B",
    explanation: "Le parc des Buttes-Chaumont offre un paysage romantique avec grotte, pont suspendu et belvédère.",
    echo: "Une nature composée comme un décor, et pourtant vraie.",
    level: 1,
    category: "XIXe siècle",
    hint: "Il est proche de la station Botzaris."
  },
  {
    id: "Q054",
    question: "Comment appelle-t-on les galeries commerciales couvertes du XIXe siècle, comme le passage des Panoramas ?",
    choices: ["A. Arcades", "B. Passages couverts", "C. Cours intérieures", "D. Galeries souterraines"],
    answer: "B",
    explanation: "Les passages couverts sont des galeries piétonnes souvent vitrées, très présentes dans le Paris du XIXe siècle.",
    echo: "Des rues intérieures où le temps ralentit.",
    level: 1,
    category: "XIXe siècle",
    hint: "Beaucoup sont près des Grands Boulevards."
  },
  {
    id: "Q055",
    question: "Quel musée parisien est installé dans une ancienne gare et célèbre l'art du XIXe siècle ?",
    choices: ["A. Musée d'Orsay", "B. Musée Rodin", "C. Centre Pompidou", "D. Musée de l'Orangerie"],
    answer: "A",
    explanation: "Le musée d'Orsay occupe une ancienne gare et présente notamment l'impressionnisme et le post-impressionnisme.",
    echo: "Un départ de trains devenu départ de regards.",
    level: 1,
    category: "Art & Lettres",
    hint: "Il est sur la rive gauche, face au Louvre."
  },
  {
    id: "Q056",
    question: "Quel salon de thé parisien est célèbre pour son chocolat chaud et son dessert Mont-Blanc ?",
    choices: ["A. Angelina", "B. Ladurée", "C. Pierre Hermé", "D. Dalloyau"],
    answer: "A",
    explanation: "Angelina, près de la rue de Rivoli, est réputé pour son chocolat chaud et le Mont-Blanc.",
    echo: "Un rituel sucré qui tient chaud aux siècles.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "On y va souvent après une promenade aux Tuileries."
  },
  {
    id: "Q057",
    question: "Quelle statue dorée se dresse place des Pyramides, près du Louvre ?",
    choices: ["A. Louis XIV", "B. Jeanne d'Arc", "C. Napoléon Ier", "D. Henri IV"],
    answer: "B",
    explanation: "La statue de Jeanne d'Arc se trouve place des Pyramides, près du Louvre.",
    echo: "Une présence droite au milieu du flux.",
    level: 1,
    category: "XIXe siècle",
    hint: "Elle est dorée et proche de la rue de Rivoli."
  },
  {
    id: "Q058",
    question: "Quel quartier parisien donne son nom à une grande salle de concerts construite dans un ancien entrepôt de vin ?",
    choices: ["A. Bercy", "B. Passy", "C. Auteuil", "D. Batignolles"],
    answer: "A",
    explanation: "Bercy a longtemps été un quartier d'entrepôts de vin et accueille aujourd'hui de grands équipements culturels.",
    echo: "Quand une ville change d'usage, elle change de rythme.",
    level: 1,
    category: "XXe siècle",
    hint: "On y trouve une grande salle de concerts près du parc."
  },
  {
    id: "Q059",
    question: "Quel est le nom du plus ancien pont de Paris encore debout, malgré son nom ?",
    choices: ["A. Pont Neuf", "B. Pont Marie", "C. Pont Royal", "D. Pont de la Tournelle"],
    answer: "A",
    explanation: "Le Pont Neuf est le plus ancien pont de Paris encore existant et traverse la Seine à la pointe de l'île de la Cité.",
    echo: "Une pierre qui enjambe le temps.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Son nom signifie « nouveau », mais il ne l'est plus depuis longtemps."
  },
  {
    id: "Q060",
    question: "Quel grand cimetière parisien est connu pour ses tombes célèbres et ses allées arborées ?",
    choices: ["A. Montparnasse", "B. Père-Lachaise", "C. Passy", "D. Montmartre"],
    answer: "B",
    explanation: "Le cimetière du Père-Lachaise est l'un des plus connus de Paris et abrite de nombreuses tombes de personnalités.",
    echo: "Une ville de noms, à l'écart du bruit.",
    level: 1,
    category: "Paris Secret",
    hint: "Il se situe dans le 20e arrondissement."
  },
  {
    id: "Q061",
    question: "Quel quartier est associé à la rue des Rosiers et à une histoire juive parisienne ?",
    choices: ["A. Le Marais", "B. La Défense", "C. Bercy", "D. La Villette"],
    answer: "A",
    explanation: "Le Marais comprend un quartier historique autour de la rue des Rosiers, connu pour ses commerces et restaurants.",
    echo: "Une mémoire qui passe aussi par la table.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "C'est dans le 4e arrondissement."
  },
  {
    id: "Q062",
    question: "Quelle grande avenue du 16e arrondissement est connue pour sa largeur et ses arbres ?",
    choices: ["A. Avenue Foch", "B. Avenue de l'Opéra", "C. Boulevard Haussmann", "D. Avenue Ledru-Rollin"],
    answer: "A",
    explanation: "L'avenue Foch est une large avenue bordée d'arbres, près de l'Arc de Triomphe.",
    echo: "Un souffle long dans la pierre.",
    level: 1,
    category: "XIXe siècle",
    hint: "Elle part de la place de l'Étoile."
  },
  {
    id: "Q063",
    question: "Quelle pâtisserie a été créée en hommage à une course cycliste et a la forme d'une roue ?",
    choices: ["A. Paris-Brest", "B. Mille-feuille", "C. Opéra", "D. Religieuse"],
    answer: "A",
    explanation: "Le Paris-Brest a été créé au début du XXe siècle et sa forme évoque une roue de vélo.",
    echo: "Un cercle de douceur né d'une ligne de vitesse.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Son nom est aussi celui d'une course entre deux villes."
  },
  {
    id: "Q064",
    question: "Quel boulevard parisien porte le nom d'un philosophe des Lumières et traverse l'est de Paris ?",
    choices: ["A. Boulevard Voltaire", "B. Boulevard Raspail", "C. Boulevard Haussmann", "D. Boulevard Saint-Michel"],
    answer: "A",
    explanation: "Le boulevard Voltaire relie notamment la place de la République et la place de la Nation.",
    echo: "Un nom d'idée devenu direction.",
    level: 1,
    category: "Art & Lettres",
    hint: "Voltaire est un écrivain et philosophe du XVIIIe siècle."
  },
  {
    id: "Q065",
    question: "Quel lieu du 6e arrondissement, fondé au XVIIe siècle, est souvent présenté comme un des plus anciens cafés de Paris ?",
    choices: ["A. Le Procope", "B. Le Select", "C. La Coupole", "D. Les Deux Magots"],
    answer: "A",
    explanation: "Le Procope est un café-restaurant historique du quartier Odéon, lié à l'histoire intellectuelle parisienne.",
    echo: "Là où la parole a longtemps fait office de feu.",
    level: 1,
    category: "Art & Lettres",
    hint: "Il est près de la rue de l'Ancienne-Comédie."
  },
  {
    id: "Q066",
    question: "Quel bâtiment culturel a des tuyaux colorés visibles sur sa façade dans le quartier Beaubourg ?",
    choices: ["A. Centre Pompidou", "B. Grand Palais", "C. Institut du Monde Arabe", "D. Maison de la Radio"],
    answer: "A",
    explanation: "Le Centre Pompidou, inauguré en 1977, se reconnaît à son architecture « dedans-dehors ».",
    echo: "Une machine à voir, retournée vers la rue.",
    level: 1,
    category: "XXe siècle",
    hint: "Il est près du Marais."
  },
  {
    id: "Q067",
    question: "Quel stade parisien est associé au football et au Parc des Princes ?",
    choices: ["A. Parc des Princes", "B. Stade Charléty", "C. Stade Jean-Bouin", "D. Stade de France"],
    answer: "A",
    explanation: "Le Parc des Princes est un grand stade parisien connu pour accueillir des matchs de football.",
    echo: "Un amphithéâtre de cris, contenu par la pierre.",
    level: 1,
    category: "XXe siècle",
    hint: "Il est proche de la porte de Saint-Cloud."
  },
  {
    id: "Q068",
    question: "Quel canal parisien traverse des écluses et des passerelles, entre République et la Villette ?",
    choices: ["A. Canal Saint-Martin", "B. Canal de l'Ourcq", "C. Canal Saint-Denis", "D. La Bièvre"],
    answer: "A",
    explanation: "Le canal Saint-Martin est connu pour ses écluses, ses quais et ses passerelles métalliques.",
    echo: "Une veine d'eau lente sous la ville rapide.",
    level: 1,
    category: "XIXe siècle",
    hint: "Il est très lié au 10e arrondissement."
  },
  {
    id: "Q069",
    question: "Quelle place proche du Quartier Latin est célèbre pour sa grande fontaine avec l'archange Michel ?",
    choices: ["A. Place Saint-Michel", "B. Place de la République", "C. Place de la Nation", "D. Place des Vosges"],
    answer: "A",
    explanation: "La place Saint-Michel est marquée par la fontaine Saint-Michel, construite au XIXe siècle.",
    echo: "Un carrefour où l'eau et la pierre se répondent.",
    level: 1,
    category: "XIXe siècle",
    hint: "Elle est au bout du boulevard Saint-Michel."
  },
  {
    id: "Q070",
    question: "Quel grand lieu scientifique se trouve dans le parc de la Villette ?",
    choices: ["A. Cité des sciences et de l'industrie", "B. Palais de la Découverte", "C. Musée des Arts et Métiers", "D. Musée de l'Homme"],
    answer: "A",
    explanation: "La Cité des sciences et de l'industrie est un grand centre de culture scientifique situé à la Villette.",
    echo: "La curiosité a aussi ses cathédrales.",
    level: 1,
    category: "XXe siècle",
    hint: "On y voit une grande sphère appelée la Géode."
  },
  {
    id: "Q071",
    question: "Quelle gare parisienne dessert notamment la Bretagne en TGV ?",
    choices: ["A. Gare Montparnasse", "B. Gare de l'Est", "C. Gare du Nord", "D. Gare Saint-Lazare"],
    answer: "A",
    explanation: "La gare Montparnasse est un grand départ vers l'ouest de la France, dont la Bretagne.",
    echo: "Une porte ouverte vers l'océan.",
    level: 1,
    category: "Repères",
    hint: "Elle est proche de la tour Montparnasse."
  },
  {
    id: "Q072",
    question: "Quel café de Saint-Germain-des-Prés est associé à Sartre et Beauvoir ?",
    choices: ["A. Les Deux Magots", "B. Le Procope", "C. La Coupole", "D. Le Train Bleu"],
    answer: "A",
    explanation: "Les Deux Magots est un café célèbre de Saint-Germain-des-Prés, lié à l'histoire littéraire du quartier.",
    echo: "Une table peut devenir une époque.",
    level: 1,
    category: "Art & Lettres",
    hint: "Il est près de l'église Saint-Germain-des-Prés."
  },
  {
    id: "Q073",
    question: "Quel grand magasin de la rive gauche a longtemps été présenté comme un pionnier des grands magasins ?",
    choices: ["A. Le Bon Marché", "B. BHV Marais", "C. La Samaritaine", "D. Printemps Haussmann"],
    answer: "A",
    explanation: "Le Bon Marché est un grand magasin historique de la rive gauche, associé à l'essor du commerce moderne.",
    echo: "Le quotidien, élevé au rang de vitrine.",
    level: 1,
    category: "XIXe siècle",
    hint: "Il est dans le 7e arrondissement."
  },
  {
    id: "Q074",
    question: "Quel pont piéton relie le Louvre à l'Institut de France ?",
    choices: ["A. Pont des Arts", "B. Pont d'Iéna", "C. Pont de Sully", "D. Pont Mirabeau"],
    answer: "A",
    explanation: "Le pont des Arts est un pont piéton entre le Louvre et l'Institut de France.",
    echo: "Un passage léger pour des pas lourds de promesses.",
    level: 1,
    category: "Paris Secret",
    hint: "C'est un pont très photogénique sur la Seine."
  },
  {
    id: "Q075",
    question: "Quelle grande église parisienne se trouve place Saint-Sulpice ?",
    choices: ["A. Église Saint-Sulpice", "B. Église de la Madeleine", "C. Église Saint-Eustache", "D. Église Saint-Augustin"],
    answer: "A",
    explanation: "L'église Saint-Sulpice est un édifice majeur du 6e arrondissement, sur une vaste place.",
    echo: "Un volume d'ombre au milieu des cafés.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Elle est proche du jardin du Luxembourg."
  },
  {
    id: "Q076",
    question: "Quel quartier du 18e arrondissement est connu pour ses marchés et commerces liés à l'Afrique autour de Château Rouge ?",
    choices: ["A. Château Rouge", "B. Bercy", "C. Passy", "D. Père-Lachaise"],
    answer: "A",
    explanation: "Château Rouge est un secteur du 18e arrondissement connu pour ses commerces et son ambiance de marché.",
    echo: "Un morceau de monde posé sur un trottoir.",
    level: 1,
    category: "Paris Secret",
    hint: "C'est près de Montmartre, au nord."
  },
  {
    id: "Q077",
    question: "Quel musée raconte l'histoire de Paris et se trouve dans le Marais ?",
    choices: ["A. Musée Carnavalet", "B. Musée de Cluny", "C. Musée Guimet", "D. Musée Rodin"],
    answer: "A",
    explanation: "Le musée Carnavalet est dédié à l'histoire de Paris et se situe dans le quartier du Marais.",
    echo: "Une ville se lit aussi dans ses objets.",
    level: 1,
    category: "Art & Lettres",
    hint: "Il est dans le 3e arrondissement."
  },
  {
    id: "Q078",
    question: "Quelle station de métro est connue pour sa grande profondeur à Montmartre ?",
    choices: ["A. Abbesses", "B. Châtelet", "C. Odéon", "D. République"],
    answer: "A",
    explanation: "La station Abbesses, sur la ligne 12, est réputée pour sa profondeur et ses longs escaliers.",
    echo: "On descend pour mieux remonter.",
    level: 1,
    category: "Paris Secret",
    hint: "Elle dessert Montmartre."
  },
  {
    id: "Q079",
    question: "Quel quartier du 13e arrondissement est connu pour sa grande dalle piétonne et ses tours, près de la place d'Italie ?",
    choices: ["A. Les Olympiades", "B. La Défense", "C. Beaugrenelle", "D. Bastille"],
    answer: "A",
    explanation: "Les Olympiades sont un ensemble urbain construit sur dalle dans le 13e arrondissement.",
    echo: "Un sol au-dessus du sol, pour une vie autrement.",
    level: 1,
    category: "XXe siècle",
    hint: "C'est près du quartier asiatique."
  },
  {
    id: "Q080",
    question: "Quel est le nom du plus ancien marché couvert de Paris, situé dans le 3e arrondissement ?",
    choices: ["A. Marché des Enfants Rouges", "B. Marché d'Aligre", "C. Marché Raspail", "D. Marché Saint-Quentin"],
    answer: "A",
    explanation: "Le marché des Enfants Rouges est un marché couvert historique du Haut-Marais.",
    echo: "Sous la verrière, les langues se mélangent.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Il est proche de la rue de Bretagne."
  },
  {
    id: "Q081",
    question: "Quel palace se trouve place Vendôme et porte le nom 'Ritz' ?",
    choices: ["A. Ritz Paris", "B. Le Meurice", "C. Hôtel de Crillon", "D. Plaza Athénée"],
    answer: "A",
    explanation: "Le Ritz Paris est un palace emblématique situé place Vendôme.",
    echo: "Un nom devenu une mesure du monde.",
    level: 1,
    category: "Belle Époque",
    hint: "Il est dans le 1er arrondissement."
  },
  {
    id: "Q082",
    question: "Comment s'appelle la grande perspective alignant La Défense, l'Arc de Triomphe et le Louvre ?",
    choices: ["A. Axe historique", "B. Petite Ceinture", "C. Voie Romaine", "D. Grand Boulevard"],
    answer: "A",
    explanation: "On parle souvent de l'axe historique de Paris, une perspective monumentale qui traverse l'ouest et le centre.",
    echo: "Une ligne droite qui traverse des siècles.",
    level: 1,
    category: "Repères",
    hint: "Elle passe par les Champs-Élysées."
  },
  {
    id: "Q083",
    question: "Dans quel jardin des enfants font-ils souvent naviguer de petits voiliers sur un bassin ?",
    choices: ["A. Jardin du Luxembourg", "B. Parc Monceau", "C. Buttes-Chaumont", "D. Parc Montsouris"],
    answer: "A",
    explanation: "Le jardin du Luxembourg est connu pour son grand bassin où l'on fait voguer des petits bateaux.",
    echo: "Un jeu simple, transmis sans bruit.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "C'est sur la rive gauche."
  },
  {
    id: "Q084",
    question: "Quel théâtre de cabaret de Montmartre est reconnaissable à son grand moulin rouge ?",
    choices: ["A. Moulin Rouge", "B. L'Olympia", "C. Le Trianon", "D. Le Bataclan"],
    answer: "A",
    explanation: "Le Moulin Rouge est un cabaret fondé à la fin du XIXe siècle, symbole de la vie nocturne de Montmartre.",
    echo: "La nuit a ses monuments aussi.",
    level: 1,
    category: "Belle Époque",
    hint: "Il est près de Pigalle."
  },
  {
    id: "Q085",
    question: "Quel pont de métal avec un niveau de métro au-dessus est un repère près de la tour Eiffel ?",
    choices: ["A. Pont de Bir-Hakeim", "B. Pont Alexandre-III", "C. Pont Marie", "D. Pont au Change"],
    answer: "A",
    explanation: "Le pont de Bir-Hakeim est connu pour sa structure métallique et le passage aérien du métro.",
    echo: "Deux niveaux de ville, un seul fleuve.",
    level: 1,
    category: "XXe siècle",
    hint: "La ligne 6 du métro y passe au-dessus de la Seine."
  },
  {
    id: "Q086",
    question: "Quel quartier est célèbre pour ses fresques et son street art autour de Belleville et Ménilmontant ?",
    choices: ["A. Belleville", "B. Invalides", "C. Auteuil", "D. Place Vendôme"],
    answer: "A",
    explanation: "Belleville est connu pour son énergie culturelle et de nombreuses fresques visibles dans les rues.",
    echo: "Des murs qui parlent sans demander la parole.",
    level: 1,
    category: "XXe siècle",
    hint: "C'est au nord-est de Paris."
  },
  {
    id: "Q087",
    question: "Quel grand site de la Bibliothèque nationale de France se reconnaît à quatre tours en forme de livres ?",
    choices: ["A. Site François-Mitterrand", "B. Site Richelieu", "C. Bibliothèque Mazarine", "D. Bibliothèque Sainte-Geneviève"],
    answer: "A",
    explanation: "Le site François-Mitterrand de la BnF, inauguré dans les années 1990, est reconnaissable à ses quatre tours.",
    echo: "La mémoire dressée en skyline.",
    level: 1,
    category: "XXe siècle",
    hint: "Il est dans le 13e arrondissement."
  },
  {
    id: "Q088",
    question: "Quelle avenue est associée aux maisons de haute couture près des Champs-Élysées ?",
    choices: ["A. Avenue Montaigne", "B. Boulevard Voltaire", "C. Rue Mouffetard", "D. Avenue de Clichy"],
    answer: "A",
    explanation: "L'avenue Montaigne est une adresse emblématique de la haute couture à Paris.",
    echo: "L'élégance commence souvent par une rue.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Elle est proche de l'Alma."
  },
  {
    id: "Q089",
    question: "Quel quartier étudiant de la rive gauche doit son nom à l'usage ancien du latin ?",
    choices: ["A. Quartier Latin", "B. Le Marais", "C. Montparnasse", "D. La Défense"],
    answer: "A",
    explanation: "Le Quartier Latin est historiquement lié aux universités et à la vie intellectuelle parisienne.",
    echo: "Des pierres anciennes, une jeunesse persistante.",
    level: 1,
    category: "Art & Lettres",
    hint: "Il est autour de la Sorbonne."
  },
  {
    id: "Q090",
    question: "Quel musée près de la tour Eiffel présente des arts d'Afrique, d'Asie, d'Océanie et des Amériques ?",
    choices: ["A. Musée du quai Branly - Jacques Chirac", "B. Musée Guimet", "C. Musée d'Orsay", "D. Musée Carnavalet"],
    answer: "A",
    explanation: "Le musée du quai Branly - Jacques Chirac est dédié aux arts et civilisations non occidentales.",
    echo: "Un monde entier tenu dans un jardin.",
    level: 1,
    category: "Art & Lettres",
    hint: "Son bâtiment est associé à Jean Nouvel."
  },
  {
    id: "Q091",
    question: "Quel nom associe-t-on couramment à la Sorbonne, lieu historique d'enseignement à Paris ?",
    choices: ["A. Sorbonne", "B. La Coupole", "C. Le Panthéon", "D. La Monnaie de Paris"],
    answer: "A",
    explanation: "La Sorbonne est un nom emblématique de l'histoire universitaire parisienne, au cœur du Quartier Latin.",
    echo: "Un lieu où les mots ont poids de pierre.",
    level: 1,
    category: "Moyen Âge",
    hint: "C'est près du Panthéon."
  },
  {
    id: "Q092",
    question: "Quelle colonne commémorative se trouve au centre de la place Vendôme ?",
    choices: ["A. Colonne Vendôme", "B. Colonne de Juillet", "C. Obélisque de Louxor", "D. Colonne Morris"],
    answer: "A",
    explanation: "La colonne Vendôme se dresse place Vendôme et fait partie des monuments emblématiques du centre de Paris.",
    echo: "Une spirale de bronze au milieu du calme.",
    level: 1,
    category: "XIXe siècle",
    hint: "La place est proche du jardin des Tuileries."
  },
  {
    id: "Q093",
    question: "Quel tournoi de tennis du Grand Chelem se joue chaque année à Paris ?",
    choices: ["A. Roland-Garros", "B. Wimbledon", "C. US Open", "D. Open d'Australie"],
    answer: "A",
    explanation: "Roland-Garros est le tournoi de tennis du Grand Chelem disputé à Paris, sur terre battue.",
    echo: "La poussière rouge, scène d'un duel élégant.",
    level: 1,
    category: "XXe siècle",
    hint: "Il se joue dans le 16e arrondissement."
  },
  {
    id: "Q094",
    question: "Quelle gare parisienne est un grand point de départ vers le nord de la France et des destinations internationales ?",
    choices: ["A. Gare du Nord", "B. Gare d'Austerlitz", "C. Gare Saint-Lazare", "D. Gare de l'Est"],
    answer: "A",
    explanation: "La gare du Nord dessert de nombreuses destinations vers le nord de la France et l'Europe.",
    echo: "Sous la verrière, la ville se démultiplie.",
    level: 1,
    category: "Repères",
    hint: "Elle est dans le 10e arrondissement."
  },
  {
    id: "Q095",
    question: "Quel grand cinéma parisien est connu pour sa grande salle et sa façade art déco ?",
    choices: ["A. Le Grand Rex", "B. La Pagode", "C. Le Champo", "D. UGC Les Halles"],
    answer: "A",
    explanation: "Le Grand Rex est un cinéma emblématique de Paris, connu pour sa grande salle et ses événements.",
    echo: "Un palais où les images deviennent foule.",
    level: 1,
    category: "XXe siècle",
    hint: "Il est sur les Grands Boulevards."
  },
  {
    id: "Q096",
    question: "Quel musée parisien présente des collections de sciences et d'inventions dans l'ancienne abbaye de Saint-Martin-des-Champs ?",
    choices: ["A. Musée des Arts et Métiers", "B. Musée de l'Homme", "C. Palais de la Découverte", "D. Cité de l'Architecture"],
    answer: "A",
    explanation: "Le musée des Arts et Métiers est consacré aux sciences, techniques et inventions, dans un ensemble historique.",
    echo: "Le génie humain exposé comme une relique.",
    level: 1,
    category: "XXe siècle",
    hint: "Il est dans le 3e arrondissement."
  },
  {
    id: "Q097",
    question: "Quel monument parisien abrite le tombeau de Napoléon Ier sous un grand dôme doré ?",
    choices: ["A. Les Invalides", "B. Le Panthéon", "C. La Madeleine", "D. Saint-Denis"],
    answer: "A",
    explanation: "Les Invalides abritent le tombeau de Napoléon Ier et un musée militaire important.",
    echo: "Sous l'or, une histoire lourde dort.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "On le voit depuis le pont Alexandre-III."
  },
  {
    id: "Q098",
    question: "Quel parc à l'est de Paris est associé au lac Daumesnil et au bois de Vincennes ?",
    choices: ["A. Bois de Vincennes", "B. Bois de Boulogne", "C. Parc Monceau", "D. Parc de Belleville"],
    answer: "A",
    explanation: "Le bois de Vincennes est un grand espace vert à l'est de Paris, avec lacs et jardins.",
    echo: "Une respiration large au bord de la ville.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Il est près du 12e arrondissement."
  },
  {
    id: "Q099",
    question: "Quel jardin botanique parisien abrite une ménagerie (zoo) et de grandes serres ?",
    choices: ["A. Jardin des Plantes", "B. Parc Floral", "C. Jardin d'Acclimatation", "D. Parc de Sceaux"],
    answer: "A",
    explanation: "Le Jardin des Plantes est le grand jardin botanique de Paris et abrite la Ménagerie ainsi que des serres.",
    echo: "Un monde vivant gardé au cœur du minéral.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Il est lié au Muséum national d'Histoire naturelle."
  },
  {
    id: "Q100",
    question: "Quel projet de transport métropolitain est associé à de nouvelles lignes automatiques autour de Paris ?",
    choices: ["A. Grand Paris Express", "B. Métro RER A", "C. Tramway T1", "D. Ligne 1 historique"],
    answer: "A",
    explanation: "Le Grand Paris Express est un projet de nouvelles lignes de métro autour de Paris pour mieux relier la métropole.",
    echo: "La ville élargit son cercle, lentement.",
    level: 1,
    category: "XXe siècle",
    hint: "On parle de nouvelles lignes en rocade autour de Paris."
  },
  {
    id: "Q101",
    question: "Quel monument parisien abrite la Sainte-Chapelle ?",
    choices: ["A. Le Palais de Justice (Île de la Cité)", "B. Le Panthéon", "C. Les Invalides", "D. Le Grand Palais"],
    answer: "A",
    explanation: "La Sainte-Chapelle se trouve au sein de l'ancien palais royal de la Cité, aujourd'hui intégré au Palais de Justice, sur l'Île de la Cité.",
    echo: "La lumière devient pierre, puis vitrail.",
    level: 1,
    category: "Moyen Âge",
    hint: "Sur l'Île de la Cité, près de Notre-Dame."
  },
  {
    id: "Q102",
    question: "Dans quel musée parisien peut-on voir les grandes \"Nymphéas\" de Claude Monet ?",
    choices: ["A. Musée du Louvre", "B. Musée de l'Orangerie", "C. Musée Rodin", "D. Centre Pompidou"],
    answer: "B",
    explanation: "Les \"Nymphéas\" de Monet sont présentés dans deux salles ovales spécialement conçues au musée de l'Orangerie, dans le jardin des Tuileries.",
    echo: "Deux ovales de silence, et l'eau se met à respirer.",
    level: 1,
    category: "Art & Lettres",
    hint: "C'est près de la place de la Concorde."
  },
  {
    id: "Q103",
    question: "Quel monument de Paris est surnommé \"la Dame de fer\" ?",
    choices: ["A. La tour Saint-Jacques", "B. La tour Eiffel", "C. La tour Montparnasse", "D. La Grande Arche"],
    answer: "B",
    explanation: "La tour Eiffel, construite pour l'Exposition universelle de 1889, est souvent appelée \"la Dame de fer\" en raison de sa structure métallique.",
    echo: "Un squelette de métal, devenu un repère tendre.",
    level: 1,
    category: "Belle Époque",
    hint: "Elle domine le Champ-de-Mars."
  },
  {
    id: "Q104",
    question: "Quel grand boulevard mène directement à l'Opéra Garnier depuis la place de la Madeleine ?",
    choices: ["A. Boulevard Haussmann", "B. Boulevard Saint-Michel", "C. Boulevard Voltaire", "D. Boulevard de Sébastopol"],
    answer: "A",
    explanation: "Le boulevard Haussmann, percé au XIXe siècle, relie notamment le secteur de la Madeleine à l'Opéra et traverse le quartier des grands magasins.",
    echo: "Une artère droite où la ville se met en scène.",
    level: 1,
    category: "XIXe siècle",
    hint: "On y trouve les grands magasins."
  },
  {
    id: "Q105",
    question: "Quel monument parisien porte la flamme en hommage à la Liberté, près du pont de l'Alma ?",
    choices: ["A. La Colonne de Juillet", "B. La Flamme de la Liberté", "C. Le Génie de la Bastille", "D. La Statue de Jeanne d'Arc"],
    answer: "B",
    explanation: "La Flamme de la Liberté est une réplique de la flamme de la Statue de la Liberté, installée près du pont de l'Alma.",
    echo: "Une flamme immobile qui attire les mémoires.",
    level: 1,
    category: "Repères",
    hint: "À deux pas du pont de l'Alma."
  },
  {
    id: "Q106",
    question: "Quel musée parisien est installé dans un ancien palais, l'Hôtel Salé, dans le Marais ?",
    choices: ["A. Musée Picasso", "B. Musée de l'Orangerie", "C. Musée Guimet", "D. Musée Marmottan Monet"],
    answer: "A",
    explanation: "Le musée national Picasso-Paris est installé dans l'Hôtel Salé, un hôtel particulier du XVIIe siècle situé dans le Marais.",
    echo: "Un génie moderne, logé dans une maison ancienne.",
    level: 1,
    category: "Art & Lettres",
    hint: "Dans le 3e arrondissement, quartier du Marais."
  },
  {
    id: "Q107",
    question: "Quelle place parisienne est connue pour sa statue centrale et ses grandes manifestations ?",
    choices: ["A. Place des Vosges", "B. Place de la République", "C. Place Dauphine", "D. Place du Palais-Royal"],
    answer: "B",
    explanation: "La place de la République est un grand carrefour parisien, souvent lieu de rassemblements et de manifestations, dominé par une statue de Marianne.",
    echo: "Une place comme un poumon, quand la ville parle.",
    level: 1,
    category: "Repères",
    hint: "Entre les 3e, 10e et 11e arrondissements."
  },
  {
    id: "Q108",
    question: "Quel musée parisien est dédié à Auguste Rodin et à ses sculptures ?",
    choices: ["A. Musée Rodin", "B. Musée Maillol", "C. Musée d'Art Moderne", "D. Musée de Cluny"],
    answer: "A",
    explanation: "Le musée Rodin présente de nombreuses œuvres d'Auguste Rodin, dont \"Le Penseur\", dans l'hôtel Biron et ses jardins.",
    echo: "Le bronze pense, et le jardin écoute.",
    level: 1,
    category: "Art & Lettres",
    hint: "Près des Invalides, rive gauche."
  },
  {
    id: "Q109",
    question: "Quel est le nom de l'arc monumental situé au centre de la place de l'Étoile ?",
    choices: ["A. Arc de Triomphe", "B. Arc de la Défense", "C. Arc du Carrousel", "D. Porte Saint-Martin"],
    answer: "A",
    explanation: "L'Arc de Triomphe, commandé par Napoléon Ier, se trouve au centre de la place Charles-de-Gaulle (place de l'Étoile).",
    echo: "Un cercle de routes, une pierre qui commande le regard.",
    level: 1,
    category: "XIXe siècle",
    hint: "Au sommet des Champs-Élysées."
  },
  {
    id: "Q110",
    question: "Quel monument parisien est célèbre pour sa grande coupole et son pendule de Foucault ?",
    choices: ["A. Le Panthéon", "B. La Madeleine", "C. Saint-Eustache", "D. Saint-Germain-des-Prés"],
    answer: "A",
    explanation: "Le Panthéon, sur la montagne Sainte-Geneviève, a accueilli l'expérience du pendule de Foucault et abrite des sépultures de grandes figures françaises.",
    echo: "Sous la coupole, la Terre avoue qu'elle tourne.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Dans le 5e arrondissement."
  },
  {
    id: "Q111",
    question: "Quel est le nom de la grande place parisienne bordée d'arcades, au cœur du Marais ?",
    choices: ["A. Place des Vosges", "B. Place Vendôme", "C. Place de la Concorde", "D. Place Saint-Sulpice"],
    answer: "A",
    explanation: "La place des Vosges, construite au début du XVIIe siècle, est une place à arcades emblématique du Marais.",
    echo: "Un carré parfait, où le temps ralentit.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Elle se trouve près de la maison de Victor Hugo."
  },
  {
    id: "Q112",
    question: "Quel musée parisien est consacré au Moyen Âge et aux thermes gallo-romains ?",
    choices: ["A. Musée de Cluny", "B. Musée Carnavalet", "C. Musée de l'Armée", "D. Musée Jacquemart-André"],
    answer: "A",
    explanation: "Le musée de Cluny (Musée national du Moyen Âge) occupe un hôtel médiéval et des vestiges de thermes gallo-romains.",
    echo: "Des siècles empilés dans une même cour.",
    level: 1,
    category: "Moyen Âge",
    hint: "Rive gauche, près du boulevard Saint-Michel."
  },
  {
    id: "Q113",
    question: "Quelle grande rue parisienne longe le Louvre et traverse le centre sur la rive droite ?",
    choices: ["A. Rue de Rivoli", "B. Rue Mouffetard", "C. Rue Lepic", "D. Rue Daguerre"],
    answer: "A",
    explanation: "La rue de Rivoli longe le Louvre et les Tuileries, et s'étire vers l'est. Ses arcades sont un repère du centre de Paris.",
    echo: "Une rue comme une galerie, entre pierre et vitrines.",
    level: 1,
    category: "Repères",
    hint: "Elle longe les Tuileries et le Louvre."
  },
  {
    id: "Q114",
    question: "Quel monument parisien est un grand centre scientifique et de culture arabe, avec une façade à moucharabiehs ?",
    choices: ["A. Institut du Monde Arabe", "B. Maison de la Radio", "C. Palais de Tokyo", "D. Musée Guimet"],
    answer: "A",
    explanation: "L'Institut du Monde Arabe, conçu notamment par Jean Nouvel, est connu pour sa façade équipée de motifs inspirés des moucharabiehs.",
    echo: "La lumière se filtre, et la ville apprend d'autres rythmes.",
    level: 1,
    category: "XXe siècle",
    hint: "Sur les quais, près de Jussieu."
  },
  {
    id: "Q115",
    question: "Quel pont parisien est célèbre pour ses cadenas d'amour (aujourd'hui retirés) et sa vue sur l'Île de la Cité ?",
    choices: ["A. Pont des Arts", "B. Pont Mirabeau", "C. Pont de Bir-Hakeim", "D. Pont de Sully"],
    answer: "A",
    explanation: "Le pont des Arts a longtemps porté des cadenas d'amour, retirés pour préserver sa structure. C'est un pont piéton avec une vue emblématique sur la Seine.",
    echo: "Les promesses pèsent, la Seine emporte le reste.",
    level: 1,
    category: "Paris Secret",
    hint: "Piéton, entre le Louvre et l'Institut de France."
  },
  {
    id: "Q116",
    question: "Quel jardin parisien est connu pour sa grande roue de petits voiliers sur un bassin ?",
    choices: ["A. Jardin du Luxembourg", "B. Parc Monceau", "C. Parc André Citroën", "D. Square du Temple"],
    answer: "A",
    explanation: "Le jardin du Luxembourg est célèbre pour son grand bassin où les enfants font naviguer des bateaux miniatures, et pour ses statues et allées.",
    echo: "De petites voiles pour apprendre le vent.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Dans le 6e arrondissement."
  },
  {
    id: "Q117",
    question: "Quelle grande bibliothèque historique de Paris se trouve près du Panthéon et a une salle de lecture spectaculaire ?",
    choices: ["A. Bibliothèque Sainte-Geneviève", "B. Bibliothèque Mazarine", "C. Bibliothèque de l'Arsenal", "D. Bibliothèque François-Mitterrand"],
    answer: "A",
    explanation: "La bibliothèque Sainte-Geneviève, au 5e arrondissement, est connue pour sa grande salle de lecture du XIXe siècle.",
    echo: "Un vaisseau de livres, éclairé comme une nef.",
    level: 1,
    category: "XIXe siècle",
    hint: "Face au Panthéon."
  },
  {
    id: "Q118",
    question: "Quel monument parisien est une colonne surmontée d'un génie, sur la place de la Bastille ?",
    choices: ["A. Colonne de Juillet", "B. Colonne Vendôme", "C. Obélisque de Louxor", "D. Colonne Morris"],
    answer: "A",
    explanation: "La colonne de Juillet commémore les Trois Glorieuses (1830) et se dresse au centre de la place de la Bastille, surmontée du Génie de la Liberté.",
    echo: "Une colonne pour des jours de feu, devenue repère quotidien.",
    level: 1,
    category: "XIXe siècle",
    hint: "Place de la Bastille."
  },
  {
    id: "Q119",
    question: "Quel musée parisien présente l'histoire des arts et métiers, avec une grande collection d'inventions ?",
    choices: ["A. Musée des Arts et Métiers", "B. Palais de la Découverte", "C. Musée Grévin", "D. Cité de l'Architecture"],
    answer: "A",
    explanation: "Le musée des Arts et Métiers conserve des objets scientifiques et techniques, dont le pendule de Foucault et des prototypes d'inventions.",
    echo: "Des machines anciennes qui font encore rêver le futur.",
    level: 1,
    category: "XXe siècle",
    hint: "Dans le 3e arrondissement, près de Réaumur-Sébastopol."
  },
  {
    id: "Q120",
    question: "Quelle station de métro est connue pour ses décors Art nouveau et ses escaliers en colimaçon près de Montmartre ?",
    choices: ["A. Abbesses", "B. Châtelet", "C. Nation", "D. Trocadéro"],
    answer: "A",
    explanation: "La station Abbesses, à Montmartre, est souvent citée pour ses décors et sa grande profondeur, avec un accès par escalier ou ascenseur.",
    echo: "Un puits de métro qui débouche sur un village.",
    level: 1,
    category: "Paris Secret",
    hint: "Sur la ligne 12, à Montmartre."
  },
  {
    id: "Q121",
    question: "Quel est le nom de la grande esplanade parisienne entre le Louvre et l'Arc de Triomphe du Carrousel ?",
    choices: ["A. Cour Carrée", "B. Place du Carrousel", "C. Place de la Nation", "D. Place de Clichy"],
    answer: "B",
    explanation: "La place du Carrousel se situe entre le Louvre et le jardin des Tuileries, proche de l'Arc de Triomphe du Carrousel.",
    echo: "Un seuil où le palais devient jardin.",
    level: 1,
    category: "Repères",
    hint: "Juste à côté de la pyramide du Louvre."
  },
  {
    id: "Q122",
    question: "Quel musée parisien est consacré aux civilisations asiatiques et se trouve près du Trocadéro ?",
    choices: ["A. Musée Guimet", "B. Musée du Quai Branly", "C. Musée de l'Orangerie", "D. Musée Zadkine"],
    answer: "A",
    explanation: "Le musée Guimet est un musée consacré aux arts asiatiques, installé à Paris depuis la fin du XIXe siècle.",
    echo: "Des mondes lointains, rassemblés dans une même salle.",
    level: 1,
    category: "Art & Lettres",
    hint: "Dans le 16e arrondissement, près d'Iéna."
  },
  {
    id: "Q123",
    question: "Quel marché parisien, très ancien, se trouve dans le Marais et est connu pour ses stands de cuisine ?",
    choices: ["A. Marché des Enfants Rouges", "B. Marché d'Aligre", "C. Marché Raspail", "D. Marché Beauvau"],
    answer: "A",
    explanation: "Le marché des Enfants Rouges, créé au XVIIe siècle, est un marché couvert du Marais, connu pour ses stands de restauration.",
    echo: "Une halle où le monde tient dans une assiette.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Dans le 3e arrondissement."
  },
  {
    id: "Q124",
    question: "Quel monument parisien est un palais d'exposition avec une grande verrière, près des Champs-Élysées ?",
    choices: ["A. Grand Palais", "B. Palais Brongniart", "C. Hôtel de Ville", "D. Institut de France"],
    answer: "A",
    explanation: "Le Grand Palais, construit pour l'Exposition universelle de 1900, est célèbre pour sa grande nef en verre et en métal.",
    echo: "Sous le verre, la ville se fait cathédrale d'exposition.",
    level: 1,
    category: "Belle Époque",
    hint: "Avec le Petit Palais, près du pont Alexandre-III."
  },
  {
    id: "Q125",
    question: "Quel est le nom du quartier parisien autour de la rue Mouffetard, connu pour son marché et son ambiance ?",
    choices: ["A. Quartier Latin", "B. Mouffetard / Mouffe", "C. Batignolles", "D. Passy"],
    answer: "B",
    explanation: "La rue Mouffetard est une des rues les plus anciennes de Paris, connue pour son marché et son ambiance populaire sur la montagne Sainte-Geneviève.",
    echo: "Une rue qui sent le pain, le fromage, et le vivant.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Dans le 5e arrondissement."
  },
  {
    id: "Q126",
    question: "Quel est le nom de l'église parisienne célèbre pour sa façade classique et son grand orgue, place de la Madeleine ?",
    choices: ["A. Église Saint-Eustache", "B. Église de la Madeleine", "C. Église Saint-Roch", "D. Église Saint-Augustin"],
    answer: "B",
    explanation: "L'église de la Madeleine, au style néoclassique, se dresse place de la Madeleine et ressemble à un temple antique.",
    echo: "Un temple posé au milieu des avenues.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Près des grands magasins et de l'Opéra."
  },
  {
    id: "Q127",
    question: "Quel monument parisien est un ancien marché devenu un grand centre commercial et culturel au cœur de la ville ?",
    choices: ["A. Les Halles", "B. La Villette", "C. Bercy Village", "D. Beaugrenelle"],
    answer: "A",
    explanation: "Le quartier des Halles a longtemps accueilli le grand marché de Paris, avant d'être transformé. Aujourd'hui, c'est un centre majeur de circulation et de commerces.",
    echo: "Sous la ville, les flux continuent.",
    level: 1,
    category: "Repères",
    hint: "Au centre, près de Châtelet."
  },
  {
    id: "Q128",
    question: "Quel musée parisien conserve la \"Vénus de Milo\" et la \"Victoire de Samothrace\" ?",
    choices: ["A. Musée du Louvre", "B. Musée d'Orsay", "C. Musée de l'Orangerie", "D. Musée du Quai Branly"],
    answer: "A",
    explanation: "Le musée du Louvre conserve des œuvres majeures de l'Antiquité, dont la Vénus de Milo et la Victoire de Samothrace.",
    echo: "Des corps de pierre qui traversent les empires.",
    level: 1,
    category: "Art & Lettres",
    hint: "Le grand musée au bord de la Seine."
  },
  {
    id: "Q129",
    question: "Quel est le nom de la grande avenue plantée qui relie la place de la Nation à la place de la Bastille ?",
    choices: ["A. Boulevard Saint-Germain", "B. Boulevard Voltaire", "C. Avenue Daumesnil", "D. Rue de Belleville"],
    answer: "B",
    explanation: "Le boulevard Voltaire relie notamment la place de la République à la place de la Nation, en traversant l'est parisien.",
    echo: "Une ligne tendue, entre places et révoltes.",
    level: 1,
    category: "XIXe siècle",
    hint: "Il porte le nom d'un philosophe."
  },
  {
    id: "Q130",
    question: "Quelle promenade surélevée, ancienne voie ferrée, traverse l'est de Paris ?",
    choices: ["A. Coulée verte René-Dumont", "B. Promenade des Anglais", "C. Petite Ceinture (ouverte partout)", "D. Voie Georges-Pompidou"],
    answer: "A",
    explanation: "La Coulée verte René-Dumont (promenade plantée) suit une ancienne ligne ferroviaire et offre une balade surélevée dans l'est parisien.",
    echo: "Marcher au-dessus du bruit, sur une vieille ligne endormie.",
    level: 1,
    category: "Paris Secret",
    hint: "Départ près de Bastille, vers l'est."
  },
  {
    id: "Q131",
    question: "Quel monument parisien est une grande salle de concert moderne, au parc de la Villette ?",
    choices: ["A. Philharmonie de Paris", "B. Salle Pleyel", "C. Opéra Garnier", "D. Théâtre de l'Odéon"],
    answer: "A",
    explanation: "La Philharmonie de Paris, dans le parc de la Villette, est une grande salle de concert contemporaine consacrée notamment à la musique symphonique.",
    echo: "Un vaisseau pour le son, posé dans le parc.",
    level: 1,
    category: "XXe siècle",
    hint: "Dans le 19e arrondissement."
  },
  {
    id: "Q132",
    question: "Quel est le nom du canal parisien connu pour ses écluses et ses passerelles, près de République ?",
    choices: ["A. Canal Saint-Martin", "B. Canal de l'Ourcq", "C. Canal Saint-Denis", "D. Bièvre"],
    answer: "A",
    explanation: "Le canal Saint-Martin est célèbre pour ses écluses, ses passerelles et ses quais, et relie le bassin de la Villette à la Seine.",
    echo: "Une eau lente pour calmer la ville rapide.",
    level: 1,
    category: "XIXe siècle",
    hint: "Il passe près de République et du 10e."
  },
  {
    id: "Q133",
    question: "Quel monument parisien est une grande salle ovale où se tient une institution littéraire nationale ?",
    choices: ["A. Institut de France", "B. Palais Bourbon", "C. Hôtel de Ville", "D. Palais de Justice"],
    answer: "A",
    explanation: "L'Institut de France, sur les quais, abrite plusieurs académies, dont l'Académie française.",
    echo: "Des mots sous coupole, comme des lois invisibles.",
    level: 1,
    category: "Art & Lettres",
    hint: "En face du Louvre, sur l'autre rive."
  },
  {
    id: "Q134",
    question: "Quel est le nom du musée de cire parisien où l'on voit des statues de célébrités ?",
    choices: ["A. Musée Grévin", "B. Musée Jacquemart-André", "C. Musée Marmottan Monet", "D. Musée Bourdelle"],
    answer: "A",
    explanation: "Le musée Grévin est un musée de cire où sont représentées des personnalités historiques et contemporaines.",
    echo: "Des visages immobiles, et pourtant familiers.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Près des Grands Boulevards."
  },
  {
    id: "Q135",
    question: "Quel monument parisien est une grande tour en fer qui se trouve près du Champ-de-Mars ?",
    choices: ["A. Tour Eiffel", "B. Tour Saint-Jacques", "C. Tour Montparnasse", "D. Tour First"],
    answer: "A",
    explanation: "La tour Eiffel se situe au bord du Champ-de-Mars et est l'un des repères majeurs de la ville.",
    echo: "Un point fixe pour se retrouver, même quand on se perd.",
    level: 1,
    category: "Repères",
    hint: "Dans le 7e arrondissement."
  },
  {
    id: "Q136",
    question: "Quel grand cimetière parisien se trouve sur la colline de Montmartre ?",
    choices: ["A. Cimetière de Passy", "B. Cimetière de Montmartre", "C. Cimetière du Père-Lachaise", "D. Cimetière de Bagneux"],
    answer: "B",
    explanation: "Le cimetière de Montmartre se situe au pied de la butte, dans une ancienne carrière. On y trouve des tombes de nombreuses personnalités.",
    echo: "Un jardin de pierres, sous la butte des artistes.",
    level: 1,
    category: "Paris Secret",
    hint: "Dans le 18e arrondissement."
  },
  {
    id: "Q137",
    question: "Quel musée parisien est dédié à l'histoire de Paris et se trouve dans le Marais ?",
    choices: ["A. Musée Carnavalet", "B. Musée de Cluny", "C. Musée de l'Air et de l'Espace", "D. Musée de l'Orangerie"],
    answer: "A",
    explanation: "Le musée Carnavalet présente l'histoire de Paris, de ses origines à aujourd'hui, dans des hôtels particuliers du Marais.",
    echo: "La ville raconte sa propre histoire, pièce par pièce.",
    level: 1,
    category: "Art & Lettres",
    hint: "Dans le 3e arrondissement."
  },
  {
    id: "Q138",
    question: "Quel est le nom de la grande mosquée de Paris située près du Jardin des Plantes ?",
    choices: ["A. Grande Mosquée de Paris", "B. Mosquée de Saint-Denis", "C. Mosquée de la Défense", "D. Mosquée de Montparnasse"],
    answer: "A",
    explanation: "La Grande Mosquée de Paris, inaugurée dans l'entre-deux-guerres, se situe près du Jardin des Plantes et comprend un jardin intérieur et un salon de thé.",
    echo: "Un patio calme, à deux pas des rues bruyantes.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Dans le 5e arrondissement."
  },
  {
    id: "Q139",
    question: "Quel est le nom du grand bâtiment parisien où siège l'Assemblée nationale ?",
    choices: ["A. Palais Bourbon", "B. Palais du Luxembourg", "C. Élysée", "D. Palais de Justice"],
    answer: "A",
    explanation: "L'Assemblée nationale siège au Palais Bourbon, sur la rive gauche de la Seine.",
    echo: "Un hémicycle, et des siècles de débats.",
    level: 1,
    category: "Repères",
    hint: "Face à la place de la Concorde, de l'autre côté du fleuve."
  },
  {
    id: "Q140",
    question: "Quel jardin parisien se trouve derrière le Palais Royal, avec ses colonnes rayées et ses galeries ?",
    choices: ["A. Jardin du Palais-Royal", "B. Jardin des Plantes", "C. Parc Monceau", "D. Square des Batignolles"],
    answer: "A",
    explanation: "Le jardin du Palais-Royal est un jardin central entouré de galeries. Dans sa cour, on trouve les célèbres colonnes de Buren.",
    echo: "Un jardin secret au cœur du pouvoir.",
    level: 1,
    category: "Paris Secret",
    hint: "Près du Louvre."
  },
  {
    id: "Q141",
    question: "Quel monument parisien est une porte monumentale dédiée à Saint-Denis, sur les Grands Boulevards ?",
    choices: ["A. Porte Saint-Denis", "B. Porte Saint-Martin", "C. Arc du Carrousel", "D. Barrière d'Enfer"],
    answer: "A",
    explanation: "La porte Saint-Denis est un arc monumental du XVIIe siècle situé sur les Grands Boulevards.",
    echo: "Une porte qui n'ouvre plus la ville, mais ouvre le souvenir.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Sur les Grands Boulevards, 10e arrondissement."
  },
  {
    id: "Q142",
    question: "Quel est le nom du célèbre cabaret de Montmartre associé aux chansonniers et aux artistes ?",
    choices: ["A. Le Lapin Agile", "B. Le Lido", "C. Le Procope", "D. Le Train Bleu"],
    answer: "A",
    explanation: "Le Lapin Agile est un cabaret historique de Montmartre, associé à la vie artistique du quartier.",
    echo: "Une petite scène où la nuit devient légende.",
    level: 1,
    category: "Paris Secret",
    hint: "Sur la butte Montmartre."
  },
  {
    id: "Q143",
    question: "Quel est le nom de la grande salle de concerts située avenue Montaigne, connue pour son acoustique ?",
    choices: ["A. Théâtre des Champs-Élysées", "B. Salle Pleyel", "C. Olympia", "D. Zénith de Paris"],
    answer: "B",
    explanation: "La salle Pleyel est une salle de concerts classique emblématique du 8e arrondissement.",
    echo: "Une salle où le son a sa propre architecture.",
    level: 1,
    category: "Art & Lettres",
    hint: "Dans le 8e, proche des Champs-Élysées."
  },
  {
    id: "Q144",
    question: "Quel monument parisien est un théâtre de musique emblématique situé boulevard des Capucines ?",
    choices: ["A. Olympia", "B. Zénith", "C. Opéra Bastille", "D. Théâtre Mogador"],
    answer: "A",
    explanation: "L'Olympia est une salle de spectacle historique de Paris, associée à de nombreux artistes de la chanson.",
    echo: "Une scène, et des voix qui restent.",
    level: 1,
    category: "XXe siècle",
    hint: "Entre Madeleine et Opéra."
  },
  {
    id: "Q145",
    question: "Quel est le nom du palais parisien où siège le Sénat ?",
    choices: ["A. Palais du Luxembourg", "B. Palais Bourbon", "C. Palais de Chaillot", "D. Palais Brongniart"],
    answer: "A",
    explanation: "Le Sénat siège au palais du Luxembourg, attenant au jardin du Luxembourg.",
    echo: "La loi à l'ombre des marronniers.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Dans le 6e arrondissement."
  },
  {
    id: "Q146",
    question: "Quel est le nom du musée parisien consacré à l'histoire naturelle, lié au Jardin des Plantes ?",
    choices: ["A. Muséum national d'Histoire naturelle", "B. Musée d'Orsay", "C. Musée de l'Armée", "D. Musée Guimet"],
    answer: "A",
    explanation: "Le Muséum national d'Histoire naturelle est lié au Jardin des Plantes et regroupe plusieurs galeries scientifiques.",
    echo: "La ville garde aussi les lois du vivant.",
    level: 1,
    category: "XXe siècle",
    hint: "Autour du Jardin des Plantes."
  },
  {
    id: "Q147",
    question: "Quel pont parisien est reconnaissable à ses grandes arches métalliques et à sa vue sur la tour Eiffel ?",
    choices: ["A. Pont de Bir-Hakeim", "B. Pont Neuf", "C. Pont Marie", "D. Pont Alexandre-III"],
    answer: "A",
    explanation: "Le pont de Bir-Hakeim, avec sa structure métallique et son niveau supérieur (métro), est un repère très photographié.",
    echo: "Deux étages, deux vitesses, un même fleuve.",
    level: 1,
    category: "XXe siècle",
    hint: "Entre 15e et 16e, près de l'île aux Cygnes."
  },
  {
    id: "Q148",
    question: "Quel est le nom de la statue qui est l'emblème officiel de Paris, souvent représentée sur les armoiries ?",
    choices: ["A. Marianne", "B. La nef (le bateau)", "C. La tour Eiffel", "D. Le coq"],
    answer: "B",
    explanation: "L'emblème traditionnel de Paris est une nef (bateau), visible sur les armoiries de la ville et liée aux bateliers de la Seine.",
    echo: "La ville flotte, même quand tout bouge.",
    level: 1,
    category: "Origines",
    hint: "On la voit sur le blason de Paris."
  },
  {
    id: "Q149",
    question: "Quel est le nom de la colline parisienne qui a donné son nom à une célèbre basilique blanche ?",
    choices: ["A. Butte Montmartre", "B. Mont Valérien", "C. Montparnasse", "D. Belleville"],
    answer: "A",
    explanation: "La butte Montmartre est la colline du nord de Paris, dominée par la basilique du Sacré-Cœur.",
    echo: "Une butte, et la ville entière en contrebas.",
    level: 1,
    category: "Repères",
    hint: "Au nord de Paris."
  },
  {
    id: "Q150",
    question: "Quel est le nom du grand marché populaire de Paris situé près de la place de la Nation ?",
    choices: ["A. Marché d'Aligre", "B. Marché Raspail", "C. Marché Bastille", "D. Marché Saint-Quentin"],
    answer: "A",
    explanation: "Le marché d'Aligre (quartier du 12e) est un marché populaire connu pour son ambiance et sa halle (marché couvert).",
    echo: "La ville se reconnaît dans ses étals.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Dans le 12e, quartier Aligre."
  },
  {
    id: "Q151",
    question: "Quel monument parisien est une grande fontaine surmontée d'ailes, au bout du jardin des Tuileries ?",
    choices: ["A. Fontaine Saint-Michel", "B. Fontaine des Mers", "C. Fontaine des Fleuves (Concorde)", "D. Fontaine de la Rotonde"],
    answer: "C",
    explanation: "La place de la Concorde possède deux grandes fontaines monumentales du XIXe siècle, dédiées notamment aux fleuves et aux mers.",
    echo: "L'eau écrit des cercles là où l'histoire a tranché.",
    level: 1,
    category: "XIXe siècle",
    hint: "Sur la grande place entre les Tuileries et les Champs-Élysées."
  },
  {
    id: "Q152",
    question: "Quel est le nom de la grande avenue parisienne où se trouvent de nombreuses ambassades et hôtels particuliers ?",
    choices: ["A. Rue de Rivoli", "B. Avenue Foch", "C. Rue du Faubourg Saint-Honoré", "D. Boulevard de Belleville"],
    answer: "C",
    explanation: "La rue du Faubourg Saint-Honoré est connue pour ses ambassades, ses hôtels particuliers, ses boutiques et la proximité de l'Élysée.",
    echo: "Une rue où les façades gardent des secrets.",
    level: 1,
    category: "Repères",
    hint: "Dans le 8e arrondissement."
  },
  {
    id: "Q153",
    question: "Quel musée parisien se situe dans un ancien atelier et présente les sculptures d'Antoine Bourdelle ?",
    choices: ["A. Musée Bourdelle", "B. Musée Zadkine", "C. Musée Rodin", "D. Petit Palais"],
    answer: "A",
    explanation: "Le musée Bourdelle, près de Montparnasse, occupe l'ancien atelier du sculpteur Antoine Bourdelle.",
    echo: "Un atelier figé, comme si les mains allaient revenir.",
    level: 1,
    category: "Art & Lettres",
    hint: "Dans le 15e arrondissement."
  },
  {
    id: "Q154",
    question: "Quel est le nom de la grande place parisienne où se trouve l'Opéra Bastille ?",
    choices: ["A. Place de la République", "B. Place de la Bastille", "C. Place d'Italie", "D. Place Denfert-Rochereau"],
    answer: "B",
    explanation: "L'Opéra Bastille se situe place de la Bastille, un lieu central de l'histoire révolutionnaire et des grands axes de l'est parisien.",
    echo: "Une place où l'histoire change de costume, mais pas de souffle.",
    level: 1,
    category: "Repères",
    hint: "Entre le 4e, 11e et 12e."
  },
  {
    id: "Q155",
    question: "Quel est le nom de la grande artère commerçante du nord de Paris, célèbre pour ses tissus et ses magasins, près de Barbès ?",
    choices: ["A. Rue de Belleville", "B. Boulevard de Strasbourg", "C. Boulevard de Rochechouart", "D. Rue du Faubourg Saint-Denis"],
    answer: "C",
    explanation: "Le boulevard de Rochechouart, au pied de Montmartre, est un axe très vivant, notamment vers Barbès et Pigalle.",
    echo: "Au pied de la butte, la ville accélère.",
    level: 1,
    category: "Gastronomie & Vie",
    hint: "Entre Barbès et Pigalle."
  },
  {
    id: "Q156",
    question: "Quel monument parisien est une rotonde monumentale marquant l'entrée sud de la ville, près du parc Montsouris ?",
    choices: ["A. Barrière d'Enfer (place Denfert-Rochereau)", "B. Porte de Vincennes", "C. Porte Maillot", "D. Porte de Saint-Cloud"],
    answer: "A",
    explanation: "Les pavillons de Ledoux, dits barrière d'Enfer, se trouvent place Denfert-Rochereau et témoignent des anciennes barrières de Paris.",
    echo: "Des portes qui comptaient la ville, avant qu'elle déborde.",
    level: 1,
    category: "Renaissance & Classique",
    hint: "Au sud, près des Catacombes."
  },
  {
    id: "Q157",
    question: "Quel est le nom du grand centre d'art contemporain situé près de la Seine, face au Trocadéro ?",
    choices: ["A. Palais de Tokyo", "B. Musée de l'Orangerie", "C. Musée Grévin", "D. Musée de Cluny"],
    answer: "A",
    explanation: "Le Palais de Tokyo est un lieu majeur d'art contemporain à Paris, situé près du Trocadéro et des quais.",
    echo: "Un espace brut, pour des formes encore vivantes.",
    level: 1,
    category: "XXe siècle",
    hint: "Dans le 16e arrondissement."
  },
  {
    id: "Q158",
    question: "Quel pont parisien est célèbre dans un poème d'Apollinaire : \"Sous le pont…\" ?",
    choices: ["A. Pont Mirabeau", "B. Pont Alexandre-III", "C. Pont Neuf", "D. Pont des Arts"],
    answer: "A",
    explanation: "Le pont Mirabeau est rendu célèbre par le poème d'Apollinaire. Il traverse la Seine entre les 15e et 16e arrondissements.",
    echo: "L'amour passe, l'eau passe, et pourtant on reste.",
    level: 1,
    category: "Art & Lettres",
    hint: "Le poème commence par \"Sous le pont Mirabeau…\""
  },
  {
    id: "Q159",
    question: "Quel est le nom du quartier parisien connu pour ses petites ruelles en pente et ses vignes, autour de la rue Lepic ?",
    choices: ["A. Montmartre", "B. Le Marais", "C. La Défense", "D. Bercy"],
    answer: "A",
    explanation: "Montmartre est célèbre pour ses ruelles en pente, ses artistes, et le petit vignoble du Clos Montmartre.",
    echo: "Un village accroché à la ville.",
    level: 1,
    category: "Paris Secret",
    hint: "Au nord, autour du Sacré-Cœur."
  },
  {
    id: "Q160",
    question: "Quel est le nom du grand musée parisien consacré à l'architecture et au patrimoine, situé au palais de Chaillot ?",
    choices: ["A. Cité de l'architecture et du patrimoine", "B. Musée de l'Homme", "C. Musée Guimet", "D. Musée Marmottan Monet"],
    answer: "A",
    explanation: "La Cité de l'architecture et du patrimoine, au palais de Chaillot, présente l'histoire de l'architecture, des maquettes et des moulages.",
    echo: "Voir la ville, comme une idée en train de se construire.",
    level: 1,
    category: "Art & Lettres",
    hint: "Au Trocadéro, palais de Chaillot."
  }
];

// Helper functions
export function getQuestionsByLevel(level: 1 | 2 | 3 | 4 | 5): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter(q => q.level === level);
}

export function getQuestionsByCategory(category: string): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter(q => q.category === category);
}

export function getRandomQuestions(count: number, level?: number): QuizQuestion[] {
  let pool = level ? QUIZ_QUESTIONS.filter(q => q.level === level) : QUIZ_QUESTIONS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const CATEGORIES = [
  'Repères',
  'Origines',
  'Moyen Âge',
  'Renaissance & Classique',
  'Révolution',
  'XIXe siècle',
  'Belle Époque',
  'XXe siècle',
  'Art & Lettres',
  'Paris Secret',
  'Gastronomie & Vie'
];

export const LEVELS = {
  1: { name: 'FLÂNEUR', timer: 20, description: 'Basique, touriste curieux' },
  2: { name: 'HABITANT', timer: 15, description: 'Connaissance moyenne' },
  3: { name: 'INITIÉ', timer: 12, description: 'Culture solide' },
  4: { name: 'ÉRUDIT', timer: 10, description: 'Expertise historique' },
  5: { name: 'ARCHÉOLOGUE', timer: 8, description: 'Secrets et anecdotes rares' }
};
