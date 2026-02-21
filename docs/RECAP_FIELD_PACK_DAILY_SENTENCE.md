# Récap vérifié (branch `field-pack-daily-sentence`) — prêt à partager

## Poussé

1. **Data**
   - `world.field` (FieldPack PAR-13) dans `/world/snapshot` (guardrail 140 chars).
   - Sélecteur déterministe `dailySentence` (jour Paris + FNV-1a), **uniquement si `dailySentence` absent**.
   - Types frontend : `world.field`, `dailySentence`, `dailySentenceMeta`.

2. **Doc**
   - HANDOFF : checklist déploiement + contrat déterminisme daily sentence.

3. **Surface existante**
   - AuraPage : affiche `me.aura.dailySentence` dans la zone « Aujourd’hui » (une ligne). Ne rend jamais `world.field`.

4. **Stabilisation**
   - Imports manquants : TerritoryResolverProvider, SnapshotDebugProvider, TerritoryDebugStrip.
   - TerritoryDebugStrip rendu conditionnel (dev / VITE_DEBUG_TERRITORY=1).
   - `setLocationTrust` défini via `useSnapshotDebug()` dans AuraPage.
   - `vercel.json` : rewrite SPA qui exclut manifest.json et assets statiques.
   - HANDOFF : note 401 (Deployment Protection Vercel).

**Note :** Ce travail dépasse « DATA ONLY » uniquement par l’affichage d’une seule ligne `dailySentence` dans Aura (pas le pack).

## Non poussé (local only)

- ESLint flat config + script `lint` + deps (package.json / eslint.config.js).
- Éventuelles dernières modifs HANDOFF.

## Progression des commits

- `fed7012` = ancien pas (« field statue / progression »)
- `8b80880` = pivot : fieldPack + dailySentence déterministe + docs
- `de8ac44` → `d0ebe50` = hardening : providers, debug strip safe, vercel rewrite, setLocationTrust

---

## Actions immédiates

### A) Déployer depuis la branche

```bash
git checkout field-pack-daily-sentence
supabase functions deploy card-gate
```

### B) Vérifier en prod (2 calls)

- `.../world/snapshot?h3_center=PAR-13` → `world.field.zoneId="PAR-13"`, `me.aura.dailySentence` non vide
- `.../world/snapshot?h3_center=PAR-14` → `world.field=null` (pas d’erreur)

### C) Nettoyer le statut local (optionnel)

- Option 1 : `git stash -u`
- Option 2 : branche séparée `lint-setup` pour ESLint

---

Si blocage : coller la sortie exacte de `supabase functions deploy card-gate` ou le JSON de `/world/snapshot?h3_center=PAR-13`.
