# Quest Run — Data model and conventions

## Data model

### Quest run state (localStorage: `arche_quest_runs`)

- **Key**: `arche_quest_runs`
- **Value**: `Record<questId, QuestRunState>`
- **QuestRunState**:
  - `startedAt`: ISO string
  - `currentIndex`: number (current stop index)
  - `proofsByStop`: `Record<stopId, { qrValue?: string; photoBase64?: string; hash?: string }>`
  - `closedAt?`: ISO string when run is finished

### Traces (localStorage: `arche_traces`)

- **Key**: `arche_traces`
- **Value**: array of **QuestTrace** (My Paris trace, Fade-safe)
- **QuestTrace**: `{ kind: 'quest_walk', questId, title, closedAt, stops: [{ stopId, label }] }`
- **API**: `addQuestTrace(trace)`, `listTraces()` in `src/utils/trace-service.ts`

---

## Adding new quests

1. **Quest data**  
   In `src/data/quests.ts`:
   - Add a new entry to `QUESTS_DATA` with `id`, `title`, `subtitle`, `nodes` (each node may have optional `qrKey` for Quest Run proof).
   - Use `getQuestById(id)` to resolve by id.

2. **Enriched copy** (if the quest appears in the enriched list)  
   In `src/data/quests-enriched.ts`:
   - Add a corresponding key in `GEMINI_ENRICHMENT` with `poeticSubtitle`, `curatedDescription`, `quote`, `miniQuest`, `tags`, `badges`, `archetype`.

3. **Quest Run entry point**  
   Route: `#quest-run/<questId>`. Open that hash (e.g. from a link or bookmark) to start a run. No need to add the quest to the main quetes list unless you want a visible card.

---

## Oracle lines (deterministic microcopy)

- **File**: `src/data/oracle.ts`
- **Type**: `OracleThreshold = 'start' | 'arrive_stop' | 'proof_added' | 'close'`
- **API**: `getOracleLine(questId, threshold, stopId?)` → string
  - For `arrive_stop`, pass `stopId` (e.g. `sulpice`, `horloge`, `point-zero`).
- **Authoring**: Add a key per quest in the `ORACLE` object. Use plain strings for `start`, `proof_added`, `close`; use a `Record<stopId, string>` for `arrive_stop`. No LLM; copy is static.

---

## Fade rules (no metrics)

- The Fade glyph opens a **calm** panel only: title, one paragraph, “Not now” and “Seal”.
- **Do not add**: scores, progress bars, levels, badges, counters, leaderboards, referral UI, or kernel calls.
- Sealing remains local-only (stub); no pending lists in this layer.
