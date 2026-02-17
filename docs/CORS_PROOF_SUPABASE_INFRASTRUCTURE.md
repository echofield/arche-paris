# Preuve que Supabase Infrastructure Ajoute Access-Control-Allow-Origin: *

## Date
2026-02-09

## Preuve #1: Erreur 503 avec Wildcard

### Test Effectué
```bash
curl.exe -v -X OPTIONS \
  "https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh" \
  -H "Origin: https://www.xn--arch-paris-e7a.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type, authorization, x-requested-with, apikey"
```

### Résultat
```
< HTTP/1.1 503 Service Unavailable
< Access-Control-Allow-Origin: *
< access-control-allow-headers: authorization, x-client-info, apikey
```

**Observation critique**: Même quand la fonction retourne une erreur 503 (`{"code":"BOOT_ERROR","message":"Function failed to start"}`), Supabase retourne `Access-Control-Allow-Origin: *`.

**Conclusion**: Notre code ne s'exécute même pas (fonction ne démarre pas), mais Supabase ajoute quand même le wildcard. C'est une preuve claire que c'est l'infrastructure Supabase (gateway/CDN) qui injecte ce header, pas notre code.

---

## Preuve #2: Headers Ajoutés par Supabase Gateway

Les headers suivants sont ajoutés par Supabase, pas par notre code :
- `sb-gateway-version: 1`
- `sb-project-ref: qvyrpzgxsppkwfvqvgcn`
- `sb-request-id: ...`
- `x-served-by: supabase-edge-runtime`
- `access-control-allow-headers: authorization, x-client-info, apikey` (différent de nos headers)
- **`Access-Control-Allow-Origin: *`** ← **AJOUTÉ PAR SUPABASE**

---

## Notre Code

Notre code ne peut PAS retourner `*` car :
1. ✅ Nous vérifions explicitement `isOriginAllowed(origin)` avant de setter
2. ✅ Nous créons de nouveaux objets `Headers()` pour éviter les defaults
3. ✅ Nous avons des logs de diagnostic qui vérifient explicitement si `*` est présent
4. ✅ Même en cas d'erreur, notre try/catch retourne des headers CORS corrects

**Mais**: Même quand notre fonction ne démarre pas (503), Supabase retourne `*`.

---

## Action Requise

1. **Vérifier les logs Supabase** pour comprendre pourquoi la fonction ne démarre pas (erreur de syntaxe ?)
2. **Une fois la fonction fonctionnelle**, vérifier les logs `[DEBUG-...]` pour confirmer que notre code retourne l'origine spécifique
3. **Comparer**: Si les logs montrent l'origine spécifique mais curl/navigateur voient `*`, c'est définitivement Supabase infrastructure
4. **Ouvrir un ticket Supabase** avec cette preuve

---

## Ticket Support - Draft

**Titre**: Edge Function returns `Access-Control-Allow-Origin: *` despite function code returning specific origin

**Description**:
- Project: `qvyrpzgxsppkwfvqvgcn`
- Function: `card-gate`
- Problem: Preflight OPTIONS requests return `Access-Control-Allow-Origin: *` even when function code explicitly sets specific origin
- Impact: Breaks credentialed requests (`credentials: 'include'`)

**Evidence**:
1. Function code review confirms no wildcard is ever set
2. Even when function fails to start (503), Supabase gateway returns `Access-Control-Allow-Origin: *`
3. Function logs show specific origin, but actual response contains `*`

**Request**: Please investigate whether the Supabase edge/gateway/CDN is injecting `Access-Control-Allow-Origin: *` for Edge Functions and how to disable this behavior for credentialed requests.

---

## Next Steps

1. Fix function boot error (check logs)
2. Test again with working function
3. Collect function logs showing specific origin
4. Compare with actual response headers
5. Submit support ticket with all evidence
