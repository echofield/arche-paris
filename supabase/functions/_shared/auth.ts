import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

export async function requireUserId(
  req: Request,
  options: { allowCardSession?: boolean } = {}
): Promise<{ userId: string } | { error: string; status: number }> {
  const resolveCardSession = async (): Promise<{ userId: string } | { error: string; status: number }> => {
    const cardCode = (req.headers.get('X-ARCHE-CARD-CODE') ?? req.headers.get('X-ARCHE-SESSION') ?? '').trim();
    if (!cardCode) {
      return { error: 'Missing or invalid Authorization header', status: 401 };
    }
    if (!serviceRoleKey) {
      return { error: 'Server auth misconfigured', status: 500 };
    }
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: card, error } = await admin
      .from('cards')
      .select('id, activated_at')
      .eq('id', cardCode)
      .maybeSingle();
    if (error || !card?.id || !card.activated_at) {
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
