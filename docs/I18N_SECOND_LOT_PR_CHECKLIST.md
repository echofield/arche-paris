# i18n — Second lot : squelette PR et checklist

Périmètre détaillé : `docs/I18N_SECOND_LOT_SCOPE.md`.

## Checklist PR (entrée / sortie)

### Avant de commencer

- [ ] `npm run lint:i18n` → aucune clé manquante FR/EN.
- [ ] Lire `docs/I18N_SECOND_LOT_SCOPE.md` (écrans, async.*/back.*, stratégie).

### Pendant la PR

- [ ] **Formes** (FormesAxe, FormesSeuil, FormesCoupole) : remplacer « Retour », « Retour à Axe/Seuil/Coupole », « ← Retour » par `back.arrow` + `forms.backToAxe` / `forms.backToSeuil` / `forms.backToCoupole`.
- [ ] **Études** (EtudesHub, EtudesLangages, EtudesFormes, etc.) : `back.arrow`, `etudes.backToHub` / `etudes.backToStudies` selon libellé.
- [ ] **Chargement** (InscriptionsPanel, ZoneDetailSheet, Codex, CardEntry, etc.) : `async.loading`.
- [ ] **Traces** : « Réessayer » → `async.retry`.
- [ ] **QueteDetail, MeridiensInterface, ArcheInterface, TresorCache, Systemes*, Langages*, ParisianGlyphs** : `async.back` / `back.arrow` / `back.toCity` selon contexte.
- [ ] **Card** (CardLogin, CardActivation, CardGate, ActivationPage) : réutiliser `app.*` où pertinent ; ajouter `card.loginTitle`, `card.welcomeBack` (ou réutiliser `app.welcomeBack`) et clés métier spécifiques.
- [ ] **Erreurs** (RitualRunner, ZoneEntryFeedback, ChurchQuestRun, KeptSentences, MiroirSurface) : `async.errorTitle`, `async.retry` ; clés spécifiques si besoin.
- [ ] **Utils** (card-gate-client, card-service, inscriptions-service) : messages affichés à l’utilisateur → clés dans fr/en et `t()` côté UI.
- [ ] Réutiliser **async.*** et **back.*** partout où le libellé est identique ; nouvelles clés uniquement pour libellés métier distincts.
- [ ] **Cohérence des clés** : sur le code modifié, faire un grep `t('...')` (ex. `rg "t\('([^']+)'\)" src`) et vérifier le nommage — notamment `back.arrow` (bouton « ← Retour ») vs `async.back` (« Retour » sans flèche) selon le contexte UI.
- [ ] Ajouter les nouvelles clés dans **les deux** `src/locales/fr/*.json` et `src/locales/en/*.json` (même fichier ou nouveau fichier par namespace).

### Après la PR

- [ ] `npm run lint:i18n` → toujours aucune clé manquante.
- [ ] En CI : `npm run lint:i18n:ci` doit passer.
- [ ] Si fallback dans `t()` : prévoir sa suppression après migration complète.

---

## Scripts npm lint i18n (rappel)

| Commande | Rôle |
|----------|------|
| `npm run lint:i18n` | Signale les clés manquantes entre FR et EN (par fichier JSON). |
| `npm run lint:i18n:orphans` | En plus : clés des JSON jamais vues en `t('key')` (whitelist dans le script pour usage dynamique). |
| `npm run lint:i18n:ci` | Pour la CI ; exit 1 si clés manquantes FR/EN. |

Voir aussi `CONTRIBUTING.md` (section PR i18n).

---

## Structure fr/en — diff minimal (second lot)

Fichiers existants : `src/locales/fr/home.json`, `src/locales/en/home.json` (déjà async.*, app.*, back.*).

### Option A — Tout dans `home.json` (diff minimal)

Ajouter les clés suivantes dans **fr** et **en** (mêmes clés, valeurs traduites) :

