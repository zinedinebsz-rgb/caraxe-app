-- ═══════════════════════════════════════════════════════════════
-- CARAXES — Création des tables manquantes
-- Exécuter dans Supabase SQL Editor (https://supabase.com/dashboard)
-- ═══════════════════════════════════════════════════════════════

-- 1. LEADS (Pipeline commercial)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  service_type TEXT DEFAULT 'sourcing',
  message TEXT,
  budget TEXT,
  amount_paid NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'form_submitted',
  source TEXT DEFAULT 'website',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SHIPMENTS (Expéditions)
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  tracking_number TEXT,
  carrier TEXT,
  status INTEGER DEFAULT 0,
  origin TEXT DEFAULT 'Chine',
  destination TEXT,
  weight_kg NUMERIC,
  dimensions TEXT,
  shipping_method TEXT DEFAULT 'maritime',
  estimated_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INVENTORY (Stock)
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  location TEXT DEFAULT 'Entrepot Chine',
  min_stock INTEGER DEFAULT 0,
  price_unit NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PRODUCTS (Catalogue produits)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID,
  price_min NUMERIC,
  price_max NUMERIC,
  moq INTEGER DEFAULT 100,
  supplier TEXT,
  image_urls TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CATEGORIES (Catégories produits)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. SHOPS (Boutiques e-commerce)
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT DEFAULT 'shopify',
  url TEXT,
  status TEXT DEFAULT 'en_creation',
  theme TEXT,
  monthly_revenue NUMERIC DEFAULT 0,
  products_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ECOM_SERVICES (Services e-commerce)
CREATE TABLE IF NOT EXISTS public.ecom_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  shop_id UUID,
  service_type TEXT DEFAULT 'creation',
  status TEXT DEFAULT 'pending',
  price NUMERIC,
  description TEXT,
  deliverables TEXT,
  deadline TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. PUSH_SUBSCRIPTIONS (Web Push)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies — accès admin + client à ses propres données
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecom_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "admin_all_leads" ON public.leads FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "admin_all_shipments" ON public.shipments FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "admin_all_inventory" ON public.inventory FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "admin_all_products" ON public.products FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "admin_all_categories" ON public.categories FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "admin_all_shops" ON public.shops FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "admin_all_ecom_services" ON public.ecom_services FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "admin_all_push" ON public.push_subscriptions FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Clients can see their own data
CREATE POLICY "client_own_shipments" ON public.shipments FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "client_own_inventory" ON public.inventory FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "client_own_shops" ON public.shops FOR ALL
  USING (client_id = auth.uid());

CREATE POLICY "client_own_ecom" ON public.ecom_services FOR SELECT
  USING (client_id = auth.uid());

-- Everyone can read products and categories (public catalog)
CREATE POLICY "public_read_products" ON public.products FOR SELECT
  USING (true);

CREATE POLICY "public_read_categories" ON public.categories FOR SELECT
  USING (true);

-- Users can manage their own push subscriptions
CREATE POLICY "own_push_subs" ON public.push_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- Anonymous can insert leads (from landing page forms)
CREATE POLICY "anon_insert_leads" ON public.leads FOR INSERT
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- Enable Realtime for new tables
-- ═══════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ecom_services;
