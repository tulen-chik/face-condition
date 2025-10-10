import { db } from "./init";
import { createOperation, deleteOperation } from "./crud";
import { noteSchema } from "./schemas";
import { NoteRecord } from "@/types/notes";
import { get, ref as databaseRef, query, orderByChild, equalTo } from "firebase/database";

/**
 * Создает новую заметку для пользователя.
 * @param userId - ID пользователя, создающего заметку.
 * @param title - Заголовок заметки.
 * @param content - Содержимое заметки.
 * @returns Созданная запись заметки.
 */
// Предполагаемый путь: src/lib/notes.ts
export const createNote = async (userId: string, title: string, content: string, day: string): Promise<NoteRecord> => { // <-- ИЗМЕНЕНО
  const noteId = Date.now().toString();
  
  const recordToSave: Omit<NoteRecord, 'id'> = {
    userId,
    title,
    content,
    day, // <-- ДОБАВЛЕНО
    createdAt: new Date().toISOString(),
  };

  // Валидация данных перед сохранением в БД
  await createOperation(`notes/${noteId}`, recordToSave, noteSchema.omit({ id: true }));

  console.log(`Заметка ${noteId} для пользователя ${userId} успешно создана.`);
  
  return { id: noteId, ...recordToSave };
};

/**
 * Получает все заметки для указанного пользователя.
 * @param userId - ID пользователя.
 * @returns Массив записей заметок, отсортированный от новых к старым.
 */
export const getNotesForUser = async (userId: string): Promise<NoteRecord[]> => {
    // <-- LOGGING: 1. Проверяем, что функция вообще вызвана и с каким userId
    console.log(`[FIREBASE] 🚀 getNotesForUser вызвана для userId: ${userId}`);
  
    const notesRef = query(databaseRef(db, 'notes'), orderByChild('userId'), equalTo(userId));
    
    try {
      const snapshot = await get(notesRef);
  
      if (!snapshot.exists()) {
        // <-- LOGGING: 2. Важный момент! Если Firebase ничего не нашел по запросу
        console.warn(`[FIREBASE] ⚠️ Снимок не существует. Для пользователя ${userId} не найдено заметок. Проверьте правила безопасности и наличие данных в БД.`);
        return [];
      }
  
      // <-- LOGGING: 3. Смотрим на "сырые" данные, которые вернул Firebase
      const records = snapshot.val() as Record<string, Omit<NoteRecord, 'id'>>;
      console.log("[FIREBASE] 📦 Получены сырые данные из Firebase:", records);
      
      const results: NoteRecord[] = Object.entries(records).map(([id, data]) => ({
        id,
        ...data,
      }));
  
      // <-- LOGGING: 4. Проверяем, как данные выглядят после преобразования в массив
      console.log("[FIREBASE] ✨ Данные преобразованы в массив:", results);
  
      const sortedResults = results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // <-- LOGGING: 5. Финальный результат перед отправкой в контекст
      console.log("[FIREBASE] ✅ Отсортированные заметки готовы к отправке:", sortedResults);
      
      return sortedResults;
  
    } catch (error) {
      // <-- LOGGING: 6. Ловим критические ошибки, например, "Permission Denied"
      console.error("[FIREBASE] ❌ КРИТИЧЕСКАЯ ОШИБКА при выполнении запроса get():", error);
      throw error;
    }
  };
/**
 * Удаляет заметку по её ID.
 * @param noteId - ID заметки для удаления.
 */
export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    await deleteOperation(`notes/${noteId}`);
    console.log(`Заметка ${noteId} успешно удалена.`);
  } catch (error) {
    console.error("Ошибка при удалении заметки:", error);
    throw new Error("Не удалось удалить заметку.");
  }
};