```json
  "forms.backToAxe": "Retour à l'Axe",
  "forms.backToSeuil": "Retour au Seuil",
  "forms.backToCoupole": "Retour à la Coupole",
  "etudes.backToHub": "Retour au hub",
  "etudes.backToStudies": "Retour aux études",
  "card.loginTitle": "Connexion à votre carte"
```

**Dédupe `card.welcomeBack`** : si le libellé est « Bon retour. » (identique à l’existant), **ne pas** ajouter `card.welcomeBack`. Utiliser partout `app.welcomeBack` :

```ts
// Remplacer systématiquement :
// - "Bon retour." en dur  →  t('app.welcomeBack')
// - t('card.welcomeBack') si vous l’aviez ajouté  →  t('app.welcomeBack')
```

### Option B — Namespaces dédiés (si la liste s’allonge)

- `src/locales/fr/forms.json` + `src/locales/en/forms.json` : `forms.*`
- `src/locales/fr/etudes.json` + `src/locales/en/etudes.json` : `etudes.*`
- `src/locales/fr/card.json` + `src/locales/en/card.json` : `card.*`

Puis charger ces fichiers dans le provider i18n (comme pour champ, map, home, etc.) pour que `t('forms.backToAxe')` résolve.

### Recommandation

Commencer par **Option A** (tout dans `home.json`) pour un diff minimal ; migrer vers Option B si le nombre de clés par namespace devient important.

---

## Mini-scope (périmètre restreint) — plan de commits

Si tu veux dérouler le second lot en plusieurs PR ou commits, voici une déclinaison en 3 étapes. Copier-coller la section voulue dans la description de PR ou en checklist locale.

### Étape 1 : Formes + Études (back.* + async.loading)

**Clés à ajouter (Option A, home.json)** : `forms.backToAxe`, `forms.backToSeuil`, `forms.backToCoupole`, `etudes.backToHub`, `etudes.backToStudies`.

**Checklist ciblée :**

- [ ] FormesAxe, FormesSeuil, FormesCoupole : « Retour » / « ← Retour » → `back.arrow` ; « Retour à Axe/Seuil/Coupole » → `forms.backToAxe` / `forms.backToSeuil` / `forms.backToCoupole`.
- [ ] EtudesHub, EtudesLangages, EtudesFormes, Etudes : « ← Retour » → `back.arrow` ; « Retour aux études » / « Retour au hub » → `etudes.backToStudies` / `etudes.backToHub`.
- [ ] Chargement sur ces écrans : « Chargement... » → `async.loading`.
- [ ] Grep `t('...')` sur les fichiers modifiés : cohérence `back.arrow` vs `async.back`.
- [ ] `npm run lint:i18n` puis `npm run lint:i18n:ci`.

**Suggestion de message de commit :** `i18n(second lot): Formes + Études — back.*, async.loading, clés forms/etudes`

#### Étape 1 — Copier-coller PR (checklist réduite + snippets)

**Checklist réduite à coller en description de PR :**

```
- [ ] home.json (fr/en) : ajouter forms.backToAxe, forms.backToSeuil, forms.backToCoupole, etudes.backToHub, etudes.backToStudies
- [ ] Formes (Axe/Seuil/Coupole) : back.arrow + forms.backTo* selon écran
- [ ] Études : back.arrow + etudes.backToHub / etudes.backToStudies
- [ ] Chargement : async.loading
- [ ] rg "t\('([^']+)'\)" src sur fichiers modifiés → back.arrow vs async.back cohérent
- [ ] npm run lint:i18n && npm run lint:i18n:ci
```

**Snippets de remplacement typiques (Formes + Études) :**

| Contexte | Remplacer | Par |
|----------|-----------|-----|
| Bouton « ← Retour » (nav) | `"← Retour"` / `'← Retour'` | `{t('back.arrow')}` |
| Lien « Retour à l'Axe » | `"Retour à l'Axe"` | `t('forms.backToAxe')` |
| Lien « Retour au Seuil » | `"Retour au Seuil"` | `t('forms.backToSeuil')` |
| Lien « Retour à la Coupole » | `"Retour à la Coupole"` | `t('forms.backToCoupole')` |
| « Retour aux études » | `"Retour aux études"` | `t('etudes.backToStudies')` |
| « Retour au hub » | `"Retour au hub"` | `t('etudes.backToHub')` |
| Indicateur chargement | `"Chargement..."` / `"Chargement…"` | `t('async.loading')` |

