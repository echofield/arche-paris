import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function parseRefreshCookie(cookieHeader: string | null): { cardId: string; deviceSecret: string } | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const refreshCookie = cookies.find((c) => c.startsWith('arche_refresh='));
  if (!refreshCookie) return null;
  const value = refreshCookie.slice('arche_refresh='.length);
  if (!value) return null;
  const decoded = decodeURIComponent(value);
  const sepIndex = decoded.indexOf(':');
  if (sepIndex === -1) return null;
  const cardId = decoded.slice(0, sepIndex);
  const deviceSecret = decoded.slice(sepIndex + 1);
  if (!cardId || !deviceSecret) return null;
  return { cardId, deviceSecret };
}

function b64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function requireUserId(
  req: Request,
  options: { allowCardSession?: boolean } = {}
): Promise<{ userId: string } | { error: string; status: number }> {
  const resolveCardSession = async (): Promise<{ userId: string } | { error: string; status: number }> => {
    const cardCode = (req.headers.get('X-ARCHE-CARD-CODE') ?? req.headers.get('X-ARCHE-SESSION') ?? '').trim();
    if (!cardCode) {
      return { error: 'Missing or invalid Authorization header', status: 401 };
    }
    const refresh = parseRefreshCookie(req.headers.get('Cookie'));
    if (!refresh || refresh.cardId !== cardCode) {
      return { error: 'Invalid or expired token', status: 401 };
    }
    let secretHash = '';
    try {
      secretHash = await sha256Hex(b64urlDecode(refresh.deviceSecret));
    } catch {
      return { error: 'Invalid or expired token', status: 401 };
    }
    if (!serviceRoleKey) {
      return { error: 'Server auth misconfigured', status: 500 };
    }
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: card, error } = await admin
      .from('cards')
      .select('id, activated_at, device_secret_hash')
      .eq('id', cardCode)
      .maybeSingle();
    if (error || !card?.id || !card.activated_at || !card.device_secret_hash) {
      return { error: 'Invalid or expired token', status: 401 };
    }
    if (!constantTimeCompare(card.device_secret_hash, secretHash)) {
      return { error: 'Invalid or expired token', status: 401 };
    }
    return { userId: `card:${card.id}` };
  };

  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (!options.allowCardSession) {
      return { error: 'Missing or invalid Authorization header', status: 401 };
    }
    return await resolveCardSession();
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    if (options.allowCardSession) {
      return await resolveCardSession();
    }
    return { error: 'Invalid or expired token', status: 401 };
  }

  return { userId: user.id };
}
