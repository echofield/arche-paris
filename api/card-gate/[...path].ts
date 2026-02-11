/**
 * ARCHÉ — Card Gate proxy catch-all route
 * Minimal test - no imports
 */

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Just return debug info to see if function boots
  const pathParam = req.query.path;
  const subPath = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam || '');

  return res.status(200).json({
    boot: 'ok',
    path: subPath,
    method: req.method,
    hasProjectId: !!(process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID),
  });
}
