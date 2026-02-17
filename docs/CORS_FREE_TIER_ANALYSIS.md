# Analyse : CORS et Plan Gratuit Supabase

## Question
Le problème CORS (`Access-Control-Allow-Origin: *`) pourrait-il être lié au plan gratuit ?

## Réponse : Non, probablement pas

### 1. Documentation Supabase
D'après la documentation officielle Supabase :
- ✅ **Aucune limitation CORS spécifique au plan gratuit**
- ✅ Les Edge Functions fonctionnent de la même manière sur tous les plans
- ✅ CORS est géré au niveau du code de la fonction, pas du plan

### 2. Preuve Technique
**Même avec une erreur 503 (fonction ne démarre pas), Supabase retourne `Access-Control-Allow-Origin: *`**

Cela prouve que :
- Ce n'est PAS une limitation du plan gratuit
- C'est le **gateway Supabase** qui ajoute ce header **avant** que votre code s'exécute
- Cela se produit indépendamment du plan

### 3. Documentation Supabase Recommande `*`
**Point important** : La documentation Supabase recommande d'utiliser `Access-Control-Allow-Origin: *` dans leurs exemples :

```typescript
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
```

Cela suggère que Supabase pourrait avoir une **configuration par défaut** au niveau du gateway qui ajoute `*` automatiquement.

### 4. Pourquoi le Gateway Ajoute `*`
Le gateway Supabase semble ajouter `Access-Control-Allow-Origin: *` par défaut pour :
- Simplifier le développement (fonctionne "out of the box")
- Éviter les erreurs CORS courantes
- **Mais** cela casse les requêtes avec `credentials: 'include'`

### 5. Limites du Plan Gratuit (non liées à CORS)
Les limites du plan gratuit concernent :
- ⏱️ Durée d'exécution (150s max)
- 💾 Mémoire (256MB max)
- 🔢 Nombre d'invocations (500k/mois)
- 📦 Taille des fonctions (20MB max)

**Aucune de ces limites n'affecte CORS.**

---

## Conclusion

Le problème vient probablement de :
1. ✅ **Configuration par défaut du gateway Supabase** (ajoute `*` automatiquement)
2. ❌ **PAS** du plan gratuit
3. ❌ **PAS** d'une limitation de fonctionnalité

---

## Solution

Même avec un plan payant, le problème persisterait probablement car :
- Le gateway ajoute `*` **avant** que votre code s'exécute
- C'est une configuration infrastructure, pas une limitation de plan

**Action requise** : Ouvrir un ticket Supabase pour demander :
- Comment désactiver l'injection automatique de `*` par le gateway
- Comment permettre des origines spécifiques pour les requêtes avec credentials

---

## Vérification

Pour confirmer que ce n'est pas lié au plan :
1. Vérifier dans le Dashboard Supabase → Settings → Billing quel plan est actif
2. Si c'est le plan gratuit, tester avec un plan payant (mais je pense que le problème persistera)
3. Ouvrir un ticket Supabase avec la preuve que le gateway ajoute `*` même en 503

**Mon avis** : Ce n'est **probablement pas** lié au plan gratuit, mais plutôt à une configuration par défaut du gateway Supabase qui devrait être configurable.
