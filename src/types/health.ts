export interface HealthAnalysis {
  skinCondition: string;      // Состояние кожи
  eyeCondition: string;       // Состояние глаз
  stressLevel: string;        // Уровень стресса
  mood: string;               // Настроение
  fatigue: string;            // Усталость
  diagnosis: string;          // Немедицинский диагноз (общее наблюдение)
  recommendations: string[];  // Немедицинские рекомендации
}
// TODO: Убрать
// Тип для записи, которая будет храниться в Realtime Database
export interface HealthAnalysisRecord extends HealthAnalysis {
  id: string;
  userId: string;
  imageUrl: string;
  storagePath: string;
  createdAt: string;
}