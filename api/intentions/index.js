/**
 * /api/intentions - API for intentions (missions/campaigns)
 * GET - List intentions or get by key (?key=arche-paris-q1)
 * POST - Create intention
 */

const { createClient } = require('@supabase/supabase-js');

const DEFAULT_PROJECT_ID = 'qvyrpzgxsppkwfvqvgcn';

function buildSupabaseUrl() {
  const explicitUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  if (explicitUrl) return explicitUrl.replace(/\/+$/, '');
  const projectId = process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID || DEFAULT_PROJECT_ID;
  return `https://${projectId}.supabase.co`;
}

function getSupabaseClient() {
  const url = buildSupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  return createClient(url, serviceKey);
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const supabase = getSupabaseClient();

  try {
    if (req.method === 'GET') {
      // Get by key or list all
      if (req.query.key) {
        const { data, error } = await supabase
          .from('intentions')
          .select('*')
          .eq('key', req.query.key)
          .single();

        if (error) {
          return res.status(404).json({ error: 'Intention not found', details: error.message });
        }
        return res.status(200).json(data);
      }

      // List all
      const { data, error } = await supabase
        .from('intentions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ intentions: data || [] });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      const { data, error } = await supabase
        .from('intentions')
        .insert({
          key: body.key,
          name: body.name,
          description: body.description || null,
          status: body.status || 'active',
          start_date: body.start_date || null,
          end_date: body.end_date || null,
          metadata: body.metadata || {},
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(201).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
};

module.exports.config = {
  api: { bodyParser: true },
};
