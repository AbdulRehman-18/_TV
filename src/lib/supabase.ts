import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket for announcement images
export const ANNOUNCEMENTS_BUCKET = 'announcements';

// Storage bucket for event images
export const EVENTS_BUCKET = 'events';

// Storage bucket for media files
export const MEDIA_BUCKET = 'media';