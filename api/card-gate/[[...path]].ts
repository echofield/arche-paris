/**
 * ARCHÉ — Card Gate proxy (Vercel Edge Function).
 * Catch-all route: handles /api/card-gate and /api/card-gate/*
 */

export const config = {
  runtime: 'edge',
};

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

function getPath(request: Request): string {
  const url = new URL(request.url);
  const pathname = url.pathname || '';
  const prefix = '/api/card-gate';
  if (pathname.startsWith(prefix)) {
    const rest = pathname.slice(prefix.length).replace(/^\//, '');
    return rest;
  }
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

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  // Debug: return config status if env not set
  if (!SUPABASE_BASE) {
    return new Response(JSON.stringify({
      error: 'Proxy not configured',
      hasProjectId: !!SUPABASE_PROJECT_ID,
      hasAnonKey: !!SUPABASE_ANON_KEY,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  const path = getPath(request);
  const url = new URL(request.url);
  const target = new URL(path ? `${SUPABASE_BASE}/${path}` : SUPABASE_BASE);

  // Forward query params (except internal ones)
  url.searchParams.forEach((v, k) => {
    if (k !== 'path') target.searchParams.set(k, v);
  });

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
    return json500(origin, `Upstream error: ${msg}`);
  }

  const text = await upstream.text();
  const res = new Response(text, { status: upstream.status });

  // Set CORS headers
  for (const [k, v] of Object.entries(corsHeaders(origin))) {
    res.headers.set(k, v);
  }

  // Forward content-type
  const ct = upstream.headers.get('Content-Type');
  if (ct) res.headers.set('Content-Type', ct);

  // Forward and harden Set-Cookie
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

// Named exports for Edge Runtime
export async function GET(request: Request) {
  try {
    return await handleRequest(request);
  } catch (e) {
    return json500(request.headers.get('Origin'), `Error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function POST(request: Request) {
  try {
    return await handleRequest(request);
  } catch (e) {
    return json500(request.headers.get('Origin'), `Error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function PUT(request: Request) {
  try {
    return await handleRequest(request);
  } catch (e) {
    return json500(request.headers.get('Origin'), `Error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function PATCH(request: Request) {
  try {
    return await handleRequest(request);
  } catch (e) {
    return json500(request.headers.get('Origin'), `Error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function DELETE(request: Request) {
  try {
    return await handleRequest(request);
  } catch (e) {
    return json500(request.headers.get('Origin'), `Error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('Origin')),
  });
}
