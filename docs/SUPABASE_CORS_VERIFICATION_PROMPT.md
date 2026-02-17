# Supabase Agent: CORS Configuration Verification Prompt

## Context
We're experiencing CORS errors with our Edge Functions, specifically with the `card-gate` function. The error indicates that preflight OPTIONS requests are returning `Access-Control-Allow-Origin: *` (wildcard), which conflicts with `credentials: 'include'` mode.

## Error Details
```
Access to fetch at 'https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh' 
from origin 'https://www.xn--arch-paris-e7a.com' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
The value of the 'Access-Control-Allow-Origin' header in the response must not be 
the wildcard '*' when the request's credentials mode is 'include'.
```

## What We Need Verified

### 1. Edge Function CORS Configuration
- **Function**: `card-gate`
- **Project ID**: `qvyrpzgxsppkwfvqvgcn`
- **Expected behavior**: 
  - OPTIONS preflight requests should return `Access-Control-Allow-Origin: https://www.xn--arch-paris-e7a.com` (specific origin, NOT `*`)
  - All requests should include `Access-Control-Allow-Credentials: true`
  - No wildcard `*` should ever be returned when credentials are included

### 2. Allowed Origins
Our code explicitly allows these origins:
- `https://arche-paris.com`
- `https://www.arche-paris.com`
- `https://xn--arch-paris-e7a.com`
- `https://www.xn--arch-paris-e7a.com` ← **This is the one failing**
- `http://localhost:5173`, `http://localhost:3000`, `http://127.0.0.1:*` (dev)
- `*.vercel.app` (deployments)
- `*.netlify.app` (deployments)

### 3. Project-Level CORS Settings
Please check:
- Are there any project-level CORS policies configured in the Supabase Dashboard?
- Are there any default CORS headers being added by Supabase infrastructure?
- Is there a way to disable automatic CORS header injection?

### 4. Edge Function Configuration
- **Function**: `card-gate`
- **Entrypoint**: `supabase/functions/card-gate/index.tsx`
- **verify_jwt**: `false` (configured in `supabase/config.toml`)
- **Current implementation**: We handle CORS explicitly in `Deno.serve()` wrapper

### 5. What We've Already Implemented
Our code in `card-gate/index.tsx`:
- Handles OPTIONS requests first, before Hono middleware
- Creates new Headers object (doesn't copy existing CORS headers)
- Only sets `Access-Control-Allow-Origin` when origin is explicitly allowed
- Never sets wildcard `*`
- Sets `Access-Control-Allow-Credentials: true`

## Questions for Supabase Agent

1. **Is Supabase infrastructure adding default CORS headers?**
   - If yes, how can we disable/override them?
   - Are there project-level CORS settings we need to configure?

2. **Are there any Edge Function CORS settings in the Dashboard?**
   - Can we configure CORS per-function?
   - Are there any global CORS policies?

3. **Why might OPTIONS requests still return wildcard `*`?**
   - Is there a layer between our code and the response that adds headers?
   - Should we use a different approach to handle CORS?

4. **Verification Steps**
   - Can you test an OPTIONS request to `/functions/v1/card-gate/refresh`?
   - What headers are actually being returned?
   - Is our code's CORS handling being overridden?

5. **Recommended Solution**
   - What's the best practice for handling CORS with credentials in Supabase Edge Functions?
   - Should we configure CORS differently?

## Expected Response Format

Please provide:
1. ✅/❌ Status for each verification point
2. Any project-level CORS settings found
3. Actual headers returned from OPTIONS request (if testable)
4. Recommended configuration changes (if any)
5. Confirmation that our code-level CORS handling should work, or explanation of why it might not

## Additional Context

- **Function URL**: `https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate`
- **Endpoints affected**: `/pair`, `/refresh`, `/validate`
- **Request mode**: `credentials: 'include'` (cookies required)
- **Browser**: Modern browsers enforcing strict CORS with credentials

---

**Please verify all CORS-related configurations and confirm if everything is properly set up under our scope, or if there are any Supabase-level settings we need to adjust.**
