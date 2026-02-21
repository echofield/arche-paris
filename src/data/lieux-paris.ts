/**
 * ARCHÉ — Paris lieux for Mon Paris instrument layer.
 * Declarative dataset: id, name, coordinates, poeticLine, arrondissement.
 * Used by InstrumentReadingLayer for quiet → reading → interpretation flow.
 */

export interface Lieu {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  poeticLine: string;
  arrondissement: string;
}

export const LIEUX_PARIS: Lieu[] = [
  {
    id: 'passage-panoramas',
    name: 'Passage des Panoramas',
    coordinates: { lat: 48.8719, lng: 2.3416 },
    poeticLine: 'Une artère de verre et de fer où le temps se plie.',
    arrondissement: '2e',
  },
  {
    id: 'galerie-vivienne',
    name: 'Galerie Vivienne',
    coordinates: { lat: 48.8687, lng: 2.3394 },
    poeticLine: 'Mosaïques et rotonde, un salon de pierre sous le ciel.',
    arrondissement: '2e',
  },
  {
    id: 'place-des-vosges',
    name: 'Place des Vosges',
    coordinates: { lat: 48.8555, lng: 2.3658 },
    poeticLine: 'Un carré parfait de brique et de pierre, suspendu hors du temps.',
    arrondissement: '4e',
  },
  {
    id: 'rue-mouffetard',
    name: 'Rue Mouffetard',
    coordinates: { lat: 48.8422, lng: 2.3493 },
    poeticLine: 'La plus vieille rue de Paris, où chaque pavé garde un secret.',
    arrondissement: '5e',
  },
  {
    id: 'jardin-luxembourg',
    name: 'Jardin du Luxembourg',
    coordinates: { lat: 48.8462, lng: 2.3372 },
    poeticLine: 'Un théâtre de verdure où chaque banc est une scène.',
    arrondissement: '6e',
  },
  {
    id: 'palais-royal-jardins',
    name: 'Jardins du Palais-Royal',
    coordinates: { lat: 48.8631, lng: 2.3364 },
    poeticLine: 'Un carré de silence au cœur du tumulte, gardé par des colonnes.',
    arrondissement: '1er',
  },
  {
    id: 'sacre-coeur-parvis',
    name: 'Parvis du Sacré-Cœur',
    coordinates: { lat: 48.8867, lng: 2.3431 },
    poeticLine: 'Le balcon blanc de Paris, où la ville s\'étale comme une maquette.',
    arrondissement: '18e',
  },
  {
    id: 'arenes-de-lutece',
    name: 'Arènes de Lutèce',
    coordinates: { lat: 48.8456, lng: 2.3526 },
    poeticLine: 'Un amphithéâtre romain caché derrière des immeubles haussmanniens.',
    arrondissement: '5e',
  },
  {
    id: 'square-vert-galant',
    name: 'Square du Vert-Galant',
    coordinates: { lat: 48.857, lng: 2.3414 },
    poeticLine: 'La proue de l\'île, un navire de pierre ancré dans la Seine.',
    arrondissement: '1er',
  },
  {
    id: 'passage-jouffroy',
    name: 'Passage Jouffroy',
    coordinates: { lat: 48.8718, lng: 2.3427 },
    poeticLine: 'Cannes anciennes, poupées de cire, et l\'odeur du bois ciré.',
    arrondissement: '9e',
  },
];
