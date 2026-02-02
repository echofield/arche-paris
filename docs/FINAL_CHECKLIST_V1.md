# ARCHÉ Paris — FINAL CHECKLIST (no new features)

**Date:** 2025-02-01  
**Build:** `npm run build` — ✅ **PASS** (exit 0, no errors)

---

## [ ] Re-run npm run build (must be clean)

**Result:** ✅ **PASS** — Build completes successfully. (Chunk size warning only; no errors.)

---

## [ ] Manually test (requires browser)

| Test | How to verify |
|------|----------------|
| Close a quest → Today ~X km updates | Complete a quest, close it; check Today summary (e.g. My Paris or Carnet) |
| Close a quest → New Carnet entry (Walk / Quest completed) | Close quest → open Carnet → see new walk line |
| Close a quest → Companion word bumps | Close quest → companion level/word can change (bump on `quest_closed`) |
| Add a manual walk → appears in Carnet | My Paris → add walk → Carnet shows entry with Walk label |
| Open Fade → see reflective question | Click glyph (top-right) → Fade panel shows `getReflectiveQuestion()` |
| Open Carnet → see reflective question | Carnet screen shows reflective question (if wired in UI) |

**Code verification:**  
- Quest close: `QueteDetail` and `QuestRun` call `appendWalkToJournal`, `bump('quest_closed')`, and today km comes from walk service.  
- Manual walk: `PersonalMemoryMap` calls `appendWalkToJournal(cardId, content)`.  
- Fade: `App.tsx` uses `getReflectiveQuestion()` in the Fade panel.  
- Carnet: loads journal from Supabase; reflective question presence in Carnet UI should be confirmed in browser.

---

## [ ] Confirm: No progress bars · No streaks · No ranks/points/XP · No referral/invite · No kernel from world

| Rule | Status | Notes |
|------|--------|--------|
| **No progress bars** | ❌ **FAIL** | `HunterMontmartre.tsx` (lines 415–432) has a visible progress bar: `collectedCount / MONTMARTRE_HUNT.length` as a width %. |
| **No streaks** | ✅ PASS | No streak logic in codebase. |
| **No ranks / points / XP** | ❌ **FAIL** | `CollectionMap.tsx` shows **yourRank** (`t('map.stats.yourRank')`) and role names (traveler, guide, hero, guardian) derived from collection count (ROLE_THRESHOLDS). |
| **No referral or invite UI** | ✅ PASS | No referral/invite UI. Only copy uses “invitation” (e.g. “Ou voir la carte”, “t’invite”). |
| **No kernel/network from world layer** | ✅ PASS | World layer uses Supabase only (card validation, journal). No separate kernel/network service. |

**To satisfy checklist before FREEZE v1:**  
- Remove or replace the **progress bar** in Hunter Montmartre (e.g. plain “X / Y collected” text only).  
- Remove or soften **rank/role** in Collection Map (e.g. remove “yourRank” and role title, or keep only “X / Y collected” with no role names).

---

## [ ] Confirm glyph + companion visible on all main screens, top-right

**Result:** ✅ **PASS**  
- In `App.tsx`, when `appState === 'ready'`, the glyph (ArcheSymbol) and `CompanionBlock` are rendered in a fixed block: `top: 20`, `right: 24`, `zIndex: 10001`.  
- They appear on every screen when the app is in `ready` (no condition on `currentScreen`).  
- `PersonalMemoryMap` also renders `CompanionBlock` inside its own layout; elsewhere the global one in App applies.

---

## [ ] Confirm Back button not obstructed

**Result:** ✅ **PASS**  
- Glyph + companion are **top-right**.  
- `BackButton` is used by screens with `onBack` and is typically top-left.  
- No overlap in layout.

---

## [ ] Confirm Supabase journal inserts only on explicit actions (quest close, manual walk)

**Result:** ⚠️ **PARTIAL**  
- **Quest close:** `appendWalkToJournal` is called from `QueteDetail` and `QuestRun` on close. ✅  
- **Manual walk:** `appendWalkToJournal` is called from `PersonalMemoryMap` for the “add walk” flow. ✅  
- **Additional explicit inserts in current code:**  
  - **Symbol collect:** `syncCollectionToJournal` on collect in `CollectionMap` and `HunterMontmartre` → inserts “Collected: …” into journal.  
  - **My Paris note:** `saveMyParisNote` upserts/inserts one note per card for My Paris.  
- So journal inserts today are: (1) quest close, (2) manual walk, (3) symbol collect, (4) My Paris note save. If the rule is strictly “only quest close + manual walk”, then (3) and (4) are extra and you may want to disable or move them; otherwise, all are explicit user actions.

---

## Summary

| Item | Status |
|------|--------|
| Build clean | ✅ |
| Manual test (browser) | ⬜ To do |
| No progress bars | ❌ Hunter Montmartre has one |
| No streaks | ✅ |
| No ranks/points/XP | ❌ Collection Map has rank/role |
| No referral/invite UI | ✅ |
| No kernel from world | ✅ |
| Glyph + companion top-right on main screens | ✅ |
| Back button not obstructed | ✅ |
| Journal inserts only on explicit actions | ⚠️ Quest close + manual walk + symbol collect + My Paris note |

**If all checks pass (after fixing progress bar and rank) → FREEZE v1. No refactor. No expansion.**
