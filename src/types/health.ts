export interface HealthAnalysis {
  skinCondition: string;      // Состояние кожи
  skinConditionScore: number; // Численная оценка состояния кожи (1-10)
  eyeCondition: string;       // Состояние глаз
  eyeConditionScore: number;  // Численная оценка состояния глаз (1-10)
  stressLevel: string;        // Уровень стресса
  stressLevelScore: number;   // Численная оценка уровня стресса (1-10)
  mood: string;               // Настроение
  moodScore: number;          // Численная оценка настроения (1-10)
  fatigue: string;            // Усталость
  fatigueScore: number;       // Численная оценка усталости (1-10)
  diagnosis: string;          // Немедицинский диагноз (общее наблюдение)
  recommendations: string[];  // Немедицинские рекомендации
}

// Тип для записи, которая будет храниться в Realtime Database
export interface HealthAnalysisRecord extends HealthAnalysis {
  id: string;
  userId: string;
  imageUrl: string;
  storagePath: string;
  createdAt: string;
}