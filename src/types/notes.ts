export interface NoteRecord {
    id: string;
    userId: string;
    title: string;
    content: string;
    day: string; // <-- ДОБАВЛЕНО (Формат: YYYY-MM-DD)
    createdAt: string; // Дата в формате ISO 8601
  }