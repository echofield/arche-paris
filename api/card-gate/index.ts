/**
 * ARCHÉ — Card Gate proxy base route
 * Minimal version to debug BOOT_ERROR
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const projectId = process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!projectId) {
    return res.status(500).json({ error: 'SUPABASE_PROJECT_ID not set' });
  }

  const supabaseUrl = `https://${projectId}.supabase.co/functions/v1/card-gate`;

  try {
    const response = await fetch(supabaseUrl, {
      method: req.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || `Bearer ${anonKey}`,
        ...(req.headers.cookie ? { 'Cookie': req.headers.cookie } : {}),
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();

    // Forward Set-Cookie
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    return res.status(response.status).send(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
