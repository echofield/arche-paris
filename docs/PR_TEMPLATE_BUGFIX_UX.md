# PR: Bugs & UX fixes (plan arche-paris)

---

## Version senior reviewer (copier-coller dans la PR)

**Fix: Auth pairing race, ChampScreen crash, Journal error handling, Méridien stability**

### Summary

* Fix **ChampScreen TDZ crash**
* Fix **auth pairing race / double-submit** (auth lock now guarded by `try/finally`)
* Properly distinguish **server errors (5xx)** from offline failures (journal retry-safe)
* Stabilize Méridien heading (shortest-angle smoothing, no 359°→0° jump)

### How to test

* Login: double-click, slow network, 409 pairing flow
* Journal: simulate 500 → queued + server banner; offline unchanged
* Méridien: rotate across north → needle follows shortest path
* ChampScreen: open trace flows → no crash

### Risk / Rollback

No schema or API breaking changes.
Rollback = revert PR.

### Observability

Monitor ChampScreen errors (24h) + Edge logs `/journal/note`.

---

## Version GitHub checklist (merge guidé)

```md
### How to test
- [ ] Login double-submit prevented
- [ ] 409 pairing flow completes correctly
- [ ] Slow network does not lock auth
- [ ] Journal 500 shows server banner + queues note
- [ ] Offline mode unchanged
- [ ] Méridien needle stable across north (359°→0°)
- [ ] ChampScreen trace flow no longer crashes
```

---

## Référence détaillée (template complet)

## Summary

Fixes connexion 409/double-submit, ChampScreen TDZ crash, MARKER_MAX_ACCURACY_M, journal 500 vs offline messaging, méridien compass needle + smoothing, Lecture du lieu polish + hysteresis. Aligné avec le plan « bugs et évolutions ARCHÉ ».

---

## How to test

### Auth (critique)
- [ ] **Double-submit** : entrer mot de passe → cliquer 2 fois rapidement → un seul flux, pas de “deuxième fois ne rentre pas”.
- [ ] **Réseau lent** : throttle “Slow 3G” → saisir mot de passe → voir “Transfert de la carte…” → attendre fin (succès ou erreur claire).
- [ ] **Retour arrière** pendant “Transfert de la carte…” : pas de blocage ; retour à l’écran carte/connexion.
- [ ] **409 déjà appairé** : avec mot de passe → force-unpair + pair → arrivée sur l’app sans redemander le mot de passe.

### Journal / Carnet
- [ ] **Simuler 500** : faire échouer `POST /journal/note` (ex. couper l’Edge ou mock 500) → sauvegarder une note → bandeau “Problème temporaire côté serveur…” (pas “La ville est silencieuse”) + note en file.
- [ ] **Offline** : couper le réseau → sauvegarder → message offline poétique + file.

### Méridien
- [ ] **Tourner sur place** : aiguille suit le cap (0° = nord) ; pas de saut bizarre au wrap 359°→0°.
- [ ] **Marcher** : état (ÉGARÉ / PROCHE / …) évolue ; aiguille reste lisible (smoothing).

### ChampScreen
- [ ] Ouvrir Le Champ (avec carte) → pas de crash “Cannot access 'ne' before initialization”.
- [ ] Ouvrir fiche axe → Activer / Laisser une trace → comportement inchangé.

### Lecture du lieu
- [ ] Lire le lieu → phrase + identité spatiale (typo ~10 % plus grande) ; si alignement > 0.55, “Le lieu répond à ta position.” apparaît ; en dessous de 0.45, disparaît (pas de flicker).

---

## Observability (post-merge)

- **Sentry** : surveiller erreurs ChampScreen (référence TDZ) pendant 24h.
- **Edge logs** : filtrer `[card-gate] POST /journal/note` en échec (message, code, details, hint).
- **Auth** : suivre retries / pairing errors (409, force-unpair, rate limit).

---

## Screenshots / enregistrements (optionnel)

- Avant/après : Méridien (aiguille + passage au nord sans saut), bandeau journal 500 vs offline, écran “Transfert de la carte…”.

---

## Risk & rollback

- **Risque** : aucun changement de contrat API ou de schéma DB. Comportement ajouté (bandeaux, aiguille, hystérésis) peut être désactivé ou ajusté par feature flag si besoin.
- **Rollback** : revert du commit ; pas de migration à annuler.

---

## Files changed (ordre review suggéré)

1. **Crash / correctness** : `src/components/ChampScreen.tsx`
2. **Auth** : `src/utils/card-service.ts` → `src/App.tsx` → `src/components/CardGate.tsx` → `src/components/CardLogin.tsx`
3. **Backend + erreurs** : `supabase/functions/card-gate/index.tsx` → `src/utils/card-gate-client.ts` → `src/components/CarnetParisien.tsx`
4. **Instrument** : `src/components/MeridiensLive.tsx` → `src/components/MeridiensInterface.tsx`
5. **Constantes** : `src/constants/geo.ts` + `PersonalMemoryMap.tsx` + `AuraPage.tsx`
6. **PlaceScan** : `src/components/instruments/PlaceScanSurface.tsx` + `src/locales/fr/home.json` + `src/locales/en/home.json`

---

## Checklist diff-by-diff

Voir la checklist détaillée (red flags, points par fichier) dans le thread de review ou le plan associé.
