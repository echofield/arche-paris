# Place Scan — CORS for Edge Functions (verified)

In-project runbook from Supabase docs. Use this when debugging CORS for `place-scan` or other Edge Functions.

---

## Verified behavior (Supabase)

- **OPTIONS is forwarded** to your Edge Function. Supabase does not block or auto-handle CORS for Functions; you must handle preflight in your function code.
- **No project-level CORS** for Edge Functions in the dashboard. Dashboard/API CORS settings apply to REST/PostgREST only. CORS for Functions is in-code only.
- **Preflight must return 2xx** (200 or 204) with CORS headers. Avoid 3xx/4xx/5xx on OPTIONS.
- **Allow-Headers** must include every header the client sends (e.g. `authorization`, `content-type`, `x-arche-card-code`). We use lowercase in the list; browsers accept it.
- **Wildcard `*`** for `Access-Control-Allow-Origin` is fine unless you use credentials mode `include`; then use the exact origin.

---

## What this project does

- **`supabase/functions/_shared/cors.ts`** — Exports `corsHeaders` with:
  - `Access-Control-Allow-Origin`: from env `CORS_ORIGIN` or `*`
  - `Access-Control-Allow-Headers`: `authorization, x-client-info, apikey, content-type, x-arche-card-code`
  - `Access-Control-Allow-Methods`: `POST, GET, OPTIONS`
  - `Access-Control-Max-Age`: `86400`
- **`place-scan/index.ts`** — First line of handler: if `req.method === "OPTIONS"` return `new Response("ok", { status: 200, headers: corsHeaders })`. All other responses (POST 200/400/401/405) also include `...corsHeaders`.

Optional: In Supabase Dashboard → Project Settings → Edge Functions → Secrets, set `CORS_ORIGIN=https://www.xn--arch-paris-e7a.com` to lock the allowed origin in production.

---

## Deploy and test

1. **Redeploy so latest CORS is live**
   ```bash
   supabase functions deploy place-scan
   ```

2. **Test preflight from shell** (replace `YOUR_PROJECT_REF` with your Supabase project ref)
   ```bash
   curl -i -X OPTIONS "https://YOUR_PROJECT_REF.supabase.co/functions/v1/place-scan" \
     -H "Origin: https://www.xn--arch-paris-e7a.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: authorization,content-type,x-arche-card-code"
   ```
   Expect: **HTTP/2 200** and response headers including:
   - `access-control-allow-origin: *` (or your origin if `CORS_ORIGIN` is set)
   - `access-control-allow-headers: authorization, x-client-info, apikey, content-type, x-arche-card-code`
   - `access-control-allow-methods: POST, GET, OPTIONS`

3. **If the browser still says “doesn’t have HTTP ok status”**
   - In Supabase Dashboard: **Edge Functions → place-scan → Logs / Invocations**, confirm the OPTIONS request is logged and check its response status and headers.
   - Ensure no proxy/CDN in front of the app is stripping or changing the preflight response.

---

## Optional: use official Supabase CORS helper

From Supabase JS v2.95.0 you can import:

```ts
import { corsHeaders as baseCors } from "npm:@supabase/supabase-js@2.95.0/cors";
const corsHeaders = {
  ...baseCors,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-arche-card-code",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
```

This project keeps `_shared/cors.ts` so all functions share one definition and we can override with `CORS_ORIGIN` without depending on supabase-js in the function runtime.

