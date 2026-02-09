# ARCHÉ — Translation status (EN)

What is translated via locale files or in-code EN, and what is still French-only.

---

## ✅ Translated (locale or in-code)

| Area | Source | Notes |
|------|--------|--------|
| **Home** | `home.json` (en/fr) | Nav labels (Walks, Studies, Notebook, My Paris, The Threshold, Meridians, Disconnect), cards, subtitle, sentence, footer. |
| **Walks / Studies page titles** | `home.json` + `t()` in components | "Walks" / "Marches", "Studies" / "Études"; Quetes subtitle "Choose a door." / "Choisissez une porte."; EtudesPage title + History section label. |
| **Map (Mon Paris)** | `map.json` (en/fr) | Roles, layers, Écrire (Write), placeholders, errors. |
| **Treasure (Trésor caché)** | `treasure.json` (en/fr) | Compass, pressure, labels. |
| **Meridians** | `meridiens.json` (en/fr) | Threshold names, hints, status, prompts. |
| **History (Histoire)** | `history.json` (en/fr) | Archives / moments (if keys used in component). |
| **Origin** | `origin.json` (en/fr) | Modal, describe. |
| **Culture Quiz (Le Seuil)** | `seuil.json` (en/fr) + `quiz-questions.ts` | Quiz UI (level, mode, result messages) + all questions/choices/explanations/LEVELS in EN in TS. |
| **PersonalMemoryMap** | `t('nav.quests')` | "Walks" label in sidebar. |

---

## ❌ Not translated (hard-coded French)

### Walks (Marches) — inner content

| File | Content |
|------|--------|
| **QuetesV1.tsx** | `QUETES` array: titles ("LUTÈCE — ORIGINE", "1789 — DÉCISION", "VIN & TABLE — VIE PARISIENNE"), `theme`, `shortDescription`, `duree` ("≈ 1h30–2h", etc.). |
| **QueteDetail.tsx** | Full quest data: titles, descriptions, step names, `geste` text for each node, `duree`. Label "Durée :". |
| **Quetes.tsx** | Same quest list; "Choisissez une porte"; `quest.duree`. |

So: **nav and page title** are EN when language is EN; **card titles, themes, descriptions, durations and all detail content** stay in French.

### Études — inner content

| File | Content |
|------|--------|
| **FormesSeuil.tsx** | Hero, definitions (Courte / Développée), typologies, examples, questions, exercises; "Durée :", "Matériel :"; all body copy. |
| **FormesAxe.tsx** | Same: hero, definitions, repères, exercises, "Durée :", options. |
| **FormesCoupole.tsx** | Same: hero, definitions, 4 typologies, exemples à Paris, questions d'attention. |
| **EtudesHub.tsx** | Sector names come from data; if sector names are in FR in code, they stay FR. |
| **EtudesFormesV2.tsx** | Section content, lesson list (LA COUPOLE, AXE, SEUIL) — titles may be from data; body copy in Formes* is FR. |
| **SystemesPouvoir.tsx** | `PRINCIPE`, `texte`, `explication` — all FR. |
| **SystemesPouvoirSeuil.tsx** | Same. |
| **LangagesArgot.tsx** | `texte`, etc. — FR. |
| **LangagesSalon.tsx** | `explication` — FR. |
| **OrigineManifeste.tsx** | Paragraphs — FR. |
| **ParisianGlyphs.tsx** | `description`, `meaning` — FR. |
| **LessonColonneV2.tsx** | "Équilibre. Rythme..." — FR. |
| **FormesAcceleration.tsx** | "La verticale porte.", "La cachée porte la visible." — FR. |

So: **Études hub and Formes page titles** can use locale where `t()` is used; **all editorial content** (definitions, typologies, questions, principles, gestures) is French-only.

### Other UI strings (French-only)

| File | Example |
|------|--------|
| **CardActivation.tsx** | "Choisissez un mot de passe pour la protéger." |
| **CarnetParisien.tsx** | "Exporter PDF" |
| **QueteDetail.tsx** | "Durée :" (next to duration) |
| **Landing.tsx** | "Votre Paris commence ici." |
| **HistoireInteractive.tsx** | Era labels, timeline content (e.g. "Révolution", "Révolution de Février", Bastille text). |
| **ActivationPage.tsx** | "Votre carte est la porte." (and other copy) |

---

## Summary

- **Nav, home, map, treasure, meridiens, history, origin, Culture Quiz (UI + questions)** → translated; switching to EN changes these.
- **Walks** → only the section title and subtitle are translated; **all quest content** (cards + detail steps, geste, duree) is FR.
- **Études** → only the section title (and any hub labels that use `t()`) are translated; **all Formes / Langages / Systemes / Origine content** is FR.
- **Card activation, Carnet PDF, Landing, Histoire interactive** → French-only unless you add keys and `t()`.

To have **full EN** for Walks and Études you would need to either:

1. Move quest and Études content into locale files (e.g. `quests.json`, `etudes-formes.json`) and use `t()` in components, or  
2. Keep a separate EN data set (e.g. `QUETES_EN`, Formes content in EN) and pick by language — more duplication but no refactor of structure.

Until then, **only the shell (titles, nav, quiz)** is bilingual; **the inner content of Walks and Études stays French**.
