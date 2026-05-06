# CARAXES — Email Automation Workflows (N8N)

## Overview
All email workflows use the Gmail OAuth2 credential (GyOnQpJIkqfNE3UA) on caraxes13.app.n8n.cloud.
From: contact@caraxes.fr (or configured Gmail)

---

## Workflow 1: "CARAXES — Status Update Emails"

**Trigger:** Supabase Realtime (orders table UPDATE on status column)
**URL:** Uses Supabase trigger node or webhook

### Status → Email Mapping

| Status | Subject | Action |
|--------|---------|--------|
| 0 → 1 | Votre commande est en cours de recherche | Recherche fournisseurs demarre |
| 1 → 2 | Negociation en cours pour votre commande | Prix et conditions en cours |
| 2 → 3 | Echantillon en preparation | Validation avant production |
| 3 → 4 | Production lancee | Estimation delai |
| 4 → 5 | Votre commande est en expedition | Tracking number |
| 5 → 6 | Commande livree | Confirmation livraison |

### Email Template (status update):

```html
<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;background:#141210;color:#e8e0d4;padding:40px 30px;">
  <div style="text-align:center;margin-bottom:30px;">
    <span style="font-size:24px;font-weight:700;letter-spacing:0.15em;color:#c8a85c;font-family:Georgia,serif;">CARAXE<span style="color:#c0392b;">S</span></span>
  </div>

  <h2 style="font-family:Georgia,serif;font-size:20px;color:#c8a85c;margin-bottom:15px;">
    Mise a jour — {{order_ref}}
  </h2>

  <div style="background:#1e1a16;border:1px solid #2a2520;border-left:3px solid {{status_color}};padding:20px;margin-bottom:20px;">
    <p style="color:#e8e0d4;font-weight:700;margin-bottom:8px;">{{status_label}}</p>
    <p style="color:#a09888;font-size:14px;line-height:1.6;">{{status_message}}</p>
  </div>

  <!-- Progress bar -->
  <div style="background:#2a2520;height:6px;margin-bottom:20px;">
    <div style="background:linear-gradient(90deg,#c0392b,#c8a85c);height:100%;width:{{progress}}%;"></div>
  </div>
  <p style="color:#8a7e6e;font-size:12px;text-align:center;margin-bottom:20px;">Progression : {{progress}}%</p>

  <div style="text-align:center;margin-bottom:30px;">
    <a href="https://app.caraxes.fr" style="display:inline-block;padding:12px 28px;background:#c0392b;color:#e8e0d4;text-decoration:none;font-weight:700;font-size:14px;">
      Voir le detail sur mon dashboard
    </a>
  </div>

  <hr style="border:none;border-top:1px solid #2a2520;margin:20px 0;">
  <p style="color:#5a5248;font-size:11px;text-align:center;">CARAXES — caraxes.fr</p>
</div>
```

### N8N Logic (Code node):
```javascript
const STATUSES = {
  0: { label: 'En attente', message: 'Votre commande a ete recue et est en file d\'attente.', color: '#8a7e6e', progress: 5 },
  1: { label: 'Recherche fournisseurs', message: 'Notre equipe recherche les meilleurs fournisseurs pour votre produit. Nous comparons les prix, la qualite et les delais.', color: '#c8a85c', progress: 20 },
  2: { label: 'Negociation en cours', message: 'Nous avons identifie des fournisseurs et sommes en negociation sur les prix et conditions.', color: '#c8a85c', progress: 35 },
  3: { label: 'Echantillon en preparation', message: 'Un echantillon est en cours de preparation pour validation avant la production en serie.', color: '#3498db', progress: 50 },
  4: { label: 'Production lancee', message: 'La production a demarre. Nous suivons l\'avancement quotidiennement pour garantir la qualite.', color: '#c0392b', progress: 70 },
  5: { label: 'En expedition', message: 'Votre commande est en route ! Vous recevrez le numero de suivi des qu\'il sera disponible.', color: '#27ae60', progress: 90 },
  6: { label: 'Livree', message: 'Votre commande a ete livree. N\'hesitez pas a nous contacter pour toute question.', color: '#27ae60', progress: 100 },
};

const order = $input.first().json;
const status = STATUSES[order.status] || STATUSES[0];

return [{
  json: {
    ...order,
    status_label: status.label,
    status_message: status.message,
    status_color: status.color,
    progress: status.progress,
  }
}];
```

---

## Workflow 2: "CARAXES — Relance Prospects"

