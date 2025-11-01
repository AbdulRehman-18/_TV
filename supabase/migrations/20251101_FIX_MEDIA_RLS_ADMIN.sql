/*
# FIX: RLS Policies Blocking Media Reads for Admin
# Similar to clients table, the media table RLS is blocking admin access
*/

-- ============================================
-- STEP 1: Disable RLS temporarily to verify data exists
-- ============================================

ALTER TABLE media DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Check data is actually there
-- ============================================

SELECT COUNT(*) as total_media FROM public.media;
SELECT COUNT(*) as client_media FROM public.media WHERE client_id IS NOT NULL;
SELECT id, title, client_id, status, created_at FROM public.media WHERE client_id IS NOT NULL;

-- ============================================
-- STEP 2: Drop all existing problematic policies
-- ============================================

DROP POLICY IF EXISTS "Anyone can read approved media" ON media;
DROP POLICY IF EXISTS "Users can read their own media" ON media;
DROP POLICY IF EXISTS "Admin reads all media" ON media;
DROP POLICY IF EXISTS "Public reads approved media" ON media;
DROP POLICY IF EXISTS "Users can upload media" ON media;
DROP POLICY IF EXISTS "Users update their own media" ON media;
DROP POLICY IF EXISTS "Admin updates all media" ON media;
DROP POLICY IF EXISTS "Users delete their own media" ON media;
DROP POLICY IF EXISTS "Admin deletes all media" ON media;
DROP POLICY IF EXISTS "media_select_public" ON media;
DROP POLICY IF EXISTS "media_select_auth" ON media;
DROP POLICY IF EXISTS "media_insert_auth" ON media;
DROP POLICY IF EXISTS "media_update_auth" ON media;
DROP POLICY IF EXISTS "media_delete_auth" ON media;

-- ============================================
-- STEP 3: Re-enable RLS
-- ============================================

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create NEW permissive policies
-- ============================================

-- PUBLIC: Can read approved active media (for Display page)
CREATE POLICY "public_read_approved_media"
ON media FOR SELECT
TO anon
USING (status = 'approved' AND is_active = true);

-- AUTHENTICATED: Can read all media (for admin dashboard)
CREATE POLICY "authenticated_read_all_media"
ON media FOR SELECT
TO authenticated
USING (true);

-- AUTHENTICATED: Can insert media
CREATE POLICY "authenticated_insert_media"
ON media FOR INSERT
TO authenticated
WITH CHECK (true);

-- AUTHENTICATED: Can update media
CREATE POLICY "authenticated_update_media"
ON media FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- AUTHENTICATED: Can delete media
CREATE POLICY "authenticated_delete_media"
ON media FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- STEP 5: Verify policies are created
-- ============================================

SELECT 
  policyname,
  permissive,
  cmd,
  qual::text as conditions
FROM pg_policies
WHERE tablename = 'media'
ORDER BY policyname;

-- Try querying media
SELECT COUNT(*) as total_media FROM public.media;
SELECT COUNT(*) as client_media FROM public.media WHERE client_id IS NOT NULL;
