-- ═══════════════════════════════════════════════════════════════
-- CARAXES — Migration: Fix profiles table for onboarding
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Add missing columns for onboarding
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_categories TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Fix client_tier CHECK constraint to include all valid tiers
-- First drop the old constraint (name may vary)
DO $$
BEGIN
  -- Try dropping named constraint
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_client_tier_check;
  -- Also try the default auto-generated name
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_client_tier_check1;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No constraint to drop: %', SQLERRM;
END;
$$;

-- Add client_tier column if it doesn't exist yet
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS client_tier TEXT DEFAULT 'detaillant';

-- Add the corrected CHECK constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_client_tier_check
  CHECK (client_tier IN ('grossiste', 'detaillant', 'ecommerce', 'revendeur', 'starter'));

-- 3. Migrate old tier values to new ones
UPDATE profiles SET client_tier = 'detaillant' WHERE client_tier = 'starter';
UPDATE profiles SET client_tier = 'detaillant' WHERE client_tier = 'revendeur';

-- 4. Ensure RLS allows clients to update their OWN profile
-- (check if policy exists first)
DO $$
BEGIN
  -- Allow clients to update their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  -- Allow clients to read their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
END;
$$;

-- 5. Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verify the migration
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
