-- CARAXES Platform - SQL Migration File
-- Plateforme de sourcing pour marchands e-commerce musulmans
-- =====================================================

-- =====================================================
-- SECTION 1: Trigger Function for updated_at
-- =====================================================
-- Fonction pour mettre à jour automatiquement le timestamp updated_at

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- SECTION 2: SUPPLIERS TABLE
-- =====================================================
-- Fournisseurs chinois : stockage des informations de contact,
-- plateforme de sourcing, certifications et évaluations

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  contact_wechat text,
  -- Plateforme de sourcing: alibaba.com, 1688.com, contact direct, Canton Fair, etc.
  platform text,
  platform_url text,
  -- Ville d'origine (Yiwu, Guangzhou, Shenzhen, etc.)
  city text,
  -- Catégories de produits fournis (tableau JSON)
  categories text[],
  -- Note de 1 à 5 basée sur les retours des clients
  rating integer DEFAULT 0,
  notes text,
  -- Fournisseur vérifié par CARAXES
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger pour updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index sur les clés étrangères et recherche
CREATE INDEX idx_suppliers_platform ON suppliers(platform);
CREATE INDEX idx_suppliers_city ON suppliers(city);
CREATE INDEX idx_suppliers_verified ON suppliers(verified);

-- =====================================================
-- SECTION 3: ORDER_SUPPLIERS TABLE
-- =====================================================
-- Liaison entre commandes et fournisseurs avec gestion des prix
-- et statuts de confirmation/paiement/expédition

CREATE TABLE IF NOT EXISTS order_suppliers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Référence à la commande
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  -- Référence au fournisseur
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  -- Prix unitaire pour cette commande
  price_unit numeric,
  -- Prix total pour cette commande
  total_price numeric,
  -- Devise (CNY, USD, EUR, etc.)
  currency text DEFAULT 'CNY',
  -- Statut de la commande: devis, confirmée, payée, expédiée
  status text DEFAULT 'quoted',
  -- Notes sur la commande, délai de livraison, spécifications, etc.
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Index sur les clés étrangères et recherche
CREATE INDEX idx_order_suppliers_order_id ON order_suppliers(order_id);
CREATE INDEX idx_order_suppliers_supplier_id ON order_suppliers(supplier_id);
CREATE INDEX idx_order_suppliers_status ON order_suppliers(status);

-- =====================================================
-- SECTION 4: SHIPMENTS TABLE
-- =====================================================
-- Suivi des expéditions : transport, douanes, livraison finale
-- Supporte maritime, aérien, ferroviaire et express

CREATE TABLE IF NOT EXISTS shipments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Référence au profil client (marchand)
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  -- Référence à la commande (optionnelle)
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  -- Numéro de suivi (AWB, BL, numéro tracking)
  tracking_number text,
  -- Méthode de transport: maritime, aérien, ferroviaire, express
  method text DEFAULT 'maritime',
  -- Statut du transport (0=production, 1=QC, 2=transit, 3=douanes, 4=livré)
  status integer DEFAULT 0,
  -- Lieu d'origine (par défaut Chine)
  origin text DEFAULT 'Chine',
  -- Destination (adresse ou pays)
  destination text,
  -- Poids en kilogrammes
  weight_kg numeric,
  -- Volume en CBM (Cubic Meters)
  volume_cbm numeric,
  -- Date estimée d'arrivée
  eta date,
  -- Date d'expédition réelle
  shipped_at timestamptz,
  -- Date de livraison réelle
  delivered_at timestamptz,
  -- Notes sur le transport, documents douaniers, etc.
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger pour updated_at
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index sur les clés étrangères et recherche
CREATE INDEX idx_shipments_client_id ON shipments(client_id);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_method ON shipments(method);

-- =====================================================
-- SECTION 5: INVENTORY TABLE
-- =====================================================
-- Gestion du stock client : produits, quantités, seuils d'alerte
-- Lien vers le fournisseur d'origine

CREATE TABLE IF NOT EXISTS inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Référence au profil client (marchand)
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  -- Nom du produit
  product_name text NOT NULL,
  -- Code SKU ou référence interne
  sku text,
  -- Quantité actuelle en stock
  quantity integer DEFAULT 0,
  -- Seuil d'alerte pour réapprovisionnement
  alert_threshold integer DEFAULT 10,
  -- Localisation du stock (France, entrepôt spécifique)
  warehouse text DEFAULT 'France',
  -- Prix unitaire de coût
  unit_price numeric,
  -- Référence au fournisseur d'origine
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  -- Notes: provenance, conditions spéciales, etc.
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger pour updated_at
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index sur les clés étrangères et recherche
CREATE INDEX idx_inventory_client_id ON inventory(client_id);
CREATE INDEX idx_inventory_supplier_id ON inventory(supplier_id);
CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse);

