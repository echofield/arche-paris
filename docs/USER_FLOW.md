# ARCHÉ — User flow

How a user moves through the app (world-only, no kernel).

---

## 1. Entry

1. **Open app** → Card entry screen (CardEntry).
2. **Card**  
   - If URL has `?card=PS-XXXX` or a card is in localStorage → validate → if valid, go to **Welcome** then **Home**.  
   - If no card or invalid → manual entry or “Continue” (if already validated on this device).
3. **Home** (homepage)  
   - Nav: Marches, Études, Carnet, Ma Carte, Le Seuil.  
   - Top-left: glyph + companion (Fade boundary; optional “Seal a moment”).  
   - Center: Paris map outline, “Ou voir la carte” → Ma Carte.  
   - Bottom: “La ville nous attend.”  
   - Trésor caché (left) → Hunter / treasure entry.

---

## 2. Main navigation (from Home)

| Action        | Screen     | Hash / route          |
|---------------|------------|------------------------|
| Marches       | Quest list | `#quetes`              |
| Études        | Études hub | `#etudes`              |
| Carnet        | Notebook   | `#carnet`              |
| Ma Carte      | My Paris   | `#collection`          |
| Le Seuil      | Culture quiz | `#seuil`             |
| Ou voir la carte | My Paris | `#collection`          |
| Trésor caché  | Hunter Montmartre detail | `#quete/hunter-montmartre` |

---

## 3. Marches (quest list)

- **Screen:** QuetesV1.
- **Content:** “Trois manières de traverser Paris” — **3 cards**: Lutèce, 1789, Vin & Table.
- **Interaction:** Click a card → **Quest detail** (`#quete/<id>` with id = `lutece` | `1789` | `table`).
- **Back:** “Retour à la cité” → `#quetes` or home (depending on nav).

**Note:** Temporal Meridians (Saint-Sulpice) is **not** in this grid. It exists in data and in QueteDetail; see “Where is the Saint-Sulpice quest?” below.

---

## 4. Quest detail (QueteDetail)

- **URL:** `#quete/<queteId>` (e.g. `#quete/lutece`, `#quete/temporal-meridians`).
- **Content:** Title, description, stops (with “I’m here”), optional “Begin the thread” and “Close the walk”.
- **Flow:**  
  - **Begin the thread** → start run (localStorage), then optionally **Start the walk** → `#quest-run/<questId>`.  
  - Per stop: **I’m here** (gated in order) → witness/proof (optional) → oracle line.  
  - When all stops stamped: **Close the walk** → walk log, trace v1, companion bump, journal line, reward (e.g. ARC-000).
- **Back:** → `#quetes`.

---

## 5. Quest run (QuestRun)

- **URL:** `#quest-run/<questId>` (e.g. `#quest-run/temporal-meridians`).
- **When:** User goes to a quest detail that supports “Start the walk” and clicks it (or equivalent).
- **Content:** Sequential stops, “I’m here” / proof, oracle whispers.
- **Close the walk:** Same effects as in QueteDetail (walk log, trace v1, companion bump, journal).
- **Back / Close:** → `#quetes`.

---

## 6. My Paris (Ma Carte)

- **URL:** `#collection`.
- **Content:**  
  - **Today:** “Walking: ~X km”, up to 3 entries, “Add a walk”.  
  - **Traces:** List of v1 traces (title + date); tap → detail (stamps, time, oracle line).  
  - **Map:** Paris SVG, collected symbols, quest threads (from runs).  
  - Note area, “Share my Paris”, “In your notebook” → Carnet.
- **Data:** Walk log (`arche_walk_log_v1`), traces v1 (`arche_traces_v1`), runs (`getRuns()`), collection.

---

## 7. Other screens

- **Carnet:** Notebook (journal); My Paris note syncs here.
- **Le Seuil:** Culture quiz.
- **Études:** Hub (études content).
- **Hunter Montmartre:** Special quest UI at `#quete/hunter-montmartre`.

---

## Where is the Saint-Sulpice quest?

**Id:** `temporal-meridians` (Saint-Sulpice, Horloge, Point Zéro).

**In the app:**

- **Data:**  
  - `src/data/quests.ts` — full quest definition (nodes, coords, `approxKm`, etc.).  
  - `src/components/QueteDetail.tsx` — `QUETES_DATA['temporal-meridians']` (stops, oracle/geste, nodeIds, coordinates).  
  - `src/data/oracle.ts` — oracle lines for Temporal Meridians.
- **Routing:**  
  - Detail: `#quete/temporal-meridians`.  
  - Quest run: `#quest-run/temporal-meridians`.
- **Visibility:**  
  - **Not** in the Marches grid (QuetesV1). The grid shows only **3** quests: Lutèce, 1789, Vin & Table.  
  - So users only get to Saint-Sulpice if they have a direct link (`#quete/temporal-meridians` or `#quest-run/temporal-meridians`) or you add it to the Marches list / another entry point.

**To make it visible from Marches:** Add a 4th card in `QuetesV1.tsx` (in the `QUETES` array) for `temporal-meridians`, or add a separate “Temporal Meridians” entry (link or button) that navigates to `#quete/temporal-meridians`.

---

## Marche styling (future)

The **Marches** screen (QuetesV1) uses a distinct layout: 3 large image cards, “registre”, theme, duration. The rest of the site (Home, My Paris, Carnet, Fade panel) is more minimal (cream, serif, low density).

**Should we update Marche to feel more like the rest of the website?**  
That’s a **future** design decision: same content (quests, detail, run), possible visual alignment (typography, spacing, fewer decorative elements) to match the calm, “quiet luxury” of the rest of ARCHÉ. No change required for the current flow or for Saint-Sulpice to work; it’s optional consistency.

---

## Flow summary (high level)

```
Entry (card) → Home → [Marches | Carnet | Ma Carte | …]
  → Marches → Quest list (3 cards) → Detail (#quete/<id>)
    → Begin thread → (optional) Quest run (#quest-run/<id>)
    → I'm here (per stop) → Close the walk
      → Walk log + Trace v1 + Companion bump + Journal
  → Ma Carte → Today (~km, entries, Add a walk) + Traces + Map
  → Glyph (all main screens, top-right) → Fade panel (Seal / Not now)
```

All persistence is local (localStorage); no kernel calls. Quests are optional; nothing blocks the core experience.

---

## Future: 365 calendar in the Carnet

A 365-day calendar in the Carnet, starting when the user first enters their code (card activation), with a "different feeling through space and time." Design may require deeper research or a dedicated design prompt. See [docs/FUTURE_CARNET_CALENDAR.md](FUTURE_CARNET_CALENDAR.md).
