# Walk log, traces, and companion (Ember)

## No-tracking principle

- **No GPS**, no step-counter APIs, no background tracking.
- Daily walking distance is **only** from:
  1. **Explicit quest closes** — when the user completes a walk and presses "Close the walk" (quest’s optional `approxKm` or parsed distance is used).
  2. **Manual entries** — when the user adds a walk via "Add a walk" on My Paris (label + optional km / minutes).
- Nothing is inferred from device motion or location. The user chooses what counts.

## What “Today” and “Walking ~X km” mean

- **Today** = local date (YYYY-MM-DD).
- **Walking ~X km** = sum of `approxKm` for today’s entries (quest closures + manual entries). If an entry has no km, it contributes 0 to the sum. No streaks, no goals, no reminders.

## localStorage keys

| Key | Purpose |
|-----|--------|
| `arche_walk_log_v1` | Walk log: `Record<date, WalkDay>`. Each day has `approxKm` and `entries` (quest + manual). |
| `arche_traces_v1` | Quest thread traces v1: array of `QuestThreadTrace` (stamps with timestamps + optional oracle line). |
| `arche_companion_v1` | Companion “Ember” state: `{ level, lastTouchedAt, lastDecayCheckAt? }`. Level 0–3; bumps on quest close / inscription / presence; decays after 7 days without touch. |
| `arche_traces` | **Legacy.** Quest completion traces (quest_walk). Still used; do not remove. |
| `arche_quest_runs` | **Legacy.** Quest run state (Begin thread / I’m here / Close walk). |

## Fade rules (non-negotiable)

- **No leaderboards**, no progress bars, no streaks, no reminders/notifications.
- **No referral / invite UI**, no kernel calls.
- Copy is calm and minimal. All of this is optional; nothing blocks the core experience.
