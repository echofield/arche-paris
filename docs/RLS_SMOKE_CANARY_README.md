# RLS Smoke Canary

Canari HTTP pour surveiller l’état RLS (policies + grants) d’un projet Supabase.  
GET sur l’Edge Function → **200** si tout est conforme, **500** sinon, **401** si clé API invalide. Utilisable en CI, monitoring externe ou alertes.

---

## Contexte

- **Objectif** : vérifier qu’aucun rôle `anon` ni `authenticated` n’a de privilèges directs sur les tables des schémas ciblés (modèle “100 % RLS”).
- **200** : `ok: true` — aucun grant anon/authenticated détecté sur les schémas demandés.
- **500** : `ok: false` ou erreur RPC — au moins un schéma en échec ou erreur serveur.
- **401** : clé `X-API-Key` absente ou invalide (auth canari).

Le corps de la réponse est toujours un JSON (récap multi-schémas ou erreur). Chaque réponse inclut un **request_id** (UUID v4) pour corréler un appel CI ↔ log Edge ↔ log Postgres.

---

## Modes : simple vs multi-schémas

| Mode | URL / param | RPC appelée | Réponse |
|------|-------------|-------------|---------|
| Simple (1 schéma) | `?schema=public` | `get_rls_smoke_status_multi(ARRAY['public'])` | `ok`, `schemas.public`, `meta` |
| Multi-schémas | `?schemas=public,storage,realtime` | `get_rls_smoke_status_multi(ARRAY['public','storage','realtime'])` | `ok` global + détail par schéma |

Sans param : défaut `public`. `ok` global est `false` dès qu’un schéma a `ok: false`.

---

## Déploiement

1. **Migrations** (dans l’ordre)
   - `get_rls_smoke_status()` — canari single-schema (public)
   - `get_rls_smoke_status_v2(schema text)` — canari par schéma
   - `_rls_smoke_normalize_schemas(text[])` + `get_rls_smoke_status_multi(text[])` — agrégat multi-schémas
   - `20260225000004_rls_smoke_search_path.sql` — correctif `search_path = public, pg_temp` (à appliquer si 02/03 déjà en place)

   ```bash
   supabase db push
   ```

2. **Edge Function**  
   Déployer `rls-smoke` (appelle `get_rls_smoke_status_multi`, vérifie `X-API-Key`).

   ```bash
   supabase functions deploy rls-smoke
   ```

   Définir le secret **RLS_SMOKE_API_KEY** (dashboard Supabase → Edge Functions → rls-smoke → Secrets).

3. **Test manuel**

   ```bash
   curl -i -H "X-API-Key: YOUR_SECRET" \
     "https://<project-ref>.supabase.co/functions/v1/rls-smoke?schemas=public"
   ```

   Attendu : `200` + JSON avec `ok`, `schemas`, `meta.checked`, `meta.generated_at`.

---

## Checklist post-déploiement (mode C)

À suivre après intégration des migrations et de l’Edge Function.

**1. Secrets / vars GitHub Actions**

| Où | Nom | Valeur / note |
|----|-----|----------------|
| Secrets | `RLS_SMOKE_API_KEY` | Clé forte partagée avec le secret Edge Function |
| Variables | `RLS_SMOKE_URL` | `https://<project-ref>.supabase.co/functions/v1/rls-smoke?schemas=public` (ou `?schemas=public,realtime,storage`) |
| Variables (optionnel) | `RLS_SMOKE_TIMEOUT` | `12000` (recommandé après déploiement) |
| Variables (optionnel) | `RLS_SMOKE_RETRIES` | `5` |

**2. Déploiement**

- `supabase db push` (inclut `20260225000003_rls_smoke_status_multi.sql`)
- `supabase functions deploy rls-smoke`
- Définir le secret **RLS_SMOKE_API_KEY** côté Supabase (Edge Functions → rls-smoke → Secrets)

**3. Test manuel**

```bash
curl -H "X-API-Key: $RLS_SMOKE_API_KEY" \
  "https://<project-ref>.supabase.co/functions/v1/rls-smoke?schemas=public"
```

