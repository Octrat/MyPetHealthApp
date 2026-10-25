
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
  loginDemo: () => Promise<AuthResult>;
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

// Предзагрузка аватара
const prefetchAvatar = async (avatarPath: string | undefined) => {
  if (!avatarPath) return false;

  try {
    await Image.prefetch(`${BASE_URL}${avatarPath}`);
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

  const loadAvatar = async (avatarPath: string | undefined) => {
    if (!avatarPath) {
      setAvatarUri(null);
      return null;
    }

    const avatarUrl = `${BASE_URL}${avatarPath}`;
    setAvatarUri(avatarUrl);
    return avatarUrl;
  };

  // Восстанавливаем сессию при запуске приложения
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');

        if (token && userData) {
          const parsedUser: User = JSON.parse(userData);

          // Просроченную демосессию не восстанавливаем
          if (
            parsedUser.isDemo &&
            (
              !parsedUser.demoExpiresAt ||
              !Number.isFinite(
                new Date(parsedUser.demoExpiresAt).getTime()
              ) ||
              new Date(parsedUser.demoExpiresAt).getTime() <= Date.now()
            )
          ) {
            await AsyncStorage.multiRemove([
              'userToken',
              'userData',
            ]);
            setAvatarUri(null);
            setUser(null);
            return;
          }

          if (parsedUser.avatar_path) {
            await prefetchAvatar(parsedUser.avatar_path);
            await loadAvatar(parsedUser.avatar_path);
          } else {
            setAvatarUri(null);
          }

          setUser(parsedUser);
        } else {
          // Не оставляем неполную локальную сессию
          await AsyncStorage.multiRemove([
            'userToken',
            'userData',
          ]);
        }
      } catch (error) {
        console.log('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Обычный вход
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

      const userToSave: User = {
        ...loggedUser,
        isDemo: false,
        demoExpiresAt: undefined,
        avatar_path: loggedUser.avatar_path || '',
      };

      if (userToSave.avatar_path) {
        await prefetchAvatar(userToSave.avatar_path);
        await loadAvatar(userToSave.avatar_path);
      } else {
        setAvatarUri(null);
      }

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem(
        'userData',
        JSON.stringify(userToSave)
      );

      setUser(userToSave);

      return {
        success: true,
        data: { token, user: userToSave },
      };
    } catch (error) {
      console.log('Login error:', error);
      return {
        success: false,
        error: 'Ошибка сети',
      };
    }
  };

  // Вход в демонстрационный аккаунт
  const loginDemo = async (): Promise<AuthResult> => {
    try {
      const response = await fetch(`${AUTH_URL}/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Не удалось открыть деморежим',
        };
      }

      const token: string = result.token;

      const demoUser: User = {
        ...result.user,
        isDemo: true,
        demoExpiresAt:
          result.user?.demoExpiresAt ||
          result.demoExpiresAt,
        avatar_path: result.user?.avatar_path || '',
      };

      if (!token || !demoUser.id || !demoUser.demoExpiresAt) {
        return {
          success: false,
          error: 'Сервер вернул неполные данные демосессии',
        };
      }

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem(
        'userData',
        JSON.stringify(demoUser)
      );

      setAvatarUri(null);
      setUser(demoUser);

      return {
        success: true,
        data: { token, user: demoUser },
      };
    } catch (error) {
      console.log('Demo login error:', error);
      return {
        success: false,
        error: 'Не удалось подключиться к серверу',
      };
    }
  };

  // Регистрация
  const register = async (
    data: RegisterData
  ): Promise<AuthResult> => {
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

      const registeredUser: User = {
        ...result.user,
        isDemo: false,
        demoExpiresAt: undefined,
        avatar_path: result.user.avatar_path || '',
      };

      const token: string = result.token;

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem(
        'userData',
        JSON.stringify(registeredUser)
      );

      setAvatarUri(null);
      setUser(registeredUser);

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

  // Выход
  const logout = async () => {
    await AsyncStorage.multiRemove([
      'userToken',
      'userData',
    ]);

    setAvatarUri(null);
    setUser(null);
  };

  // Обновление профиля
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

      const updatedUser: User = {
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
      await AsyncStorage.setItem(
        'userData',
        JSON.stringify(updatedUser)
      );
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  // Обновление данных пользователя с сервера
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
        if (result.demoExpired) {
          await logout();
          return;
        }

        throw new Error(
          result.message || 'Ошибка получения данных'
        );
      }

      const updatedUser: User = {
        ...user,
        ...result.user,
      };

      if (updatedUser.avatar_path) {
        await prefetchAvatar(updatedUser.avatar_path);
        await loadAvatar(updatedUser.avatar_path);
      } else {
        setAvatarUri(null);
      }

      setUser(updatedUser);
      await AsyncStorage.setItem(
        'userData',
        JSON.stringify(updatedUser)
      );
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const getCachedAvatarUri = async () => avatarUri;

  return {
    user,
    isLoading,
    isAdmin,
    login,
    loginDemo,
    register,
    logout,
    updateUser,
    refreshUser,
    getCachedAvatarUri,
    avatarUri,
  };
};

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
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