-- =====================================================
-- SECTION 6: ALTER PROFILES TABLE
-- =====================================================
-- Ajout de la colonne services_enabled pour gérer les services actifs

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS services_enabled text[] DEFAULT ARRAY['sourcing'];

-- =====================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Politiques de sécurité au niveau des lignes
-- - Admins (is_admin=true) peuvent tout voir et modifier
-- - Clients ne voient que leurs propres données

-- ENABLE RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUPPLIERS - RLS Policies
-- =====================================================

-- Les admins peuvent tout voir et modifier
CREATE POLICY "Admin can view all suppliers"
  ON suppliers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Les clients peuvent voir tous les fournisseurs publics (listés)
CREATE POLICY "Users can view all suppliers"
  ON suppliers FOR SELECT
  USING (true);

-- Seuls les admins peuvent insérer des fournisseurs
CREATE POLICY "Admin can insert suppliers"
  ON suppliers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seuls les admins peuvent modifier des fournisseurs
CREATE POLICY "Admin can update suppliers"
  ON suppliers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seuls les admins peuvent supprimer des fournisseurs
CREATE POLICY "Admin can delete suppliers"
  ON suppliers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- ORDER_SUPPLIERS - RLS Policies
-- =====================================================

-- Les admins peuvent tout voir
CREATE POLICY "Admin can view all order_suppliers"
  ON order_suppliers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Les clients ne voient que les commandes liées à leurs propres orders
CREATE POLICY "Users can view their order_suppliers"
  ON order_suppliers FOR SELECT
  USING (
    auth.uid() IN (
      SELECT client_id FROM orders
      WHERE orders.id = order_suppliers.order_id
    )
  );

-- Les admins peuvent insérer
CREATE POLICY "Admin can insert order_suppliers"
  ON order_suppliers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Les clients peuvent insérer pour leurs commandes
CREATE POLICY "Users can insert order_suppliers for their orders"
  ON order_suppliers FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT client_id FROM orders
      WHERE orders.id = order_id
    )
  );

-- Les admins peuvent modifier
CREATE POLICY "Admin can update order_suppliers"
  ON order_suppliers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Les clients peuvent modifier leurs propres order_suppliers
CREATE POLICY "Users can update their order_suppliers"
  ON order_suppliers FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT client_id FROM orders
      WHERE orders.id = order_suppliers.order_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT client_id FROM orders
      WHERE orders.id = order_suppliers.order_id
    )
  );

-- Les admins peuvent supprimer
CREATE POLICY "Admin can delete order_suppliers"
  ON order_suppliers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- SHIPMENTS - RLS Policies
-- =====================================================

-- Les admins peuvent tout voir
CREATE POLICY "Admin can view all shipments"
  ON shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Les clients ne voient que leurs propres expéditions
CREATE POLICY "Users can view their shipments"
  ON shipments FOR SELECT
  USING (client_id = auth.uid());

-- Les admins peuvent insérer
CREATE POLICY "Admin can insert shipments"
  ON shipments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Les clients peuvent insérer pour leurs propres expéditions
CREATE POLICY "Users can insert their shipments"
  ON shipments FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- Les admins peuvent modifier
CREATE POLICY "Admin can update shipments"
  ON shipments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Les clients peuvent modifier leurs propres expéditions
CREATE POLICY "Users can update their shipments"
  ON shipments FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Les admins peuvent supprimer
CREATE POLICY "Admin can delete shipments"
  ON shipments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- INVENTORY - RLS Policies
-- =====================================================

-- Les admins peuvent tout voir
CREATE POLICY "Admin can view all inventory"
  ON inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Les clients ne voient que leur propre stock
CREATE POLICY "Users can view their inventory"
  ON inventory FOR SELECT
  USING (client_id = auth.uid());

-- Les admins peuvent insérer
CREATE POLICY "Admin can insert inventory"
  ON inventory FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Les clients peuvent insérer dans leur propre stock
CREATE POLICY "Users can insert their inventory"
  ON inventory FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- Les admins peuvent modifier
CREATE POLICY "Admin can update inventory"
  ON inventory FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Les clients peuvent modifier leur propre stock
CREATE POLICY "Users can update their inventory"
  ON inventory FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Les admins peuvent supprimer
CREATE POLICY "Admin can delete inventory"
  ON inventory FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- END OF MIGRATION FILE
-- =====================================================
-- Migration complète pour la plateforme CARAXES
-- Tables créées: suppliers, order_suppliers, shipments, inventory
-- Profils mis à jour avec services_enabled
-- RLS activé pour tous les tables de données sensibles
