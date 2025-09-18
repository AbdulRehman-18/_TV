/*
# Seed sample event data

This migration adds sample events for testing and demonstration:

1. Sample Data
   - 6 example events with varied content and dates
   - Mix of upcoming, ongoing, and past events
   - Different types: meetings, workshops, social events, holidays

2. Purpose
   - Provides immediate content for testing the events display
   - Demonstrates different event types and statuses
   - Shows both active and inactive events
*/

-- Insert sample events
INSERT INTO events (title, description, location, start_date, end_date, is_active) VALUES
(
  'Monthly Team Meeting',
  'Join us for our monthly all-hands team meeting to discuss project updates, upcoming initiatives, and celebrate team achievements. Light refreshments will be provided.',
  'Conference Room A',
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '2 days 2 hours',
  true
),
(
  'Annual Company Picnic',
  'Celebrate the year with food, games, and team building activities. Bring your family and enjoy a day of fun in the sun!',
  'Central Park',
  NOW() + INTERVAL '1 week',
  NOW() + INTERVAL '1 week 8 hours',
  true
),
(
  'Product Launch Workshop',
  'Hands-on workshop to learn about our new product features and capabilities. Bring your laptop and get ready to explore the latest innovations.',
  'Training Room B',
  NOW() + INTERVAL '3 days',
  NOW() + INTERVAL '3 days 4 hours',
  true
),
(
  'Holiday Office Closure',
  'The office will be closed in observance of the national holiday. Normal business operations will resume on the following business day.',
  'All Locations',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days',
  true
),
(
  'Quarterly Review Meeting',
  'Review the past quarter performance, discuss achievements, and plan for the upcoming quarter. Senior management will be present.',
  'Board Room',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days 3 hours',
  false
),
(
  'New Employee Orientation',
  'Welcome our newest team members! This orientation will cover company policies, procedures, and help new hires get settled in.',
  'HR Conference Room',
  NOW() + INTERVAL '5 days',
  NOW() + INTERVAL '5 days 3 hours',
  true
);