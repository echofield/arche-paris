# ARCHÉ — Design philosophy

Principles that steer how we build the experience. Not a spec; a lens.

---

## 1. Never lie to the walker

**The instrument must not claim what it cannot know.**

- If the reading is unreliable (poor accuracy, moving too fast, out of coverage), we do not show alignment, distance, or “you are here” as fact. We show a **fallback state** and a **short, honest hint** — no numbers, no fake precision.
- Confidence is gated: only when signal quality is sufficient do we output a “good” reading. Otherwise: same safe state (e.g. EGARE) and a line like “Signal faible — reste immobile 3 secondes.” or “Hors champ — Paris seulement.”
- **No wrong meridian reading.** No wrong place scan. No wrong seal.

---

## 2. Quiet witness, not dashboard

**We do not expose raw measurement to the walker.**

- No ±Xm, no coordinates, no accuracy digits in production UI. Numbers stay in logic and, if needed, behind a debug flag.
- Copy is a **quiet witness**: one short sentence that describes the situation without gamifying or blaming. FR/EN via i18n.
- The walker feels the place; they don’t manage a GPS panel.

---

## 3. One source of truth for “I am here”

**Presence is gated by a single protocol, not ad‑hoc GPS.**

- Meaningful actions (unlock, seal, progression, “Lire”) require **verify()** and a grade (MED for soft confirmation, HIGH for seal). We do not trust raw position for these.
- Smoothing and dot can still use watchPosition for feel; **state changes** (threshold, crossing, proof) go through the presence layer.
- No second, parallel GPS paradigm in production. One protocol, one contract.

---

## 4. Shared hardening, no coupling

**Instruments share measurement discipline without depending on each other.**

- Constants (accuracy thresholds, stillness window, buffer cap) live in shared utils (e.g. `meridien-geo`). Each instrument uses them; no instrument imports another’s UI.
- Typed confidence (e.g. `MeridienSignalQuality`) and clear fallbacks keep behavior consistent. Contracts (MERIDIEN_FRONTEND_CONTRACT, PLACE_SCAN_FRONTEND_CONTRACT) document how to honor each instrument.
- We add the minimal types and states needed — no schema sprawl.

---

## 5. Privacy by default

**We do not log or persist raw location beyond what the product needs.**

- No new tables for lat/lon. No sending of raw coordinates except where the app already does (e.g. proof with radius, place scan request). Server receives only what it needs (e.g. zone id, H3, burst samples for verify).
- The place recognizes the walker; we don’t build a trail.

---

## 6. No dead ends

**The UI always has a valid state to show.**

- Every path returns a valid shape. Missing GPS, bad accuracy, or out-of-coverage → same fallback object (e.g. EGARE, empty cards) plus the appropriate hint. No undefined, no throw, no blank “error” that blames the user.
- Fallbacks are part of the design, not an afterthought.

---

## 7. Paris as frame, not feature list

**The city is the frame; the app is a lens.**

- We use a simple Paris bbox for “in range” vs “out of coverage.” We don’t over-resolve or over-explain. One line: “Hors champ — Paris seulement (pour l’instant).”
- Instruments (méridien, place scan, carte) stay within this frame. We don’t promise global coverage or generic “location features.”

---

## Summary

| Principle | In practice |
|-----------|-------------|
| Never lie | Confidence gates; fallback + hint when quality isn’t good |
| Quiet witness | No meters/coords in prod; one short i18n sentence |
| One presence | verify() for state changes; no second GPS paradigm |
| Shared hardening | Shared constants and types; contracts per instrument |
| Privacy by default | No raw persistence; minimal server payload |
| No dead ends | Valid state object and hint on every path |
| Paris as frame | Bbox and “for now” copy; no over-promise |

These sit alongside the [Archetypal Compass](ARCHETYPAL_COMPASS.md) and the per-instrument contracts. Use them to judge design and implementation choices.
