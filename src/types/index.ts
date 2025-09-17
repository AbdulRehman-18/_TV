export interface Announcement {
  id: string;
  title: string;
  body: string;
  image_url?: string;
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