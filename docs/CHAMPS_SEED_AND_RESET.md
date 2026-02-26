# Champs — Seed, reset et vérifications

## Liste par créateur (exemple SQL)

Pour debug ou scripts, liste des champs d’un créateur avec pagination :

```sql
SELECT id, name, status, visibility, active_start_minute, active_end_minute, created_at
FROM public.champs
WHERE created_by = 'card_seed_live'  -- ou PS-0001, etc.
ORDER BY updated_at DESC
LIMIT 20 OFFSET 0;
```

## Reset seed

Pour repartir à zéro avant de ré-exécuter le seed :

1. Exécuter `supabase/seed-reset-champs.sql` dans le SQL Editor.
2. Ré-exécuter ton script d’insert seed (Seed Draft Private, Seed Live Public, lien `card_seed_live` → Seed Live Public).

Si tu ajoutes un mapping pour une autre carte (ex. PS-0001), ajoute son `card_id` dans le `WHERE card_id IN (...)` du reset.

## Test du CHECK layers 0..1 (optionnel)

Si tu as appliqué la migration `20260226000002_champs_layers_values_check.sql` :

**INSERT valide** (doit passer) :

```sql
INSERT INTO public.champs (name, layers, tone, active_start_minute, active_end_minute)
VALUES (
  'Test CHECK',
  '{"trace":0.5,"alignment":0.5,"ritual":0.5,"echo":0.5,"threshold":0.1}'::jsonb,
  'whisper',
  540,
  1020
)
RETURNING id, name;
-- Puis supprimer : DELETE FROM public.champs WHERE name = 'Test CHECK';
```

**INSERT invalide** (doit être rejeté par le CHECK) :

```sql
-- Valeur > 1
INSERT INTO public.champs (name, layers, tone, active_start_minute, active_end_minute)
VALUES ('Invalid', '{"trace":1.5,"alignment":0,"ritual":0,"echo":0,"threshold":0}'::jsonb, 'whisper', 540, 1020);
-- Attendu : erreur champs_layers_values_check
```

## RLS

Aucune policy sur `champs` ni `card_default_champ` pour l’instant ; tout passe par le card-gate en `service_role`. Si tu ajoutes des policies plus tard (accès direct avec JWT/card_id), mettre à jour la checklist RLS et prévoir un smoke ciblé.
