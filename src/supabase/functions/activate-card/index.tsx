// EDGE FUNCTION : activate-card
// Active une carte vierge avec un mot de passe (non-enumerable proof).
// INVARIANT: Activation must require proof (code+password). activate_card must never
// succeed with card_id alone. Pairing security assumes this invariant.
// Hash du mot de passe avec bcrypt (JAMAIS en clair).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { cors } from "npm:hono/cors@4.6.14";
import { Hono } from "npm:hono@4.6.14";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const app = new Hono();

// Strict origin allowlist (same as card-gate; no relay from random sites)
const ALLOWED_ORIGINS = [
  'https://arche-paris.com',
  'https://www.arche-paris.com',
];
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin === 'http://localhost:5173' || origin === 'http://localhost:3000' || origin.startsWith('http://127.0.0.1:')) return true;
  if (origin.endsWith('.vercel.app') && (origin.startsWith('https://') || origin.startsWith('http://'))) return true;
  return false;
}

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');
  if (origin && !isOriginAllowed(origin)) {
    return c.json({ error: 'Origin not allowed' }, 403);
  }
  await next();
});

app.use('*', cors({
  origin: (o: string | undefined) => (o && isOriginAllowed(o) ? o : null),
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

function getClientIp(c: { req: { header: (n: string) => string | undefined } }): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  );
}

// Route: /make-server-9060b10a/activate-card
app.post('/make-server-9060b10a/activate-card', async (c) => {
  try {
    const { code, password } = await c.req.json();

    // Validation
    if (!code || typeof code !== 'string') {
      return c.json({ error: 'Code de carte requis' }, 400);
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return c.json({ error: 'Mot de passe requis (minimum 4 caractères)' }, 400);
    }

    // Créer client Supabase avec service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Rate limit: max 10 activation attempts per IP per hour
    const clientIp = getClientIp(c);
    const { data: rateOk } = await supabase.rpc('consume_rate_limit', {
      p_key: `activate_ip:${clientIp}`,
      p_max_attempts: 10,
      p_window_seconds: 3600,
    });
    if (rateOk === false) {
      return c.json({ error: 'Trop de tentatives. Réessayez plus tard.' }, 429);
    }

    // Vérifier que la carte existe et n'est pas déjà activée
    const { data: existingCard, error: fetchError } = await supabase
      .from('cards')
      .select('id, code, password_hash, activated_at')
      .eq('code', code)
      .single();

    if (fetchError || !existingCard) {
      console.error('[activate-card] Card not found:', code);
      return c.json({ error: 'Code de carte invalide' }, 404);
    }

    if (existingCard.password_hash || existingCard.activated_at) {
      console.error('[activate-card] Card already activated:', code);
      return c.json({ error: 'Cette carte a déjà été activée' }, 400);
    }

    // Hash du mot de passe avec bcrypt
    const passwordHash = await bcrypt.hash(password);

    // Activer la carte
    const { data: updatedCard, error: updateError } = await supabase
      .from('cards')
      .update({
        password_hash: passwordHash,
        activated_at: new Date().toISOString(),
        failed_attempts: 0,
        locked_until: null
      })
      .eq('id', existingCard.id)
      .select('id, code, activated_at')
      .single();

    if (updateError) {
      console.error('[activate-card] Update error:', updateError);
      return c.json({ error: 'Erreur lors de l\'activation' }, 500);
    }

    // Logger l'événement
    await supabase.from('card_events').insert({
      card_id: updatedCard.id,
      event_type: 'card_activated',
      data: {
        activated_at: updatedCard.activated_at
      }
    });

    console.log(`[activate-card] Card activated successfully: ${code}`);

    // Retourner les infos (SANS password_hash)
    return c.json({
      success: true,
      card: {
        id: updatedCard.id,
        code: updatedCard.code,
        activated_at: updatedCard.activated_at
      }
    });

  } catch (error) {
    console.error('[activate-card] Unexpected error:', error);
    return c.json({ error: 'Erreur serveur inattendue' }, 500);
  }
});

Deno.serve(app.fetch);
