/*
# Add Scheduling Fields Migration

This migration adds comprehensive scheduling capabilities to all content types:

1. Scheduling Fields Added to All Tables:
   - `schedule_start_date` - When content should start appearing
   - `schedule_end_date` - When content should stop appearing
   - `schedule_time_start` - Daily start time (e.g., '09:00')
   - `schedule_time_end` - Daily end time (e.g., '17:00')
   - `recurrence_type` - 'none', 'daily', or 'weekly'
   - `recurrence_days` - Array of days (0=Sunday, 6=Saturday) for weekly recurrence
   - `priority` - 'normal', 'high', or 'emergency'

2. Media-Specific Fields:
   - `is_fallback` - Mark media as default fallback content

3. Behavior:
   - All fields are optional (NULL allowed) for backward compatibility
   - Emergency priority content overrides all other content
   - Fallback content plays when no scheduled content is available
   - Time slots allow content to show only during specific hours
   - Recurrence patterns enable daily or weekly repeats
*/

-- ============================================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================================

-- Add scheduling fields to announcements
ALTER TABLE announcements 
  ADD COLUMN IF NOT EXISTS schedule_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS schedule_end_date timestamptz,
  ADD COLUMN IF NOT EXISTS schedule_time_start time,
  ADD COLUMN IF NOT EXISTS schedule_time_end time,
  ADD COLUMN IF NOT EXISTS recurrence_type text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_days integer[],
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';

-- Add constraints for announcements
DO $$ 
BEGIN
  -- Check recurrence_type values
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'announcements_recurrence_type_check'
  ) THEN
    ALTER TABLE announcements 
      ADD CONSTRAINT announcements_recurrence_type_check 
      CHECK (recurrence_type IN ('none', 'daily', 'weekly'));
  END IF;

  -- Check priority values
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'announcements_priority_check'
  ) THEN
    ALTER TABLE announcements 
      ADD CONSTRAINT announcements_priority_check 
      CHECK (priority IN ('normal', 'high', 'emergency'));
  END IF;

  -- Check that recurrence_days only contains 0-6
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'announcements_recurrence_days_check'
  ) THEN
    ALTER TABLE announcements 
      ADD CONSTRAINT announcements_recurrence_days_check 
      CHECK (
        recurrence_days IS NULL OR 
        (recurrence_days <@ ARRAY[0,1,2,3,4,5,6])
      );
  END IF;
END $$;

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================

-- Add scheduling fields to events (events already have start_date/end_date for event timing)
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS schedule_time_start time,
  ADD COLUMN IF NOT EXISTS schedule_time_end time,
  ADD COLUMN IF NOT EXISTS recurrence_type text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_days integer[],
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';

-- Add constraints for events
DO $$ 
BEGIN
  -- Check recurrence_type values
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'events_recurrence_type_check'
  ) THEN
    ALTER TABLE events 
      ADD CONSTRAINT events_recurrence_type_check 
      CHECK (recurrence_type IN ('none', 'daily', 'weekly'));
  END IF;

  -- Check priority values
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'events_priority_check'
  ) THEN
    ALTER TABLE events 
      ADD CONSTRAINT events_priority_check 
      CHECK (priority IN ('normal', 'high', 'emergency'));
  END IF;

  -- Check that recurrence_days only contains 0-6
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'events_recurrence_days_check'
  ) THEN
    ALTER TABLE events 
      ADD CONSTRAINT events_recurrence_days_check 
      CHECK (
        recurrence_days IS NULL OR 
        (recurrence_days <@ ARRAY[0,1,2,3,4,5,6])
      );
  END IF;
END $$;

-- ============================================================================
-- MEDIA TABLE
-- ============================================================================

-- Add scheduling fields to media (media already has schedule_start_date/schedule_end_date)
ALTER TABLE media 
  ADD COLUMN IF NOT EXISTS schedule_time_start time,
  ADD COLUMN IF NOT EXISTS schedule_time_end time,
  ADD COLUMN IF NOT EXISTS recurrence_type text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_days integer[],
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS is_fallback boolean DEFAULT false;

-- Add constraints for media
DO $$ 
BEGIN
  -- Check recurrence_type values
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'media_recurrence_type_check'
  ) THEN
    ALTER TABLE media 
      ADD CONSTRAINT media_recurrence_type_check 
      CHECK (recurrence_type IN ('none', 'daily', 'weekly'));
  END IF;

  -- Check priority values
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'media_priority_check'
  ) THEN
    ALTER TABLE media 
      ADD CONSTRAINT media_priority_check 
      CHECK (priority IN ('normal', 'high', 'emergency'));
  END IF;

  -- Check that recurrence_days only contains 0-6
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'media_recurrence_days_check'
  ) THEN
    ALTER TABLE media 
      ADD CONSTRAINT media_recurrence_days_check 
      CHECK (
        recurrence_days IS NULL OR 
        (recurrence_days <@ ARRAY[0,1,2,3,4,5,6])
      );
  END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for efficient scheduling queries
CREATE INDEX IF NOT EXISTS idx_announcements_schedule 
  ON announcements(schedule_start_date, schedule_end_date, priority) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_events_schedule 
  ON events(start_date, end_date, priority) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_media_schedule 
  ON media(schedule_start_date, schedule_end_date, priority, is_fallback) 
  WHERE is_active = true;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN announcements.schedule_start_date IS 'Start date for when this announcement should appear (optional)';
COMMENT ON COLUMN announcements.schedule_end_date IS 'End date for when this announcement should stop appearing (optional)';
COMMENT ON COLUMN announcements.schedule_time_start IS 'Daily start time in HH:MM format (optional)';
COMMENT ON COLUMN announcements.schedule_time_end IS 'Daily end time in HH:MM format (optional)';
COMMENT ON COLUMN announcements.recurrence_type IS 'Recurrence pattern: none, daily, or weekly';
COMMENT ON COLUMN announcements.recurrence_days IS 'Days of week for weekly recurrence (0=Sunday, 6=Saturday)';
COMMENT ON COLUMN announcements.priority IS 'Priority level: normal, high, or emergency (emergency overrides all)';

COMMENT ON COLUMN events.schedule_time_start IS 'Daily start time in HH:MM format (optional)';
COMMENT ON COLUMN events.schedule_time_end IS 'Daily end time in HH:MM format (optional)';
COMMENT ON COLUMN events.recurrence_type IS 'Recurrence pattern: none, daily, or weekly';
COMMENT ON COLUMN events.recurrence_days IS 'Days of week for weekly recurrence (0=Sunday, 6=Saturday)';
COMMENT ON COLUMN events.priority IS 'Priority level: normal, high, or emergency (emergency overrides all)';

COMMENT ON COLUMN media.schedule_time_start IS 'Daily start time in HH:MM format (optional)';
COMMENT ON COLUMN media.schedule_time_end IS 'Daily end time in HH:MM format (optional)';
COMMENT ON COLUMN media.recurrence_type IS 'Recurrence pattern: none, daily, or weekly';
COMMENT ON COLUMN media.recurrence_days IS 'Days of week for weekly recurrence (0=Sunday, 6=Saturday)';
COMMENT ON COLUMN media.priority IS 'Priority level: normal, high, or emergency (emergency overrides all)';
COMMENT ON COLUMN media.is_fallback IS 'Mark as fallback content to play when no scheduled content is available';
