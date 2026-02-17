-- ============================================
-- ARCHÉ Paris Zone Seed
-- Real bounding boxes for 20 arrondissements
-- ============================================

insert into public.zones(zone_id, city_code, min_lat, min_lng, max_lat, max_lng, center_lat, center_lng, active)
values
  -- 1er arrondissement (Louvre)
  ('PAR-01', 'PAR', 48.855, 2.325, 48.865, 2.345, 48.860, 2.335, true),
  -- 2e arrondissement (Bourse)
  ('PAR-02', 'PAR', 48.863, 2.335, 48.872, 2.355, 48.868, 2.345, true),
  -- 3e arrondissement (Temple)
  ('PAR-03', 'PAR', 48.860, 2.355, 48.868, 2.370, 48.864, 2.362, true),
  -- 4e arrondissement (Hotel-de-Ville)
  ('PAR-04', 'PAR', 48.848, 2.345, 48.858, 2.365, 48.853, 2.355, true),
  -- 5e arrondissement (Pantheon)
  ('PAR-05', 'PAR', 48.840, 2.340, 48.855, 2.365, 48.847, 2.352, true),
  -- 6e arrondissement (Luxembourg)
  ('PAR-06', 'PAR', 48.845, 2.320, 48.855, 2.345, 48.850, 2.332, true),
  -- 7e arrondissement (Palais-Bourbon)
  ('PAR-07', 'PAR', 48.850, 2.290, 48.862, 2.325, 48.856, 2.308, true),
  -- 8e arrondissement (Elysee)
  ('PAR-08', 'PAR', 48.865, 2.295, 48.880, 2.325, 48.872, 2.310, true),
  -- 9e arrondissement (Opera)
  ('PAR-09', 'PAR', 48.870, 2.325, 48.882, 2.350, 48.876, 2.338, true),
  -- 10e arrondissement (Enclos-St-Laurent)
  ('PAR-10', 'PAR', 48.867, 2.350, 48.882, 2.375, 48.875, 2.362, true),
  -- 11e arrondissement (Popincourt)
  ('PAR-11', 'PAR', 48.850, 2.370, 48.870, 2.395, 48.860, 2.382, true),
  -- 12e arrondissement (Reuilly)
  ('PAR-12', 'PAR', 48.830, 2.375, 48.855, 2.420, 48.842, 2.398, true),
  -- 13e arrondissement (Gobelins)
  ('PAR-13', 'PAR', 48.815, 2.340, 48.840, 2.380, 48.828, 2.360, true),
  -- 14e arrondissement (Observatoire)
  ('PAR-14', 'PAR', 48.815, 2.305, 48.840, 2.340, 48.828, 2.322, true),
  -- 15e arrondissement (Vaugirard)
  ('PAR-15', 'PAR', 48.830, 2.270, 48.855, 2.310, 48.842, 2.290, true),
  -- 16e arrondissement (Passy)
  ('PAR-16', 'PAR', 48.845, 2.250, 48.875, 2.290, 48.860, 2.270, true),
  -- 17e arrondissement (Batignolles-Monceau)
  ('PAR-17', 'PAR', 48.875, 2.290, 48.900, 2.330, 48.888, 2.310, true),
  -- 18e arrondissement (Butte-Montmartre)
  ('PAR-18', 'PAR', 48.880, 2.330, 48.900, 2.370, 48.890, 2.350, true),
  -- 19e arrondissement (Buttes-Chaumont)
  ('PAR-19', 'PAR', 48.875, 2.370, 48.900, 2.410, 48.888, 2.390, true),
  -- 20e arrondissement (Menilmontant)
  ('PAR-20', 'PAR', 48.855, 2.390, 48.875, 2.420, 48.865, 2.405, true)
on conflict (zone_id) do update set
  min_lat = excluded.min_lat,
  min_lng = excluded.min_lng,
  max_lat = excluded.max_lat,
  max_lng = excluded.max_lng,
  center_lat = excluded.center_lat,
  center_lng = excluded.center_lng;
