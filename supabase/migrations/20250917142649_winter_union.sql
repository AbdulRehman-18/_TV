/*
# Seed sample announcement data

This migration adds sample announcements for testing and demonstration:

1. Sample Data
   - 5 example announcements with varied content
   - Mix of active and inactive announcements
   - Different types: welcome, safety, events, maintenance, holidays

2. Purpose
   - Provides immediate content for testing the display
   - Demonstrates different announcement types
   - Shows both active and inactive states
*/

-- Insert sample announcements
INSERT INTO announcements (title, body, is_active) VALUES 
(
  'Welcome to Smart Corridor Display', 
  'Welcome to our state-of-the-art Smart Corridor Display system. Stay updated with the latest announcements, news, and important information throughout your visit.',
  true
),
(
  'Safety First - Important Reminders', 
  'Please remember to follow all safety protocols while in the building. Wear your ID badge at all times, follow emergency procedures, and report any safety concerns immediately. Your safety is our top priority.',
  true
),
(
  'Monthly Team Meeting - This Friday', 
  'Join us for our monthly all-hands team meeting this Friday at 2:00 PM in Conference Room A. We will discuss project updates, upcoming initiatives, and celebrate team achievements. Light refreshments will be provided.',
  true
),
(
  'Scheduled Maintenance Notice', 
  'Scheduled system maintenance will occur this weekend from Saturday 10 PM to Sunday 6 AM. Some services including elevators and Wi-Fi may be temporarily unavailable during this time. We apologize for any inconvenience.',
  false
),
(
  'Holiday Office Closure', 
  'The office will be closed on Monday in observance of the national holiday. Normal business operations will resume on Tuesday. Have a wonderful and safe long weekend!',
  true
),
(
  'New Security Procedures', 
  'Starting next week, we are implementing enhanced security measures. All visitors must check in at the main reception desk and receive a visitor badge. Please allow extra time for entry procedures.',
  true
);