- **Attendu** : HTTP **200** si `ok: true` ; sinon **500** avec `schemas.<nom>.ok: false` dans le JSON.

**4. Vérification SQL (optionnel)**

Pour confirmer que les fonctions canari existent et que `search_path` est bien appliqué :

```bash
psql "$DATABASE_URL" -f docs/RLS_SMOKE_CANARY_CHECK.sql
```

Voir **`docs/RLS_SMOKE_CANARY_CHECK.sql`** : liste des 3 fonctions (v2, multi, _normalize) et leur `proconfig` (v2 et multi doivent avoir `search_path = public, pg_temp`).

**5. Validation rapide (prod)**

Après `supabase functions deploy rls-smoke` et `supabase db push` (incl. migration corrective `20260225000004_rls_smoke_search_path.sql` si 02/03 déjà appliquées) :

| Test | Commande | Attendu |
|------|----------|---------|
| 401 | `curl -i -H "X-API-Key: wrong" "https://<project-ref>.supabase.co/functions/v1/rls-smoke?schemas=public"` | 401, `code=invalid_api_key`, `request_id` dans le JSON |
| 400 invalid_input | `curl -i -H "X-API-Key: $RLS_SMOKE_API_KEY" "https://<project-ref>.supabase.co/functions/v1/rls-smoke?schemas="` | 400, `code=invalid_input` |
| 400 too_many_schemas | Idem avec une liste > 20 schémas | 400, `code=too_many_schemas` |
| 200 / 500 RLS | `curl -i -H "X-API-Key: $RLS_SMOKE_API_KEY" "https://<project-ref>.supabase.co/functions/v1/rls-smoke?schemas=public"` | 200 si `ok: true`, sinon 500 avec `code=schemas_failed` |
| Corrélation | Logs Edge (Supabase Dashboard) | Entrée avec `request_id`, `schemas`, `ok`, `duration_ms`, `checked_count`, `tables_scanned` ; header réponse **X-Canary: rls-smoke** |

**Checklist post-déploiement (à copier-coller)**

| Étape | Action | Points d’observation |
|-------|--------|----------------------|
| **Déployer** | `supabase functions deploy rls-smoke` | — |
| **Smoke test 401** | Clé invalide | Attendu : `status=401`, `code=invalid_api_key`, `request_id` dans le body ; **pas** de `meta.duration_ms` (pas d’appel RPC). |
| **Smoke test 200/500** | Clé valide, `?schemas=public` (ou liste cible) | **Logs Edge** : `request_id`, `schemas`, `ok`, `duration_ms`, `checked_count`, `tables_scanned`. **Body** : `meta.duration_ms`, `meta.checked_count`, `meta.tables_scanned`. |
| **URL longue** (facultatif) | URL > 2048 caractères | Attendu : `414`, `code=url_too_long`, `detail.max=2048`, `detail.received=n`. |
| **SQL** (optionnel) | `psql … -f docs/RLS_SMOKE_CANARY_CHECK.sql` | `get_rls_smoke_status_v2(text)` : `prosecdef = true`, `proconfig` inclut `search_path=public, pg_temp`. Idem pour `get_rls_smoke_status_multi(text[])`. `_rls_smoke_normalize_schemas` présent ; REVOKE appliqués si documentés. |
| **CI** | Vars + Secret + run canari | **Vars** : `RLS_SMOKE_URL`, `RLS_SMOKE_TIMEOUT=12000`, `RLS_SMOKE_RETRIES=5`, `RLS_SMOKE_MAX_DURATION_MS` (optionnel, ex. 3000). **Secret** : `RLS_SMOKE_API_KEY`. **Durcissement** : si 200, échec si `duration_ms` > max (si var définie) ou si `checked_count` ≠ longueur de `meta.checked`. **GITHUB_STEP_SUMMARY** : request_id, métriques ; en échec : code/error + détail seuils. **Backoff** : 1/2/4/8/16 s (max 30 s). |

