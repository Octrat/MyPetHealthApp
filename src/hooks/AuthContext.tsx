// src/hooks/AuthContext.tsx
import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import { User, LoginCredentials, RegisterData } from '../types';
import { BASE_URL } from '../config/api';

interface AuthResult {
  success: boolean;
  data?: { token: string; user: User };
  error?: string;
}

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  getCachedAvatarUri: () => Promise<string | null>;
  avatarUri: string | null;
}

const AUTH_URL = `${BASE_URL}/api/auth`;
const USER_URL = `${BASE_URL}/api/user`;

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Функция для предзагрузки аватара
const prefetchAvatar = async (avatarPath: string | undefined) => {
  if (!avatarPath) return false;

  try {
    const avatarUrl = `${BASE_URL}${avatarPath}`;
    await Image.prefetch(avatarUrl);
    return true;
  } catch (error) {
    console.log('Avatar prefetch error:', error);
    return false;
  }
};

const useAuthLogic = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  // Загрузка аватара
  const loadAvatar = async (avatarPath: string | undefined) => {
    if (!avatarPath) {
      setAvatarUri(null);
      return null;
    }

    const avatarUrl = `${BASE_URL}${avatarPath}`;
    setAvatarUri(avatarUrl);
    return avatarUrl;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');

        if (token && userData) {
          const parsedUser = JSON.parse(userData);

          if (parsedUser.avatar_path) {
            await prefetchAvatar(parsedUser.avatar_path);
            await loadAvatar(parsedUser.avatar_path);
          }

          setUser(parsedUser);
        }
      } catch (e) {
        console.log('Auth check error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (
    credentials: LoginCredentials
  ): Promise<AuthResult> => {
    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Ошибка входа',
        };
      }

      const loggedUser: User = result.user;
      const token: string = result.token;

      if (loggedUser.avatar_path) {
        await prefetchAvatar(loggedUser.avatar_path);
        await loadAvatar(loggedUser.avatar_path);
      }

      const userToSave = {
        ...loggedUser,
        avatar_path: loggedUser.avatar_path || '',
      };

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userToSave));
      setUser(userToSave);

      return {
        success: true,
        data: { token, user: loggedUser },
      };
    } catch (error) {
      console.log('Login error:', error);
      return {
        success: false,
        error: 'Ошибка сети',
      };
    }
  };

  const register = async (data: RegisterData): Promise<AuthResult> => {
    try {
      const payload = {
        email: data.email,
        password: data.password,
        name: data.name,
      };

      const response = await fetch(`${AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Ошибка регистрации',
        };
      }

      const registeredUser: User = result.user;
      const token: string = result.token;

      const userToSave = {
        ...registeredUser,
        avatar_path: registeredUser.avatar_path || '',
      };

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userToSave));
      setUser(userToSave);

      return {
        success: true,
        data: { token, user: registeredUser },
      };
    } catch (error) {
      console.log('Register error:', error);
      return {
        success: false,
        error: 'Ошибка сети',
      };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    setAvatarUri(null);
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

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка обновления');
      }

      const updatedUser = {
        ...user,
        ...data,
        ...result.user,
      };

      if (
        updatedUser.avatar_path &&
        updatedUser.avatar_path !== user.avatar_path
      ) {
        await prefetchAvatar(updatedUser.avatar_path);
        await loadAvatar(updatedUser.avatar_path);
      }

      setUser(updatedUser);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const token = await AsyncStorage.getItem('userToken');

      const response = await fetch(`${USER_URL}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка получения данных');
      }

      const updatedUser = {
        ...user,
        ...result.user,
      };

      if (updatedUser.avatar_path) {
        await prefetchAvatar(updatedUser.avatar_path);
        await loadAvatar(updatedUser.avatar_path);
      }

      setUser(updatedUser);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const getCachedAvatarUri = async () => {
    return avatarUri;
  };

  return {
    user,
    isLoading,
    isAdmin,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    getCachedAvatarUri,
    avatarUri,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthLogic();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};