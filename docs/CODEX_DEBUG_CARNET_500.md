# Codex debug prompt: 500 sur le carnet (POST /journal/note)

## Symptôme

- **Erreur** : `Failed to load resource: the server responded with a status of 500 ()` sur le carnet (Mon carnet).
- **Endpoint concerné** : `POST /api/card-gate/journal/note` (proxied vers Supabase Edge `POST /functions/v1/card-gate/journal/note`).
- **Contexte** : GET `/journal/list` et GET `/journal/note` passent en 200 → la table `public.journal_entries` existe et la lecture avec `service_role` fonctionne. Seul le **POST** (écriture) renvoie 500.

---

## Chaîne d’appel (où est quoi)

1. **UI**  
   - **Fichier** : `src/components/CarnetParisien.tsx`  
   - Charge les souvenirs via `loadJournalEntries(cardId)` (ligne ~68).  
   - Sauvegarde / file d’attente via `appendJournalEntry` ou la file de sync (note « Mon Paris »).  
   - La note « Mon Paris » (une par carte) est sauvegardée via `saveMyParisNote` (client).

2. **Client API (gate + body)**  
   - **Fichier** : `src/utils/card-gate-client.ts`  
   - `saveMyParisNote(cardId, content, idempotencyKey?)` : appelle `gateFetch(cardId, '/journal/note', { method: 'POST', body: JSON.stringify({ content, place_id: '__my_paris__', idempotency_key }) })`.  
   - `loadJournalEntries(cardId)` : appelle `gateFetch(cardId, '/journal/list')`.  
   - `gateFetch` envoie les headers (auth JWT ou `X-ARCHE-CARD-CODE` / `X-ARCHE-SESSION`), base URL = `/api/card-gate` (ou env `CARD_GATE_BASE`).

3. **Proxy**  
   - **Fichier** : `api/card-gate/index.js`  
   - Rewrite : `/api/card-gate/:path*` → `/api/card-gate?path=:path*`.  
   - Forward : `GET/POST …/api/card-gate/journal/note` → `https://<SUPABASE>/functions/v1/card-gate/journal/note` avec le même body et headers (Authorization, Content-Type, etc.).  
   - Le proxy ne modifie pas le body ; il le lit (readRawBody si besoin) et le renvoie tel quel.

4. **Edge Function (handler POST /journal/note)**  
   - **Fichier** : `supabase/functions/card-gate/index.tsx`  
   - **basePath** : `/functions/v1/card-gate` (ligne ~24).  
   - **Route** : `app.post("/journal/note", async (c) => { ... })` (vers lignes 2590–2670).  
   - **Logique** :  
     - `requireJwt(c)` → 401 si pas de session/JWT.  
     - Extraction `card_id` du payload JWT (pas du body).  
     - Body attendu : `{ content?: string, place_id?: string, idempotency_key?: string }`.  
     - SELECT sur `journal_entries` par `(card_id, place_id)` ; si une ligne existe → UPDATE, sinon INSERT.  
   - **Logs déjà ajoutés** :  
     - `[card-gate] POST /journal/note: card_id (prefix)= ...`  
     - `[card-gate] POST /journal/note validate ok { card_id, place_id, has_key, content_len }`  
     - `[card-gate] POST /journal/note selecting existing by (card_id, place_id)`  
     - `[card-gate] POST /journal/note select failed err= ...`  
     - `[card-gate] POST /journal/note update failed err= ...`  
     - `[card-gate] POST /journal/note insert failed err= ...`  
     - `[card-gate] POST /journal/note unhandled err stack= ...`  
   - **Client DB** : `getSupabase()` utilise `SUPABASE_SERVICE_ROLE_KEY` (ligne ~186).

5. **Base de données**  
   - **Table** : `public.journal_entries`.  
   - **Migration** : `supabase/migrations/20260226100000_journal_entries_card_gate.sql`.  
   - **Colonnes** : `id` (uuid), `card_id` (text), `place_id` (text), `content` (text), `created_at`, `updated_at` (timestamptz), `idempotency_key` (text nullable).  
   - **Index** : `(card_id, place_id)` ; unique partiel `(card_id, idempotency_key)` WHERE `idempotency_key IS NOT NULL`.  
   - **RLS** : activé, pas de policy → seul `service_role` peut lire/écrire.

---

## Ce que Codex doit faire pour débugger

