# OPÉRA Leads Pipeline

Canonical pipeline for ARCHÉ leads: parse → CSV (source of truth) → ingest.

## Architecture

```
┌─────────────────────────────────────┐
│  Source Documents                   │
│  - Constellation OPÉR (18 leads)    │
│  - Strategic PDF (30 leads)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  build-leads-csv.js                 │
│  - Parse all sources                │
│  - Dedupe by normalized_handle      │
│  - Keep strongest priority          │
│  - Output canonical CSV             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  arche-leads-canonical.csv          │  ← SOURCE OF TRUTH
│  (48 unique leads)                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  ingest-from-csv.js                 │
│  - Reads CSV (never re-parses docs) │
│  - Resolves intention_id            │
│  - POSTs to API or direct Supabase  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Supabase: leads + intentions       │
│  Dashboard shows: who/what/timeline │
└─────────────────────────────────────┘
```

## Quick Start

### Step 1: Run Migrations

In Supabase SQL Editor, run these in order:

```sql
-- 1. First run: supabase/migrations/20260228000001_intentions.sql
-- 2. Then run: supabase/migrations/20260228000002_leads.sql
```

Or via Supabase CLI:
```bash
supabase db push
```

### Step 2: Build Canonical CSV

```bash
node scripts/leads/build-leads-csv.js
```

Output:
- `arche-leads-canonical.csv` (source of truth)
- `arche-leads-canonical.json` (reference)

### Step 3: Ingest Leads

```bash
# Option A: Via API (server must be running)
npm run dev  # in another terminal
node scripts/leads/ingest-from-csv.js

# Option B: Direct to Supabase (no server needed)
SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/leads/ingest-from-csv.js --direct

# Option C: With explicit intention_id
INTENTION_ID=your-uuid node scripts/leads/ingest-from-csv.js --direct

# Dry run (preview without inserting)
node scripts/leads/ingest-from-csv.js --dry-run
```

## CSV Format

The canonical CSV uses machine-readable notes:

```
Offer: ... || Phase: N || Section: ... || Potential: high|med|low|watch
```

### Columns

| Column | Description |
|--------|-------------|
| `normalized_handle` | Primary key (lowercase, no @, alphanumeric+underscore) |
| `name` | Display name (derived from handle if not explicit) |
| `normalized_name` | DB normalized (lowercase, no diacritics, underscores) |
| `handle` | Original handle |
| `bucket` | Enum: creators, guides, experience_studios, hotels_concierge, fundraising, other |
| `economic_role` | Enum: partner (default), client, operator, observer |
| `activation_phase` | 1-4 (from activation order) or empty |
| `potential_tier` | high (phase 1), med (2), low (3), watch (4), unassigned |
| `distribution_power` | 90/75/60/45/50 based on phase |
| `fit_score` | 85/70/55/40/50 based on phase |
| `section` | Original section from source doc |
| `offer` | Value proposition / what they bring |
| `notes` | Machine-readable: `Offer: ... \|\| Phase: N \|\| Section: ... \|\| Potential: ...` |

## Deduplication Rules

1. Key by `normalized_handle` (lowercase, no @)
2. If same handle appears multiple times:
   - Keep strongest priority (lowest phase number wins)
   - Append original section to `also_in` in notes
   - Prefer longer/richer offer description

## Potential Scoring

Simple, honest, phase-based:

| Phase | Tier | Distribution Power | Fit Score |
|-------|------|-------------------|-----------|
| 1 | high | 90 | 85 |
| 2 | med | 75 | 70 |
| 3 | low | 60 | 55 |
| 4 | watch | 45 | 40 |
| - | unassigned | 50 | 50 |

## Economic Roles

Leads have an `economic_role` that defines the relationship type:

| Role | Description |
|------|-------------|
| `partner` | Standard distribution/collaboration partner (default) |
| `client` | Paying customer for ARCHE services |
| `operator` | Passeport participants who receive the system and help spread locally |
| `observer` | Watching/monitoring, not yet engaged |

**Operators (Passeport)** influence projection weight in field calculations but are not counted as direct conversions.

## Intention Resolution

The ingest script requires an `intention_id`. Resolution order:

1. `INTENTION_ID` env var (preferred)
2. API call: `GET /api/intentions?key=arche-paris-q1`
3. Direct Supabase query (with `--direct` flag)
4. **FAIL** with clear instructions

## Files

| File | Purpose |
|------|---------|
| `build-leads-csv.js` | Parse sources → canonical CSV |
| `ingest-from-csv.js` | Ingest CSV → Supabase |
| `arche-leads-canonical.csv` | **Source of truth** |
| `arche-leads-canonical.json` | JSON reference |
| `parse-constellation.js` | (Legacy) Old parser |
| `ingest-constellation-leads.js` | (Legacy) Old ingest |

## API Endpoints

- `GET /api/leads` - List all leads
- `GET /api/leads?intention_key=arche-paris-q1` - Filter by intention
- `GET /api/leads?bucket=creators&activation_phase=1` - Filter by bucket + phase
- `GET /api/leads?economic_role=operator` - Filter by economic role
- `POST /api/leads` - Create/upsert leads
- `GET /api/intentions?key=arche-paris-q1` - Get intention by key

## Example: Full Pipeline

```bash
# 1. Build CSV from source documents
node scripts/leads/build-leads-csv.js

# 2. Preview what will be ingested
node scripts/leads/ingest-from-csv.js --dry-run

# 3. Ingest to Supabase
SUPABASE_SERVICE_ROLE_KEY=your-key node scripts/leads/ingest-from-csv.js --direct

# 4. Verify in Supabase
curl "https://your-project.supabase.co/rest/v1/leads?select=handle,name,activation_phase" \
  -H "apikey: your-key"
```
