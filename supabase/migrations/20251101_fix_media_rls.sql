/*
# Fix RLS policies for media table - Allow client uploads and admin approval

This migration fixes the RLS policies to properly handle:
- Client uploads (INSERT)
- Client viewing their own media (SELECT)
- Admin viewing all media (SELECT)
- Admin approving/rejecting media (UPDATE)
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read media based on status" ON media;
DROP POLICY IF EXISTS "Public can read approved active media" ON media;
DROP POLICY IF EXISTS "Clients can insert media" ON media;
DROP POLICY IF EXISTS "Clients can update their own media" ON media;
DROP POLICY IF EXISTS "Admins can delete media" ON media;
DROP POLICY IF EXISTS "Authenticated users can read media" ON media;
DROP POLICY IF EXISTS "Authenticated users can insert media" ON media;
DROP POLICY IF EXISTS "Authenticated users can update media" ON media;
DROP POLICY IF EXISTS "Authenticated users can delete media" ON media;
DROP POLICY IF EXISTS "Public can read active media" ON media;

-- Enable RLS on media table
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- ===== SELECT POLICIES =====

-- Clients can read approved media and their own media (any status)
CREATE POLICY "Clients can read approved or own media"
ON media FOR SELECT
USING (
  status = 'approved'
  OR client_id = auth.uid()
);

-- Admin can read all media
CREATE POLICY "Admin can read all media"
ON media FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com'
  )
);

-- Public (anon) can read approved active media
CREATE POLICY "Public can read approved active media"
ON media FOR SELECT
TO anon
USING (status = 'approved' AND is_active = true);

-- ===== INSERT POLICIES =====

-- Authenticated users (clients) can insert media
CREATE POLICY "Authenticated users can insert media"
ON media FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- ===== UPDATE POLICIES =====

-- Clients can only update their own media (status, title, description)
CREATE POLICY "Clients can update own media"
ON media FOR UPDATE
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- Admin can update all media
CREATE POLICY "Admin can update all media"
ON media FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com'
  )
);

-- ===== DELETE POLICIES =====

-- Clients can delete their own media
CREATE POLICY "Clients can delete own media"
ON media FOR DELETE
USING (client_id = auth.uid());

-- Admin can delete any media
CREATE POLICY "Admin can delete any media"
ON media FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com'
  )
);
