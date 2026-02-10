# Card Gate Proxy — Test plan after deploy

Use this after deploying to Vercel to confirm CORS is correct and the proxy works.

---

## 1. OPTIONS (preflight) — CORS must not be `*`

Replace `YOUR_VERCEL_DOMAIN` with your production domain (e.g. `www.xn--arch-paris-e7a.com`).

```bash
curl -v -X OPTIONS "https://YOUR_VERCEL_DOMAIN/api/card-gate/refresh" \
  -H "Origin: https://www.xn--arch-paris-e7a.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type, authorization"
```

**Check:**

- Status should be **204**.
- Response headers must include:
  - `Access-Control-Allow-Origin: https://www.xn--arch-paris-e7a.com` (exact origin, **not** `*`).
  - `Access-Control-Allow-Credentials: true`.
  - `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` as expected.

**Fail:** If you see `Access-Control-Allow-Origin: *` → the request is not going through the proxy (e.g. still hitting Supabase or a wrong route).

---

## 2. POST /api/card-gate/refresh (no cookie) — proxy forwards to Supabase

```bash
curl -v -X POST "https://YOUR_VERCEL_DOMAIN/api/card-gate/refresh" \
  -H "Origin: https://www.xn--arch-paris-e7a.com" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d "{}"
```

**Check:**

- Response goes to your domain (in the `curl` output, the request URL is `.../api/card-gate/refresh`).
- Status is typically **401** or **400** (no valid refresh cookie), which is expected.
- Response headers again must have `Access-Control-Allow-Origin: https://www.xn--arch-paris-e7a.com`, **not** `*`.

---

## 3. Browser — full flow (activation / login)

1. Open **https://www.xn--arch-paris-e7a.com** (no `?dev=true`).
2. Enter a card code (e.g. test card), activate or login.
3. Open DevTools → **Network**.
4. Filter by `card-gate` or `api`.

**Check:**

- Requests go to **https://www.xn--arch-paris-e7a.com/api/card-gate/...** (e.g. `/api/card-gate/pair`, `/api/card-gate/refresh`), **not** to `*.supabase.co`.
- No CORS errors in the console.
- After pair/login, a **Set-Cookie** on the response from your domain (e.g. `arche_refresh=...`) and subsequent requests send that cookie.

---

## 4. If you still see ACAO: * or CORS errors

- Confirm in Network tab that the failing request URL is **your domain** `/api/card-gate/...`. If it’s still `*.supabase.co`, the frontend is not using the proxy in production (e.g. build not prod or env issue).
- Confirm **vercel.json** rewrite: source should be `/((?!api/card-gate).*)` so `/api/card-gate` and `/api/card-gate/*` are **not** rewritten to `index.html`.
- Re-check Vercel env vars for the serverless function: `SUPABASE_PROJECT_ID`, `SUPABASE_ANON_KEY` (or fallbacks).

---

## 5. Support ticket text (if Supabase is still in the path and you need to report)

If you’ve confirmed the browser is calling **your** proxy and you still see `Access-Control-Allow-Origin: *` on the **proxy** response (not Supabase), then something is wrong on our side. If instead the browser is still calling Supabase and you’re just documenting the issue for Supabase:

---

**Subject:** Edge Functions CORS: gateway injects `Access-Control-Allow-Origin: *` and blocks `credentials: 'include'`

**Body:**

We use Edge Functions with a custom domain frontend. The frontend sends requests with `credentials: 'include'` (cookies). The browser requires a specific `Access-Control-Allow-Origin` value (our origin), not the wildcard `*`.

We observe that OPTIONS and POST responses from the Edge Function endpoint return `Access-Control-Allow-Origin: *` in the response headers. Our function code never sets `*`; we set the request’s `Origin` when it is allowlisted. This suggests the Supabase gateway/CDN is overwriting or injecting the `*` header.

Can you confirm whether the gateway injects CORS headers for Edge Functions, and if so, whether it’s possible to disable that or to have it respect the origin we send so that credentialed requests from our domain are allowed?

We have worked around this by proxying Edge Function calls through our own backend so that the browser only talks to our domain (same origin). We’re reporting this for other users who need credentialed requests to Edge Functions from a custom domain.

---

## 6. Vercel environment variables (reference)

In Vercel → Project → Settings → Environment Variables, ensure at least one of:

| Name | Used by | Note |
|------|--------|------|
| `SUPABASE_PROJECT_ID` | Proxy | Project ref (e.g. `qvyrpzgxsppkwfvqvgcn`) |
| `SUPABASE_ANON_KEY` | Proxy | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Build + proxy fallback | Same value, for front build and proxy fallback |
| `VITE_SUPABASE_ANON_KEY` | Build + proxy fallback | Same value, for front build and proxy fallback |

The proxy uses `SUPABASE_*` first, then falls back to `VITE_*`.
