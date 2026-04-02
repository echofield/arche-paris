# HANDOFF: OPÉRA Leads System

**Date:** 2026-02-28
**From:** Claude (Opus)
**To:** Cursor
**Project:** arche-paris

---

## WHAT WAS IMPLEMENTED

### 1. Database Schema (Supabase)

**Migrations created:**
- `supabase/migrations/20260228000001_intentions.sql` - Intentions table (campaign grouping)
- `supabase/migrations/20260228000002_leads.sql` - Leads table with enums
- `supabase/migrations/20260228000003_leads_economic_role.sql` - **NEEDS TO BE RUN**

**Key enums:**
```sql
lead_bucket: hotels_concierge | guides | creators | experience_studios | fundraising | other
lead_contact_status: identified | researching | contacted | in_conversation | negotiating | converted | declined | dormant
lead_economic_role: partner | client | operator | observer
```

**⚠️ ACTION REQUIRED:** Run this SQL in Supabase:
```sql
-- Create the enum type
do $$ begin
  if not exists (select 1 from pg_type where typname = 'lead_economic_role') then
    create type lead_economic_role as enum ('partner', 'client', 'operator', 'observer');
  end if;
end $$;

-- Add the column
alter table public.leads
add column if not exists economic_role lead_economic_role not null default 'partner';

-- Index
create index if not exists leads_economic_role_idx on public.leads(economic_role);
```

### 2. API Routes

**`api/leads/index.js`**
- GET: List leads with filters (intention_key, bucket, activation_phase, economic_role)
- POST: Create/upsert leads
- Includes economic_role in payload

**`api/intentions/index.js`**
- GET: Get intention by key

### 3. Scripts (in `scripts/leads/`)

| Script | Purpose |
|--------|---------|
| `build-leads-csv.js` | Parses Constellation + PDF → canonical CSV (48 creator leads) |
| `build-fundraising-csv.js` | Parses fundraising report → CSV (55 prospects) |
| `ingest-from-csv.js` | Ingests CSV → Supabase (direct or via API) |

**Generated files:**
- `arche-leads-canonical.csv` - 48 creator/partner leads (SOURCE OF TRUTH)
- `arche-fundraising-prospects.csv` - 55 fundraising prospects
- Corresponding `.json` files for reference

### 4. Data Model

**Two lead types now:**

| Type | Bucket | Economic Role | Count |
|------|--------|---------------|-------|
| Creators/Partners | creators, guides, etc. | partner | 48 |
| Fundraising Prospects | fundraising | observer | 55 |

**Economic roles explained:**
- `partner` - Distribution/collaboration partner (default)
- `client` - Paying customer
- `operator` - Passeport participants (phygital experience spreaders)
- `observer` - Watching, not yet engaged (fundraising prospects start here)

---

## WHAT'S PENDING

### 1. Ingest Fundraising Prospects
```bash
# After running the migration, ingest the 55 fundraising prospects
SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/leads/ingest-from-csv.js --direct
```

The ingest script currently reads from `arche-leads-canonical.csv`. You may need to:
- Add a `--csv` flag to specify which file to ingest
- Or merge both CSVs into one canonical file

### 2. UI Components (None exist yet)

The user mentioned these files but they don't exist:
- `lib/opera/approach.ts`
- `ConductorView.tsx`

**Needed:**
- Leads dashboard/list view
- Lead detail view with economic_role label
- Filter by bucket, phase, economic_role
- Pipeline view (contact_status progression)

### 3. Field Calculations for Operators

From user requirements:
> "Operators (Passeport) influence projection weight but are not counted as direct conversions."

This logic needs to be implemented when calculating:
- Realization metrics
- Field projections
- Conversion rates

---

## SUGGESTIONS

### 1. Quick Wins

**A. Add --csv flag to ingest script:**
```javascript
const csvArg = args.find((a) => a.startsWith('--csv='));
const csvPath = csvArg ? csvArg.split('=')[1] : CSV_PATH;
```

**B. Merge CSVs into single source:**
```bash
# Append fundraising to canonical (skip header)
tail -n +2 arche-fundraising-prospects.csv >> arche-leads-canonical.csv
```

### 2. Minimal Leads UI

Create `src/components/LeadsView.tsx`:
```tsx
// Fetch from /api/leads
// Display as table with columns: name, handle, bucket, economic_role, phase, status
// Filter chips: bucket, economic_role, activation_phase
// Click row → detail sheet
```

### 3. Economic Role Badge Component

```tsx
const ROLE_LABELS = {
  partner: { label: 'Partner', color: 'green' },
  client: { label: 'Client', color: 'gold' },
  operator: { label: 'Operator', color: 'blue' },
  observer: { label: 'Prospect', color: 'grey' },
};

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_LABELS[role] || ROLE_LABELS.partner;
  return <span className={`badge badge-${config.color}`}>{config.label}</span>;
}
```

### 4. Pipeline Progression

The `contact_status` enum already supports a full pipeline:
```
identified → researching → contacted → in_conversation → negotiating → converted
                                                                    ↘ declined
                                                                    ↘ dormant
```

Consider a Kanban-style view for this.

### 5. Fundraising-Specific Fields

The fundraising data has extra fields not in current schema:
- `contact` (email, LinkedIn, etc.)
- `calendar` (when to apply)
- `vehicle` (foundation, personal, etc.)

Options:
- Store in `notes` (current approach, machine-readable format)
- Add `metadata JSONB` column (already exists, use it)
- Add dedicated columns if fundraising becomes core feature

---

## FILE LOCATIONS

```
arche-paris/
├── api/
│   ├── leads/index.js          # Leads CRUD API
│   └── intentions/index.js     # Intentions API
├── scripts/leads/
│   ├── build-leads-csv.js      # Creator leads builder
│   ├── build-fundraising-csv.js # Fundraising builder
│   ├── ingest-from-csv.js      # CSV → Supabase
│   ├── arche-leads-canonical.csv
│   ├── arche-fundraising-prospects.csv
│   └── README.md               # Full documentation
└── supabase/migrations/
    ├── 20260228000001_intentions.sql
    ├── 20260228000002_leads.sql
    └── 20260228000003_leads_economic_role.sql  # RUN THIS
```

---

## SUPABASE CONFIG

```
URL: https://vmdmiihclncxdzzsryth.supabase.co
Intention Key: arche-paris-q1
```

48 leads already ingested under this intention.

---

## TERMINOLOGY NOTE

User preference for fundraising leads:
- NOT "investor" (too financial)
- NOT "mécène" (implies commitment)
- Consider: **Prospect**, **Bâtisseur** (Builder), **Soutien** (Supporter), **Allié** (Ally)

Currently using `economic_role: 'observer'` for uncommitted prospects.

---

**Good luck! The data layer is solid. UI is the main gap.**
