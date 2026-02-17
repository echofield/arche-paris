# Card Gate Proxy (CORS workaround)

## Why

Supabase's gateway returns `Access-Control-Allow-Origin: *` on Edge Function responses, which blocks the browser when the app uses `credentials: 'include'`. The proxy runs on your domain (same origin), so there is no CORS issue.

## How it works

- **Production:** The frontend calls `/api/card-gate` (same origin). The Vercel serverless function in `api/card-gate/[...path].ts` forwards the request to Supabase `card-gate`, forwards the response back, and sets CORS headers and the refresh cookie for your domain.
- **Development:** The frontend still calls Supabase directly (no proxy in local dev).

## Env vars (Vercel)

For the **proxy** (serverless function), set in Vercel → Project → Settings → Environment Variables:

| Name | Description |
|------|-------------|
| `SUPABASE_PROJECT_ID` | Same as your project ref (e.g. `qvyrpzgxsppkwfvqvgcn`) |
| `SUPABASE_ANON_KEY` | Supabase anon key |

The proxy also reads `VITE_SUPABASE_PROJECT_ID` and `VITE_SUPABASE_ANON_KEY` as fallback if the above are not set (so you can use the same vars as the frontend if you prefer).

## Files

- `api/card-gate-proxy.ts` — Single Vercel serverless function (Edge runtime: `export const config = { runtime: 'edge' }`). Rewrites in `vercel.json` send `/api/card-gate` and `/api/card-gate/*` here (path in query).
- `vercel.json` — Rewrites: `/api/card-gate` → `/api/card-gate-proxy`, `/api/card-gate/:path*` → `/api/card-gate-proxy?path=:path*`.
- `src/utils/card-gate-client.ts` — Uses `/api/card-gate` when `import.meta.env.PROD` is true.

## vercel.json

The SPA rewrite is limited so `/api/card-gate` and `/api/card-gate/*` are **not** rewritten to `index.html`:

- `"source": "/((?!api/card-gate).*)"` → only paths that do **not** start with `api/card-gate` go to the SPA.

## After deploy

1. Ensure `SUPABASE_PROJECT_ID` and `SUPABASE_ANON_KEY` (or the `VITE_*` fallbacks) are set in Vercel.
2. Open the site **without** `/demo` and try card activation/login.
3. If you still see CORS errors, check that the request goes to `/api/card-gate/...` (Network tab) and that the proxy responds with `Access-Control-Allow-Origin: https://www.xn--arch-paris-e7a.com`.

**Full test plan (curl + browser):** see [CARD_GATE_PROXY_TEST_PLAN.md](./CARD_GATE_PROXY_TEST_PLAN.md).
