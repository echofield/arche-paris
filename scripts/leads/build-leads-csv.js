/**
 * build-leads-csv.js
 *
 * CANONICAL SOURCE OF TRUTH for ARCHÉ leads.
 *
 * This script:
 * 1. Parses the Constellation OPÉR document (18 leads)
 * 2. Merges the Strategic Partnership PDF leads (30 creators)
 * 3. Deduplicates by normalized_handle (keeps strongest priority)
 * 4. Outputs a canonical CSV that the ingest script reads
 *
 * The CSV format is machine-readable with structured notes:
 *   Offer: ... || Phase: N || Section: ... || Potential: high|med|low|watch
 *
 * Usage: node scripts/leads/build-leads-csv.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONSTELLATION_DOC = 'C:\\Users\\echof\\Desktop\\leads\\Arché\\selection\\🌐 CONSTELLATION ARCHÉ — LISTE OPÉR.txt';
const OUTPUT_CSV = path.join(__dirname, 'arche-leads-canonical.csv');
const OUTPUT_JSON = path.join(__dirname, 'arche-leads-canonical.json');

// ============================================================================
// NORMALIZATION HELPERS
// ============================================================================

/**
 * Normalize handle: lowercase, strip @, keep alphanumeric + underscore + dot
 */
function normalizeHandle(handle) {
  if (!handle) return '';
  return handle
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9_.-]/g, '')
    .trim();
}

/**
 * Normalize name for DB: lowercase, no diacritics, spaces→underscores
 */
function normalizedName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Convert handle to display name: snake_case/dots → Title Case
 */
