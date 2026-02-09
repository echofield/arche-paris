# ARCHÉ PARIS — Verification & Testing Prompt

## Context
You are verifying that recent Phase 0 features are correctly implemented and accessible in the ARCHÉ PARIS application.

## Features to Verify

### 1. **"Le Champ" Map Integration**
**Expected Behavior:**
- Clicking "VOIR LA CARTE" button on homepage OR clicking the Paris map image should navigate to `#champ` route
- `#champ` route should display `ChampScreen` component with `ParisFieldMap`
- Map should show items from `GET /champ/items` endpoint (if any exist)
- Map should display empty state message if no items

**Files to Check:**
- `src/components/HomepageV1.tsx` — lines 377, 416: onClick handlers use `onEnterChamp || onEnterCollection` ✅
- `src/App.tsx` — line 279: hash routing for `'champ'`, line 388: case `'champ'` renders `ChampScreen` ✅
- `src/components/ChampScreen.tsx` — should fetch and display items via `loadChampItems()` ✅
- `src/components/ParisFieldMap.tsx` — should render map with items ✅
- `src/utils/card-gate-client.ts` — should have `loadChampItems()` function ✅

**Test Steps:**
1. Navigate to homepage (`#` or `#homepage`)
2. Click "VOIR LA CARTE" button → should go to `#champ`
3. Click Paris map image → should go to `#champ`
4. Verify `ChampScreen` renders with map
5. Check browser console for API calls to `/champ/items`
6. Verify nav menu "MAP" button still goes to `#collection` (not `#champ`)

**Backend Endpoint:**
- `GET /champ/items` in `supabase/functions/card-gate/index.tsx`
- Should return `{ items: FieldItem[] }` with anonymous inscription data

---

### 2. **Miroir A/B/C Sentence Pools**
**Expected Behavior:**
- Daily sentence displayed via `MiroirSurface` component
- Sentence selection uses deterministic rules:
  - **B (core)**: Default daily sentence
  - **A (foundation)**: Rare cases (initiation/return after 7+ days absence)
  - **C (echo)**: Triggered by activity (inscription/active days/map fill) with cooldown
- UI should show "Écho" label when `kind === 'echo'`
- UI should show "Seuil" label when `kind === 'foundation'`
- Sentence selection avoids immediate repeats

**Files to Check:**
- `src/components/MiroirSurface.tsx` — should display sentence, anecdote, and kind labels ✅
- `src/components/HomepageV1.tsx` — line ~448: renders `<MiroirSurface>` ✅
- `src/App.tsx` — line ~281: hash routing for `'kept'`, line ~396: case `'kept'` renders `KeptSentences` ✅
- `supabase/functions/card-gate/index.tsx` — `GET /mirror/today` endpoint:
  - Should use `BLOC_A_FOUNDATION`, `BLOC_B_CORE`, `BLOC_C_ECHO` sentence pools
  - Should implement `computeKind()` logic for selection rules
  - On cache hit, should return `kind: sentenceToKind(existing.sentence)` (not `computeKind()`)
- `src/utils/card-gate-client.ts` — `loadMirrorToday()` and `loadMirrorKept()` functions ✅

**Where is MiroirSurface rendered?**
- ✅ **INTEGRATED**: `MiroirSurface` is now rendered in `HomepageV1.tsx` below the "La ville nous attend." text
- It displays the daily sentence with optional anecdote
- Clicking "Phrases gardées" navigates to `#kept` route (KeptSentences screen)

**Test Steps:**
1. Find where `MiroirSurface` is rendered (search for `<MiroirSurface` or `import.*MiroirSurface`)
2. Navigate to that screen
3. Verify daily sentence is displayed
4. Check browser console for API calls to `/mirror/today`
5. Verify sentence comes from one of the three pools
6. Verify "Écho" or "Seuil" labels appear when appropriate
7. Test cooldown logic: create activity, verify echo appears, then verify cooldown prevents immediate repeat

**Backend Endpoint:**
- `GET /mirror/today` in `supabase/functions/card-gate/index.tsx`
- Should return `{ date, sentence, anecdote, kind }`

---

### 3. **Database Migrations**
**Expected Migrations:**
- `src/supabase/migrations/008_opt_in_field.sql` — adds `opt_in_field BOOLEAN` to `inscriptions`
- `src/supabase/migrations/009_mirror_kept.sql` — creates `mirror_daily` and `kept_sentences` tables

**Test Steps:**
1. Verify migrations exist in `src/supabase/migrations/`
2. Check Supabase dashboard to verify tables exist
3. Verify `inscriptions` table has `opt_in_field` column
4. Verify `mirror_daily` table exists
5. Verify `kept_sentences` table exists

