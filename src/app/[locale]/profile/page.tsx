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

// --- Business logic remains unchanged ---
type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export default function ProfilePage() {
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
  // --- End of business logic ---


  // --- REDESIGNED UI ---

  if (loading && !currentUser) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center text-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-[#009f5a]" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center text-gray-800 p-4 text-center">
        <div className="text-center max-w-md">
          <UserCircle2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Пользователь не найден</h1>
          <p className="text-gray-500">Пожалуйста, войдите в систему, чтобы просмотреть свой профиль.</p>
        </div>
      </div>
    );
  }

  const genderMap: Record<Gender, string> = {
    male: 'Мужской',
    female: 'Женский',
    other: 'Другой',
    prefer_not_to_say: 'Не указан'
  };

  const ProfileField = ({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) => (
    <div>
      <label className="text-sm font-medium text-gray-500 flex items-center mb-2">
        {icon}
        {label}
      </label>
      <div>{children}</div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 p-4 sm:p-8 text-gray-900 font-sans">
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#45969b]/10 rounded-full filter blur-3xl opacity-70 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00ff90]/10 rounded-full filter blur-3xl opacity-70 animate-pulse animation-delay-4000"></div>

      <div className="relative max-w-4xl mx-auto z-10">
        
        <header className="mb-8">
            <div className="flex items-center">
                <div className="p-2 rounded-full bg-white/80 border border-slate-200 shadow-md mr-4">
                    <UserCircle2 className="h-10 w-10 text-[#009f5a]" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Профиль</h1>
                    <p className="text-lg text-gray-600 mt-1">Управляйте информацией своего аккаунта</p>
                </div>
            </div>
        </header>

        {/* Main profile card */}
        <div className="bg-white/80 backdrop-blur-lg border border-slate-200 rounded-2xl shadow-lg">
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold">{currentUser.displayName || 'Имя не указано'}</h2>
                    <p className="text-md text-gray-500">{currentUser.email}</p>
                </div>
                {!isEditing && (
                  <button 
                    onClick={handleEditClick} 
                    className="flex items-center px-4 py-2 bg-white border border-slate-300 text-gray-800 font-semibold rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    <FilePenLine className="mr-2 h-5 w-5" />
                    <span className="hidden sm:inline">Редактировать</span>
                  </button>
                )}
            </div>
          </div>

          <div className="border-t border-slate-200 p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              <ProfileField icon={<User className="mr-2 h-4 w-4" />} label="Имя">
                {isEditing ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 bg-white rounded-lg placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00ff90] focus:border-transparent transition"
                  />
                ) : (
                  <p className="text-lg text-gray-800 h-12 flex items-center">
                    {currentUser.displayName || <span className="text-gray-400">Не указано</span>}
                  </p>
                )}
              </ProfileField>

              <ProfileField icon={<Calendar className="mr-2 h-4 w-4" />} label="Возраст">
                {isEditing ? (
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    placeholder="Не указан"
                    className="w-full px-4 py-3 border border-slate-300 bg-white rounded-lg placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00ff90] focus:border-transparent transition"
                  />
                ) : (
                  <p className="text-lg text-gray-800 h-12 flex items-center">
                    {currentUser.age || <span className="text-gray-400">Не указан</span>}
                  </p>
                )}
              </ProfileField>

              <ProfileField icon={<Users className="mr-2 h-4 w-4" />} label="Пол">
                {isEditing ? (
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-3 border border-slate-300 bg-white rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00ff90] focus:border-transparent transition appearance-none"
                  >
                    <option value="prefer_not_to_say">Не указывать</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                    <option value="other">Другой</option>
                  </select>
                ) : (
                  <p className="text-lg text-gray-800 h-12 flex items-center">
                    {genderMap[currentUser.gender || 'prefer_not_to_say']}
                  </p>
                )}
              </ProfileField>
            </div>

            {isEditing && (
              <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-end space-x-4">
                <button onClick={handleCancel} className="px-6 py-2.5 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors">
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="flex items-center justify-center px-6 py-2.5 bg-[#00ff90] text-gray-900 font-bold rounded-lg hover:bg-[#00e682] transition-colors disabled:opacity-50 shadow-lg shadow-[#00ff90]/30"
                >
                  {isUpdating ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Check className="mr-2 h-5 w-5" />}
                  {isUpdating ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white/80 backdrop-blur-lg border border-slate-200 rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-4">Действия</h2>
            <button
              onClick={logout}
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-white border border-slate-300 text-gray-800 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Выйти из аккаунта
            </button>
        </div>

        <div className="mt-8 border border-red-300 bg-red-50/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-red-700 flex items-center">
              <ShieldAlert className="mr-3 h-6 w-6" />
              Опасная зона
            </h2>
            <p className="mt-2 text-sm text-red-600">
              Это действие нельзя будет отменить. Все ваши данные, включая историю анализов и заметки, будут удалены навсегда.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="mt-6 w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors border border-red-700 shadow-lg shadow-red-500/20"
            >
              Удалить аккаунт
            </button>
        </div>
      </div>
    </div>
  );
}