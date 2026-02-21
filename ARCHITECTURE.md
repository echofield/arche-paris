# ARCHÉ — Architecture Invariants

## No Displayed Metrics

- `presence_points` / `wisdom_points` / `shadow_points` / `total_points` are **never** rendered as numbers.
- The client receives gestures, hints, and states — not counts.
- If you are tempted to display totals, you are breaking the instrument.

## Screens Are Layers

- Each screen is a layer of perception (Trace → Relation → Echo).
- Avoid dashboards, tabs-as-hubs, and multi-CTA blocks.

## Whispers Must Feel Instant

- No "loading..." whisper states. Precompute or use cached data if needed.

## Semantic Boundary for Meaning

- Backend numeric-ish fields (e.g. `last_delta`) are translated into non-metric, poetic concepts via `src/lib/meaning.ts`.
- UI imports from the meaning layer instead of reading raw points/totals directly.
- Consequence language only; no imperative; never mention points, score, or level in user-facing copy.

## Card Gate as Single Source

- Card session for API requests comes from `getSessionCardCode()` in `src/utils/card-gate-client.ts` only.
- No duplicate localStorage parsing for session/code elsewhere.
