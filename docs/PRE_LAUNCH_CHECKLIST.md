# ARCHÉ — Checklist pré-lancement (avant mise en public)

Document de référence pour sécuriser le lancement : sécurité, fonctionnalités, traduction, impasses et incohérences. **À parcourir avant de coder.**

---

## 1. SÉCURITÉ

### 1.1 Base de données (Supabase)

| Élément | Statut | Action |
|--------|--------|--------|
| **RLS** sur `inscriptions`, `engraved_segments`, `meridian_proofs` | Migration 007 présente | Vérifier en prod : `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('inscriptions','engraved_segments','meridian_proofs');` → toutes à `true`. |
| **Policies** service_role uniquement (pas d’anon/auth sur ces tables) | 007 crée les policies | Vérifier : `SELECT tablename, policyname, roles FROM pg_policies WHERE tablename IN (...);` → `roles` contient `service_role`. |
| **cards** : pas d’exposition de `password_hash` / `device_secret` en clair | Déjà géré dans les Edge Functions | Audit rapide : aucun SELECT public ne renvoie ces colonnes. |
| **Rate limits** (pair, force-unpair, refresh) | Configurés dans card-gate | En prod, seuils et fenêtres OK ; possibilité de débloquer manuellement si besoin (`DELETE FROM rate_limits WHERE key LIKE '...';`). |

### 1.2 Card Gate (Edge Functions)

| Élément | Statut | Action |
|--------|--------|--------|
| **CORS** | Origin explicite (pas `*`) quand `credentials: 'include'` | Vérifier que l’origine prod (et punycode si domaine IDN) est dans la liste autorisée. |
| **verify_jwt** | `false` pour card-gate (config.toml) | OK pour appels avec anon key ; ne pas exposer d’opérations sensibles sans autre contrôle. |
| **Cookie** `arche_refresh` | HttpOnly, Secure, SameSite, Path=/ | Vérifier en réponse à `/pair` et `/refresh` ; suppression correcte sur `/unpair-session`. |
| **Déploiement** | card-gate + make-server-9060b10a si utilisé | Les deux déployés ; mêmes règles CORS/origines. |

### 1.3 Frontend

| Élément | Statut | Action |
|--------|--------|--------|
| **Variables d’environnement** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_PROJECT_ID` | Définies en build (ex. Vercel) ; pas de clé secrète en clair dans le code. |
| **Credentials** | `credentials: 'include'` sur pair/refresh/unpair-session | Déjà en place ; pas d’envoi de token secret dans l’URL ou en query. |
| **CSP / eval** | Erreur "CSP blocks eval" possible (navigateur / hébergeur) | Vérifier qu’aucun `eval()` ou `new Function()` n’est utilisé ; si CSP stricte, adapter les directives (pas d’`unsafe-eval` si évitable). |

---

## 2. FONCTIONNALITÉS — COMPLÈTES VS PARTIELLES

### 2.1 Complètes (à valider en parcours réel)

- **Entrée** : activation carte (code + mot de passe), login, pair, refresh, unpair, force-unpair.
- **Homepage** : nav desktop / mobile (Explorer · Approfondir), carte Paris, CTA Ma Carte.
- **Quêtes** : liste, détail, Quest Run (étapes manuelles, preuves optionnelles), envoi segment gravé.
- **Méridiens** : vue géométrique, 3 seuils, halo de proximité, hints cliquables, preuve méridien (pending → verified), pas de “you are here” exact.
- **Trésor Caché** : énigmes, collection, boussole (distance/cap), preuve par email, echo 24–48 h.
- **Carnet** : journal par lieu/date, sync Card Gate.
- **Ma Carte** : note My Paris, inscriptions par arrondissement, segments gravés, preuves méridien, traces, runs ; whisper “verified” au passage pending→verified.
- **Études** : hub Formes (Coupole, Axe, Seuil) · Langages · Systèmes ; pages éditoriales + questions d’attention.
- **Aura** : compagnon (niveau 0–3), phrase mémoire, question réflexive.

### 2.2 Partielles ou stubs (à documenter ou traiter)

| Feature | État | Recommandation |
|---------|------|----------------|
| **Sceller (Aura)** | `sealing-stub.ts` : stockage local uniquement, pas de “kernel” | Documenter “Sceller enregistre localement pour l’instant” ou masquer le bouton jusqu’à implémentation. |
| **Codex / inscribeCodexEntry** | TODOs dans `codex-helpers.ts` | Ne pas exposer d’entrée “Codex” en public tant que non implémenté. |
| **Entitlements** | `shared/entitlements.ts` : TODO remplacer par logique réelle | Vérifier les usages ; si aucun, laisser ; sinon prévoir comportement par défaut. |
| **Export PDF** | “Map area placeholder” dans `pdf-export.ts` | OK pour v1 ; préciser “sans carte” si pertinent. |
| **Proof density (Hunter)** | “Stub until backend” | Comportement dégradé acceptable ; pas de blocage lancement. |
| **Audio (HistoireArchives)** | Fichiers audio placeholder / manquants → erreurs silencieuses | Remplacer par vrais fichiers ou désactiver lecture. |
| **Origine / Histoire** | Pas dans la nav principale ; accès par hash `#origine`, `#histoire` | Décision produit : les mettre en nav ou les garder “cachés” (deep link, Trésor Caché, etc.). |

