-- ============================================
-- ARCHÉ Test Zones — Tight bboxes for v0.1 validation
-- These are small (~30-80m) for precise boundary testing
-- ============================================

-- Test Route 1: Point Zéro des Routes de France
-- Parvis Notre-Dame, ~40m radius around the marker
-- Reference: 48.8534, 2.3488
insert into public.zones(zone_id, city_code, min_lat, min_lng, max_lat, max_lng, center_lat, center_lng, active)
values (
  'PAR-ZERO', 'PAR',
  48.8530, 2.3483,  -- SW corner (~40m from center)
  48.8538, 2.3493,  -- NE corner
  48.8534, 2.3488,  -- center
  true
)
on conflict (zone_id) do update set
  min_lat = excluded.min_lat, min_lng = excluded.min_lng,
  max_lat = excluded.max_lat, max_lng = excluded.max_lng;

-- Test Route 2: Saint-Sulpice Church Entrance
-- Outside steps area, ~60m x 40m
-- Reference: 48.8510, 2.3347 (front steps)
insert into public.zones(zone_id, city_code, min_lat, min_lng, max_lat, max_lng, center_lat, center_lng, active)
values (
  'PAR-SULPICE-EXT', 'PAR',
  48.8506, 2.3340,  -- SW corner
  48.8514, 2.3354,  -- NE corner
  48.8510, 2.3347,
  true
)
on conflict (zone_id) do update set
  min_lat = excluded.min_lat, min_lng = excluded.min_lng,
  max_lat = excluded.max_lat, max_lng = excluded.max_lng;

-- Saint-Sulpice Inside (near gnomon/meridian)
-- Tighter box, GPS will likely fail here
insert into public.zones(zone_id, city_code, min_lat, min_lng, max_lat, max_lng, center_lat, center_lng, active)
values (
  'PAR-SULPICE-INT', 'PAR',
  48.8508, 2.3348,  -- SW corner
  48.8512, 2.3356,  -- NE corner
  48.8510, 2.3352,
  true
)
on conflict (zone_id) do update set
  min_lat = excluded.min_lat, min_lng = excluded.min_lng,
  max_lat = excluded.max_lat, max_lng = excluded.max_lng;

-- Test Route 3: Passage des Panoramas Entrance
-- Tight entrance zone ~30m
-- Reference: 48.8711, 2.3417
insert into public.zones(zone_id, city_code, min_lat, min_lng, max_lat, max_lng, center_lat, center_lng, active)
values (
  'PAR-PANORAMAS', 'PAR',
  48.8709, 2.3414,  -- SW corner
  48.8713, 2.3420,  -- NE corner
  48.8711, 2.3417,
  true
)
on conflict (zone_id) do update set
  min_lat = excluded.min_lat, min_lng = excluded.min_lng,
  max_lat = excluded.max_lat, max_lng = excluded.max_lng;

-- Test Set A: Réaumur-Sébastopol border test
-- West side of Boulevard (2e side)
insert into public.zones(zone_id, city_code, min_lat, min_lng, max_lat, max_lng, center_lat, center_lng, active)
values (
  'PAR-REAUMUR-WEST', 'PAR',
  48.8665, 2.3520,  -- SW corner (west of Sébastopol)
  48.8673, 2.3533,  -- NE corner (stops at boulevard edge)
  48.8669, 2.3526,
  true
)
on conflict (zone_id) do update set
  min_lat = excluded.min_lat, min_lng = excluded.min_lng,
  max_lat = excluded.max_lat, max_lng = excluded.max_lng;

-- East side of Boulevard (3e side)
insert into public.zones(zone_id, city_code, min_lat, min_lng, max_lat, max_lng, center_lat, center_lng, active)
values (
  'PAR-REAUMUR-EAST', 'PAR',
  48.8665, 2.3536,  -- SW corner (east of Sébastopol)
  48.8673, 2.3550,  -- NE corner
  48.8669, 2.3543,
  true
)
on conflict (zone_id) do update set
  min_lat = excluded.min_lat, min_lng = excluded.min_lng,
  max_lat = excluded.max_lat, max_lng = excluded.max_lng;
