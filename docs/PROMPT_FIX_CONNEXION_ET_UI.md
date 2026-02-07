# Prompt pour Claude — Corriger connexion carte + UI iPhone (ARCHÉ)

**Repo :** `https://github.com/echofield/arche-paris` (ou ton fork / chemin local)

---

## Contexte

Application web ARCHÉ (Paris, cartes, quêtes). Connexion via une carte physique : l’utilisateur entre un code (ex. PS-0001) puis active avec mot de passe ou se connecte si déjà activé. Le front appelle `check-card` (make-server), puis `card-gate/pair` (Supabase Edge Function). Les requêtes utilisent `credentials: 'include'` et `Authorization: Bearer <VITE_SUPABASE_ANON_KEY>`.

---

## Problèmes à corriger

### 1. Connexion — 409 "Already paired" mal géré

- **Symptôme :** Quand la carte est déjà appairée (autre appareil ou même navigateur sans cookie), le serveur renvoie **409** avec `{ "error": "Already paired", "code": "ALREADY_PAIRED" }`. Le front affiche "Card Gate after auth: Error: Already paired" et l’utilisateur reste bloqué.
- **Comportement attendu :**
  - Si on a encore le **cookie de session** (même appareil) : après 409, appeler **/refresh** ou **/validate** avec le cookie ; si ça réussit, considérer l’utilisateur connecté et aller sur la homepage (pas d’erreur).
  - Si on n’a **pas** le cookie (autre appareil / cookie supprimé) : ne pas afficher une erreur brute. Afficher un message clair du type « Cette carte est déjà utilisée sur un autre appareil. Pour l’utiliser ici, entre ton mot de passe pour la transférer. » avec un champ mot de passe, puis appeler **force-unpair** (card_id + password), puis **pair** à nouveau.
- **Fichiers concernés :** `src/utils/card-service.ts` (`afterCardGateAuthenticated`), éventuellement un composant pour le message + mot de passe (ex. dans le flux CardGate / CardLogin). Le client a déjà `forceUnpairDevice` et `pairDevice` dans `src/utils/card-gate-client.ts`.

### 2. Connexion — Fluidité et annulations

- **Symptôme :** Sur ordinateur « ça marche mais pas fluidement, comme si un bug annulait quelque chose » (requêtes annulées, transitions coupées, double clic, etc.).
- **À faire :** Vérifier le flux dans `src/App.tsx` et les composants de connexion (CardGate, CardLogin, CardActivation) : pas de double soumission, pas de navigation ou reset d’état pendant les appels async (pair, validate, refresh). Gérer correctement les états (loading, erreur, succès) et éviter de démonter le composant ou de changer de vue avant la fin des requêtes. Si des `fetch` ou des promesses sont annulées (AbortController, changement de route), s’assurer que les erreurs d’annulation ne sont pas affichées comme des erreurs « connexion échouée ».

### 3. iPhone — Connexion ne marche pas avec le code

- **Symptôme :** Sur téléphone, la connexion avec le code (et mot de passe) ne fonctionne pas (alors qu’en desktop ça peut marcher).
- **À vérifier :** Même flux que desktop : `check-card` puis `pair` (ou login puis pair), avec les mêmes headers (Origin, Authorization Bearer anon, Content-Type, credentials: 'include'). Vérifier que les variables d’environnement (`VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY`) sont bien injectées au **build** utilisé pour le déploiement mobile/PWA. Vérifier aussi que sur iPhone (Safari) il n’y a pas de blocage CORS sur la réponse (réponse doit avoir `Access-Control-Allow-Origin: <exact origin>` et `Access-Control-Allow-Credentials: true`, jamais `*`). Les erreurs réseau / CORS doivent être traitées par un message clair, pas une erreur technique brute.

### 4. iPhone — UI pas « sharp »

- **Symptôme :** Sur téléphone l’interface ne paraît pas nette / soignée (safe areas, espacements, lisibilité).
- **À faire :**
  - **Safe areas :** `viewport-fit=cover` dans `index.html` (déjà fait) ; tous les écrans principaux (homepage, flux de connexion, cartes) doivent utiliser `env(safe-area-inset-*)` pour le padding (haut, bas, gauche, droite) afin que rien ne soit sous le notch ou la barre d’accueil.
  - **Zone bas de l’écran :** Rien d’essentiel dans les ~80 px du bas (barre Safari). Boutons principaux et texte important au-dessus.
  - **Touch targets :** Boutons et liens cliquables avec au moins 44px de hauteur/largeur et padding suffisant sur mobile (media query max-width 768px ou équivalent).
  - **Typo / lisibilité :** Tailles de police lisibles sur petit écran (nav, labels, messages d’erreur) ; contraste suffisant.
  - **Flux de connexion sur mobile :** Champs de formulaire (code, mot de passe) bien dimensionnés, boutons de soumission avec bonne zone de toucher, messages d’erreur lisibles.

Fichiers typiques : `index.html`, `src/styles/globals.css`, `src/components/HomepageV1.tsx`, composants CardGate / CardLogin / CardActivation, et tout composant utilisé dans le flux de connexion ou la homepage.

---

## Contraintes

- Ne pas changer la logique métier côté Edge Functions (card-gate, make-server) sauf si tu identifies un bug évident (ex. CORS). Les corrections demandées sont côté **front** (React, CSS, flux d’appels).
- Garder la même stack (React, Vite, Supabase). Pas de nouvelle dépendance lourde sans nécessité.
- Après 409, le flux doit soit récupérer la session (refresh/validate), soit proposer explicitement le transfert par mot de passe (force-unpair + pair), sans laisser l’utilisateur sur une erreur « Already paired » sans issue.

---

## Livrable attendu

1. **Code :** Modifications dans le repo (branche ou commit clair) pour les points 1 à 4.
2. **Résumé court :** Liste des fichiers modifiés et, pour chaque problème (409, fluidité, iPhone connexion, UI sharp), ce qui a été fait en 1–2 phrases.

Tu peux cloner le repo, appliquer les changements, puis décrire les patches ou faire un commit avec un message explicite (ex. `fix: handle 409 Already paired with refresh or transfer flow; improve mobile UX and safe areas`).
