# RLS Smoke Canary — récapitulatif de ce qui a été fait

Document de synthèse de tout le travail réalisé autour du canari RLS (Supabase) : migrations, Edge Function, CI, documentation, durcissement et corrections.

---

## 1. Migrations SQL (Postgres)

| Fichier | Rôle |
|---------|------|
| `20260225000001_rls_smoke_status_rpc.sql` | Fonction `get_rls_smoke_status()` — canari single-schema (public). |
| `20260225000002_rls_smoke_status_v2.sql` | `get_rls_smoke_status_v2(p_schema_name text)` — canari par schéma. SECURITY DEFINER, `SET search_path = public, pg_temp`. REVOKE public/anon/authenticated ; GRANT EXECUTE à service_role. |
| `20260225000003_rls_smoke_status_multi.sql` | `_rls_smoke_normalize_schemas(text[])` + `get_rls_smoke_status_multi(text[])` — agrégat multi-schémas, appelle v2 par schéma. Même modèle REVOKE/GRANT. |
| `20260225000004_rls_smoke_search_path.sql` | Correctif : `ALTER FUNCTION ... SET search_path = public, pg_temp` pour v2 et multi (si 02/03 déjà appliquées). |
| `20260225000005_audit_rls_grants_align.sql` | REVOKE ciblés anon (tables owner) et anon+authenticated (tables service-managed) sur une liste fixe de tables. |
| `20260225000006_rls_revoke_anon_authenticated_public.sql` | REVOKE ALL FROM anon, authenticated, public sur **toutes** les tables du schéma `public` — alignement 100 % RLS. (Variable de boucle : `r record`.) |

---

## 2. Edge Function `rls-smoke`

- **Fichier** : `supabase/functions/rls-smoke/index.ts`
- **Auth** : header **X-API-Key** (secret `RLS_SMOKE_API_KEY`). Aucune trace du header brut dans les logs.
- **Méthode** : GET uniquement ; 405 + `code: method_not_allowed` pour toute autre méthode.
- **Paramètres** : `?schemas=public,storage` ou `?schema=public`. Liste vide → 400 `invalid_input`. > 20 schémas → 400 `too_many_schemas`. URL > 2048 caractères → 414 `url_too_long`.
- **Réponses** : 401 (invalid_api_key), 400 (invalid_input, too_many_schemas), 414 (url_too_long), 500 (rpc_error ou schemas_failed), 200 (ok: true).
- **Codes JSON stables** : `invalid_api_key`, `rpc_error`, `schemas_failed`, `invalid_input`, `too_many_schemas`, `method_not_allowed`, `url_too_long`.
- **Métadonnées** : chaque réponse inclut `request_id` (UUID v4). En 200/500 (succès RPC) : `meta.duration_ms`, `meta.checked_count`, `meta.tables_scanned`. En erreur RPC : `meta.duration_ms` présent.
- **Logs** : `console.info({ request_id, schemas, ok, duration_ms, checked_count, tables_scanned })`. Header de réponse **X-Canary: rls-smoke**.
- **Client** : Supabase avec `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` ; appel RPC `get_rls_smoke_status_multi`.

---

## 3. CI (GitHub Actions)

- **Workflow** : `.github/workflows/rls-smoke-canary.yml`
- **Déclenchement** : `workflow_dispatch` ou push sur `main` touchant `supabase/migrations/**` ou `supabase/functions/rls-smoke/**`.
- **Variables** : `RLS_SMOKE_URL`, `RLS_SMOKE_TIMEOUT` (défaut 12000), `RLS_SMOKE_RETRIES` (défaut 5), `RLS_SMOKE_MAX_DURATION_MS` (optionnel).
- **Secret** : `RLS_SMOKE_API_KEY`.
- **Comportement** : guards URL/API_KEY ; curl avec header **X-Canary: rls-smoke** et X-API-Key ; retries avec backoff exponentiel (1/2/4/8/16 s, max 30 s) ; extraction jq de request_id, duration_ms, checked_count, tables_scanned ; fallback sans jq (grep/sed) pour afficher les schémas NOK.
- **GITHUB_STEP_SUMMARY** : request_id, duration_ms, checked_count, tables_scanned ; en 200 : titre « RLS Smoke Canary » + liste des schémas OK/NOK ; en échec HTTP : code et error.
- **Durcissement (si HTTP 200)** : échec du job si `RLS_SMOKE_MAX_DURATION_MS` est défini et `meta.duration_ms` > seuil ; échec si `meta.checked_count` ≠ longueur de `meta.checked`. Messages explicites et lignes dans le Summary.

---

## 4. Documentation

| Fichier | Contenu |
|---------|---------|
| `docs/RLS_SMOKE_CANARY_README.md` | Doc principale : contexte, modes simple/multi, déploiement, checklist post-déploiement, auth, où insérer le step, variables/secrets, **step Canari générique** (bloc prêt à coller pour deploy.yml), sécurité, observation, troubleshooting, validations rapides, conseils perfs/observabilité, réutilisation. |
| `docs/RLS_SMOKE_CANARY_CHECK.sql` | Vérification SQL : liste des 3 fonctions canari, proconfig (search_path), variante compacte prosecdef/proconfig, exécutions autorisées via `information_schema.routine_privileges`. |
| `docs/RLS_SMOKE_GRANTS_DIAGNOSTIC.sql` | Diagnostic : liste des tables `public` ayant encore des grants anon/authenticated/public avec privilèges données (même logique que le canari). |
| `docs/RLS_GRANTS_FIX.sql` | Script ciblé REVOKE (liste fixe de tables owner + service-managed) — variante « safe » idempotente. |

---

## 5. Validations et corrections effectuées

- **Permissions SQL** : REVOKE sur public/anon/authenticated et GRANT EXECUTE à service_role pour v2 et multi ; helpers sans GRANT explicite (appelés en SECURITY DEFINER).
- **Edge** : 405 strict, validation des paramètres (vide, > 20 schémas, longueur URL), codes stables, request_id et meta dans toutes les réponses pertinentes.
- **CI** : header X-Canary: rls-smoke, défauts 12000/5 pour timeout/retries, fallback sans jq, request_id + métriques dans le Summary, durcissement duration_ms et checked_count.
- **Migration 000006** : correction `r rec` → `r record` pour compatibilité PostgreSQL.
- **Canari vert en prod** : après application des migrations (y compris 000006), test 401 OK, test avec clé valide → 200, `ok: true`, `anon_has_grant: 0`, `authenticated_has_grant: 0` sur le schéma `public`.

---

## 6. État final

- **Endpoint canari** : opérationnel (ex. `https://<project-ref>.supabase.co/functions/v1/rls-smoke?schemas=public`).
- **Auth** : X-API-Key validée (401 + code invalid_api_key sur clé invalide).
- **Run valide** : 200 avec `ok: true`, grants anon/authenticated à 0 sur public.
- **CI** : workflow prêt ; durcissement optionnel via `RLS_SMOKE_MAX_DURATION_MS` et contrôle checked_count.
- **Doc** : README complet, checklist copier-coller, diagnostic et vérification SQL, troubleshooting à jour.

Rien d’obligatoire à ajouter pour considérer le processus canari RLS + Supabase comme finalisé. Options possibles plus tard : seuil duration en variable de repo, preflight HEAD, autres schémas (storage, realtime), rotation de la clé API.
