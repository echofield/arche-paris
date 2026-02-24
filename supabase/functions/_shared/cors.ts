/**
 * CORS headers for Edge Functions.
 * Supabase forwards OPTIONS to your function; you must return 200/204 + these headers.
 * No project-level CORS for Functions in dashboard — all in-code.
 *
 * Optional: set env CORS_ORIGIN (e.g. https://www.xn--arch-paris-e7a.com) to lock
 * Allow-Origin to that value instead of * (recommended when using credentials).
 */
const allowOrigin = Deno.env.get("CORS_ORIGIN") ?? "*";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": allowOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-arche-card-code",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
