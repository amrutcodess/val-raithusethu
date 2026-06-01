import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'manager' | 'guest';
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  updateAvatar: (avatarUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem('kisansethu_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('login_user', {
        p_username: username,
        p_password: password
      });

      if (error || !data || data.length === 0) {
        return false;
      }

      const loggedInUser: User = {
        id: data[0].id,
        username: data[0].username,
        role: data[0].role,
        avatar_url: data[0].avatar_url
      };

      setUser(loggedInUser);
      localStorage.setItem('kisansethu_user', JSON.stringify(loggedInUser));
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kisansethu_user');
  };

  const updateAvatar = async (avatarUrl: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id);

    if (!error) {
      const updatedUser = { ...user, avatar_url: avatarUrl };
      setUser(updatedUser);
      localStorage.setItem('kisansethu_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
