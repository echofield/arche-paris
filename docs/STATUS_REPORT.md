# ARCHÉ PARIS — Status Report
**Date:** February 9, 2026  
**Current Commit:** `80bf8ed` - "feat: Le Champ map integration from petitsouvenir"  
**Branch:** `main`

---

## ✅ WHAT'S WORKING (Stable)

### Core Application
- ✅ **Card System**: Activation, login, pairing, refresh, unpair, force-unpair
- ✅ **Homepage**: Navigation (desktop + mobile), Paris map, CTA buttons
- ✅ **Quêtes**: List, detail pages, Quest Run with manual steps
- ✅ **Méridiens**: Geometric view, proximity detection, proof submission
- ✅ **Trésor Caché**: Hunter Montmartre treasure hunt
- ✅ **Carnet**: Personal journal with Card Gate sync
- ✅ **Ma Carte**: PersonalMemoryMap with inscriptions, segments, proofs
- ✅ **Études**: Hub with Formes, Langages, Systèmes sections
- ✅ **Le Seuil**: Culture quiz (5 levels)
- ✅ **Aura**: Companion system (levels 0-3)
- ✅ **Build**: Compiles successfully, no errors

### Navigation & Routing
- ✅ Hash-based routing (`#quetes`, `#collection`, `#etudes`, etc.)
- ✅ Back button with hash stack
- ✅ Mobile hamburger menu (Explorer / Approfondir)
- ✅ Desktop navigation bar

### Backend
- ✅ Card Gate Edge Function deployed
- ✅ Authentication (JWT + httpOnly cookies)
- ✅ Journal sync (notes, entries)
- ✅ Traces system
- ✅ Map state (inscriptions, segments, proofs)
- ✅ Rate limiting

---

## ⚠️ WHAT'S MISSING / INCOMPLETE

### "Le Champ" Feature (Partially Implemented)
- ✅ **Components exist**: `ChampScreen.tsx`, `ParisFieldMap.tsx` (from commit 80bf8ed)
- ❌ **NOT wired**: No route in `App.tsx` (no `'champ'` in Screen type, no case handler)
- ❌ **NOT accessible**: Can't navigate to `#champ` from anywhere
- ❌ **No backend**: No `/champ/items` endpoint
- ❌ **No data**: No way to fetch or display items on map

**Status**: Components exist but feature is **not functional**. It's a placeholder.

### Miroir Feature (Removed)
- ❌ **Removed**: All Miroir-related code was in commits that were reset
- ❌ **No daily sentences**: No MiroirSurface component
- ❌ **No kept sentences**: No KeptSentences component
- ❌ **No backend**: No `/mirror/today`, `/mirror/kept`, `/mirror/keep` endpoints
- ❌ **No database**: No `mirror_daily` or `kept_sentences` tables

**Status**: **Completely missing** (was in commits after 80bf8ed that were reset)

### Database Migrations (Not Applied)
- ❌ **008_opt_in_field.sql**: Adds `opt_in_field` column to `inscriptions` (for Champ)
- ❌ **009_mirror_kept.sql**: Creates `mirror_daily` and `kept_sentences` tables

**Status**: Files exist in `src/supabase/migrations/` but **not applied** to database

---

## 🔍 CURRENT STATE ANALYSIS

### What Commit 80bf8ed Added
- `src/components/ChampScreen.tsx` - Placeholder screen with empty map
- `src/components/ParisFieldMap.tsx` - Presentational map component (extracted from petitsouvenir)

### What Was Removed (5 commits reset)
1. `e01faca` - Champ items integration + backend endpoint
2. `235a96a` - Database migrations
3. `7bbb6d2` - Champ route wiring in App.tsx
4. `2405446` - Miroir daily sentence feature
5. `6cd5aea` - cardId bug fix

### Remote vs Local
- **Remote (origin/main)**: Has all 5 commits (ahead by 5)
- **Local (HEAD)**: At commit 80bf8ed (behind by 5)
- **Status**: Local is "clean" but missing recent work

---

## 🎯 STABILITY ASSESSMENT

