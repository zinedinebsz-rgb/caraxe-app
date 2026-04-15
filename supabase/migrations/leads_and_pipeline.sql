-- ═══════════════════════════════════════════════════════
-- CARAXES — Leads & Pipeline Migration
-- Tracks the full funnel: form → payment → account → active
-- ═══════════════════════════════════════════════════════

-- 1. LEADS TABLE — captures form submissions BEFORE payment
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Contact info
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  -- Service info
  service_type TEXT NOT NULL CHECK (service_type IN ('creation', 'formation', 'gestion', 'sourcing')),
  -- Form data (all fields from the form as JSON)
  form_data JSONB DEFAULT '{}',
  -- Pipeline status
  status TEXT NOT NULL DEFAULT 'form_submitted' CHECK (status IN (
    'form_submitted',   -- Form filled, redirected to Stripe
    'payment_pending',  -- Stripe checkout started
    'payment_failed',   -- Payment failed or abandoned
    'paid',             -- Payment confirmed
    'account_created',  -- Supabase account created
    'onboarding',       -- Client doing onboarding
    'active',           -- Client active in dashboard
    'churned'           -- Client left
  )),
  -- Stripe info
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  amount_paid NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  -- Linked account (filled after account creation)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ecom_service_id UUID REFERENCES public.ecom_services(id) ON DELETE SET NULL,
  -- Tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  -- Timestamps
  form_submitted_at TIMESTAMPTZ DEFAULT now(),
  payment_at TIMESTAMPTZ,
  account_created_at TIMESTAMPTZ,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_service_type ON public.leads(service_type);
CREATE INDEX idx_leads_stripe_session ON public.leads(stripe_session_id);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

-- Auto-update timestamp
CREATE TRIGGER leads_updated
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Only admin can view/manage leads
CREATE POLICY "Admin can view all leads" ON public.leads FOR SELECT
  USING (public.is_admin());
CREATE POLICY "Admin can insert leads" ON public.leads FOR INSERT
  WITH CHECK (true); -- N8N inserts via service role key, but allow anon for form submissions
CREATE POLICY "Admin can update leads" ON public.leads FOR UPDATE
  USING (public.is_admin());
CREATE POLICY "Admin can delete leads" ON public.leads FOR DELETE
  USING (public.is_admin());

-- Allow anonymous insert (for form submissions from the website)
CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT
  WITH CHECK (true);

-- Realtime for admin notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

-- ═══════════════════════════════════════════════════════
-- ADD pipeline fields to profiles (if not already present)
-- ═══════════════════════════════════════════════════════

-- Add lead_id to track which lead created this profile
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN lead_id UUID REFERENCES public.leads(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add acquisition source
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN acquisition_source TEXT DEFAULT 'direct';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add last_active_at for churn tracking
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN last_active_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
