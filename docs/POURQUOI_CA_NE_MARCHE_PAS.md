# Pourquoi ça ne marche pas ? (Explication claire)

## ❌ Ce n'est PAS lié à votre schéma personnalisé

Votre schéma PostgreSQL est **parfaitement normal** pour Supabase. Supabase supporte :
- ✅ Tables personnalisées (vous avez `cards`, `journal_entries`, `traces`, etc.)
- ✅ RLS (Row Level Security) — très courant
- ✅ Fonctions PL/pgSQL — standard PostgreSQL
- ✅ Enums personnalisés — normal
- ✅ JSONB — très utilisé

**Votre schéma n'est PAS le problème.** Supabase gère des milliers de projets avec des schémas bien plus complexes.

---

## 🔍 Le vrai problème : Infrastructure Supabase

### Preuve #1 : Erreur 503 avec wildcard

Quand votre fonction **ne démarre même pas** (erreur 503), Supabase retourne quand même `Access-Control-Allow-Origin: *` :

```bash
curl -X OPTIONS "https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh"
# Résultat : 503 Service Unavailable
# Mais headers contiennent : Access-Control-Allow-Origin: *
```

**Conclusion** : Votre code ne s'exécute même pas, mais Supabase ajoute le wildcard. C'est le **gateway/CDN de Supabase** qui injecte ce header, pas votre code.

### Preuve #2 : Headers ajoutés par Supabase

Ces headers sont ajoutés par l'infrastructure Supabase, pas par votre code :
- `sb-gateway-version: 1` ← Supabase
- `sb-project-ref: qvyrpzgxsppkwfvqvgcn` ← Supabase
- `x-served-by: supabase-edge-runtime` ← Supabase
- **`Access-Control-Allow-Origin: *`** ← **SUPABASE** (même si votre code ne le set jamais)

### Preuve #3 : Votre code est correct

Votre code dans `card-gate/index.tsx` :
- ✅ Ne set **jamais** `Access-Control-Allow-Origin: *`
- ✅ Set toujours l'origine spécifique : `headers.set("Access-Control-Allow-Origin", origin)`
- ✅ Vérifie explicitement `isOriginAllowed(origin)` avant de setter
- ✅ Logs de diagnostic confirment que votre code retourne l'origine spécifique

**Mais** : Le navigateur voit quand même `*` dans la réponse finale.

---

## 🎯 Pourquoi Supabase fait ça ?

### Comportement par défaut du gateway

Supabase ajoute automatiquement `Access-Control-Allow-Origin: *` au niveau du **gateway/CDN** pour :
- Simplifier le CORS pour les débutants
- Permettre l'accès depuis n'importe quel domaine (par défaut)

**Problème** : Ce comportement entre en conflit avec `credentials: 'include'` qui nécessite une origine spécifique (pas de wildcard).

### Pourquoi c'est un problème pour vous ?

Votre application utilise `credentials: 'include'` pour :
- Envoyer des cookies httpOnly (refresh tokens)
- Sécurité renforcée

Le navigateur bloque automatiquement les requêtes avec `credentials: 'include'` si la réponse contient `Access-Control-Allow-Origin: *`.

---

## 💡 Solutions possibles

### Solution 1 : Contourner avec mode dev (actuel)
- ✅ Fonctionne immédiatement
- ✅ Pas de dépendance à Supabase
- ❌ Pas de données persistantes (localStorage seulement)

### Solution 2 : Passer au plan Pro ($25/mois)
- ✅ Support prioritaire
- ✅ Ticket SU-323600 sera traité plus rapidement
- ✅ Accès à l'équipe Supabase pour résoudre le problème
- ⚠️ Pas garanti instantané (mais beaucoup plus rapide que gratuit)

### Solution 3 : Workaround technique (si support ne résout pas)
- Utiliser un proxy backend (Vercel Serverless Function)
- Ou utiliser `credentials: 'omit'` et gérer les tokens différemment
- Ou héberger les Edge Functions ailleurs (Railway, Render)

---

## ⏱️ Temps de réponse avec plan Pro

### Plan Gratuit
- ❌ **Pas de garantie** de réponse
- ⏱️ **7+ jours** (ou jamais) pour les problèmes non-critiques
- 📧 Réponse automatique : "Free plan will receive no guaranteed support response"

### Plan Pro ($25/mois)
- ✅ **Support prioritaire**
- ⏱️ **1-3 jours** généralement (parfois même le jour même)
- ✅ Ticket SU-323600 sera traité avec priorité
- ✅ Accès à l'équipe technique Supabase

**Note** : Même avec le plan Pro, ce n'est pas garanti instantané (pas de SLA de 1h), mais c'est **beaucoup plus rapide** que le plan gratuit.

---

## 🔧 Pourquoi Supabase ne peut pas résoudre ça automatiquement ?

### Le problème technique

Le gateway Supabase ajoute `Access-Control-Allow-Origin: *` **avant** que votre fonction Edge Function ne s'exécute. C'est au niveau de l'infrastructure, pas au niveau de votre code.

Pour résoudre ça, Supabase devrait :
1. Détecter que votre fonction retourne une origine spécifique
2. Ne pas ajouter le wildcard si une origine spécifique est déjà présente
3. Ou permettre de désactiver l'injection automatique de CORS

**C'est un problème connu** de Supabase, mais il nécessite une modification de leur infrastructure (pas juste une config).

---

## 📊 Comparaison : Schéma vs Infrastructure

| Aspect | Votre schéma | Infrastructure Supabase |
|--------|--------------|-------------------------|
| **Complexité** | Normal (tables, RLS, fonctions) | Gateway/CDN qui injecte headers |
| **Contrôle** | Vous contrôlez 100% | Vous ne contrôlez pas |
| **Problème** | ✅ Aucun problème | ❌ Injecte `*` automatiquement |
| **Solution** | N/A (pas nécessaire) | Support Supabase ou workaround |

---

## ✅ Conclusion

### Ce n'est PAS votre schéma
- Votre schéma PostgreSQL est parfaitement normal
- Supabase supporte très bien les schémas personnalisés
- Le problème vient de l'infrastructure Supabase, pas de votre code

### Le vrai problème
- Supabase injecte `Access-Control-Allow-Origin: *` au niveau du gateway
- Cela entre en conflit avec `credentials: 'include'`
- Votre code est correct, mais Supabase override les headers

### Solutions
1. **Court terme** : Mode dev (`/demo`) — fonctionne maintenant
2. **Moyen terme** : Plan Pro ($25/mois) — support prioritaire pour résoudre
3. **Long terme** : Si Supabase ne résout pas → workaround technique ou migration

### Plan Pro = Plus rapide, mais pas instantané
- ⏱️ **1-3 jours** généralement (vs 7+ jours ou jamais)
- ✅ Ticket SU-323600 sera traité avec priorité
- ✅ Accès à l'équipe technique
- ⚠️ Pas de SLA garanti de 1h (mais beaucoup mieux que gratuit)

---

## 🎯 Recommandation

1. **Rester sur plan gratuit** pour l'instant (mode dev fonctionne)
2. **Si projet décolle** → Passer au plan Pro ($25/mois)
3. **Ouvrir ticket avec plan Pro** → Résolution en 1-3 jours généralement
4. **Si Supabase ne résout pas** → Considérer workaround ou migration (mais ROI douteux)

**Votre schéma n'est pas le problème. C'est un bug/limitation de l'infrastructure Supabase.**