---

## 3. TRADUCTION (i18n)

### 3.1 Couverture

- **Langues** : FR (défaut), EN.
- **Fichiers** : `home`, `history`, `origin`, `map`, `treasure`, `seuil`, `meridiens` (fr + en).
- **Pas de fichiers dédiés** : `quests`, `etudes`, `card` → clés souvent dans `home` ou composants (chaînes en dur à repérer).

### 3.2 À faire avant public

- [ ] Vérifier que toute chaîne visible utilisateur a une clé `t('...')` ou équivalent.
- [ ] Comparer FR vs EN : mêmes clés dans les deux JSON ; pas de clé manquante en EN.
- [ ] Labels Card Gate (activation, login, erreurs 409/429/401, force-unpair) en FR et EN.
- [ ] Messages d’erreur réseau / “Failed to fetch” : proposer une phrase digne (“Pas maintenant.” / “Not now.”) au lieu du technique.

---

## 4. IMPASSES ET INCOHÉRENCES

### 4.1 “Le Seuil” : deux sens différents

- **Nav principale** : “Le Seuil” → **CultureQuiz** (quiz culture parisienne, 5 niveaux, timer, score). C’est un **quiz**.
- **Études → Formes** : “Seuil” → **FormesSeuil** (contenu éditorial sur le seuil). C’est une **page de lecture**.

**Risque** : l’utilisateur s’attend à un seul “Seuil”.  
**Options** : (a) Renommer le lien nav en “Quiz” / “Le Seuil — Quiz” pour clarifier ; (b) Ou garder et documenter dans la présentation.

### 4.2 Origine et Histoire

- **Routes** : `#origine` → OrigineMap ; `#histoire` → HistoireArchives.
- **Nav** : aucun lien direct sur la homepage. Accès possible depuis Trésor Caché (focus) ou lien direct / favori.

**Cohérence** : décider si “Origine” et “Histoire” doivent apparaître (menu, footer, ou lien dans une section) ou rester en accès secondaire.

### 4.3 Hash routing

