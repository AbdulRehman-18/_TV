/*
# Create announcements table and setup

This migration creates the core announcements table with all necessary features:

1. New Tables
   - `announcements` table with:
     - `id` (uuid, primary key, auto-generated)
     - `title` (text, required) - announcement title
     - `body` (text, required) - announcement content
     - `image_url` (text, optional) - URL for announcement image
     - `created_at` (timestamp, auto-generated)
     - `is_active` (boolean, default true) - controls display visibility

2. Security
   - Enable Row Level Security (RLS) on announcements table
   - Allow authenticated users (admins) full CRUD access
   - Allow public read access only to active announcements for display page

3. Storage
   - Create 'announcements' bucket for image uploads
   - Allow authenticated users to upload images
   - Allow public read access to stored images
*/

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admins)
CREATE POLICY "Authenticated users can read announcements"
ON announcements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert announcements"
ON announcements FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update announcements"
ON announcements FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete announcements"
ON announcements FOR DELETE
TO authenticated
USING (true);

-- Allow public read access for the display page (only active announcements)
CREATE POLICY "Public can read active announcements"
ON announcements FOR SELECT
TO anon
USING (is_active = true);

-- Create storage bucket for announcement images
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('announcements', 'announcements', true);
EXCEPTION
  WHEN unique_violation THEN
    -- Bucket already exists, do nothing
    NULL;
END $$;

-- Create storage policy for authenticated users to upload
DO $$
BEGIN
  CREATE POLICY "Authenticated users can upload announcement images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'announcements');
EXCEPTION
  WHEN duplicate_object THEN
    -- Policy already exists, do nothing
    NULL;
END $$;

-- Allow public read access to announcement images
DO $$
BEGIN
  CREATE POLICY "Anyone can view announcement images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'announcements');
EXCEPTION
  WHEN duplicate_object THEN
    -- Policy already exists, do nothing
    NULL;
END $$;