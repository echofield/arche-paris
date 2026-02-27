-- Option A: Insert de contrôle pour isoler le 500 POST /journal/note.
-- Exécuter dans Supabase SQL Editor. Si ça passe → erreur côté code (mapping, payload). Si ça casse → erreur SQL/schéma.

INSERT INTO public.journal_entries (card_id, place_id, content, idempotency_key)
VALUES (
  'card_seed_live',
  'my_paris',
  'Test note via SQL',
  'debug-1'
);

-- Vérifier la ligne insérée
SELECT id, card_id, place_id, content, created_at, updated_at, idempotency_key
FROM public.journal_entries
WHERE card_id = 'card_seed_live' AND place_id = 'my_paris';

-- Nettoyage optionnel après test
-- DELETE FROM public.journal_entries WHERE card_id = 'card_seed_live' AND idempotency_key = 'debug-1';
