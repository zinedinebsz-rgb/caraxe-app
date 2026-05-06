-- CARAXES — Row Level Security Policies
-- Generated: 2026-04-28
-- Run this file to recreate all RLS policies

-- Helper function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecom_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (is_admin());

-- ORDERS
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = client_id OR is_admin());

DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = client_id OR is_admin());

DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
CREATE POLICY "Admins can delete orders" ON orders FOR DELETE USING (is_admin());

-- MESSAGES
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR is_admin());

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id OR is_admin());

-- DOCUMENTS
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (auth.uid() = uploaded_by OR is_admin());

DROP POLICY IF EXISTS "Users can upload documents" ON documents;
CREATE POLICY "Users can upload documents" ON documents FOR INSERT WITH CHECK (auth.uid() = uploaded_by OR is_admin());

DROP POLICY IF EXISTS "Admins can delete documents" ON documents;
CREATE POLICY "Admins can delete documents" ON documents FOR DELETE USING (is_admin());

-- ECOM_SERVICES
DROP POLICY IF EXISTS "Users can view own ecom services" ON ecom_services;
CREATE POLICY "Users can view own ecom services" ON ecom_services FOR SELECT USING (auth.uid() = client_id OR is_admin());

DROP POLICY IF EXISTS "Users can create ecom services" ON ecom_services;
CREATE POLICY "Users can create ecom services" ON ecom_services FOR INSERT WITH CHECK (auth.uid() = client_id OR is_admin());

DROP POLICY IF EXISTS "Admins can update ecom services" ON ecom_services;
CREATE POLICY "Admins can update ecom services" ON ecom_services FOR UPDATE USING (is_admin());

-- LEADS
DROP POLICY IF EXISTS "Admins can view leads" ON leads;
CREATE POLICY "Admins can view leads" ON leads FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Anyone can create leads" ON leads;
CREATE POLICY "Anyone can create leads" ON leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update leads" ON leads;
CREATE POLICY "Admins can update leads" ON leads FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete leads" ON leads;
CREATE POLICY "Admins can delete leads" ON leads FOR DELETE USING (is_admin());

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════
-- STORAGE BUCKET POLICIES
-- ═══════════════════════════════════════════

-- DOCUMENTS bucket — authenticated users upload to their orders, admins can do everything
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Users can view own order documents" ON storage.objects;
CREATE POLICY "Users can view own order documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      is_admin()
      OR EXISTS (
        SELECT 1 FROM documents d
        JOIN orders o ON d.order_id = o.id
        WHERE d.storage_path = name AND o.client_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;
CREATE POLICY "Admins can delete documents storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND is_admin());

-- PRODUCTS bucket — public read, admin write
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'products' AND is_admin());

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'products' AND is_admin());

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'products' AND is_admin());

-- ═══════════════════════════════════════════
-- SCHEMA MIGRATIONS
-- ═══════════════════════════════════════════

-- Columns added for admin profile views
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS client_tier text DEFAULT 'standard';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
