-- Reset seed champs: remove demo data so you can re-run the seed from scratch.
-- Safe to run multiple times. Only touches known seed names and seed card_id.
-- If you add another demo mapping (e.g. PS-0001), add it to the IN list below.

-- 1. Remove default-champ links for seed cards (avoids FK on next step)
DELETE FROM public.card_default_champ
WHERE card_id IN ('card_seed_live');  -- add 'PS-0001' etc. if you use more demo cards

-- 2. Remove seed champs by name
DELETE FROM public.champs
WHERE name IN ('Seed Draft Private', 'Seed Live Public');

-- Optional: verify empty
-- SELECT COUNT(*) FROM public.champs WHERE name LIKE 'Seed%';
-- SELECT COUNT(*) FROM public.card_default_champ WHERE card_id = 'card_seed_live';
