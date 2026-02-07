# ARCHÉ — Design: map vs gold

## Rule

- **Map strokes stay graphite.** Base cartography (homepage Paris map, map layers, boundaries, rivers) uses a warm graphite/ash tone only. No gold on the map itself.
- **Gold is reserved for earned inscriptions:** thresholds, seals, accepted/verified proofs, and other “recognition” moments. Never for base cartography.

## Tokens

- **Cartography / map strokes:** `--map-ink` (warm graphite, e.g. `rgba(60, 63, 58, …)`). Use the same hue for all map layers; vary only opacity.
- **Earned / recognition:** `--gold` (e.g. `#A38767`). Use for thresholds, seals, verified proofs, and similar UI that signals “earned” or “accepted.”

## Summary

| Use case | Token / color |
|----------|----------------|
| Base map (strokes, boundaries, rivers) | `--map-ink` (graphite) |
| Thresholds, seals, verified proofs, earned marks | `--gold` |
