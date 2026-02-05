# Diagnostic — Connexion PS-0001 sur mobile

## Problème
La connexion avec PS-0001 et test1234 ne fonctionne pas sur téléphone.

## Causes possibles

### 1. Variables d'environnement manquantes au build
Les variables `VITE_SUPABASE_PROJECT_ID` et `VITE_SUPABASE_ANON_KEY` doivent être définies **au moment du build** pour être injectées dans le code.

**Vérification :**
- Ouvrir la console du navigateur mobile (via USB debugging ou Safari Web Inspector)
- Regarder les logs : si vous voyez `[CardGate] Missing environment variables`, c'est que les variables ne sont pas définies

**Solution :**
- Si déployé sur Vercel : aller dans Settings → Environment Variables et ajouter :
  - `VITE_SUPABASE_PROJECT_ID` = votre project ID Supabase
  - `VITE_SUPABASE_ANON_KEY` = votre anon key Supabase
- Si déployé ailleurs : configurer les variables d'environnement dans la plateforme
- **Important** : après ajout, redéployer l'application

### 2. Edge Functions non déployées ou mauvais chemin
Le code utilise le chemin `/make-server-9060b10a/check-card` (et activate-card, login-card).

**Vérification :**
- Dans la console mobile, regarder les logs `[CardGate] Checking card:` et `[CardGate] Response status:`
- Si vous voyez une erreur 404, l'Edge Function n'est pas déployée ou le chemin est incorrect

**Solution :**
- Vérifier que les Edge Functions sont déployées :
  ```bash
  supabase functions list
  ```
- Si le nom de fonction est différent de `make-server-9060b10a`, mettre à jour les URLs dans :
  - `src/components/CardGate.tsx`
  - `src/components/CardActivation.tsx`
  - `src/components/CardLogin.tsx`

### 3. CORS bloqué sur mobile
L'Edge Function `activate-card` a une liste d'origines autorisées. Si l'app mobile est servie depuis une origine non listée, la requête sera bloquée.

**Vérification :**
- Dans la console mobile, regarder les erreurs réseau
- Si vous voyez une erreur CORS (ex. "Origin not allowed"), c'est le problème

**Solution :**
- Modifier `src/supabase/functions/activate-card/index.tsx` :
  - Ajouter l'origine de votre app mobile dans `ALLOWED_ORIGINS`
  - Ou temporairement mettre `origin: '*'` pour tester (puis restreindre)

### 4. Carte PS-0001 non créée en base
La carte doit exister dans la table `cards` avec le code `PS-0001`.

**Vérification :**
- Se connecter à Supabase Dashboard
- Aller dans Table Editor → `cards`
- Chercher une ligne avec `code = 'PS-0001'`

**Solution :**
- Si la carte n'existe pas, la créer :
  ```sql
  INSERT INTO cards (id, code, password_hash, activated_at)
  VALUES ('PS-0001', 'PS-0001', NULL, NULL);
  ```
- Ou utiliser le script de génération de cartes

### 5. Mot de passe incorrect ou carte déjà activée
Si la carte est déjà activée avec un autre mot de passe, `test1234` ne fonctionnera pas.

**Vérification :**
- Dans Supabase, vérifier la ligne `PS-0001` :
  - Si `password_hash` est NULL → carte vierge (activation)
  - Si `password_hash` existe → carte activée (login avec le bon mot de passe)

**Solution :**
- Pour réinitialiser la carte (si besoin) :
  ```sql
  UPDATE cards
  SET password_hash = NULL, activated_at = NULL, failed_attempts = 0, locked_until = NULL
  WHERE code = 'PS-0001';
  ```

## Étapes de diagnostic

1. **Ouvrir la console mobile** (Chrome DevTools via USB ou Safari Web Inspector)
2. **Tenter la connexion** avec PS-0001 / test1234
3. **Regarder les logs** :
   - `[CardGate] Checking card:` → URL appelée
   - `[CardGate] Response status:` → Code HTTP
   - `[CardGate] Response error:` → Message d'erreur détaillé
4. **Vérifier les erreurs réseau** dans l'onglet Network :
   - Status code (404, 500, CORS error, etc.)
   - Response body

## Améliorations apportées

Les fichiers suivants ont été modifiés pour améliorer le debugging :
- `src/components/CardGate.tsx` : logs détaillés + vérification variables env
- `src/components/CardActivation.tsx` : logs détaillés + meilleure gestion erreurs
- `src/components/CardLogin.tsx` : logs détaillés + meilleure gestion erreurs

## Test rapide

Pour tester rapidement si les Edge Functions fonctionnent :

```bash
# Depuis votre terminal
curl -X POST \
  https://VOTRE_PROJECT_ID.supabase.co/functions/v1/make-server-9060b10a/check-card \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_ANON_KEY" \
  -d '{"code":"PS-0001"}'
```

Si ça fonctionne en ligne de commande mais pas sur mobile, c'est probablement un problème de variables d'environnement au build ou de CORS.