- **App** : `currentScreen` synchronisé avec `window.location.hash` (#collection, #etudes, #meridiens, #seuil, #quete/…, #quest-run/…, etc.).
- **BackButton** : pile de hash (`arche_hash_stack`) ; fallback `#etudes` ou fourni (ex. `#homepage`).
- **Risque** : ouverture directe d’un hash invalide ou inattendu → écran vide ou mauvais écran. Tester : `#`, `#inconnu`, `#quete/xxx` (id inexistant).

### 4.4 Session expirée / 401

- **Comportement** : map-state, journal, etc. renvoient 401 si cookie invalide ou non envoyé.
- **UX** : modal “Session expirée” + mot de passe pour force-unpair au Déconnecter ; pour les autres appels 401, éviter écran blanc : message discret (“Reconnectez votre carte”) + redirection vers entrée carte.

### 4.5 Autres points

- **Quest Run** : preuve optionnelle par étape ; une quête peut être “terminée” sans preuve. À assumer comme design (pas de dead end).
- **Méridiens** : “Reconnu” = actuellement sur la ligne ; “Non reconnu” = pas sur la ligne. “Visité” (déjà venu dans le rayon) peut prêter à confusion ; doc ou micro-copie à clarifier.
- **Boussole** : cap en “monde” (direction cardinale), pas orientation téléphone. Documenter si des utilisateurs s’attendent à une boussole physique.

---

## 5. DEAD ENDS TECHNIQUES (à corriger ou documenter)

| Où | Problème | Action |
|----|----------|--------|
| **HistoireArchives** | `console.log('Audio file not found (placeholder)')` ; lecture audio échoue | Remplacer par vrais assets ou désactiver bouton play. |
| **Codex** | `codex-helpers.ts` : 4× TODO inscribeCodexEntry | Ne pas exposer d’UI “Codex” tant que non implémenté. |
| **Sealing** | Aura “Sceller” → stub local uniquement | Documenter ou masquer. |
| **ActivationPage** | Référence à `vault.password_hash` (client) | Vérifier que le flux activation ne repose pas sur du hachage côté client sensible. |
| **Hash inconnu** | `#toto` ou hash mal formé | Gérer fallback (ex. retour homepage ou 404 doux). |

---

## 6. CHECKLIST SYNTHÉTIQUE AVANT MISE EN PUBLIC

### Sécurité

- [ ] RLS activé + policies service_role uniquement sur inscriptions, engraved_segments, meridian_proofs (vérif SQL en prod).
- [ ] Card Gate déployé ; CORS avec origine(s) exacte(s) ; cookie Path=/, HttpOnly, Secure.
- [ ] Variables VITE_* configurées en prod ; aucun secret en clair dans le repo.
- [ ] Gestion 401 : message clair + redirection vers entrée carte (pas seulement console).

### Fonctionnalités

- [ ] Parcours complet : activation/login → homepage → Quêtes (détail + run) → Méridiens (preuve) → Ma Carte (inscription + segments) → Carnet → Études (Coupole, Axe, Seuil) → Le Seuil (quiz) → Aura → Déconnecter / force-unpair.
- [ ] Sur téléphone : menu Explorer/Approfondir visible ; pas d’overlap ; safe areas.
- [ ] Stubs documentés ou masqués (Sceller, Codex, audio Histoire).

### Traduction

- [ ] Toutes les chaînes utilisateur passent par i18n (FR/EN).
- [ ] Erreurs et messages Card Gate traduits.

### Impasses / UX

- [ ] Décision : Origine / Histoire dans la nav ou non.
- [ ] Décision : nom “Le Seuil” (nav) vs “Quiz” pour éviter confusion avec Études → Seuil.
- [ ] Hash invalide : comportement défini (ex. redirect homepage).
- [ ] Méridiens : “Reconnu” vs “Visité” clarifié (doc ou micro-copie).

### Opérationnel

- [ ] Edge Functions (card-gate, make-server-9060b10a) déployées.
- [ ] Migrations Supabase appliquées en prod (notamment 006, 007).
- [ ] Build prod OK ; pas de régression majeure desktop/iPhone.
- [ ] (Optionnel) Purge cache CDN après déploi (Vercel) pour éviter ancien JS.

---

## 7. APRÈS LE LANCEMENT (hors scope “avant public”)

- Gravure collective (carte agrégée anonyme).
- Full desktop (layout, filtres carte, etc.).
- Notifications douces (“La ville a reconnu votre preuve”).
- Tableau de bord opérateur (pending → verified).
- Boussole “mode physique” (DeviceOrientation).

---

*Document généré pour ARCHÉ — à mettre à jour au fil des décisions et des correctifs.*
