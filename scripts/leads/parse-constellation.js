/**
 * parse-constellation.js
 *
 * Parses the CONSTELLATION ARCHÉ document and extracts leads with:
 * - handle (@ stripped)
 * - name (derived from handle)
 * - section (roman numeral section name)
 * - value_prop (the one-line offer)
 * - activation_phase (1-4 from the activation order)
 * - bucket (mapped from section)
 *
 * Outputs:
 *   - arche-constellation-leads.json (structured data)
 *   - arche-constellation-leads.csv (for transparency/reimport)
 *
 * Usage: node scripts/leads/parse-constellation.js [path-to-doc]
 */

const fs = require('fs');
const path = require('path');

// Default path to the constellation document
const DEFAULT_DOC_PATH = 'C:\\Users\\echof\\Desktop\\leads\\Arché\\selection\\🌐 CONSTELLATION ARCHÉ — LISTE OPÉR.txt';

// Section mapping to bucket enum
const SECTION_TO_BUCKET = {
  'DÉCLENCHEURS': 'creators',
  'NARRATEURS CULTURELS': 'creators',
  'GUIDES': 'guides',
  'MONÉTISATION': 'guides',
  'ESTHÉTIQUE': 'experience_studios',
  'LIFESTYLE': 'experience_studios',
  'CULTURE OFFICIELLE': 'other',
  'AMPLIFICATEURS': 'other',
  'CRÉATEURS TRANSVERSAUX': 'creators',
  'ÉCOSYSTÈME': 'other',
};

function sectionToBucket(section) {
  if (!section) return 'other';
  const upper = section.toUpperCase();
  for (const [key, bucket] of Object.entries(SECTION_TO_BUCKET)) {
    if (upper.includes(key)) return bucket;
  }
  return 'other';
}

function handleToDisplayName(handle) {
  // Convert snake_case or dot-separated to Title Case
  return handle
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function parseConstellationDocument(content) {
  const lines = content.split('\n').map((l) => l.trim());
  const leads = new Map(); // handle -> lead data (deduplicated)
  const phaseMap = {}; // handle -> phase number

  let currentSection = null;
  let currentSectionRoman = null;
  let lastHandle = null;
  let inActivationOrder = false;
  let currentPhase = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect activation order section
    if (line.includes("Ordre réel d'activation") || line.toLowerCase().includes("ordre")) {
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
      // Handle in activation order (no @, just the name)
      if (currentPhase && line && !line.startsWith('🔥') && !line.startsWith('Si ') && !line.startsWith('➡️') && !line.startsWith('Et là') && !line.includes('—')) {
        const handle = line.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
        if (handle && handle.length > 2) {
          phaseMap[handle] = currentPhase;
        }
      }
      continue;
    }

    // Detect section headers (🜂 I — LES DÉCLENCHEURS, etc.)
    const sectionMatch = line.match(/^[🜂🜁🜃🜄🜔🧠⚡]\s*([IVX]+)\s*—\s*(.+)$/u);
    if (sectionMatch) {
      currentSectionRoman = sectionMatch[1];
      currentSection = sectionMatch[2].trim();
      continue;
    }

    // Detect @handle
    const handleMatch = line.match(/^@([a-z0-9_.-]+)/i);
    if (handleMatch) {
      const handle = handleMatch[1].toLowerCase();
      lastHandle = handle;

      // Initialize lead if not exists
      if (!leads.has(handle)) {
        leads.set(handle, {
          handle,
          name: handleToDisplayName(handle),
          section: currentSection,
          section_roman: currentSectionRoman,
          value_prop: null,
          bucket: sectionToBucket(currentSection),
        });
      }
      continue;
    }

    // Value prop line (after handle, non-empty, not a section header)
    if (lastHandle && line && !line.startsWith('@') && !line.startsWith('(') && !line.match(/^[🜂🜁🜃🜄🜔🧠⚡]/u)) {
      const lead = leads.get(lastHandle);
      if (lead && !lead.value_prop) {
        // Clean up the line: remove leading → and extra whitespace
        let valueProp = line.replace(/^→\s*/, '').trim();
        if (valueProp) {
          lead.value_prop = valueProp;
        }
      }
      // Don't reset lastHandle - there might be multiple value prop lines
    }

    // Empty line resets lastHandle context
    if (!line) {
      lastHandle = null;
    }
  }

  // Merge phase data
  const result = [];
  for (const [handle, lead] of leads.entries()) {
    const phase = phaseMap[handle] || phaseMap[handle.replace(/[._]/g, '')] || null;
    result.push({
      ...lead,
      activation_phase: phase,
      // Compute potential score based on phase (higher phase = lower priority)
      distribution_power: phase ? Math.round(100 - (phase - 1) * 20) : 50,
      fit_score: phase ? Math.round(100 - (phase - 1) * 15) : 60,
    });
  }

  // Sort by phase (null last), then by section order
  result.sort((a, b) => {
    if (a.activation_phase && !b.activation_phase) return -1;
    if (!a.activation_phase && b.activation_phase) return 1;
    if (a.activation_phase && b.activation_phase) return a.activation_phase - b.activation_phase;
    return 0;
  });

  return result;
}

