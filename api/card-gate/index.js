/**
 * /api/card-gate - unified proxy to Supabase Edge Function /functions/v1/card-gate/*
 * Uses rewrite from /api/card-gate/:path* -> /api/card-gate?path=:path*
 */

const DEFAULT_PROJECT_ID = 'qvyrpzgxsppkwfvqvgcn';

function buildSupabaseBase() {
  const explicitUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  if (explicitUrl) return explicitUrl.replace(/\/+$/, '');

  const projectId =
    process.env.SUPABASE_PROJECT_ID ||
    process.env.VITE_SUPABASE_PROJECT_ID ||
    DEFAULT_PROJECT_ID;
  return `https://${projectId}.supabase.co`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, apikey, X-ARCHE-CARD-CODE, X-ARCHE-SESSION');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const supabaseBase = buildSupabaseBase();
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const pathRaw = typeof req.query.path === 'string' ? req.query.path : '';
  const proxiedPath = pathRaw.replace(/^\/+/, '');
  if (!proxiedPath) {
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
  const targetUrl = isZoneConsciousness
    ? `${supabaseBase}/functions/v1/zone-consciousness${qs}`
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
  const body =
    hasBody && req.body != null
      ? typeof req.body === 'string' || Buffer.isBuffer(req.body)
        ? req.body
        : JSON.stringify(req.body)
      : undefined;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: outgoingHeaders,
      body,
    });
    const setCookie = upstream.headers.get('set-cookie');
    const cacheControl = upstream.headers.get('cache-control');
    const methodUpper = (req.method || 'GET').toUpperCase();
    const cacheEligibleRead = methodUpper === 'GET' && (proxiedPath === 'map-state' || proxiedPath === 'map-state/community');
    if (setCookie && !cacheEligibleRead) res.setHeader('Set-Cookie', setCookie);
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
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    const text = await upstream.text();
    return res.status(upstream.status).send(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy failure';
    return res.status(502).json({ error: message });
  }
};
