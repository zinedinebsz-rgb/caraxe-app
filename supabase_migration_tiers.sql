-- ═══════════════════════════════════════════════════════════════
-- CARAXES — Migration: Ajout du système de tiers clients
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Ajouter la colonne client_tier à la table profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS client_tier TEXT DEFAULT 'starter'
CHECK (client_tier IN ('grossiste', 'revendeur', 'starter'));

-- 2. Mettre à jour les profils existants (tous en 'starter' par défaut)
UPDATE profiles SET client_tier = 'starter' WHERE client_tier IS NULL;

-- 3. Autoriser la mise à jour du tier par les admins
-- (Optionnel: ajouter une policy RLS si nécessaire)
-- CREATE POLICY "Admins can update client_tier" ON profiles
--   FOR UPDATE USING (
--     auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
--   );
