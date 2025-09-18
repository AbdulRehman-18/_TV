/*
# Create events table and setup

This migration creates the events table with all necessary features:

1. New Tables
   - `events` table with:
     - `id` (uuid, primary key, auto-generated)
     - `title` (text, required) - event title
     - `description` (text, required) - event description
     - `location` (text, optional) - event location
     - `start_date` (timestamptz, required) - event start date and time
     - `end_date` (timestamptz, optional) - event end date and time
     - `image_url` (text, optional) - URL for event image
     - `created_at` (timestamp, auto-generated)
     - `is_active` (boolean, default true) - controls display visibility

2. Security
   - Enable Row Level Security (RLS) on events table
   - Allow authenticated users (admins) full CRUD access
   - Allow public read access only to active events for display page

3. Storage
   - Create 'events' bucket for image uploads
   - Allow authenticated users to upload images
   - Allow public read access to stored images
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  location text,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  image_url text,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admins)
CREATE POLICY "Authenticated users can read events"
ON events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert events"
ON events FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
ON events FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete events"
ON events FOR DELETE
TO authenticated
USING (true);

-- Allow public read access for the display page (only active events)
CREATE POLICY "Public can read active events"
ON events FOR SELECT
TO anon
USING (is_active = true);

-- Create storage bucket for event images
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('events', 'events', true);
EXCEPTION
  WHEN unique_violation THEN
    -- Bucket already exists, do nothing
    NULL;
END $$;

-- Create storage policy for authenticated users to upload
DO $$
BEGIN
  CREATE POLICY "Authenticated users can upload event images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'events');
EXCEPTION
  WHEN duplicate_object THEN
    -- Policy already exists, do nothing
    NULL;
END $$;

-- Allow public read access to event images
DO $$
BEGIN
  CREATE POLICY "Anyone can view event images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'events');
EXCEPTION
  WHEN duplicate_object THEN
    -- Policy already exists, do nothing
    NULL;
END $$;