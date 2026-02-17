# Debug prompt: 503 on Vercel Card Gate proxy

**Give this prompt (and optionally the files below) to Claude or another AI to debug the 503.**

---

## Context

- **Repo:** https://github.com/echofield/arche-paris (private). Main branch, latest commit has the proxy setup.
- **Stack:** Vite + React frontend, deployed on **Vercel**. Backend: Supabase (PostgreSQL + Edge Functions). We do **not** use Next.js.
- **Goal:** The frontend in production calls our own domain for Card Gate (to avoid Supabase CORS). So we added a **Vercel serverless proxy** that forwards `/api/card-gate` and `/api/card-gate/*` to Supabase Edge Function `card-gate`, then returns the response with correct CORS and cookie handling.

---

## Symptom

In production (e.g. https://www.xn--arch-paris-e7a.com), when the user tries to activate or log in with a card:

- Browser requests: `POST https://www.xn--arch-paris-e7a.com/api/card-gate/pair` and `POST .../api/card-gate/refresh`
- Both return **503 Service Unavailable** (no response body visible in the console; just "Failed to load resource: the server responded with a status of 503 ()").
- We previously had 500, then switched to a single proxy file + rewrites; now we get 503 consistently.

The frontend correctly uses `/api/card-gate` in production (no CORS error; the request reaches our domain). So the issue is between Vercel and our function: either the function is not invoked, or something in the pipeline returns 503 before our code runs.

---

## Current setup

1. **Single proxy file:** `api/card-gate-proxy.ts`
   - Exports: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` (each calls the same `handleRequest`).
   - Reads path from query param `path` (set by rewrite) or from pathname.
   - Forwards to `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/card-gate/${path}` with Authorization (anon key or from request), Cookie, and body.
   - Sets CORS headers and reflects `Set-Cookie` for our domain.
   - Env: `SUPABASE_PROJECT_ID`, `SUPABASE_ANON_KEY` (fallback: `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY`).

2. **vercel.json rewrites** (order matters):
   ```json
   "rewrites": [
     { "source": "/api/card-gate", "destination": "/api/card-gate-proxy" },
     { "source": "/api/card-gate/:path*", "destination": "/api/card-gate-proxy?path=:path*" },
     { "source": "/((?!api/).*)", "destination": "/index.html" }
   ]
   ```
   So `/api/card-gate/pair` should become `/api/card-gate-proxy?path=pair` and hit the serverless function.

3. **Vercel env vars (Production):**  
   `VITE_SUPABASE_PROJECT_ID` = `qvyrpzgxsppkwfvqvgcn`, `VITE_SUPABASE_ANON_KEY` = (set, secret).  
   No separate `SUPABASE_PROJECT_ID` / `SUPABASE_ANON_KEY`; the proxy uses the `VITE_*` fallback.

4. **Framework:** Vercel project is configured as **Vite** (`"framework": "vite"`, `outputDirectory: "dist"`). The `api/` folder is at the repo root (sibling to `src/`, `index.html`).

---

## What we need

1. **Why 503?**  
   On Vercel, 503 often means "function not found", "function failed to start", or "timeout before response". We need a clear hypothesis: e.g. rewrites not applying, function not in the build, wrong runtime, or env not available at runtime.

2. **Concrete fix**  
   - If it's rewrite syntax (e.g. `:path*` not supported or not passed as query), suggest the exact `vercel.json` and, if needed, how the proxy should read the path.
   - If it's "no serverless function for this route", suggest the exact file path and export shape Vercel expects for a **Vite** project (e.g. `api/card-gate-proxy.ts` with named exports GET/POST/etc.).
   - If it's env (e.g. `VITE_*` not exposed to serverless), suggest adding `SUPABASE_PROJECT_ID` and `SUPABASE_ANON_KEY` explicitly for Production and/or a minimal code change to log or return a safe error when env is missing.

3. **How to confirm**  
   Suggest one or two checks we can do after your fix (e.g. curl to `https://www.xn--arch-paris-e7a.com/api/card-gate-proxy?path=refresh` with POST and anon key, or a temporary `return new Response('ok')` at the top of the handler to see if the function runs at all).

---

## Files to attach (if the AI can read them)

- `api/card-gate-proxy.ts` (full file)
- `vercel.json` (full file)
- `src/utils/card-gate-client.ts` (only the part that sets `CARD_GATE_BASE` and the `pair`/refresh fetch URLs, e.g. first 30 lines and the pair/refresh calls)

---

## Repo link again

https://github.com/echofield/arche-paris

Branch: **main**. Latest commits: proxy single route + rewrites; before that, named exports for Vercel; before that, initial proxy under `api/card-gate/[...path].ts` (removed because it was returning 503).