function handleToDisplayName(handle) {
  if (!handle) return '';
  return handle
    .replace(/^@/, '')
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// ============================================================================
// BUCKET MAPPING
// ============================================================================

const SECTION_TO_BUCKET = {
  // Constellation sections
  'DÉCLENCHEURS': 'creators',
  'NARRATEURS': 'creators',
  'CRÉATEURS': 'creators',
  'GUIDES': 'guides',
  'MONÉTISATION': 'guides',
  'ESTHÉTIQUE': 'experience_studios',
  'LIFESTYLE': 'experience_studios',
  'CULTURE OFFICIELLE': 'other',
  'AMPLIFICATEURS': 'other',
  'ÉCOSYSTÈME': 'other',
  // PDF tiers
  'AESTHETES': 'creators',
  'CURATORS': 'creators',
  'DISCOVERERS': 'creators',
  'TIER A': 'creators',
  'TIER B': 'creators',
  'TIER C': 'creators',
};

function sectionToBucket(section) {
  if (!section) return 'other';
  const upper = section.toUpperCase();
  for (const [key, bucket] of Object.entries(SECTION_TO_BUCKET)) {
    if (upper.includes(key)) return bucket;
  }
  return 'other';
}

// ============================================================================
// POTENTIAL SCORING (simple, honest, consistent)
// ============================================================================

/**
 * Phase → potential tier mapping
 * 1 = high (immediate priority)
 * 2 = med (build credibility)
 * 3 = low (monetization phase)
 * 4 = watch (institutional, later)
 * null = unassigned
 */
function phaseToPotentialTier(phase) {
  if (phase === 1) return 'high';
  if (phase === 2) return 'med';
  if (phase === 3) return 'low';
  if (phase === 4) return 'watch';
  return 'unassigned';
}

/**
 * Coarse scores from phase (not fake precision)
 */
function phaseToScores(phase) {
  // distribution_power, fit_score
  if (phase === 1) return { distribution_power: 90, fit_score: 85 };
  if (phase === 2) return { distribution_power: 75, fit_score: 70 };
  if (phase === 3) return { distribution_power: 60, fit_score: 55 };
  if (phase === 4) return { distribution_power: 45, fit_score: 40 };
  return { distribution_power: 50, fit_score: 50 }; // unassigned
}

/**
 * Brand fit score from PDF → phase mapping
 */
function brandFitToPhase(brandFit) {
  if (!brandFit) return null;
  const score = parseInt(brandFit, 10);
  if (score >= 90) return 1;
  if (score >= 80) return 2;
  if (score >= 70) return 3;
  return 4;
}

// ============================================================================
// MACHINE-READABLE NOTES FORMAT
// ============================================================================

/**
 * Build structured notes: Offer: ... || Phase: N || Section: ... || Potential: high
 */
function buildNotes(lead) {
  const parts = [];
  if (lead.offer) parts.push(`Offer: ${lead.offer}`);
  if (lead.activation_phase) parts.push(`Phase: ${lead.activation_phase}`);
  if (lead.section) parts.push(`Section: ${lead.section}`);
  if (lead.potential_tier) parts.push(`Potential: ${lead.potential_tier}`);
  if (lead.also_in && lead.also_in.length > 0) {
    parts.push(`Also in: ${lead.also_in.join(', ')}`);
  }
  if (lead.source) parts.push(`Source: ${lead.source}`);
  return parts.join(' || ');
}

// ============================================================================
// PARSE CONSTELLATION DOCUMENT
// ============================================================================

function parseConstellationDoc(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Constellation doc not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map((l) => l.trim());

  const leads = new Map(); // normalized_handle -> lead
  const phaseMap = {}; // handle -> phase from "ordre réel d'activation"

  let currentSection = null;
  let lastHandle = null;
  let inActivationOrder = false;
  let currentPhase = null;

  for (const line of lines) {
    // Detect activation order section
    if (line.toLowerCase().includes('ordre') && line.toLowerCase().includes('activation')) {
      inActivationOrder = true;
      continue;
    }

    // Parse phases in activation order
    if (inActivationOrder) {
      const phaseMatch = line.match(/^Phase\s+(\d)/i);
      if (phaseMatch) {
        currentPhase = parseInt(phaseMatch[1], 10);
        continue;
      }
      // Handle names (no @)
      if (currentPhase && line && !line.startsWith('🔥') && !line.startsWith('Si ') &&
          !line.startsWith('➡️') && !line.startsWith('Et là') && !line.includes('—') &&
          !line.includes('👉') && line.length < 50) {
        const handle = normalizeHandle(line);
        if (handle && handle.length > 2) {
          phaseMap[handle] = currentPhase;
        }
      }
      continue;
    }

    // Detect section headers
    const sectionMatch = line.match(/^[🜂🜁🜃🜄🜔🧠⚡]\s*([IVX]+)\s*[—-]\s*(.+)$/u);
    if (sectionMatch) {
      currentSection = sectionMatch[2].trim();
      continue;
    }

    // Detect @handle
    const handleMatch = line.match(/^@([a-z0-9_.-]+)/i);
    if (handleMatch) {
      const rawHandle = handleMatch[1];
      const normHandle = normalizeHandle(rawHandle);
      lastHandle = normHandle;

      if (!leads.has(normHandle)) {
        leads.set(normHandle, {
          handle: normHandle,
          name: handleToDisplayName(rawHandle),
          section: currentSection,
          offer: null,
          source: 'constellation',
          also_in: [],
        });
      } else {
        // Track that this handle appears in multiple sections
        const existing = leads.get(normHandle);
        if (currentSection && !existing.also_in.includes(currentSection)) {
          existing.also_in.push(currentSection);
        }
      }
      continue;
    }

    // Value prop line (offer)
    if (lastHandle && line && !line.startsWith('@') && !line.startsWith('(') &&
        !line.match(/^[🜂🜁🜃🜄🜔🧠⚡]/u)) {
      const lead = leads.get(lastHandle);
      if (lead && !lead.offer) {
        const offer = line.replace(/^→\s*/, '').trim();
        if (offer && offer.length > 3) {
          lead.offer = offer;
        }
      }
    }

    // Empty line resets context
    if (!line) lastHandle = null;
  }

  // Merge phase data and compute scores
  const result = [];
  for (const [normHandle, lead] of leads.entries()) {
    // Try to find phase (with and without special chars)
    const phase = phaseMap[normHandle] || phaseMap[normHandle.replace(/[._-]/g, '')] || null;
    const scores = phaseToScores(phase);

    result.push({
      ...lead,
      normalized_handle: normHandle,
      normalized_name: normalizedName(lead.name),
      bucket: sectionToBucket(lead.section),
      economic_role: 'partner',
      activation_phase: phase,
      potential_tier: phaseToPotentialTier(phase),
      ...scores,
    });
  }

  return result;
}

// ============================================================================
// PDF STRATEGIC PARTNERSHIP LEADS (embedded data from user)
// ============================================================================

const PDF_LEADS = [
  // Tier A: The Parisian Aesthetes (Top 10)
  { handle: 'ruerodier', name: 'Marissa Cox', section: 'Tier A: Aesthetes', offer: 'Interior Design, Quiet Luxury Lifestyle, Parisian Living. Substack + Sourcing Service.', brand_fit: 98 },
  { handle: 'pariswithlanden', name: 'Landen Kerr', section: 'Tier A: Aesthetes', offer: 'Luxury Travel Advisor, Romantic Paris, Old Money Aesthetic. Bespoke Travel Planning.', brand_fit: 96 },
  { handle: 'everydayparisian', name: 'Rebecca Plotnick', section: 'Tier A: Aesthetes', offer: 'Photography, Solo Travel, Parisian Daily Life. Print Shop + Guides.', brand_fit: 95 },
  { handle: 'lolitaolympia', name: 'Lolita Olympia', section: 'Tier A: Aesthetes', offer: 'Slow Living, Gen Z Aesthetic, Ceramics/Art, Vlog. 177K YouTube.', brand_fit: 94 },
  { handle: 'paris_photographer', name: 'Daria Lorman', section: 'Tier A: Aesthetes', offer: 'Fine Art Wedding Photography, Elopements. Presets + Packages.', brand_fit: 93 },
  { handle: 'hellofrenchnyc', name: 'Cécilia Jourdan', section: 'Tier A: Aesthetes', offer: 'Language Learning, Cultural Education. Paris Bundle ($70).', brand_fit: 92 },
  { handle: 'mollyjwilk', name: 'Molly J. Wilk', section: 'Tier A: Aesthetes', offer: 'Pastry Chef, Versailles Expert. Guides + Classes.', brand_fit: 91 },
  { handle: 'deareverest', name: 'Katie Donnelly', section: 'Tier A: Aesthetes', offer: 'Family Photography, Romantic/Melancholic Aesthetic. See My Paris collective.', brand_fit: 90 },
  { handle: 'leiasfez', name: 'Leia Sfez', section: 'Tier A: Aesthetes', offer: 'High Fashion, Parisian Mom, Minimalist Style. Brand collabs (Chanel).', brand_fit: 89 },
  { handle: 'annakloots', name: 'Anna Kloots', section: 'Tier A: Aesthetes', offer: 'Expat Life, Travel Writer. NYT Bestselling Author. Paris Comme Moi ($28).', brand_fit: 88 },

  // Tier B: The Niche Curators (Next 10)
  { handle: 'sharonsantoni', name: 'Sharon Santoni', section: 'Tier B: Curators', offer: 'Antiques, Luxury Countryside, Art de Vivre. Magazine + Tours.', brand_fit: 87 },
  { handle: 'solosophie', name: 'Sophie Nadeau', section: 'Tier B: Curators', offer: 'History, Solo Travel, Culture. E-books + Blog.', brand_fit: 86 },
  { handle: 'lostncheeseland', name: 'Lindsey Tramuta', section: 'Tier B: Curators', offer: 'Food, Culture, The New Paris. Author of The New Parisienne.', brand_fit: 85 },
  { handle: 'jayswanson', name: 'Jay Swanson', section: 'Tier B: Curators', offer: 'Expat Vlogger, Paris in My Pocket. Patreon + Guides.', brand_fit: 84 },
  { handle: 'messynessychic', name: 'Vanessa Grall', section: 'Tier B: Curators', offer: 'Oddities, History, Don\'t be a Tourist. Books + Membership.', brand_fit: 83 },
  { handle: 'thepineapplechef', name: 'Elise Dumas', section: 'Tier B: Curators', offer: 'Food Photography, Aesthetics. Stylist + Prints.', brand_fit: 82 },
  { handle: 'theparisphotographer', name: 'Pierre Torset', section: 'Tier B: Curators', offer: 'Proposals, Couples Photography. Photo Packages.', brand_fit: 81 },
  { handle: 'gaby_hafner', name: 'Gaby Hafner', section: 'Tier B: Curators', offer: 'Practical Travel Planning, Google Maps. Gluten-Free Paris.', brand_fit: 80 },
  { handle: 'kelseyinlondon', name: 'Kelsey', section: 'Tier B: Curators', offer: 'Travel Photography, Instagrammable Spots. Guides + Presets.', brand_fit: 79 },
  { handle: 'pictoursparis', name: 'Lindsey Kent', section: 'Tier B: Curators', offer: 'Family Photography, American Expats. Owns Zia cafe.', brand_fit: 78 },

  // Tier C: The Viral Discoverers (Next 10)
  { handle: 'lesfrenchiestravel', name: 'Les Frenchies', section: 'Tier C: Discoverers', offer: 'Food Tours, Budget Tips, Couple Travel. YouTube/TikTok.', brand_fit: 77 },
  { handle: 'americanfille', name: 'Amanda Rollins', section: 'Tier C: Discoverers', offer: 'Expat Real Talk, Solo Female Safety. TikTok.', brand_fit: 76 },
  { handle: 'florindefrance', name: 'Florin Defrance', section: 'Tier C: Discoverers', offer: 'Hidden Gems, French Culture. High engagement.', brand_fit: 75 },
  { handle: 'sarahfreia', name: 'Sarah Freia', section: 'Tier C: Discoverers', offer: 'Cafe Reviews, Aesthetic Spots. Best Aesthetic Cafes lists.', brand_fit: 74 },
  { handle: 'parisperfect', name: 'Emily Jackson', section: 'Tier C: Discoverers', offer: 'Luxury Rentals, 7th Arrondissement. B2B potential.', brand_fit: 73 },
  { handle: 'thedailybreeze_', name: 'Lina', section: 'Tier C: Discoverers', offer: 'Micro-influencer, Aesthetic lifestyle. Morning Coffee Walk.', brand_fit: 72 },
  { handle: 'myparisianlife', name: 'Yanique', section: 'Tier C: Discoverers', offer: 'Family, Kids in Paris. Long-time blogger.', brand_fit: 71 },
  { handle: 'sara_rouihem', name: 'Sarah Rouihem', section: 'Tier C: Discoverers', offer: 'Fashion/Lifestyle. Fast response on Collabstr.', brand_fit: 70 },
  { handle: 'emelinehk', name: 'Emeline', section: 'Tier C: Discoverers', offer: 'Alternative/Gothic Aesthetic. Dark Paris niche.', brand_fit: 68 },
  { handle: 'maevaeatsbooks', name: 'Maeva Glemarec', section: 'Tier C: Discoverers', offer: 'Dark Academia, Books. Bookshop Tour potential.', brand_fit: 67 },
];

function parsePdfLeads() {
  return PDF_LEADS.map((lead) => {
    const normHandle = normalizeHandle(lead.handle);
    const phase = brandFitToPhase(lead.brand_fit);
    const scores = phaseToScores(phase);

    return {
      handle: normHandle,
      normalized_handle: normHandle,
      name: lead.name,
      normalized_name: normalizedName(lead.name),
      section: lead.section,
      offer: lead.offer,
      bucket: sectionToBucket(lead.section),
      economic_role: 'partner',
      activation_phase: phase,
      potential_tier: phaseToPotentialTier(phase),
      source: 'strategic-pdf',
      also_in: [],
      ...scores,
    };
  });
}

// ============================================================================
// DEDUPLICATION & MERGING
// ============================================================================

/**
 * Merge leads, keeping strongest priority (lowest phase number wins)
 */
function mergeLeads(constellationLeads, pdfLeads) {
  const merged = new Map(); // normalized_handle -> lead

  // Add constellation leads first (they have primary activation phases)
  for (const lead of constellationLeads) {
    merged.set(lead.normalized_handle, lead);
  }

  // Merge PDF leads
  for (const lead of pdfLeads) {
    const normHandle = lead.normalized_handle;

    if (merged.has(normHandle)) {
      // Duplicate! Keep strongest priority
      const existing = merged.get(normHandle);

      // Track the merge
      if (!existing.also_in.includes(lead.section)) {
        existing.also_in.push(lead.section);
      }

      // Keep lowest phase (highest priority)
      if (lead.activation_phase !== null &&
          (existing.activation_phase === null || lead.activation_phase < existing.activation_phase)) {
        existing.activation_phase = lead.activation_phase;
        existing.potential_tier = lead.potential_tier;
        existing.distribution_power = lead.distribution_power;
        existing.fit_score = lead.fit_score;
      }

      // Prefer longer/better offer
      if (lead.offer && (!existing.offer || lead.offer.length > existing.offer.length)) {
        existing.offer = lead.offer;
      }

      // Note the merge source
      if (!existing.source.includes('strategic-pdf')) {
        existing.source += '+strategic-pdf';
      }
    } else {
      // New lead
      merged.set(normHandle, lead);
    }
  }

  return Array.from(merged.values());
}

// ============================================================================
// CSV OUTPUT (CANONICAL FORMAT)
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
    const notes = buildNotes(lead);
    const row = CSV_HEADERS.map((header) => {
      if (header === 'notes') return escapeCSV(notes);
      if (header === 'also_in') return escapeCSV((lead.also_in || []).join('; '));
      return escapeCSV(lead[header]);
    });
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('🔧 ARCHÉ Leads Builder — Canonical CSV Generator');
  console.log('='.repeat(55));
  console.log('');

  // Parse constellation document
  console.log('📄 Parsing Constellation OPÉR document...');
  const constellationLeads = parseConstellationDoc(CONSTELLATION_DOC);
  console.log(`   Found ${constellationLeads.length} leads`);

  // Parse PDF leads
  console.log('📄 Loading Strategic Partnership PDF leads...');
  const pdfLeads = parsePdfLeads();
  console.log(`   Found ${pdfLeads.length} leads`);

  // Merge with deduplication
  console.log('🔗 Merging and deduplicating...');
  const allLeads = mergeLeads(constellationLeads, pdfLeads);
  console.log(`   Total unique leads: ${allLeads.length}`);

  // Sort by phase (assigned first), then by name
  allLeads.sort((a, b) => {
    // Phase assigned beats unassigned
    if (a.activation_phase && !b.activation_phase) return -1;
    if (!a.activation_phase && b.activation_phase) return 1;
    // Lower phase (higher priority) first
    if (a.activation_phase && b.activation_phase) {
      if (a.activation_phase !== b.activation_phase) return a.activation_phase - b.activation_phase;
    }
    // Then alphabetically by name
    return (a.name || '').localeCompare(b.name || '');
  });

  // Write CSV (source of truth)
  const csv = leadsToCSV(allLeads);
  fs.writeFileSync(OUTPUT_CSV, csv, 'utf-8');
  console.log(`\n✅ Canonical CSV written: ${OUTPUT_CSV}`);

  // Write JSON (for reference)
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allLeads, null, 2), 'utf-8');
  console.log(`✅ JSON reference written: ${OUTPUT_JSON}`);

  // Summary
  console.log('\n📊 Summary by activation phase:');
  const byPhase = {};
  for (const lead of allLeads) {
    const key = lead.activation_phase || 'unassigned';
    byPhase[key] = (byPhase[key] || 0) + 1;
  }
  for (const [phase, count] of Object.entries(byPhase).sort()) {
    const tier = phaseToPotentialTier(phase === 'unassigned' ? null : parseInt(phase));
    console.log(`   Phase ${phase} (${tier}): ${count} lead(s)`);
  }

  console.log('\n📊 Summary by bucket:');
  const byBucket = {};
  for (const lead of allLeads) {
    byBucket[lead.bucket] = (byBucket[lead.bucket] || 0) + 1;
  }
  for (const [bucket, count] of Object.entries(byBucket).sort()) {
    console.log(`   ${bucket}: ${count} lead(s)`);
  }

  console.log('\n📊 Summary by source:');
  const bySource = {};
  for (const lead of allLeads) {
    bySource[lead.source] = (bySource[lead.source] || 0) + 1;
  }
  for (const [source, count] of Object.entries(bySource).sort()) {
    console.log(`   ${source}: ${count} lead(s)`);
  }

  // Show duplicates that were merged
  const duplicates = allLeads.filter((l) => l.also_in && l.also_in.length > 0);
  if (duplicates.length > 0) {
    console.log(`\n🔗 Merged duplicates (${duplicates.length}):`);
    for (const d of duplicates) {
      console.log(`   @${d.handle}: also in ${d.also_in.join(', ')}`);
    }
  }

  return allLeads;
}

if (require.main === module) {
  main();
}

module.exports = { main, mergeLeads, leadsToCSV };
