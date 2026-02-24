import type { CityAxis } from '../types/axes';
import axesRaw from './dataset.json';

export const CITY_AXES: CityAxis[] = axesRaw as CityAxis[];

/**
 * Best-effort arrondissement mapping for axis anchor points.
 * Used to place subtle markers on the Le Champ map when the Axes layer is active.
 * Since axes span multiple arrondissements, we map to approximate arrondissement centers.
 */
const ANCHOR_ARRONDISSEMENT_MAP: Record<string, number> = {
  'Cour Carrée du Louvre': 1,
  'Arc de Triomphe du Carrousel': 1,
  'Central allée of Jardin des Tuileries': 1,
  'Obelisk at Place de la Concorde': 8,
  'Rond-Point des Champs-Élysées': 8,
  'Arc de Triomphe': 8,
  'Porte Maillot': 17,
  'Grande Arche de La Défense': 16,
  'Grande Arche rooftop terrace edge': 16,
  'Center of Pont d\'Iéna': 16,
  'Base of the Eiffel Tower north pillar': 7,
  'Square in front of Tour Montparnasse entrance': 15,
  'Main entrance threshold of Saint-Sulpice': 6,
  'Brass meridian line at the crossing of the transept': 6,
  'Base of the gnomon obelisk at the south end': 6,
  'Arago medallion near Parc Montsouris lake': 14,
  'Main gate of Paris Observatory courtyard': 14,
  'Arago medallion in Luxembourg Gardens near central lawn': 6,
  'Arago medallion near Saint-Sulpice square': 6,
  'Arago medallion in Montmartre near Moulin de la Galette garden': 18,
  'Middle of Pont Saint-Michel on the Left-Bank side': 5,
  'Square in front of the Sorbonne on Boulevard Saint-Michel': 5,
  'Intersection of Boulevard Saint-Michel and Boulevard de Port-Royal': 5,
  'Gate of Paris Observatory on Avenue de l\'Observatoire': 14,
  'Place des Abbesses center': 18,
  'Place du Tertre center': 18,
  'Middle of the parvis of Sacré-Cœur at the balustrade': 18,
  'Central axis of Sacré-Cœur terrace balustrade': 18,
  'Mass of Notre-Dame on Île de la Cité': 4,
  'Sidewalk on Pont d\'Austerlitz midspan': 5,
  'Eastern tip of Île Saint-Louis quay': 4,
  'Eastern tip of Île de la Cité quay below Notre-Dame': 4,
  'Middle of Pont Neuf upstream sidewalk': 1,
  'Sidewalk on Pont Alexandre III midspan': 7,
  'Sidewalk on Pont d\'Iéna facing upstream': 16,
  'Stone platform at the tip of Square du Vert-Galant': 1,
  'Center of Pont des Arts': 6,
  'Cour Carrée du Louvre central courtyard': 1,
  'Start of the central allée of the Tuileries Garden': 1,
  'South end of Petit Pont on the Left-Bank side': 5,
  'Intersection of Rue Saint-Jacques and Rue Galande': 5,
  'Square in front of Église Saint-Séverin': 5,
  'Intersection of Rue Saint-Jacques and Rue des Écoles': 5,
  'Place de l\'Estrapade center': 5,
  'Entrance square of Val-de-Grâce': 5,
  'Exact center beneath the Arc de Triomphe': 8,
  'Middle of Pont Saint-Michel on Left-Bank side': 5,
  'Boulevard Saint-Michel at Place Saint-Michel': 6,
  'Boulevard Saint-Michel at the Luxembourg Gardens gate': 6,
  'Avenue de l\'Observatoire central lawn edge': 14,
  'Gate of Paris Observatory': 14,
  'Main door of Paris Observatory central pavilion': 14,
  'Southern gate of Avenue de l\'Observatoire': 14,
  'Obelisk in Parc Montsouris near the lake': 14,
  'Arago medallion close to that obelisk': 14,
  'Main gate of Paris Observatory': 14,
  'Arago medallion near Luxembourg Gardens': 6,
  'Garden obelisk near Moulin de la Galette in Montmartre': 18,
  'Main terrace of Parc de Belleville viewpoint': 20,
  'High belvedere near the temple in Parc des Buttes-Chaumont': 19,
  'Central terrace in front of Sacré-Cœur': 18,
  'End of the platform at Square de l\'Île-de-France (eastern tip)': 4,
  'Center of the parvis Notre-Dame': 4,
  'Center of Place Dauphine': 1,
  'Middle of Pont Neuf at the western end of the island': 1,
};

export interface AxisAnchorOnMap {
  axisIndex: number;
  axisName: string;
  anchorName: string;
  arrondissement: number;
}

export function getAxisAnchorsOnMap(): AxisAnchorOnMap[] {
  const seen = new Set<string>();
  const result: AxisAnchorOnMap[] = [];
  CITY_AXES.forEach((axis, axisIndex) => {
    axis.anchor_points.forEach(anchor => {
      const arr = ANCHOR_ARRONDISSEMENT_MAP[anchor];
      if (!arr) return;
      const key = `${axisIndex}-${arr}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push({ axisIndex, axisName: axis.name, anchorName: anchor, arrondissement: arr });
    });
  });
  return result;
}
