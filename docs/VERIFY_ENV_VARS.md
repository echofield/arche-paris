# Vérification des Variables d'Environnement

## 🔍 Comment vérifier que les variables sont bien chargées

### Dans le navigateur (sur votre site Vercel)

1. Ouvrez la console DevTools (F12)
2. Collez ce script :

```javascript
console.log('=== VÉRIFICATION VARIABLES D\'ENVIRONNEMENT ===');
console.log('VITE_SUPABASE_PROJECT_ID:', import.meta.env.VITE_SUPABASE_PROJECT_ID);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Définie' : '❌ Manquante');
console.log('Longueur ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0);
console.log('PROJECT_ID attendu: qvyrpzgxsppkwfvqvgcn');
console.log('PROJECT_ID reçu:', import.meta.env.VITE_SUPABASE_PROJECT_ID);
console.log('Match:', import.meta.env.VITE_SUPABASE_PROJECT_ID === 'qvyrpzgxsppkwfvqvgcn' ? '✅' : '❌');
```

### Résultats attendus

**Si les variables sont correctes :**
```
VITE_SUPABASE_PROJECT_ID: qvyrpzgxsppkwfvqvgcn
VITE_SUPABASE_ANON_KEY: ✅ Définie
Longueur ANON_KEY: 200+ (environ 200-250 caractères)
PROJECT_ID attendu: qvyrpzgxsppkwfvqvgcn
PROJECT_ID reçu: qvyrpzgxsppkwfvqvgcn
Match: ✅
```

**Si les variables sont manquantes :**
```
VITE_SUPABASE_PROJECT_ID: undefined
VITE_SUPABASE_ANON_KEY: ❌ Manquante
Longueur ANON_KEY: 0
PROJECT_ID attendu: qvyrpzgxsppkwfvqvgcn
PROJECT_ID reçu: undefined
Match: ❌
```

---

## 🔧 Variables nécessaires dans Vercel

### Variables requises

| Variable | Valeur attendue | Utilisation |
|----------|-----------------|-------------|
| `VITE_SUPABASE_PROJECT_ID` | `qvyrpzgxsppkwfvqvgcn` | Construit l'URL : `https://${projectId}.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Clé publique pour authentification |

### Où les trouver dans Supabase

1. Allez sur : https://supabase.com/dashboard/project/qvyrpzgxsppkwfvqvgcn/settings/api
2. **Project URL** → L'ID est dans l'URL : `https://qvyrpzgxsppkwfvqvgcn.supabase.co`
   - `qvyrpzgxsppkwfvqvgcn` = PROJECT_ID
3. **anon public** key → C'est la clé publique (commence par `eyJ...`)

---

## ⚠️ Si les variables sont correctes mais que le login ne marche toujours pas

**Le problème n'est PAS les variables**, c'est le **CORS** qu'on a identifié plus tôt :

- Supabase injecte `Access-Control-Allow-Origin: *` au niveau du gateway
- Cela bloque les requêtes avec `credentials: 'include'`
- Solution temporaire : utiliser le mode dev (`/demo`)

---

## ✅ Checklist de vérification

- [ ] Variables définies dans Vercel (Production, Preview, Development)
- [ ] Valeurs correctes (`qvyrpzgxsppkwfvqvgcn` et la clé anon complète)
- [ ] Redéploiement effectué après ajout des variables
- [ ] Script de vérification exécuté dans le navigateur
- [ ] Variables bien chargées (pas `undefined`)

---

## 🐛 Si les variables sont `undefined` dans le navigateur

**Causes possibles :**
1. Variables pas définies dans Vercel pour l'environnement actuel
2. Redéploiement pas effectué après ajout des variables
3. Variables mal nommées (typo dans le nom)

**Solution :**
1. Vérifier dans Vercel Dashboard → Settings → Environment Variables
2. S'assurer que les variables sont définies pour **tous les environnements**
3. Redéployer après modification
