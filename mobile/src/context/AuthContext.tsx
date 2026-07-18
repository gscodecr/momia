import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  payment_preference?: string;
  subscription_type?: string;
  address?: string;
  athlete_profile?: {
    discipline?: string;
    weight?: string;
    body_fat?: string;
    ftp?: number;
    heart_rate_zones?: string;
    injuries?: string;
  };
  role: {
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadUser = async () => {
    try {
      let token: string | null = null;
      if (Platform.OS === 'web') {
        token = localStorage.getItem('token');
      } else {
        token = await SecureStore.getItemAsync('token');
      }

      if (token) {
        const res = await api.get('/auth/me');
        setUser(res.data);
      }
    } catch (e) {
      console.log('Failed to load session:', e);
      if (Platform.OS === 'web') {
        localStorage.removeItem('token');
      } else {
        await SecureStore.deleteItemAsync('token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    loadUser();
  }, []);

  const login = async (token: string, userData: User) => {
    if (Platform.OS === 'web') {
      localStorage.setItem('token', token);
    } else {
      await SecureStore.setItemAsync('token', token);
    }
    setUser(userData);
    router.replace('/(tabs)/dashboard');
  };

  const logout = async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('token');
    } else {
      await SecureStore.deleteItemAsync('token');
    }
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};
