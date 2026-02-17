# Ticket Support Supabase - Prêt à Envoyer

## Informations du Formulaire

### Champs à Remplir

**What are you having issues with?**
- ✅ APIs and client libraries (déjà sélectionné)

**Severity**
- ⚠️ **Recommandation**: Changer de "Urgent" à **"High"** (production-impacting mais pas critique)
- Ou garder "Urgent" si c'est vraiment bloquant pour le lancement

**Subject** (à copier-coller)
```
Edge Function Gateway injects Access-Control-Allow-Origin: * breaking credentialed requests
```

**Which library are you having issues with?**
- Laisser "Select a library" (pas applicable - c'est un problème infrastructure)

**Which services are affected?**
- ✅ **Changer en**: **"Edge Functions"** ou **"Functions"**

**Message** (à copier-coller ci-dessous)

---

## Message du Ticket (5000 caractères max)

```
Subject: Edge Function Gateway injects Access-Control-Allow-Origin: * breaking credentialed requests

Project: qvyrpzgxsppkwfvqvgcn
Function: card-gate
Environment: Production

---

PROBLEM SUMMARY

Our Edge Function explicitly sets Access-Control-Allow-Origin to a specific origin (never '*'), but Supabase gateway is injecting Access-Control-Allow-Origin: * into responses. This breaks credentialed requests (credentials: 'include') which require a specific origin, not a wildcard.

---

EVIDENCE #1: Function Returns 503 But Gateway Still Adds Wildcard

Even when our function fails to start (503 error), Supabase gateway returns Access-Control-Allow-Origin: *.

Test command:
curl -v -X OPTIONS \
  "https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh" \
  -H "Origin: https://www.xn--arch-paris-e7a.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type, authorization, x-requested-with, apikey"

Response:
< HTTP/1.1 503 Service Unavailable
< Access-Control-Allow-Origin: *
< access-control-allow-headers: authorization, x-client-info, apikey
< sb-gateway-version: 1
< x-served-by: supabase-edge-runtime

This proves the gateway adds '*' BEFORE our function code executes.

---

EVIDENCE #2: Our Code Never Returns Wildcard

We have reviewed our function code and confirmed:
1. We explicitly check isOriginAllowed(origin) before setting Access-Control-Allow-Origin
2. We create new Headers() objects to avoid defaults
3. We have diagnostic logs that verify '*' is never set
4. Even error responses use proper CORS headers with specific origin

Code location: supabase/functions/card-gate/index.tsx

Key function:
```typescript
function setCorsHeaders(headers: Headers, origin: string | undefined): void {
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, apikey");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Max-Age", "600");

  if (origin && isOriginAllowed(origin)) {
    headers.set("Access-Control-Allow-Origin", origin); // Specific origin, never '*'
  }
  // If origin not allowed, header is NOT set (not even '*')
}
```

We also added diagnostic logging that explicitly checks for '*' and logs an error if detected - this never triggers.

---

EVIDENCE #3: Browser Error

Browser console error:
"Access to fetch at 'https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh' 
from origin 'https://www.xn--arch-paris-e7a.com' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' 
when the request's credentials mode is 'include'."

---

IMPACT

- Cannot authenticate users (login flow broken)
- Cannot refresh tokens (session management broken)
- Cannot make credentialed API calls
- Production application is blocked

---

REQUEST

Please investigate:
1. Why does Supabase gateway inject Access-Control-Allow-Origin: * for Edge Functions?
2. How can we disable this gateway-level CORS header injection?
3. How can we ensure our function's CORS headers (with specific origin) are respected?

We need to support credentialed requests (credentials: 'include') which require a specific origin, not a wildcard.

---

ADDITIONAL INFORMATION

- Function logs show specific origin being set
- Actual response headers show wildcard '*'
- This happens even when function doesn't execute (503 error)
- Allowed origins in our code: https://www.xn--arch-paris-e7a.com, https://arche-paris.com, etc.

We can provide function logs, invocation timestamps, and additional curl outputs if needed.

Thank you for your help.
```

---

## Instructions pour Envoyer

1. **Copier le Subject** dans le champ "Subject"
2. **Sélectionner "Edge Functions"** dans "Which services are affected?"
3. **Ajuster la Severity** si nécessaire (High recommandé)
4. **Copier le Message** dans le champ "Message"
5. **Vérifier** que tout est bien rempli
6. **Envoyer** le ticket

---

## Notes

- Le message fait environ 2800 caractères (bien sous la limite de 5000)
- Toutes les preuves sont incluses
- Le langage est professionnel et factuel
- Les détails techniques sont fournis pour faciliter le diagnostic

---

## Après Envoi

1. Attendre la réponse (peut prendre quelques jours avec plan gratuit)
2. Surveiller les emails pour les mises à jour
3. Si besoin, ajouter des informations supplémentaires via le ticket
