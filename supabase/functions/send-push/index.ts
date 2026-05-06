// CARAXES — Supabase Edge Function: send-push
//
// Sends Web Push notifications to push_subscriptions tied to a user_id.
// Security: caller MUST be authenticated. A caller may only push notifications
// to themselves, OR to anyone if they have role='admin'.
//
// Required env vars (configure in Supabase Dashboard → Edge Functions secrets):
//   VAPID_PUBLIC_KEY   - base64url-encoded public key
//   VAPID_PRIVATE_KEY  - base64url-encoded private key
//   VAPID_SUBJECT      - mailto:contact@caraxes.fr
//   SUPABASE_URL       - auto-populated by Supabase
//   SUPABASE_SERVICE_ROLE_KEY - auto-populated by Supabase
//   SUPABASE_ANON_KEY  - auto-populated by Supabase

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@caraxes.fr";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Restricted CORS — only allow the production app origin.
const ALLOWED_ORIGINS = new Set([
  "https://app.caraxes.fr",
  "https://caraxes.fr",
  "https://www.caraxes.fr",
  // Local dev
  "http://localhost:5173",
  "http://localhost:5174",
]);

function corsHeaders(origin: string | null): HeadersInit {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://app.caraxes.fr";
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  } catch (e) {
    console.error("VAPID setup failed:", e);
  }
}

// Service-role client (bypasses RLS) — used AFTER we've validated the caller.
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type PushPayload = {
  user_id: string;
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
};

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { ...cors, "content-type": "application/json" },
    });
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }

  // ─── AuthN: validate caller's JWT ────────────────────────────────
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) {
    return new Response(JSON.stringify({ error: "unauthenticated" }), {
      status: 401,
      headers: { ...cors, "content-type": "application/json" },
    });
  }

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userErr } = await callerClient.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "invalid token" }), {
      status: 401,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
  const callerId = userData.user.id;

  // ─── Parse body ──────────────────────────────────────────────────
  let payload: PushPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON" }), {
      status: 400,
      headers: { ...cors, "content-type": "application/json" },
    });
  }

  const { user_id, title = "CARAXES", body = "", url = "/", tag = "caraxes-push" } = payload;
  if (!user_id) {
    return new Response(JSON.stringify({ error: "user_id required" }), {
      status: 400,
      headers: { ...cors, "content-type": "application/json" },
    });
  }

  // ─── AuthZ: caller must be self OR admin ────────────────────────
  if (user_id !== callerId) {
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("role")
      .eq("id", callerId)
      .single();
    if (profErr || profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...cors, "content-type": "application/json" },
      });
    }
  }

  // ─── Fetch subscriptions for target user ────────────────────────
  const { data: subs, error: dbErr } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", user_id);

  if (dbErr) {
    return new Response(JSON.stringify({ error: dbErr.message }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0, note: "no subscriptions" }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  }

  // Clamp input lengths (defensive).
  const safeTitle = String(title).slice(0, 120);
  const safeBody = String(body).slice(0, 400);
  const safeUrl = String(url).slice(0, 500);
  const safeTag = String(tag).slice(0, 80);

  const msg = JSON.stringify({
    title: safeTitle,
    body: safeBody,
    url: safeUrl,
    tag: safeTag,
  });

  let sent = 0;
  const failed: string[] = [];

  for (const s of subs) {
    const subscription = {
      endpoint: s.endpoint,
      keys: { p256dh: s.p256dh, auth: s.auth },
    };
    try {
      await webpush.sendNotification(subscription, msg, { TTL: 60 * 60 });
      sent++;
      await admin
        .from("push_subscriptions")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", s.id);
    } catch (e: any) {
      failed.push(s.endpoint);
      const status = e?.statusCode;
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", s.id);
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, failed: failed.length }), {
    headers: { ...cors, "content-type": "application/json" },
  });
});