#### Template PR complet — Étape 1 (copier-coller)

**Titre :** `i18n(second lot): Formes + Études — back.*, async.loading, clés forms/etudes`

**Description :**

```markdown
## Objectif
Migrer Formes (Axe/Seuil/Coupole) et Études vers les clés i18n (back.*, forms.*, etudes.*, async.loading).

## Checklist

- [ ] home.json (fr/en) : ajouter forms.backToAxe, forms.backToSeuil, forms.backToCoupole, etudes.backToHub, etudes.backToStudies
- [ ] Formes (Axe/Seuil/Coupole) : back.arrow + forms.backTo* selon écran
- [ ] Études : back.arrow + etudes.backToHub / etudes.backToStudies
- [ ] Chargement : async.loading
- [ ] `rg "t\('([^']+)'\)" src` sur fichiers modifiés → back.arrow vs async.back cohérent
- [ ] `npm run lint:i18n && npm run lint:i18n:ci`

## Snippets de remplacement

| Contexte | Remplacer | Par |
|----------|-----------|-----|
| Bouton « ← Retour » (nav) | `"← Retour"` / `'← Retour'` | `{t('back.arrow')}` |
| Lien « Retour à l'Axe » | `"Retour à l'Axe"` | `t('forms.backToAxe')` |
| Lien « Retour au Seuil » | `"Retour au Seuil"` | `t('forms.backToSeuil')` |
| Lien « Retour à la Coupole » | `"Retour à la Coupole"` | `t('forms.backToCoupole')` |
| « Retour aux études » | `"Retour aux études"` | `t('etudes.backToStudies')` |
| « Retour au hub » | `"Retour au hub"` | `t('etudes.backToHub')` |
| Indicateur chargement | `"Chargement..."` / `"Chargement…"` | `t('async.loading')` |
```

---

### Étape 2 : Card + Erreurs

**Clés à ajouter** : `card.loginTitle` (+ autres clés métier Card si besoin). Réutiliser `app.welcomeBack`, `async.errorTitle`, `async.retry`.

**Checklist ciblée :**

- [ ] CardLogin, CardActivation, CardGate, ActivationPage : libellés connexion / erreurs → `card.loginTitle`, `app.welcomeBack`, `app.*` selon cas.
- [ ] RitualRunner, ZoneEntryFeedback, ChurchQuestRun, KeptSentences, MiroirSurface : « Erreur », « Échec », « Réessayer » → `async.errorTitle`, `async.retry`.
- [ ] Dédupe : pas de `card.welcomeBack` si libellé = « Bon retour. » → `app.welcomeBack`.
- [ ] `npm run lint:i18n` puis `npm run lint:i18n:ci`.

**Suggestion de message de commit :** `i18n(second lot): Card + écrans erreur — card.*, async.errorTitle/retry`

**Clés suggérées (Option A, home.json)** : `card.loginTitle`, `card.activationTitle` (si distinct), `card.gateTitle` (si besoin). Réutiliser : `app.welcomeBack`, `app.unexpectedError`, `app.verifyCard`, `async.errorTitle`, `async.retry`.

#### Étape 2 — Copier-coller PR (checklist réduite + snippets)

**Checklist réduite à coller en description de PR :**