**Récap à renvoyer après les checks**  
Statut par schéma (OK/NOK), `request_id`(s) pour corrélation, métriques (`duration_ms`, `checked_count`, `tables_scanned`), confirmation CI (summary OK). Suite possible : interprétation des métriques (ex. `duration_ms` vs `checked_count` / `tables_scanned`), optimisations ciblées (index Postgres si besoin), seuils d’alerte CI (ex. alerte si `duration_ms` p95 > X ms ou si `checked_count` ≠ nombre de schémas demandés).

**6. Observation**

- Filtrer les logs Edge avec le header **X-Canary: rls-smoke**.
- En cas d’erreur RPC, vérifier les logs Postgres (appels à `get_rls_smoke_status_multi` / `get_rls_smoke_status_v2`).

**7. Sécurité**

- Ne pas exposer l’URL du canari publiquement.
- Conserver une API key dédiée au canari. **Rotation de `RLS_SMOKE_API_KEY`** : générer une nouvelle clé, la définir dans Supabase (Edge Function rls-smoke → Secrets) et dans le secret GitHub `RLS_SMOKE_API_KEY`, puis redéployer l’Edge si besoin ; invalider l’ancienne clé après bascule.

---

## Auth canari (X-API-Key)

- La function exige le header **X-API-Key** égal au secret **RLS_SMOKE_API_KEY** (env Supabase). Sinon → **401**.
- En CI : mettre la même valeur dans un **Secret** GitHub (ex. `RLS_SMOKE_API_KEY`) et l’envoyer dans chaque requête.
- Ne pas exposer l’URL publiquement ; optionnel : allowlist IP (proxy/CDN) en plus de la clé.

---

## Où insérer le step Canari (CI)

Ordre recommandé dans un job de déploiement :

```
1. Checkout
2. Supabase DB push / migrations
3. Supabase functions deploy rls-smoke
4. RLS Smoke Canary   ← step qui ping l’URL avec X-API-Key
5. Deploy frontend / backend (dépend des policies correctes)
```

Si le canari échoue (HTTP ≠ 200), le job doit échouer et ne pas déployer la suite.

---

## Intégration CI (workflow dédié ou step à coller)

**Variables / secrets à définir côté repo :**

| Nom | Type | Exemple / note |
|-----|------|----------------|
| `RLS_SMOKE_URL` | Variable (ou Secret) | `https://<project-ref>.supabase.co/functions/v1/rls-smoke?schemas=public,storage` |
| `RLS_SMOKE_API_KEY` | Secret | Clé partagée avec le secret Edge Function `RLS_SMOKE_API_KEY` |
| `RLS_SMOKE_TIMEOUT` | Variable (optionnel) | `12000` (ms) — cold start / propagation secrets |
| `RLS_SMOKE_RETRIES` | Variable (optionnel) | `5` |
| `RLS_SMOKE_MAX_DURATION_MS` | Variable (optionnel) | Seuil en ms : échec CI si `duration_ms` > cette valeur (ex. `3000`). Non défini = pas de contrôle. |

Un workflow prêt à l’emploi est dans **`.github/workflows/rls-smoke-canary.yml`** : il lance le canari (avec retries, timeout, header X-API-Key). Déclenchement : `workflow_dispatch` ou push sur `main` touchant `supabase/migrations/**` ou `supabase/functions/rls-smoke/**`.

Pour intégrer le step dans un **job existant** (ex. après deploy des functions), copier le bloc `RLS Smoke Canary` de ce workflow (env + run avec curl, jq optionnel pour les schémas en échec).

---

## Step Canari générique (pour deploy.yml)

À insérer **après** `supabase db push` et `supabase functions deploy rls-smoke`, **avant** le déploiement frontend/backend. Même logique que `rls-smoke-canary.yml` (guards, retries, timeout).

