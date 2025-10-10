export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  avatarUrl: string;
  avatarStoragePath: string;
  role: 'admin' | 'user';
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'; // <-- ДОБАВЛЕНО
  age?: number; // <-- ДОБАВЛЕНО
  settings: {
    language: string;
    notifications: boolean;
  };
}