'use client';

import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { 
  getAnalysesForUser, 
  analyzeAndStoreFaceHealth, 
  deleteHealthAnalysis,
  getWeeklyHealthSummary, // <-- Импортируем новую функцию
  chatWithHealthAI,       // <-- Импортируем новую функцию
} from '@/lib/firebase/gemini'; // Укажите правильный путь
import type { HealthAnalysisRecord } from '@/types/health';
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
  deleteAnalysis: (analysisId: string, storagePath: string) => Promise<void>;
  fetchAnalyses: () => Promise<void>;
  // --- Новые методы ---
  getWeeklySummary: () => Promise<string>;
  sendChatMessage: (message: string, history: ChatMessage[]) => Promise<string>;
}

const GeminiContext = createContext<GeminiContextType | null>(null);

export const GeminiProvider = ({ children }: { children: React.ReactNode }) => {
  const [analyses, setAnalyses] = useState<HealthAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useUser();

  const fetchAnalyses = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    try {
      const userAnalyses = await getAnalysesForUser(currentUser.userId);
      setAnalyses(userAnalyses);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analyses'));
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchAnalyses();
    } else {
      setAnalyses([]);
    }
  }, [currentUser, fetchAnalyses]);

  const analyzeHealthFromFace = useCallback(async (file: File) => {
    if (!currentUser) {
      const err = new Error('User is not authenticated');
      setError(err);
      throw err;
    }

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

  const deleteAnalysis = useCallback(async (analysisId: string, storagePath: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteHealthAnalysis(analysisId, storagePath);
      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
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


  return (
    <GeminiContext.Provider
      value={{
        analyses,
        loading,
        error,
        analyzeHealthFromFace,
        deleteAnalysis,
        fetchAnalyses,
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