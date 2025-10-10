'use client';

import { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createNote,
  getNotesForUser,
  deleteNote,
} from '@/lib/firebase/notes';
import type { NoteRecord } from '@/types/notes';
import { useUser } from './UserContext';

interface NotesContextType {
  notes: NoteRecord[];
  loading: boolean;
  error: Error | null;
  addNote: (title: string, content: string, day: string) => Promise<void>;
  removeNote: (noteId: string) => Promise<void>;
  fetchNotes: () => Promise<void>;
}

const NotesContext = createContext<NotesContextType | null>(null);

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true); // <-- ИЗМЕНЕНО: начальное состояние true
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useUser();

  const fetchNotes = useCallback(async () => {
    // <-- LOGGING: 2. Проверяем, что пользователь существует перед вызовом
    if (!currentUser) {
      console.log("[CONTEXT] ⏳ fetchNotes: Ожидание пользователя...");
      setLoading(false);
      return;
    }
    
    console.log(`[CONTEXT] 🚀 Запуск fetchNotes для пользователя: ${currentUser.userId}`);
    setLoading(true);
    setError(null);

    try {
      const userNotes = await getNotesForUser(currentUser.userId);
      // <-- LOGGING: 3. Смотрим, что вернулось из функции Firebase
      console.log("[CONTEXT] ✅ Получен результат из getNotesForUser:", userNotes);
      setNotes(userNotes);
    } catch (err) {
      // <-- LOGGING: 4. Ловим ошибки, которые могли прийти из Firebase
      console.error("[CONTEXT] ❌ Ошибка в процессе fetchNotes:", err);
      setError(err instanceof Error ? err : new Error('Failed to fetch notes'));
    } finally {
      setLoading(false);
      console.log("[CONTEXT] 🏁 fetchNotes завершен.");
    }
  }, [currentUser]);

  useEffect(() => {
    // <-- LOGGING: 1. Отслеживаем срабатывание useEffect при изменении currentUser
    console.log("[CONTEXT] 🔄 useEffect сработал. Текущий пользователь:", currentUser ? currentUser.userId : "null");
    fetchNotes();
  }, [currentUser, fetchNotes]);

  const addNote = useCallback(async (title: string, content: string, day: string) => {
    if (!currentUser) throw new Error('User is not authenticated');
    setLoading(true);
    setError(null);
    try {
      const newNote = await createNote(currentUser.userId, title, content, day);
      setNotes(prev => [newNote, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create note'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const removeNote = useCallback(async (noteId: string) => {
    if (!currentUser) throw new Error('User is not authenticated');
    setLoading(true);
    setError(null);
    try {
      await deleteNote(noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete note'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // <-- LOGGING: 5. Финальная проверка: что именно провайдер отдает своим "детям"
  console.log(`[CONTEXT] 📦 Провайдер рендерится. Передается заметок: ${notes.length}. Загрузка: ${loading}.`);

  return (
    <NotesContext.Provider
      value={{
        notes,
        loading,
        error,
        addNote,
        removeNote,
        fetchNotes,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};