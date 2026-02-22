# ARCHÉ — Perfection Roadmap (backlog)

Phased backlog for keeping ARCHÉ as an instrument. No code changes in this doc; implement when prioritised.

---

## 1) Global Entrance Ritual

| Deliverable | Notes |
|-------------|--------|
| Small `EntranceRitual` component (1 line of meaning, 1 gesture, 1 state: silence/ready) | Single doorway into the OS. |
| Used by Homepage, Mon Paris, Aura, Trésor | One ritual, shared entry. |

---

## 2) Meaning boundary generalized

| Deliverable | Notes |
|-------------|--------|
| Extend `src/lib/meaning.ts`: `interpretZoneReasonCode()`, `interpretUnlock()`, `interpretPresenceMoment()` | Builds on current `interpretComplexionDelta`. |
| No screen renders raw codes/counts | All numeric-ish backend fields go through the meaning layer. |

---

## 3) Presence progression coherent

| Deliverable | Notes |
|-------------|--------|
| Shared `PresenceMeter` module | Ring density, arc, seals; same visual language everywhere. |
| Presence state label (e.g. Diffuse → Rayonnante) | Single vocabulary across screens. |

---

## 4) Recognition moments (rare)

| Deliverable | Notes |
|-------------|--------|
| `useRecognitionMoment()` hook with timing constants | "New territory opened today", "Return resonance", "Threshold nearly visible". |
| Triggered deterministically, limited frequency | Rare, not gamified. |

---

## 5) Rhythm unification

| Deliverable | Notes |
|-------------|--------|
| `src/lib/rhythm.ts` — single source for pulse interval, whisper duration, transition curves | Shared heartbeat/tempo. |

---

## Reference

- Architecture invariants: [ARCHITECTURE.md](../ARCHITECTURE.md)
- Meaning layer: [src/lib/meaning.ts](../src/lib/meaning.ts)
- Location trust (GPS): [src/lib/location-trust.ts](../src/lib/location-trust.ts)
