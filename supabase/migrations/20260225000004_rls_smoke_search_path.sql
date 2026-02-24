-- Correctif search_path pour les fonctions canari (si 20260225000002 / 20260225000003 déjà appliquées).
-- Idempotent : exécuter après db push pour garantir SET search_path = public, pg_temp.

ALTER FUNCTION public.get_rls_smoke_status_v2(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_rls_smoke_status_multi(text[]) SET search_path = public, pg_temp;
