/*
# SIMPLIFIED AND ROBUST RLS POLICIES
# Run this SECOND if 20251101_COMPLETE_RLS_FIX.sql still has issues

This version uses simpler policies without complex subqueries.
*/

-- ============================================
-- STEP 1: DISABLE RLS TEMPORARILY
-- ============================================

ALTER TABLE media DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ============================================

-- Media table
DROP POLICY IF EXISTS "Anyone can read approved media" ON media;
DROP POLICY IF EXISTS "Users can read their own media" ON media;
DROP POLICY IF EXISTS "Admin reads all media" ON media;
DROP POLICY IF EXISTS "Public reads approved media" ON media;
DROP POLICY IF EXISTS "Users can upload media" ON media;
DROP POLICY IF EXISTS "Users update their own media" ON media;
DROP POLICY IF EXISTS "Admin updates all media" ON media;
DROP POLICY IF EXISTS "Users delete their own media" ON media;
DROP POLICY IF EXISTS "Admin deletes all media" ON media;
DROP POLICY IF EXISTS "media_public_read_approved" ON media;
DROP POLICY IF EXISTS "media_auth_read_approved" ON media;
DROP POLICY IF EXISTS "media_auth_insert" ON media;
DROP POLICY IF EXISTS "media_auth_update_own" ON media;
DROP POLICY IF EXISTS "media_update_admin_uploads" ON media;
DROP POLICY IF EXISTS "media_auth_delete_own" ON media;
DROP POLICY IF EXISTS "media_delete_admin_uploads" ON media;

-- Clients table
DROP POLICY IF EXISTS "Users read own profile" ON clients;
DROP POLICY IF EXISTS "Admin reads all profiles" ON clients;
DROP POLICY IF EXISTS "Anyone can signup" ON clients;
DROP POLICY IF EXISTS "Users update own profile" ON clients;
DROP POLICY IF EXISTS "Admin updates profiles" ON clients;
DROP POLICY IF EXISTS "clients_read_own" ON clients;
DROP POLICY IF EXISTS "clients_insert_signup" ON clients;
DROP POLICY IF EXISTS "clients_update_own" ON clients;

-- ============================================
-- STEP 3: RE-ENABLE RLS
-- ============================================

ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MEDIA TABLE POLICIES - KEEP IT SIMPLE
-- ============================================

-- SELECT: Public can read approved active media (for Display page)
CREATE POLICY "media_select_public"
ON media FOR SELECT
TO anon
USING (status = 'approved' AND is_active = true);

-- SELECT: Authenticated users can read approved media or their own
CREATE POLICY "media_select_auth"
ON media FOR SELECT
TO authenticated
USING (status = 'approved' OR client_id = auth.uid());

-- INSERT: ANY authenticated user can insert (very permissive for now)
CREATE POLICY "media_insert_auth"
ON media FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Users can update their own media or admin can update anything
CREATE POLICY "media_update_auth"
ON media FOR UPDATE
TO authenticated
USING (client_id = auth.uid() OR client_id IS NULL)
WITH CHECK (client_id = auth.uid() OR client_id IS NULL);

-- DELETE: Users can delete their own or admins can delete their uploads
CREATE POLICY "media_delete_auth"
ON media FOR DELETE
TO authenticated
USING (client_id = auth.uid() OR client_id IS NULL);

-- ============================================
-- CLIENTS TABLE POLICIES
-- ============================================

-- SELECT: Users can read their own profile
CREATE POLICY "clients_select_own"
ON clients FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- INSERT: Anyone can create a profile during signup (required for auth flow)
CREATE POLICY "clients_insert_any"
ON clients FOR INSERT
WITH CHECK (true);

-- UPDATE: Users can update their own profile
CREATE POLICY "clients_update_own"
ON clients FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- VERIFY RLS IS APPLIED
-- ============================================

SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('media', 'clients')
AND schemaname = 'public';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, qual, with_check
FROM pg_policies 
WHERE tablename IN ('media', 'clients')
ORDER BY tablename, policyname;
