# Cursor Safeguard — ARCHÉ Architecture Preservation

Paste this (or the short version below) before giving Cursor a file or task so it preserves structure instead of expanding features.

Context: [HANDOFF.md](HANDOFF.md), [MON_PARIS_PAGE_BACKEND_AND_AUDIT.md](MON_PARIS_PAGE_BACKEND_AND_AUDIT.md), [TRESOR_CACHE_BACKEND_AND_AUDIT.md](TRESOR_CACHE_BACKEND_AND_AUDIT.md).

---

## Full prompt (copy-paste)

```
You are implementing inside an already stabilized architectural system.

Your priority is STRUCTURAL PRESERVATION, not feature expansion.

Hard rules:

1. The Paris map is the permanent substrate.
   - Never replace it.
   - Never move it into another layout.
   - All new elements must be overlays or layers above it.

2. Instruments are interpreters, not navigation pages.
   - Do not add routes.
   - Do not add dashboards, panels, or secondary layouts.
   - Do not introduce new navigation logic.

3. UI space is considered finalized.
   - Do not resize major containers.
   - Do not introduce new global headers, sidebars, or menus.
   - Maintain current spatial hierarchy.

4. Motion defines state transitions.
   - No setTimeout.
   - Use existing motion.ts tokens only.

5. Data additions must be declarative.
   - Extend datasets/config objects only.
   - Do not rewrite rendering architecture.

6. When unsure, choose the MINIMAL change that preserves calm visual density.

Your role is to integrate, not redesign.
If a change risks altering structure, stop and propose a minimal alternative instead.
```

---

## Ultra-short version

```
Preserve architecture.
Map is substrate.
Instruments are overlays only.
No new routes, layouts, or navigation.
Use motion.ts only.
Prefer minimal edits over refactors.
```

---

## Before coding

**Before coding, summarize what must NOT change.**

Use this as the mandatory first step so constraints are internalized before any edit.