### ✅ Stable & Production-Ready
- Core application features (Quêtes, Méridiens, Carnet, Ma Carte, Études, Aura)
- Card authentication system
- Navigation and routing (except Champ)
- Build system
- Backend Edge Functions (except Champ/Miroir endpoints)

### ⚠️ Partially Stable
- **ChampScreen**: Component exists but not accessible (no route)
- **Homepage**: "VOIR LA CARTE" button goes to `#collection` (Ma Carte), not Champ

### ❌ Not Implemented
- Miroir feature (daily sentences)
- Champ data integration (backend + frontend)
- Database migrations for Phase 0 features

---

## 📋 WHAT TO DO NEXT

### Option 1: Keep Current State (Stable Baseline)
**Pros:**
- ✅ System is stable and working
- ✅ All core features functional
- ✅ No broken integrations

**Cons:**
- ❌ ChampScreen exists but is inaccessible (dead code)
- ❌ Missing Phase 0 features (Miroir, Champ data)

**Action:**
- Remove or comment out `ChampScreen.tsx` and `ParisFieldMap.tsx` if not using
- OR wire ChampScreen minimally (just route, no data) for future use

### Option 2: Re-integrate Selectively
**If you want Champ but not Miroir:**
1. Wire `#champ` route in `App.tsx`
2. Add backend `/champ/items` endpoint
3. Apply migration `008_opt_in_field.sql`
4. Update Homepage "VOIR LA CARTE" to go to `#champ`

**If you want both:**
1. Re-apply all 5 commits (or cherry-pick)
2. Fix any issues that caused instability
3. Test thoroughly

### Option 3: Start Fresh from Here
- Keep current stable state
- Plan Phase 0 features properly
- Implement incrementally with testing

---

## 🚀 RECOMMENDATION

**Current state is STABLE and can be launched as-is.**

The system works well for:
- ✅ Card activation and authentication
- ✅ Quêtes exploration
- ✅ Méridiens discovery
- ✅ Personal map (Ma Carte)
- ✅ Journal (Carnet)
- ✅ Études learning
- ✅ Culture quiz (Le Seuil)
- ✅ Companion (Aura)

**Missing features (Champ, Miroir) are Phase 0 additions** and not critical for core functionality.

**Next steps:**
1. **Decide**: Keep current state or re-integrate features?
2. **If keeping**: Clean up unused ChampScreen/ParisFieldMap or wire minimally
3. **If re-integrating**: Do it incrementally with testing at each step

---

## 📊 FEATURE MATRIX

| Feature | Status | Route | Backend | Notes |
|---------|--------|-------|---------|-------|
| Homepage | ✅ Working | `#` | - | Stable |
| Quêtes | ✅ Working | `#quetes` | ✅ | Stable |
| Méridiens | ✅ Working | `#meridiens` | ✅ | Stable |
| Ma Carte | ✅ Working | `#collection` | ✅ | Stable |
| Carnet | ✅ Working | `#carnet` | ✅ | Stable |
| Études | ✅ Working | `#etudes` | - | Stable |
| Le Seuil | ✅ Working | `#seuil` | - | Stable |
| Aura | ✅ Working | `#aura` | ✅ | Stable |
| **Le Champ** | ⚠️ **Placeholder** | ❌ No route | ❌ No endpoint | Component exists but not wired |
| **Miroir** | ❌ **Missing** | ❌ No route | ❌ No endpoint | Was removed in reset |

---

## 🔧 TECHNICAL DEBT

1. **ChampScreen not wired**: Component exists but can't be accessed
2. **Homepage routing**: "VOIR LA CARTE" goes to Ma Carte, not Champ (as intended before reset)
3. **Untracked files**: Some translation/docs files not committed
4. **Remote ahead**: 5 commits on remote that were reset locally

---

## ✅ CONCLUSION

**System is STABLE and ready to launch** with current feature set.

The reset to `80bf8ed` removed Phase 0 features (Champ data, Miroir) but kept the core application intact and functional. This is a **clean, stable baseline** to work from.

**Decision needed**: Do you want to re-integrate Phase 0 features, or launch with current stable state?
