/**
 * build-fundraising-csv.js
 *
 * Parses the Strategic Fundraising Report into canonical CSV format.
 * These are fundraising prospects (bucket: 'fundraising', economic_role: 'observer').
 *
 * Usage: node scripts/leads/build-fundraising-csv.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_CSV = path.join(__dirname, 'arche-fundraising-prospects.csv');
const OUTPUT_JSON = path.join(__dirname, 'arche-fundraising-prospects.json');

// ============================================================================
// NORMALIZATION HELPERS
// ============================================================================

function normalizeHandle(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .trim();
}

function normalizedName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

// ============================================================================
// FUNDRAISING DATA (from Strategic Fundraising Report)
// ============================================================================

// ASK TIERS -> scores
function tierToScores(tier) {
  // Tier 3 = 250k+ (highest)
  // Tier 2 = 50-150k
  // Tier 1 = 10-25k
  if (tier === 3) return { distribution_power: 95, fit_score: 90 };
  if (tier === 2) return { distribution_power: 80, fit_score: 75 };
  return { distribution_power: 65, fit_score: 60 };
}

// INDIVIDUALS (25)
const INDIVIDUALS = [
  // BUNDLE A: THE "IMPERIAL" BUILDERS
  { name: 'Laurent Dumas', profile: 'Président Groupe Emerige, Collectionneur art contemporain', bundle: 'Builders', thesis: 'Art contemporain, Éducation artistique, Jeunesse', vehicle: 'Fonds de dotation Emerige', contact: 'contact@groupe-emerige.com', angle: 'Le Passeport ARCHÉ est l\'outil de médiation culturelle qui manque à vos programmes "1 immeuble, 1 œuvre".', tier: 3 },
  { name: 'Xavier Lépine', profile: 'Vice-Président Fonds Grand Paris Express, Ex-La Française', bundle: 'Builders', thesis: 'Urbanisme culturel, Art espace public, Mobilité', vehicle: 'Fonds de dotation Grand Paris Express', contact: 'LinkedIn', angle: 'Ordo per motum est la définition même du Grand Paris Express.', tier: 2 },
  { name: 'Rémi Babinet', profile: 'Président Fonds GPE, Fondateur BETC', bundle: 'Builders', thesis: 'Créativité, Narration urbaine, Banlieues', vehicle: 'Fonds de dotation Grand Paris Express', contact: 'LinkedIn / BETC', angle: 'Le Passeport ARCHÉ est un asset de marque territoriale.', tier: 2 },
  { name: 'Michel Jaouën', profile: 'Président Association Axe Majeur (Cergy)', bundle: 'Builders', thesis: 'Art monumental, Architecture, Territoire', vehicle: 'Association Axe Majeur', contact: 'axe-majeur.info/contact', angle: 'L\'Axe Majeur est une ligne de force. ARCHÉ propose d\'étendre cette ligne symbolique.', tier: 1 },
  { name: 'Arthur Toscan du Plantier', profile: 'Directeur Stratégie Emerige, Président "1 immeuble, 1 œuvre"', bundle: 'Builders', thesis: 'Démocratisation culturelle, Lien Art/Immobilier', vehicle: 'Groupe Emerige', contact: 'LinkedIn', angle: 'Utiliser le Passeport comme livret d\'accueil culturel pour les résidents.', tier: 2 },
  { name: 'Alain Teitelbaum', profile: 'Ancien Président Axe Majeur, figure patrimoine local', bundle: 'Builders', thesis: 'Patrimoine local, Art urbain', vehicle: 'Association Axe Majeur', contact: 'axe-majeur.info/contact', angle: 'Votre héritage à l\'Axe Majeur prouve que l\'ordre architectural crée du lien social.', tier: 1 },

  // BUNDLE B: THE "AESTHETES"
  { name: 'Hélène David-Weill', profile: 'Présidente Honoraire MAD, Figure tutélaire mécénat parisien', bundle: 'Aesthetes', thesis: 'Arts Décoratifs, Excellence, Patrimoine', vehicle: 'Mécène individuel via MAD', contact: 'Courrier MAD 107 rue de Rivoli', angle: 'Le Passeport ARCHÉ, avec sa dorure et reliure d\'art, est un hommage vivant aux arts décoratifs.', tier: 3 },
  { name: 'Hubert Goldschmidt', profile: 'Grand Mécène MAD, Membre Cercle Arts Graphiques', bundle: 'Aesthetes', thesis: 'Arts graphiques, Papier, Dessin', vehicle: 'Comité International MAD', contact: 'LinkedIn / Friends of MAD', angle: 'En tant que protecteur des arts graphiques, soutenez un passeport imprimé selon les techniques de l\'Imprimerie Nationale.', tier: 2 },
  { name: 'Lionel Sauvage', profile: 'Président Cercle des Arts Graphiques (MAD)', bundle: 'Aesthetes', thesis: 'Bibliophilie, Estampe, Papier', vehicle: 'Cercle des Arts Graphiques', contact: 'LinkedIn / MAD', angle: 'ARCHÉ ne se contente pas de montrer le patrimoine, il l\'imprime.', tier: 2 },
  { name: 'Philippe Serrier', profile: 'Président des Amis de la Reliure d\'Art (ARA)', bundle: 'Aesthetes', thesis: 'Reliure d\'art, Dorure, Création contemporaine', vehicle: 'Association ARA France', contact: 'ara.france@wanadoo.fr', angle: 'Le Passeport ARCHÉ est un plaidoyer pour la reliure.', tier: 1 },
  { name: 'Aube Elléouët-Breton', profile: 'Fille d\'André Breton, Donatrice BnF', bundle: 'Aesthetes', thesis: 'Littérature, Surréalisme, Manuscrits', vehicle: 'Ayant-droit / Partenaire BnF', contact: 'Association Atelier André Breton', angle: 'La marche dans Paris était la méthode surréaliste. ARCHÉ réactive cette dérive urbaine.', tier: 1 },
  { name: 'Pierre-Alexis Dumas', profile: 'Directeur Artistique Hermès, CA MAD', bundle: 'Aesthetes', thesis: 'Métiers d\'art, Création, Transmission', vehicle: 'Fondation Hermès / Mécène personnel', contact: 'Siège Hermès Faubourg St-Honoré', angle: 'Le soin apporté à la dorure reflète les valeurs d\'Hermès.', tier: 2 },
  { name: 'Nicole Bru', profile: 'Mécène historique (Fondation Bru)', bundle: 'Aesthetes', thesis: 'Patrimoine, Musique, Restauration', vehicle: 'Fondation Bru', contact: 'fondation-bru.org/contact', angle: 'Comme le Palazzetto Bru Zane redonne vie à la musique romantique, ARCHÉ redonne vie aux parcours oubliés.', tier: 3 },

  // BUNDLE C: THE "REPUBLICAN SOCIALIZERS"
  { name: 'Marc Ladreit de Lacharrière', profile: 'Fondateur Fimalac', bundle: 'Republicans', thesis: 'Égalité des chances, Diversité, Culture pour tous', vehicle: 'Fondation Culture & Diversité', contact: 'fondationcultureetdiversite.org/contact', angle: 'Le Passeport ARCHÉ est un symbole d\'appartenance. Offrir ce passeport aux jeunes, c\'est leur donner le droit de cité.', tier: 3 },
  { name: 'Ariane de Rothschild', profile: 'Edmond de Rothschild Foundations', bundle: 'Republicans', thesis: 'Empowerment, Art de vivre, Impact social', vehicle: 'Edmond de Rothschild Foundations', contact: 'LinkedIn / edmondderothschildfoundations.org', angle: 'ARCHÉ est un projet d\'empowerment : transformer le flâneur passif en acteur de son patrimoine.', tier: 2 },
  { name: 'Floriane de Saint Pierre', profile: 'Présidente des Amis du Centre Pompidou', bundle: 'Republicans', thesis: 'Art contemporain, Philanthropie moderne', vehicle: 'Amis du Centre Pompidou / Ethics & Boards', contact: 'LinkedIn / Amis Pompidou', angle: 'Connecter la bibliophilie avec les codes de l\'art contemporain.', tier: 1 },
  { name: 'Jean-Jacques Aillagon', profile: 'Ancien Ministre, Président Fonds Concert Spirituel', bundle: 'Republicans', thesis: 'Patrimoine, Musique, Rayonnement', vehicle: 'Fonds de dotation du Concert Spirituel', contact: 'LinkedIn', angle: 'Un projet qui réconcilie l\'exigence républicaine (Ordre) et la dynamique culturelle (Mouvement).', tier: 1 },
  { name: 'Nathalie Mamane-Cohen', profile: 'Vice-Présidente Amis Pompidou', bundle: 'Republicans', thesis: 'Art contemporain, Collectionneurs', vehicle: 'Amis du Centre Pompidou', contact: 'LinkedIn', angle: 'Engager la nouvelle génération de collectionneurs avec un objet culte.', tier: 1 },
  { name: 'Pierre-André Maus', profile: 'Maus Frères (Lacoste), CA MAD', bundle: 'Republicans', thesis: 'Mode, Patrimoine, Art', vehicle: 'Mécène individuel / Groupe Maus', contact: 'Courrier via MAD', angle: 'Le Passeport comme accessoire d\'élégance intellectuelle.', tier: 2 },

  // BUNDLE D: THE "CORPORATE INNOVATORS"
  { name: 'Pascal Cagni', profile: 'Ambassadeur Investissements Internationaux, Grand Mécène MAD', bundle: 'Innovators', thesis: 'Tech, Attractivité France, Patrimoine', vehicle: 'Fondation Cagni', contact: 'LinkedIn / cagnifoundation.com', angle: 'ARCHÉ valorise la marque Paris. C\'est un outil de soft power.', tier: 2 },
  { name: 'Yves Guillemot', profile: 'PDG Ubisoft', bundle: 'Innovators', thesis: 'Tech, Patrimoine virtuel (Notre-Dame), Éducation', vehicle: 'Ubisoft / Mécène individuel', contact: 'LinkedIn / Ubisoft Corporate', angle: 'Gamifier le patrimoine parisien. Le Passeport est l\'interface physique d\'une quête culturelle.', tier: 3 },
  { name: 'Francis Kurkdjian', profile: 'Parfumeur, Mécène BnF', bundle: 'Innovators', thesis: 'Patrimoine sensoriel, Olfaction, Histoire', vehicle: 'Fonds de dotation Per Fumum', contact: 'franciskurkdjian.com/fonds-de-dotation', angle: 'Ajouter une dimension olfactive au Passeport pour une expérience multisensorielle.', tier: 1 },
  { name: 'Laurent Dassault', profile: 'Groupe Dassault, CA Amis Pompidou', bundle: 'Innovators', thesis: 'Art, Industrie, Patrimoine', vehicle: 'Groupe Dassault Art', contact: 'LinkedIn', angle: 'L\'excellence industrielle française au service de la culture.', tier: 2 },
  { name: 'Frédéric Jousset', profile: 'Fondateur Art Explora', bundle: 'Innovators', thesis: 'Mobilité culturelle, Innovation, Accès', vehicle: 'Fondation Art Explora', contact: 'LinkedIn / artexplora.org', angle: 'Vous avez mis l\'art sur un bateau; ARCHÉ met l\'art dans la poche.', tier: 2 },
  { name: 'Henri de Castries', profile: 'Président Institut Montaigne / Fondation Sommer', bundle: 'Innovators', thesis: 'Politique publique, Nature, Cohésion', vehicle: 'Fondation François Sommer', contact: 'Courrier Fondation François Sommer', angle: 'Ordo per motum : une vision libérale et ordonnée de la culture.', tier: 2 },
];

// STRUCTURES (30)
const STRUCTURES = [
  // CLUSTER 1: HERITAGE & CRAFT
  { name: 'Fondation Bettencourt Schueller', type: 'foundation', cluster: 'Heritage & Craft', criteria: 'Métiers d\'art (Intelligence de la main) & Chant Choral', calendar: 'Rolling. Prix: Jan-Mars', angle: 'Soumettre ARCHÉ dans l\'axe "Parcours" : valoriser la main (dorure, papier).', tier: 3 },
  { name: 'Fondation d\'entreprise Hermès', type: 'foundation', cluster: 'Heritage & Craft', criteria: 'Transmission des savoir-faire, biodiversité, arts de la scène', calendar: 'Sept (Manufacto/Bourses), Déc (Transforme)', angle: 'Manufacto : utiliser le Passeport comme support pédagogique pour initier aux métiers du livre.', tier: 3 },
  { name: 'Comité Colbert', type: 'association', cluster: 'Heritage & Craft', criteria: 'Promotion du luxe français, savoir-faire, rayonnement international', calendar: 'Ad-hoc (Partenariats stratégiques)', angle: 'Le Passeport comme Ambassadeur du savoir-faire français.', tier: 2 },
  { name: 'IN Groupe (Imprimerie Nationale)', type: 'enterprise', cluster: 'Heritage & Craft', criteria: 'Patrimoine écrit, typographie, identité. Mécénat de compétence', calendar: 'Rolling (Convention de partenariat)', angle: 'Mécénat de compétence : Produire le Passeport dans les ateliers de l\'Imprimerie Nationale.', tier: 0 },
  { name: 'Fondation du Patrimoine', type: 'foundation', cluster: 'Heritage & Craft', criteria: 'Restauration bâti, patrimoine de proximité, insertion', calendar: 'Rolling (Dépôt en ligne)', angle: 'Financement de la restauration d\'un site étape du parcours ARCHÉ.', tier: 1 },
  { name: 'Fondation Bru', type: 'foundation', cluster: 'Heritage & Craft', criteria: 'Musique, patrimoine, projets à long terme', calendar: 'Ad-hoc (Contact direct)', angle: 'Soutien structurel sur le volet "Mémoire" et histoire de Paris.', tier: 3 },
  { name: 'Amis de la Reliure d\'Art (ARA)', type: 'association', cluster: 'Heritage & Craft', criteria: 'Promotion de la reliure, bibliophilie', calendar: 'Rolling (Contact Bureau)', angle: 'Soutien technique et validation expert de la qualité bibliophilique.', tier: 1 },
  { name: 'Fondation François Sommer', type: 'foundation', cluster: 'Heritage & Craft', criteria: 'Nature, Culture, Chasse. Située dans le Marais', calendar: 'Jan/Fév (Appels culturels)', angle: 'Un chapitre "Nature dans la Ville" au sein du Passeport.', tier: 2 },
  { name: 'Fondation Mansart', type: 'foundation', cluster: 'Heritage & Craft', criteria: 'Conservation patrimoine, structure abritante', calendar: 'Rolling', angle: 'Partenaire institutionnel pour abriter un "Fonds ARCHÉ" et défiscaliser les dons IFI.', tier: 0 },
  { name: 'Crédit Agricole Ile-de-France Mécénat', type: 'enterprise', cluster: 'Heritage & Craft', criteria: 'Patrimoine francilien, musées, restauration', calendar: 'Mars & Octobre (Commissions)', angle: 'Financement de la restauration d\'un élément patrimonial intégré au parcours.', tier: 1 },

  // CLUSTER 2: CITY & TERRITORY
  { name: 'Fonds de dotation Emerige', type: 'foundation', cluster: 'City & Territory', criteria: 'Art contemporain, éducation jeunesse, "1 immeuble 1 œuvre"', calendar: 'Rolling (Contact mécénat)', angle: 'Distribution du Passeport aux enfants des écoles partenaires d\'Emerige.', tier: 2 },
  { name: 'Fonds de dotation Grand Paris Express', type: 'foundation', cluster: 'City & Territory', criteria: 'Art et mobilité, territoire du Grand Paris, innovation', calendar: 'Appels réguliers (Numérique/Art)', angle: 'Ordo per motum : étendre le parcours aux nouvelles gares du GPE.', tier: 2 },
  { name: 'Fondation Palladio', type: 'foundation', cluster: 'City & Territory', criteria: 'Construction ville de demain, recherche, inclusion', calendar: 'Novembre (Bourses/Prix)', angle: 'ARCHÉ comme outil de "soft city" : créer du lien social dans les quartiers denses.', tier: 1 },
  { name: 'Groupama Immobilier', type: 'enterprise', cluster: 'City & Territory', criteria: 'Valorisation actifs parisiens (Champs-Élysées), RSE', calendar: 'Ad-hoc (Budget RSE/Mécénat)', angle: 'Le Passeport comme cadeau de bienvenue exclusif pour locataires premium.', tier: 2 },
  { name: 'Fondation Colas', type: 'foundation', cluster: 'City & Territory', criteria: 'La Route, Art contemporain, peindre la route', calendar: 'Rolling', angle: 'ARCHÉ est un chemin. Commander une œuvre sur le thème du tracé urbain.', tier: 1 },
  { name: 'Fondation RATP', type: 'foundation', cluster: 'City & Territory', criteria: 'Mobilité, accès culture, territoire', calendar: 'Mars & Septembre', angle: 'Partenariat de visibilité dans le métro + financement volet mobilité.', tier: 1 },
  { name: 'Amis du Musée Carnavalet', type: 'association', cluster: 'City & Territory', criteria: 'Histoire de Paris, acquisitions', calendar: 'Ad-hoc (Bureau)', angle: 'Co-branding : Le Passeport devient le carnet de bord du visiteur de Carnavalet.', tier: 0 },
  { name: 'Fondation Eiffage', type: 'foundation', cluster: 'City & Territory', criteria: 'Insertion professionnelle, solidarité', calendar: 'Mars/Juin/Octobre', angle: 'Insertion des jeunes via les chantiers de restauration liés au projet.', tier: 1 },

  // CLUSTER 3: SOCIAL COHESION
  { name: 'Fondation BNP Paribas', type: 'foundation', cluster: 'Social Cohesion', criteria: 'Projet Banlieues, inclusion, culture (danse/jazz)', calendar: 'Mars/Avril (Appel Projet Banlieues)', angle: 'Le Passeport comme outil d\'inclusion pour les associations de quartier.', tier: 2 },
  { name: 'Fondation Culture & Diversité', type: 'foundation', cluster: 'Social Cohesion', criteria: 'Éducation artistique, Égalité des chances, cohésion', calendar: 'Rolling (Programmes partenariaux)', angle: 'Créer un "Stage ARCHÉ" pour les élèves de ZEP, validé par le Passeport.', tier: 2 },
  { name: 'Fondation Orange', type: 'foundation', cluster: 'Social Cohesion', criteria: 'Musique (classique/vocale), Autisme, Femmes, Numérique', calendar: 'Sept-Nov (Musical), Jan-Mars (Numérique)', angle: 'Volet numérique du Passeport (appli) ou volet musical.', tier: 2 },
  { name: 'Fondation SNCF', type: 'foundation', cluster: 'Social Cohesion', criteria: 'Faire ensemble, mobilité, lire/écrire', calendar: 'Janvier/Juin (Appels territoriaux)', angle: 'Le Passeport comme support d\'alphabétisation et découverte du territoire.', tier: 1 },
  { name: 'La France s\'engage', type: 'foundation', cluster: 'Social Cohesion', criteria: 'Innovation sociale, changement d\'échelle, impact', calendar: 'Janvier-Mars (Concours annuel)', angle: 'Si ARCHÉ a une méthodologie innovante de cohésion sociale duplicable.', tier: 3 },
  { name: 'Fondation Free', type: 'foundation', cluster: 'Social Cohesion', criteria: 'Inclusion numérique, open source, culture libre', calendar: 'Janvier & Juillet (Appels)', angle: 'Hacker le patrimoine : rendre les données culturelles accessibles via le Passeport numérique.', tier: 1 },
  { name: 'Fondation TotalEnergies', type: 'foundation', cluster: 'Social Cohesion', criteria: 'Jeunesse, dialogue des cultures, patrimoine', calendar: 'Rolling (Dépôt en ligne)', angle: 'Formation des jeunes aux métiers du patrimoine (restauration papier).', tier: 3 },

  // CLUSTER 4: ARTS & INNOVATION
  { name: 'Fondation Art Explora', type: 'foundation', cluster: 'Arts & Innovation', criteria: 'Mobilité culturelle, innovation, publics empêchés', calendar: 'Septembre (Prix Art Explora)', angle: 'Le Passeport est une exposition mobile. Candidater au Prix Européen.', tier: 2 },
  { name: 'Fondation Jan Michalski', type: 'foundation', cluster: 'Arts & Innovation', criteria: 'Littérature, écriture, bibliophilie (Suisse/France)', calendar: 'Printemps (Résidences), Rolling (Aides)', angle: 'Financer la commande de textes inédits d\'écrivains pour le Passeport.', tier: 1 },
  { name: 'Fondation La Poste', type: 'foundation', cluster: 'Arts & Innovation', criteria: 'Écriture, correspondance, lien social', calendar: 'Janvier/Septembre (Comités)', angle: 'L\'aspect épistolaire : le Passeport sert à écrire/envoyer des récits de Paris.', tier: 1 },
  { name: 'Ubisoft', type: 'enterprise', cluster: 'Arts & Innovation', criteria: 'Tech, Gaming, Histoire (Assassin\'s Creed)', calendar: 'Ad-hoc (Partenariats RSE/Culture)', angle: 'Gamification du parcours ARCHÉ. Réalité augmentée via le Passeport.', tier: 2 },
  { name: 'Deezer', type: 'enterprise', cluster: 'Arts & Innovation', criteria: 'Musique, Audio, Tech', calendar: 'Ad-hoc (Partenariats brand)', angle: 'Création d\'un Audio-Guide exclusif ou podcasts liés aux lieux du Passeport.', tier: 1 },
];

// ============================================================================
// BUILD LEADS
// ============================================================================

function buildNotes(item, isIndividual) {
  const parts = [];
  if (isIndividual) {
    if (item.profile) parts.push(`Profile: ${item.profile}`);
    if (item.thesis) parts.push(`Thesis: ${item.thesis}`);
    if (item.vehicle) parts.push(`Vehicle: ${item.vehicle}`);
    if (item.angle) parts.push(`Angle: ${item.angle}`);
    if (item.bundle) parts.push(`Bundle: ${item.bundle}`);
  } else {
    if (item.criteria) parts.push(`Criteria: ${item.criteria}`);
    if (item.calendar) parts.push(`Calendar: ${item.calendar}`);
    if (item.angle) parts.push(`Angle: ${item.angle}`);
    if (item.cluster) parts.push(`Cluster: ${item.cluster}`);
    if (item.type) parts.push(`Type: ${item.type}`);
  }
  parts.push(`Tier: ${item.tier}`);
  parts.push('Source: strategic-fundraising-report');
  return parts.join(' || ');
}

function buildLeads() {
  const leads = [];

  // Process individuals
  for (const ind of INDIVIDUALS) {
    const scores = tierToScores(ind.tier);
    leads.push({
      normalized_handle: normalizeHandle(ind.name),
      name: ind.name,
      normalized_name: normalizedName(ind.name),
      handle: normalizeHandle(ind.name),
      bucket: 'fundraising',
      economic_role: 'observer', // Not yet engaged
      activation_phase: ind.tier === 3 ? 1 : ind.tier === 2 ? 2 : 3,
      potential_tier: ind.tier === 3 ? 'high' : ind.tier === 2 ? 'med' : 'low',
      distribution_power: scores.distribution_power,
      fit_score: scores.fit_score,
      section: `Individual - ${ind.bundle}`,
      offer: ind.angle,
      contact: ind.contact || '',
      notes: buildNotes(ind, true),
    });
  }

  // Process structures
  for (const str of STRUCTURES) {
    const scores = tierToScores(str.tier);
    leads.push({
      normalized_handle: normalizeHandle(str.name),
      name: str.name,
      normalized_name: normalizedName(str.name),
      handle: normalizeHandle(str.name),
      bucket: 'fundraising',
      economic_role: 'observer', // Not yet engaged
      activation_phase: str.tier === 3 ? 1 : str.tier === 2 ? 2 : str.tier === 1 ? 3 : 4,
      potential_tier: str.tier === 3 ? 'high' : str.tier === 2 ? 'med' : str.tier === 1 ? 'low' : 'watch',
      distribution_power: scores.distribution_power,
      fit_score: scores.fit_score,
      section: `Structure - ${str.cluster}`,
      offer: str.angle,
      contact: str.calendar || '',
      notes: buildNotes(str, false),
    });
  }

  return leads;
}

// ============================================================================
// CSV OUTPUT
// ============================================================================

const CSV_HEADERS = [
  'normalized_handle',
  'name',
  'normalized_name',
  'handle',
  'bucket',
  'economic_role',
  'activation_phase',
  'potential_tier',
  'distribution_power',
  'fit_score',
  'section',
  'offer',
  'notes',
];

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function leadsToCSV(leads) {
  const rows = [CSV_HEADERS.join(',')];
  for (const lead of leads) {
    const row = CSV_HEADERS.map((header) => escapeCSV(lead[header]));
    rows.push(row.join(','));
  }
  return rows.join('\n');
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('🎯 ARCHÉ Fundraising Prospects Builder');
  console.log('='.repeat(50));
  console.log('');

  const leads = buildLeads();
  console.log(`📊 Generated ${leads.length} fundraising prospects`);
  console.log(`   - ${INDIVIDUALS.length} Individuals`);
  console.log(`   - ${STRUCTURES.length} Structures`);

  // Sort by tier (highest first)
  leads.sort((a, b) => {
    if (a.activation_phase !== b.activation_phase) return a.activation_phase - b.activation_phase;
    return a.name.localeCompare(b.name);
  });

  // Write CSV
  const csv = leadsToCSV(leads);
  fs.writeFileSync(OUTPUT_CSV, csv, 'utf-8');
  console.log(`\n✅ CSV written: ${OUTPUT_CSV}`);

  // Write JSON
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(leads, null, 2), 'utf-8');
  console.log(`✅ JSON written: ${OUTPUT_JSON}`);

  // Summary by tier
  console.log('\n📊 Summary by Tier:');
  const byTier = {};
  for (const lead of leads) {
    const key = lead.potential_tier;
    byTier[key] = (byTier[key] || 0) + 1;
  }
  for (const [tier, count] of Object.entries(byTier).sort()) {
    console.log(`   ${tier}: ${count} prospect(s)`);
  }

  // Summary by section
  console.log('\n📊 Summary by Section:');
  const bySection = {};
  for (const lead of leads) {
    const key = lead.section.split(' - ')[0];
    bySection[key] = (bySection[key] || 0) + 1;
  }
  for (const [section, count] of Object.entries(bySection).sort()) {
    console.log(`   ${section}: ${count} prospect(s)`);
  }

  return leads;
}

if (require.main === module) {
  main();
}

module.exports = { main, buildLeads };
