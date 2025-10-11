'use client';

import { useState, useMemo, useEffect } from 'react';
import { useGemini } from '@/contexts/GeminiContext';
import { useUser } from '@/contexts/UserContext';
import { BrainCircuit, AlertCircle, Sparkles, RefreshCw, Bot, Activity, Smile, Frown, HeartPulse } from 'lucide-react';
import { HealthAnalysisRecord } from '@/types/health';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// --- Компонент: Карточка для консистентного дизайна ---
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white/80 backdrop-blur-lg border border-slate-200 rounded-2xl shadow-lg transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);

// --- Компонент: График для метрик ---
const MetricChart = ({ data, dataKey, stroke, name }: { data: any[]; dataKey: string; stroke: string; name: string }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Нет данных для отображения.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.05)" />
        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" domain={[1, 10]} fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: 'rgba(0, 0, 0, 0.1)',
            color: '#334155',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
          cursor={{ stroke: 'rgba(0, 0, 0, 0.2)', strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <Line type="monotone" dataKey={dataKey} name={name} stroke={stroke} strokeWidth={2.5} dot={{ r: 4, fill: stroke }} activeDot={{ r: 7, stroke: 'rgba(0,0,0,0.1)', strokeWidth: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

// --- Основной компонент страницы ---
export default function AnalysisPage() {
  const { currentUser } = useUser();
  const { getWeeklySummary, getAnalysesForLastWeek } = useGemini();

  const [analysisData, setAnalysisData] = useState<HealthAnalysisRecord[]>([]);
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isChartsLoading, setIsChartsLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [chartsError, setChartsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async (): Promise<void> => {
      if (!currentUser) return;
      setIsChartsLoading(true);
      setChartsError(null);
      try {
        const data = await getAnalysesForLastWeek();
        setAnalysisData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Не удалось загрузить данные для графиков.';
        setChartsError(errorMessage);
      } finally {
        setIsChartsLoading(false);
      }
    };
    fetchChartData();
  }, [currentUser]);

  const handleFetchSummary = async () => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    setSummary('');

    try {
      const summaryResult = await getWeeklySummary();
      setSummary(summaryResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка.';
      setSummaryError(errorMessage);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const formattedChartData = useMemo(() => {
    return analysisData.map(record => ({
      date: new Date(record.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      'Усталость': record.fatigueScore,
      'Настроение': record.moodScore,
      'Стресс': record.stressLevelScore,
      'Состояние кожи': record.skinConditionScore,
    }));
  }, [analysisData]);

  const chartMetrics = [
    { title: 'Динамика Усталости', dataKey: 'Усталость', stroke: '#f59e0b', icon: Activity },
    { title: 'Динамика Настроения', dataKey: 'Настроение', stroke: '#10b981', icon: Smile },
    { title: 'Динамика Стресса', dataKey: 'Стресс', stroke: '#ef4444', icon: Frown },
    { title: 'Динамика Состояния кожи', dataKey: 'Состояние кожи', stroke: '#8b5cf6', icon: HeartPulse },
  ];

  if (!currentUser) {
    return (
      <div className="bg-slate-50 min-h-screen text-gray-800 font-sans p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Требуется авторизация</h1>
          <p className="text-gray-500">Пожалуйста, войдите в свой аккаунт, чтобы получить доступ к центру аналитики.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 p-4 sm:p-8 text-gray-900 font-sans">
      {/* Декоративные элементы */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#45969b]/10 rounded-full filter blur-3xl opacity-70 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00ff90]/10 rounded-full filter blur-3xl opacity-70 animate-pulse animation-delay-4000"></div>

      <div className="relative max-w-7xl mx-auto z-10">
        <header className="mb-8">
            <div className="flex items-center">
                <div className="p-2 rounded-full bg-white/80 border border-slate-200 shadow-md mr-4">
                    <BrainCircuit className="h-10 w-10 text-[#009f5a]" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Центр Аналитики</h1>
                    <p className="text-lg text-gray-600 mt-1">Отслеживайте динамику вашего состояния и получайте сводки от ИИ.</p>
                </div>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Карточка сводки от ИИ */}
          <Card className="lg:col-span-4 col-span-4 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                <Sparkles className="w-7 h-7 mr-3 text-[#009f5a]" />
                Сводка от ИИ за неделю
              </h2>
              <button
                onClick={handleFetchSummary}
                className="p-2 rounded-full text-gray-500 hover:bg-black/5 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00ff90]"
                disabled={isSummaryLoading}
              >
                <RefreshCw className={`w-5 h-5 ${isSummaryLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex-grow min-h-[150px] flex flex-col justify-center">
              {isSummaryLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
              ) : summaryError ? (
                <div className="text-center text-red-500 flex flex-col items-center">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <p>{summaryError}</p>
                </div>
              ) : summary ? (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">{summary}</p>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <Bot className="w-12 h-12 mx-auto mb-3" />
                  <p>Нажмите кнопку обновления, чтобы получить аналитическую сводку по данным за последнюю неделю.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Сетка с графиками */}
          {chartMetrics.map(({ title, dataKey, stroke, icon: Icon }) => (
            <Card key={title} className="p-6 lg:col-span-1 col-span-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
                <Icon className="w-6 h-6 mr-3" style={{ color: stroke }} />
                {title}
              </h2>
              <div className="h-[250px] w-full">
                {isChartsLoading ? (
                  <div className="w-full h-full bg-slate-100 rounded-lg animate-pulse"></div>
                ) : chartsError ? (
                   <div className="flex items-center justify-center h-full text-red-500">
                    <AlertCircle className="w-6 h-6 mr-2" />
                    <p>{chartsError}</p>
                  </div>
                ) : (
                  <MetricChart
                    data={formattedChartData}
                    dataKey={dataKey}
                    stroke={stroke}
                    name={dataKey}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}