```yaml
# --- RLS Smoke Canary (placer après deploy functions, avant deploy app) ---
- name: RLS Smoke Canary
  env:
    RLS_SMOKE_URL: ${{ vars.RLS_SMOKE_URL }}
    RLS_SMOKE_API_KEY: ${{ secrets.RLS_SMOKE_API_KEY }}
    RLS_SMOKE_TIMEOUT: ${{ vars.RLS_SMOKE_TIMEOUT || '12000' }}
    RLS_SMOKE_RETRIES: ${{ vars.RLS_SMOKE_RETRIES || '5' }}
  run: |
    set -euo pipefail
    URL="${RLS_SMOKE_URL:?RLS_SMOKE_URL not set}"
    API_KEY="${RLS_SMOKE_API_KEY:?RLS_SMOKE_API_KEY not set}"
    TIMEOUT_MS="${RLS_SMOKE_TIMEOUT:-12000}"
    RETRIES="${RLS_SMOKE_RETRIES:-5}"
    attempt=0
    while (( attempt < RETRIES )); do
      attempt=$((attempt+1))
      echo "RLS Smoke attempt $attempt/$RETRIES → $URL"
      HTTP_CODE=$(curl -sS -o /tmp/rls_smoke_body.json -w "%{http_code}" \
        --max-time $(( (TIMEOUT_MS+999)/1000 )) \
        -H "X-Canary: rls-smoke" -H "X-API-Key: ${API_KEY}" "$URL")
      echo "HTTP $HTTP_CODE"
      cat /tmp/rls_smoke_body.json || true
      if command -v jq >/dev/null 2>&1; then
        jq -r '"request_id=\(.request_id? // "n/a")"' /tmp/rls_smoke_body.json >> "$GITHUB_STEP_SUMMARY" 2>/dev/null || true
        DUR_MS=$(jq -r '.meta.duration_ms? // empty' /tmp/rls_smoke_body.json 2>/dev/null)
        if [[ -n "$DUR_MS" ]]; then echo "duration_ms: $DUR_MS"; echo "duration_ms: $DUR_MS" >> "$GITHUB_STEP_SUMMARY" 2>/dev/null || true; fi
        CHECKED=$(jq -r '.meta.checked_count? // empty' /tmp/rls_smoke_body.json 2>/dev/null)
        TABLES=$(jq -r '.meta.tables_scanned? // empty' /tmp/rls_smoke_body.json 2>/dev/null)
        if [[ -n "$CHECKED" ]]; then echo "checked_count: $CHECKED"; echo "checked_count: $CHECKED" >> "$GITHUB_STEP_SUMMARY" 2>/dev/null || true; fi
        if [[ -n "$TABLES" ]]; then echo "tables_scanned: $TABLES"; echo "tables_scanned: $TABLES" >> "$GITHUB_STEP_SUMMARY" 2>/dev/null || true; fi
      fi
      if [[ "$HTTP_CODE" == "200" ]]; then
        echo "RLS Smoke OK"
        if command -v jq >/dev/null 2>&1; then
          echo "## RLS Smoke Canary" >> "$GITHUB_STEP_SUMMARY" 2>/dev/null || true
          jq -r '.schemas | to_entries[] | " - \(.key): \(if .value.ok then "OK" else "NOK" end)"' /tmp/rls_smoke_body.json >> "$GITHUB_STEP_SUMMARY" 2>/dev/null || true
        fi
        exit 0
      fi
      if command -v jq >/dev/null 2>&1; then
        echo "Schemas NOK:" && jq -r '.schemas | to_entries[]? | select(.value.ok==false) | " - \(.key): NOK"' /tmp/rls_smoke_body.json 2>/dev/null || true
        jq -r '"code=\(.code // "n/a") error=\(.error // .detail // "")"' /tmp/rls_smoke_body.json >> "$GITHUB_STEP_SUMMARY" 2>/dev/null || true
        jq -r '"code=\(.code // "n/a") error=\(.error // .detail // "")"' /tmp/rls_smoke_body.json || true
      else
        echo "Schemas NOK (fallback sans jq):" && grep -B 1 '"ok"[[:space:]]*:[[:space:]]*false' /tmp/rls_smoke_body.json 2>/dev/null | grep -o '"schema"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/"schema"[[:space:]]*:[[:space:]]*"\([^"]*\)"/ - \1: NOK/' || true
      fi
      if (( attempt < RETRIES )); then
        BACKOFF=$(( 2 ** attempt )); [[ "$BACKOFF" -gt 30 ]] && BACKOFF=30
        echo "Retrying in ${BACKOFF}s (exponential backoff)..."; sleep "$BACKOFF"
      fi
    done
    echo "::error title=RLS Smoke::Canary failed after $RETRIES attempts"
    exit 1
```

