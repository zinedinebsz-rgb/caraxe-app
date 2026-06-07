// ═══════════════════════════════════════════════════════════════
// CARAXES — Leads Ingest Edge Function (HARDENED)
// Receives form submissions from the landing page + Acuity webhooks
// and inserts them into public.leads.
//
// Endpoint: POST https://<project>.supabase.co/functions/v1/leads-ingest
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Restricted CORS: only our own origins ──
const ALLOWED_ORIGINS = new Set([
  'https://caraxes.fr',
  'https://www.caraxes.fr',
  'https://app.caraxes.fr',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
])
function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://caraxes.fr'
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
}

const MAX_BODY = 10 * 1024 // 10 KB
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const clamp = (v: unknown, n: number): string | null => {
  if (v == null) return null
  const s = String(v).trim()
  return s ? s.slice(0, n) : null
}

const SOURCE_TO_SERVICE: Record<string, string> = {
  comparatif: 'sourcing', sourcing: 'sourcing', vehicule: 'sourcing',
  ecommerce: 'creation', formation: 'formation', gestion: 'gestion', acuity: 'sourcing',
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const cors = corsHeaders(origin)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405, cors)

  // Optional shared secret (set WEBHOOK_SECRET to enforce). Acuity webhook should send X-Webhook-Secret.
  const requiredSecret = Deno.env.get('WEBHOOK_SECRET')
  if (requiredSecret) {
    const got = req.headers.get('x-webhook-secret') || ''
    if (got !== requiredSecret) return json({ error: 'forbidden' }, 403, cors)
  }

  try {
    const ct = req.headers.get('content-type') || ''
    const raw = await req.text()
    if (raw.length > MAX_BODY) return json({ error: 'payload too large' }, 413, cors)

    let payload: Record<string, any> = {}
    if (ct.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(raw)
      payload = { source: 'acuity', acuity_action: params.get('action'), acuity_id: params.get('id') }
    } else {
      try { payload = raw ? JSON.parse(raw) : {} }
      catch { return json({ error: 'invalid JSON' }, 400, cors) }
    }

    const source = String(payload.source || 'sourcing').toLowerCase()
    const service_type = SOURCE_TO_SERVICE[source] || 'sourcing'

    // ── Resolve email ──
    let email = clamp(payload.email, 200)?.toLowerCase() || null
    if (!email && source === 'acuity') {
      email = `acuity-${clamp(payload.acuity_id, 60) || Date.now()}@unknown.local`
    }
    if (!email || !EMAIL_RE.test(email)) {
      return json({ error: 'valid email required' }, 400, cors)
    }

    // ── Resolve full name (precedence bug fixed) ──
    let full_name = clamp(payload.full_name, 200)
    if (!full_name) {
      const composed = `${clamp(payload.firstName, 100) || ''} ${clamp(payload.lastName, 100) || ''}`.trim()
      full_name = composed || null
    }

    const lead = {
      email,
      full_name,
      phone: clamp(payload.phone, 40),
      city: clamp(payload.city, 120),
      service_type,
      form_data: { ...payload, ingested_at: new Date().toISOString() },
      status: 'form_submitted',
      utm_source: clamp(payload.utm_source, 120),
      utm_medium: clamp(payload.utm_medium, 120),
      utm_campaign: clamp(payload.utm_campaign, 120),
      referrer: clamp(payload.referrer, 500) || clamp(req.headers.get('referer'), 500),
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data, error } = await supabase
      .from('leads')
      .upsert(lead, { onConflict: 'email', ignoreDuplicates: false })
      .select('id')
      .single()

    if (error) {
      console.error('leads-ingest insert error:', error)
      return json({ error: 'insert failed' }, 500, cors)
    }
    return json({ ok: true, lead_id: data?.id }, 200, cors)
  } catch (err) {
    console.error('leads-ingest unexpected error:', err)
    return json({ error: 'server error' }, 500, cors)
  }
})

function json(body: any, status = 200, cors: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
