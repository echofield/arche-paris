/**
 * ingest-constellation-leads.js
 *
 * Posts the parsed constellation leads to the OPÉRA API.
 *
 * Prerequisites:
 * 1. Run migrations to create intentions and leads tables
 * 2. Server running on localhost:3000 (or set API_BASE_URL)
 * 3. Environment variables set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 *
 * Usage:
 *   node scripts/leads/ingest-constellation-leads.js [--dry-run]
 *
 * Options:
 *   --dry-run   Show what would be ingested without actually posting
 *   --api-url   Override API base URL (default: http://localhost:3000)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';
const INTENTION_KEY = 'arche-paris-q1';
const LEADS_JSON_PATH = path.join(__dirname, 'arche-constellation-leads.json');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getIntention(apiBase, key) {
  const url = `${apiBase}/api/intentions?key=${encodeURIComponent(key)}`;
  console.log(`📍 Fetching intention: ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch intention: ${res.status} ${text}`);
  }
  return res.json();
}

async function postLeads(apiBase, leads, intentionId) {
  const url = `${apiBase}/api/leads`;

  const payload = leads.map((lead) => ({
    ...lead,
    intention_id: intentionId,
    contact_status: 'identified',
  }));

  console.log(`📤 Posting ${payload.length} leads to ${url}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to post leads: ${res.status} ${text}`);
  }

  return res.json();
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const apiUrlArg = args.find((a) => a.startsWith('--api-url='));
  const apiBase = apiUrlArg ? apiUrlArg.split('=')[1] : DEFAULT_API_BASE;

  console.log('🚀 ARCHÉ Constellation Leads Ingestion');
  console.log('=====================================');
  console.log(`   API Base:     ${apiBase}`);
  console.log(`   Intention:    ${INTENTION_KEY}`);
  console.log(`   Dry Run:      ${dryRun}`);
  console.log('');

  // Load leads from JSON
  if (!fs.existsSync(LEADS_JSON_PATH)) {
    console.error(`❌ Leads JSON not found: ${LEADS_JSON_PATH}`);
    console.log('   Run: node scripts/leads/parse-constellation.js first');
    process.exit(1);
  }

  const leads = JSON.parse(fs.readFileSync(LEADS_JSON_PATH, 'utf-8'));
  console.log(`📄 Loaded ${leads.length} leads from JSON`);

  // Summary
  console.log('\n📊 Leads to ingest:');
  for (const lead of leads) {
    const phase = lead.activation_phase ? `Phase ${lead.activation_phase}` : 'No phase';
    console.log(`   @${lead.handle.padEnd(25)} ${lead.bucket.padEnd(20)} ${phase}`);
  }

  if (dryRun) {
    console.log('\n✅ Dry run complete. No data was sent.');
    return;
  }

  // Get or verify intention exists
  console.log('\n📍 Resolving intention...');
  let intention;
  try {
    intention = await getIntention(apiBase, INTENTION_KEY);
    console.log(`   ✅ Found intention: ${intention.name} (${intention.id})`);
  } catch (err) {
    console.error(`   ❌ Could not find intention "${INTENTION_KEY}"`);
    console.error(`      Error: ${err.message}`);
    console.log('\n   Make sure:');
    console.log('   1. The database migrations have been run');
    console.log('   2. The server is running at', apiBase);
    process.exit(1);
  }

  // Post leads
  console.log('\n📤 Posting leads...');
  try {
    const result = await postLeads(apiBase, leads, intention.id);
    console.log(`   ✅ Successfully ingested ${result.count} leads`);

    if (result.leads && result.leads.length > 0) {
      console.log('\n📝 Created leads:');
      for (const lead of result.leads) {
        console.log(`   ${lead.id} - @${lead.handle} (${lead.bucket})`);
      }
    }
  } catch (err) {
    console.error(`   ❌ Failed to post leads: ${err.message}`);
    process.exit(1);
  }

  console.log('\n✅ Ingestion complete!');
  console.log(`   View leads at: ${apiBase}/api/leads?intention_key=${INTENTION_KEY}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
