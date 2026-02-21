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
- UI/layout/mobile consistency: [docs/UI_STABILIZATION_AND_MOBILE_GUIDE.md](UI_STABILIZATION_AND_MOBILE_GUIDE.md)
- PassportLayerModule is placed below the main Aura dashboard in a flex wrapper: row on desktop (dashboard left, module right), column on mobile. Single Aura page, same instrument/panel language.

## Passport / Fund backend activation

To show the Passport module on Aura, the world/snapshot response must include at least:

- `me.passport: { hasPassport: true }`
- `me.fund: { enabled: true, total: N, monumentPhase: 'reserve' }`

All other fields (lastAllocation, userContribution, reliquaire, etc.) can be omitted; the UI stays stable and shows the locked/empty state when data is missing.

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

## Build / Run
```bash
cd C:\Users\echof\arche-paris
npm run dev
npm run build
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
