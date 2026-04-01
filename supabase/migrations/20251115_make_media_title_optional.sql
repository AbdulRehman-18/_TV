/*
# Make media title optional

This migration updates the media table to make the title column optional
(nullable) since media files can be displayed without titles.
*/

-- Alter media table to make title nullable
ALTER TABLE media
ALTER COLUMN title DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN media.title IS 'media title (optional) - can be NULL if media is displayed without title';
