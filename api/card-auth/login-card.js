/**
 * /api/card-auth/login-card - proxy to Supabase Edge Function.
 */

const JSON_UTF8 = 'application/json; charset=utf-8';

function setJsonUtf8(res) {
  res.setHeader('Content-Type', JSON_UTF8);
}

function normalizeContentType(contentType) {
  const value = (contentType || '').toLowerCase();
  if (!value.includes('application/json')) return contentType || 'text/plain; charset=utf-8';
  if (value.includes('charset=')) return contentType;
  return JSON_UTF8;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const projectId = process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!projectId || !anonKey) {
    setJsonUtf8(res);
    return res.status(500).json({ error: 'Missing Supabase env vars' });
  }

  const url = `https://${projectId}.supabase.co/functions/v1/make-server-9060b10a/login-card`;
  const body = req.body
    ? typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body)
    : undefined;

  try {
    const upstream = await fetch(url, {
      method: req.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body,
    });

    const text = await upstream.text();
    res.setHeader('Content-Type', normalizeContentType(upstream.headers.get('content-type')));
    return res.status(upstream.status).send(text);
  } catch (error) {
    setJsonUtf8(res);
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Proxy failure' });
  }
};
