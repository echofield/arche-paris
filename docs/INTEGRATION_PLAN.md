# ARCHÉ — Stable Integration Plan

## 🎯 Recommendation: Integrate Miroir INTO Aura (Not Replace)

### Why This Makes Sense

**Aura's current purpose:**
- "Phenomenological mirror" (from code comment)
- Calm, breathing space for reflection
- Companion state (Quiet/Awake/Warm/Bright)
- Memory sentence + reflective question
- "Graver un moment" (seal a moment)

**Miroir's purpose:**
- Daily reflection sentence (A/B/C pools)
- Historical connection ("Ce jour-là à Paris")
- Kept sentences (saved reflections)

**Architectural fit:**
- ✅ Both are about reflection/presence
- ✅ Aura is already a "mirror" conceptually
- ✅ Daily sentence enhances the reflection space
- ✅ Historical anecdotes add temporal depth
- ✅ Keeps companion system intact

---

## 📋 Integration Plan (Stable, Incremental)

### Phase 1: Add Miroir to Aura (Minimal, Stable)

**What to do:**
1. Replace `memorySentence` in Aura with Miroir daily sentence
2. Add historical anecdote below sentence (if available)
3. Add "Phrases gardées" link (kept sentences)
4. Keep everything else (companion, seal, reflective question)

**Files to modify:**
- `src/components/AuraPage.tsx` - Add MiroirSurface component
- `src/utils/card-gate-client.ts` - Add `loadMirrorToday()` function
- `supabase/functions/card-gate/index.tsx` - Add `/mirror/today` endpoint

**Backend needed:**
- Sentence pools (BLOC_A, BLOC_B, BLOC_C)
- `/mirror/today` endpoint
- `/mirror/kept` endpoint (for kept sentences)
- Database: `mirror_daily` table

**Risk level:** 🟢 Low - Adds to existing page, doesn't change structure

---

### Phase 2: Historical Events Integration

**Option A: Use as Miroir anecdotes**
- Historical events from PDF → anecdotes in `/mirror/today`
- Keyed by MM-DD format
- Displayed below daily sentence in Aura

**Option B: Historical mode on Champ map**
- Toggle on Champ map to show historical events
- Events geolocalized by arrondissement
- Separate from current Champ (collective traces)

**Recommendation:** Start with Option A (simpler, fits Miroir concept)

---

## 🏗️ Proposed Architecture

### Aura Page Structure (After Integration)

```
AURA
├─ Companion State (Quiet/Awake/Warm/Bright) [KEEP]
├─ ArcheSymbol (opacity by level) [KEEP]
├─ Companion Word [KEEP]
│
├─ Miroir Section [NEW]
│  ├─ Daily Sentence (from A/B/C pools)
│  ├─ Kind Label ("Écho" / "Seuil" / none)
│  ├─ Historical Anecdote ("Ce jour-là à Paris") [optional]
│  └─ Link: "Phrases gardées" → #kept
│
├─ Reflective Question [KEEP]
└─ "Graver un moment" [KEEP]
```

**Benefits:**
- ✅ Enriches reflection space without cluttering
- ✅ Daily sentence replaces generic memory sentence
- ✅ Historical connection adds depth
- ✅ Keeps Aura's calm, breathing space feel

---

## 🔧 Implementation Steps (Stable)

### Step 1: Backend First (No Frontend Changes)
1. Add sentence pools to `card-gate/index.tsx`
2. Add `/mirror/today` endpoint
3. Add `/mirror/kept` endpoint
4. Apply migration `009_mirror_kept.sql`
5. Test endpoints with curl/Postman

**Why first:** Backend is independent, can test without frontend

### Step 2: Client Functions
1. Add `loadMirrorToday()` to `card-gate-client.ts`
2. Add `loadMirrorKept()` to `card-gate-client.ts`
3. Test functions independently

**Why second:** Client functions are isolated, easy to test

### Step 3: Integrate into Aura (Minimal Change)
1. Import `MiroirSurface` into `AuraPage.tsx`
2. Replace `memorySentence` section with `<MiroirSurface>`
3. Add route for `#kept` (KeptSentences screen)
4. Test incrementally

**Why last:** Frontend integration is the riskiest, do it last

---

## 🎨 UI Integration (How It Looks)

### Current Aura:
```
AURA
Présence

[ArcheSymbol]

Quiet

[Memory sentence from oracle]

[Reflective question]

Graver un moment
```

### Proposed Aura:
```
AURA
Présence

[ArcheSymbol]

Quiet

Miroir
[Daily sentence from A/B/C pools]
[Optional: "Écho" or "Seuil" label]
[Optional: "Ce jour-là à Paris: [anecdote]"]

Phrases gardées

[Reflective question]

Graver un moment
```

**Visual hierarchy:**
- Companion state stays prominent
- Miroir section is secondary (below companion word)
- Historical anecdote is subtle (italic, smaller)
- "Phrases gardées" is discrete link

---

## 🚫 What NOT to Do (Keep Stable)

### ❌ Don't Replace Aura Entirely
- Keep companion system
- Keep "Graver un moment"
- Keep reflective question

### ❌ Don't Add to Homepage
- Homepage should stay clean
- Miroir belongs in reflection space (Aura)

### ❌ Don't Create Separate Route
- No need for `#miroir` route
- Miroir is part of Aura experience

---

## 📊 Risk Assessment

| Change | Risk | Impact | Recommendation |
|--------|------|--------|----------------|
| Add Miroir to Aura | 🟢 Low | High value | ✅ Do it |
| Historical anecdotes | 🟢 Low | Medium value | ✅ Do it |
| Kept sentences route | 🟢 Low | Low value | ✅ Optional |
| Champ historical mode | 🟡 Medium | High complexity | ⏸️ Later |

---

## ✅ Final Recommendation

**Integrate Miroir INTO Aura** (not replace, not separate)

**Why:**
1. ✅ Architecturally sound (both are reflection spaces)
2. ✅ Minimal changes (adds to existing, doesn't restructure)
3. ✅ Enhances without cluttering
4. ✅ Keeps system stable
5. ✅ Historical anecdotes fit naturally

**Implementation order:**
1. Backend endpoints (test independently)
2. Client functions (test independently)
3. Aura integration (minimal, incremental)
4. Historical anecdotes (use existing `histoire-quotidienne.ts` data)

**Timeline:** Can be done incrementally, test at each step, rollback easily if issues

---

## 🎯 Next Steps

1. **Decide**: Do you want Miroir in Aura or separate?
2. **If yes**: Start with backend (safest)
3. **If no**: Keep current stable state, launch as-is

**My vote:** ✅ Integrate into Aura - it's the right architectural fit and keeps things stable.
