# How to Run the CORS Test - Step by Step

## Method 1: Browser Console Test (Easiest)

### Step 1: Open Your Website
1. Go to: `https://www.xn--arch-paris-e7a.com/?card=PS-0001`
2. Or any page where you see the CORS error

### Step 2: Open Browser Developer Tools
- **Windows/Linux**: Press `F12` or `Ctrl + Shift + I`
- **Mac**: Press `Cmd + Option + I`
- Or right-click anywhere on the page → Select "Inspect" or "Inspect Element"

### Step 3: Go to Console Tab
- Click on the **"Console"** tab at the top of DevTools
- You should see a text input area at the bottom (it might say ">" or be empty)

### Step 4: Paste the Test Code
Copy this entire code block:

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

### Step 5: Run the Code
1. **Paste** the code into the console input area
2. Press **Enter** (or click the arrow/play button if visible)

### Step 6: Read the Results
Look at the console output. You should see messages like:

**If working correctly:**
```
✅ OPTIONS Response Status: 204
📋 Response Headers:
  access-control-allow-origin: https://www.xn--arch-paris-e7a.com
  access-control-allow-credentials: true
  access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
✅ CORRECT: Access-Control-Allow-Origin matches origin
```

**If there's a problem:**
```
✅ OPTIONS Response Status: 204
📋 Response Headers:
  access-control-allow-origin: *
❌ PROBLEM: Access-Control-Allow-Origin is wildcard "*"
```

**If request fails:**
```
❌ Request failed: TypeError: Failed to fetch
```

### Step 7: Share the Results
- **Screenshot** the console output, OR
- **Copy/paste** the text from the console

---

## Method 2: Network Tab (Visual)

### Step 1: Open DevTools
- Press `F12` or `Ctrl + Shift + I`

### Step 2: Go to Network Tab
- Click **"Network"** tab at the top

### Step 3: Configure Network Tab
- ✅ Check **"Preserve log"** (checkbox at the top)
- Set filter dropdown to **"All"** (not "XHR" or "Fetch")

### Step 4: Clear and Refresh
- Click the **clear button** (circle with line through it)
- Refresh the page (`F5` or `Ctrl + R`)

### Step 5: Find OPTIONS Request
- Look for requests to `card-gate/refresh` or `card-gate/pair`
- There should be **two requests** for each:
  1. **OPTIONS** (preflight) - This is what we need!
  2. **POST** (actual request)

### Step 6: Click on OPTIONS Request
- Click on the **OPTIONS** request (it might show as failed/red)

### Step 7: Check Headers
- Click **"Headers"** tab
- Scroll down to **"Response Headers"**
- Look for `Access-Control-Allow-Origin`

**What you're looking for:**
- ✅ `Access-Control-Allow-Origin: https://www.xn--arch-paris-e7a.com` (good)
- ❌ `Access-Control-Allow-Origin: *` (bad - this is the problem)

### Step 8: Screenshot
- Take a screenshot of the Headers tab showing the Response Headers

---

## Method 3: Terminal/PowerShell (Most Reliable)

### Windows PowerShell:
1. Open **PowerShell** (search "PowerShell" in Start menu)
2. Copy and paste this command:

```powershell
curl.exe -i -X OPTIONS 'https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh' -H 'Origin: https://www.xn--arch-paris-e7a.com' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type, authorization'
```

3. Press Enter
4. Copy the entire output (especially the headers section)

### Mac/Linux Terminal:
1. Open **Terminal**
2. Copy and paste:

```bash
curl -i -X OPTIONS 'https://qvyrpzgxsppkwfvqvgcn.supabase.co/functions/v1/card-gate/refresh' \
  -H 'Origin: https://www.xn--arch-paris-e7a.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type, authorization'
```

3. Press Enter
4. Copy the output

---

## Which Method Should You Use?

- **Method 1 (Console)**: Fastest, shows results immediately
- **Method 2 (Network Tab)**: Visual, good for screenshots
- **Method 3 (curl)**: Most reliable, shows raw response

**Start with Method 1** - it's the easiest!

---

## What to Do With Results

Once you have the results:

1. **If you see `Access-Control-Allow-Origin: *`**:
   - This confirms infrastructure override
   - We'll need to open a Supabase support ticket
   - Share the results with me and I'll help draft it

2. **If you see `Access-Control-Allow-Origin: https://www.xn--arch-paris-e7a.com`**:
   - Code is working correctly
   - Try clearing browser cache (Ctrl+Shift+Delete) or use incognito window
   - The error might be from cached old response

3. **If request fails completely**:
   - Check Network tab for more details
   - Share the error message

---

**Start with Method 1 (Browser Console) - it takes 30 seconds and will immediately show us what's happening!**
