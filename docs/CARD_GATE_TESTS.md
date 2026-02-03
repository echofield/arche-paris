# Card Gate V1 — Tests to pass before ship

Run these checks after deploying the Card Gate Edge Function and applying migration `004_card_gate_rls.sql`.

## 1. Client A cannot access Client B (even with B's card_id)

- **Setup:** Two cards A and B, each activated and paired on different devices.
- **Check:** With Client A's token (or device_secret), call `/journal/list` or `/trace/list` with header `Authorization: Bearer <A's token>` but do not try to pass B's card_id in body (JWT scoped per cardId).
- **Verify:** Journal/trace endpoints use `card_id` from JWT only. Client A cannot see or write B's data by calling the gate with A's token (card_id in JWT is A; B's data is never returned).

**Manual:** Log in as card A, open Carnet — only A's entries. In another browser/incognito log in as card B — only B's entries. No way to request B's journal with A's session.

## 2. Pairing fails if not activated

- **Setup:** Card exists but `activated_at` IS NULL (never activated with code+password).
- **Check:** POST `/card-gate/pair` with `{ "card_id": "<id>" }`.
- **Expected:** 400 with message like "Card not activated. Activate with code and password first."

## 3. Pairing fails if already paired

- **Setup:** Card activated and already paired (`device_secret_hash` IS NOT NULL).
- **Check:** POST `/card-gate/pair` again with same `card_id`.
- **Expected:** 409 with `code: "ALREADY_PAIRED"` and message "Already paired".

## 4. Rate limits trigger correctly

- **Pair:** More than 3 POST `/pair` requests per card_id per hour → 429.
- **Validate:** More than 10 POST `/validate` per card_id per hour, or more than 50 per IP per hour → 429.
- **Journal/Trace:** Enforce DB-backed limiter on `/journal/*` and `/trace/*` (e.g. 60 per card per hour, 200 per IP per hour) → 429 when exceeded.

## 5. Expired / invalid tokens rejected

- **Check:** Call GET `/journal/list` with `Authorization: Bearer <expired_jwt>` or `Bearer <invalid_or_tampered>`.
- **Expected:** 401 with message "Invalid or expired token".

---

**Deploy checklist**

1. Set `CARD_GATE_JWT_SECRET` in Supabase Edge Function secrets.
2. Deploy `card-gate` Edge Function.
3. Run migration `004_card_gate_rls.sql` (rate_limits table, device_secret_hash, RLS drops).
4. Client uses Card Gate only for journal/traces; no direct DB access.
