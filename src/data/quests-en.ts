/**
 * EN quest content from C:\Users\echof\Desktop\ARCHé\translation english\english
 * Used when language is 'en' for Walks (lutece, 1789, table).
 */

const luteceImg = 'https://i.imgur.com/1uLhXial.jpeg';
const revolutionImg = 'https://i.imgur.com/iyCcmoSl.jpeg';
const tableImg = 'https://i.imgur.com/VtWPT2Ml.jpeg';

export interface QuestStopEN {
  name: string;
  googleMapsUrl: string;
  geste: string;
  nodeId?: string;
  coordinates?: { lat: number; lng: number };
}

export interface QueteDataEN {
  id: string;
  title: string;
  registre: string;
  texte: string[];
  duree: string;
  itineraireComplet: string;
  stops: QuestStopEN[];
  image: string;
}

function geste(text: string, gesture: string): string {
  return gesture ? `${text}\n\nGeste — ${gesture}` : text;
}

export const QUETES_DATA_EN: Record<string, QueteDataEN> = {
  lutece: {
    id: 'lutece',
    title: 'LUTETIA — ORIGIN',
    registre: 'Foundation · Gesture · Measure',
    texte: [
      "Before palaces, before façades, Paris was a solution. A place where water agrees to be crossed. A place where passage can be made to pay.",
      "Imagine the Seine without embankments: a wilder delta, islets, mud, variation. Île de la Cité is not a monument. It is a rare stability within movement. That is enough to found a world.",
      "The first intelligence of Paris is an intelligence of measure: measuring water, measuring roads, measuring flows. Then Rome arrives and imposes an axis, a spine: Rue Saint-Jacques. You can follow it as one follows an ancient truth—straight, ascending, insistent.",
      "This walk is short but deep. You cross the city as one crosses an origin. You do not look at Paris: you read it directly from the ground."
    ],
    duree: '≈ 1h30–2h',
    itineraireComplet: 'https://www.google.com/maps/dir/Parvis+Notre-Dame+-+Pl.+Jean-Paul+II,+Paris/Petit+Pont+-+Cardinal+Lustiger,+Quai+du+Marché+Neuf+-+Maurice+Grimaud,+Paris/4+Rue+de+la+Colombe,+75004+Paris/Rue+Saint-Jacques,+Paris/Pl.+du+Panthéon,+75005+Paris/Musée+de+Cluny+-+Musée+national+du+Moyen+Âge,+Place+Paul+Painlevé,+Paris/@48.8517265,2.3435555,16z/data=!3m1!4b1!4m38!4m37!1m5!1m1!1s0x47e671e19ff53a01:0x364022c7cc569f43!2m2!1d2.3479104!2d48.8530491!1m5!1m1!1s0x47e671e041334c2d:0x933470701899a80e!2m2!1d2.3470293!2d48.8525862!1m5!1m1!1s0x47e671e06718d7db:0x1b4122d699264426!2m2!1d2.350352!2d48.8534888!1m5!1m1!1s0x47e671e6e0622a55:0x8797435f2945e415!2m2!1d2.3429383!2d48.8437021!1m5!1m1!1s0x47e671e860951161:0x7052a6597c5e263d!2m2!1d2.3458986!2d48.8464115!1m5!1m1!1s0x47e671e6878b668d:0x6b97368686f345a5!2m2!1d2.3433608!2d48.8504351!3e2',
    stops: [
      { name: 'Parvis Notre-Dame — The Zero Point', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Parvis+Notre-Dame+-+Pl.+Jean-Paul+II,+Paris', geste: geste('You are at the center. Not symbolically—geometrically. All distances in France are measured from the plaque beneath your feet. But before being a center, this was a port. Boats docked here. The cathedral came later, on a site already useful. The sacred always settles on what works.', 'Find the zero-kilometer marker. Stand on it. You are at the origin of the roads.'), nodeId: 'lutece-1', coordinates: { lat: 48.853, lng: 2.3499 } },
      { name: 'Petit Pont — The First Crossing', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Petit+Pont+-+Cardinal+Lustiger,+Quai+du+Marché+Neuf+-+Maurice+Grimaud,+Paris', geste: geste('This is the oldest crossing point in Paris. It burned eleven times. Before stone, it was wood. And on the wood, houses. People lived above the water, in permanent risk. Stop at the middle of the bridge. Look at the water. It has always tried to reclaim this passage. The city has always rebuilt.', 'Remain motionless for one minute at the center. Feel the flow beneath you. The city begins with insistence.'), nodeId: 'lutece-2', coordinates: { lat: 48.8526, lng: 2.347 } },
      { name: 'Rue de la Colombe — The Invisible Wall', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=4+Rue+de+la+Colombe,+75004+Paris', geste: geste('This street follows the exact line of the Gallo-Roman wall. It no longer exists, but the city kept its shape. Look at the ground: darker stones trace the former rampart. Paris never completely destroys. It absorbs, covers, preserves reflexes.', 'Walk along the line. You follow a boundary no one defends anymore.'), nodeId: 'lutece-3', coordinates: { lat: 48.8535, lng: 2.3504 } },
      { name: 'Rue Saint-Jacques — The Roman Axis', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Rue+Saint-Jacques,+Paris', geste: geste('You enter the Cardo Maximus. The spine Rome planted in Gallic mud. This street existed before kings, before churches, before the name Paris itself. Walk slowly uphill. Do not look at shops. Look at the slope. This straight line climbing south is a two-thousand-year-old decision.', 'Walk in the middle of the street when possible. Feel the axis in your body. You move backward in time by ascending.'), nodeId: 'lutece-4', coordinates: { lat: 48.8464, lng: 2.3429 } },
      { name: 'Place du Panthéon — Measuring the Sky', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Pl.+du+Panthéon,+75005+Paris', geste: geste('Here, the city chose to align itself with an idea. Perspective, symmetry, the Panthéon at the end—this is no accident. It is geometry imposed upon the ground. In the 18th century, Paris was shaped to resemble what reason was thought to be. This square is belief turned into stone.', 'Stand exactly on the axis of Rue Soufflot. Look at the Panthéon. Someone wanted you to stand precisely here.'), nodeId: 'lutece-5', coordinates: { lat: 48.8462, lng: 2.3464 } },
      { name: 'Musée de Cluny — Continuity', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Musée+de+Cluny+-+Musée+national+du+Moyen+Âge,+Place+Paul+Painlevé,+Paris', geste: geste('If you enter, you close the loop. This place is built on Roman baths. The stones you see once warmed bodies two thousand years ago. Above them, a medieval residence. The city stacks itself. You are not visiting a museum. You are descending through layers.', 'If you do not enter, touch the outer wall. The stone is Roman. Your hand touches what the city chose not to erase.'), nodeId: 'lutece-6', coordinates: { lat: 48.8504, lng: 2.3434 } }
    ],
    image: luteceImg
  },
  '1789': {
    id: '1789',
    title: '1789 — DECISION',
    registre: 'Threshold · Passage · Reversal',
    texte: [
      "A revolution does not begin with an idea. It begins with a space that changes function.",
      "At the Palais-Royal, architecture produced an accident: arcades where one walks without purpose, cafés where one stays too long, printers releasing still-wet pages. A density of words, glances, rumors. Not a garden—a resonance chamber.",
      "Then comes the gesture. A man climbs onto a café table. A consumer object becomes a tribune. The private tips into the public. From that moment, something becomes irreversible.",
      "This walk follows that logic: incubation → trigger → propagation → institution. You move from the space where people speak to the space where they decide."
    ],
    duree: '≈ 2h–2h30',
    itineraireComplet: 'https://www.google.com/maps/dir/Jardin+du+Palais+Royal,+75001+Paris/Galerie+Montpensier,+75001+Paris/Rue+Saint-Honoré,+75001+Paris/230+Rue+de+Rivoli,+75001+Paris/Jardin+des+Tuileries,+75001+Paris/Place+de+la+Concorde,+75008+Paris/@48.8636,2.3277,15z/data=!3m1!4b1!4m38!4m37!1m5!1m1!1s0x47e66e1da38e76d5:0x7a1f8b3b3b3b3b3b!2m2!1d2.3377778!2d48.8638889!1m5!1m1!1s0x47e66e1da38e76d5:0x7a1f8b3b3b3b3b3b!2m2!1d2.3377778!2d48.8638889!1m5!1m1!1s0x47e66e1f5c0e0e0e:0x0e0e0e0e0e0e0e0e!2m2!1d2.3333333!2d48.8666667!1m5!1m1!1s0x47e66e1f5c0e0e0e:0x0e0e0e0e0e0e0e0e!2m2!1d2.3308333!2d48.8641667!1m5!1m1!1s0x47e66e2e0e0e0e0e:0x0e0e0e0e0e0e0e0e!2m2!1d2.3275!2d48.8636111!1m5!1m1!1s0x47e66e2e0e0e0e0e:0x0e0e0e0e0e0e0e0e!2m2!1d2.3213889!2d48.8656111!3e2',
    stops: [
      { name: 'Palais-Royal Garden — Resonance Chamber', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jardin+du+Palais+Royal,+75001+Paris', geste: geste('Enter by any gate. Walk the arcades before the center. Feel how the space holds you. In the 18th century, police could not enter here. One could speak. Print. Conspire in the open.', 'Sit for a few minutes. Watch people pass. Imagine ten times the crowd, ten times the noise, no law.'), nodeId: '1789-1', coordinates: { lat: 48.8639, lng: 2.3378 } },
      { name: 'Galerie Montpensier — Café de Foy', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Galerie+Montpensier,+75001+Paris', geste: geste('The café is gone. The place remains. On July 12, 1789, Camille Desmoulins climbed onto a table and spoke. Two days later, the Bastille fell.', 'Stand approximately where it happened. Imagine the voice filling the arcades.'), nodeId: '1789-2', coordinates: { lat: 48.8639, lng: 2.3378 } },
      { name: 'Exit to Rue Saint-Honoré — Propagation', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Rue+Saint-Honoré,+75001+Paris', geste: geste('You exit the closed rectangle into open streets. Rumor accelerates. Speech becomes movement.', 'Walk fast for two minutes. Do not look at shops. Feel acceleration.'), nodeId: '1789-3', coordinates: { lat: 48.866, lng: 2.333 } },
      { name: '230 Rue de Rivoli — The Lost Manège', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=230+Rue+de+Rivoli,+75001+Paris', geste: geste('Nothing remains. Yet decisions were made here. Democracy was once noisy, cramped, inaudible.', 'Read the plaque. Stand before the void. Decisions remain even when places vanish.'), nodeId: '1789-4', coordinates: { lat: 48.864, lng: 2.33 } },
      { name: 'Tuileries Garden — Aftermath', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jardin+des+Tuileries,+75001+Paris', geste: geste('Silence, symmetry, alignment. Power reclaiming space. Power likes gardens.', 'Sit facing the Louvre. Breathe. You cross the time after decision.'), nodeId: '1789-5', coordinates: { lat: 48.8636, lng: 2.3275 } },
      { name: 'Place de la Concorde — Final Threshold', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Place+de+la+Concorde,+75008+Paris', geste: geste('This space is intentionally too large. Here, on January 21, 1793, a decision became irreversible.', 'Cross the square on foot. Do not go around. Continue afterward. The city resumes. The decision stays behind.'), nodeId: '1789-6', coordinates: { lat: 48.8656, lng: 2.3214 } }
    ],
    image: revolutionImg
  },
  table: {
    id: 'table',
    title: 'WINE & TABLE — PARISIAN LIFE',
    registre: 'Nourishment · Body · Living City',
    texte: [
      "A city tells itself through what it consumes. Paris is a throat, a belly, a mouth. It has always been hungry. It has always been thirsty.",
      "This walk does not recount the history of Parisian gastronomy. It passes through it. It begins with the church of merchants, crosses the ghost of Europe's largest market, and follows an artery that has never stopped feeding the city.",
      "No folklore here. No picturesque \"old Paris.\" Just a city that eats, drinks, digests—and you inside it.",
      "Walk slowly. Buy something. Taste. The city is understood through the body."
    ],
    duree: '≈ 2h30–3h',
    itineraireComplet: 'https://www.google.com/maps/dir/Église+Saint-Eustache,+Paris/Jardin+Nelson-Mandela,+Allée+Jules+Supervielle,+Paris/Rue+Montorgueil,+Paris/Stohrer,+Rue+Montorgueil,+Paris/Au+Rocher+de+Cancale,+Rue+Montorgueil,+Paris/Passage+du+Grand-Cerf,+Paris/@48.8648,2.345,16z/data=!3m1!4b1!4m38!4m37!1m5!1m1!1s0x47e66e1f0e35261b:0x5e0892042738260!2m2!1d2.3452445!2d48.8633393!1m5!1m1!1s0x47e66e1f9a888805:0x98555848e43e2e5e!2m2!1d2.3458686!2d48.8624389!1m5!1m1!1s0x47e66e18af291f09:0xd2755e105051a37c!2m2!1d2.3463378!2d48.8652618!1m5!1m1!1s0x47e66e1ed637b38d:0x22876805d76d8b94!2m2!1d2.3468965!2d48.8658607!1m5!1m1!1s0x47e66e1933a3641b:0x536a00445a6c1741!2m2!1d2.3473105!2d48.8672052!1m5!1m1!1s0x47e66e19636657c9:0x417036437d25e0c!2m2!1d2.3496667!2d48.8663889!3e2',
    stops: [
      { name: 'Saint-Eustache — The Church of the Belly', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=2+Impasse+Saint-Eustache,+75001+Paris', geste: geste('This church is immense, and not by chance. It was built with the money of Les Halles merchants. For centuries, those who fed Paris came here to give thanks or ask. The sacred and food, same address.', 'Enter for a few minutes. The acoustics are vast. Let the silence prepare you for the noise ahead.'), nodeId: 'table-1', coordinates: { lat: 48.8633, lng: 2.3452 } },
      { name: 'Nelson Mandela Garden — The Ghost of Les Halles', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jardin+Nelson+Mandela,+Allée+Jules+Supervielle,+75001+Paris', geste: geste('You are walking on emptiness. Until 1971, this was the belly of Paris—the largest food market in Europe. Iron and glass pavilions. Shouts from 3 a.m. The smell of blood, cheese, crushed vegetables. Everything was erased. The ground remembers.', 'Look for remaining traces: names of streets, the Fountain of the Innocents. The city keeps memory in fragments.'), nodeId: 'table-2', coordinates: { lat: 48.8624, lng: 2.3459 } },
      { name: 'Rue Montorgueil — Entry from Below', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Rue+Montorgueil,+75002+Paris', geste: geste('Enter the artery from the south. Walk in the middle, within the flow. This street has never been silent. Before paving stones and storefronts, it was already circulation of mouths and hands.', 'Buy something to eat while walking. Anything. The gesture matters more than the choice.'), nodeId: 'table-3', coordinates: { lat: 48.8653, lng: 2.3463 } },
      { name: 'Stohrer — Continuous Pastry', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=51+Rue+Montorgueil,+75002+Paris', geste: geste('Stohrer has existed since 1730. Not a monument—a continuous place. Someone has always sold pastries here. A place is not old. It is continuous.', 'Enter. Take a baba au rhum or a puits d\'amour. Eat it standing outside. That is how it was done.'), nodeId: 'table-4', coordinates: { lat: 48.8659, lng: 2.3469 } },
      { name: 'Au Rocher de Cancale — The Speaking Facade', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=78+Rue+Montorgueil,+75002+Paris', geste: geste('Look at the storefront. The carved shells. The details. This restaurant has existed since 1804. Balzac came here, but not for the food. In the 19th century, restaurants were news exchanges. People came to hear what was happening, who was doing what, where money was going. Eating was a pretext. Information circulated between courses. Food has always been political.', 'If you have time, go in for a drink. If not, stay outside. Imagine the conversations that passed through these walls.'), nodeId: 'table-5', coordinates: { lat: 48.8672, lng: 2.3473 } },
      { name: 'Passage du Grand-Cerf — The Opening', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=145+Rue+Saint-Denis,+75002+Paris', geste: geste('You do not finish. You pass through. This passage is one of the tallest in Paris. Glass roof, wrought iron, light. It connects two worlds: the gourmand district you leave behind, and the popular Paris of Strasbourg–Saint-Denis ahead. A good walk does not close. It opens onto what comes next.', 'Cross slowly. Look up. Then exit on the other side and continue your day. The city does not stop.'), nodeId: 'table-6', coordinates: { lat: 48.8664, lng: 2.3497 } }
    ],
    image: tableImg
  }
};

/** EN card list for Walks list page (QuetesV1) */
export interface QueteCardEN {
  id: string;
  title: string;
  registre: string;
  theme: string;
  shortDescription: string;
  image: string;
  duree: string;
}

export const QUETES_LIST_EN: QueteCardEN[] = [
  {
    id: 'lutece',
    title: 'LUTETIA — ORIGIN',
    registre: 'FOUNDATION · GESTURE · MEASURE',
    theme: 'Paris begins as a passage: an island, a bridge, an axis.',
    shortDescription: "Before palaces, before façades, Paris was a solution. A place where water agrees to be crossed.",
    image: luteceImg,
    duree: '≈ 1h30–2h'
  },
  {
    id: '1789',
    title: '1789 — DECISION',
    registre: 'THRESHOLD · REVOLUTION · PASSAGE',
    theme: "The Revolution is not an idea: it's a trajectory.",
    shortDescription: "Paris becomes revolutionary only when it becomes porous. A place where people speak too much, listen too much.",
    image: revolutionImg,
    duree: '≈ 2h–2h30'
  },
  {
    id: 'table',
    title: 'WINE & TABLE — PARISIAN LIFE',
    registre: 'NOURISHMENT · BODY · LIVING CITY',
    theme: 'A city eats, drinks, breathes.',
    shortDescription: "A city tells itself through what it swallows. Paris is a throat, a belly, a mouth. It has always been hungry. It has always been thirsty.",
    image: tableImg,
    duree: '≈ 2h30–3h'
  }
];
