/*
# FIX: Null value in 'name' column
# This script fixes the constraint violation and re-runs the trigger setup
*/

-- ============================================
-- STEP 1: Recreate the function with NULL handling
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.clients (id, email, name, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 2: Recreate the trigger
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- STEP 3: Fix existing clients with NULL name
-- ============================================

-- This updates any existing client records that have NULL name
-- Sets their name to their email (fallback)
UPDATE public.clients
SET name = email
WHERE name IS NULL;

-- ============================================
-- STEP 4: Verify the fix
-- ============================================

-- Check for any remaining NULL names
SELECT id, email, name, created_at
FROM public.clients
WHERE name IS NULL;

-- Count total clients
SELECT COUNT(*) as total_clients FROM public.clients;

-- Show recent clients with their names
SELECT id, email, name, created_at, is_approved
FROM public.clients
ORDER BY created_at DESC
LIMIT 10;
