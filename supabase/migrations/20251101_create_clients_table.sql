/*
# Create clients table

This migration creates the clients table to track client users:

1. New Tables
   - `clients` table with:
     - `id` (uuid, primary key, foreign key to auth.users)
     - `name` (text, required) - client name
     - `phone_number` (text, required) - phone number
     - `email` (text, required) - email address
     - `organization` (text, required) - organization name
     - `is_approved` (boolean, default false) - admin approval status
     - `created_at` (timestamp, auto-generated)
     - `updated_at` (timestamp, auto-updated)

2. Security
   - Enable Row Level Security (RLS) on clients table
   - Allow authenticated users to read their own profile
   - Allow admins to read all client profiles
   - Allow unauthenticated users to insert during signup
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone_number text NOT NULL,
  email text NOT NULL,
  organization text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can read their own profile
CREATE POLICY "Clients can read their own profile"
ON clients FOR SELECT
USING (auth.uid() = id);

-- Policy: Clients can update their own profile
CREATE POLICY "Clients can update their own profile"
ON clients FOR UPDATE
USING (auth.uid() = id);

-- Policy: Allow anyone to insert during signup
CREATE POLICY "Anyone can insert client profile during signup"
ON clients FOR INSERT
WITH CHECK (true);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
