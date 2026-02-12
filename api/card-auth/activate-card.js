/**
 * /api/card-auth/activate-card - proxy to Supabase Edge Function.
 */

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const projectId = process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!projectId || !anonKey) {
    return res.status(500).json({ error: 'Missing Supabase env vars' });
  }

  const url = `https://${projectId}.supabase.co/functions/v1/make-server-9060b10a/activate-card`;
  const body = req.body
    ? typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body)
    : undefined;

  const upstream = await fetch(url, {
    method: req.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body,
  });

  const text = await upstream.text();
  const contentType = upstream.headers.get('content-type') || 'application/json';
  res.setHeader('Content-Type', contentType);
  return res.status(upstream.status).send(text);
};
