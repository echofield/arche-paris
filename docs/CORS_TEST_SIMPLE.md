# Simple CORS Test - No Console Pasting Needed

## Option 1: Type "allow pasting" First

If the browser blocks pasting:

1. In the Console tab, **type exactly**: `allow pasting`
2. Press **Enter**
3. Now you can paste the test code

---

## Option 2: Use Network Tab (No Code Needed)

### Step 1: Open DevTools
- Press `F12`

### Step 2: Go to Network Tab
- Click **"Network"** tab

### Step 3: Enable "Preserve log"
- Check the **"Preserve log"** checkbox (top of Network tab)

### Step 4: Clear Network Log
- Click the **clear button** (circle with line)

### Step 5: Refresh Page
- Press `F5` or click refresh button
- Or navigate to: `https://www.xn--arch-paris-e7a.com/?card=PS-0001`

### Step 6: Find the Failed Request
- Look for requests to `card-gate/refresh` or `card-gate/pair`
- They might be **red** (failed) or show **Status: (failed)**

### Step 7: Click on the Request
- Click on `card-gate/refresh` or `card-gate/pair`

### Step 8: Check Headers
- Click **"Headers"** tab
- Scroll to **"Response Headers"** section
- Look for `Access-Control-Allow-Origin`

**What to look for:**
- ✅ `Access-Control-Allow-Origin: https://www.xn--arch-paris-e7a.com` (good)
- ❌ `Access-Control-Allow-Origin: *` (bad - this is the problem)

### Step 9: Screenshot
- Take a screenshot of the Response Headers section

---

## Option 3: PowerShell Test (Windows)

1. Open **PowerShell** (search "PowerShell" in Start menu)
2. Copy and paste this (PowerShell allows pasting):

```powershell
$response = Invoke-WebRequest -Uri 'https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh' -Method OPTIONS -Headers @{'Origin'='https://www.xn--arch-paris-e7a.com'; 'Access-Control-Request-Method'='POST'; 'Access-Control-Request-Headers'='content-type, authorization'} -UseBasicParsing
$response.Headers
```

3. Press Enter
4. Look for `Access-Control-Allow-Origin` in the output

---

## Option 4: Type Code Manually (If You Want)

If you want to use console but can't paste, type this manually:

```javascript
fetch('https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh', {method: 'OPTIONS', headers: {'Origin': 'https://www.xn--arch-paris-e7a.com', 'Access-Control-Request-Method': 'POST'}, credentials: 'include'}).then(r => {console.log('Origin header:', r.headers.get('Access-Control-Allow-Origin')); r.headers.forEach((v,k) => {if(k.toLowerCase().includes('access-control')) console.log(k+':', v);});}).catch(e => console.error('Error:', e));
```

(All on one line - easier to type)

---

## Recommended: Use Network Tab (Option 2)

**The Network tab method is easiest** - no code needed, just visual inspection.

1. F12 → Network tab
2. Check "Preserve log"
3. Refresh page
4. Click on the failed `card-gate` request
5. Check Response Headers
6. Screenshot and share

---

**Try Option 2 (Network Tab) - it's the simplest and doesn't require any code!**
