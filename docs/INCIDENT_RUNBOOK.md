# ARCHÉ — Runbook incident (1 page)

Où regarder, invalidation cache, rollback migrations. À garder à jour à chaque changement de pipeline ou de mécanismes de cache.

---

## Où regarder

| Cible | Où | Quoi vérifier |
|-------|-----|----------------|
| **CI** | GitHub Actions → workflow « RLS Smoke Canary » → job → onglet **Summary** | request_id, duration_ms, checked_count, tables_scanned ; en échec : code, error, schémas NOK. |
| **Canari** | URL : `https://<project-ref>.supabase.co/functions/v1/rls-smoke?schemas=public` (avec header `X-API-Key`) | 200 + `ok: true` ; sinon 500 + détail `schemas.<nom>` (anon_has_grant, authenticated_has_grant). |
| **Logs Edge** | Supabase Dashboard → Edge Functions → sélectionner la function → **Logs** | Filtrer par `X-Canary: rls-smoke` ou par **request_id** (copier depuis la réponse canari ou le Summary CI). |
| **Logs front** | Sentry (ou outil équivalent) si configuré | Erreurs utilisateur, stack traces ; tag release/commit si en place. |

---

## Invalidation cache

- **Cache applicatif (Trésor, méridiens, etc.)** : à documenter selon les mécanismes en place (ex. purge CDN, invalidation par clé, redéploiement front). Si aucun cache côté projet n’est encore exposé, noter ici dès qu’un mécanisme est ajouté.
- **Supabase** : pas de cache applicatif géré par Supabase à invalider ; les données lues sont à jour après commit.

---

## Rollback migrations

Supabase **ne fait pas de rollback automatique** des migrations. En cas de migration en cause :

1. **Identifier** la migration (historique dans `supabase_migrations.schema_migrations` ou logs du `db push`).
2. **Corriger** : soit une **nouvelle migration** qui annule ou corrige l’effet (ex. recréer une colonne, réappliquer des grants), soit une **restauration depuis backup** (politique projet / Supabase Dashboard).
3. **Documenter** : noter la décision (roll-forward vs restore) et mettre à jour ce runbook si une procédure spécifique est adoptée.

Référence : [Supabase — Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations) (modèles et bonnes pratiques).
