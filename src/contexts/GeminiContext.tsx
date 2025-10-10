'use client';

import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { 
  getAnalysesForUser, 
  analyzeAndStoreFaceHealth, 
  deleteHealthAnalysis,
  getWeeklyHealthSummary, // <-- Импортируем новую функцию
  chatWithHealthAI,
  generateAndStoreEnhancedImage,
  getEnhancedImagesForUser,       // <-- Импортируем новую функцию
} from '@/lib/firebase/gemini'; // Укажите правильный путь
import type { EnhancedImageRecord, HealthAnalysisRecord } from '@/types/health';
import { useUser } from './UserContext';

// Определяем тип для истории чата для большей строгости
interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiContextType {
  analyses: HealthAnalysisRecord[];
  loading: boolean;
  error: Error | null;
  analyzeHealthFromFace: (file: File) => Promise<void>;
  enhancedImages: EnhancedImageRecord[];
  deleteAnalysis: (analysisId: string, storagePath: string) => Promise<void>;
  fetchAnalyses: () => Promise<void>;
  // --- Новые методы ---
  getWeeklySummary: () => Promise<string>;
  sendChatMessage: (message: string, history: ChatMessage[]) => Promise<string>;
  getAnalysesForLastWeek: () => Promise<HealthAnalysisRecord[]>;
  generateEnhancedImage: (analysis: HealthAnalysisRecord) => Promise<void>;
  // getEnhancedImagesForUser: (userId: string) => Promise<EnhancedImageRecord[]>;
}

const GeminiContext = createContext<GeminiContextType | null>(null);

export const GeminiProvider = ({ children }: { children: React.ReactNode }) => {
  const [analyses, setAnalyses] = useState<HealthAnalysisRecord[]>([]);
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImageRecord[]>([]); // <-- ДОБАВЛЕНО: Новое состояние
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useUser();

  // ИЗМЕНЕНО: Функция теперь загружает анализы и улучшенные фото раздельно, но параллельно
  const fetchAnalyses = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    try {
      // Запускаем оба запроса одновременно для эффективности
      const [userAnalyses, userEnhancedImages] = await Promise.all([
        getAnalysesForUser(currentUser.userId),
        getEnhancedImagesForUser(currentUser.userId)
      ]);
      setAnalyses(userAnalyses);
      setEnhancedImages(userEnhancedImages);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchAnalyses();
    } else {
      // Очищаем оба состояния при выходе
      setAnalyses([]);
      setEnhancedImages([]);
    }
  }, [currentUser, fetchAnalyses]);

  const analyzeHealthFromFace = useCallback(async (file: File) => {
    if (!currentUser) throw new Error('User is not authenticated');

    setLoading(true);
    setError(null);
    try {
      const newAnalysis = await analyzeAndStoreFaceHealth(currentUser.userId, file);
      setAnalyses(prev => [newAnalysis, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to analyze image'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const generateEnhancedImage = useCallback(async (analysis: HealthAnalysisRecord) => {
    if (!currentUser) throw new Error('User is not authenticated');
    
    setLoading(true);
    setError(null);
    try {
      const newEnhancedImageRecord = await generateAndStoreEnhancedImage(analysis);
      // Добавляем новую запись только в состояние enhancedImages
      setEnhancedImages(prev => [newEnhancedImageRecord, ...prev]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate enhanced image');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const deleteAnalysis = useCallback(async (analysisId: string, storagePath: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteHealthAnalysis(analysisId, storagePath);
      // Удаляем из обоих списков
      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
      setEnhancedImages(prev => prev.filter(img => img.originalAnalysisId !== analysisId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete analysis'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Реализация новых методов ---

  const getWeeklySummary = useCallback(async (): Promise<string> => {
    if (!currentUser) {
      throw new Error('User is not authenticated');
    }
    setLoading(true);
    setError(null);
    try {
      return await getWeeklyHealthSummary(currentUser.userId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get weekly summary');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const sendChatMessage = useCallback(async (message: string, history: ChatMessage[]): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      return await chatWithHealthAI(message, history);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send chat message');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAnalysesForLastWeek = async (): Promise<HealthAnalysisRecord[]> => {
    if (!currentUser) {
      throw new Error("User not authenticated.");
    }
    const allAnalyses = await getAnalysesForUser(currentUser.userId);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
    // Filter for the last week and sort by date
    return allAnalyses
      .filter(a => new Date(a.createdAt) >= oneWeekAgo)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };


  return (
    <GeminiContext.Provider
      value={{
        analyses,
        loading,
        error,
        enhancedImages,
        analyzeHealthFromFace,
        getAnalysesForLastWeek,
        deleteAnalysis,
        fetchAnalyses,
        generateEnhancedImage,
        // getEnhancedImagesForUser,
        getWeeklySummary, // <-- Добавляем в провайдер
        sendChatMessage,  // <-- Добавляем в провайдер
      }}
    >
      {children}
    </GeminiContext.Provider>
  );
};

export const useGemini = () => {
  const context = useContext(GeminiContext);
  if (!context) {
    throw new Error('useGemini must be used within a GeminiProvider');
  }
  return context;
};