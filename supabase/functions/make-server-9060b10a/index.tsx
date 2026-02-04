/**
 * ARCHE - Combined Auth Server (make-server-9060b10a)
 * Routes: /check-card, /activate-card, /login-card
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { Hono } from "npm:hono@4.6.14";
import { cors } from "npm:hono@4.6.14/cors";

const app = new Hono().basePath("/make-server-9060b10a");

const ALLOWED_ORIGINS = [
  "https://arche-paris.com",
  "https://www.arche-paris.com",
  "https://xn--arch-paris-e7a.com",
  "https://www.xn--arch-paris-e7a.com",
];

function isOriginAllowed(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin === "http://localhost:5173" || origin === "http://localhost:3000" || origin.startsWith("http://127.0.0.1:")) return true;
  if (origin.endsWith(".vercel.app")) return true;
  return false;
}

app.use("*", async (c, next) => {
  const origin = c.req.header("Origin");
  if (origin && !isOriginAllowed(origin)) {
    return c.json({ error: "Origin not allowed" }, 403);
  }
  await next();
});

app.use("*", cors({
  origin: (o) => (o && isOriginAllowed(o) ? o : null),
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const encoder = new TextEncoder();
  const data = encoder.encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return saltHex + ":" + hashHex;
}

async function verifyPassword(password, storedHash) {
  const parts = storedHash.split(":");
  const saltHex = parts[0];
  const expectedHash = parts[1];
  if (!saltHex || !expectedHash) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex === expectedHash;
}

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

app.post("/check-card", async (c) => {
  try {
    const body = await c.req.json();
    const code = body.code;
    if (!code || typeof code !== "string") {
      return c.json({ error: "Code de carte requis" }, 400);
    }
    const supabase = getSupabase();
    const { data: card, error } = await supabase
      .from("cards")
      .select("id, activated_at, password_hash")
      .eq("id", code)
      .single();

    if (error || !card) {
      return c.json({ success: true, card: { exists: false, is_activated: false } });
    }
    return c.json({
      success: true,
      card: { exists: true, is_activated: card.activated_at !== null && card.password_hash !== null }
    });
  } catch (error) {
    console.error("[check-card] Error:", error);
    return c.json({ error: "Erreur serveur inattendue" }, 500);
  }
});

app.post("/activate-card", async (c) => {
  try {
    const body = await c.req.json();
    const code = body.code;
    const password = body.password;
    if (!code || typeof code !== "string") {
      return c.json({ error: "Code de carte requis" }, 400);
    }
    if (!password || typeof password !== "string" || password.length < 4) {
      return c.json({ error: "Mot de passe requis (minimum 4 caracteres)" }, 400);
    }

    const supabase = getSupabase();

    const { data: existingCard, error: fetchError } = await supabase
      .from("cards")
      .select("id, password_hash, activated_at")
      .eq("id", code)
      .single();

    if (fetchError || !existingCard) {
      return c.json({ error: "Code de carte invalide" }, 404);
    }
    if (existingCard.password_hash) {
      return c.json({ error: "Cette carte a deja ete activee" }, 400);
    }

    const passwordHash = await hashPassword(password);

    const { data: updatedCard, error: updateError } = await supabase
      .from("cards")
      .update({
        password_hash: passwordHash,
        activated_at: new Date().toISOString(),
        failed_attempts: 0,
        locked_until: null
      })
      .eq("id", existingCard.id)
      .select("id, activated_at")
      .single();

    if (updateError) {
      console.error("[activate-card] Update error:", updateError);
      return c.json({ error: "Erreur lors de l activation" }, 500);
    }

    console.log("[activate-card] Card activated:", code);
    return c.json({
      success: true,
      card: { id: updatedCard.id, code: updatedCard.id, activated_at: updatedCard.activated_at }
    });
  } catch (error) {
    console.error("[activate-card] Error:", error);
    return c.json({ error: "Erreur serveur inattendue" }, 500);
  }
});

app.post("/login-card", async (c) => {
  try {
    const body = await c.req.json();
    const code = body.code;
    const password = body.password;
    if (!code || typeof code !== "string") {
      return c.json({ error: "Code de carte requis" }, 400);
    }
    if (!password || typeof password !== "string") {
      return c.json({ error: "Mot de passe requis" }, 400);
    }

    const supabase = getSupabase();

    const { data: card, error: fetchError } = await supabase
      .from("cards")
      .select("id, password_hash, activated_at, failed_attempts, locked_until")
      .eq("id", code)
      .single();

    if (fetchError || !card) {
      return c.json({ error: "Code de carte invalide" }, 404);
    }
    if (!card.password_hash || !card.activated_at) {
      return c.json({ error: "Cette carte n a pas encore ete activee" }, 400);
    }

    if (card.locked_until) {
      const lockedUntil = new Date(card.locked_until);
      const now = new Date();
      if (lockedUntil > now) {
        const minutesRemaining = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
        return c.json({
          error: "Carte verrouillee",
          locked: true, locked_until: card.locked_until, minutes_remaining: minutesRemaining
        }, 403);
      } else {
        await supabase.from("cards").update({ failed_attempts: 0, locked_until: null }).eq("id", card.id);
      }
    }

    const isValid = await verifyPassword(password, card.password_hash);

    if (!isValid) {
      const newFailedAttempts = (card.failed_attempts || 0) + 1;
      let lockedUntil = null;
      if (newFailedAttempts >= MAX_ATTEMPTS) {
        lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000).toISOString();
      }
      await supabase.from("cards").update({ failed_attempts: newFailedAttempts, locked_until: lockedUntil }).eq("id", card.id);

      if (lockedUntil) {
        return c.json({
          error: "Trop de tentatives",
          locked: true, locked_until: lockedUntil, minutes_remaining: LOCK_DURATION_MINUTES
        }, 403);
      } else {
        return c.json({
          error: "Mot de passe incorrect",
          failed_attempts: newFailedAttempts, remaining_attempts: MAX_ATTEMPTS - newFailedAttempts
        }, 401);
      }
    }

    await supabase.from("cards").update({
      failed_attempts: 0, locked_until: null, last_login_at: new Date().toISOString()
    }).eq("id", card.id);

    console.log("[login-card] Success:", code);
    return c.json({
      success: true,
      card: { id: card.id, code: card.id, activated_at: card.activated_at },
      session: { card_id: card.id, logged_in_at: new Date().toISOString() }
    });
  } catch (error) {
    console.error("[login-card] Error:", error);
    return c.json({ error: "Erreur serveur inattendue" }, 500);
  }
});

Deno.serve(app.fetch);