```
- [ ] home.json (fr/en) : ajouter card.loginTitle (et card.* métier si besoin) ; pas de card.welcomeBack → app.welcomeBack
- [ ] Card (CardLogin, CardActivation, CardGate, ActivationPage) : card.loginTitle, app.welcomeBack, app.*
- [ ] Erreurs (RitualRunner, ZoneEntryFeedback, ChurchQuestRun, KeptSentences, MiroirSurface) : async.errorTitle, async.retry
- [ ] Dédupe « Bon retour. » → t('app.welcomeBack')
- [ ] rg "t\('([^']+)'\)" src sur fichiers modifiés
- [ ] npm run lint:i18n && npm run lint:i18n:ci
```

**Snippets de remplacement typiques (Card + Erreurs) — JSX/TS :**

| Contexte | Remplacer | Par |
|----------|-----------|-----|
| Titre connexion carte | `"Connexion à votre carte"` | `t('card.loginTitle')` |
| Message « Bon retour. » | `"Bon retour."` | `t('app.welcomeBack')` |
| Titre erreur / toast | `"Erreur"` | `t('async.errorTitle')` |
| Bouton réessayer | `"Réessayer"` | `t('async.retry')` |
| Message erreur inattendue | `"Erreur inattendue"` | `t('app.unexpectedError')` |
| Vérifier la carte | `"Vérifiez la carte."` | `t('app.verifyCard')` |
| Label « Échec » | `"Échec"` | `t('async.errorTitle')` ou clé dédiée si besoin |

**Guidelines optionnelles** : tri des clés dans le JSON (alphabétique) ; après merge, `npm run lint:i18n:orphans` pour lister les clés non utilisées (whitelist si usage dynamique) ; éviter les fallbacks longs dans `t()`.

#### Template PR complet — Étape 2 (copier-coller)

**Titre :** `i18n(second lot): Étape 2 — Card + Erreurs`

**Description :**

```markdown
## Contexte
Ajout / normalisation des clés Card + messages d’erreurs.

## Objectif
Supprimer les hardcodes, harmoniser l’UX, préparer l’extensibilité.

## Scope
- **Fichiers i18n :** home.json (fr/en)
- **Composants / pages :** Card (auth/login), gestion erreurs réseau / inconnues

## Checklist
- [ ] home.json (fr/en) : ajout des clés (voir ci‑dessous)
- [ ] Card : remplacer les libellés par i18n
- [ ] Erreurs : mapper vers async.errorTitle, async.retry, app.unexpectedError, app.verifyCard
- [ ] Dédupe : éviter doublons (réutiliser app.* existantes)
- [ ] grep : plus aucun hardcode pour ce scope (t('...') partout)
- [ ] lint : npm run lint:i18n && npm run lint:i18n:ci ; npm run lint:i18n:orphans OK ; tri JSON OK. Si une task dédiée existe (ex. `npm run lint:i18n:fix`), l’exécuter après modification des JSON.

## Table snippets (contexte → remplacer → par)
| Contexte | Remplacer | Par |
|----------|-----------|-----|
| Titre Card | "Login" / "Connexion" | t('card.loginTitle') |
| Sous-titre accueil | "Welcome back" / "Bon retour" | t('app.welcomeBack') |
| Titre erreur générique | "Something went wrong" / "Erreur" | t('async.errorTitle') |
| Bouton réessayer | "Retry" / "Réessayer" | t('async.retry') |
| Message erreur inconnue | "Unexpected error" | t('app.unexpectedError') |
| Vérification carte | "Verify your card" | t('app.verifyCard') |
| État échec court | "Échec" / "Failure" | t('app.failure') ou async.errorTitle selon contexte |

## Guidelines
- Tri strict des JSON par ordre alpha des chemins complets.
- npm run lint:i18n:orphans sans orphelines (ou whitelist documentée).
- Éviter les fallbacks longs ; préférer des clés dédiées réutilisables.
- **Lint fix** : si une task existe (ex. `npm run lint:i18n:fix`), l’exécuter après modification des JSON pour appliquer tri / format automatique.

## Clés à ajouter (exemple minimal)
Certaines peuvent déjà exister (premier lot) ; n’ajouter que les manquantes.

**en/home.json :**
- card.loginTitle: "Log in"
- app.welcomeBack: "Welcome back"
- app.unexpectedError: "Unexpected error"
- app.verifyCard: "Verify your card"
- async.errorTitle: "Something went wrong"
- async.retry: "Retry"
- app.failure: "Failure"

**fr/home.json :**
- card.loginTitle: "Connexion à votre carte"
- app.welcomeBack: "Bon retour."
- app.unexpectedError: "Erreur inattendue"
- app.verifyCard: "Vérifiez la carte."
- async.errorTitle: "Erreur"
- async.retry: "Réessayer"
- app.failure: "Échec"
```

