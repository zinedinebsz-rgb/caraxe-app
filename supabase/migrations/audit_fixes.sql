-- Migration: audit_fixes.sql
-- Purpose: Add missing FK indexes, enable RLS on welcome_config, extend audit triggers
-- Date: 2026-04-16

-- ============================================================================
-- 1. CREATE MISSING FOREIGN KEY INDEXES
-- ============================================================================
-- These indexes improve query performance on FK lookups and maintain referential integrity

CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON welcome_config
-- ============================================================================

DO $$
BEGIN
  -- Check if welcome_config table exists and enable RLS
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'welcome_config'
  ) THEN
    -- Enable RLS on the table
    ALTER TABLE IF EXISTS welcome_config ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "admins_full_access" ON welcome_config;
    DROP POLICY IF EXISTS "authenticated_select_only" ON welcome_config;

    -- Policy 1: Admins can do everything (SELECT, INSERT, UPDATE, DELETE)
    CREATE POLICY "admins_full_access" ON welcome_config
      AS PERMISSIVE FOR ALL
      USING (is_admin())
      WITH CHECK (is_admin());

    -- Policy 2: Authenticated users can SELECT only
    CREATE POLICY "authenticated_select_only" ON welcome_config
      AS PERMISSIVE FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================================
-- 3. EXTEND AUDIT_LOG TRIGGERS
-- ============================================================================

-- Create or replace the generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_event TEXT;
  v_actor_id UUID;
  v_target_id UUID;
  v_meta JSONB;
BEGIN
  -- Determine the event type
  IF TG_OP = 'DELETE' THEN
    v_event := TG_TABLE_NAME || '.deleted';
    v_target_id := OLD.id;
    v_actor_id := auth.uid();
    v_meta := row_to_json(OLD);
  ELSIF TG_OP = 'INSERT' THEN
    v_event := TG_TABLE_NAME || '.created';
    v_target_id := NEW.id;
    v_actor_id := auth.uid();
    v_meta := row_to_json(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_event := TG_TABLE_NAME || '.updated';
    v_target_id := NEW.id;
    v_actor_id := auth.uid();
    v_meta := jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    );
  END IF;

  -- Insert into audit_log
  INSERT INTO audit_log (event, actor_id, target_id, meta, created_at)
  VALUES (v_event, v_actor_id, v_target_id, v_meta, NOW());

  -- Return the appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger: orders.deleted
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) THEN
    DROP TRIGGER IF EXISTS audit_orders_delete ON orders;
    CREATE TRIGGER audit_orders_delete
      AFTER DELETE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION audit_trigger_func();
  END IF;
END $$;

-- ============================================================================
-- Trigger: profiles.updated (tier column only)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    DROP TRIGGER IF EXISTS audit_profiles_tier_update ON profiles;
    CREATE TRIGGER audit_profiles_tier_update
      AFTER UPDATE OF client_tier ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION audit_trigger_func();
  END IF;
END $$;

-- ============================================================================
-- Trigger: profiles.deleted (client deletion)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    DROP TRIGGER IF EXISTS audit_profiles_delete ON profiles;
    CREATE TRIGGER audit_profiles_delete
      AFTER DELETE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION audit_trigger_func();
  END IF;
END $$;

-- ============================================================================
-- Trigger: documents.inserted (admin document access)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'documents'
  ) THEN
    DROP TRIGGER IF EXISTS audit_documents_insert ON documents;
    CREATE TRIGGER audit_documents_insert
      AFTER INSERT ON documents
      FOR EACH ROW
      EXECUTE FUNCTION audit_trigger_func();
  END IF;
END $$;

-- ============================================================================
-- Trigger: documents.deleted (admin document access)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'documents'
  ) THEN
    DROP TRIGGER IF EXISTS audit_documents_delete ON documents;
    CREATE TRIGGER audit_documents_delete
      AFTER DELETE ON documents
      FOR EACH ROW
      EXECUTE FUNCTION audit_trigger_func();
  END IF;
END $$;

-- ============================================================================
-- Verification: Ensure audit_log table exists
-- ============================================================================
-- This is a safety check; the audit_log table should exist before running this migration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'audit_log'
  ) THEN
    RAISE WARNING 'audit_log table does not exist. Please create it before running audit triggers.';
  END IF;
END $$;

-- ============================================================================
-- End of Migration
-- ============================================================================
