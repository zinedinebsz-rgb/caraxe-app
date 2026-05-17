// ═══════════════════════════════════════════════════════════════
// CARAXES — Leads Ingest Edge Function
// Receives form submissions from the landing page + Acuity webhooks
// and inserts them into public.leads table.
//
// Endpoint: POST https://<project>.supabase.co/functions/v1/leads-ingest
//
// Payload (from landing form):
//   {
//     "source": "comparatif" | "sourcing" | "vehicule" | "ecommerce" | "acuity",
//     "email": "...",
//     "full_name": "...",
//     "phone": "...",
//     "city": "...",
//     "form_data": { ...everything else }
//   }
//
// Payload (from Acuity webhook):
//   action=scheduled&id=12345  (form-urlencoded)
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Map landing form "source" to leads.service_type enum
const SOURCE_TO_SERVICE: Record<string, string> = {
  comparatif:  'sourcing',
  sourcing:    'sourcing',
  vehicule:    'sourcing',
  ecommerce:   'creation',
  formation:   'formation',
  gestion:     'gestion',
  acuity:      'sourcing',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'POST only' }, 405)
  }

  try {
    const ct = req.headers.get('content-type') || ''
    let payload: Record<string, any> = {}

    // Acuity sends form-urlencoded
    if (ct.includes('application/x-www-form-urlencoded')) {
      const text = await req.text()
      const params = new URLSearchParams(text)
      payload = {
        source: 'acuity',
        acuity_action: params.get('action'),
        acuity_id: params.get('id'),
      }
    } else {
      payload = await req.json()
    }

    const source = (payload.source || 'sourcing').toLowerCase()
    const service_type = SOURCE_TO_SERVICE[source] || 'sourcing'

    // Build the lead row
    const lead = {
      email: (payload.email || `acuity-${payload.acuity_id || Date.now()}@unknown.local`).toLowerCase(),
      full_name: payload.full_name || payload.firstName ? `${payload.firstName || ''} ${payload.lastName || ''}`.trim() : null,
      phone: payload.phone || null,
      city: payload.city || null,
      service_type,
      form_data: { ...payload, ingested_at: new Date().toISOString() },
      status: 'form_submitted',
      utm_source: payload.utm_source || null,
      utm_medium: payload.utm_medium || null,
      utm_campaign: payload.utm_campaign || null,
      referrer: payload.referrer || req.headers.get('referer'),
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Upsert on email (avoid duplicates from re-submissions)
    const { data, error } = await supabase
      .from('leads')
      .upsert(lead, { onConflict: 'email', ignoreDuplicates: false })
      .select()
      .single()

    if (error) {
      console.error('leads-ingest insert error:', error)
      return json({ error: error.message }, 500)
    }

    return json({ ok: true, lead_id: data?.id }, 200)
  } catch (err) {
    console.error('leads-ingest unexpected error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
