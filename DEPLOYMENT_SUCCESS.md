# 🎉 DÉPLOIEMENT RÉUSSI !

## ✅ STATUT

Votre projet ARCHÉ est maintenant déployé sur Vercel !

**URLs de production :**
- 🌐 **Production** : https://arche-csxz9swmm-echofields-projects.vercel.app
- 🔗 **Alias** : https://arche-one.vercel.app
- 📊 **Dashboard** : https://vercel.com/echofields-projects/arche

**Repository GitHub :**
- 📦 https://github.com/echofield/arch-

---

## 🔐 ÉTAPE SUIVANTE : CONFIGURER LES VARIABLES D'ENVIRONNEMENT

### Via l'interface Vercel (RECOMMANDÉ)

1. **Aller sur** : https://vercel.com/echofields-projects/arche/settings/environment-variables

2. **Ajouter les variables suivantes** :

   | Variable | Valeur | Environnement |
   |----------|--------|---------------|
   | `VITE_SUPABASE_URL` | `https://qvyrpzgxsppkwfvqvgcn.supabase.co` | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2eXJwemd4c3Bwa3dmdnF2Z2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTc0MDIsImV4cCI6MjA3NzQzMzQwMn0.mYqlWWtonfV2etTLLsMQ0eXP805vpqC3nTZ6Pwy4on0` | Production, Preview, Development |

3. **Après avoir ajouté les variables, redéployez** :
   - Allez dans https://vercel.com/echofields-projects/arche/deployments
   - Cliquez sur les "..." du dernier déploiement
   - Sélectionnez "Redeploy"

---

## 🔧 CONFIGURATION SUPABASE EDGE FUNCTIONS

### 1. Configurer les secrets dans Supabase

1. **Aller sur** : https://supabase.com/dashboard/project/qvyrpzgxsppkwfvqvgcn/settings/functions

2. **Ajouter les secrets suivants** :
   - `SUPABASE_URL` = `https://qvyrpzgxsppkwfvqvgcn.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (trouvez dans Settings → API → service_role key)
   - `JWT_SECRET` = (trouvez dans Settings → API → JWT Secret)

### 2. Déployer les Edge Functions

```bash
# Installer Supabase CLI (si pas déjà fait)
npm install -g supabase

# Se connecter
supabase login

# Lier au projet
supabase link --project-ref qvyrpzgxsppkwfvqvgcn

# Déployer les fonctions
supabase functions deploy check-card
supabase functions deploy activate-card
supabase functions deploy login-card
supabase functions deploy server
```

**Localisation des fonctions** : `src/supabase/functions/`

---

## ✅ POST-DÉPLOIEMENT

### 1. Exécuter la migration

Une fois les variables d'environnement configurées et le site redéployé :

1. Ouvrez votre site : https://arche-one.vercel.app
2. Ouvrez la console du navigateur (F12)
3. Exécutez : `runMigration()`

Cette fonction ajoute la colonne `card_id` à la table `journal_entries`.

### 2. Générer les codes QR pour les cartes

```bash
# Option A : Via script
npx ts-node src/scripts/generate-card-codes.ts

# Option B : Via Supabase SQL Editor
# Copiez le SQL généré et exécutez-le dans Supabase Dashboard
```

---

## 🧪 TESTER LE DÉPLOIEMENT

1. **Vérifier que le site charge** : https://arche-one.vercel.app
2. **Vérifier la connexion Supabase** : Ouvrez la console et vérifiez qu'il n'y a pas d'erreurs
3. **Tester une carte** : `https://arche-one.vercel.app/c/TESTCODE` (remplacez TESTCODE par un code réel)

---

## 📊 MONITORING

- **Logs Vercel** : https://vercel.com/echofields-projects/arche/logs
- **Analytics** : https://vercel.com/echofields-projects/arche/analytics
- **Supabase Dashboard** : https://supabase.com/dashboard/project/qvyrpzgxsppkwfvqvgcn

---

## 🐛 DÉPANNAGE

### Le site ne se charge pas
- Vérifiez les logs dans Vercel Dashboard
- Vérifiez que les variables d'environnement sont bien configurées
- Redéployez après avoir ajouté les variables

### Erreur de connexion Supabase
- Vérifiez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans Vercel
- Vérifiez les CORS dans Supabase Dashboard
- Vérifiez que les Edge Functions sont déployées

### Migration ne fonctionne pas
- Vérifiez que les Edge Functions sont déployées
- Vérifiez les logs Supabase
- Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est configuré dans Supabase

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Code poussé sur GitHub
2. ✅ Déployé sur Vercel
3. ⏳ Configurer les variables d'environnement dans Vercel
4. ⏳ Configurer les secrets Supabase
5. ⏳ Déployer les Edge Functions
6. ⏳ Exécuter la migration
7. ⏳ Générer les codes QR

---

**🚀 Votre projet ARCHÉ est en ligne !**


