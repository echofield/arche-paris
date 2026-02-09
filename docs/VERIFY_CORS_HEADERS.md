# CORS Headers Verification Guide

## Quick Test Commands

### 1. Test OPTIONS Preflight Request (curl)

Run this command to see the actual headers returned:

```bash
curl -i -X OPTIONS 'https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh' \
  -H 'Origin: https://www.xn--arch-paris-e7a.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type, authorization'
```

**Expected headers (if working correctly):**
```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://www.xn--arch-paris-e7a.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Max-Age: 600
```

**If you see `Access-Control-Allow-Origin: *` → That's the problem!**

### 2. Test OPTIONS for /pair endpoint

```bash
curl -i -X OPTIONS 'https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/pair' \
  -H 'Origin: https://www.xn--arch-paris-e7a.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type, authorization'
```

### 3. Check Function Logs

1. Go to: https://supabase.com/dashboard/project/qvyrpzgxsppkwfvqvgcn/functions/card-gate
2. Click on "Invocations" tab
3. Find the most recent OPTIONS request
4. Check the "Response" section for headers
5. Look for logs showing: `[card-gate] OPTIONS preflight - Allowed origin: ...`

### 4. Browser Network Inspector Test

1. Open browser DevTools (F12)
2. Go to Network tab
3. Clear network log
4. Navigate to: `https://www.xn--arch-paris-e7a.com/?card=PS-0001`
5. Look for the OPTIONS request to `/card-gate/refresh` or `/card-gate/pair`
6. Click on it and check "Response Headers"
7. Look for `Access-Control-Allow-Origin` header

**What to look for:**
- ✅ `Access-Control-Allow-Origin: https://www.xn--arch-paris-e7a.com` (specific origin) → GOOD
- ❌ `Access-Control-Allow-Origin: *` (wildcard) → BAD - This is the problem!

## What the Logs Should Show

After deploying the updated function, you should see logs like:

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

## If Headers Show Wildcard '*'

If the curl test or Invocations show `Access-Control-Allow-Origin: *`, then:

1. **Check Supabase Dashboard → Functions → card-gate → Settings**
   - Look for any CORS configuration
   - Check if there's a "CORS" toggle or setting

2. **Check for Custom Domain/Proxy**
   - If using a custom domain, check Cloudflare/CDN settings
   - Look for Transform Rules or Workers that might add headers

3. **Compare Function Logs vs Actual Response**
   - If logs show specific origin but response shows `*`
   - → Supabase infrastructure is overriding headers
   - → Open a support ticket with Supabase

## Next Steps Based on Results

### Scenario A: Headers show specific origin ✅
- CORS is working correctly
- Check browser cache (hard refresh: Ctrl+Shift+R)
- Check if cookies are being sent correctly

### Scenario B: Headers show wildcard '*' ❌
- Function code is correct, but infrastructure is overriding
- Check Supabase Dashboard for CORS settings
- Open Supabase support ticket with:
  - Function name: `card-gate`
  - Project ID: `qvyrpzgxsppkwfvqvgcn`
  - Invocation timestamp
  - Screenshot of response headers

### Scenario C: No Access-Control-Allow-Origin header
- Origin might not be in allowed list
- Check function logs for "Origin not allowed" message
- Verify origin string matches exactly (punycode vs regular domain)

## PowerShell Test (Windows)

If you're on Windows and don't have curl:

```powershell
$headers = @{
    'Origin' = 'https://www.xn--arch-paris-e7a.com'
    'Access-Control-Request-Method' = 'POST'
    'Access-Control-Request-Headers' = 'content-type, authorization'
}
Invoke-WebRequest -Uri 'https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh' -Method OPTIONS -Headers $headers -UseBasicParsing | Select-Object -ExpandProperty Headers
```
