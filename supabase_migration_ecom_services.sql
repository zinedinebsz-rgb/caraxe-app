-- CARAXES E-Commerce Services Migration
-- Tracks service delivery: creation, gestion, formation, marketing/ads

CREATE TABLE IF NOT EXISTS ecom_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  -- Service type: creation, gestion, formation, marketing
  service_type text NOT NULL,
  -- Pack: starter, pro, premium
  pack text DEFAULT 'starter',
  -- Platform: shopify, woocommerce, prestashop
  platform text DEFAULT 'shopify',
  -- Status: pending, onboarding, in_progress, review, delivered, active, paused
  status text DEFAULT 'pending',
  -- Price
  price numeric DEFAULT 0,
  -- Currency
  currency text DEFAULT 'EUR',
  -- Linked shop (if applicable)
  shop_id uuid REFERENCES shops(id) ON DELETE SET NULL,
  -- Onboarding data from client form (JSON)
  onboarding_data jsonb DEFAULT '{}',
  -- Service tasks/checklist (JSON array)
  tasks jsonb DEFAULT '[]',
  -- Delivery dates
  started_at timestamptz,
  delivered_at timestamptz,
  -- Next renewal/follow-up date (for recurring gestion services)
  next_renewal date,
  -- Notes
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_ecom_services_updated_at BEFORE UPDATE ON ecom_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_ecom_services_client_id ON ecom_services(client_id);
CREATE INDEX idx_ecom_services_service_type ON ecom_services(service_type);
CREATE INDEX idx_ecom_services_status ON ecom_services(status);
CREATE INDEX idx_ecom_services_shop_id ON ecom_services(shop_id);

-- RLS
ALTER TABLE ecom_services ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin can view all ecom_services" ON ecom_services FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin can insert ecom_services" ON ecom_services FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin can update ecom_services" ON ecom_services FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admin can delete ecom_services" ON ecom_services FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Clients can see their own services
CREATE POLICY "Users can view their ecom_services" ON ecom_services FOR SELECT
  USING (client_id = auth.uid());

-- Default service task templates (as a comment reference)
-- CREATION: [branding, domain, theme, catalogue_setup, payment, shipping, legal, seo_base, launch]
-- GESTION: [stock_update, orders_process, sav_response, analytics_report, promo_calendar]
-- FORMATION: [dashboard_tour, order_mgmt, catalogue_mgmt, photo_tips, seo_basics, sav_guide]
-- MARKETING: [ad_account_setup, audience_targeting, creative_design, campaign_launch, reporting]
