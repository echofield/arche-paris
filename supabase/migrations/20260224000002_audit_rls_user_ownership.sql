-- AUDIT 2025-02-23: Add full owner RLS policies and indexes for user_id tables.
-- Tables already have RLS enabled and SELECT-only policies; this adds INSERT/UPDATE/DELETE
-- and ensures GRANTs + supportive indexes. Zone_progress and zone_inscriptions already
-- have FOR ALL in 20260217000008; skipped here.

-- Helper: grant and policies for a single table (user_id uuid)
-- We keep existing read policies and add insert/update/delete.

-- user_zone_state
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_zone_state TO authenticated;
DROP POLICY IF EXISTS user_zone_state_read ON public.user_zone_state;
CREATE POLICY "user_zone_state owners select" ON public.user_zone_state FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "user_zone_state owners insert" ON public.user_zone_state FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "user_zone_state owners update" ON public.user_zone_state FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "user_zone_state owners delete" ON public.user_zone_state FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_user_zone_state_user_id ON public.user_zone_state(user_id);

-- ritual_runs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ritual_runs TO authenticated;
DROP POLICY IF EXISTS ritual_runs_read ON public.ritual_runs;
CREATE POLICY "ritual_runs owners select" ON public.ritual_runs FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "ritual_runs owners insert" ON public.ritual_runs FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "ritual_runs owners update" ON public.ritual_runs FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "ritual_runs owners delete" ON public.ritual_runs FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_ritual_runs_user_id ON public.ritual_runs(user_id);

-- engravings
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engravings TO authenticated;
DROP POLICY IF EXISTS engravings_read ON public.engravings;
CREATE POLICY "engravings owners select" ON public.engravings FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "engravings owners insert" ON public.engravings FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "engravings owners update" ON public.engravings FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "engravings owners delete" ON public.engravings FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_engravings_user_id ON public.engravings(user_id);

-- zone_engravings
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zone_engravings TO authenticated;
DROP POLICY IF EXISTS zone_engravings_read ON public.zone_engravings;
CREATE POLICY "zone_engravings owners select" ON public.zone_engravings FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "zone_engravings owners insert" ON public.zone_engravings FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "zone_engravings owners update" ON public.zone_engravings FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "zone_engravings owners delete" ON public.zone_engravings FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_zone_engravings_user_id ON public.zone_engravings(user_id);

-- user_complexion
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_complexion TO authenticated;
DROP POLICY IF EXISTS user_complexion_read ON public.user_complexion;
CREATE POLICY "user_complexion owners select" ON public.user_complexion FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "user_complexion owners insert" ON public.user_complexion FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "user_complexion owners update" ON public.user_complexion FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "user_complexion owners delete" ON public.user_complexion FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_user_complexion_user_id ON public.user_complexion(user_id);

-- complexion_deltas
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complexion_deltas TO authenticated;
DROP POLICY IF EXISTS complexion_deltas_read ON public.complexion_deltas;
CREATE POLICY "complexion_deltas owners select" ON public.complexion_deltas FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "complexion_deltas owners insert" ON public.complexion_deltas FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "complexion_deltas owners update" ON public.complexion_deltas FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "complexion_deltas owners delete" ON public.complexion_deltas FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_complexion_deltas_user_id ON public.complexion_deltas(user_id);

-- paths
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paths TO authenticated;
DROP POLICY IF EXISTS paths_read ON public.paths;
CREATE POLICY "paths owners select" ON public.paths FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "paths owners insert" ON public.paths FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "paths owners update" ON public.paths FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "paths owners delete" ON public.paths FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_paths_user_id ON public.paths(user_id);

-- challenges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
DROP POLICY IF EXISTS challenges_read ON public.challenges;
CREATE POLICY "challenges owners select" ON public.challenges FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "challenges owners insert" ON public.challenges FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "challenges owners update" ON public.challenges FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "challenges owners delete" ON public.challenges FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON public.challenges(user_id);

-- challenge_attempts
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_attempts TO authenticated;
DROP POLICY IF EXISTS challenge_attempts_read ON public.challenge_attempts;
CREATE POLICY "challenge_attempts owners select" ON public.challenge_attempts FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "challenge_attempts owners insert" ON public.challenge_attempts FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "challenge_attempts owners update" ON public.challenge_attempts FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "challenge_attempts owners delete" ON public.challenge_attempts FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_user_id ON public.challenge_attempts(user_id);

-- personal_bests
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_bests TO authenticated;
DROP POLICY IF EXISTS personal_bests_read ON public.personal_bests;
CREATE POLICY "personal_bests owners select" ON public.personal_bests FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "personal_bests owners insert" ON public.personal_bests FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "personal_bests owners update" ON public.personal_bests FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "personal_bests owners delete" ON public.personal_bests FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_personal_bests_user_id ON public.personal_bests(user_id);

-- zone_resonance
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zone_resonance TO authenticated;
DROP POLICY IF EXISTS zone_resonance_read ON public.zone_resonance;
CREATE POLICY "zone_resonance owners select" ON public.zone_resonance FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "zone_resonance owners insert" ON public.zone_resonance FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "zone_resonance owners update" ON public.zone_resonance FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "zone_resonance owners delete" ON public.zone_resonance FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_zone_resonance_user_id ON public.zone_resonance(user_id);

-- zone_custodians
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zone_custodians TO authenticated;
DROP POLICY IF EXISTS zone_custodians_read ON public.zone_custodians;
CREATE POLICY "zone_custodians owners select" ON public.zone_custodians FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "zone_custodians owners insert" ON public.zone_custodians FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "zone_custodians owners update" ON public.zone_custodians FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "zone_custodians owners delete" ON public.zone_custodians FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_zone_custodians_user_id ON public.zone_custodians(user_id);
