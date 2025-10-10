'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { authService } from '@/lib/firebase/auth';
import { userOperations } from '@/lib/firebase/database';

import { useDatabase } from './DatabaseContext';

import type { User } from '@/types/database';

// Определяем возможные значения для пола для удобства
type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

interface UserContextType {
  currentUser: (User & { userId: string }) | null;
  firebaseUser: any | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  // Обновляем сигнатуру функции register, чтобы принимать новые поля
  register: (email: string, password: string, displayName: string, age?: number, gender?: Gender) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  getUserByEmail: (email: string) => Promise<User | null>;
  getUserById: (userId: string) => Promise<User | null>;
  updateUserData: (data: Partial<Omit<User, 'id'>>) => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useDatabase();
  const [currentUser, setCurrentUser] = useState<(User & { userId: string }) | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ключи для localStorage
  const USER_CACHE_KEY = 'user_cache';
  const USER_CACHE_TIMESTAMP_KEY = 'user_cache_timestamp';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 минут в миллисекундах

  // Функция для сохранения пользователя в кеш
  const saveUserToCache = useCallback((userData: (User & { userId: string }) | null) => {
    try {
      if (userData) {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
        localStorage.setItem(USER_CACHE_TIMESTAMP_KEY, Date.now().toString());
      } else {
        localStorage.removeItem(USER_CACHE_KEY);
        localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
      }
    } catch (error) {
      console.warn('Failed to save user to cache:', error);
    }
  }, []);

