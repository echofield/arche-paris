/**
 * ARCHÉ — Card Gate proxy base route
 * Diagnostic version
 */

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const diagnostics = {
    nodeVersion: process.version,
    hasFetch: typeof fetch !== 'undefined',
    hasGlobalFetch: typeof globalThis.fetch !== 'undefined',
    route: 'index',
    method: req.method,
    hasProjectId: !!(process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID),
  };

  return res.status(200).json(diagnostics);
}
