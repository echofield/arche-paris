/**
 * ARCHE - Combined Auth Server (make-server-9060b10a)
 * Routes: /check-card, /activate-card, /login-card
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { Hono } from "npm:hono@4.6.14";
import { cors } from "npm:hono@4.6.14/cors";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const app = new Hono();

// Strict origin allowlist
const ALLOWED_ORIGINS = [
  "https://arche-paris.com",
  "https://www.arche-paris.com",
  "https://xn--arch-paris-e7a.com",
  "https://www.xn--arch-paris-e7a.com",
];
function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin === "http://localhost:5173" || origin === "http://localhost:3000" || origin.startsWith("http://127.0.0.1:")) return true;
  if (origin.endsWith(".vercel.app") && (origin.startsWith("https://") || origin.startsWith("http://"))) return true;
  return false;
}

app.use("*", async (c, next) => {
  const origin = c.req.header("Origin");
  if (origin && !isOriginAllowed(origin)) {
    return c.json({ error: "Origin not allowed" }, 403);
  }
  await next();
});

app.use(
  "*",
  cors({
    origin: (o) => (o && isOriginAllowed(o) ? o : null),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getClientIp(c: { req: { header: (n: string) => string | undefined } }): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
}

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

// ============ /check-card ============
app.post("/check-card", async (c) => {
  try {
    const { code } = await c.req.json();

    if (!code || typeof code !== "string") {
      return c.json({ error: "Code de carte requis" }, 400);
    }

    const supabase = getSupabase();

    // Check if card exists
    const { data: card, error } = await supabase
      .from("cards")
      .select("id, code, activated_at")
      .eq("code", code)
      .single();

    if (error || !card) {
      return c.json({
        success: true,
        card: { exists: false, is_activated: false }
      });
    }

    return c.json({
      success: true,
      card: {
        exists: true,
        is_activated: card.activated_at !== null
      }
    });

  } catch (error) {
    console.error("[check-card] Unexpected error:", error);
    return c.json({ error: "Erreur serveur inattendue" }, 500);
  }
});

// ============ /activate-card ============
app.post("/activate-card", async (c) => {
  try {
    const { code, password } = await c.req.json();

    if (!code || typeof code !== "string") {
      return c.json({ error: "Code de carte requis" }, 400);
    }

    if (!password || typeof password !== "string" || password.length < 4) {
      return c.json({ error: "Mot de passe requis (minimum 4 caracteres)" }, 400);
    }

    const supabase = getSupabase();

    // Rate limit
    const clientIp = getClientIp(c);
    const { data: rateOk } = await supabase.rpc("consume_rate_limit", {
      p_key: `activate_ip:${clientIp}`,
      p_max_attempts: 10,
      p_window_seconds: 3600,
    });
    if (rateOk === false) {
      return c.json({ error: "Trop de tentatives. Reessayez plus tard." }, 429);
    }

    // Check card exists and not activated
    const { data: existingCard, error: fetchError } = await supabase
      .from("cards")
      .select("id, code, password_hash, activated_at")
      .eq("code", code)
      .single();

    if (fetchError || !existingCard) {
      return c.json({ error: "Code de carte invalide" }, 404);
    }

    if (existingCard.password_hash || existingCard.activated_at) {
      return c.json({ error: "Cette carte a deja ete activee" }, 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password);

    // Activate
    const { data: updatedCard, error: updateError } = await supabase
      .from("cards")
      .update({
        password_hash: passwordHash,
        activated_at: new Date().toISOString(),
        failed_attempts: 0,
        locked_until: null
      })
      .eq("id", existingCard.id)
      .select("id, code, activated_at")
      .single();

    if (updateError) {
      return c.json({ error: "Erreur lors de l'activation" }, 500);
    }

    console.log(`[activate-card] Card activated: ${code}`);

    return c.json({
      success: true,
      card: {
        id: updatedCard.id,
        code: updatedCard.code,
        activated_at: updatedCard.activated_at
      }
    });

  } catch (error) {
    console.error("[activate-card] Unexpected error:", error);
    return c.json({ error: "Erreur serveur inattendue" }, 500);
  }
});

// ============ /login-card ============
app.post("/login-card", async (c) => {
  try {
    const { code, password } = await c.req.json();

    if (!code || typeof code !== "string") {
      return c.json({ error: "Code de carte requis" }, 400);
    }

    if (!password || typeof password !== "string") {
      return c.json({ error: "Mot de passe requis" }, 400);
    }

    const supabase = getSupabase();

    // Get card
    const { data: card, error: fetchError } = await supabase
      .from("cards")
      .select("id, code, password_hash, activated_at, failed_attempts, locked_until")
      .eq("code", code)
      .single();

    if (fetchError || !card) {
      return c.json({ error: "Code de carte invalide" }, 404);
    }

    if (!card.password_hash || !card.activated_at) {
      return c.json({ error: "Cette carte n'a pas encore ete activee" }, 400);
    }

    // Check lock
    if (card.locked_until) {
      const lockedUntil = new Date(card.locked_until);
      const now = new Date();

      if (lockedUntil > now) {
        const minutesRemaining = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
        return c.json({
          error: `Carte verrouillee. Reessayez dans ${minutesRemaining} minute${minutesRemaining > 1 ? "s" : ""}.`,
          locked: true,
          locked_until: card.locked_until,
          minutes_remaining: minutesRemaining
        }, 403);
      } else {
        await supabase
          .from("cards")
          .update({ failed_attempts: 0, locked_until: null })
          .eq("id", card.id);
      }
    }

    // Verify password
    const isValid = await bcrypt.compare(password, card.password_hash);

    if (!isValid) {
      const newFailedAttempts = (card.failed_attempts || 0) + 1;
      let lockedUntil = null;

      if (newFailedAttempts >= MAX_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000).toISOString();
      }

      await supabase
        .from("cards")
        .update({ failed_attempts: newFailedAttempts, locked_until: lockedUntil })
        .eq("id", card.id);

      if (lockedUntil) {
        return c.json({
          error: `Trop de tentatives. Carte verrouillee pour ${LOCK_DURATION_MINUTES} minutes.`,
          locked: true,
          locked_until: lockedUntil,
          minutes_remaining: LOCK_DURATION_MINUTES
        }, 403);
      } else {
        const remainingAttempts = MAX_ATTEMPTS - newFailedAttempts;
        return c.json({
          error: "Mot de passe incorrect",
          failed_attempts: newFailedAttempts,
          remaining_attempts: remainingAttempts
        }, 401);
      }
    }

    // Success - reset attempts
    await supabase
      .from("cards")
      .update({
        failed_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString()
      })
      .eq("id", card.id);

    console.log(`[login-card] Login successful: ${code}`);

    return c.json({
      success: true,
      card: {
        id: card.id,
        code: card.code,
        activated_at: card.activated_at
      },
      session: {
        card_id: card.id,
        logged_in_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("[login-card] Unexpected error:", error);
    return c.json({ error: "Erreur serveur inattendue" }, 500);
  }
});

Deno.serve(app.fetch);
