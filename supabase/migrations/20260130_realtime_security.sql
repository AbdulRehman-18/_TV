-- Enable Realtime for required tables
-- This ensures that postgres_changes events are published for these tables

-- Add announcements table to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
  END IF;
END $$;

-- Add events table to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE events;
  END IF;
END $$;

-- Add media table to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'media'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE media;
  END IF;
END $$;

-- Note: RLS policies should already be in place from previous migrations
-- The existing RLS policies will control what data is visible through realtime subscriptions
