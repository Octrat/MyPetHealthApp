// src/hooks/AuthContext.tsx
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, RegisterData } from '../types';

interface AuthResult {
  success: boolean;
  data?: { token: string; user: User };
  error?: string;
}

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const BASE_URL = 'http://192.168.0.59:3001/api/auth';
const USER_URL = 'http://192.168.0.59:3001/api/user';

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const useAuthLogic = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');
        if (token && userData) setUser(JSON.parse(userData));
      } catch (e) {
        console.log('Auth check error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();
      if (!response.ok) return { success: false, error: result.message || 'Ошибка входа' };

      const user: User = result.user;
      const token: string = result.token;

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify({ ...user, avatar_path: user.avatar_path || '' }));
      setUser({ ...user, avatar_path: user.avatar_path || '' });

      return { success: true, data: { token, user } };
    } catch (error) {
      console.log('Login error:', error);
      return { success: false, error: 'Ошибка сети' };
    }
  };

  const register = async (data: RegisterData): Promise<AuthResult> => {
    try {
      const payload = { email: data.email, password: data.password };
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) return { success: false, error: result.message || 'Ошибка регистрации' };

      const user: User = result.user;
      const token: string = result.token;

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify({ ...user, avatar_path: user.avatar_path || '' }));
      setUser({ ...user, avatar_path: user.avatar_path || '' });

      return { success: true, data: { token, user } };
    } catch (error) {
      console.log('Register error:', error);
      return { success: false, error: 'Ошибка сети' };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(USER_URL, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Ошибка обновления');

      // Сохраняем новые данные локально, мержим с текущим user
      const updatedUser = { ...user, ...data, ...result.user };
      setUser(updatedUser);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  return { user, isLoading, login, register, logout, updateUser };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthLogic();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};