# ARCHÉ Project Handoff (Legibility v0.1)

## Repo
- Path: `C:\Users\echof\arche-paris`
- Stack: Vite + React + TypeScript (Windows)
- Backend: Supabase Edge Functions + Card Gate auth

## What is ARCHÉ
Walking experience for Paris with GPS validation:
- Enter arrondissements (GPS validated)
- Perform rituals (presence / observation)
- Earn complexion points (presence / wisdom / shadow)
- Claim custody (guardian of zones)
- Leave public inscriptions (engravings)

## Current State: "Legibility Plan" Implemented
Goal: backend is rich, UI is calm but readable. Mechanics surfaced via poetic indicators, not raw numbers.

### Implemented
1. LivingQuest - Direction Indicator
- File: `src/components/LivingQuest.tsx`
- On homepage: shows the most relevant next action
- Strict priority: ritual > engrave > custody > meridian > start
- Tap navigates to the correct screen

2. Map Layer Toggle (Mine vs City)
- File: `src/components/PersonalMemoryMap.tsx`
- Modes: Mes traces / La Ville / Rituels
- Toggles change what is rendered

3. Rituels Layer (City feels alive)
- Zone colors:
- Grey = unexplored
- Gold = entered
- Green = sealed (rituals done)

4. Custody Glow
- Gold border glow where `is_custodian === true`
- Visible in Traces + Rituels modes

5. AuraPage - Poetic Progression + Real Backend
- File: `src/components/AuraPage.tsx`
- Dots indicators (`●●●○○○`) instead of rings
- One rare number: `Zones: X/20`
- Next goal: "Prochain seuil" (seal unlock target)

6. Aura Backend Integration + Hints (critical)
- Uses `api.meComplexion()` -> real `presence_points`, `wisdom_points`, `shadow_points`
- Parses `last_delta` to detect what changed
- Shows hint when something moves (hardcoded templates for now):
- "Ta presence s'est affirmee."
- "Ta sagesse s'est densifiee."
- "L'ombre recule."
- Flow: user completes action -> backend writes delta -> Aura reflects change on open

## Handy References
- **Paradigm (feature filter):** [docs/ARCHÉ_PARADIGM.md](ARCHÉ_PARADIGM.md) — acts, emotions, friction; use to accept/reject features.
- UI/layout/mobile consistency: [docs/UI_STABILIZATION_AND_MOBILE_GUIDE.md](UI_STABILIZATION_AND_MOBILE_GUIDE.md)
- PassportLayerModule is placed below the main Aura dashboard in a flex wrapper: row on desktop (dashboard left, module right), column on mobile. Single Aura page, same instrument/panel language.

## Passport / Fund backend activation

To show the Passport module on Aura, the world/snapshot response must include at least:

- `me.passport: { hasPassport: true }`
- `me.fund: { enabled: true, total: N, monumentPhase: 'reserve' }`

All other fields (lastAllocation, userContribution, reliquaire, etc.) can be omitted; the UI stays stable and shows the locked/empty state when data is missing.

## Field Cartography (data layer, not user-facing)

Canonical field store is **backend-only**: `world.field` in `/world/snapshot` (Supabase card-gate). Packs live in `supabase/functions/card-gate/field-packs.ts`; deterministic daily sentence comes from `field-daily.ts` (Paris date + FNV-1a over `userId|zoneId`) and is set on `me.aura.dailySentence` when the backend does not already provide it. **Do not render `world.field` as UI/lore**; only the single selected line is exposed via `me.aura.dailySentence` (and optional `dailySentenceMeta`). Symbolic territories (PAR-XX) only; no PostGIS.

### Daily sentence determinism contract

**Inputs:** `userId` (or `card_id`; use `"anon"` when unauthenticated), Paris local date (`YYYY-MM-DD`, Europe/Paris), `zoneId` (normalized PAR-01..PAR-20). **Output:** exactly one signal-sized line (≤140 chars, no newlines). Same (userId, date, zoneId) ⇒ same sentence across refreshes; different user, date, or zone ⇒ sentence may differ. Selector runs only when `world.field` exists and `me.aura.dailySentence` is missing/null/empty; backend never overrides an existing daily sentence.

## DEPLOY_CHECKLIST (card-gate + snapshot)

1. **Local sanity:** `npm install` then `npm run build` (must pass).
2. **Supabase deploy:** `supabase login`, `supabase link --project-ref <PROJECT_REF>`, `supabase functions deploy card-gate`.
3. **Prod snapshot checks (manual):**
   - **PAR-13 (field present):**  
     `GET /api/card-gate/world/snapshot?h3_center=PAR-13`  
     Expect: `world.field` is object, `world.field.zoneId === "PAR-13"`; `me.aura.dailySentence` present (string ≤140 chars, no newlines).
   - **Other zone (field null):**  
     `GET /api/card-gate/world/snapshot?h3_center=PAR-14`  
     Expect: `world.field === null`; `me.aura.dailySentence` either absent or from another source (no crash).
   - **Determinism:** Same user + same Paris day + same zone ⇒ same `dailySentence`; different user or zone or next day ⇒ may differ.

Example (replace base URL with your Supabase function URL):

```bash
curl -s "https://<PROJECT_REF>.supabase.co/functions/v1/card-gate/world/snapshot?h3_center=PAR-13" -H "Content-Type: application/json" | jq '{ world_field: .world.field.zoneId, dailySentence: .me.aura.dailySentence }'
```

## Key Files
- `src/App.tsx` - router (hash navigation)
- `src/components/HomepageV1.tsx` - homepage with LivingQuest integrated
- `src/components/PersonalMemoryMap.tsx` - map + layer toggle + custody glow
- `src/components/AuraPage.tsx` - progression UI + backend hints
- `src/components/ZoneDetailSheet.tsx` - zone objectives UI
- `src/lib/api.ts` - Supabase API client
- `src/utils/meridien-storage.ts` - localStorage for meridian thresholds
- `.claude/plans/unified-humming-dragon.md` - legibility plan reference

## Remaining (minor polish)
1. Homepage "Tes Gardes" section
- Add to `src/components/HomepageV1.tsx`
- Show custody summary + expiry states

2. Carnet inscription timeline
- Add to `src/components/CarnetParisien.tsx`
- List user inscriptions (date, zone, text) + "Voir sur la carte"

3. Navigation renaming (clarity)
- "Ma Carte" -> "Mon Paris"
- "Le Champ" -> "La Ville"
- Remove/merge redundant "Voir la Carte" if still present

## 401 on manifest.json / preview deployments

If `/manifest.json` or `/api/card-gate/*` return **401** on Vercel preview URLs, the cause is usually **Vercel Deployment Protection** (password protection for previews). Fix: **Vercel Dashboard → Project → Settings → Deployment Protection** — disable it for previews or add bypass rules so static assets and your API are accessible. Headers in `vercel.json` do not bypass this; only Dashboard settings do.

## Build / Run
```bash
cd C:\Users\echof\arche-paris
npm run dev
npm run build
npm run lint
```

## Deploy (Vercel)
```bash
npx vercel --prod
```

## Design Principles (Do not break)
- Poetic, not numeric: dots (`●○`), avoid dashboards
- Only one rare number: `Zones: X/20`
- Calm aesthetic, but not invisible
- Visual language: Custody = gold glow / Sealed = green / Entered = gold / Unexplored = grey

## Next Prompt (for Claude)
"Fais les 3 items restants (Tes Gardes, Timeline Carnet, Rename nav) et ensuite on passe au flow rituel start/complete depuis ZoneDetailSheet."
