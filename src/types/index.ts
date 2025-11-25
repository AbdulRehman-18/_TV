export interface Announcement {
  id: string;
  title: string;
  body: string;
  image_url?: string;
  created_at: string;
  is_active: boolean;
}

export interface Event {
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

export interface Media {
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
}

export interface Client {
  id: string;
  name: string;
  phone_number: string;
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