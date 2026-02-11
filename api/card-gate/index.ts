/**
 * ARCHÉ — Card Gate proxy base route (Vercel Serverless - Node.js runtime).
 * Handles /api/card-gate (no subpath)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID ?? process.env.VITE_SUPABASE_PROJECT_ID ?? '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';

const SUPABASE_BASE = SUPABASE_PROJECT_ID
  ? `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/card-gate`
  : '';

const ALLOWED_ORIGIN = 'https://www.xn--arch-paris-e7a.com';

function setCorsHeaders(res: VercelResponse, origin: string | undefined): void {
  const allowedOrigin = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string | undefined;

  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, origin);
    return res.status(204).end();
  }

  setCorsHeaders(res, origin);

  if (!SUPABASE_BASE) {
    return res.status(500).json({
      error: 'Proxy not configured',
      hint: 'Set SUPABASE_PROJECT_ID and SUPABASE_ANON_KEY in Vercel env vars',
    });
  }

  const method = req.method || 'GET';
  const hasBody = !['GET', 'HEAD'].includes(method);
  const authHeader = req.headers.authorization;
  const authorization = authHeader || (SUPABASE_ANON_KEY ? `Bearer ${SUPABASE_ANON_KEY}` : '');
  const cookie = req.headers.cookie || '';

  try {
    const upstream = await fetch(SUPABASE_BASE, {
      method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        ...(authorization ? { Authorization: authorization } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: hasBody ? JSON.stringify(req.body) : undefined,
    });

    const text = await upstream.text();
    const ct = upstream.headers.get('Content-Type');
    if (ct) res.setHeader('Content-Type', ct);

    const setCookie = upstream.headers.get('Set-Cookie');
    if (setCookie) {
      const hardened = setCookie
        .replace(/;\s*Domain=[^;]+/gi, '')
        .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
        + (setCookie.toLowerCase().includes('httponly') ? '' : '; HttpOnly')
        + (setCookie.toLowerCase().includes('secure') ? '' : '; Secure');
      res.setHeader('Set-Cookie', hardened);
    }

    return res.status(upstream.status).send(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: `Upstream error: ${msg}` });
  }
}