**Variante log lisible (schema=… ok=…)** : après un curl réussi, pour afficher une ligne par schéma dans les logs :

```bash
jq -r '.schemas | to_entries[] | "schema=\(.key) ok=\(.value.ok)"' /tmp/rls_smoke_body.json
```

---

## Sécurité (recommandations)

- **Edge Function** : exiger X-API-Key ; n’utiliser le service_role que pour cette lecture métier (pas d’écriture). Ne pas exposer l’URL en public.
- **Postgres** : `REVOKE EXECUTE` sur les fonctions canari pour `public`, `anon`, `authenticated` ; `GRANT EXECUTE` uniquement à `service_role`. Vérifier aussi les helpers (ex. `_rls_smoke_normalize_schemas`) : REVOKE pour PUBLIC/anon/authenticated, pas de GRANT explicite (appelées en SECURITY DEFINER par le propriétaire). Les fonctions `get_rls_smoke_status_v2` et `get_rls_smoke_status_multi` sont **SECURITY DEFINER** avec `SET search_path = public, pg_temp` (migration corrective `20260225000004_rls_smoke_search_path.sql` si 02/03 déjà appliquées) ; idéalement le owner est un rôle non-connectable (ex. `supabase_admin`). Indexer les colonnes utilisées dans les policies si besoin.
- **Réseau** : optionnel — restreindre l’accès via proxy avec allowlist IP (egress CI fixe). Si vous utilisez une allowlist IP (CDN/proxy), documentez le header **Via** / **X-Forwarded-For** pour diagnostiquer les faux positifs (origine réelle de la requête).
- **Observabilité** : logs Edge (header **X-Canary: rls-smoke** dans les réponses ; envoyer aussi **X-Canary: rls-smoke** en requête pour corrélation bidirectionnelle). Champs **request_id**, **schemas**, **ok** en `console.info` côté Edge.

---

## Observation

- **Logs Edge** : Supabase Dashboard → Edge Functions → rls-smoke → Logs. Filtrer par `X-Canary: rls-smoke`. Utiliser le **request_id** de la réponse pour retrouver l’entrée correspondante (`console.info` avec `request_id`, `schemas`, `ok`, `duration_ms`).
- **Logs Postgres** : vérifier les appels à `get_rls_smoke_status_multi` / `get_rls_smoke_status_v2` si besoin ; corréler avec **request_id** côté Edge.

---

## Troubleshooting

| Cause typique | Réponse / champ | Action |
|---------------|-----------------|--------|
| Clé API manquante ou incorrecte | 401, `invalid_api_key` | Vérifier header `X-API-Key` et secret `RLS_SMOKE_API_KEY` (Edge + CI). |
| Grant anon/PUBLIC sur une table | 500, `schemas.<schema>.anon_has_grant` > 0 | Lister les tables : **`docs/RLS_SMOKE_GRANTS_DIAGNOSTIC.sql`**. Puis appliquer la migration **`20260225000006_rls_revoke_anon_authenticated_public.sql`** (révoque anon, authenticated, public sur toutes les tables public) ou un script ciblé type RLS_GRANTS_FIX. |
| Grant authenticated sur une table | 500, `schemas.<schema>.authenticated_has_grant` > 0 | Passer en 100 % RLS : révoquer GRANT directs. |
| Beaucoup de tables sans policy | `tables_without_policy` élevé | Souvent normal (tables techniques) ; adapter la liste de schémas si besoin. |
| RPC / env manquant | 500, `rpc_error` | Vérifier migrations appliquées et env SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. |
| Liste de schémas vide | 400, `invalid_input` | Passer au moins un schéma (`?schema=public` ou `?schemas=public,...`). |
| Trop de schémas | 400, `too_many_schemas` | Maximum 20 schémas par requête. |
| URL trop longue | 414, `url_too_long` | Réduire la requête (ex. liste de schémas) ; max 2048 caractères. |

