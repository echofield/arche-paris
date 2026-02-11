/**
 * /api/card-gate/pair - proxy to Supabase (no async/await)
 */

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const projectId = process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!projectId) {
    return res.status(500).json({ error: 'SUPABASE_PROJECT_ID not set' });
  }

  const url = `https://${projectId}.supabase.co/functions/v1/card-gate/pair`;

  fetch(url, {
    method: req.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': req.headers.authorization || `Bearer ${anonKey}`,
      ...(req.headers.cookie ? { 'Cookie': req.headers.cookie } : {}),
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  })
    .then((response: any) => {
      return response.text().then((data: string) => {
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          res.setHeader('Set-Cookie', setCookie);
        }
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
        res.status(response.status).send(data);
      });
    })
    .catch((err: any) => {
      res.status(500).json({ error: err?.message || String(err) });
    });
}
