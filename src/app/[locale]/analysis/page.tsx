'use client';

import { useState, useMemo } from 'react';
import { useGemini } from '@/contexts/GeminiContext';
import { useUser } from '@/contexts/UserContext';
// Import the icon with an alias to prevent name collision
import { BrainCircuit, AlertCircle, Sparkles, RefreshCw, Bot, LineChart as LineChartIcon } from 'lucide-react';
import { HealthAnalysisRecord } from '@/types/health';
// Import chart components from recharts
import {
  LineChart, // This name is now free to be used for the chart itself
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
} from 'recharts';

export default function AnalysisPage() {
  const { currentUser } = useUser();
  const { getWeeklySummary, getAnalysesForLastWeek } = useGemini();

  const [analysisData, setAnalysisData] = useState<HealthAnalysisRecord[]>([]);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchData = async () => {
    setIsLoading(true);
    setError(null);
    setSummary('');
    setAnalysisData([]);

    try {
      const data = await getAnalysesForLastWeek();
      if (data.length === 0) {
        setSummary("За последнюю неделю нет данных для анализа. Добавьте хотя бы одну запись, чтобы получить сводку и графики.");
        setAnalysisData([]);
        setIsLoading(false); // Stop loading if no data
        return;
      }
      setAnalysisData(data);

      const summaryResult = await getWeeklySummary();
      setSummary(summaryResult);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formattedChartData = useMemo(() => {
    return analysisData.map(record => ({
      date: new Date(record.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      Усталость: record.fatigueScore,
      Настроение: record.moodScore,
      Стресс: record.stressLevelScore,
      'Состояние кожи': record.skinConditionScore,
    }));
  }, [analysisData]);

  if (!currentUser) {
    return (
      <div className="relative min-h-screen bg-black p-4 sm:p-8 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-sky-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-100">Требуется авторизация</h1>
          <p className="text-gray-400">Пожалуйста, войдите, чтобы получить доступ к центру аналитики.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black p-4 sm:p-8 text-white font-sans">
      <div className="relative max-w-5xl mx-auto z-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center text-gray-100">
            <BrainCircuit className="mr-4 h-9 w-9 sm:h-10 sm:w-10 text-sky-400" />
            Центр Аналитики
          </h1>
          <p className="text-gray-400 mt-2">Отслеживайте динамику вашего состояния и получайте сводки от ИИ.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-200 flex items-center">
                <Sparkles className="w-6 h-6 mr-3 text-purple-400" />
                Сводка от ИИ
              </h2>
              <button
                onClick={handleFetchData}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex-grow min-h-[200px] flex flex-col justify-center">
              {isLoading && !summary ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                </div>
              ) : error ? (
                <div className="text-center text-red-400 flex flex-col items-center">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <p>{error}</p>
                </div>
              ) : summary ? (
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{summary}</p>
              ) : (
                <div className="text-center text-gray-500">
                  <Bot className="w-10 h-10 mx-auto mb-3" />
                  <p>Нажмите кнопку обновления, чтобы получить аналитическую сводку.</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-200 flex items-center mb-4">
              {/* Use the aliased name for the icon */}
              <LineChartIcon className="w-6 h-6 mr-3 text-green-400" />
              Динамика показателей за неделю
            </h2>
            <div className="h-[300px] w-full">
              {isLoading && analysisData.length === 0 ? (
                 <div className="w-full h-full bg-gray-800 rounded-lg animate-pulse"></div>
              ) : !isLoading && formattedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                    <XAxis dataKey="date" stroke="#A0AEC0" fontSize={12} />
                    <YAxis stroke="#A0AEC0" domain={[1, 10]} fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A202C',
                        borderColor: '#4A5568',
                        color: '#E2E8F0',
                      }}
                    />
                    {/* Раскомментируйте эти строки */}
                    <RechartsLegend />
                    <Line type="monotone" dataKey="Усталость" stroke="#F6AD55" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Настроение" stroke="#68D391" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Стресс" stroke="#FC8181" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    {/* Добавьте эту строку для состояния кожи */}
                    <Line type="monotone" dataKey="Состояние кожи" stroke="#805AD5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Нет данных для отображения графика.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}