/**
 * ARCHÉ — Card Gate proxy base route
 * Handles /api/card-gate
 */

const https = require('https');

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

  const body = req.method !== 'GET' && req.body ? JSON.stringify(req.body) : null;

  const options = {
    hostname: `${projectId}.supabase.co`,
    port: 443,
    path: `/functions/v1/card-gate`,
    method: req.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': req.headers.authorization || `Bearer ${anonKey}`,
      ...(req.headers.cookie ? { 'Cookie': req.headers.cookie } : {}),
      ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
    },
  };

  const proxyReq = https.request(options, (proxyRes: any) => {
    let data = '';
    proxyRes.on('data', (chunk: any) => { data += chunk; });
    proxyRes.on('end', () => {
      const setCookie = proxyRes.headers['set-cookie'];
      if (setCookie) {
        res.setHeader('Set-Cookie', setCookie);
      }
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/json');
      res.status(proxyRes.statusCode || 500).send(data);
    });
  });

  proxyReq.on('error', (err: any) => {
    res.status(500).json({ error: err.message });
  });

  if (body) {
    proxyReq.write(body);
  }
  proxyReq.end();
}
