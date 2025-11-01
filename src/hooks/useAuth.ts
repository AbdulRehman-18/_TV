import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthState, User } from '@/types';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com';

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const supaUser = session?.user;
      if (supaUser) {
        const role = supaUser.email === ADMIN_EMAIL ? 'admin' : 'client';
        setUser({ id: supaUser.id, email: supaUser.email ?? '', role });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const supaUser = session?.user;
      if (supaUser) {
        const role = supaUser.email === ADMIN_EMAIL ? 'admin' : 'client';
        setUser({ id: supaUser.id, email: supaUser.email ?? '', role });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}