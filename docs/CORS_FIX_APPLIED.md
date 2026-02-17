# CORS Fix Applied - Based on Claude's Analysis

## Date
2026-02-09

## Changes Applied

### 1. Removed Hono CORS Middleware
**Problem**: Hono's `cors()` middleware could have a fallback to `*` when origin function returns `null`.

**Solution**: Removed all Hono CORS middlewares. CORS is now handled exclusively in `Deno.serve` wrapper.

### 2. Added Global Try/Catch
**Problem**: Uncaught exceptions could cause Supabase to return its own error response with `Access-Control-Allow-Origin: *`.

**Solution**: Wrapped entire `Deno.serve` handler in try/catch to ensure all errors return proper CORS headers.

### 3. Single Source of Truth: `setCorsHeaders()`
**Problem**: Duplicate CORS logic in multiple places could lead to inconsistencies.

**Solution**: Created single `setCorsHeaders()` function that:
- Always sets specific origin (never `*`)
- Only sets `Access-Control-Allow-Origin` if origin is allowed
- Includes all required headers (`apikey` added to allowed headers)

### 4. Added Diagnostic Logging
**Problem**: Hard to prove if wildcard comes from our code or Supabase.

**Solution**: Added debug logging with UUID:
- Logs incoming request details
- Logs origin and `isOriginAllowed` result
- Logs final headers before returning
- **Explicit check**: Logs error if `*` is detected in headers

### 5. Added `apikey` to Allowed Headers
**Problem**: Client sends `apikey` header but it wasn't in allowed headers.

**Solution**: Added `apikey` to `Access-Control-Allow-Headers`.

---

## Files Modified

1. **`supabase/functions/card-gate/index.tsx`**
   - Removed Hono CORS middleware
   - Added `setCorsHeaders()` function
   - Added global try/catch
   - Added diagnostic logging
   - Kept `getCorsHeaders()` for backward compatibility with existing code

2. **`supabase/functions/make-server-9060b10a/index.tsx`**
   - Removed Hono `cors()` import and usage
   - Added `setCorsHeaders()` function
   - Added global try/catch
   - Added diagnostic logging

---

## Key Code Changes

### Before
```typescript
app.use("*", cors({
  origin: (o) => (o && isOriginAllowed(o) ? o : null),
  // Could fallback to '*' if origin returns null
}));

Deno.serve(async (req: Request) => {
  // No error handling - exceptions could cause Supabase to add '*'
  const res = await app.fetch(req);
  // ...
});
```

### After
```typescript
// No Hono CORS middleware - removed completely

function setCorsHeaders(headers: Headers, origin: string | undefined): void {
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, apikey");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Max-Age", "600");

  if (origin && isOriginAllowed(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  // Never sets '*' - if origin not allowed, header is not set at all
}

Deno.serve(async (req: Request) => {
  const debugId = crypto.randomUUID().slice(0, 8);
  console.log(`[DEBUG-${debugId}] Incoming request: ${req.method} ${req.url}`);
  
  try {
    if (req.method === "OPTIONS") {
      const headers = new Headers();
      setCorsHeaders(headers, origin);
      
      // Verify no wildcard
      const acao = headers.get("Access-Control-Allow-Origin");
      if (acao === "*") {
        console.error(`[DEBUG-${debugId}] BUG DETECTED: '*' was set somehow!`);
      }
      
      return new Response(null, { status: 204, headers });
    }

    const res = await app.fetch(req);
    // ... handle response with CORS headers
    
  } catch (error) {
    // CRITICAL: Handle errors with proper CORS headers
    const errorHeaders = new Headers();
    errorHeaders.set("Content-Type", "application/json");
    setCorsHeaders(errorHeaders, origin);
    
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: errorHeaders }
    );
  }
});
```

---

## Testing

### What to Check

1. **Deploy the functions**:
   ```bash
   supabase functions deploy card-gate
   supabase functions deploy make-server-9060b10a
   ```

2. **Check logs** in Supabase Dashboard → Functions → Invocations:
   - Look for `[DEBUG-...]` entries
   - Verify `ACAO: https://www.xn--arch-paris-e7a.com` (not `*`)
   - Check if any `BUG DETECTED: '*' was set` messages appear

3. **Test in browser**:
   - Open DevTools → Network tab
   - Try to login/refresh
   - Check OPTIONS preflight response headers
   - Should see specific origin, not `*`

4. **If still seeing `*`**:
   - Check logs: if logs show specific origin but browser sees `*`, it's Supabase infrastructure
   - Open ticket with Supabase support using logs as proof

---

## Expected Behavior

### ✅ Success Case
- Logs show: `ACAO: https://www.xn--arch-paris-e7a.com`
- Browser receives: `Access-Control-Allow-Origin: https://www.xn--arch-paris-e7a.com`
- CORS works correctly

### ❌ If Still Failing
- Logs show: `ACAO: https://www.xn--arch-paris-e7a.com`
- Browser receives: `Access-Control-Allow-Origin: *`
- **Conclusion**: Supabase infrastructure is overriding headers
- **Action**: Open support ticket with logs as proof

---

## Next Steps

1. Deploy the updated functions
2. Test and check logs
3. If problem persists, use logs to prove it's Supabase infrastructure
4. Open support ticket with evidence

---

## References

- Claude's analysis: See `docs/CLAUDE_CORS_ANALYSIS_PROMPT.md`
- Original problem: CORS error with `credentials: 'include'` requiring specific origin
- Solution: Simplified CORS handling, removed Hono middleware, added error handling
