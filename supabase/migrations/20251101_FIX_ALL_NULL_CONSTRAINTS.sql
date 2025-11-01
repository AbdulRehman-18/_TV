/*
# COMPREHENSIVE FIX: All NULL Constraint Errors
# This handles ALL columns with NOT NULL constraints
*/

-- ============================================
-- STEP 1: Check current clients table structure
-- ============================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;


-- ============================================
-- STEP 2: Make Optional Columns Nullable (RECOMMENDED)
-- ============================================
-- This is the BEST solution - allow these columns to be NULL since users don't always provide them

ALTER TABLE clients
ALTER COLUMN phone_number DROP NOT NULL;

ALTER TABLE clients
ALTER COLUMN organization DROP NOT NULL;


-- ============================================
-- STEP 3: Update the trigger function
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.clients (id, email, name, phone_number, organization, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'organization',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- STEP 4: Recreate the trigger
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================
-- STEP 5: Fix existing client records with NULL values
-- ============================================

-- Set empty strings to NULL for phone_number
UPDATE public.clients
SET phone_number = NULL
WHERE phone_number = '' OR phone_number IS NULL;

-- Set empty strings to NULL for organization  
UPDATE public.clients
SET organization = NULL
WHERE organization = '' OR organization IS NULL;


-- ============================================
-- STEP 6: Backfill any missing clients from auth.users
-- ============================================

INSERT INTO public.clients (id, email, name, phone_number, organization, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email),
  au.raw_user_meta_data->>'phone_number',
  au.raw_user_meta_data->>'organization',
  au.created_at
FROM auth.users au
LEFT JOIN public.clients c ON au.id = c.id
WHERE c.id IS NULL
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- STEP 7: Verify the fix
-- ============================================

-- Check table structure (should show nullable columns)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- Count clients
SELECT COUNT(*) as total_clients FROM public.clients;

-- Show all clients
SELECT 
  id, 
  email, 
  name, 
  phone_number,
  organization,
  is_approved,
  created_at
FROM public.clients
ORDER BY created_at DESC;
