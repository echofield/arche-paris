-- AUDIT 2025-02-23: Enable RLS on service-managed tables (no authenticated policies).
-- Access via service_role only (Edge Functions). Run via: supabase db push or SQL Editor.
-- See docs/RLS_AUDIT_2025_02_23.md for full checklist and optional blocks.

-- arche_rate_limits: used by consume_arche_rate_limit(); service only
ALTER TABLE public.arche_rate_limits ENABLE ROW LEVEL SECURITY;

-- Optional (uncomment if table exists): activation_codes, vaults, journal_entries, rate_limits
-- ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
