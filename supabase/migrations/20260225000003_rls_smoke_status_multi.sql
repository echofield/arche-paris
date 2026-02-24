-- Agrégat RLS multi-schémas : appelle public.get_rls_smoke_status_v2(s) pour chaque schéma.
-- Retourne ok global (false si au moins un schéma en échec) + détail par schéma.

CREATE OR REPLACE FUNCTION public._rls_smoke_normalize_schemas(schemas text[])
RETURNS text[]
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(ARRAY_AGG(DISTINCT s), ARRAY[]::text[]), ARRAY['public'])
  FROM unnest(COALESCE(schemas, ARRAY['public'])) AS s
  WHERE btrim(s) <> '';
$$;

CREATE OR REPLACE FUNCTION public.get_rls_smoke_status_multi(schemas text[] DEFAULT ARRAY['public'])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  norm_schemas text[];
  s text;
  per_schema jsonb := '{}'::jsonb;
  result jsonb;
  payload jsonb;
  is_ok boolean := true;
BEGIN
  norm_schemas := public._rls_smoke_normalize_schemas(schemas);

  FOREACH s IN ARRAY norm_schemas LOOP
    EXECUTE 'SELECT public.get_rls_smoke_status_v2($1)::jsonb' INTO payload USING s;

    IF payload IS NULL THEN
      payload := jsonb_build_object('ok', false, 'error', 'no_payload', 'schema', s);
    END IF;

    per_schema := per_schema || jsonb_build_object(s, payload);

    IF COALESCE((payload->>'ok')::boolean, false) = false THEN
      is_ok := false;
    END IF;
  END LOOP;

  result := jsonb_build_object(
    'ok', is_ok,
    'schemas', per_schema,
    'meta', jsonb_build_object(
      'checked', to_jsonb(norm_schemas),
      'generated_at', to_jsonb(now())
    )
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public._rls_smoke_normalize_schemas(text[]) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_rls_smoke_status_multi(text[]) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_rls_smoke_status_multi(text[]) TO service_role;

COMMENT ON FUNCTION public.get_rls_smoke_status_multi(text[]) IS
  'Canari RLS multi-schémas. Appelle get_rls_smoke_status_v2 par schéma. ok=false si au moins un schéma en échec.';
