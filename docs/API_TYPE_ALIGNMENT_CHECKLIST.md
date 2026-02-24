# api.ts type alignment checklist — AUDIT 2025-02-23

Align `src/lib/api.ts` return types with actual Edge Function / Card Gate responses. For each method: capture a live sample (or inspect Edge code), compare to the declared type, then adjust type or add a runtime guard.

---

## Process per method

1. **Capture** a sample response (DevTools Network, or Edge Function return shape).
2. **Compare** field names (snake_case vs camelCase) and optional vs required.
3. **Adjust** the TypeScript interface to the narrowest accurate shape.
4. **Optional** Add a small runtime guard if responses can vary (e.g. discriminated union on `status`).
5. **Contract delta** If the API shape changed since a contract doc was written, update `docs/PLACE_SCAN_FRONTEND_CONTRACT.md` or `docs/MERIDIEN_*` and add a “Contract delta” note in `docs/REPO_AUDIT.md`.

---

## Checklist by method

| Method | Return type | Path / invoke | Notes |
|--------|-------------|---------------|-------|
| placeScan | PlaceScanResult | invoke('place-scan') | Aligned with Edge + contract. Guard: `isPlaceScanResult()`. |
| zonesEnter | EventResponse | invoke('zones-enter') | event_id, ts, isNew. |
| ritualsStart | RitualStartResponse | invoke('rituals-start') | + run_id. |
| ritualsComplete, ritualsAbort, ritualsShortcut | RitualEndResponse | invoke(...) | + zone_progress?, complexion?. |
| engravingsCreate | EngravingResponse | invoke('engravings-create') | + engraving_id. |
| pathsRecord | PathResponse | invoke('paths-record') | + path_id. |
| challengesCreate | ChallengeResponse | invoke('challenges-create') | + challenge_id. |
| challengeAttemptStart/Complete/Abort | AttemptResponse | invoke(...) | attempt_id, challenge_id. |
| meArchiveMap | ZoneMapData | invoke('me-archive-map') | zones, stats. |
| meArchiveLedger | LedgerData | invoke('me-archive-ledger') | day, event_count, summary, events[]. |
| meComplexion | ComplexionData | invoke('me-complexion') | requireUserSession: true. |
| feedNext | FeedNextData | invoke('feed-next') | why_line, target_zone_id, etc. |
| zoneConsciousness | ZoneConsciousnessData | invokeCardGate('zone-consciousness?h3=...') | ok, h3, zone_id, metrics, zone_state, replay. |
| lawEvaluate | LawEvaluateData | invokeCardGate('law/evaluate?...') | allowed, reason_code, message, requirements, policy, context. |
| presencePulse | PresencePulseData | invokeCardGateRequest POST presence/pulse | ok, accepted, cooldown_ms. |
| worldSnapshot | WorldSnapshotData | invokeCardGate('world/snapshot?...') | version, zone_id, h3, cards, law, me, etc. |
| worldSnapshotForZone | WorldSnapshotData | invokeCardGate('world/snapshot?...') | Same shape as worldSnapshot. |
| zoneProgress | ZoneProgressData | invokeCardGate('zone-progress') | Aligned with Card Gate. Optional `ok?: true`; guard: `isZoneProgressData()`. |
| inscriptionsCreate | InscriptionCreateResponse | invoke('inscriptions-create') | inscription_id, etc. |
| inscriptionsList | InscriptionListData | invoke('inscriptions-list') | zone_id, inscriptions[], total, limit, offset. |
| decisionMade | { ok, event_id?, isNew? } | invoke('decision-made') | Narrow; extend if more fields returned. |

---

## Conventions

- Prefer **exact string literal unions** for status/codes (e.g. `reason_code: 'OK' | 'AUTH_REQUIRED' | ...`).
- Use **snake_case** if the API returns snake_case; keep one convention at the boundary and document in contract.
- Mark **optional** fields with `?` and guard at usage sites when needed.
- For Card Gate responses that can be success or error, consider a union and a type guard:
  - `type CardGateResult<T> = { data: T; error: null } | { data: null; error: string };` (already used as ApiResult<T>).
- Document any **HTTP or shape difference** (e.g. 201 vs 200) and normalize at the api boundary so the UI stays stable.

---

## After alignment

- Run type-check: `npm run build` or `npx tsc --noEmit`.
- Smoke one instrument (e.g. place-scan, zone-progress) to ensure parsing still works.
- Add a “Contract delta” subsection in REPO_AUDIT.md for any breaking or notable change.
