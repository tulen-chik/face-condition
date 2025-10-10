'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import {
  UserCircle2,
  LogOut,
  FilePenLine,
  Check,
  X,
  ShieldAlert,
  Loader2,
  User,
  Calendar,
  Users
} from 'lucide-react';

// Определяем тип Gender для удобства, он должен совпадать с типом в UserContext
type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export default function ProfilePage() {
  // --- НАЧАЛО БИЗНЕС-ЛОГИКИ (БЕЗ ИЗМЕНЕНИЙ) ---
  const { currentUser, logout, updateProfile, deleteAccount, loading, updateUserData } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<Gender>('prefer_not_to_say');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setAge(currentUser.age || '');
      setGender(currentUser.gender || 'prefer_not_to_say');
    }
  }, [currentUser]);

  const handleEditClick = () => {
    if (!currentUser) return;
    setDisplayName(currentUser.displayName || '');
    setAge(currentUser.age || '');
    setGender(currentUser.gender || 'prefer_not_to_say');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    setIsUpdating(true);
    try {
      const dataToUpdate: { [key: string]: any } = {};

      if (displayName !== currentUser.displayName) {
        await updateProfile(displayName);
        dataToUpdate.displayName = displayName;
      }

      const numericAge = age === '' ? undefined : Number(age);
      if (numericAge !== currentUser.age) {
        dataToUpdate.age = numericAge;
      }

      if (gender !== currentUser.gender) {
        dataToUpdate.gender = gender;
      }

      if (Object.keys(dataToUpdate).length > 0) {
        await updateUserData(dataToUpdate);
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Не удалось обновить профиль:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setAge(currentUser.age || '');
      setGender(currentUser.gender || 'prefer_not_to_say');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо.')) {
      try {
        await deleteAccount();
      } catch (error) {
        console.error("Не удалось удалить аккаунт:", error);
        alert('Произошла ошибка при удалении аккаунта.');
      }
    }
  };
  // --- КОНЕЦ БИЗНЕС-ЛОГИКИ ---


  // --- НАЧАЛО ОБНОВЛЕННОГО UI ---

  if (loading && !currentUser) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white p-4 text-center">
        <p className="text-xl text-gray-400">Пользователь не найден. Пожалуйста, войдите в систему.</p>
      </div>
    );
  }

  const genderMap: Record<Gender, string> = {
    male: 'Мужской',
    female: 'Женский',
    other: 'Другой',
    prefer_not_to_say: 'Не указан'
  };

  // Переиспользуемый компонент для полей профиля
  const ProfileField = ({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) => (
    <div>
      <label className="text-sm font-medium text-gray-500 flex items-center">
        {icon}
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        
        <header className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold flex items-center">
            <UserCircle2 className="mr-4 h-10 w-10" />
            Профиль
          </h1>
        </header>

        {/* Основная карточка профиля */}
        <div className="bg-black border border-gray-800 rounded-xl">
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold">{currentUser.displayName || 'Имя не указано'}</h2>
                    <p className="text-md text-gray-500">{currentUser.email}</p>
                </div>
                {!isEditing && (
                  <button 
                    onClick={handleEditClick} 
                    className="flex items-center px-4 py-2 bg-black border border-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 hover:border-gray-700 transition-colors"
                  >
                    <FilePenLine className="mr-2 h-5 w-5" />
                    <span className="hidden sm:inline">Редактировать</span>
                  </button>
                )}
            </div>
          </div>

          <div className="border-t border-gray-800 p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              {/* Поле Имя */}
              <ProfileField icon={<User className="mr-2 h-4 w-4" />} label="Имя">
                {isEditing ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-12 p-3 bg-black border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white transition-colors"
                  />
                ) : (
                  <p className="text-lg text-white h-12 flex items-center px-4 bg-black border border-gray-800 rounded-md">
                    {currentUser.displayName || <span className="text-gray-600">Не указано</span>}
                  </p>
                )}
              </ProfileField>

              {/* Поле Возраст */}
              <ProfileField icon={<Calendar className="mr-2 h-4 w-4" />} label="Возраст">
                {isEditing ? (
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    placeholder="Не указан"
                    className="w-full h-12 p-3 bg-black border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white transition-colors"
                  />
                ) : (
                  <p className="text-lg text-white h-12 flex items-center px-4 bg-black border border-gray-800 rounded-md">
                    {currentUser.age || <span className="text-gray-600">Не указан</span>}
                  </p>
                )}
              </ProfileField>

              {/* Поле Пол */}
              <ProfileField icon={<Users className="mr-2 h-4 w-4" />} label="Пол">
                {isEditing ? (
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full h-12 px-3 bg-black border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white transition-colors appearance-none"
                  >
                    <option value="prefer_not_to_say">Не указывать</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                    <option value="other">Другой</option>
                  </select>
                ) : (
                  <p className="text-lg text-white h-12 flex items-center px-4 bg-black border border-gray-800 rounded-md">
                    {genderMap[currentUser.gender || 'prefer_not_to_say']}
                  </p>
                )}
              </ProfileField>
            </div>

            {isEditing && (
              <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-end space-x-4">
                <button onClick={handleCancel} className="px-6 py-2.5 bg-black border border-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 hover:border-gray-700 transition-colors">
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="flex items-center justify-center px-6 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Check className="mr-2 h-5 w-5" />}
                  {isUpdating ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Блок Действия */}
        <div className="mt-8 bg-black border border-gray-800 rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-4">Действия</h2>
            <button
              onClick={logout}
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-black border border-gray-800 text-white rounded-lg hover:bg-gray-900 hover:border-gray-700 transition-colors"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Выйти из аккаунта
            </button>
        </div>

        {/* Опасная зона */}
        <div className="mt-8 border border-red-900 bg-red-900/10 rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-red-500 flex items-center">
              <ShieldAlert className="mr-3 h-6 w-6" />
              Опасная зона
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Это действие нельзя будет отменить. Все ваши данные будут удалены навсегда.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="mt-6 w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-red-900/50 text-white font-bold rounded-lg hover:bg-red-900 transition-colors border border-red-800"
            >
              Удалить аккаунт
            </button>
        </div>
      </div>
    </div>
  );
}