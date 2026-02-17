# Test du Mode Développement - Accès Direct Sans Login

## ✅ Solution Implémentée

Le code a été modifié pour permettre un accès direct sans login en ajoutant `/demo` ou `/demo` à l'URL.

## 🚀 Comment Tester

### Option 1: Mode Dev (Recommandé)
```
https://www.xn--arch-paris-e7a.com//demo
```

### Option 2: Skip Auth
```
https://www.xn--arch-paris-e7a.com//demo
```

## 🔍 Vérification

1. **Ouvrez la console du navigateur** (F12)
2. **Vous devriez voir** : `[ARCHÉ] Dev mode enabled - skipping authentication`
3. **L'application devrait s'ouvrir directement** sans écran de login

## 📋 URLs de Test

- **Homepage** : `https://www.xn--arch-paris-e7a.com//demo`
- **Le Champ** : `https://www.xn--arch-paris-e7a.com//demo#champ`
- **Aura** : `https://www.xn--arch-paris-e7a.com//demo#aura`
- **Quêtes** : `https://www.xn--arch-paris-e7a.com//demo#quetes`
- **Études** : `https://www.xn--arch-paris-e7a.com//demo#etudes`

## ⚠️ Si ça ne marche pas

1. **Vérifiez que le code est déployé** :
   - Les modifications sont dans `src/App.tsx` et `src/utils/card-service.ts`
   - Assurez-vous que le build a été fait et déployé

2. **Videz le cache du navigateur** :
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

3. **Vérifiez la console** :
   - Ouvrez F12 → Console
   - Cherchez le message `[ARCHÉ] Dev mode enabled`
   - Si vous ne le voyez pas, le code n'est peut-être pas déployé

4. **Testez en local** :
   ```bash
   npm run dev
   ```
   Puis : `http://localhost:5173//demo`

## 🎯 Ce qui devrait se passer

1. ✅ Pas d'écran de login
2. ✅ Pas de CardGate
3. ✅ Accès direct à l'application
4. ✅ Toutes les pages fonctionnent (sauf sauvegarde backend)

## 📝 Notes

- Le mode dev utilise `cardId: 'DEMO-DEV'`
- Les fonctionnalités backend (sauvegarde) ne fonctionneront pas
- C'est normal, on attend le fix CORS de Supabase pour ça
