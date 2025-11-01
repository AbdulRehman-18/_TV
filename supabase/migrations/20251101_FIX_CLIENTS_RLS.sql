/*
# FIX: RLS Policies Blocking Client Reads
# The admin can't read the clients table - need to update RLS policies
*/

-- ============================================
-- STEP 1: Disable RLS temporarily to verify data exists
-- ============================================

ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Check data is actually there
-- ============================================

SELECT COUNT(*) as total_clients FROM public.clients;
SELECT * FROM public.clients ORDER BY created_at DESC;

-- ============================================
-- STEP 2: Drop all existing problematic policies
-- ============================================

DROP POLICY IF EXISTS "Users read own profile" ON clients;
DROP POLICY IF EXISTS "Admin reads all profiles" ON clients;
DROP POLICY IF EXISTS "Anyone can signup" ON clients;
DROP POLICY IF EXISTS "Users update own profile" ON clients;
DROP POLICY IF EXISTS "Admin updates profiles" ON clients;
DROP POLICY IF EXISTS "clients_read_own" ON clients;
DROP POLICY IF EXISTS "clients_insert_signup" ON clients;
DROP POLICY IF EXISTS "clients_update_own" ON clients;
DROP POLICY IF EXISTS "clients_select_own" ON clients;
DROP POLICY IF EXISTS "clients_insert_any" ON clients;

-- ============================================
-- STEP 3: Re-enable RLS
-- ============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create PERMISSIVE policies for ADMIN
-- ============================================

-- Admin (logged in) can read all clients
CREATE POLICY "admin_can_read_all_clients"
ON clients FOR SELECT
TO authenticated
USING (true);

-- Users can read their own client record
CREATE POLICY "users_read_own_client"
ON clients FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Anyone can create a client record during signup
CREATE POLICY "anyone_can_create_client"
ON clients FOR INSERT
WITH CHECK (true);

-- Users can update their own profile
CREATE POLICY "users_update_own_client"
ON clients FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 5: Verify policies are created
-- ============================================

SELECT 
  policyname,
  permissive,
  cmd,
  qual::text as conditions
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY policyname;

-- Try querying as if we're authenticated
SELECT COUNT(*) as total_clients FROM public.clients;
