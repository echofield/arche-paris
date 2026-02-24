/**
 * Canari RLS — multi-schémas + auth X-API-Key.
 * GET ?schemas=public,storage ou ?schema=public → 200 si ok global, 500 sinon. 401 si clé invalide.
 * Codes JSON stables: invalid_api_key | rpc_error | schemas_failed | invalid_input | too_many_schemas | method_not_allowed | url_too_long.
 * Réponse 200/500 inclut meta.duration_ms, meta.checked_count, meta.tables_scanned (suivi dans le temps).
 * Réponse inclut request_id (uuid v4) pour corrélation logs CI ↔ Edge ↔ Postgres.
 * Secrets: RLS_SMOKE_API_KEY (partagé avec CI). SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (auto).
 */

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const MAX_SCHEMAS = 20;
const MAX_URL_LENGTH = 2048;

type SchemaResult = { total_tables_tested?: number; [k: string]: unknown };
type SmokePayload = {
  ok: boolean;
  schemas: Record<string, SchemaResult>;
  meta: { checked: string[]; generated_at: string; duration_ms?: number; checked_count?: number; tables_scanned?: number };
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EXPECTED_API_KEY = Deno.env.get("RLS_SMOKE_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

function jsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Canary": "rls-smoke",
      ...corsHeaders,
    },
  });
}

function withRequestId<T extends object>(requestId: string, body: T): T & { request_id: string } {
  return { ...body, request_id: requestId };
}

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return jsonResponse(
      withRequestId(requestId, { ok: false, code: "method_not_allowed", error: "Method not allowed" }),
      405
    );
  }

  const apiKey = req.headers.get("X-API-Key") ?? "";
  if (!EXPECTED_API_KEY || apiKey !== EXPECTED_API_KEY) {
    return jsonResponse(
      withRequestId(requestId, {
        ok: false,
        code: "invalid_api_key",
        error: "unauthorized",
        detail: "invalid_api_key",
      }),
      401
    );
  }

  const url = new URL(req.url);
  if (req.url.length > MAX_URL_LENGTH) {
    return jsonResponse(
      withRequestId(requestId, {
        ok: false,
        code: "url_too_long",
        error: "Request URI too long",
        detail: { max: MAX_URL_LENGTH, received: req.url.length },
      }),
      414
    );
  }

  const schemasParam = url.searchParams.get("schemas");
  const schemaParam = url.searchParams.get("schema");
  const schemas = schemasParam
    ? schemasParam.split(",").map((s) => s.trim()).filter(Boolean)
    : [schemaParam?.trim() || "public"];

  if (schemas.length === 0) {
    return jsonResponse(
      withRequestId(requestId, {
        ok: false,
        code: "invalid_input",
        error: "Empty schemas list",
      }),
      400
    );
  }
  if (schemas.length > MAX_SCHEMAS) {
    return jsonResponse(
      withRequestId(requestId, {
        ok: false,
        code: "too_many_schemas",
        error: `At most ${MAX_SCHEMAS} schemas allowed`,
        detail: { requested: schemas.length, max: MAX_SCHEMAS },
      }),
      400
    );
  }

  const t0 = Date.now();
  const { data, error } = await supabase.rpc("get_rls_smoke_status_multi", { schemas });
  const duration_ms = Date.now() - t0;

  if (error) {
    return jsonResponse(
      withRequestId(requestId, {
        ok: false,
        code: "rpc_error",
        error: "rpc_error",
        detail: error.message,
        input: { schemas },
        meta: { duration_ms },
      }),
      500
    );
  }

  const payload = data as SmokePayload;
  const ok = !!payload?.ok;
  const status = ok ? 200 : 500;
  const checked = payload?.meta?.checked ?? schemas;
  const checked_count = checked.length;
  const tables_scanned = Object.values(payload?.schemas ?? {}).reduce(
    (sum, s) => sum + (Number((s as SchemaResult).total_tables_tested) || 0),
    0
  );
  const meta = {
    ...(payload?.meta ?? {}),
    checked,
    generated_at: payload?.meta?.generated_at ?? new Date().toISOString(),
    duration_ms,
    checked_count,
    tables_scanned,
  };
  const body = {
    ...(payload ?? { ok: false, schemas: {} }),
    meta,
  };
  const responseBody = ok ? withRequestId(requestId, body) : withRequestId(requestId, { ...body, code: "schemas_failed" });

  console.info(JSON.stringify({ request_id: requestId, schemas, ok, duration_ms, checked_count, tables_scanned }));

  return jsonResponse(responseBody, status);
});
