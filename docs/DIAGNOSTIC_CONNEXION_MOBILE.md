# Diagnostic — Connexion PS-0001 sur mobile

## Problème
La connexion avec PS-0001 et test1234 ne fonctionne pas sur téléphone.

## Même carte sur plusieurs appareils
La même carte (ex. PS-0001) peut être utilisée sur **plusieurs appareils** : l’ordinateur et le téléphone ont chacun leur propre session (stockée en local). Il n’y a pas de « verrouillage » côté serveur.

- **Sur l’ordinateur** : si la carte est déjà connectée, vous pouvez cliquer sur **Déconnecter** (en haut à droite sur la homepage) pour libérer la session sur cet appareil.
- **Sur le téléphone** : ouvrir l’app, saisir le code **PS-0001** puis le mot de passe. La connexion doit aboutir si l’Edge Function et la base sont corrects (voir causes ci‑dessous).

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

### 3. CORS bloqué sur mobile (corrigé)
L'Edge Function `make-server-9060b10a` n'autorisait que certaines origines. Sur mobile, si l'URL d'accès (ex. autre sous-domaine Vercel) n'était pas dans la liste, le serveur renvoyait 403 "Origin not allowed".

**Solution appliquée :** Dans `supabase/functions/make-server-9060b10a/index.tsx`, toute origine `https://` est maintenant autorisée (sécurité = code + mot de passe). **Il faut redéployer l'Edge Function** pour que le correctif soit actif :

```bash
supabase functions deploy make-server-9060b10a
```

### 4. Carte PS-0001 en base : table `cards`
La connexion (check-card, activate-card, login-card) utilise **uniquement** la table `cards`. La table `user_lieu_cards` sert aux inscriptions par lieu et n’intervient pas pour le login carte.

**À vérifier dans Supabase → Table Editor → `cards` pour la ligne `id = 'PS-0001'` :**

| Colonne | Rôle | À vérifier |
|--------|------|------------|
| `id` | Identifiant carte | Une ligne avec `id = 'PS-0001'` doit exister. |
| `password_hash` | Mot de passe hashé | NULL = carte vierge (écran activation). Renseigné = carte activée (écran login). |
| `activated_at` | Date d’activation | Renseigné après activation. |
| `failed_attempts` | Tentatives de login échouées | Si ≥ 5, la carte peut être verrouillée. |
| `locked_until` | Fin du verrouillage | Si date/heure **dans le futur**, la carte est verrouillée. |

**Si la carte est verrouillée**, débloquer en base :
```sql
UPDATE cards SET failed_attempts = 0, locked_until = NULL WHERE id = 'PS-0001';
```

**Si la carte n’existe pas**, la créer (carte vierge) :
```sql
INSERT INTO cards (id, activated_at, password_hash, failed_attempts, locked_until)
VALUES ('PS-0001', NULL, NULL, 0, NULL);
```
Puis sur l’app : saisir PS-0001 → écran activation → choisir un mot de passe.

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
  WHERE id = 'PS-0001';
  ```

## Tester avec une autre carte : PS-0002
Pour isoler un souci lié à une carte (verrouillage, mauvaise config), vous pouvez utiliser **PS-0002**.

1. **Vérifier ou créer la carte en base** (Supabase → SQL Editor) :
   ```sql
   -- Si elle n'existe pas, créer une carte vierge
   INSERT INTO cards (id, activated_at, password_hash, failed_attempts, locked_until)
   VALUES ('PS-0002', NULL, NULL, 0, NULL)
   ON CONFLICT (id) DO NOTHING;
   -- Si elle existe mais est verrouillée ou déjà activée, réinitialiser :
   UPDATE cards
   SET password_hash = NULL, activated_at = NULL, failed_attempts = 0, locked_until = NULL
   WHERE id = 'PS-0002';
   ```
2. **Sur le téléphone** : ouvrir l’app, saisir le code **PS-0002**.
3. Si la carte est vierge → écran **Activation** : choisir un mot de passe (ex. `test1234`) et confirmer.
4. Si la carte est déjà activée → écran **Connexion** : entrer le mot de passe défini à l’activation.

Les cartes **PS-0003** à **PS-0100** existent dans `generated-cards/insert-cards.sql` ; vous pouvez en utiliser une autre de la même façon (remplacer `PS-0002` par `PS-0003`, etc.).

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
