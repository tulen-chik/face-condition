'use client';

import { useState, useEffect, ChangeEvent } from 'react';
// Используем ваш реальный хук useUser
import { useUser } from '@/contexts/UserContext'; 
import { UserCircle2, LogOut, FilePenLine, Check, X, ShieldAlert, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  // Получаем все необходимые данные и функции из вашего UserContext
  const { currentUser, logout, updateProfile, deleteAccount, loading } = useUser(); 

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Локальное состояние загрузки для конкретной операции обновления
  const [isUpdating, setIsUpdating] = useState(false);

  // Инициализация формы данными пользователя
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      // Используем avatarUrl из вашего типа User
      setPreviewUrl(currentUser.avatarUrl || null);
    }
  }, [currentUser]);

  // Вход в режим редактирования
  const handleEditClick = () => {
    if (!currentUser) return;
    setDisplayName(currentUser.displayName || '');
    setPreviewUrl(currentUser.avatarUrl || null);
    setIsEditing(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    setIsUpdating(true);
    try {
      // ВАЖНО: Ваш UserContext должен быть расширен для обработки загрузки файлов.
      // Текущая функция updateProfile принимает только URL.
      // Логика должна быть такой:
      // 1. Если selectedFile существует, загрузить его в Firebase Storage.
      // 2. Получить URL загруженного файла.
      // 3. Вызвать updateProfile(displayName, newPhotoURL).
      // Пока эта логика не реализована в контексте, будет обновляться только имя.
      if (selectedFile) {
        console.warn("Логика загрузки аватара должна быть реализована в UserContext");
        // Пример вызова, если бы функция была расширена:
        // await updateProfileWithFile(displayName, selectedFile);
      }
      
      // Обновляем только имя, так как это поддерживается текущим контекстом
      if (displayName !== currentUser.displayName) {
        await updateProfile(displayName);
      }

      setIsEditing(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Не удалось обновить профиль:", error);
      // Здесь можно показать уведомление об ошибке
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    // Восстанавливаем исходные значения
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setPreviewUrl(currentUser.avatarUrl || null);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо.')) {
      try {
        await deleteAccount();
        // После удаления пользователь будет перенаправлен (логика в onAuthStateChange)
      } catch (error) {
        console.error("Не удалось удалить аккаунт:", error);
        alert('Произошла ошибка при удалении аккаунта.');
      }
    }
  };

  // Глобальный лоадер на время первоначальной загрузки пользователя
  if (loading && !currentUser) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white">
        <p>Пользователь не найден. Пожалуйста, войдите в систему.</p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center">
            <UserCircle2 className="mr-4 h-10 w-10" />
            Профиль
          </h1>
        </header>

        <div className="bg-black border border-gray-800 rounded-lg p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-8">
            {/* <div className="relative mb-6 sm:mb-0">
              <img
                src={previewUrl || '/default-avatar.png'}
                alt="Аватар"
                className="w-32 h-32 rounded-full object-cover border-2 border-gray-700"
              />
              {isEditing && (
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-white text-black p-2 rounded-full cursor-pointer hover:bg-gray-300 transition-colors">
                  <FilePenLine className="w-5 h-5" />
                  <input id="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                </label>
              )}
            </div> */}

            <div className="flex-grow w-full">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Имя</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full mt-1 p-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                    />
                  ) : (
                    <p className="text-xl font-semibold mt-1">{currentUser.displayName}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-400">Email</label>
                  <p className="text-lg text-gray-300 mt-1">{currentUser.email}</p>
                </div>
              </div>

              <div className="mt-8 flex items-center space-x-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isUpdating}
                      className="flex items-center justify-center px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2 h-5 w-5" />}
                      {isUpdating ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button onClick={handleCancel} className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
                      <X className="mr-2 h-5 w-5" />
                      Отмена
                    </button>
                  </>
                ) : (
                  <button onClick={handleEditClick} className="flex items-center px-4 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors">
                    <FilePenLine className="mr-2 h-5 w-5" />
                    Редактировать
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-black border border-gray-800 rounded-lg p-6 sm:p-8">
          <h2 className="text-xl font-semibold mb-4">Действия</h2>
          <button
            onClick={logout}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Выйти из аккаунта
          </button>
        </div>

        <div className="mt-8 bg-red-900/20 border border-red-500/30 rounded-lg p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-red-400 flex items-center">
            <ShieldAlert className="mr-3 h-6 w-6" />
            Опасная зона
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Это действие нельзя будет отменить. Все ваши данные, включая историю анализов, будут удалены навсегда.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="mt-4 w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-red-800 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
          >
            Удалить аккаунт
          </button>
        </div>
      </div>
    </div>
  );
}