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

  // Simple hash function for passwords
  const hashPassword = async (password: string): Promise<string> => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Subtle crypto not available, using fallback/plaintext');
      return password;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const hashedPassword = await hashPassword(password);

      // Query the users table directly
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username);

      if (error || !data || data.length === 0) {
        return false;
      }

      const dbUser = data[0];

      // Support both hashed and plaintext password matching
      const isValidPassword = 
        dbUser.password_hash === password || 
        dbUser.password_hash === hashedPassword;

      if (!isValidPassword) {
        return false;
      }

      const loggedInUser: User = {
        id: dbUser.id,
        username: dbUser.username,
        role: dbUser.role as 'admin' | 'manager' | 'guest',
        avatar_url: dbUser.avatar_url
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
