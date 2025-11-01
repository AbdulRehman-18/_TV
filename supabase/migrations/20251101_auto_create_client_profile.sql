/*
# AUTO-CREATE CLIENT PROFILE ON USER SIGNUP
# This migration creates a trigger that automatically adds a new client record
# whenever a user signs up in Supabase Auth
*/

-- ============================================
-- STEP 1: Create function to auto-create client
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
-- STEP 2: Drop existing trigger if it exists
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- STEP 3: Create trigger on auth.users table
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- STEP 4: Backfill existing users
-- ============================================

-- This adds client records for any users that already exist in auth.users
-- but don't have a client record yet
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
-- VERIFY
-- ============================================

-- Check that trigger exists
SELECT trigger_name, event_object_table, trigger_definition
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Count clients in database
SELECT COUNT(*) as total_clients FROM public.clients;

-- List all clients
SELECT id, email, name, created_at, is_approved FROM public.clients ORDER BY created_at DESC;
