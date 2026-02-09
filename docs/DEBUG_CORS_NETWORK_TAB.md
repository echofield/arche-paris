# How to See OPTIONS Preflight Requests in Browser DevTools

## The Problem
The CORS error says the preflight OPTIONS request is returning `Access-Control-Allow-Origin: *`, but you need to see the actual request/response to verify.

## Why OPTIONS Requests Might Be Hidden

1. **Filtered out** - Network tab filters might hide failed requests
2. **Blocked before completion** - Browser blocks it before showing in network tab
3. **Need to enable "Preserve log"** - Requests clear on navigation

## Step-by-Step: See the OPTIONS Request

### 1. Open DevTools
- Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- Go to **Network** tab

### 2. Configure Network Tab
- ✅ **Check "Preserve log"** (top of Network tab) - Keeps requests after page navigation
- ✅ **Uncheck "Disable cache"** (if you want to test cache behavior)
- ✅ **Set filter to "All"** or **"Fetch/XHR"** - Don't filter out failed requests

### 3. Clear Network Log
- Click the **clear button** (circle with line) to start fresh

### 4. Trigger the Request
- Navigate to: `https://www.xn--arch-paris-e7a.com/?card=PS-0001`
- Or refresh the page if already there

### 5. Find the OPTIONS Request
Look for requests to:
- `card-gate/refresh`
- `card-gate/pair`

**Important**: There should be TWO requests for each:
1. **OPTIONS** (preflight) - This is the one we need to check!
2. **POST** (actual request) - This won't run if OPTIONS fails

### 6. Check OPTIONS Request Details

Click on the OPTIONS request, then:

#### A. Check "Headers" Tab
- **Request Headers**: Look for `Origin: https://www.xn--arch-paris-e7a.com`
- **Response Headers**: Look for `Access-Control-Allow-Origin`

**What to look for:**
- ✅ **Good**: `Access-Control-Allow-Origin: https://www.xn--arch-paris-e7a.com`
- ❌ **Bad**: `Access-Control-Allow-Origin: *`

#### B. Check "Preview" or "Response" Tab
- Should show empty (204 No Content)

#### C. Check "Timing" Tab
- Shows when request was made
- If it shows "blocked" or "CORS error", that's the issue

### 7. If OPTIONS Request Doesn't Appear

If you don't see the OPTIONS request at all:

1. **Check filter settings**:
   - Make sure "Hide data URLs" is unchecked
   - Make sure "Hide extension URLs" is unchecked
   - Try filter: "All" instead of specific type

2. **Check if request is being blocked**:
   - Look for red entries (failed requests)
   - Check Console tab for CORS errors
   - The error message will tell you which request failed

3. **Try incognito/private window**:
   - Prevents service worker and cache interference
   - `Ctrl+Shift+N` (Chrome) or `Ctrl+Shift+P` (Firefox)

## Alternative: Use Browser Console to Test

You can also test the OPTIONS request directly in console:

```javascript
fetch('https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://www.xn--arch-paris-e7a.com',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type, authorization'
  }
})
.then(r => {
  console.log('Status:', r.status);
  console.log('Headers:', Object.fromEntries(r.headers));
  r.headers.forEach((v, k) => console.log(k + ':', v));
})
.catch(e => console.error('Error:', e));
```

This will show you the actual response headers in the console.

## What to Screenshot/Share

If you find the OPTIONS request, screenshot or copy:

1. **Request Headers** (especially `Origin`)
2. **Response Headers** (especially `Access-Control-Allow-Origin`)
3. **Status Code** (should be 204)
4. **Any error messages** in red

This will help diagnose if:
- Function is returning correct headers (but browser sees `*`)
- Function is returning `*` (but our code review says it shouldn't)
- Request isn't reaching the function at all

## Quick Checklist

- [ ] DevTools Network tab open
- [ ] "Preserve log" checked
- [ ] Filter set to "All" or "Fetch/XHR"
- [ ] Network log cleared
- [ ] Page refreshed/navigated
- [ ] OPTIONS request found (to `card-gate/refresh` or `card-gate/pair`)
- [ ] Response headers checked
- [ ] Screenshot/copy of headers taken

---

**Once you have the OPTIONS request details, we can determine if:**
1. Function code needs fixing (unlikely - we verified it)
2. Supabase infrastructure is overriding (likely - needs support ticket)
3. Browser cache issue (clear cache and retest)
