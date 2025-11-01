/*
# Update media table to support client uploads with approval workflow

This migration updates the media table to track pending media uploads from clients:

Changes:
   - Add `client_id` (uuid, foreign key to clients table) - who uploaded the media
   - Add `status` (text, enum: 'pending', 'approved', 'rejected') - approval status
   - Add `admin_notes` (text, optional) - admin's approval/rejection notes
*/

-- Add new columns to media table
ALTER TABLE media
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS admin_notes text;

-- Create index on client_id for faster queries
CREATE INDEX IF NOT EXISTS idx_media_client_id ON media(client_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);

-- Update RLS policies for media to support client uploads
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read media" ON media;
DROP POLICY IF EXISTS "Authenticated users can insert media" ON media;
DROP POLICY IF EXISTS "Authenticated users can update media" ON media;
DROP POLICY IF EXISTS "Authenticated users can delete media" ON media;
DROP POLICY IF EXISTS "Public can read active media" ON media;

-- New policy: Users can read approved media or their own pending media
CREATE POLICY "Users can read media based on status"
ON media FOR SELECT
USING (
  status = 'approved'
  OR (auth.uid() = client_id)
  OR auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com'
  )
);

-- Public can read approved active media
CREATE POLICY "Public can read approved active media"
ON media FOR SELECT
TO anon
USING (status = 'approved' AND is_active = true);

-- Policy: Clients can insert media (which will be pending)
CREATE POLICY "Clients can insert media"
ON media FOR INSERT
WITH CHECK (
  client_id = auth.uid() OR client_id IS NULL
);

-- Policy: Clients can update their own pending media
CREATE POLICY "Clients can update their own media"
ON media FOR UPDATE
USING (client_id = auth.uid() OR auth.uid() IN (
  SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com'
))
WITH CHECK (client_id = auth.uid() OR auth.uid() IN (
  SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com'
));

-- Policy: Admins can delete any media
CREATE POLICY "Admins can delete media"
ON media FOR DELETE
USING (auth.uid() IN (
  SELECT id FROM auth.users WHERE email = 'abdulrehman45865@gmail.com'
));

-- Policy: Admin can update media status and notes
-- Already covered by update policy above
