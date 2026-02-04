# Map engraving status (pending / verified)

## Current behavior

- **Inscriptions**, **engraved segments**, and **meridian proofs** are created by the client with `status: 'pending'` only. The client never sets `verified`.
- **Status upgrade is manual**: an operator changes `status` from `pending` to `verified` in the Supabase dashboard (or via SQL) for the relevant row in `inscriptions`, `engraved_segments`, or `meridian_proofs`.
- **Client-side detection**: `PersonalMemoryMap.refreshMapState()` fetches map state from Card Gate (`GET /map-state`). When it detects that any item has changed from `pending` to `verified` (compared to the previous state), it emits an engrave event `'verified'`, which can trigger a short oracle whisper (e.g. “Witness recorded.”).
- There is **no automatic upgrade** based on proof validation or time. If auto-upgrade is required later, it would need to be implemented as a separate step (e.g. validation rules in Card Gate or a cron job).

## Summary

| Action              | Where                | Who / what                    |
|---------------------|----------------------|-------------------------------|
| Create pending item | Client → Card Gate   | User (inscription / proof)    |
| Set verified        | Supabase (DB)        | Manual (dashboard / SQL)      |
| Detect verified     | `refreshMapState()`  | Client on next map load/refresh |