  // Функция для загрузки пользователя из кеша
  const loadUserFromCache = useCallback((): (User & { userId: string }) | null => {
    try {
      const cachedUser = localStorage.getItem(USER_CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(USER_CACHE_TIMESTAMP_KEY);
      
      if (!cachedUser || !cachedTimestamp) {
        return null;
      }

      const timestamp = parseInt(cachedTimestamp);
      const now = Date.now();
      
      // Проверяем, не устарел ли кеш
      if (now - timestamp > CACHE_DURATION) {
        localStorage.removeItem(USER_CACHE_KEY);
        localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
        return null;
      }

      return JSON.parse(cachedUser);
    } catch (error) {
      console.warn('Failed to load user from cache:', error);
      return null;
    }
  }, []);

  // Очистка кеша
  const clearUserCache = useCallback(() => {
    try {
      localStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.warn('Failed to clear user cache:', error);
    }
  }, []);

  const refreshUser = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Сначала проверяем кеш
      const cachedUser = loadUserFromCache();
      if (cachedUser && cachedUser.userId === uid) {
        setCurrentUser(cachedUser);
        setLoading(false);
        return;
      }

      const userData = await user.read(uid);
      if (userData) {
        const userWithId = { userId: uid, ...userData };
        setCurrentUser(userWithId);
        saveUserToCache(userWithId);
      } else {
        setCurrentUser(null);
        clearUserCache();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user'));
    } finally {
      setLoading(false);
    }
  }, [user, loadUserFromCache, saveUserToCache, clearUserCache]);
    
  useEffect(() => {
    // При монтировании проверяем кеш
    const checkCacheOnMount = async () => {
      const cachedUser = loadUserFromCache();
      if (cachedUser) {
        setCurrentUser(cachedUser);
        setLoading(false);
      }
    };

    checkCacheOnMount();

    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        await refreshUser(firebaseUser.uid);
      } else {
        setCurrentUser(null);
        clearUserCache();
      }
      setLoading(false);
    });

    // Проверяем, есть ли результат redirect аутентификации
    const checkRedirectResult = async () => {
      try {
        console.log('Checking for redirect result...');
        const redirectResult = await authService.getRedirectResult();
        if (redirectResult) {
          console.log('Redirect result found:', redirectResult);
          const { user, name } = redirectResult;
          setFirebaseUser(user);
          
          const userData = await userOperations.read(user.uid);
          if (!userData) {
            console.log('Creating new user from Google auth...');
            // Добавляем age и gender при создании пользователя
            await userOperations.create(user.uid, {
              email: user.email || '',
              displayName: name,
              age: undefined, // <-- ДОБАВЛЕНО
              gender: undefined, // <-- ДОБАВЛЕНО
              avatarUrl: '',
              avatarStoragePath: '',
              createdAt: new Date().toISOString(),
              role: 'user',
              settings: {
                language: 'en',
                notifications: true
              }
            });
          } else {
            console.log('User already exists, updating...');
          }
          
          await refreshUser(user.uid);
        } else {
          console.log('No redirect result found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking redirect result:', error);
        setLoading(false);
      }
    };

    timeoutRef.current = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, resetting loading state');
        setLoading(false);
      }
    }, 10000);

    checkRedirectResult();

    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [refreshUser, loadUserFromCache]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await authService.login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to login'));
      throw err;
    }
  };

  // Обновленная функция регистрации с новыми полями
  const register = async (
    email: string,
    password: string,
    displayName: string,
    age?: number,
    gender?: Gender
  ) => {
    try {
      setError(null);
      setLoading(true);
      const newFirebaseUser = await authService.register(email, password, displayName);

      if (newFirebaseUser) {
        await userOperations.create(newFirebaseUser.uid, {
          email,
          displayName,
          age: age || 18, // <-- ДОБАВЛЕНО
          gender: gender || "prefer_not_to_say", // <-- ДОБАВЛЕНО
          avatarUrl: '',
          avatarStoragePath: '',
          createdAt: new Date().toISOString(),
          role: 'user',
          settings: {
            language: 'en',
            notifications: true
          }
        });
        await refreshUser(newFirebaseUser.uid);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to register'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
      clearUserCache();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to logout'));
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await authService.resetPassword(email);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reset password'));
      throw err;
    }
  };

  const updateProfile = async (displayName?: string, photoURL?: string) => {
    try {
      setError(null);
      await authService.updateUserProfile(displayName, photoURL);
      if (firebaseUser) {
        await refreshUser(firebaseUser.uid);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      throw err;
    }
  };

  const updateUserData = async (data: Partial<Omit<User, 'id'>>) => {
    if (!currentUser) {
      throw new Error("User is not authenticated.");
    }
    try {
      setError(null);
      setLoading(true);
      // 1. Обновляем данные в базе данных (Firestore/RTDB)
      await userOperations.update(currentUser.userId, data);
      // 2. Обновляем локальный кеш и состояние
      await refreshUser(currentUser.userId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update user data');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = async (newEmail: string) => {
    try {
      setError(null);
      await authService.updateUserEmail(newEmail);
      if (firebaseUser) {
        await refreshUser(firebaseUser.uid);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update email'));
      throw err;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setError(null);
      await authService.updateUserPassword(newPassword);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update password'));
      throw err;
    }
  };

  const deleteAccount = async () => {
    try {
      setError(null);
      await authService.deleteAccount();
      clearUserCache();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete account'));
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    let result: any = null;
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting Google login...');
      result = await authService.loginWithGoogle();
      
      if (result === null) {
        console.log('Google login using redirect method...');
        return;
      }
      
      console.log('Google login successful via popup:', result);
      const { user, name } = result;
      setFirebaseUser(user);
      
      const userData = await userOperations.read(user.uid);
      if (!userData) {
        console.log('Creating new user from Google popup auth...');
        // Добавляем age и gender при создании пользователя
        await userOperations.create(user.uid, {
          email: user.email || '',
          displayName: name,
          age: 18, // <-- ДОБАВЛЕНО
          gender: "prefer_not_to_say", // <-- ДОБАВЛЕНО
          avatarUrl: '',
          avatarStoragePath: '',
          createdAt: new Date().toISOString(),
          role: 'user',
          settings: {
            language: 'en',
            notifications: true
          }
        });
      } else {
        console.log('User already exists from Google popup auth...');
      }
      
      await refreshUser(user.uid);
      setLoading(false);
    } catch (err) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
      setLoading(false);
      throw err;
    }
  };

  const getUserByEmail = async (email: string) => {
    return await userOperations.getByEmail(email);
  };

  const getUserById = async (userId: string) => {
    return await userOperations.getById(userId);
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        error,
        login,
        register,
        logout,
        resetPassword,
        updateProfile,
        updateEmail,
        updatePassword,
        deleteAccount,
        loginWithGoogle,
        getUserByEmail,
        getUserById,
        updateUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};