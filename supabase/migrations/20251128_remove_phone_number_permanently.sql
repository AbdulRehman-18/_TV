/*
# PERMANENTLY REMOVE PHONE NUMBER FIELD
# This migration drops the phone_number column from the clients table
# and updates the handle_new_user trigger function.
*/

-- Update the handle_new_user function to remove phone_number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.clients (id, email, name, organization, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'organization',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the phone_number column
ALTER TABLE public.clients DROP COLUMN IF EXISTS phone_number;
