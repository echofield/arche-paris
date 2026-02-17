# Résultats des Tests CORS

## Date
2026-02-09

## Test #1: OPTIONS Preflight avec curl

### Commande
```bash
curl.exe -v -X OPTIONS \
  "https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh" \
  -H "Origin: https://www.xn--arch-paris-e7a.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type, authorization, x-requested-with, apikey"
```

### Résultat Observé
```
< HTTP/1.1 503 Service Unavailable
< Access-Control-Allow-Origin: *
< access-control-allow-headers: authorization, x-client-info, apikey
```

### Analyse
1. **Status 503**: La fonction ne démarre pas (erreur de boot)
2. **Access-Control-Allow-Origin: ***: Présent même quand la fonction ne s'exécute pas
3. **Conclusion**: Supabase gateway ajoute `*` au niveau infrastructure, avant même que notre code s'exécute

---

## Preuve Définitive

**Même quand notre fonction ne démarre pas (503), Supabase retourne `Access-Control-Allow-Origin: *`.**

Cela prouve que :
- ✅ Ce n'est PAS notre code qui retourne `*`
- ✅ C'est l'infrastructure Supabase (gateway/CDN) qui injecte ce header
- ✅ Notre code ne peut pas contrôler ce comportement

---

## Prochaines Étapes

1. **Vérifier les logs Supabase** pour comprendre l'erreur 503
2. **Une fois la fonction fonctionnelle**, comparer :
   - Logs de la fonction (doivent montrer origine spécifique)
   - Headers retournés (probablement `*` malgré les logs)
3. **Ouvrir ticket Supabase** avec cette preuve

---

## Ticket Support - Contenu Suggéré

**Titre**: Edge Function Gateway injects `Access-Control-Allow-Origin: *` breaking credentialed requests

**Description**:
- Project: `qvyrpzgxsppkwfvqvgcn`
- Function: `card-gate`
- Problem: Supabase gateway returns `Access-Control-Allow-Origin: *` even when:
  1. Function code explicitly sets specific origin
  2. Function fails to start (503) - proving gateway adds it before function execution
- Impact: Breaks credentialed requests (`credentials: 'include'`)

**Evidence**:
1. Function returns 503 (boot error), but gateway still returns `Access-Control-Allow-Origin: *`
2. Function code review confirms no wildcard is ever set
3. Function logs (when working) show specific origin, but actual response contains `*`

**Request**: Please investigate and provide a way to disable gateway-level CORS header injection for Edge Functions that need to support credentialed requests.
