import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthState, User } from '@/types';

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const supaUser = session?.user;
      setUser(supaUser ? { id: supaUser.id, email: supaUser.email ?? '' } : null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const supaUser = session?.user;
      setUser(supaUser ? { id: supaUser.id, email: supaUser.email ?? '' } : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}