/**
 * ARCHÉ — Card Gate proxy (Vercel Serverless).
 * Forwards browser requests to Supabase card-gate to avoid CORS (gateway returns *).
 * Reflects Set-Cookie to our domain so refresh token works.
 */

const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID ?? process.env.VITE_SUPABASE_PROJECT_ID ?? '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';

const SUPABASE_BASE = SUPABASE_PROJECT_ID
  ? `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/card-gate`
  : '';

const ALLOWED_ORIGIN = 'https://www.xn--arch-paris-e7a.com';

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

function getPathFromRequest(req: { url?: string }): string {
  try {
    const url = new URL(req.url ?? '', 'https://x');
    const pathname = url.pathname || '';
    const prefix = '/api/card-gate';
    if (pathname.startsWith(prefix)) {
      const rest = pathname.slice(prefix.length).replace(/^\//, '');
      return rest;
    }
  } catch (_) {}
  return '';
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  if (!SUPABASE_BASE) {
    return new Response(JSON.stringify({ error: 'Card Gate proxy not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  const path = getPathFromRequest({ url: req.url });
  const url = new URL(req.url ?? '', 'https://x');
  const target = new URL(`${SUPABASE_BASE}/${path}`);
  target.search = url.search;

  const method = req.method.toUpperCase();
  const hasBody = !['GET', 'HEAD'].includes(method);
  const incomingCookie = req.headers.get('Cookie') ?? '';
  const authHeader = req.headers.get('Authorization');
  const authorization = authHeader || (SUPABASE_ANON_KEY ? `Bearer ${SUPABASE_ANON_KEY}` : '');

  const upstream = await fetch(target.toString(), {
    method,
    headers: {
      'Content-Type': req.headers.get('Content-Type') ?? 'application/json',
      ...(authorization ? { Authorization: authorization } : {}),
      ...(incomingCookie ? { Cookie: incomingCookie } : {}),
    },
    body: hasBody ? await req.text() : undefined,
  });

  const text = await upstream.text();
  const res = new Response(text, { status: upstream.status });

  // Set CORS ourselves (do not forward Supabase headers; they may contain *)
  for (const [k, v] of Object.entries(corsHeaders(origin))) {
    res.headers.set(k, v);
  }

  const ct = upstream.headers.get('Content-Type');
  if (ct) res.headers.set('Content-Type', ct);

  // Reflect Set-Cookie from Supabase to our domain (so browser sends it back to proxy)
  const setCookie = upstream.headers.get('Set-Cookie');
  if (setCookie) {
    const hardened = setCookie
      .replace(/;\s*Domain=[^;]+/gi, '')
      .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
      + (setCookie.toLowerCase().includes('httponly') ? '' : '; HttpOnly')
      + (setCookie.toLowerCase().includes('secure') ? '' : '; Secure');
    res.headers.set('Set-Cookie', hardened);
  }

  return res;
}
