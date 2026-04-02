/**
 * ingest-from-csv.js
 *
 * Ingests leads from the CANONICAL CSV (arche-leads-canonical.csv) into Supabase.
 * This script reads from the CSV — it does NOT re-parse the original documents.
 *
 * Intention ID resolution (strict):
 *   1. INTENTION_ID env var (preferred)
 *   2. Auto-resolve via GET /api/intentions?key=arche-paris-q1
 *   3. Direct Supabase query if API unavailable
 *   4. FAIL with clear message if neither works
 *
 * Usage:
 *   # With env var (preferred)
 *   INTENTION_ID=uuid node scripts/leads/ingest-from-csv.js
 *
 *   # Auto-resolve via API (server must be running)
 *   node scripts/leads/ingest-from-csv.js
 *
 *   # Direct to Supabase (no server needed)
 *   node scripts/leads/ingest-from-csv.js --direct
 *
 *   # Dry run
 *   node scripts/leads/ingest-from-csv.js --dry-run
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CSV_PATH = path.join(__dirname, 'arche-leads-canonical.csv');
const INTENTION_KEY = 'arche-paris-q1';
const DEFAULT_API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

// Supabase direct config (from env or hardcoded for this project)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vmdmiihclncxdzzsryth.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

// ============================================================================
// CSV PARSER
// ============================================================================

function parseCSV(content) {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || null;
    }
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

// ============================================================================
// INTENTION RESOLUTION
// ============================================================================

async function resolveIntentionId(options) {
  const { apiBase, direct, dryRun } = options;

  // 1. Check env var first
  if (process.env.INTENTION_ID) {
    console.log(`   Using INTENTION_ID from env: ${process.env.INTENTION_ID}`);
    return process.env.INTENTION_ID;
  }

  // 2. Try API resolution
  if (!direct) {
    try {
      const url = `${apiBase}/api/intentions?key=${encodeURIComponent(INTENTION_KEY)}`;
      console.log(`   Trying API: ${url}`);
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });

      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          console.log(`   Resolved via API: ${data.id}`);
          return data.id;
        }
      }
    } catch (err) {
      console.log(`   API unavailable: ${err.message}`);
    }
  }

  // 3. Try direct Supabase query
  if (SUPABASE_KEY) {
    try {
      console.log(`   Trying direct Supabase query...`);
      const url = `${SUPABASE_URL}/rest/v1/intentions?key=eq.${encodeURIComponent(INTENTION_KEY)}&select=id`;
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data[0] && data[0].id) {
          console.log(`   Resolved via Supabase: ${data[0].id}`);
          return data[0].id;
        }
      }
    } catch (err) {
      console.log(`   Supabase query failed: ${err.message}`);
    }
  }

  // 4. FAIL with clear message
  if (dryRun) {
    console.log(`   [DRY RUN] Would need intention_id for key: ${INTENTION_KEY}`);
    return 'DRY_RUN_PLACEHOLDER';
  }

  console.error(`
❌ FAILED: Could not resolve intention_id for key "${INTENTION_KEY}"

To fix this, do ONE of the following:

  1. Set INTENTION_ID env var:
     INTENTION_ID=your-uuid node scripts/leads/ingest-from-csv.js

  2. Start the dev server and ensure the intention exists:
     npm run dev
     # Then run this script again

  3. Run migrations to create the intention:
     - Run supabase/migrations/20260228000001_intentions.sql
     - This seeds the "${INTENTION_KEY}" intention

  4. Use --direct flag with valid SUPABASE_SERVICE_ROLE_KEY:
     SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/leads/ingest-from-csv.js --direct
`);
  process.exit(1);
}

// ============================================================================
// INGEST LEADS
// ============================================================================

async function ingestLeads(leads, intentionId, options) {
  const { apiBase, direct, dryRun } = options;

  if (dryRun) {
    console.log(`\n[DRY RUN] Would insert ${leads.length} leads with intention_id: ${intentionId}`);
    return { success: true, count: leads.length, dryRun: true };
  }

  // Transform leads to match actual Supabase schema
  // Note: The existing leads table has these columns:
  //   id, intention_id, name, normalized_name, domain, handle, bucket,
  //   contract_type, distribution_power, fit_score, contact_status,
  //   next_action, due_date, source_doc, source_url, notes, created_at, updated_at
  // Phase/potential/offer info goes in notes (machine-readable format)
  const payload = leads.map((lead) => ({
    intention_id: intentionId,
    name: lead.name,
    normalized_name: lead.normalized_name,
    handle: lead.handle || lead.normalized_handle,
    bucket: lead.bucket || 'other',
    economic_role: lead.economic_role || 'partner',
    distribution_power: lead.distribution_power ? parseInt(lead.distribution_power, 10) : 50,
    fit_score: lead.fit_score ? parseInt(lead.fit_score, 10) : 50,
    contact_status: 'identified',
    source_doc: 'constellation-strategic-leads',
    notes: lead.notes || null,
  }));

  if (direct) {
    // Direct Supabase insert
    console.log(`\n📤 Inserting ${payload.length} leads directly to Supabase...`);

    const url = `${SUPABASE_URL}/rest/v1/leads`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase insert failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    return { success: true, count: data.length, leads: data };
  } else {
    // Via API
    console.log(`\n📤 Posting ${payload.length} leads to ${apiBase}/api/leads...`);

    const res = await fetch(`${apiBase}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API POST failed: ${res.status} ${text}`);
    }

    return res.json();
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const direct = args.includes('--direct');
  const apiUrlArg = args.find((a) => a.startsWith('--api-url='));
  const apiBase = apiUrlArg ? apiUrlArg.split('=')[1] : DEFAULT_API_BASE;

  console.log('🚀 ARCHÉ Leads Ingestion (from Canonical CSV)');
  console.log('='.repeat(50));
  console.log(`   CSV Source:   ${CSV_PATH}`);
  console.log(`   API Base:     ${direct ? '(direct Supabase)' : apiBase}`);
  console.log(`   Intention:    ${INTENTION_KEY}`);
  console.log(`   Dry Run:      ${dryRun}`);
  console.log('');

  // Load CSV
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ Canonical CSV not found: ${CSV_PATH}`);
    console.log('   Run: node scripts/leads/build-leads-csv.js first');
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const leads = parseCSV(csvContent);
  console.log(`📄 Loaded ${leads.length} leads from CSV`);

  // Resolve intention_id
  console.log('\n🔍 Resolving intention_id...');
  const intentionId = await resolveIntentionId({ apiBase, direct, dryRun });

  // Preview
  console.log('\n📋 Lead preview (first 5):');
  for (const lead of leads.slice(0, 5)) {
    const phase = lead.activation_phase || '-';
    const tier = lead.potential_tier || 'unassigned';
    console.log(`   @${(lead.normalized_handle || lead.handle).padEnd(22)} Phase ${phase} (${tier.padEnd(10)}) ${lead.bucket}`);
  }
  if (leads.length > 5) {
    console.log(`   ... and ${leads.length - 5} more`);
  }

  // Ingest
  try {
    const result = await ingestLeads(leads, intentionId, { apiBase, direct, dryRun });

    if (dryRun) {
      console.log('\n✅ Dry run complete. No data was sent.');
    } else {
      console.log(`\n✅ Successfully ingested ${result.count} leads`);
    }

    return result;
  } catch (err) {
    console.error(`\n❌ Ingestion failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
