/*
# FIX: Update NULL names to use email as fallback
# This will make sure all clients show a name in the UI
*/

-- ============================================
-- Set names to email where name is NULL
-- ============================================

UPDATE public.clients
SET name = email
WHERE name IS NULL;

-- ============================================
-- Verify the fix
-- ============================================

SELECT id, email, name, phone_number, organization, is_approved, created_at
FROM public.clients
ORDER BY created_at DESC;

-- Count how many we fixed
SELECT COUNT(*) as clients_with_name
FROM public.clients
WHERE name IS NOT NULL;