1. **Vérifier les logs Edge (Supabase)**  
   - Après un POST qui renvoie 500, ouvrir **Supabase Dashboard → Edge Functions → card-gate → Logs**.  
   - Chercher les lignes `[card-gate] POST /journal/note ...`.  
   - Identifier laquelle apparaît en dernier :  
     - Si **select failed** → erreur sur le SELECT (droits, colonne, table).  
     - Si **update failed** ou **insert failed** → noter `err=`, `code=`, `details=`, `hint=` (codes Postgres).  
     - Si **unhandled err** → noter le message et la stack (souvent type ou null).

2. **Test SQL de contrôle (Option A)**  
   - Exécuter dans **Supabase → SQL Editor** le script :  
     **Fichier** : `docs/DEBUG_journal_note_control_insert.sql`  
     - Insert : `card_id='card_seed_live', place_id='my_paris', content='Test note via SQL', idempotency_key='debug-1'`.  
   - Si l’INSERT **échoue** : le message SQL (contrainte, type, colonne) donne la cause côté schéma/contraintes.  
   - Si l’INSERT **passe** : le 500 vient du code (mapping, auth, body, ou erreur avant/après l’appel DB).

3. **Vérifier le body et l’auth côté client**  
   - Dans `src/utils/card-gate-client.ts`, `saveMyParisNote` envoie bien :  
     `{ content: string, place_id: '__my_paris__', idempotency_key?: string }`.  
   - Pas de `card_id` dans le body ; il doit venir du JWT/session (`requireJwt`).  
   - S’assurer que `gateFetch` envoie bien `Content-Type: application/json` et le body stringifié.

4. **Vérifier le proxy**  
   - Dans `api/card-gate/index.js`, pour une requête POST, le body est bien lu et envoyé à l’Edge (pas de body vide ou tronqué).  
   - Vérifier que `req.body` ou `readRawBody(req)` est utilisé correctement selon le framework (Vercel/Node).

5. **Corrections possibles une fois la cause connue**  
   - **Erreur Postgres (contrainte, type)** : ajuster la migration ou le schéma, ou le mapping des champs dans `card-gate/index.tsx` (types, noms de colonnes).  
   - **Body vide / mal parsé** : vérifier le proxy et que `c.req.json()` reçoit bien le body dans l’Edge.  
   - **card_id manquant ou invalide** : vérifier `requireJwt` / `resolveCardSession` et que le JWT ou le cookie de session contient bien `card_id`.  
   - **Rate limit** : 429 au lieu de 500 ; si tu vois 500, les logs préciseront si c’est avant ou après le rate limit.

---

## Fichiers à ouvrir en priorité

| Rôle              | Fichier |
|-------------------|--------|
| Handler POST note | `supabase/functions/card-gate/index.tsx` (lignes ~2590–2670) |
| Client save/load  | `src/utils/card-gate-client.ts` (`saveMyParisNote`, `loadJournalEntries`, `gateFetch`) |
| UI carnet         | `src/components/CarnetParisien.tsx` (load/save, file d’attente) |
| Proxy             | `api/card-gate/index.js` (body + forward) |
| Schéma DB         | `supabase/migrations/20260226100000_journal_entries_card_gate.sql` |
| Test SQL          | `docs/DEBUG_journal_note_control_insert.sql` |

---

## Correctif appliqué (doublons → 500)

- **Cause** : en présence de doublons historiques sur `(card_id, place_id)`, PostgREST renvoie une erreur quand on utilise `maybeSingle()` → 500.
- **Correctif** : utiliser `limit(1)` puis `data[0]` (ou `existingRows[0]`) au lieu de `maybeSingle()` pour GET et POST `/journal/note`. Déjà en place dans `supabase/functions/card-gate/index.tsx`.
- **Déploiement** : redéployer la fonction pour que le correctif soit actif :
  ```bash
  supabase functions deploy card-gate --project-ref qvyrpzgxsppkwfvqvgcn
  ```
- **Suite optionnelle** : script SQL de déduplication sur `place_id = '__my_paris__'` + contrainte unique partielle pour éviter de nouveaux doublons.

---

## Résumé pour Codex

- **Objectif** : faire disparaître le 500 sur POST `/journal/note` (carnet).  
- **Méthode** : utiliser les logs Edge `[card-gate] POST /journal/note ...` pour voir l’étape et l’erreur exacte ; exécuter l’insert de contrôle pour distinguer schéma vs code ; vérifier body et auth côté client et proxy.  
- **Sortie attendue** : identification de la cause (message d’erreur ou ligne de code) + correctif minimal (patch SQL ou code) et, si besoin, instruction pour redéployer l’Edge Function ou appliquer une migration.
