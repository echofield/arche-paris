/**
 * /api/leads - CRUD API for leads management (OPÉRA)
 * GET - List leads (optional: ?intention_id=uuid&bucket=creators)
 * POST - Create a new lead
 */

const { createClient } = require('@supabase/supabase-js');

const DEFAULT_PROJECT_ID = 'qvyrpzgxsppkwfvqvgcn';
const ALLOWED_ORIGINS = new Set([
  'https://arche-paris.com',
  'https://www.arche-paris.com',
  'https://xn--arch-paris-e7a.com',
  'https://www.xn--arch-paris-e7a.com',
]);

const JSON_UTF8 = 'application/json; charset=utf-8';

function isOriginAllowed(origin) {
  if (!origin || typeof origin !== 'string') return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (origin === 'http://localhost:5173' || origin === 'http://localhost:3000') return true;
  if (origin.startsWith('http://127.0.0.1:')) return true;
  if ((origin.startsWith('https://') || origin.startsWith('http://')) && origin.endsWith('.vercel.app')) return true;
  return false;
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, apikey');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
}

function setJsonUtf8(res) {
  res.setHeader('Content-Type', JSON_UTF8);
}

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

/**
 * Normalize a name: lowercase, remove diacritics, replace spaces with underscores
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Map section names to bucket enum values
 */
function sectionToBucket(section) {
  if (!section) return 'other';
  const s = section.toLowerCase();
  if (s.includes('guide') || s.includes('monétisation')) return 'guides';
  if (s.includes('narrateur') || s.includes('créateur') || s.includes('déclencheur') || s.includes('transversa')) return 'creators';
  if (s.includes('hôtel') || s.includes('concierge')) return 'hotels_concierge';
  if (s.includes('culture officielle') || s.includes('amplificateur') || s.includes('institutionnel')) return 'other';
  if (s.includes('esthétique') || s.includes('lifestyle')) return 'experience_studios';
  if (s.includes('écosystème') || s.includes('interne') || s.includes('noyau')) return 'other';
  return 'other';
}

module.exports = async function handler(req, res) {
  applyCors(req, res);
  const origin = req.headers.origin;

  if (origin && !isOriginAllowed(origin)) {
    setJsonUtf8(res);
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const supabase = getSupabaseClient();
  setJsonUtf8(res);

  try {
    // GET: List leads
    if (req.method === 'GET') {
      let query = supabase
        .from('leads')
        .select('*, intentions(key, name)')
        .order('activation_phase', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      // Apply filters from query params
      if (req.query.intention_id) {
        query = query.eq('intention_id', req.query.intention_id);
      }
      if (req.query.intention_key) {
        // Join filter by intention key
        const { data: intention } = await supabase
          .from('intentions')
          .select('id')
          .eq('key', req.query.intention_key)
          .single();
        if (intention) {
          query = query.eq('intention_id', intention.id);
        }
      }
      if (req.query.bucket) {
        query = query.eq('bucket', req.query.bucket);
      }
      if (req.query.contact_status) {
        query = query.eq('contact_status', req.query.contact_status);
      }
      if (req.query.economic_role) {
        query = query.eq('economic_role', req.query.economic_role);
      }
      if (req.query.activation_phase) {
        query = query.eq('activation_phase', parseInt(req.query.activation_phase, 10));
      }

      const { data, error } = await query;

      if (error) {
        console.error('[leads] GET error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ leads: data || [], count: (data || []).length });
    }

    // POST: Create lead(s)
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      // Handle single lead or array of leads
      const leadsInput = Array.isArray(body) ? body : [body];

      // Resolve intention_id if intention_key is provided
      let intentionId = body.intention_id || null;
      if (body.intention_key && !intentionId) {
        const { data: intention } = await supabase
          .from('intentions')
          .select('id')
          .eq('key', body.intention_key)
          .single();
        intentionId = intention?.id || null;
      }

      const leadsToInsert = leadsInput.map((lead) => {
        const name = lead.name || (lead.handle ? lead.handle.replace(/^@/, '') : 'Unknown');
        return {
          name,
          normalized_name: normalizeName(name),
          handle: lead.handle?.replace(/^@/, '') || null,
          domain: lead.domain || null,
          email: lead.email || null,
          bucket: lead.bucket || sectionToBucket(lead.section),
          economic_role: lead.economic_role || 'partner',
          section: lead.section || null,
          value_prop: lead.value_prop || null,
          offer: lead.offer || null,
          contact_status: lead.contact_status || 'identified',
          next_action: lead.next_action || null,
          due_date: lead.due_date || null,
          activation_phase: lead.activation_phase || null,
          distribution_power: lead.distribution_power || null,
          fit_score: lead.fit_score || null,
          intention_id: lead.intention_id || intentionId,
          notes: lead.notes || null,
          metadata: lead.metadata || {},
        };
      });

      const { data, error } = await supabase
        .from('leads')
        .upsert(leadsToInsert, {
          onConflict: 'handle,intention_id',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error('[leads] POST error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({
        success: true,
        leads: data,
        count: data?.length || 0,
      });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[leads] Error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
};

module.exports.config = {
  api: { bodyParser: true },
};
