/**
 * ARCHÉ — Card Gate proxy (Vercel Serverless).
 * Single file at /api/card-gate-proxy. Rewrites send /api/card-gate and /api/card-gate/* here
 * with path in query param so we forward to Supabase.
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

/** Path from query (rewrite) or from pathname (/api/card-gate/xxx). */
function getPath(request: Request): string {
  const url = new URL(request.url ?? '', 'https://x');
  const fromQuery = url.searchParams.get('path');
  if (fromQuery != null && fromQuery !== '') return fromQuery;
  const pathname = url.pathname || '';
  const prefix = '/api/card-gate';
  if (pathname.startsWith(prefix)) {
    const rest = pathname.slice(prefix.length).replace(/^\//, '');
    return rest;
  }
  const prefixProxy = '/api/card-gate-proxy';
  if (pathname.startsWith(prefixProxy)) return '';
  return '';
}

function json500(origin: string | null, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

async function handleRequest(request: Request): Promise<Response> {
  const origin = request.headers.get('Origin');

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  if (!SUPABASE_BASE) {
    return json500(
      origin,
      'Card Gate proxy not configured. Set SUPABASE_PROJECT_ID and SUPABASE_ANON_KEY in Vercel (Production).'
    );
  }

  const path = getPath(request);
  const url = new URL(request.url ?? '', 'https://x');
  const target = new URL(path ? `${SUPABASE_BASE}/${path}` : SUPABASE_BASE);
  const forwardParams = new URLSearchParams(url.searchParams);
  forwardParams.delete('path');
  target.search = forwardParams.toString();

  const method = request.method.toUpperCase();
  const hasBody = !['GET', 'HEAD'].includes(method);
  const incomingCookie = request.headers.get('Cookie') ?? '';
  const authHeader = request.headers.get('Authorization');
  const authorization = authHeader || (SUPABASE_ANON_KEY ? `Bearer ${SUPABASE_ANON_KEY}` : '');

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') ?? 'application/json',
        ...(authorization ? { Authorization: authorization } : {}),
        ...(incomingCookie ? { Cookie: incomingCookie } : {}),
      },
      body: hasBody ? await request.text() : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json500(origin, `Proxy upstream error: ${msg}`);
  }

  const text = await upstream.text();
  const res = new Response(text, { status: upstream.status });

  for (const [k, v] of Object.entries(corsHeaders(origin))) {
    res.headers.set(k, v);
  }

  const ct = upstream.headers.get('Content-Type');
  if (ct) res.headers.set('Content-Type', ct);

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

function withCatch(request: Request, fn: () => Promise<Response>): Promise<Response> {
  return fn().catch((e) => {
    const msg = e instanceof Error ? e.message : String(e);
    return json500(request.headers.get('Origin'), `Proxy error: ${msg}`);
  });
}

export async function GET(request: Request) {
  return withCatch(request, () => handleRequest(request));
}
export async function POST(request: Request) {
  return withCatch(request, () => handleRequest(request));
}
export async function PUT(request: Request) {
  return withCatch(request, () => handleRequest(request));
}
export async function PATCH(request: Request) {
  return withCatch(request, () => handleRequest(request));
}
export async function DELETE(request: Request) {
  return withCatch(request, () => handleRequest(request));
}
export async function OPTIONS(request: Request) {
  return withCatch(request, () => handleRequest(request));
}
