// Scheduling types
export type Priority = 'normal' | 'high' | 'emergency';
export type RecurrenceType = 'none' | 'daily' | 'weekly';

// Shared scheduling fields for all content types
export interface ScheduleFields {
  schedule_start_date?: string;
  schedule_end_date?: string;
  schedule_time_start?: string;  // HH:MM format (e.g., '09:00')
  schedule_time_end?: string;    // HH:MM format (e.g., '17:00')
  recurrence_type?: RecurrenceType;
  recurrence_days?: number[];    // 0=Sunday, 1=Monday, ..., 6=Saturday
  priority?: Priority;
}

export interface Announcement extends ScheduleFields {
  id: string;
  title: string;
  body: string;
  image_url?: string;
  created_at: string;
  is_active: boolean;
}


export interface Event extends ScheduleFields {
  id: string;
  title: string;
  description: string;
  location?: string;
  start_date: string;
  end_date?: string;
  image_url?: string;
  created_at: string;
  is_active: boolean;
}


export interface Media extends ScheduleFields {
  id: string;
  title?: string;
  description?: string;
  file_url: string;
  file_type: 'image' | 'video';
  file_name: string;
  file_size?: number;
  created_at: string;
  is_active: boolean;
  client_id?: string;
  status?: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  schedule_start_date?: string;
  schedule_end_date?: string;
  is_fallback?: boolean;  // Mark as fallback content when no scheduled content is available
}


export interface Client {
  id: string;
  name: string;
  email: string;
  organization: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role?: 'admin' | 'client';
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}