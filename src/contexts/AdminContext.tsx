import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { userOperations } from '@/lib/firebase/database';
import type { User } from '@/types/database';

interface AdminStats {
  totalUsers: number;
  recentUsers: User[];
}

interface AdminContextType {
  // Stats
  stats: AdminStats | null;
  
  // User management
  users: User[];
  loadUsers: () => Promise<(User & { id: string })[]>;
  createUser: (userData: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
    role?: 'user' | 'admin';  // Updated this line
    adminId: string;
  }) => Promise<User>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  
  // UI state
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Load all users
  const loadUsers = useCallback(async (): Promise<(User & { id: string })[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const usersList = await userOperations.list();
      const formattedUsers = usersList.map(user => ({
        ...user,
        id: user.id,
        createdAt: user.createdAt || new Date().toISOString(),
      }));
      
      setUsers(formattedUsers);
      return formattedUsers;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to load users');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new user
  const createUser = useCallback(async (userData: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
    role?: 'user' | 'admin';
    adminId: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const newUser = await userOperations.create(new Date().toISOString(), {
        ...userData,
        role: userData.role || 'user' as 'user' | 'admin',
        displayName: userData.displayName,
        email: userData.email,
        // phone: userData.phone || '',
        createdAt: new Date().toISOString(),
        avatarUrl: '', // Default empty avatar URL
        avatarStoragePath: '', // Default empty storage path
        settings: {
          language: 'en', // Default language
          notifications: true, // Enable notifications by default
        },
        // emailVerified: false,
        // disabled: false,
      });
      
      // Update local state
      setUsers(prev => [...prev, { ...newUser, id: newUser.id }]);
      
      return newUser;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to create user');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing user
  const updateUser = useCallback(async (userId: string, data: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);

      const newUser = await userOperations.create(new Date().toISOString(), {
        ...data,
        role: data.role || 'user' as 'user' | 'admin',
        displayName: data.displayName || '',
        email: data.email || '',
        // phone: userData.phone || '',
        createdAt: new Date().toISOString(),
        avatarUrl: '', // Default empty avatar URL
        avatarStoragePath: '', // Default empty storage path
        settings: {
          language: 'en', // Default language
          notifications: true, // Enable notifications by default
        },
        // emailVerified: false,
        // disabled: false,
      });
      
      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, ...data, updatedAt: new Date().toISOString() } 
            : user
        )
      );
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to update user');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a user
  const deleteUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      await userOperations.delete(userId);
      
      // Update local state
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to delete user');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all users
      const allUsers = await loadUsers();
      
      // Prepare stats
      const statsData: AdminStats = {
        totalUsers: allUsers.length,
        recentUsers: allUsers
          .sort((a, b) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          )
          .slice(0, 5), // Get 5 most recent users
      };

      setStats(statsData);
      return statsData;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to refresh stats');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadUsers]);

  // Load initial data
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const contextValue: AdminContextType = {
    // State
    stats,
    users,
    loading,
    error,
    createUser,

    loadUsers,
    updateUser,
    deleteUser,
    setError,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};