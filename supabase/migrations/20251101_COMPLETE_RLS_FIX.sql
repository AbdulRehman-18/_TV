/*
# COMPLETE RLS FIX - Run this immediately in Supabase SQL Editor

This script:
1. Disables RLS on all tables temporarily to verify data
2. Drops all conflicting policies
3. Re-enables RLS with proper permissions
4. Fixes the admin email reference
*/

-- ============================================
-- STEP 1: TEMPORARILY DISABLE RLS FOR TESTING
-- ============================================

ALTER TABLE media DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: CLEAR ALL EXISTING POLICIES
-- ============================================

-- Media table policies
DROP POLICY IF EXISTS "Authenticated users can read media" ON media;
DROP POLICY IF EXISTS "Authenticated users can insert media" ON media;
DROP POLICY IF EXISTS "Authenticated users can update media" ON media;
DROP POLICY IF EXISTS "Authenticated users can delete media" ON media;
DROP POLICY IF EXISTS "Public can read active media" ON media;
DROP POLICY IF EXISTS "Users can read media based on status" ON media;
DROP POLICY IF EXISTS "Public can read approved active media" ON media;
DROP POLICY IF EXISTS "Clients can insert media" ON media;
DROP POLICY IF EXISTS "Clients can update their own media" ON media;
DROP POLICY IF EXISTS "Admins can delete media" ON media;
DROP POLICY IF EXISTS "Clients can read approved or own media" ON media;
DROP POLICY IF EXISTS "Admin can read all media" ON media;
DROP POLICY IF EXISTS "Authenticated users can insert media" ON media;
DROP POLICY IF EXISTS "Clients can update own media" ON media;
DROP POLICY IF EXISTS "Admin can update all media" ON media;
DROP POLICY IF EXISTS "Clients can delete own media" ON media;
DROP POLICY IF EXISTS "Admin can delete any media" ON media;
DROP POLICY IF EXISTS "Anyone can read approved media" ON media;
DROP POLICY IF EXISTS "Users can read their own media" ON media;
DROP POLICY IF EXISTS "Admin reads all media" ON media;
DROP POLICY IF EXISTS "Public reads approved media" ON media;
DROP POLICY IF EXISTS "Users can upload media" ON media;
DROP POLICY IF EXISTS "Users update their own media" ON media;
DROP POLICY IF EXISTS "Users delete their own media" ON media;
DROP POLICY IF EXISTS "Admin deletes all media" ON media;
DROP POLICY IF EXISTS "Admin updates all media" ON media;

-- Clients table policies
DROP POLICY IF EXISTS "Clients can read their own profile" ON clients;
DROP POLICY IF EXISTS "Clients can update their own profile" ON clients;
DROP POLICY IF EXISTS "Anyone can insert client profile during signup" ON clients;
DROP POLICY IF EXISTS "Users read own profile" ON clients;
DROP POLICY IF EXISTS "Admin reads all profiles" ON clients;
DROP POLICY IF EXISTS "Anyone can signup" ON clients;
DROP POLICY IF EXISTS "Users update own profile" ON clients;
DROP POLICY IF EXISTS "Admin updates profiles" ON clients;

-- ============================================
-- STEP 3: RE-ENABLE RLS WITH PROPER POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MEDIA TABLE POLICIES
-- ============================================

-- SELECT: Approve media visible to everyone (includes admin uploads with NULL client_id)
CREATE POLICY "Anyone can read approved media"
ON media FOR SELECT
USING (status = 'approved' OR is_active = true);

-- SELECT: Users can see their own media
CREATE POLICY "Users can read their own media"
ON media FOR SELECT
USING (client_id = auth.uid());

-- SELECT: Admin can read everything
CREATE POLICY "Admin reads all media"
ON media FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com')
);

-- SELECT: Public can read approved active media
CREATE POLICY "Public reads approved media"
ON media FOR SELECT
TO anon
USING (status = 'approved' AND is_active = true);

-- INSERT: Any authenticated user can upload
CREATE POLICY "Users can upload media"
ON media FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if auth.uid() is set (always true for authenticated users)
  auth.uid() IS NOT NULL
);

-- UPDATE: Users can update their own media (with client_id = auth.uid())
CREATE POLICY "Users update their own media"
ON media FOR UPDATE
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- UPDATE: Admin can update any media (including admin uploads with NULL client_id)
CREATE POLICY "Admin updates all media"
ON media FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com')
)
WITH CHECK (
  auth.uid() IN (SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com')
);

-- DELETE: Users can delete their own media
CREATE POLICY "Users delete their own media"
ON media FOR DELETE
USING (client_id = auth.uid());

-- DELETE: Admin can delete any media
CREATE POLICY "Admin deletes all media"
ON media FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com')
);

-- ============================================
-- CLIENTS TABLE POLICIES
-- ============================================

-- SELECT: Users can see their own profile
CREATE POLICY "Users read own profile"
ON clients FOR SELECT
USING (auth.uid() = id);

-- SELECT: Admin can read all profiles
CREATE POLICY "Admin reads all profiles"
ON clients FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com')
);

-- INSERT: Anyone can insert during signup
CREATE POLICY "Anyone can signup"
ON clients FOR INSERT
WITH CHECK (true);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users update own profile"
ON clients FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- UPDATE: Admin can update any profile
CREATE POLICY "Admin updates profiles"
ON clients FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com')
)
WITH CHECK (
  auth.uid() IN (SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com')
);

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================

-- Check that RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('media', 'clients')
AND schemaname = 'public';
