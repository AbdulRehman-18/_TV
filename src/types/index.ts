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
  title: string;
  description?: string;
  file_url: string;
  file_type: 'image' | 'video';
  file_name: string;
  file_size?: number;
  created_at: string;
  is_active: boolean;
}

export interface User {
  id: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}