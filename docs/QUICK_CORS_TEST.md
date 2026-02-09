# Quick CORS Test - Run This Now

## Option 1: Browser Console Test (Fastest)

Open browser console (F12) and paste this:

```javascript
// Test OPTIONS preflight
fetch('https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://www.xn--arch-paris-e7a.com',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type, authorization'
  },
  credentials: 'include'
})
.then(async r => {
  console.log('✅ OPTIONS Response Status:', r.status);
  console.log('📋 Response Headers:');
  r.headers.forEach((v, k) => {
    if (k.toLowerCase().includes('access-control')) {
      console.log(`  ${k}: ${v}`);
    }
  });
  
  // Check for wildcard
  const acao = r.headers.get('Access-Control-Allow-Origin');
  if (acao === '*') {
    console.error('❌ PROBLEM: Access-Control-Allow-Origin is wildcard "*"');
  } else if (acao === 'https://www.xn--arch-paris-e7a.com') {
    console.log('✅ CORRECT: Access-Control-Allow-Origin matches origin');
  } else {
    console.warn('⚠️ UNEXPECTED: Access-Control-Allow-Origin:', acao);
  }
})
.catch(e => {
  console.error('❌ Request failed:', e);
  console.log('This might be a CORS error - check Network tab for OPTIONS request');
});
```

**What to look for:**
- If it logs headers → Check if `Access-Control-Allow-Origin` is `*` or specific origin
- If it fails → Check Network tab for the OPTIONS request (see guide below)

## Option 2: Network Tab Inspection

1. **Open DevTools** (F12) → **Network** tab
2. **Enable "Preserve log"** (checkbox at top)
3. **Set filter to "All"** (don't filter failed requests)
4. **Clear network log** (circle icon)
5. **Refresh page** or navigate to: `https://www.xn--arch-paris-e7a.com/?card=PS-0001`

6. **Look for OPTIONS requests**:
   - Filter by typing: `card-gate` in the search box
   - Or look for requests with **Status: (failed)** or **Status: 204**
   - Should see: `card-gate/refresh` and `card-gate/pair`

7. **Click on OPTIONS request** → Check **"Headers"** tab:
   - **Request Headers**: Should show `Origin: https://www.xn--arch-paris-e7a.com`
   - **Response Headers**: Look for `Access-Control-Allow-Origin`
     - ✅ **Good**: `https://www.xn--arch-paris-e7a.com`
     - ❌ **Bad**: `*`

## Option 3: curl Test (Most Reliable)

Run this in terminal/PowerShell:

```bash
curl -i -X OPTIONS 'https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh' \
  -H 'Origin: https://www.xn--arch-paris-e7a.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type, authorization'
```

**Copy the full output** - especially the headers section.

---

## What to Share

After running any of these tests, share:

1. **What you see**:
   - `Access-Control-Allow-Origin: *` → Infrastructure override confirmed
   - `Access-Control-Allow-Origin: https://www.xn--arch-paris-e7a.com` → Code is working, might be cache issue
   - Request fails/blocked → Need to check Network tab

2. **Screenshot** of:
   - Network tab showing OPTIONS request
   - Response headers from that request
   - OR curl output

3. **Function logs** (if accessible):
   - Supabase Dashboard → Functions → card-gate → Logs
   - Look for: `[card-gate] OPTIONS preflight - Allowed origin: ...`

---

## Quick Diagnosis

| Test Result | Meaning | Action |
|------------|---------|--------|
| Headers show `*` | Infrastructure override | Open Supabase support ticket |
| Headers show specific origin | Code working | Clear browser cache, try incognito |
| Request blocked/failed | CORS error | Check Network tab for details |
| Can't see OPTIONS request | Filtered/hidden | Use console test or curl |

---

**Run the browser console test first (Option 1) - it's the fastest way to see what headers are actually being returned.**