**Codes d’erreur stables (champ `code`)** : `invalid_api_key` (401), `rpc_error` (500), `schemas_failed` (500), `invalid_input` (400), `too_many_schemas` (400), `method_not_allowed` (405), `url_too_long` (414). **Champs JSON (par schéma)** : `total_tables_tested`, `tables_without_policy`, `anon_has_grant`, `authenticated_has_grant`, `schema`. **Global** : `ok`, `request_id`, `schemas`, `meta.checked`, `meta.generated_at`, `meta.duration_ms` (temps RPC en ms), `meta.checked_count` (nombre de schémas testés), `meta.tables_scanned` (somme des tables évaluées — suivi dans le temps).

---

## Validations rapides & conseils optionnels

**Validations à confirmer en prod**

| Zone | À vérifier |
|------|-------------|
| **RPC** | `get_rls_smoke_status_v2(text)` et `get_rls_smoke_status_multi(text[])` : SECURITY DEFINER, `SET search_path = public, pg_temp` (migration 20260225000004). REVOKE EXECUTE sur PUBLIC/anon/authenticated pour v2, multi et helpers ; GRANT EXECUTE uniquement à service_role (appel via Edge). |
| **Edge** | Auth canari via X-API-Key uniquement ; aucune trace du header brut dans les logs. Limite URL 2048 → 414 `url_too_long`. Métadonnées : `meta.duration_ms`, `meta.checked_count`, `meta.tables_scanned` renvoyées et loggées. En erreur RPC : `code=rpc_error`, `meta.duration_ms` présent (temps jusqu’à l’erreur). |
| **CI** | Retry + backoff exponentiel (≤ 30 s). Extraction jq : `request_id`, `duration_ms`, `checked_count`, `tables_scanned`. Summary : idem + `code`/`error` en échec. |

**Conseils perfs / observabilité (optionnels)**

- **Index** : si les requêtes canari s’appuient sur pg_catalog / information_schema filtrés par schéma, surveiller `meta.tables_scanned` vs `duration_ms` ; index ciblés ou vues matérialisées si dérive.
- **Budget et alertes** : variable **`RLS_SMOKE_MAX_DURATION_MS`** (ex. 3000) — le job échoue si la réponse est 200 mais `duration_ms` dépasse le seuil. Vérification **`checked_count`** = longueur de `meta.checked` (incohérence → échec explicite + résumé enrichi dans le Summary).
- **Préchauffage** : HEAD preflight avant la première mesure si la métrique est sensible au cold start.
- **Rate limit** : option header `X-Canary-Window` et 429 si appels trop serrés.

**Sécurité avancée (optionnel)**

- **Ownership** : owner des fonctions SECURITY DEFINER idéalement non-connectable (ex. `supabase_admin`).
- **Réseau** : allowlist IP (proxy/CDN) si egress CI connu ; conserver Via / X-Forwarded-For en logs pour diagnostic.

**Snippets SQL** : voir **`docs/RLS_SMOKE_CANARY_CHECK.sql`** (prosecdef + proconfig, puis `information_schema.routine_privileges` pour les exécutions autorisées).

Une fois la checklist exécutée, envoyer : **statut par schéma (OK/NOK)**, **request_id(s)**, **métriques (duration_ms, checked_count, tables_scanned)**, **résumé CI**. Suite : interprétation des métriques, optimisations ciblées (index si besoin), seuils d’alerte.

---

## Réutilisation / fork

Adapter le project-ref dans l’URL, la liste des schémas (`?schemas=`) et les secrets. Les migrations v1/v2/multi sont indépendantes : on peut ne déployer que v1 (single public) ou tout le stack multi-schémas + auth.
