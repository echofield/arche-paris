-- AUDIT 2025-02-23: Enable RLS on remaining service-managed tables (no authenticated policies).
-- Apply after 20260224000001 if activation_codes, vaults, journal_entries, rate_limits exist.
-- Access via service_role only (Edge Functions / Card Gate).

ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
