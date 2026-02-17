# Prompt Complet pour Claude - Analyse CORS

## Contexte

Nous avons un problème CORS persistant avec nos Supabase Edge Functions. Le navigateur reçoit `Access-Control-Allow-Origin: *` (wildcard) alors que notre code ne devrait jamais retourner cela. Nous utilisons `credentials: 'include'` côté client, ce qui nécessite une origine spécifique (pas de wildcard).

**Question critique**: Est-ce que notre code pourrait être la cause, ou est-ce vraiment Supabase qui override nos headers ?

---

## Erreur Browser

```
Access to fetch at 'https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh' 
from origin 'https://www.xn--arch-paris-e7a.com' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' 
when the request's credentials mode is 'include'.
```

**Important**: Le navigateur voit `Access-Control-Allow-Origin: *` dans la réponse OPTIONS preflight, mais notre code ne devrait jamais retourner cela.

---

## Code Edge Function: card-gate/index.tsx

```typescript
// Allowed origins
const ALLOWED_ORIGINS = [
  "https://arche-paris.com",
  "https://www.arche-paris.com",
  "https://xn--arch-paris-e7a.com",
  "https://www.xn--arch-paris-e7a.com",
];

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin === "http://localhost:5173" || origin === "http://localhost:3000" || origin.startsWith("http://127.0.0.1:")) return true;
  if (origin.endsWith(".vercel.app") && (origin.startsWith("https://") || origin.startsWith("http://"))) return true;
  if (origin.endsWith(".netlify.app") && (origin.startsWith("https://") || origin.startsWith("http://"))) return true;
  return false;
}

// Deno.serve wrapper - handles OPTIONS explicitly
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") ?? undefined;
  
  // Handle preflight OPTIONS requests FIRST - before Hono can interfere
  if (req.method === "OPTIONS") {
    // Create headers object - explicitly avoid any wildcard
    const headers = new Headers();
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Max-Age", "600");
    
    // CRITICAL: Echo the exact origin if allowed (NEVER '*')
    if (origin && isOriginAllowed(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
      console.log("[card-gate] OPTIONS preflight - Allowed origin:", origin);
      console.log("[card-gate] OPTIONS response headers:", Object.fromEntries(headers));
    } else {
      console.log("[card-gate] OPTIONS preflight - Origin not allowed:", origin);
      // Do NOT set Access-Control-Allow-Origin if origin not allowed
    }
    
    return new Response(null, { 
      status: 204, 
      headers: headers,
    });
  }
  
  // Handle actual requests
  const res = await app.fetch(req);
  
  // Create completely new Headers object to avoid any defaults
  const nh = new Headers();
  
  // Copy all non-CORS headers from response
  res.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    // Skip any existing CORS headers - we'll set our own
    if (!lowerKey.startsWith("access-control-")) {
      nh.set(key, value);
    }
  });
  
  // Set proper CORS headers explicitly
  nh.set("Access-Control-Allow-Credentials", "true");
  nh.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  nh.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  
  // Echo the exact origin if allowed (never '*')
  if (origin && isOriginAllowed(origin)) {
    nh.set("Access-Control-Allow-Origin", origin);
    console.log("[card-gate] Request response - Allowed origin:", origin);
  } else {
    console.log("[card-gate] Request response - Origin not allowed:", origin);
    // Do NOT set Access-Control-Allow-Origin if origin not allowed
  }
  
  return new Response(res.body, { 
    status: res.status, 
    statusText: res.statusText, 
    headers: nh 
  });
});
```

**Note**: Nous avons aussi des middlewares Hono qui pourraient interférer:

```typescript
app.use("*", async (c, next) => {
  console.log("[card-gate]", c.req.method, c.req.path, "Origin:", c.req.header("Origin") ?? "(none)");
  await next();
  const origin = c.req.header("Origin");
  if (origin && isOriginAllowed(origin)) {
    const res = c.res;
    const nh = new Headers(res.headers);
    nh.set("Access-Control-Allow-Origin", origin);
    nh.set("Access-Control-Allow-Credentials", "true");
    nh.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    nh.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    c.res = new Response(res.body, { status: res.status, statusText: res.statusText, headers: nh });
  }
});
```

---

## Code Edge Function: make-server-9060b10a/index.tsx

```typescript
const app = new Hono().basePath("/make-server-9060b10a");

const ALLOWED_ORIGINS = [
  "https://arche-paris.com",
  "https://www.arche-paris.com",
  "https://xn--arch-paris-e7a.com",
  "https://www.xn--arch-paris-e7a.com",
];

function isOriginAllowed(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin === "http://localhost:5173" || origin === "http://localhost:3000" || origin.startsWith("http://127.0.0.1:")) return true;
  if (origin.endsWith(".vercel.app")) return true;
  if (origin.startsWith("https://")) return true; // Mobile / autres déploiements
  return false;
}

// CORS middleware: explicitly set origin (never '*') to avoid conflicts
app.use("*", cors({
  origin: (o) => (o && isOriginAllowed(o) ? o : null),
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: false, // This endpoint doesn't use cookies
}));

// Wrap to ensure CORS headers are always explicit (never '*')
Deno.serve(async (req: Request) => {
  const res = await app.fetch(req);
  const origin = req.headers.get("Origin");
  const nh = new Headers(res.headers);
  
  // Remove any wildcard that might have been set
  nh.delete("Access-Control-Allow-Origin");
  
  // Only set specific origin if allowed (never '*')
  if (origin && isOriginAllowed(origin)) {
    nh.set("Access-Control-Allow-Origin", origin);
  }
  
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: nh });
});
```

