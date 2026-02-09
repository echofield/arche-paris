# Supabase Support Ticket - Ready to Send

## Copy this entire message to Supabase Support

---

**Subject**: Edge Function CORS headers overridden - `Access-Control-Allow-Origin: *` injected despite function returning specific origin

**Project Reference**: `qvyrpzgxsppkwfvqvgcn`
**Function Name**: `card-gate`
**Function URL**: `https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate`

---

## Issue Summary

Our Edge Function `card-gate` correctly handles CORS in code (echoes specific origin, never sets wildcard), but browsers are receiving `Access-Control-Allow-Origin: *` (wildcard) in preflight OPTIONS responses. This conflicts with `credentials: 'include'` mode and causes CORS errors.

**Browser Error**:
```
Cross-Origin Request Blocked: 
Reason: Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'
```

---

## Evidence

### 1. Browser Console Test (CONFIRMED)
**Test**: OPTIONS preflight to `/card-gate/refresh`
**Origin sent**: `https://www.xn--arch-paris-e7a.com`
**Browser received**: `Access-Control-Allow-Origin: *` (wildcard)

**Browser explicitly states**: "Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'"

### 2. Function Code Verification
✅ **Code Review**: Confirmed NO code path sets wildcard `*`
- OPTIONS handler (lines 2002-2025) only sets specific origin when `isOriginAllowed()` returns true
- Regular request handler (lines 2027-2055) explicitly skips copying CORS headers and sets specific origin
- All helper functions follow same pattern
- Function includes logging: `console.log('[card-gate] OPTIONS preflight - Allowed origin:', origin)`

**Code snippet** (OPTIONS handler):
```typescript
if (req.method === "OPTIONS") {
  const headers = new Headers();
  // ... set other headers ...
  if (origin && isOriginAllowed(origin)) {
    headers.set("Access-Control-Allow-Origin", origin); // Specific origin, never '*'
  }
  return new Response(null, { status: 204, headers });
}
```

### 3. Function Logs (Please Check)
**Location**: Dashboard → Functions → card-gate → Logs

**Expected log output** (if function is working correctly):
```
[card-gate] OPTIONS preflight - Allowed origin: https://www.xn--arch-paris-e7a.com
[card-gate] OPTIONS response headers: {
  "access-control-allow-origin": "https://www.xn--arch-paris-e7a.com",
  "access-control-allow-credentials": "true",
  ...
}
```

**If logs show specific origin but browser receives wildcard**: Infrastructure override confirmed.

### 4. Invocation Response Headers (Please Check)
**Location**: Dashboard → Functions → card-gate → Invocations

**Please check**: Response headers for recent OPTIONS request
- If Invocations show `Access-Control-Allow-Origin: *` but logs show specific origin → Platform override confirmed

---

## Requested Origin
- **Origin**: `https://www.xn--arch-paris-e7a.com`
- **Allowed in function code**: ✅ Yes (in `ALLOWED_ORIGINS` array)

---

## Questions

1. Is there a project-level CORS configuration that might be adding wildcard headers?
2. Is the Supabase edge/CDN layer (Cloudflare) automatically adding CORS headers?
3. How can we disable or override automatic CORS header injection at the platform level?
4. Are there any custom domain or proxy settings that might affect CORS headers?

---

## Expected Behavior

OPTIONS preflight responses should return:
- `Access-Control-Allow-Origin: https://www.xn--arch-paris-e7a.com` (specific origin, NOT `*`)
- `Access-Control-Allow-Credentials: true`
- Other CORS headers as set by function

---

## Additional Context

- Function follows Supabase best practices for CORS with credentials
- We've verified the function code is correct (no wildcard paths)
- Issue appears to be at the infrastructure/platform level
- Browser requires specific origin (not wildcard) when using `credentials: 'include'`
- Function includes comprehensive logging to verify behavior

**Please investigate why the platform/edge layer is overriding our function's CORS headers and injecting a wildcard `*`.**

---

## Next Steps

1. Check function logs in Dashboard → Functions → card-gate → Logs
2. Check Invocations → Response headers for OPTIONS request
3. Compare: Function logs vs Invocation headers vs Browser received headers
4. If mismatch confirmed → Send this ticket to Supabase support

---

**Ready to send once you add:**
- [ ] Function logs (from Dashboard)
- [ ] Invocation response headers (from Dashboard)
- [ ] Invocation timestamp
