# Dépannage : CSP (eval bloqué) et « Carte non reconnue »

## Erreur « Content Security Policy blocks eval »

**Symptôme :** La console affiche que la CSP du site interdit l’usage de `eval` en JavaScript.

**Causes possibles :**
1. **En-têtes Vercel** : Dans le Dashboard Vercel → Project → Settings → Headers, une règle peut définir `Content-Security-Policy` avec un `script-src` qui n’inclut pas `'unsafe-eval'`. Une dépendance (ex. Supabase, outil de build) peut utiliser `eval` ou `new Function()`.
2. **Extension navigateur** : Une extension de sécurité ou de confidentialité peut injecter une CSP stricte.
3. **Pas de CSP dans ce repo** : `vercel.json` et `index.html` ne définissent pas de CSP. Si vous voyez quand même l’erreur, elle vient d’ailleurs (Vercel custom headers ou extension).

**À faire :**
- **Option A** : Dans Vercel → Settings → Headers, supprimer ou assouplir la règle qui envoie `Content-Security-Policy` (par ex. ajouter `'unsafe-eval'` à `script-src` si nécessaire).
- **Option B** : Tester en navigation privée sans extension pour confirmer que c’est bien la CSP du site (et pas une extension).
- **Option C** : Si vous voulez garder une CSP stricte, identifier la lib qui utilise `eval` (stack trace dans la console) et la remplacer ou mettre à jour.

---

## « Carte non reconnue » / Connexion ne marche pas

**Vérifications :**
1. **Variables au build** : Le front déployé doit être buildé avec `VITE_SUPABASE_PROJECT_ID` et `VITE_SUPABASE_ANON_KEY` (Vercel → Settings → Environment Variables). Sans ça, les appels à `check-card` et `card-gate/pair` peuvent échouer ou ne pas partir.
2. **CSP** : Si une CSP bloque du script (eval ou autre), l’app peut ne pas s’initialiser correctement et la vérification de carte peut ne jamais s’exécuter → message type « carte non reconnue ».
3. **Service Worker** : Vider le cache du site et le SW (Application → Storage → Clear site data) puis recharger, pour éviter un ancien JS en cache.
4. **Edge Function** : S’assurer que la fonction `card-gate` est déployée avec `verify_jwt = false` (Supabase Dashboard ou `config.toml`) et que les réponses ont les bons en-têtes CORS (origine explicite, pas `*`).

---

## Résumé

- **CSP + eval** : Vérifier les en-têtes (Vercel, etc.), tester sans extension, assouplir la CSP si nécessaire.
- **Carte non reconnue** : Vérifier les variables d’env au build, que la CSP ne bloque pas le script, et que card-gate est bien déployée et configurée.
