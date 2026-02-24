# Edge Function secrets — runbook

Required secrets for Supabase Edge Functions. Set via Dashboard or CLI.

---

## Per-function / global

| Secret | Used by | Purpose |
|--------|---------|---------|
| `CORS_ORIGIN` | All Edge Functions using `_shared/cors.ts` (place-scan, zone-consciousness, rituals, inscriptions, etc.) | If set, `Access-Control-Allow-Origin` is this value instead of `*`. Use your production origin (e.g. `https://www.xn--arch-paris-e7a.com`) when using credentials. |
| (Supabase defaults) | card-gate, auth flows | Project URL, anon key, service role — from project env; no extra secrets for CORS in card-gate (it builds headers from request). |

---

## How to set (CLI)

```bash
# After linking: supabase link --project-ref YOUR_REF
supabase secrets set CORS_ORIGIN=https://www.xn--arch-paris-e7a.com
```

For local dev, use `.env` or `.env.local` in the Supabase CLI context, or leave `CORS_ORIGIN` unset to allow `*`.

---

## Checklist (REPO_AUDIT)

- [ ] `CORS_ORIGIN` documented and set in production.
- [ ] No other function-specific secrets required for current deployment (add here if new ones are introduced).
