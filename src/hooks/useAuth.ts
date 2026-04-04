import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { AuthState, User } from '@/types';

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a token and fetch the user profile
    const checkAuth = async () => {
      if (!api.auth.isLoggedIn()) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userData = await api.auth.getMe();
        if (userData) {
          setUser(userData as User);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { user, loading };
}