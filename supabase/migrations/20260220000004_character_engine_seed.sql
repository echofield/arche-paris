insert into public.characters (slug, name, tone, scope, bio, rules_json, is_active)
values
  (
    'le_geometre',
    'Le Geometre',
    'witness',
    'paris_only',
    'Temoin des axes, mesures et alignements.',
    '{"echo_location_hint":"Rue Bonaparte","echo_symbol":"ouroboros"}'::jsonb,
    true
  ),
  (
    'la_veilleuse',
    'La Veilleuse',
    'quiet',
    'paris_only',
    'Observe les bords, passages et seuils.',
    '{"echo_location_hint":"Pont de Sully","echo_symbol":"threshold"}'::jsonb,
    true
  ),
  (
    'le_graveur',
    'Le Graveur',
    'formal',
    'paris_only',
    'Archive traces, pierres, inscriptions et retours.',
    '{"echo_location_hint":"Rue d Avron","echo_symbol":"serpent"}'::jsonb,
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  tone = excluded.tone,
  scope = excluded.scope,
  bio = excluded.bio,
  rules_json = excluded.rules_json,
  is_active = excluded.is_active;

with char_ids as (
  select id, slug from public.characters where slug in ('le_geometre', 'la_veilleuse', 'le_graveur')
)
insert into public.character_fragments (
  character_id,
  lang,
  kind,
  text,
  symbols,
  anchors,
  zones,
  cooldown_minutes,
  weight,
  is_active
)
values
  ((select id from char_ids where slug = 'le_geometre'), 'fr', 'witness', 'Ici, la ligne se verifie par la presence, pas par le discours.', array['axis'], array['alignment','measurement'], array['PAR-14','PAR-06'], 180, 2, true),
  ((select id from char_ids where slug = 'le_geometre'), 'fr', 'threshold', 'A midi solaire, le meridien cesse d etre idee et devient mesure.', array['meridian','noon'], array['measurement','revelation'], array['PAR-14','PAR-06'], 240, 2, true),
  ((select id from char_ids where slug = 'le_geometre'), 'fr', 'echo', 'Echo: rue Bonaparte. Un serpent referme ce qui semblait ouvert.', array['ouroboros','serpent'], array['threshold'], array['PAR-06','PAR-14'], 240, 1, true),
  ((select id from char_ids where slug = 'le_geometre'), 'en', 'witness', 'At this point, alignment is confirmed by stillness, not explanation.', array['axis'], array['alignment','measurement'], array['PAR-14','PAR-06'], 180, 1, true),
  ((select id from char_ids where slug = 'le_geometre'), 'en', 'threshold', 'At solar noon, the meridian stops being a story and becomes a measure.', array['meridian','noon'], array['measurement','revelation'], array['PAR-14','PAR-06'], 240, 1, true),

  ((select id from char_ids where slug = 'la_veilleuse'), 'fr', 'witness', 'Le bord est calme, mais il compte chaque franchissement.', array['threshold'], array['threshold'], array['PAR-20','PAR-12','PAR-04'], 180, 2, true),
  ((select id from char_ids where slug = 'la_veilleuse'), 'fr', 'hint', 'Un pont ne relie pas deux rives: il mesure leur tension.', array['bridge','river'], array['threshold','alignment'], array['PAR-04','PAR-12'], 180, 2, true),
  ((select id from char_ids where slug = 'la_veilleuse'), 'fr', 'echo', 'Echo: Pont de Sully. Traverse lentement, puis arrete-toi vingt secondes.', array['bridge','threshold'], array['threshold'], array['PAR-04','PAR-12'], 240, 1, true),
  ((select id from char_ids where slug = 'la_veilleuse'), 'en', 'witness', 'The edge stays quiet, but it records each crossing.', array['threshold'], array['threshold'], array['PAR-20','PAR-12','PAR-04'], 180, 1, true),
  ((select id from char_ids where slug = 'la_veilleuse'), 'en', 'hint', 'A bridge does not just connect shores; it calibrates distance and risk.', array['bridge','river'], array['threshold','alignment'], array['PAR-04','PAR-12'], 180, 1, true),

  ((select id from char_ids where slug = 'le_graveur'), 'fr', 'witness', 'La pierre archive sans commentaire. Ta presence suffit au relevé.', array['stone','inscription'], array['revelation','measurement'], array['PAR-20','PAR-11','PAR-05'], 180, 2, true),
  ((select id from char_ids where slug = 'le_graveur'), 'fr', 'warning', 'Ne surinterprete pas le signe. Observe, note, puis laisse la ville repondre.', array['inscription'], array['revelation'], array['PAR-20','PAR-11'], 180, 1, true),
  ((select id from char_ids where slug = 'le_graveur'), 'fr', 'echo', 'Echo: rue d Avron. Le visage de facade ne joue pas, il enregistre.', array['mascaron','face'], array['absence','threshold'], array['PAR-20'], 240, 1, true),
  ((select id from char_ids where slug = 'le_graveur'), 'en', 'witness', 'Stone keeps records without drama. Presence is enough to register.', array['stone','inscription'], array['revelation','measurement'], array['PAR-20','PAR-11','PAR-05'], 180, 1, true),
  ((select id from char_ids where slug = 'le_graveur'), 'en', 'echo', 'Echo: Rue d Avron. The facade face does not speak; it logs passage.', array['mascaron','face'], array['absence','threshold'], array['PAR-20'], 240, 1, true)
on conflict do nothing;
