# CARAXES — N8N Post-Payment Automation Setup

## Overview
This document describes the N8N workflow to create after Stripe payment succeeds.
The workflow: Stripe webhook → Update lead → Create Supabase account → Create ecom_service → Send welcome email

## Workflow: "CARAXES — Post-Payment Automation"

### Node 1: Stripe Webhook Trigger
- **Type:** Webhook
- **URL:** `https://caraxes13.app.n8n.cloud/webhook/caraxe-stripe-success`
- **Method:** POST
- **Note:** Configure this URL in Stripe Dashboard → Webhooks → Add endpoint
- **Events to listen:** `checkout.session.completed`

### Node 2: Extract Payment Data
- **Type:** Code (JavaScript)
```javascript
const session = $input.first().json;
const metadata = session.metadata || {};
const customerEmail = session.customer_details?.email || metadata.client_email;

return [{
  json: {
    stripe_session_id: session.id,
    payment_intent: session.payment_intent,
    amount_paid: (session.amount_total || 0) / 100,
    currency: session.currency?.toUpperCase() || 'EUR',
    customer_email: customerEmail,
    customer_name: session.customer_details?.name || metadata.client_nom || '',
    customer_phone: metadata.client_tel || '',
    service_type: metadata.offre === 'formation_ecom' ? 'formation' : 'creation',
    form_data: metadata,
  }
}];
```

### Node 3: Update Lead in Supabase
- **Type:** HTTP Request
- **Method:** PATCH
- **URL:** `https://nmuqzzedlxilnbpnalsf.supabase.co/rest/v1/leads?email=eq.{{ $json.customer_email }}&order=created_at.desc&limit=1`
- **Headers:**
  - `apikey`: (Supabase service role key)
  - `Authorization`: `Bearer (service role key)`
  - `Content-Type`: `application/json`
  - `Prefer`: `return=representation`
- **Body:**
```json
{
  "status": "paid",
  "stripe_session_id": "{{ $json.stripe_session_id }}",
  "stripe_payment_intent": "{{ $json.payment_intent }}",
  "amount_paid": {{ $json.amount_paid }},
  "payment_at": "{{ new Date().toISOString() }}"
}
```

### Node 4: Create Supabase Auth User
- **Type:** HTTP Request
- **Method:** POST
- **URL:** `https://nmuqzzedlxilnbpnalsf.supabase.co/auth/v1/admin/users`
- **Headers:**
  - `apikey`: (Supabase service role key)
  - `Authorization`: `Bearer (service role key)`
  - `Content-Type`: `application/json`
- **Body:**
```json
{
  "email": "{{ $json.customer_email }}",
  "email_confirm": true,
  "user_metadata": {
    "full_name": "{{ $json.customer_name }}",
    "role": "client"
  }
}
```
- **On Error:** Continue (user might already exist)

### Node 5: Send Magic Link Email
- **Type:** HTTP Request
- **Method:** POST
- **URL:** `https://nmuqzzedlxilnbpnalsf.supabase.co/auth/v1/magiclink`
- **Headers:**
  - `apikey`: (Supabase anon key)
  - `Content-Type`: `application/json`
- **Body:**
```json
{
  "email": "{{ $json.customer_email }}",
  "options": {
    "emailRedirectTo": "https://app.caraxes.fr"
  }
}
```

### Node 6: Update Lead → account_created
- **Type:** HTTP Request (same as Node 3)
- **Body:**
```json
{
  "status": "account_created",
  "account_created_at": "{{ new Date().toISOString() }}"
}
```

### Node 7: Send Welcome Email (Gmail)
- **Type:** Gmail (using OAuth2 credential GyOnQpJIkqfNE3UA)
- **To:** `{{ $json.customer_email }}`
- **Subject:** `Bienvenue chez CARAXES — Votre espace client est pret`
- **Body (HTML):** See email template below

## Welcome Email Template

```html
<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;background:#141210;color:#e8e0d4;padding:40px 30px;">
  <div style="text-align:center;margin-bottom:30px;">
    <span style="font-size:24px;font-weight:700;letter-spacing:0.15em;color:#c8a85c;font-family:Georgia,serif;">CARAXE<span style="color:#c0392b;">S</span></span>
  </div>

  <h1 style="font-family:Georgia,serif;font-size:24px;color:#c8a85c;text-align:center;margin-bottom:20px;">
    Bienvenue, {{customer_name}}
  </h1>

  <p style="color:#a09888;font-size:15px;line-height:1.8;text-align:center;margin-bottom:30px;">
    Votre paiement de <strong style="color:#e8e0d4;">{{amount_paid}}€</strong> a bien ete recu.
    Votre projet <strong style="color:#e8e0d4;">{{service_label}}</strong> est desormais en cours de preparation.
  </p>

  <div style="background:#1e1a16;border:1px solid #2a2520;padding:20px;margin-bottom:30px;">
    <p style="color:#c8a85c;font-weight:700;margin-bottom:15px;font-size:14px;">Vos prochaines etapes :</p>

    <div style="margin-bottom:12px;padding-left:20px;border-left:2px solid #27ae60;">
      <strong style="color:#e8e0d4;">1. Connectez-vous a votre espace</strong><br>
      <span style="color:#a09888;font-size:13px;">Un lien de connexion vous a ete envoye par email. Cliquez dessus pour acceder a votre dashboard.</span>
    </div>

    <div style="margin-bottom:12px;padding-left:20px;border-left:2px solid #c8a85c;">
      <strong style="color:#e8e0d4;">2. Completez votre profil</strong><br>
      <span style="color:#a09888;font-size:13px;">Finalisez votre onboarding pour nous aider a personnaliser votre projet.</span>
    </div>

    <div style="padding-left:20px;border-left:2px solid #c0392b;">
      <strong style="color:#e8e0d4;">3. On s'occupe du reste</strong><br>
      <span style="color:#a09888;font-size:13px;">Notre equipe demarre votre projet sous 24h. Suivez l'avancement en temps reel depuis votre dashboard.</span>
    </div>
  </div>

  <div style="text-align:center;margin-bottom:30px;">
    <a href="https://app.caraxes.fr" style="display:inline-block;padding:14px 32px;background:#c0392b;color:#e8e0d4;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.04em;">
      Acceder a mon espace client
    </a>
  </div>

  <p style="color:#8a7e6e;font-size:12px;text-align:center;">
    Une question ? Repondez directement a cet email ou contactez-nous a contact@caraxes.fr
  </p>

  <hr style="border:none;border-top:1px solid #2a2520;margin:30px 0;">
  <p style="color:#5a5248;font-size:11px;text-align:center;">
    CARAXES — Votre partenaire sourcing Chine<br>
    caraxes.fr
  </p>
</div>
```

## Stripe Dashboard Configuration

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://caraxes13.app.n8n.cloud/webhook/caraxe-stripe-success`
3. Select event: `checkout.session.completed`
4. In your existing checkout creation workflow ("CARAXES — Checkout E-Com"), add metadata to the Stripe session:
   - Pass all form fields as `metadata` in the checkout session creation

## Existing Workflow Update

In the existing "CARAXES — Checkout E-Com" (YebBlzkYRRj6dpYP), update the Stripe checkout creation node to include:
```javascript
metadata: {
  offre: body.offre,
  client_nom: body.client_nom,
  client_email: body.client_email,
  client_tel: body.client_tel,
  service_type: body.offre === 'formation_ecom' ? 'formation' : 'creation'
}
```

This ensures the post-payment webhook has access to the original form data.
