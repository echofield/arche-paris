# Premier lot i18n (AUDIT 2025-02-23)

Clés ajoutées et composants patchés pour déduplication des libellés en dur.

## Nomenclature

- **app.** — App.tsx : mode démo, déconnexion, session expirée, chargements, annuler
- **async.** — Chargement, erreur, réessayer, retour, connexion interrompue (déjà présentes)
- **carnet.** — CarnetParisien : inaccessible
- **map.** — PersonalMemoryMap / HomepageV1 : sync interrompue, rencontre, Paris vous attend, ajouter marche, km/minutes optionnel, présence, échec gravure
- **back.** — BackButton : Retour à la cité, ← Retour
- **champ.** — ChampScreen : sendError (envoi impossible)

## Fichiers de clés

- `src/locales/fr/home.json` — app.*, carnet.inaccessible, map.*, back.*
- `src/locales/en/home.json` — idem (EN)
- `src/locales/fr/champ.json` — champ.sendError
- `src/locales/en/champ.json` — champ.sendError

## Composants patchés

| Composant | Changements |
|-----------|-------------|
| **App** | LanguageProvider déplacé dans main.tsx ; useTranslation ; app.demoMode, verifyCard, welcomeBack, rateLimitRetry, loading*, disconnect*, cancel, sessionExpired*, password |
| **CarnetParisien** | carnet.inaccessible, async.retry, async.back |
| **ChampScreen** | champ.sendError pour message d’erreur d’envoi |
| **PersonalMemoryMap** | map.syncInterrupted, map.encounter, map.parisWaiting, map.youAreHere, map.addWalk, map.kmOptional, map.minutesOptional, map.presenceMatters, map.failedToEngrave |
| **HomepageV1** | async.connectionInterrupted, async.retry, map.syncInterrupted |
| **BackButton** | label par défaut : back.toCity (via useTranslation) |

## Déduplication

- « Chargement… » → **async.loading** ou **app.loading** (fallback écrans)
- « Réessayer » → **async.retry**
- « Connexion interrompue » → **async.connectionInterrupted**
- « Synchronisation interrompue » → **map.syncInterrupted**
- « Retour » (générique) → **async.back**
- « Retour à la cité » → **back.toCity**

## i18n merge

- `enChamp` ajouté au merge EN dans `src/utils/i18n.tsx` pour que `champ.*` soit disponible en anglais.

## Vérifications runtime (éviter régressions)

- **Ordre d’initialisation :** `LanguageProvider` est dans `main.tsx` et enveloppe `App`, donc tout appel à `useTranslation()` dans App et les routes enfants s’exécute après le provider. OK.
- **Namespaces EN :** pas de lazy load par namespace (i18n maison avec merge unique par langue). Les clés `champ.*`, `app.*`, `async.*`, `map.*`, `back.*`, `carnet.*` sont dans le même bundle (home.json + champ.json) ; le merge EN inclut `enChamp`. OK.
- **Langues actives :** fr, en.
- **Structure :** `src/locales/fr/*.json` et `src/locales/en/*.json` (plusieurs fichiers par langue, fusionnés dans `i18n.tsx`).