---

## Verification Checklist

### Routing & Navigation
- [ ] Homepage "VOIR LA CARTE" button navigates to `#champ` (not `#collection`)
- [ ] Homepage map image click navigates to `#champ`
- [ ] Nav menu "MAP" button still navigates to `#collection` (preserved)
- [ ] `#champ` route renders `ChampScreen` component
- [ ] `ChampScreen` displays `ParisFieldMap` component
- [ ] `#kept` route renders `KeptSentences` component (for "Phrases gardées")
- [ ] Clicking "Phrases gardées" link in MiroirSurface navigates to `#kept`

### Champ Map Data
- [ ] `ChampScreen` calls `loadChampItems(cardId)` on mount
- [ ] `GET /champ/items` endpoint exists and returns correct format
- [ ] Map displays items with arrondissement markers
- [ ] Map shows empty state when no items
- [ ] Items are filtered to exclude `arrondissement: null`

### Miroir Sentences
- [ ] ✅ `MiroirSurface` component is rendered on homepage (below "La ville nous attend.")
- [ ] Daily sentence is displayed
- [ ] Sentence comes from A/B/C pools (not placeholder)
- [ ] "Écho" label appears when `kind === 'echo'`
- [ ] "Seuil" label appears when `kind === 'foundation'`
- [ ] `GET /mirror/today` endpoint returns `{ date, sentence, anecdote, kind }`
- [ ] Cache hit returns `kind` derived from sentence (not recomputed)

### Backend Logic
- [ ] `computeKind()` implements selection rules correctly
- [ ] Cooldown logic prevents echo spam (no echo in last 3 days, max 2 in 7 days)
- [ ] Sentence selection avoids immediate repeats
- [ ] Paris timezone helpers work correctly (`getTodayParisDate`, etc.)

### Database
- [ ] Migration `008_opt_in_field.sql` applied
- [ ] Migration `009_mirror_kept.sql` applied
- [ ] Tables exist: `mirror_daily`, `kept_sentences`
- [ ] Column exists: `inscriptions.opt_in_field`

---

## Debugging Steps

If features don't work:

1. **Champ map not showing:**
   - Check browser console for errors
   - Verify `#champ` hash is set in URL
   - Check `ChampScreen` component renders
   - Verify `loadChampItems()` is called
   - Check network tab for `/champ/items` request

2. **Miroir sentences not showing:**
   - ✅ `MiroirSurface` is integrated in `HomepageV1.tsx` (line ~448)
   - Check browser console for errors
   - Verify `loadMirrorToday()` is called (check Network tab)
   - Check network tab for `/mirror/today` request
   - Verify sentence pools are populated in backend
   - Ensure `cardId` prop is passed to `HomepageV1` (it only renders if `cardId` exists)

3. **Routing issues:**
   - Check `App.tsx` hash routing logic (line 279)
   - Verify `navigateTo('champ')` sets hash correctly
   - Check `HomepageV1` onClick handlers use `onEnterChamp`

4. **Backend errors:**
   - Check Supabase Edge Function logs
   - Verify JWT authentication works
   - Check database queries return expected data
   - Verify Paris timezone calculations

---

## Expected File Locations

```
src/
├── components/
│   ├── ChampScreen.tsx          # Champ map screen
│   ├── ParisFieldMap.tsx         # Map component (from petitsouvenir)
│   ├── MiroirSurface.tsx        # Daily sentence display
│   └── HomepageV1.tsx           # Homepage with "VOIR LA CARTE"
├── utils/
│   └── card-gate-client.ts      # API client (loadChampItems, loadMirrorToday)
└── App.tsx                       # Main routing logic

supabase/
└── functions/
    └── card-gate/
        └── index.tsx             # Backend endpoints (/champ/items, /mirror/today)

src/supabase/migrations/
├── 008_opt_in_field.sql
└── 009_mirror_kept.sql
```

---

## Quick Test Commands

```bash
# Build check
npm run build

# Check routing
# Navigate to: http://localhost:5173/#champ
# Should see ChampScreen

# Check Miroir
# Find where MiroirSurface is rendered, navigate there
# Should see daily sentence

# Check API endpoints (if Supabase is running)
curl -X GET "https://your-project.supabase.co/functions/v1/card-gate/mirror/today" \
  -H "Authorization: Bearer YOUR_JWT"

curl -X GET "https://your-project.supabase.co/functions/v1/card-gate/champ/items" \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## Report Format

After verification, report:
1. ✅ Working features
2. ❌ Broken features with error messages
3. 🔍 Missing implementations (e.g., MiroirSurface not rendered)
4. 📝 Recommendations for fixes
