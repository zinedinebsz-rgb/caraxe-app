-- CARAXES E-Commerce Shops Table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

CREATE TABLE IF NOT EXISTS shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'shopify', -- shopify, woocommerce, prestashop, custom
  status TEXT NOT NULL DEFAULT 'draft', -- draft, building, review, active, paused, archived
  domain TEXT, -- ex: maboutique.myshopify.com or custom domain
  template TEXT DEFAULT 'classic', -- classic, modern, minimal, editorial
  theme_config JSONB DEFAULT '{"primary_color": "#C8A96E", "secondary_color": "#8B1E3F", "font": "DM Sans", "style": "premium"}',
  logo_url TEXT,
  products_synced INTEGER DEFAULT 0,
  monthly_orders INTEGER DEFAULT 0,
  monthly_revenue NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- Admin can see all shops
CREATE POLICY "Admin full access shops" ON shops
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Clients can see their own shops
CREATE POLICY "Client read own shops" ON shops
  FOR SELECT USING (auth.uid() = client_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_shops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION update_shops_updated_at();
