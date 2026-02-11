/**
 * ARCHÉ — Card Gate proxy base route
 * Minimal test - no imports
 */

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return res.status(200).json({
    boot: 'ok',
    route: 'index',
    method: req.method,
    hasProjectId: !!(process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID),
  });
}