---

## Code Client: card-gate-client.ts

```typescript
const CARD_GATE_BASE = (() => {
  const projectId = import.meta.env?.VITE_SUPABASE_PROJECT_ID ?? '';
  return projectId ? `https://${projectId}.supabase.co/functions/v1/card-gate` : '';
})();

const ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? '';

// Example fetch call:
async function refreshToken(cardId: string): Promise<{ access_token: string; expires_at: string; card_id: string }> {
  const url = `${CARD_GATE_BASE}/refresh`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
    },
    credentials: "include", // CRITICAL: This requires specific origin, not '*'
  });
  
  if (!res.ok) {
    throw new Error(`Refresh failed: ${res.status}`);
  }
  
  return await res.json();
}
```

---

## Observations

1. **Notre code ne devrait jamais retourner `*`**: 
   - Nous vérifions explicitement `isOriginAllowed(origin)` avant de setter `Access-Control-Allow-Origin`
   - Nous créons de nouveaux objets `Headers()` pour éviter les defaults
   - Nous supprimons explicitement les headers CORS existants avant de les re-setter

2. **Le navigateur voit quand même `*`**:
   - Erreur CORS indique clairement que la réponse OPTIONS contient `Access-Control-Allow-Origin: *`
   - Nos logs dans Supabase Dashboard ne montrent pas de wildcard dans nos headers

3. **Possibilités**:
   - Supabase infrastructure ajoute `*` par-dessus nos headers
   - Hono middleware ajoute `*` quelque part (mais nous avons vérifié)
   - Un autre middleware ou proxy ajoute `*`
   - Notre logique `isOriginAllowed` ne reconnaît pas l'origine (mais `www.xn--arch-paris-e7a.com` est dans la liste)

---

## Questions pour Claude

1. **Est-ce que notre code pourrait retourner `*` ?**
   - Y a-t-il un chemin dans notre code où `Access-Control-Allow-Origin: *` pourrait être set ?
   - Les middlewares Hono pourraient-ils ajouter `*` même si nous le supprimons après ?
   - Y a-t-il un problème avec notre logique `isOriginAllowed` ?

2. **Y a-t-il un problème avec notre approche ?**
   - Est-ce que gérer OPTIONS dans `Deno.serve` AVANT Hono est correct ?
   - Est-ce que créer de nouveaux `Headers()` est suffisant pour éviter les defaults ?
   - Y a-t-il un conflit entre nos middlewares Hono et notre wrapper `Deno.serve` ?

3. **Suggestions de fix si c'est notre code**:
   - Comment garantir à 100% qu'on ne retourne jamais `*` ?
   - Y a-t-il une meilleure approche pour gérer CORS avec Hono + Deno.serve ?
   - Devrions-nous supprimer complètement les middlewares Hono et tout gérer dans `Deno.serve` ?

4. **Si ce n'est PAS notre code**:
   - Comment prouver que c'est Supabase qui override ?
   - Y a-t-il une configuration Supabase que nous devrions vérifier ?
   - Devrions-nous ouvrir un ticket Supabase avec ces preuves ?

---

## Informations Supplémentaires

- **Supabase Project ID**: `qvyrpzgxsppkwfvqvgcn`
- **Origin problématique**: `https://www.xn--arch-paris-e7a.com` (punycode pour `www.arché-paris.com`)
- **Fonctions affectées**: `/card-gate/refresh`, `/card-gate/pair`, `/make-server-9060b10a/check-card`
- **Framework**: Hono 4.6.14 sur Deno
- **Déploiement**: Supabase Edge Functions

---

## Ce que nous avons déjà essayé

1. ✅ Supprimé `app.options()` handlers (Hono)
2. ✅ Géré OPTIONS explicitement dans `Deno.serve` wrapper
3. ✅ Créé de nouveaux objets `Headers()` pour éviter les defaults
4. ✅ Supprimé explicitement les headers CORS existants avant de les re-setter
5. ✅ Ajouté des logs pour tracer les headers retournés
6. ✅ Vérifié que `isOriginAllowed` reconnaît bien l'origine

**Résultat**: Le navigateur voit toujours `*` malgré tout cela.

---

## Conclusion

Nous suspectons fortement que Supabase infrastructure override nos headers, mais nous voulons être absolument sûrs que ce n'est pas notre code avant d'ouvrir un ticket support.

**Pouvez-vous analyser notre code et confirmer si nous pourrions être la cause, ou si c'est vraiment Supabase ?**