---

### Étape 3 : Utils + Traces

**Checklist ciblée :**

- [ ] Traces : « Réessayer » → `async.retry`.
- [ ] Utils (card-gate-client, card-service, inscriptions-service) : messages affichés à l’utilisateur → clés dans fr/en, appel `t()` côté UI (pas de chaîne en dur remontée à l’utilisateur).
- [ ] `npm run lint:i18n` puis `npm run lint:i18n:ci`.

**Suggestion de message de commit :** `i18n(second lot): Traces + utils — async.retry, messages services`

---

Indiquer le périmètre prioritaire (étape 1, 1+2, ou tout) pour adapter la PR ; cette section reste prête à copier-coller.

---

## Intégration CI rapide (optionnel)

Pour sécuriser RLS + i18n en CI :

**RLS**
- Exécuter `docs/RLS_SMOKE_TEST_READONLY.sql` (ex. `psql -v ON_ERROR_STOP=1 -f docs/RLS_SMOKE_TEST_READONLY.sql` ou `supabase db execute -f ...`).
- **Run local (snippet)** :
  ```bash
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f ./docs/RLS_SMOKE_TEST_READONLY.sql | tee /tmp/rls_out.txt
  grep '^RECAP_CSV:' /tmp/rls_out.txt | sed 's/^RECAP_CSV://'
  ```
  Si vous ciblez un autre schéma que `public` : `SET LOCAL app.scope_schema = 'xxx';` en tête de script ou avant exécution.
- Option : workflow GitHub Actions `.github/workflows/rls-smoke.yml` — exécute le script (psql 14 épinglé), parse la ligne `RECAP_CSV`, commente la PR avec les compteurs (✅/❌ selon les gates) et lien vers les logs du run, échoue selon `CI_RLS_ALLOW_ANON_GRANTS` / `CI_RLS_ALLOW_AUTHENTICATED_GRANTS`. Déclenchement : PR (opened/synchronize/reopened) ou **workflow_dispatch** (Actions → RLS Smoke Recap → Run workflow) pour rejouer à la demande (ex. label « RLS-hardening », gros refactors). Renseigner les secrets `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`.
- **Preset 100 % RLS** : `CI_RLS_ALLOW_ANON_GRANTS=0` et `CI_RLS_ALLOW_AUTHENTICATED_GRANTS=0`. Si migration en 2 temps, basculer d’abord `authenticated` à 0 sur les nouvelles tables, puis activer le preset. Fenêtre de monitoring : consulter le job summary sur quelques runs après activation pour confirmer qu’aucune table legacy ne fuit des grants.
- Voir aussi `docs/RLS_CI_CHECK.sql` pour le check strict (RLS + 4 policies + GRANTs anon).
- **Observabilité Supabase (bonus)** : Edge Function `rls-smoke` (GET) appelle `public.get_rls_smoke_status()` et renvoie 200 + récap JSON si policy/grants OK, 500 sinon. Utile en canari (alertes/monitors externes). Protéger par secret ou réseau interne. Logs Postgres/Edge à consulter en cas de régression suspectée.

**i18n**
- `npm run lint:i18n:ci` : échoue si clés manquantes FR vs EN.
- Option : job dédié qui vérifie clés manquantes vs source (ex. `en` = référence), clés non utilisées (grep / `lint:i18n:orphans` avec whitelist), tri/format JSON stable (ex. script de format ou `sort-keys`).