**Trigger:** Schedule (every day at 10:00 AM Paris time)

### Logic:
1. Query Supabase leads where `status = 'form_submitted'` AND `created_at < NOW() - INTERVAL '24 hours'`
2. For each lead, send a follow-up email
3. Update lead status to `payment_pending`

### Follow-up Email Template:

```html
<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;background:#141210;color:#e8e0d4;padding:40px 30px;">
  <div style="text-align:center;margin-bottom:30px;">
    <span style="font-size:24px;font-weight:700;letter-spacing:0.15em;color:#c8a85c;font-family:Georgia,serif;">CARAXE<span style="color:#c0392b;">S</span></span>
  </div>

  <h2 style="font-family:Georgia,serif;font-size:20px;color:#c8a85c;margin-bottom:15px;">
    {{customer_name}}, votre projet vous attend
  </h2>

  <p style="color:#a09888;font-size:15px;line-height:1.8;margin-bottom:20px;">
    Vous avez rempli le formulaire pour <strong style="color:#e8e0d4;">{{service_label}}</strong> mais n'avez pas finalise votre commande.
  </p>

  <p style="color:#a09888;font-size:15px;line-height:1.8;margin-bottom:30px;">
    Nous avons conserve vos informations. Vous pouvez reprendre exactement ou vous en etiez.
  </p>

  <div style="text-align:center;margin-bottom:30px;">
    <a href="https://app.caraxes.fr/offre-{{service_page}}.html" style="display:inline-block;padding:14px 32px;background:#c0392b;color:#e8e0d4;text-decoration:none;font-weight:700;font-size:15px;">
      Finaliser ma commande
    </a>
  </div>

  <p style="color:#8a7e6e;font-size:12px;text-align:center;">
    Une question ? Repondez a cet email ou WhatsApp : +33 6 29 80 17 89
  </p>

  <hr style="border:none;border-top:1px solid #2a2520;margin:30px 0;">
  <p style="color:#5a5248;font-size:11px;text-align:center;">CARAXES — caraxes.fr</p>
</div>
```

---

## Workflow 3: "CARAXES — Message Notification"

**Trigger:** Supabase Realtime (messages table INSERT)

### Logic:
1. On new message where `sender_role = 'admin'`
2. Get client email from profiles table via order → client_id
3. Send notification email

### Template:

Subject: `Nouveau message sur votre commande {{order_ref}}`

```html
<div style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;background:#141210;color:#e8e0d4;padding:40px 30px;">
  <div style="text-align:center;margin-bottom:30px;">
    <span style="font-size:24px;font-weight:700;letter-spacing:0.15em;color:#c8a85c;font-family:Georgia,serif;">CARAXE<span style="color:#c0392b;">S</span></span>
  </div>

  <h2 style="font-family:Georgia,serif;font-size:18px;color:#c8a85c;margin-bottom:15px;">
    Nouveau message
  </h2>

  <div style="background:#1e1a16;border:1px solid #2a2520;border-left:3px solid #c8a85c;padding:15px 20px;margin-bottom:20px;">
    <p style="color:#e8e0d4;font-size:14px;line-height:1.6;">{{message_content}}</p>
    <p style="color:#8a7e6e;font-size:11px;margin-top:8px;">— Equipe CARAXES</p>
  </div>

  <div style="text-align:center;">
    <a href="https://app.caraxes.fr" style="display:inline-block;padding:12px 28px;background:#c0392b;color:#e8e0d4;text-decoration:none;font-weight:700;font-size:14px;">
      Repondre sur le dashboard
    </a>
  </div>

  <hr style="border:none;border-top:1px solid #2a2520;margin:20px 0;">
  <p style="color:#5a5248;font-size:11px;text-align:center;">CARAXES — caraxes.fr</p>
</div>
```

---

## Setup Checklist

- [ ] Create "CARAXES — Post-Payment Automation" workflow (see N8N_SETUP_POST_PAYMENT.md)
- [ ] Create "CARAXES — Status Update Emails" workflow
- [ ] Create "CARAXES — Relance Prospects" workflow (schedule: daily 10 AM)
- [ ] Create "CARAXES — Message Notification" workflow
- [ ] Configure Stripe webhook endpoint in Stripe Dashboard
- [ ] Update existing checkout workflow to pass metadata
- [ ] Run the leads_and_pipeline.sql migration in Supabase SQL Editor
- [ ] Test full flow: form → Stripe → webhook → account creation → email
