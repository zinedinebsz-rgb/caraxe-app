-- ══════════════════════════════════════════════════════════════
-- CARAXES — RLS Policies for Admin-Only Tables
-- ══════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- This adds server-side admin checks so that even if someone
-- bypasses the client-side role check, Supabase blocks the query.
-- ══════════════════════════════════════════════════════════════

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ── SHIPMENTS ──
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on shipments"
  ON shipments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Clients can see their own shipments (via order link)
CREATE POLICY "Clients view own shipments"
  ON shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = shipments.order_id
      AND orders.client_id = auth.uid()
    )
  );


-- ── INVENTORY ──
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on inventory"
  ON inventory FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- ── SUPPLIERS ──
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on suppliers"
  ON suppliers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- ── ORDER_SUPPLIERS ──
ALTER TABLE order_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on order_suppliers"
  ON order_suppliers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- ── LEADS ──
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on leads"
  ON leads FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- ── SHOPS ──
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on shops"
  ON shops FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Clients can see their own shops
CREATE POLICY "Clients view own shops"
  ON shops FOR SELECT
  USING (client_id = auth.uid());


-- ── ECOM_SERVICES ──
ALTER TABLE ecom_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on ecom_services"
  ON ecom_services FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Clients can see their own services
CREATE POLICY "Clients view own ecom_services"
  ON ecom_services FOR SELECT
  USING (client_id = auth.uid());


-- ── PRODUCTS / CATEGORIES (public catalogue) ──
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (active = true);

CREATE POLICY "Admin full access on products"
  ON products FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Admin full access on categories"
  ON categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- ── PROFILES — restrict getAllProfiles to admins ──
-- (profiles likely already has RLS, just add admin policy)
CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin() OR id = auth.uid());

CREATE POLICY "Admin can update all profiles"
  ON profiles FOR UPDATE
  USING (is_admin() OR id = auth.uid())
  WITH CHECK (is_admin() OR id = auth.uid());


-- ══════════════════════════════════════════════════════════════
-- DONE — Verify by running: SELECT * FROM shipments; as a non-admin user
-- It should return empty results.
-- ══════════════════════════════════════════════════════════════
