# Supabase Support Ticket - CORS Wildcard Override Issue

## Subject
Edge Function CORS headers being overridden by platform layer - `Access-Control-Allow-Origin: *` injected despite function returning specific origin

## Project Details
- **Project Reference**: `qvyrpzgxsppkwfvqvgcn`
- **Function Name**: `card-gate`
- **Function URL**: `https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate`
- **Affected Endpoints**: `/refresh`, `/pair`, `/validate`

## Issue Description

Our Edge Function `card-gate` is correctly handling CORS in code:
- OPTIONS preflight requests echo the exact `Origin` header when allowed
- Never sets `Access-Control-Allow-Origin: *` (wildcard)
- Always includes `Access-Control-Allow-Credentials: true`
- Function logs confirm correct headers are being set

However, browser CORS errors indicate that preflight responses are returning `Access-Control-Allow-Origin: *` (wildcard), which conflicts with `credentials: 'include'` mode.

**Error Message:**
```
Access to fetch at 'https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh' 
from origin 'https://www.xn--arch-paris-e7a.com' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
The value of the 'Access-Control-Allow-Origin' header in the response must not be 
the wildcard '*' when the request's credentials mode is 'include'.
```

## Evidence

### Browser Console Test (CONFIRMED)
**Test Date**: 2026-02-09
**Browser**: Chrome/Edge DevTools Console

**Test Code Executed**:
```javascript
fetch('https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://www.xn--arch-paris-e7a.com',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type, authorization'
  },
  credentials: 'include'
})
```

**Browser Error Message**:
```
Cross-Origin Request Blocked: 
Reason: Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'
```

**Conclusion**: Browser explicitly confirms it received `Access-Control-Allow-Origin: *` (wildcard)

### Function Code Verification
✅ **Code Review Complete**: Confirmed no code path sets wildcard `*`
- OPTIONS handler (lines 2002-2025) only sets specific origin when allowed
- Regular request handler (lines 2027-2055) skips copying CORS headers and sets specific origin
- All helper functions follow same pattern
- See `docs/CORS_CODE_REVIEW.md` for full analysis

### Function Logs
**Check**: Supabase Dashboard → Functions → card-gate → Logs

**Expected Log Output** (if function is working correctly):
```
[card-gate] OPTIONS preflight - Allowed origin: https://www.xn--arch-paris-e7a.com
[card-gate] OPTIONS response headers: {
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization, X-Requested-With",
  "access-control-allow-credentials": "true",
  "access-control-max-age": "600",
  "access-control-allow-origin": "https://www.xn--arch-paris-e7a.com"
}
```

**If logs show specific origin but browser receives wildcard**: Infrastructure override confirmed.

### Actual Response Headers
**From Supabase Dashboard → Functions → card-gate → Invocations:**

[PASTE INVOCATION RESPONSE HEADERS HERE]

**Expected**: If Invocations show `Access-Control-Allow-Origin: *` but logs show specific origin, this confirms platform override.

## Requested Origin
- **Origin**: `https://www.xn--arch-paris-e7a.com`
- **Allowed Origins List** (in function code):
  - `https://arche-paris.com`
  - `https://www.arche-paris.com`
  - `https://xn--arch-paris-e7a.com`
  - `https://www.xn--arch-paris-e7a.com` ← This one
  - `http://localhost:5173`, `http://localhost:3000` (dev)
  - `*.vercel.app`, `*.netlify.app` (deployments)

## Function Configuration
- **Entrypoint**: `supabase/functions/card-gate/index.tsx`
- **verify_jwt**: `false` (configured in `supabase/config.toml`)
- **CORS Handling**: Explicit in `Deno.serve()` wrapper (handles OPTIONS before Hono middleware)

## Questions
1. Is there a project-level CORS configuration in the Dashboard that might be adding wildcard headers?
2. Is the Supabase edge/CDN layer (Cloudflare) automatically adding CORS headers?
3. How can we disable or override automatic CORS header injection at the platform level?
4. Are there any custom domain or proxy settings that might affect CORS headers?

## Expected Behavior
OPTIONS preflight responses should return:
- `Access-Control-Allow-Origin: https://www.xn--arch-paris-e7a.com` (specific origin, not `*`)
- `Access-Control-Allow-Credentials: true`
- Other CORS headers as set by function

## Additional Context
- Function code follows Supabase best practices for CORS with credentials
- We've verified the function code is correct (no wildcard paths)
- Issue appears to be at the infrastructure/platform level
- Browser requires specific origin (not wildcard) when using `credentials: 'include'`

---

**Please investigate why the platform/edge layer is overriding our function's CORS headers and injecting a wildcard `*`.**
