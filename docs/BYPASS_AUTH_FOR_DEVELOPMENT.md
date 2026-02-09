# Bypass Authentication for Development - While Waiting for Supabase CORS Fix

## Option 1: Use DEMO Mode (Recommended)

### How to Use
Simply add `?card=DEMO-001` (or any code starting with `DEMO`) to your URL:

```
https://www.xn--arch-paris-e7a.com/?card=DEMO-001
```

### What Works with DEMO Mode
✅ **All UI/UX features**:
- Homepage navigation
- Aura page (Miroir sentences)
- Le Champ map (viewing shared sentences)
- Quêtes (quests)
- Études (studies)
- Collection map (viewing)
- Navigation between screens

✅ **Features that don't require backend**:
- All visual components
- Map interactions
- UI flows
- Design validation

### What Won't Work (Requires Real Auth)
❌ **Backend-dependent features**:
- Saving inscriptions to "Ma carte" (requires `POST /inscriptions`)
- Saving Miroir sentences (requires `POST /mirror/keep`)
- Journal entries (requires `POST /journal/*`)
- Traces (requires `POST /trace/*`)
- Sharing to Le Champ (requires `POST /inscriptions` with `opt_in_field`)

**But**: You can still VIEW Le Champ (shared sentences from others) if they exist!

---

## Option 2: Test Locally (localhost)

If you run locally, CORS might work differently:

```bash
npm run dev
```

Then access: `http://localhost:5173/?card=PS-0001`

**Note**: Localhost is in the allowed origins list, so CORS might work here even if production doesn't.

---

## Option 3: Continue Development on Non-Auth Features

### What You Can Validate Right Now

1. **Le Champ Map** ✅
   - View the animated map
   - See if dots appear (if any shared sentences exist)
   - Test map interactions
   - Verify animations work

2. **UI/UX Flows** ✅
   - Navigation between screens
   - Aura page layout
   - Miroir integration
   - All visual components

3. **Design Consistency** ✅
   - Check if design matches petitsouvenir
   - Verify responsive behavior
   - Test animations

### What to Wait For

- **Full authentication flow** (needs CORS fix)
- **Saving data** (needs CORS fix)
- **End-to-end user flows** (needs CORS fix)

---

## Recommended Approach

### Short Term (Now)
1. **Use DEMO mode** to validate UI/UX:
   ```
   https://www.xn--arch-paris-e7a.com/?card=DEMO-001
   ```

2. **Test Le Champ map**:
   - Verify map displays correctly
   - Check if animations work
   - Test responsive behavior
   - See if dots appear (if any shared sentences exist)

3. **Continue development** on features that don't require auth

### Medium Term (While Waiting)
1. **Open Supabase support ticket** (use `docs/SUPABASE_SUPPORT_TICKET_READY.md`)
2. **Monitor for response** (usually 1-3 business days)
3. **Test other features** that don't need card-gate

### Long Term (After Fix)
1. **Test full authentication flow**
2. **Test all backend features**
3. **Validate end-to-end user experience**

---

## Quick Test Commands

### Test DEMO Mode
```
https://www.xn--arch-paris-e7a.com/?card=DEMO-001
```

### Test Le Champ Map
```
https://www.xn--arch-paris-e7a.com/?card=DEMO-001#champ
```

### Test Aura Page
```
https://www.xn--arch-paris-e7a.com/?card=DEMO-001#aura
```

---

## Summary

**You don't need to wait!** Use DEMO mode to:
- ✅ Validate UI/UX
- ✅ Test Le Champ map
- ✅ Continue development
- ✅ Test visual features

**Wait for Supabase fix** only for:
- ❌ Full authentication
- ❌ Saving data
- ❌ End-to-end flows

**Action**: Use `?card=DEMO-001` and continue development while Supabase fixes the CORS issue!