function leadsToCSV(leads) {
  const headers = ['name', 'handle', 'bucket', 'section', 'value_prop', 'activation_phase', 'distribution_power', 'fit_score', 'notes'];
  const rows = [headers.join(',')];

  for (const lead of leads) {
    const notes = [
      lead.value_prop ? `Offer: ${lead.value_prop}` : '',
      lead.activation_phase ? `Phase ${lead.activation_phase}` : '',
    ].filter(Boolean).join(' | ');

    const row = [
      `"${(lead.name || '').replace(/"/g, '""')}"`,
      lead.handle || '',
      lead.bucket || 'other',
      `"${(lead.section || '').replace(/"/g, '""')}"`,
      `"${(lead.value_prop || '').replace(/"/g, '""')}"`,
      lead.activation_phase || '',
      lead.distribution_power || '',
      lead.fit_score || '',
      `"${notes.replace(/"/g, '""')}"`,
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

function main() {
  const docPath = process.argv[2] || DEFAULT_DOC_PATH;

  console.log(`📄 Reading constellation document: ${docPath}`);

  if (!fs.existsSync(docPath)) {
    console.error(`❌ File not found: ${docPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(docPath, 'utf-8');
  const leads = parseConstellationDocument(content);

  console.log(`✅ Parsed ${leads.length} leads`);

  // Output JSON
  const outputDir = path.join(__dirname);
  const jsonPath = path.join(outputDir, 'arche-constellation-leads.json');
  const csvPath = path.join(outputDir, 'arche-constellation-leads.csv');

  fs.writeFileSync(jsonPath, JSON.stringify(leads, null, 2), 'utf-8');
  console.log(`📝 JSON written to: ${jsonPath}`);

  // Output CSV
  const csv = leadsToCSV(leads);
  fs.writeFileSync(csvPath, csv, 'utf-8');
  console.log(`📝 CSV written to: ${csvPath}`);

  // Summary by phase
  console.log('\n📊 Summary by activation phase:');
  const byPhase = {};
  for (const lead of leads) {
    const phase = lead.activation_phase || 'unassigned';
    byPhase[phase] = (byPhase[phase] || 0) + 1;
  }
  for (const [phase, count] of Object.entries(byPhase).sort()) {
    console.log(`   Phase ${phase}: ${count} lead(s)`);
  }

  // Summary by bucket
  console.log('\n📊 Summary by bucket:');
  const byBucket = {};
  for (const lead of leads) {
    byBucket[lead.bucket] = (byBucket[lead.bucket] || 0) + 1;
  }
  for (const [bucket, count] of Object.entries(byBucket).sort()) {
    console.log(`   ${bucket}: ${count} lead(s)`);
  }

  return leads;
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { parseConstellationDocument, leadsToCSV, main };
