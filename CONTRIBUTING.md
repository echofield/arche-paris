# Contribuer à ARCHÉ

## PR i18n — checklist entrée/sortie

Pour toute PR qui touche aux traductions (nouveaux libellés, écrans migrés vers i18n, second lot, etc.) :

### Avant (entrée)

- [ ] Lancer `npm run lint:i18n` (ou `npm run lint:i18n:ci`) : **aucune clé manquante** entre `src/locales/fr` et `src/locales/en` pour les fichiers concernés.
- [ ] Réutiliser les namespaces existants **async.*** et **back.*** pour les libellés génériques (Chargement…, Réessayer, Retour, etc.) et limiter les nouvelles clés métier au strict nécessaire.
- [ ] Vérifier la structure : clés dans `src/locales/fr/*.json` et `src/locales/en/*.json` (mêmes clés dans les deux langues).

### Après (sortie)

- [ ] Relancer `npm run lint:i18n` : toujours **aucune clé manquante**.
- [ ] En CI : `npm run lint:i18n:ci` doit passer (exit 0).
- [ ] Si un fallback a été ajouté dans `t()` pour la transition, prévoir sa suppression après migration complète (fenêtre courte).
- [ ] **Si la PR touche à des DDL/migrations RLS :** vérifier que la CI exécute `docs/RLS_CI_CHECK.sql` (ex. `psql -v ON_ERROR_STOP=1 -f docs/RLS_CI_CHECK.sql` ou `supabase db execute -f docs/RLS_CI_CHECK.sql`) pour couvrir le périmètre sécurité.

### Commandes utiles

| Commande | Rôle |
|----------|------|
| `npm run lint:i18n` | Clés manquantes FR/EN |
| `npm run lint:i18n:orphans` | + clés orphelines (whitelist pour usage dynamique) |
| `npm run lint:i18n:ci` | Pour CI : échoue si clés manquantes |

Voir aussi `docs/I18N_FIRST_LOT_KEYS.md` et `docs/I18N_SECOND_LOT_SCOPE.md`.

---

## Release Gate — Checklist Prod (Enterprise-ready)

Avant de considérer une release « bon pour prod », vérifier :

- [ ] **RLS/GRANTS** : canari `rls-smoke` vert sur `public` (+ autres schémas critiques si utilisés) ; CI bloque toute régression.
- [ ] **Service role** : jamais côté client ; uniquement Edge/serveur ; secrets stockés en env + rotation planifiée.
- [ ] **Search_path** : toutes les fonctions SECURITY DEFINER ont `SET search_path = public, pg_temp` (ou équivalent minimal) + REVOKE EXECUTE hors `service_role`.
- [ ] **Tables critiques couvertes** : owner tables + service-managed tables listées et vérifiées (canari/CI/diagnostic).
- [ ] **Idempotence** : actions « écrites » (zone_entered, ritual_runs, unlock, etc.) ont une clé d’idempotence ou une contrainte anti-duplicate (unique index / upsert).
- [ ] **Rate limiting** : limites côté serveur (Edge/DB) pour endpoints sensibles ; erreurs stables et explicites.
- [ ] **Observabilité** : capture erreurs front (Sentry ou équivalent) + logs Edge avec `request_id` + tag release/commit.
- [ ] **Feature flags** : debug (ex. `VITE_DEBUG_TERRITORY`) strictement dev ; prod n’expose pas coords brutes ni surfaces sensibles.
- [ ] **Contracts** : réponses API/Edge validées (runtime guards / zod) + fallback UX (AsyncState) sur écrans critiques.
- [ ] **Runbook** : doc incident 1 page à jour — où regarder (CI, canari, logs), invalidation cache, rollback migrations. Voir [docs/INCIDENT_RUNBOOK.md](docs/INCIDENT_RUNBOOK.md).
