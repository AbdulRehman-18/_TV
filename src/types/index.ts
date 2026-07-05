// ─── Scheduling Types ────────────────────────────────────────────────────────
export type Priority = 'normal' | 'high' | 'emergency';
export type RecurrenceType = 'none' | 'daily' | 'weekly';
export type ContentStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'client';

// Shared scheduling fields for all content types
export interface ScheduleFields {
  schedule_start_date?: string;
  schedule_end_date?: string;
  schedule_time_start?: string;  // HH:MM format
  schedule_time_end?: string;    // HH:MM format
  recurrence_type?: RecurrenceType;
  recurrence_days?: number[];    // 0=Sunday … 6=Saturday
  priority?: Priority;
  duration?: number;
  client_id?: string;
  status?: ContentStatus;
  admin_notes?: string;
}

// ─── Content Models ──────────────────────────────────────────────────────────
export interface Announcement extends ScheduleFields {
  id: string;
  title: string;
  body: string;
  image?: string;
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
  image?: string;
  image_url?: string;
  created_at: string;
  is_active: boolean;
}

export interface Media extends ScheduleFields {
  id: string;
  title?: string;
  description?: string;
  file?: string;
  file_url: string;
  file_type: 'image' | 'video';
  file_name: string;
  file_size?: number;
  created_at: string;
  is_active: boolean;
  is_fallback?: boolean;
}

// ─── Users ───────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name: string;
  is_verified: boolean;
  is_admin: boolean;
  role: UserRole;
  date_joined: string;

  // Legacy/optional fields (may not be present depending on backend)
  username?: string;
  organization?: string;
  phone?: string;
  is_approved?: boolean;
  is_active?: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}

// ─── Client ──────────────────────────────────────────────────────────────────
export interface Client {
  id: string;
  name: string;
  email: string;
  organization: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Schedule Response ───────────────────────────────────────────────────────
export interface ActiveScheduleResponse {
  announcements: Announcement[];
  events: Event[];
  media: Media[];
  fallback_media: Media[];
  timestamp: string;
}