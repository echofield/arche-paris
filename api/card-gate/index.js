/**
 * /api/card-gate - unified proxy to Supabase Edge Function /functions/v1/card-gate/*
 * Uses rewrite from /api/card-gate/:path* -> /api/card-gate?path=:path*
 */

const DEFAULT_PROJECT_ID = 'qvyrpzgxsppkwfvqvgcn';
const ALLOWED_ORIGINS = new Set([
  'https://arche-paris.com',
  'https://www.arche-paris.com',
  'https://xn--arch-paris-e7a.com',
  'https://www.xn--arch-paris-e7a.com',
]);

const JSON_UTF8 = 'application/json; charset=utf-8';

function isOriginAllowed(origin) {
  if (!origin || typeof origin !== 'string') return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (origin === 'http://localhost:5173' || origin === 'http://localhost:3000') return true;
  if (origin.startsWith('http://127.0.0.1:')) return true;
  if ((origin.startsWith('https://') || origin.startsWith('http://')) && origin.endsWith('.vercel.app')) return true;
  if ((origin.startsWith('https://') || origin.startsWith('http://')) && origin.endsWith('.netlify.app')) return true;
  return false;
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, apikey, X-ARCHE-CARD-CODE, X-ARCHE-SESSION');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
}

function setJsonUtf8(res) {
  res.setHeader('Content-Type', JSON_UTF8);
}

function normalizeContentType(contentType) {
  const value = (contentType || '').toLowerCase();
  if (!value.includes('application/json')) return contentType || 'text/plain; charset=utf-8';
  if (value.includes('charset=')) return contentType;
  return JSON_UTF8;
}

function buildSupabaseBase() {
  const explicitUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  if (explicitUrl) return explicitUrl.replace(/\/+$/, '');

  const projectId =
    process.env.SUPABASE_PROJECT_ID ||
    process.env.VITE_SUPABASE_PROJECT_ID ||
    DEFAULT_PROJECT_ID;
  return `https://${projectId}.supabase.co`;
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  if (!chunks.length) return undefined;
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  applyCors(req, res);
  const origin = req.headers.origin;
  if (origin && !isOriginAllowed(origin)) {
    setJsonUtf8(res);
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const supabaseBase = buildSupabaseBase();
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const pathRaw = Array.isArray(req.query.path)
    ? req.query.path.join('/')
    : typeof req.query.path === 'string'
      ? req.query.path
      : '';
  const proxiedPath = pathRaw.replace(/^\/+/, '');
  if (!proxiedPath) {
    setJsonUtf8(res);
    return res.status(200).json({
      status: 'Card Gate proxy active',
      target: `${supabaseBase}/functions/v1/card-gate`,
      nodeVersion: process.version,
    });
  }

  const rawQuery = req.url.includes('?') ? req.url.slice(req.url.indexOf('?') + 1) : '';
  const filteredQuery = rawQuery
    .split('&')
    .filter((part) => part && !part.startsWith('path='))
    .join('&');
  const qs = filteredQuery ? `?${filteredQuery}` : '';
  const isZoneConsciousness = proxiedPath === 'zone-consciousness';
  const isPlaceScan = proxiedPath === 'place-scan';
  const targetUrl = isZoneConsciousness
    ? `${supabaseBase}/functions/v1/zone-consciousness${qs}`
    : isPlaceScan
      ? `${supabaseBase}/functions/v1/place-scan${qs}`
      : `${supabaseBase}/functions/v1/card-gate/${proxiedPath}${qs}`;

  const outgoingHeaders = {};
  const passHeaders = ['authorization', 'content-type', 'cookie', 'x-forwarded-for', 'user-agent', 'x-arche-card-code', 'x-arche-session'];
  for (const name of passHeaders) {
    const value = req.headers[name];
    if (typeof value === 'string') outgoingHeaders[name] = value;
  }
  if (anonKey) {
    outgoingHeaders.apikey = anonKey;
    if (!outgoingHeaders.authorization) outgoingHeaders.authorization = `Bearer ${anonKey}`;
  }

  const hasBody = !['GET', 'HEAD'].includes(req.method || 'GET');
  let body;
  if (hasBody) {
    if (req.body != null) {
      body =
        typeof req.body === 'string' || Buffer.isBuffer(req.body)
          ? req.body
          : JSON.stringify(req.body);
    } else {
      body = await readRawBody(req);
    }
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: outgoingHeaders,
      body,
    });
    const setCookies =
      typeof upstream.headers.getSetCookie === 'function'
        ? upstream.headers.getSetCookie()
        : (upstream.headers.get('set-cookie') ? [upstream.headers.get('set-cookie')] : []);
    const cacheControl = upstream.headers.get('cache-control');
    const methodUpper = (req.method || 'GET').toUpperCase();
    const cacheEligibleRead = methodUpper === 'GET' && (proxiedPath === 'map-state' || proxiedPath === 'map-state/community');
    if (setCookies.length && !cacheEligibleRead) res.setHeader('Set-Cookie', setCookies);
    let effectiveCacheControl = cacheControl || null;
    let cachePolicyLabel = 'upstream';
    if (methodUpper === 'GET') {
      if (proxiedPath === 'map-state/community') {
        effectiveCacheControl = 'public, s-maxage=60, stale-while-revalidate=600';
        cachePolicyLabel = 'proxy-public-community';
        res.setHeader('CDN-Cache-Control', 's-maxage=60, stale-while-revalidate=600');
        res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=60, stale-while-revalidate=600');
      } else if (proxiedPath === 'map-state') {
        res.setHeader('Vary', 'Authorization, X-ARCHE-CARD-CODE, X-ARCHE-SESSION');
        const hasRuntimeIdentity = Boolean(req.headers.authorization || req.headers['x-arche-card-code'] || req.headers['x-arche-session']);
        if (hasRuntimeIdentity) {
          effectiveCacheControl = 'private, no-store';
          res.removeHeader('CDN-Cache-Control');
          res.removeHeader('Vercel-CDN-Cache-Control');
          cachePolicyLabel = 'proxy-private-map';
        } else {
          effectiveCacheControl = 'public, s-maxage=60, stale-while-revalidate=600';
          res.setHeader('CDN-Cache-Control', 's-maxage=60, stale-while-revalidate=600');
          res.setHeader('Vercel-CDN-Cache-Control', 's-maxage=60, stale-while-revalidate=600');
          cachePolicyLabel = 'proxy-public-map';
        }
      }
    }
    if (effectiveCacheControl) {
      res.removeHeader('Cache-Control');
      res.setHeader('Cache-Control', effectiveCacheControl);
    }
    res.setHeader('X-Card-Gate-Proxy-Path', proxiedPath || '(root)');
    res.setHeader('X-Card-Gate-Cache-Policy', cachePolicyLabel);
    res.setHeader('Content-Type', normalizeContentType(upstream.headers.get('content-type')));
    const text = await upstream.text();
    if (proxiedPath === 'pair' && upstream.status === 200) {
      console.warn('[card-gate] /pair 200 body length:', text.length, 'preview:', text.slice(0, 80));
    }
    return res.status(upstream.status).send(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy failure';
    setJsonUtf8(res);
    return res.status(502).json({ error: message });
  }
};

module.exports.config = {
  api: { bodyParser: false, externalResolver: true },
};
