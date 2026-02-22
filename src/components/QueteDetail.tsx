import { Traces } from './Traces';
import { getStoredCard } from '../utils/card-service';
import { MamlukGrid } from './MamlukGrid';
import { BackButton } from './BackButton';
import { ExternalLink, MapPin, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { useState, useEffect } from 'react';
import { getActiveRun, startRun, stampNode, closeRun } from '../utils/quest-run-service';
import type { QuestRun } from '../types/quest-run';
import { getOracleLine } from '../data/oracle';
import { getTodayKey, addQuestWalk } from '../utils/walk-service';
import { addOrUpdateQuestTraceV1 } from '../utils/trace-service';
import { bump } from '../utils/companion-service';
import { appendWalkToJournal } from '../utils/journal-sync';
import type { QuestThreadTrace, QuestStopStamp } from '../types/traces';
// Imgur images for better visual experience
const luteceImg = 'https://i.imgur.com/1uLhXial.jpeg';
const revolutionImg = 'https://i.imgur.com/iyCcmoSl.jpeg';
const tableImg = 'https://i.imgur.com/VtWPT2Ml.jpeg';
// Montmartre images
const hunterImg = 'https://i.imgur.com/onorBpE.jpeg'; // Cadran solaire / coq
const montmartre2 = 'https://i.imgur.com/a2sZi1H.jpeg'; // Monument
const montmartre3 = 'https://i.imgur.com/NeCkJRp.jpeg'; // Maison verte

interface QueteDetailProps {
  queteId: string;
  onBack: () => void;
}

interface Stop {
  name: string;
  googleMapsUrl: string;
  geste: string;
  /** For quest-run thread on map */
  nodeId?: string;
  coordinates?: { lat: number; lng: number };
}

interface QueteData {
  id: string;
  title: string;
  registre: string;
  texte: string[];
  duree: string;
  itineraireComplet: string;
  stops: Stop[];
  image: string;
  /** When closed run completes (e.g. ARC-000) */
  reward?: { kind: 'card'; id: string };
  /** Optional approx km for walk log (no tracking). */
  approxKm?: number;
}

export const QUETES_DATA: Record<string, QueteData> = {
  lutece: {
    id: 'lutece',
    title: 'LUTÈCE — ORIGINE',
    registre: 'Fondation · Geste · Mesure',
    texte: [
      'Avant les palais, avant les façades, Paris fut une solution. Un endroit où l\'eau accepte d\'être franchie. Un endroit où l\'on peut faire payer le passage.',
      'Imagine la Seine sans quais : un delta plus sauvage, des îlots, de la boue, des variations. L\'Île de la Cité n\'est pas un monument. C\'est une stabilité rare au milieu du mouvement. C\'est suffisant pour fonder un monde.',
      'La première intelligence de Paris est une intelligence de mesure : mesurer l\'eau, mesurer la route, mesurer le flux des choses. Puis vient Rome, qui impose un axe, une colonne vertébrale : la Rue Saint-Jacques. Tu peux la suivre comme on suit une vérité ancienne : droite, ascendante, obstinée.',
      'Cette marche est courte mais profonde. Tu traverses la ville comme on traverse une origine. Tu ne regardes pas Paris : tu le lis à même le sol.'
    ],
    duree: '≈ 1h30–2h',
    itineraireComplet: 'https://www.google.com/maps/dir/Parvis+Notre-Dame+-+Pl.+Jean-Paul+II,+Paris/Petit+Pont+-+Cardinal+Lustiger,+Quai+du+Marché+Neuf+-+Maurice+Grimaud,+Paris/4+Rue+de+la+Colombe,+75004+Paris/Rue+Saint-Jacques,+Paris/Pl.+du+Panthéon,+75005+Paris/Musée+de+Cluny+-+Musée+national+du+Moyen+Âge,+Place+Paul+Painlevé,+Paris/@48.8517265,2.3435555,16z/data=!3m1!4b1!4m38!4m37!1m5!1m1!1s0x47e671e19ff53a01:0x364022c7cc569f43!2m2!1d2.3479104!2d48.8530491!1m5!1m1!1s0x47e671e041334c2d:0x933470701899a80e!2m2!1d2.3470293!2d48.8525862!1m5!1m1!1s0x47e671e06718d7db:0x1b4122d699264426!2m2!1d2.350352!2d48.8534888!1m5!1m1!1s0x47e671e6e0622a55:0x8797435f2945e415!2m2!1d2.3429383!2d48.8437021!1m5!1m1!1s0x47e671e860951161:0x7052a6597c5e263d!2m2!1d2.3458986!2d48.8464115!1m5!1m1!1s0x47e671e6878b668d:0x6b97368686f345a5!2m2!1d2.3433608!2d48.8504351!3e2',
    stops: [
      { name: 'Parvis Notre-Dame — Le point zéro', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Parvis+Notre-Dame+-+Pl.+Jean-Paul+II,+Paris', geste: 'Tu es au centre. Pas symboliquement — géométriquement. Toutes les distances de France se mesurent depuis la plaque sous tes pieds. Mais avant d\'être un centre, c\'était un port. Les bateaux accostaient ici. La cathédrale est venue après, sur un lieu déjà utile. Le sacré s\'installe toujours sur ce qui fonctionne. Geste — Trouve la plaque du kilomètre zéro. Tiens-toi dessus. Tu es à l\'origine des routes.', nodeId: 'lutece-1', coordinates: { lat: 48.853, lng: 2.3499 } },
      { name: 'Petit Pont — Le premier passage', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Petit+Pont+-+Cardinal+Lustiger,+Quai+du+Marché+Neuf+-+Maurice+Grimaud,+Paris', geste: 'C\'est le plus vieux point de traversée de Paris. Il a brûlé onze fois. Avant la pierre, c\'était du bois. Et sur le bois, des maisons. Des gens vivaient au-dessus de l\'eau, dans le risque permanent. Arrête-toi au milieu du pont. Regarde l\'eau. Elle a toujours voulu reprendre ce passage. La ville a toujours reconstruit. Geste — Reste une minute immobile au milieu. Sens le flux sous toi. La ville commence par une insistance.', nodeId: 'lutece-2', coordinates: { lat: 48.8526, lng: 2.347 } },
      { name: 'Rue de la Colombe — Le mur invisible', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=4+Rue+de+la+Colombe,+75004+Paris', geste: 'Cette rue suit le tracé exact du rempart gallo-romain. Il n\'existe plus, mais la ville a gardé sa forme. Cherche au sol : il y a des pavés plus sombres qui marquent la ligne de l\'ancienne muraille. Paris ne détruit jamais complètement. Elle absorbe, elle recouvre, elle garde les réflexes. Geste — Marche le long de la ligne. Tu suis une frontière que plus personne ne défend.', nodeId: 'lutece-3', coordinates: { lat: 48.8535, lng: 2.3504 } },
      { name: 'Rue Saint-Jacques — L\'axe romain', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Rue+Saint-Jacques,+Paris', geste: 'Tu entres sur le Cardo Maximus. La colonne vertébrale que Rome a plantée dans la boue gauloise. Cette rue existait avant les rois, avant les églises, avant le nom même de Paris. Monte lentement. Ne regarde pas les boutiques. Regarde la pente. Cette ligne droite qui monte vers le sud, c\'est une décision vieille de deux mille ans. Geste — Marche au milieu de la rue quand tu peux. Sens l\'axe dans ton corps. Tu remonts le temps en montant la pente.', nodeId: 'lutece-4', coordinates: { lat: 48.8464, lng: 2.3429 } },
      { name: 'Place du Panthéon — La mesure du ciel', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Pl.+du+Panthéon,+75005+Paris', geste: 'Ici, la ville a décidé de s\'aligner sur une idée. La perspective, la symétrie, le Panthéon au bout — ce n\'est pas un hasard. C\'est une géométrie imposée au sol. Au XVIIIe siècle, on a voulu que Paris ressemble à ce qu\'on pensait de la raison. Cette place est une croyance devenue pierre. Geste — Place-toi dans l\'axe exact de la rue Soufflot. Regarde le Panthéon. Quelqu\'un a voulu que tu te tiennes exactement là.', nodeId: 'lutece-5', coordinates: { lat: 48.8462, lng: 2.3464 } },
      { name: 'Musée de Cluny — La continuité', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Musée+de+Cluny+-+Musée+national+du+Moyen+Âge,+Place+Paul+Painlevé,+Paris', geste: 'Si tu entres, tu refermes la boucle. Ce lieu est construit sur des thermes romains. Les pierres que tu vois dans la cour ont chauffé des corps il y a deux mille ans. Au-dessus, un hôtel médiéval. La ville s\'empile sur elle-même. Tu ne visites pas un musée. Tu descends dans les couches. Geste — Si tu n\'entres pas, touche le mur extérieur. La pierre est romaine. Ta main touche ce que la ville a décidé de ne pas effacer.', nodeId: 'lutece-6', coordinates: { lat: 48.8504, lng: 2.3434 } }
    ],
    image: luteceImg
  },
  '1789': {
    id: '1789',
    title: '1789 — DÉCISION',
    registre: 'Seuil · Passage · Bascule',
    texte: [
      'Une révolution ne commence pas par une idée. Elle commence par un espace qui change de fonction.',
      'Au Palais-Royal, l\'architecture a fabriqué un accident. Des arcades où l\'on marche sans but. Des cafés où l\'on reste trop longtemps. Des imprimeurs qui sortent des feuilles encore humides. Une densité de paroles, de regards, de rumeurs. Ce n\'est pas un jardin. C\'est une chambre d\'écho.',
      'Puis il y a le geste. Un homme monte sur une table de café. Un meuble de consommation devient une tribune. Le privé bascule dans le public. À cet instant, quelque chose devient irréversible.',
      'Cette marche suit cette logique : incubation → déclenchement → propagation → institution. Tu passes de l\'espace où l\'on parle à l\'espace où l\'on décide.'
    ],
    duree: '≈ 2h–2h30',
    itineraireComplet: 'https://www.google.com/maps/dir/Jardin+du+Palais+Royal,+75001+Paris/Galerie+Montpensier,+75001+Paris/Rue+Saint-Honoré,+75001+Paris/230+Rue+de+Rivoli,+75001+Paris/Jardin+des+Tuileries,+75001+Paris/Place+de+la+Concorde,+75008+Paris/@48.8636,2.3277,15z/data=!3m1!4b1!4m38!4m37!1m5!1m1!1s0x47e66e1da38e76d5:0x7a1f8b3b3b3b3b3b!2m2!1d2.3377778!2d48.8638889!1m5!1m1!1s0x47e66e1da38e76d5:0x7a1f8b3b3b3b3b3b!2m2!1d2.3377778!2d48.8638889!1m5!1m1!1s0x47e66e1f5c0e0e0e:0x0e0e0e0e0e0e0e0e!2m2!1d2.3333333!2d48.8666667!1m5!1m1!1s0x47e66e1f5c0e0e0e:0x0e0e0e0e0e0e0e0e!2m2!1d2.3308333!2d48.8641667!1m5!1m1!1s0x47e66e2e0e0e0e0e:0x0e0e0e0e0e0e0e0e!2m2!1d2.3275!2d48.8636111!1m5!1m1!1s0x47e66e2e0e0e0e0e:0x0e0e0e0e0e0e0e0e!2m2!1d2.3213889!2d48.8656111!3e2',
    stops: [
      { name: 'Jardin du Palais-Royal — La chambre d\'écho', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jardin+du+Palais+Royal,+75001+Paris', geste: 'Entre par n\'importe quelle entrée. Fais le tour sous les arcades avant d\'aller au centre. Sens comment l\'espace te retient. Les galeries forment un rectangle fermé. Le son rebondit. Les regards se croisent. Au XVIIIe siècle, c\'était le seul endroit de Paris où la police n\'entrait pas — propriété privée du duc d\'Orléans. On pouvait parler. On pouvait imprimer. On pouvait comploter à ciel ouvert. Geste — Assieds-toi quelques minutes sur une chaise du jardin. Regarde les gens passer sous les arcades. Imagine le même lieu avec dix fois plus de monde, dix fois plus de bruit, et aucune loi.', nodeId: '1789-1', coordinates: { lat: 48.8639, lng: 2.3378 } },
      { name: 'Galerie Montpensier — Le café de Foy', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Galerie+Montpensier,+75001+Paris', geste: 'Cherche l\'emplacement. Il n\'y a plus de café de Foy, mais la zone est là — côté est du jardin, sous les arcades. Le 12 juillet 1789, Camille Desmoulins monte sur une table. Il parle. Il crie. Il arrache une feuille d\'arbre et la met à son chapeau — signe de ralliement. Deux jours plus tard, la Bastille tombe. Ce n\'était pas un discours prévu. C\'était un débordement. L\'espace l\'a permis. Geste — Tiens-toi à l\'endroit approximatif. Regarde la hauteur des arcades. Imagine la voix qui porte, qui rebondit, qui enfle. Une table, un corps debout, et la suite de l\'histoire.', nodeId: '1789-2', coordinates: { lat: 48.8639, lng: 2.3378 } },
      { name: 'Sortie vers Rue Saint-Honoré — La propagation', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Rue+Saint-Honoré,+75001+Paris', geste: 'Sors du Palais-Royal par le passage qui donne sur la rue Saint-Honoré. Tu passes du rectangle clos à la ligne ouverte. La rumeur qui naît dans la chambre d\'écho se propage ici, dans les rues. Elle marche plus vite que l\'ordre écrit. Les gens courent. Les nouvelles se déforment. Ce qui était une parole devient un mouvement. Geste — Marche vite pendant deux minutes. Ne regarde pas les vitrines. Sens l\'accélération. La ville devient un circuit.', nodeId: '1789-3', coordinates: { lat: 48.866, lng: 2.333 } },
      { name: '230 Rue de Rivoli — Le Manège disparu', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=230+Rue+de+Rivoli,+75001+Paris', geste: 'Cherche la plaque. Il n\'y a plus rien à voir — un passage, des immeubles. Mais ici se tenait la salle du Manège, où l\'Assemblée nationale s\'est installée. Imagine une salle étroite, mal aérée, bruyante. Les députés qui crient pour se faire entendre. La politique avant l\'éloquence solennelle. Avant d\'être majestueuse, la démocratie a été inaudible. Geste — Lis la plaque. Reste un moment devant ce vide. Les lieux de décision disparaissent. Les décisions restent.', nodeId: '1789-4', coordinates: { lat: 48.864, lng: 2.33 } },
      { name: 'Jardin des Tuileries — Le calme d\'après', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jardin+des+Tuileries,+75001+Paris', geste: 'Entre dans le jardin. Marche lentement. Le contraste est violent. Ce silence, cette géométrie, ces arbres alignés — c\'est le pouvoir qui reprend l\'espace. Les Tuileries ont vu des émeutes, des invasions, des foules. Aujourd\'hui, des enfants et des touristes. Le pouvoir aime les jardins. Il aime que les choses aient l\'air calmes. Geste — Trouve un banc. Assieds-toi face au Louvre. Respire. Tu traverses le temps d\'après la décision.', nodeId: '1789-5', coordinates: { lat: 48.8636, lng: 2.3275 } },
      { name: 'Place de la Concorde — Le seuil final', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Place+de+la+Concorde,+75008+Paris', geste: 'Tu arrives sur la place. Elle est trop grande. C\'est fait exprès. Ici, le 21 janvier 1793, la décision est devenue irréversible. Une tête est tombée. Après ça, plus personne ne pouvait dire "on arrête, on revient en arrière". Le pays entier a basculé dans l\'inconnu. Tu n\'as pas besoin d\'imaginer la guillotine. Regarde l\'espace. Sens l\'exposition. Être ici, c\'était être vu par des milliers de personnes. Le pouvoir et la mort, même mise en scène. Geste — Traverse la place à pied. Ne contourne pas. Va jusqu\'à l\'obélisque, puis continue. La ville reprend après. La décision reste derrière toi.', nodeId: '1789-6', coordinates: { lat: 48.8656, lng: 2.3214 } }
    ],
    image: revolutionImg
  },
  table: {
    id: 'table',
    title: 'VIN & TABLE — VIE PARISIENNE',
    registre: 'Nourriture · Corps · Ville vivante',
    texte: [
      'Une ville se raconte par ce qu\'elle avale. Paris est une gorge, un ventre, une bouche. Elle a toujours eu faim. Elle a toujours eu soif.',
      'Ce parcours ne raconte pas l\'histoire de la gastronomie parisienne. Il la traverse. On commence par l\'église des marchands, on passe par le fantôme du plus grand marché d\'Europe, on remonte une artère qui n\'a jamais cessé de nourrir.',
      'Ici, pas de folklore. Pas de "vieux Paris pittoresque". Juste une ville qui mange, qui boit, qui digère — et toi au milieu.',
      'Marche lentement. Achète quelque chose. Goûte. La ville se comprend par le corps.'
    ],
    duree: '≈ 2h30–3h',
    itineraireComplet: 'https://www.google.com/maps/dir/Église+Saint-Eustache,+Paris/Jardin+Nelson-Mandela,+Allée+Jules+Supervielle,+Paris/Rue+Montorgueil,+Paris/Stohrer,+Rue+Montorgueil,+Paris/Au+Rocher+de+Cancale,+Rue+Montorgueil,+Paris/Passage+du+Grand-Cerf,+Paris/@48.8648,2.345,16z/data=!3m1!4b1!4m38!4m37!1m5!1m1!1s0x47e66e1f0e35261b:0x5e0892042738260!2m2!1d2.3452445!2d48.8633393!1m5!1m1!1s0x47e66e1f9a888805:0x98555848e43e2e5e!2m2!1d2.3458686!2d48.8624389!1m5!1m1!1s0x47e66e18af291f09:0xd2755e105051a37c!2m2!1d2.3463378!2d48.8652618!1m5!1m1!1s0x47e66e1ed637b38d:0x22876805d76d8b94!2m2!1d2.3468965!2d48.8658607!1m5!1m1!1s0x47e66e1933a3641b:0x536a00445a6c1741!2m2!1d2.3473105!2d48.8672052!1m5!1m1!1s0x47e66e19636657c9:0x417036437d25e0c!2m2!1d2.3496667!2d48.8663889!3e2',
    stops: [
      { name: 'Saint-Eustache — L\'église du ventre', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=2+Impasse+Saint-Eustache,+75001+Paris', geste: 'Cette église est énorme, et ce n\'est pas un hasard. Elle a été construite avec l\'argent des marchands des Halles. Pendant des siècles, les gens qui nourrissaient Paris venaient ici remercier ou demander. Le sacré et la bouffe, même adresse. Entre quelques minutes. L\'acoustique est immense. Laisse le silence te préparer au bruit qui vient.', nodeId: 'table-1', coordinates: { lat: 48.8633, lng: 2.3452 } },
      { name: 'Jardin Nelson-Mandela — Le fantôme des Halles', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jardin+Nelson+Mandela,+Allée+Jules+Supervielle,+75001+Paris', geste: 'Tu marches sur un vide. Jusqu\'en 1971, ici, c\'était le ventre de Paris. Le plus grand marché alimentaire d\'Europe. Des pavillons de fer et de verre. Des cris dès 3h du matin. L\'odeur du sang, du fromage, des légumes écrabouillés. On a tout rasé. Il reste ce jardin, cette canopée, ce centre commercial. Mais le sol se souvient. Cherche les quelques traces : la fontaine des Innocents (ancien cimetière devenu place de marché), les rues autour qui portent encore les noms des métiers.', nodeId: 'table-2', coordinates: { lat: 48.8624, lng: 2.3459 } },
      { name: 'Rue Montorgueil — L\'entrée par le bas', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Rue+Montorgueil,+75002+Paris', geste: 'Tu entres dans l\'artère par le sud, là où elle commence. Ne marche pas sur le côté. Marche au milieu, dans le flux. Cette rue n\'a jamais été silencieuse. Avant les pavés, avant les devantures, c\'était déjà une circulation de bouches et de mains. Poissonniers, fromagers, marchands de quatre-saisons. Aujourd\'hui le décor a changé, pas l\'énergie. Achète quelque chose que tu mangeras en marchant. N\'importe quoi. Le geste compte plus que le choix.', nodeId: 'table-3', coordinates: { lat: 48.8653, lng: 2.3463 } },
      { name: 'Stohrer — La pâtisserie continue', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=51+Rue+Montorgueil,+75002+Paris', geste: 'Stohrer existe depuis 1730. Ce n\'est pas un "monument historique". C\'est un lieu qui n\'a jamais fermé. Le pâtissier de la reine Marie Leszczyńska a ouvert ici, et depuis, quelqu\'un a toujours vendu des gâteaux à cet endroit. Un lieu n\'est pas vieux. Il est continu. Entre. Prends un baba au rhum ou un puits d\'amour. Mange-le dehors, debout. C\'est comme ça qu\'on faisait.', nodeId: 'table-4', coordinates: { lat: 48.8659, lng: 2.3469 } },
      { name: 'Au Rocher de Cancale — La façade qui parle', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=78+Rue+Montorgueil,+75002+Paris', geste: 'Regarde la devanture. Les coquilles sculptées. Les détails. Ce restaurant existe depuis 1804. Balzac y venait, mais pas pour la cuisine. Au XIXe siècle, les restaurants étaient des bourses aux nouvelles. On venait entendre ce qui se passait, qui faisait quoi, où allait l\'argent. Manger était un prétexte. L\'information circulait entre les plats. La nourriture a toujours été politique. Si tu as le temps, entre boire un verre. Sinon, reste devant. Imagine les conversations qui ont traversé ces murs.', nodeId: 'table-5', coordinates: { lat: 48.8672, lng: 2.3473 } },
      { name: 'Passage du Grand-Cerf — L\'ouverture', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=145+Rue+Saint-Denis,+75002+Paris', geste: 'Tu ne termines pas. Tu traverses. Ce passage est l\'un des plus hauts de Paris. Verrière, fer forgé, lumière. Il relie deux mondes : le quartier gourmand que tu quittes, et le Paris populaire de Strasbourg-Saint-Denis qui t\'attend. Un bon parcours ne se ferme pas. Il ouvre sur ce qui vient après. Traverse lentement. Regarde en l\'air. Puis sors de l\'autre côté et continue ta journée. La ville ne s\'arrête pas.', nodeId: 'table-6', coordinates: { lat: 48.8664, lng: 2.3497 } }
    ],
    image: tableImg
  },

  // ============================================
  // TEMPORAL MERIDIANS — Saint-Sulpice, Horloge, Point Zéro (Quest Run)
  // ============================================
  'temporal-meridians': {
    id: 'temporal-meridians',
    title: 'Temporal Meridians',
    registre: 'Seuil · Temps · Origine',
    texte: [
      'Saint-Sulpice, the clock, the zero. A short walk along time: the meridian at Saint-Sulpice, civil time at the Conciergerie (Charles V, 1370–1371), and the point from which distances begin.'
    ],
    duree: '≈ 45–60 min',
    itineraireComplet: 'https://www.google.com/maps/dir/?api=1&origin=48.8512,2.3347&destination=48.8530,2.3499&waypoints=48.8562,2.3462&travelmode=walking',
    stops: [
      { name: 'Saint-Sulpice (Solar)', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Place+Saint-Sulpice,+75006+Paris', geste: 'Notice the asymmetry. The meridian is here.', nodeId: 'sulpice-solar', coordinates: { lat: 48.8512, lng: 2.3347 } },
      { name: 'Tour de l\'Horloge / Conciergerie (Civil)', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=2+Boulevard+du+Palais,+75001+Paris', geste: 'Civil time. Charles V, 1370–1371.', nodeId: 'sulpice-horloge', coordinates: { lat: 48.8562, lng: 2.3462 } },
      { name: 'Point Zéro Notre-Dame (Origin)', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Parvis+Notre-Dame,+75004+Paris', geste: 'From here, distances begin.', nodeId: 'sulpice-zero', coordinates: { lat: 48.853, lng: 2.3499 } }
    ],
    image: luteceImg,
    reward: { kind: 'card', id: 'ARC-000' },
    approxKm: 2
  },

  // ============================================
  // HUNTER: MONTMARTRE — Chasse aux symboles
  // ============================================

  'hunter-montmartre': {
    id: 'hunter-montmartre',
    title: 'HUNTER: MONTMARTRE',
    registre: 'Reconnaissance · Symbole · Mémoire',
    texte: [
      'Hunter n\'est pas une promenade. C\'est une méthode.',
      'Montmartre est un organisme cicatrisé. Du gypse antique aux cabarets de la Belle Époque, chaque strate laisse une empreinte pour qui sait la lire. Cette chasse t\'invite à reconnaître sept symboles dispersés sur la Butte.',
      'Il n\'y a pas de séquence. Pas de carte à suivre. Juste des indices. Les symboles sont là, exposés à des milliers de passants chaque jour. Mais ils sont occultés par l\'habitude. Ils nécessitent un changement de focale.',
      'Quand tu le vois, tu sais.'
    ],
    duree: '2h — 3h (constellation)',
    itineraireComplet: 'https://www.google.com/maps/search/?api=1&query=Place+du+Tertre+Paris+18',
    stops: [
      {
        name: 'α — Le Passe-Muraille',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Place+Marcel+Aymé+Paris',
        geste: 'Cherche l\'homme qui a ignoré les lois de la physique. Il habite une place qui porte le nom de son visage, mais son corps est celui d\'un autre. Il est à jamais coincé entre deux mondes, victime d\'une médecine tardive. Regarde sa main gauche : elle est d\'or, polie par la compassion de ceux qui sont libres de marcher dans la rue. Quand tu verras l\'éclat du métal usé sur la pierre froide, tu sauras que tu as trouvé le prisonnier volontaire. — Serre sa main. Tu fais partie de la chaîne.'
      },
      {
        name: 'β — Le Rocher de la Sorcière',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=23+Avenue+Junot+Paris',
        geste: 'Tu trouveras une frontière de fer noir entre le monde d\'en haut et le monde d\'en bas. Colle ton visage aux barreaux. Au cœur de l\'allée interdite, cherche l\'intrus. Ce n\'est pas une sculpture, ni un banc, mais une pierre brute, solitaire, que la ville n\'a pas osé avaler. Elle marquait l\'eau, elle porte aujourd\'hui le nom d\'un maléfice. C\'est le dernier rempart du Maquis contre le béton. Quand tu verras ce dolmen urbain, tu sauras que la Sorcière veille encore.'
      },
      {
        name: 'γ — La Plaque Downing Street',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=10+Villa+Léandre+Paris',
        geste: 'Oublie Paris. Traverse la Manche sans quitter le pavé. Cherche l\'impasse où les briques rougissent et où les fenêtres s\'avancent sur la rue pour mieux voir. Arrête-toi au numéro du pouvoir. Une petite plaque noire te ment avec une élégance britannique. Ce n\'est pas la porte d\'un Premier Ministre, mais la blague d\'un résident qui a transformé sa maison en décor de théâtre. Quand tu liras l\'adresse impossible, tu sauras que tu es arrivé à Londres-sur-Montmartre.'
      },
      {
        name: 'δ — Le Cadran du Coq',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=4+Rue+de+l\'Abreuvoir+Paris',
        geste: 'Marche sur le chemin où les bêtes allaient boire. Arrête-toi devant la maison de l\'historien soldat. Sur le mur, un oiseau de pierre attend le soleil pour crier. Lis sa promesse. Une lettre s\'est retournée, comme une armée en retraite dans les neiges de l\'Est. Ce « N » à l\'envers est la signature secrète d\'un désastre lointain. Quand tu auras décrypté l\'erreur, tu entendras l\'écho de l\'Empire. — QUAND SONNERA JE CHANTERAY.'
      },
      {
        name: 'ε — Le Moulin Radet',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=83+Rue+Lepic+Paris',
        geste: 'Il a perdu ses racines et ne moud plus que du vent. Perché sur un toit comme un trophée oublié, il surveille le virage. Ses ailes ont, dit-on, porté le corps écartelé de son maître en 1814, cloué là par les lances cosaques. Aujourd\'hui, il est muet, coque de bois vide posée sur un restaurant. Lève la tête pour saluer le vétéran qui ne tourne plus.'
      },
      {
        name: 'ζ — La Tombe de Steinlen',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Cimetière+Saint-Vincent+Paris',
        geste: 'Descends vers le repos des artistes, là où les murs étouffent le bruit de la ville. Cherche la pierre brute qui refuse le marbre lisse. C\'est le sanctuaire de l\'Indépendance. Si tu vois une armée de petits félins de pierre, de verre ou de chair monter la garde sur la dalle, tu as trouvé le maître du Chat Noir. Il a dessiné le peuple de la nuit, et le peuple de la nuit lui rend hommage.'
      },
      {
        name: 'Ω — La Plaque du Bistro',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=6+Place+du+Tertre+Paris',
        geste: 'Retourne au centre du tourbillon. Cherche la plus vieille maison de soif, celle de la Mère fondatrice. Sur son mur, une plaque officielle raconte un mensonge que tout le monde adore croire. Elle parle de soldats venus du froid en 1814, criant « Vite ! Vite ! » dans une langue étrangère. C\'est la naissance légendaire d\'un mot que tu utilises tous les jours. Lis le mot russe gravé dans le laiton : c\'est la cicatrice joyeuse d\'une invasion oubliée. — Le mensonge est devenu vérité. La vérité est devenue folklore.'
      }
    ],
    image: hunterImg
  }
};

/**
 * DÉTAIL QUÊTE — V1 ARCHÉ
 * 
 * Structure éditoriale stricte :
 * - Texte long + itinéraire complet
 * - Chaque stop = nom + lien Google Maps + geste
 * - Pas de validation, pas de score
 * 
 * La quête existe dans la marche, pas dans l'écran.
 */
function getActiveRunForQuest(queteId: string): QuestRun | null {
  const run = getActiveRun();
  return run?.questId === queteId ? run : null;
}

export function QueteDetail({ queteId, onBack }: QueteDetailProps) {
  const quete = QUETES_DATA[queteId];
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeRun, setActiveRun] = useState<QuestRun | null>(() => getActiveRunForQuest(queteId));
  const [witnessStopIndex, setWitnessStopIndex] = useState<number | null>(null);
  const [closeReveal, setCloseReveal] = useState(false);
  const cardId = getStoredCard() ?? null;

  const hasThreadSupport = quete?.stops?.some((s) => s.nodeId) ?? false;
  const allStamped = hasThreadSupport && activeRun && quete && quete.stops.every((s) => s.nodeId && activeRun.visited[s.nodeId]);

  useEffect(() => {
    setActiveRun(getActiveRunForQuest(queteId));
    setCloseReveal(false);
  }, [queteId]);

  const handleBeginThread = () => {
    if (!queteId) return;
    const run = startRun(queteId);
    setActiveRun(run);
  };

  const handleStampNode = (runId: string, nodeId: string, evidenceLocalIds?: string[]) => {
    stampNode(runId, nodeId, evidenceLocalIds);
    setActiveRun(getActiveRun());
    setWitnessStopIndex(null);
  };

  const handleCloseWalk = async () => {
    if (!activeRun || !quete) return;
    const closedAt = new Date().toISOString();
    closeRun(activeRun.runId, quete.reward);
    const approxKm = quete.approxKm;
    addQuestWalk(getTodayKey(), quete.title, quete.id, approxKm);
    const stamps: QuestStopStamp[] = quete.stops
      .filter((s) => s.nodeId && activeRun!.visited[s.nodeId])
      .map((s) => ({
        stopId: s.nodeId!,
        label: s.name,
        at: activeRun!.visited[s.nodeId!].at,
        oracleLine: getOracleLine(queteId, 'arrive_stop', s.nodeId!) || undefined
      }));
    const v1Trace: QuestThreadTrace = {
      kind: 'quest_thread',
      traceId: `thread-${queteId}-${activeRun.runId}`,
      questId: quete.id,
      title: quete.title,
      createdAt: activeRun.startedAt,
      closedAt,
      approxKm,
      stamps
    };
    addOrUpdateQuestTraceV1(v1Trace);
    bump('quest_closed');
    const line = `${quete.title} — completed (${new Date().toLocaleDateString()})`;
    if (cardId) {
      try {
        await appendWalkToJournal(cardId, line);
      } catch {
        // journal-sync missing or failed
      }
    }
    setActiveRun(null);
    setCloseReveal(true);
  };

  if (!quete) {
    return (
      <div style={{ padding: 'var(--space-xxl)', textAlign: 'center' }}>
        <p>Quête introuvable</p>
        <button onClick={onBack}>Retour</button>
      </div>
    );
  }

  // Helper to sanitize text for PDF (jsPDF built-in fonts don't support special chars)
  const sanitizeForPDF = (text: string): string => {
    return text
      .replace(/≈/g, '~')
      .replace(/–/g, '-')
      .replace(/—/g, '-')
      .replace(/'/g, "'")
      .replace(/'/g, "'")
      .replace(/"/g, '"')
      .replace(/"/g, '"')
      .replace(/…/g, '...')
      .replace(/œ/g, 'oe')
      .replace(/Œ/g, 'OE')
      .replace(/«/g, '"')
      .replace(/»/g, '"')
      .replace(/·/g, '-');
  };

  const downloadPDF = async () => {
    setIsGeneratingPDF(true);

    // Petit délai pour montrer le feedback
    await new Promise(resolve => setTimeout(resolve, 300));

    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 25;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;

    // --- PAGE DE GARDE ---
    
    // Barre supérieure (accent vert)
    doc.setFillColor(0, 61, 44);
    doc.rect(0, 0, pageWidth, 3, 'F');
    
    y = 60;
    
    // Titre principal
    doc.setFont('times', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(26, 26, 26);
    const titleLines = doc.splitTextToSize(sanitizeForPDF(quete.title), contentWidth);
    titleLines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, y, { align: 'center' });
      y += 12;
    });

    y += 8;

    // Registre (small caps simulé)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 61, 44);
    doc.text(sanitizeForPDF(quete.registre.toUpperCase()), pageWidth / 2, y, { align: 'center' });

    y += 15;

    // Durée
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(163, 135, 103);
    doc.text(sanitizeForPDF(`Duree : ${quete.duree}`), pageWidth / 2, y, { align: 'center' });
    
    // Ligne de séparation
    y += 20;
    doc.setDrawColor(219, 212, 198);
    doc.setLineWidth(0.5);
    doc.line(margin + 30, y, pageWidth - margin - 30, y);
    
    y += 20;
    
    // Texte éditorial
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);

    quete.texte.forEach(paragraphe => {
      const lines = doc.splitTextToSize(sanitizeForPDF(paragraphe), contentWidth);
      
      // Vérifier si on a besoin d'une nouvelle page
      if (y + (lines.length * 6) > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      
      doc.text(lines, margin, y);
      y += lines.length * 6 + 8;
    });
    
    // --- PAGE ITINÉRAIRE ---
    doc.addPage();
    y = margin;
    
    // Barre supérieure
    doc.setFillColor(0, 61, 44);
    doc.rect(0, 0, pageWidth, 3, 'F');
    
    y = 40;
    
    // Titre section
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(26, 26, 26);
    doc.text('Itinéraire', margin, y);
    
    y += 15;
    
    // Ligne de séparation
    doc.setDrawColor(219, 212, 198);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    
    y += 12;
    
    // Stops
    quete.stops.forEach((stop, index) => {
      // Vérifier si on a besoin d'une nouvelle page
      if (y > pageHeight - 50) {
        doc.addPage();
        y = margin;
      }
      
      // Numéro
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0, 61, 44);
      doc.text(`${index + 1}.`, margin, y);
      
      // Nom du lieu
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 26, 26);
      const nameLines = doc.splitTextToSize(sanitizeForPDF(stop.name), contentWidth - 10);
      doc.text(nameLines, margin + 8, y);

      y += nameLines.length * 6 + 4;

      // Geste (italique)
      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(26, 26, 26);
      const gesteLines = doc.splitTextToSize(sanitizeForPDF(stop.geste), contentWidth - 10);
      doc.text(gesteLines, margin + 8, y);
      
      y += gesteLines.length * 5 + 10;
    });
    
    // --- FOOTER SUR TOUTES LES PAGES ---
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Ligne supérieure footer
      doc.setDrawColor(219, 212, 198);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
      
      // Texte footer
      doc.setFont('times', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(26, 26, 26);
      doc.text('ARCHÉ — Petit Souvenir', pageWidth / 2, pageHeight - 12, { align: 'center' });
      
      // Numéro de page
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(163, 135, 103);
      doc.text(`${i}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
    }
    
    // Télécharger
    const fileName = quete.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    doc.save(`${fileName}-petit-souvenir.pdf`);
    
    setIsGeneratingPDF(false);
  };

  return (
    <div 
      className="min-h-screen relative"
      style={{ 
        background: '#FAF8F2',
        overflow: 'auto'
      }}
    >
      {/* Ghost Grid Mamluk */}
      <MamlukGrid pattern="tessellation" opacity={0.02} scale={1} rotation={30} layers={1} />

      {/* Back button */}
      <BackButton onClick={onBack} />

      {/* Container principal */}
      <div 
        className="quete-detail-container"
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: 'var(--space-xxl)',
          paddingTop: '120px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Image en tête */}
        <div 
          style={{
            aspectRatio: '16 / 9',
            background: '#E7E1D8',
            marginBottom: 'var(--space-xxl)',
            border: '1px solid #DBD4C6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <img 
            src={quete.image} 
            alt={quete.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>

        {/* Header */}
        <header style={{ marginBottom: 'var(--space-xxl)' }}>
          <h1 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '56px',
              fontWeight: '600',
              color: '#1A1A1A',
              marginBottom: 'var(--space-sm)',
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}
          >
            {quete.title}
          </h1>

          <p 
            className="small-caps"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '0.2em',
              color: '#003D2C',
              opacity: 0.6,
              marginBottom: 'var(--space-md)'
            }}
          >
            {quete.registre}
          </p>

          <p 
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              letterSpacing: '0.05em',
              color: '#A38767',
              opacity: 0.8
            }}
          >
            Durée : {quete.duree}
          </p>

          {/* Séparateur */}
          <div 
            style={{
              width: '80px',
              height: '2px',
              background: '#003D2C',
              opacity: 0.3,
              marginTop: 'var(--space-xl)'
            }}
          />
        </header>

        {/* Texte éditorial */}
        <article style={{ marginBottom: 'var(--space-xxl)' }}>
          {quete.texte.map((paragraphe, index) => (
            <p 
              key={index}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '20px',
                lineHeight: '1.8',
                color: '#1A1A1A',
                marginBottom: 'var(--space-xl)',
                fontWeight: '300'
              }}
            >
              {paragraphe}
            </p>
          ))}
        </article>

        {/* Séparateur */}
        <div 
          style={{
            width: '100%',
            height: '1px',
            background: '#DBD4C6',
            margin: 'var(--space-xxl) 0'
          }}
        />

        {/* Itinéraire */}
        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <h2 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '32px',
              fontWeight: '500',
              color: '#1A1A1A',
              marginBottom: 'var(--space-lg)',
              letterSpacing: '-0.01em'
            }}
          >
            Itinéraire
          </h2>

          {/* Quest Run — Begin the thread (only if quest has nodeIds) */}
          {hasThreadSupport && !activeRun && !closeReveal && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <button
                type="button"
                onClick={handleBeginThread}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '14px 24px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#003D2C',
                  background: 'transparent',
                  border: '1px solid rgba(0,61,44,0.4)',
                  cursor: 'pointer'
                }}
              >
                Begin the thread
              </button>
            </div>
          )}

          {/* Close reveal — one-time message */}
          {closeReveal && (
            <div
              style={{
                marginBottom: 'var(--space-xl)',
                padding: 'var(--space-lg)',
                border: '1px solid rgba(0,61,44,0.2)',
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                fontStyle: 'italic',
                color: '#003D2C'
              }}
            >
              From there everything starts. Welcome to ARCHÉ.
              {quete.reward && (
                <span style={{ display: 'block', marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                  {quete.reward.id}
                </span>
              )}
            </div>
          )}

          {/* CTA — Itinéraire complet */}
          <a
            href={quete.itineraireComplet}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-sm)',
              width: '100%',
              background: '#003D2C',
              color: '#FAF8F2',
              border: 'none',
              padding: '18px 32px',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              fontWeight: '500',
              marginBottom: 'var(--space-xl)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#00543D';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 61, 44, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#003D2C';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <ExternalLink size={16} />
            Ouvrir l'itinéraire complet dans Google Maps
          </a>

          {/* CTA — Télécharger le PDF */}
          <button
            onClick={downloadPDF}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-sm)',
              width: '100%',
              background: '#003D2C',
              color: '#FAF8F2',
              border: 'none',
              padding: '18px 32px',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              fontWeight: '500',
              marginBottom: 'var(--space-xl)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#00543D';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 61, 44, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#003D2C';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Download size={16} />
            {isGeneratingPDF ? 'Génération...' : 'Télécharger le parcours en PDF'}
          </button>

          {/* Liste des stops */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {quete.stops.map((stop, index) => (
              <div 
                key={index}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E7E1D8',
                  padding: 'var(--space-lg)',
                  transition: 'all var(--transition)'
                }}
              >
                {/* Numéro + Nom */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                  <span 
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '24px',
                      fontWeight: '600',
                      color: '#003D2C',
                      opacity: 0.4,
                      minWidth: '32px'
                    }}
                  >
                    {index + 1}
                  </span>
                  <h3 
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '18px',
                      fontWeight: '500',
                      color: '#1A1A1A',
                      lineHeight: '1.4'
                    }}
                  >
                    {stop.name}
                  </h3>
                </div>

                {/* Geste */}
                <p 
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '15px',
                    fontStyle: 'italic',
                    color: '#1A1A1A',
                    opacity: 0.7,
                    lineHeight: '1.6',
                    marginBottom: 'var(--space-md)',
                    marginLeft: '48px'
                  }}
                >
                  {stop.geste}
                </p>

                {/* Lien Google Maps */}
                <div style={{ marginLeft: '48px' }}>
                  <a
                    href={stop.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-xs)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#003D2C',
                      textDecoration: 'none',
                      fontWeight: '500',
                      transition: 'all var(--transition)',
                      opacity: 0.6
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.color = '#00543D';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.6';
                      e.currentTarget.style.color = '#003D2C';
                    }}
                  >
                    <MapPin size={14} />
                    Voir sur Google Maps
                  </a>
                </div>

                {/* Quest Run — I'm here (gated, per stop) */}
                {hasThreadSupport && activeRun && stop.nodeId && (
                  <div style={{ marginLeft: '48px', marginTop: 'var(--space-md)' }}>
                    {activeRun.visited[stop.nodeId] ? (
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#003D2C', opacity: 0.6 }}>
                        Stamped
                      </span>
                    ) : (index === 0 || (quete.stops[index - 1]?.nodeId && activeRun.visited[quete.stops[index - 1].nodeId!])) ? (
                      <button
                        type="button"
                        onClick={() => setWitnessStopIndex(index)}
                        style={{
                          padding: '8px 16px',
                          fontFamily: 'var(--font-sans)',
                          fontSize: 10,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#003D2C',
                          background: 'transparent',
                          border: '1px solid rgba(0,61,44,0.3)',
                          cursor: 'pointer'
                        }}
                      >
                        I'm here
                      </button>
                    ) : null}
                  </div>
                )}

                {/* Les Traces — Mémoire des marcheurs précédents */}
                <Traces
                  cardId={cardId}
                  questId={quete.id}
                  etapeId={`stop-${index}`}
                  etapeName={stop.name}
                />
              </div>
            ))}
          </div>

          {/* Quest Run — Close the walk (when all stamped) */}
          {hasThreadSupport && activeRun && allStamped && (
            <div style={{ marginTop: 'var(--space-xl)' }}>
              <button
                type="button"
                onClick={handleCloseWalk}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '14px 28px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#FAF8F2',
                  background: '#003D2C',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Close the walk
              </button>
            </div>
          )}
        </section>

        {/* Witness modal (photo or skip) */}
        {witnessStopIndex !== null && quete?.stops[witnessStopIndex]?.nodeId && activeRun && (
          <div
            role="dialog"
            aria-label="Add proof"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.2)',
              padding: 24
            }}
            onClick={() => setWitnessStopIndex(null)}
          >
            <div
              style={{
                background: '#FAF8F2',
                border: '1px solid rgba(0,61,44,0.15)',
                padding: 24,
                maxWidth: 320
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, marginBottom: 16 }}>
                Add proof (optional)
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && quete?.stops[witnessStopIndex]?.nodeId) {
                        handleStampNode(activeRun!.runId, quete.stops[witnessStopIndex].nodeId!, [`photo-${Date.now()}`]);
                      }
                      setWitnessStopIndex(null);
                    }}
                    style={{ fontSize: 12 }}
                  />
                  <span style={{ marginLeft: 8, fontSize: 11, textTransform: 'uppercase' }}>Photo</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (quete?.stops[witnessStopIndex]?.nodeId) {
                      handleStampNode(activeRun!.runId, quete.stops[witnessStopIndex].nodeId!);
                    }
                    setWitnessStopIndex(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    color: '#003D2C',
                    background: 'transparent',
                    border: '1px solid rgba(0,61,44,0.3)',
                    cursor: 'pointer'
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Micro-règle V1 */}
        <footer style={{ textAlign: 'center', paddingTop: 'var(--space-xxl)', borderTop: '1px solid #DBD4C6' }}>
          <p 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '14px',
              color: '#1A1A1A',
              opacity: 0.5,
              fontStyle: 'italic',
              marginBottom: 'var(--space-md)'
            }}
          >
            Un texte. Une marche. Un lien. Rien d'autre.
          </p>
          
          <p 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '12px',
              color: '#1A1A1A',
              opacity: 0.3,
              fontStyle: 'italic'
            }}
          >
            ARCHÉ — Petit Souvenir
          </p>
        </footer>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 768px) {
          .quete-detail-container {
            padding: var(--space-lg) !important;
            padding-top: 100px !important;
          }

          .quete-detail-container h1 {
            font-size: 36px !important;
          }
          
          .quete-detail-container h2 {
            font-size: 26px !important;
          }
          
          .quete-detail-container article p {
            font-size: 17px !important;
          }

          .quete-detail-container h3 {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
