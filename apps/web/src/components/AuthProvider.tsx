'use client';
import { getApiUrl } from '../lib/api';

import { createContext, useContext, useEffect, useState } from 'react';
import { getAuthHeaders, getToken, removeToken } from '../lib/auth';
import { useRouter } from 'next/navigation';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(getApiUrl() + '/auth/me', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        removeToken();
        setUser(null);
      }
    } catch (err) {
      console.error('Auth fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = () => {
    removeToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
