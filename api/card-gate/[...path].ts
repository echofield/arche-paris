/**
 * ARCHÉ — Card Gate proxy catch-all route
 * Handles /api/card-gate/*
 * No imports version to debug BOOT_ERROR
 */

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

  // Get subpath from catch-all param
  const pathParam = req.query.path;
  const subPath = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam || '');
  const supabaseUrl = `https://${projectId}.supabase.co/functions/v1/card-gate/${subPath}`;

  try {
    const response = await fetch(supabaseUrl, {
      method: req.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || `Bearer ${anonKey}`,
        ...(req.headers.cookie ? { 'Cookie': req.headers.cookie as string } : {}),
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    return res.status(response.status).send(data);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
