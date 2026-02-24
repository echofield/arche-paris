# ARCHÉ — SOP Production (procédure d’exploitation)

Procédure ultra courte pour déploiement et vérification. Détails dans les runbooks et README dédiés.

---

## Déploiement type

1. **Migrations** : `supabase db push` (ou exécution des migrations dans l’ordre).
2. **Edge Functions** : `supabase functions deploy <nom>` (ex. `rls-smoke`, `card-gate`, etc.) ; secrets définis côté Supabase (voir [docs/SECRETS_RUNBOOK.md](SECRETS_RUNBOOK.md)).
3. **Canari RLS** : le workflow CI ou un curl manuel vérifie que l’endpoint canari répond 200. URL type : `https://<project-ref>.supabase.co/functions/v1/rls-smoke?schemas=public`. Vars/secret : `RLS_SMOKE_URL`, `RLS_SMOKE_API_KEY` (voir [docs/RLS_SMOKE_CANARY_README.md](RLS_SMOKE_CANARY_README.md)).
4. **Frontend** : déploiement (ex. Vercel) après validation canari ; variables d’env de build définies.

---

## Vérification post-déploiement

- **Canari** : HTTP 200, `ok: true` ; métriques dans le Summary du job GitHub (request_id, duration_ms, checked_count, tables_scanned) ou dans la réponse curl.
- **CI** : workflow RLS Smoke Canary vert (et autres jobs configurés).
- **Logs Edge** : Supabase Dashboard → Edge Functions → Logs ; filtrer par `X-Canary: rls-smoke` ou par `request_id` pour corréler.

---

## En cas d’incident

Voir **[docs/INCIDENT_RUNBOOK.md](INCIDENT_RUNBOOK.md)** : où regarder (CI, canari, logs), invalidation cache, rollback migrations.
