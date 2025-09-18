/*
# Create media table and setup

This migration creates the media table with all necessary features:

1. New Tables
   - `media` table with:
     - `id` (uuid, primary key, auto-generated)
     - `title` (text, required) - media title
     - `description` (text, optional) - media description
     - `file_url` (text, required) - URL for the media file
     - `file_type` (text, required) - 'image' or 'video'
     - `file_name` (text, required) - original file name
     - `file_size` (bigint, optional) - file size in bytes
     - `created_at` (timestamp, auto-generated)
     - `is_active` (boolean, default true) - controls display visibility

2. Security
   - Enable Row Level Security (RLS) on media table
   - Allow authenticated users (admins) full CRUD access
   - Allow public read access only to active media for display page

3. Storage
   - Create 'media' bucket for image and video uploads
   - Allow authenticated users to upload media files
   - Allow public read access to stored media files
*/

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'video')),
  file_name text NOT NULL,
  file_size bigint,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admins)
CREATE POLICY "Authenticated users can read media"
ON media FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert media"
ON media FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update media"
ON media FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete media"
ON media FOR DELETE
TO authenticated
USING (true);

-- Allow public read access for the display page (only active media)
CREATE POLICY "Public can read active media"
ON media FOR SELECT
TO anon
USING (is_active = true);

-- Create storage bucket for media files
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('media', 'media', true);
EXCEPTION
  WHEN unique_violation THEN
    -- Bucket already exists, do nothing
    NULL;
END $$;

-- Create storage policy for authenticated users to upload
DO $$
BEGIN
  CREATE POLICY "Authenticated users can upload media files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');
EXCEPTION
  WHEN duplicate_object THEN
    -- Policy already exists, do nothing
    NULL;
END $$;

-- Allow public read access to media files
DO $$
BEGIN
  CREATE POLICY "Anyone can view media files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');
EXCEPTION
  WHEN duplicate_object THEN
    -- Policy already exists, do nothing
    NULL;
END $$;