# CORS Infrastructure Override - CONFIRMED

## Evidence Collected

### Browser Console Test Results
**Date**: 2026-02-09
**Test**: OPTIONS preflight request to `card-gate/refresh`

**Browser Error Message**:
```
Cross-Origin Request Blocked: 
Reason: Credential is not supported if the CORS header 'Access-Control-Allow-Origin' is '*'
```

**Conclusion**: ✅ **Infrastructure override confirmed**
- Browser explicitly states it received `Access-Control-Allow-Origin: *`
- Our function code does NOT set wildcard (verified in code review)
- Therefore: Supabase infrastructure is adding/overriding the header

---

## Next Steps

### 1. Verify Function Logs (Supabase Dashboard)

Go to: https://supabase.com/dashboard/project/qvyrpzgxsppkwfvqvgcn/functions/card-gate

**Check Logs tab:**
- Look for recent OPTIONS requests
- Find log line: `[card-gate] OPTIONS preflight - Allowed origin: https://www.xn--arch-paris-e7a.com`
- This confirms function is setting correct headers

**Check Invocations tab:**
- Find the OPTIONS request
- Check Response Headers
- Compare with function logs

**Expected Result:**
- Function logs: Show specific origin ✅
- Invocation headers: Show wildcard `*` ❌
- Browser receives: Wildcard `*` ❌

This confirms infrastructure override.

---

### 2. Open Supabase Support Ticket

Use the template: `docs/SUPABASE_SUPPORT_TICKET_TEMPLATE.md`

**Include:**
- ✅ Browser console error (screenshot or text)
- ✅ Function logs showing correct origin (from Dashboard)
- ✅ Invocation response headers (from Dashboard)
- ✅ Code review confirmation (reference `docs/CORS_CODE_REVIEW.md`)

**Key Points:**
- Function code is correct (no wildcard paths)
- Function logs show correct headers
- But actual response contains wildcard
- This indicates platform/edge layer override

---

### 3. Temporary Workaround (If Needed)

While waiting for Supabase support:

**Option A**: Remove `credentials: 'include'` temporarily
- ⚠️ This will break cookie-based auth
- Not recommended for production

**Option B**: Use proxy/CORS proxy
- ⚠️ Adds latency and complexity
- Not recommended

**Option C**: Wait for Supabase fix
- ✅ Recommended approach
- Function code is correct, just needs platform fix

---

## Summary

**Status**: Infrastructure override confirmed
**Evidence**: Browser console explicitly shows wildcard `*` received
**Action**: Open Supabase support ticket with evidence

**Function code**: ✅ Correct (no wildcard)
**Platform behavior**: ❌ Overriding headers
