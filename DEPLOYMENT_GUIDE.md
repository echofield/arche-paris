# 🚀 Guide de Déploiement ARCHÉ sur Vercel

## ✅ VÉRIFICATIONS PRÉLIMINAIRES

### 1. Vérification de la configuration

✅ **package.json** : Scripts `dev` et `build` présents
✅ **vercel.json** : Configuré pour Vite (déplacé à la racine)
✅ **vite.config.ts** : Output directory corrigé pour `dist`
✅ **TypeScript** : Aucune erreur détectée

---

## 📦 ÉTAPE 1 : INSTALLATION DES DÉPENDANCES

Si ce n'est pas déjà fait, installez les dépendances :

```powershell
npm install
```

---

## 🔧 ÉTAPE 2 : TEST DU BUILD LOCAL

Testez que le build fonctionne localement :

```powershell
npm run build
```

Le dossier `dist/` doit être créé. Si des erreurs apparaissent, corrigez-les avant de continuer.

---

## 📤 ÉTAPE 3 : INITIALISATION GIT ET PUSH SUR GITHUB

### 3.1. Initialiser Git (si pas déjà fait)

```powershell
git init
```

### 3.2. Ajouter tous les fichiers

```powershell
git add .
```

### 3.3. Créer le premier commit

```powershell
git commit -m "Initial commit - Ready for Vercel deployment"
```

### 3.4. Ajouter le remote GitHub

```powershell
git remote add origin https://github.com/echofield/arch-.git
```

### 3.5. Pousser sur GitHub

```powershell
git branch -M main
git push -u origin main
```

**Note** : Si le repo existe déjà avec du contenu, utilisez :
```powershell
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## 🌐 ÉTAPE 4 : DÉPLOIEMENT SUR VERCEL

### Option A : Via l'interface web Vercel (RECOMMANDÉ)

1. **Aller sur [vercel.com](https://vercel.com)** et se connecter
2. **Cliquer sur "Add New Project"**
3. **Importer le repository GitHub** : `echofield/arch-`
4. **Configuration automatique** :
   - Framework Preset : **Vite** (détecté automatiquement)
   - Root Directory : `./` (racine)
   - Build Command : `npm run build` (déjà dans vercel.json)
   - Output Directory : `dist` (déjà dans vercel.json)
5. **Configurer les variables d'environnement** (voir section suivante)
6. **Cliquer sur "Deploy"**

### Option B : Via CLI Vercel

1. **Installer Vercel CLI** :
```powershell
npm install -g vercel
```

2. **Se connecter à Vercel** :
```powershell
vercel login
```

3. **Déployer** :
```powershell
vercel
```

Suivez les instructions interactives. Pour la production :
```powershell
vercel --prod
```

---

## 🔐 ÉTAPE 5 : VARIABLES D'ENVIRONNEMENT DANS VERCEL

Dans le dashboard Vercel de votre projet, allez dans **Settings → Environment Variables** et ajoutez :

### Variables pour le Frontend (Vite)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | `https://qvyrpzgxsppkwfvqvgcn.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon key) de Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

**Note** : D'après votre code, ces valeurs sont actuellement hardcodées dans `src/utils/supabase/info.tsx`. Vous devrez soit :
- Utiliser les variables d'environnement dans le code
- Ou simplement les ajouter dans Vercel pour référence future

### Variables pour les Edge Functions Supabase

Ces variables sont gérées dans Supabase, pas dans Vercel :

| Variable | Où la configurer |
|----------|------------------|
| `SUPABASE_URL` | Dashboard Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard Supabase → Project Settings → API (⚠️ SECRET) |
| `JWT_SECRET` | Dashboard Supabase → Project Settings → API → JWT Secret |

**Pour configurer dans Supabase** :
1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. **Settings → Edge Functions → Secrets**
4. Ajoutez les variables nécessaires

---

## 🎯 ÉTAPE 6 : POST-DÉPLOIEMENT

### 6.1. Exécuter la migration de base de données

Une fois le site déployé, ouvrez la console du navigateur sur votre site Vercel et exécutez :

```javascript
runMigration()
```

Cette fonction ajoute `card_id` à la table `journal_entries`.

### 6.2. Générer les codes QR pour les cartes

Vous avez deux options :

#### Option A : Via le script TypeScript

```powershell
# Si vous avez ts-node installé
npx ts-node src/scripts/generate-card-codes.ts
```

#### Option B : Via Supabase SQL Editor

1. Allez dans **Supabase Dashboard → SQL Editor**
2. Exécutez le script généré par `generate-card-codes.ts`
3. Ou créez manuellement les codes :

```sql
INSERT INTO cards (code) VALUES
  ('ABC123'),
  ('DEF456'),
  -- ... etc
;
```

#### Option C : Via l'API Supabase Edge Function

Si vous avez configuré l'endpoint `/generate-codes`, vous pouvez l'appeler :

```powershell
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/server/generate-codes \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"count": 50}'
```

---

## 🔍 VÉRIFICATIONS POST-DÉPLOIEMENT

1. ✅ **Site accessible** : Vérifiez que `https://votre-projet.vercel.app` fonctionne
2. ✅ **Build réussi** : Vérifiez les logs de build dans Vercel Dashboard
3. ✅ **Variables d'environnement** : Vérifiez qu'elles sont bien chargées
4. ✅ **Connexion Supabase** : Testez l'authentification et les requêtes
5. ✅ **Migration exécutée** : Vérifiez dans Supabase que `journal_entries` a bien `card_id`

---

## 🐛 DÉPANNAGE

### Erreur : "Build failed"

- Vérifiez les logs dans Vercel Dashboard
- Testez `npm run build` localement
- Vérifiez que toutes les dépendances sont dans `package.json`

### Erreur : "Environment variables not found"

- Vérifiez que les variables commencent par `VITE_` pour Vite
- Redéployez après avoir ajouté les variables
- Vérifiez que les variables sont ajoutées pour l'environnement correct (Production/Preview)

### Erreur : "404 on routes"

- Vérifiez que `vercel.json` a bien la règle `rewrites` pour SPA
- Vérifiez que `outputDirectory` est bien `dist`

### Erreur : "Supabase connection failed"

- Vérifiez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
- Vérifiez les CORS dans Supabase Dashboard
- Vérifiez que les Edge Functions ont les bonnes variables d'environnement

---

## 📝 NOTES IMPORTANTES

1. **Variables d'environnement** : Les variables `VITE_*` sont exposées au client. Ne mettez jamais de secrets dans `VITE_*`.

2. **Edge Functions** : Vos Edge Functions Supabase sont déployées séparément via Supabase CLI, pas via Vercel.

3. **Base de données** : La migration doit être exécutée manuellement après le premier déploiement.

4. **Codes de cartes** : Générés une seule fois et stockés dans Supabase. Ne les régénérez pas après la mise en production.

---

## ✅ CHECKLIST FINALE

- [ ] Dépendances installées (`npm install`)
- [ ] Build local réussi (`npm run build`)
- [ ] Code poussé sur GitHub
- [ ] Projet déployé sur Vercel
- [ ] Variables d'environnement configurées
- [ ] Migration exécutée (`runMigration()`)
- [ ] Codes QR générés
- [ ] Site testé et fonctionnel

---

**🎉 Votre projet ARCHÉ est maintenant déployé sur Vercel !**


