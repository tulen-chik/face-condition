'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
// Восстанавливаем импорты для бизнес-логики
import { useGemini } from '@/contexts/GeminiContext';
import { useUser } from '@/contexts/UserContext';
import { HealthAnalysisRecord } from '@/types/health'; // Убедитесь, что путь к типам корректен
import {
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  CalendarDays,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  HeartPulse,
  Sparkles,
  ClipboardList,
  ChevronDown
} from 'lucide-react';

// Вспомогательные функции для работы с датами
const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

const isFuture = (date: Date) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date > today;
};

// --- КОМПОНЕНТ: ГОРИЗОНТАЛЬНЫЙ ВЫБОР ДНЯ ---
const WeekView = ({ selectedDate, setSelectedDate, analysesByDate }: { selectedDate: Date | null, setSelectedDate: (date: Date) => void, analysesByDate: Map<string, HealthAnalysisRecord[]> }) => {
  const weekContainerRef = useRef<HTMLDivElement>(null);

  const weekDays = useMemo(() => {
    if (!selectedDate) return [];
    const startOfWeek = new Date(selectedDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    return Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  }, [selectedDate]);

  useEffect(() => {
    if (weekContainerRef.current && selectedDate) {
      const selectedElement = weekContainerRef.current.querySelector(`[data-date="${selectedDate.toDateString()}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedDate]);

  return (
    <div ref={weekContainerRef} className="custom-scrollbar flex space-x-2 lg:space-x-4 overflow-x-auto pb-2">
      {weekDays.map(day => {
        const isSelected = day.toDateString() === selectedDate?.toDateString();
        const dayIsFuture = isFuture(day);
        const hasAnalysis = day && analysesByDate.has(day.toDateString());

        return (
          <div
            key={day.toISOString()}
            data-date={day.toDateString()}
            onClick={() => !dayIsFuture && setSelectedDate(day)}
            className={`flex flex-col items-center justify-center text-center p-2 rounded-xl w-16 h-20 lg:w-24 lg:h-28 flex-shrink-0 transition-all duration-300
              ${dayIsFuture ? 'text-gray-600 cursor-default' : 'cursor-pointer'}
              ${isSelected ? 'bg-sky-500 text-white font-bold' : 'bg-gray-800/60 hover:bg-gray-700/80'}
            `}
          >
            <span className="text-xs lg:text-sm uppercase text-gray-300">{isToday(day) ? 'СЕГОДНЯ' : day.toLocaleString('ru-RU', { weekday: 'short' })}</span>
            <span className="text-xl lg:text-3xl font-semibold mt-1">{day.getDate()}</span>
            {hasAnalysis && <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white rounded-full mt-1.5"></div>}
          </div>
        );
      })}
    </div>
  );
};


export default function HealthCalendarPage() {
  // --- БИЗНЕС-ЛОГИКА ---
  const { currentUser } = useUser();
  const { analyses, loading, error, analyzeHealthFromFace } = useGemini();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    setSelectedDate(now);
  }, []);

  const analysesByDate = useMemo(() => {
    const map = new Map<string, HealthAnalysisRecord[]>();
    analyses.forEach(analysis => {
      const dateKey = new Date(analysis.createdAt).toDateString();
      if (!map.has(dateKey)) { map.set(dateKey, []); }
      map.get(dateKey)?.push(analysis);
    });
    return map;
  }, [analyses]);

  const selectedDateAnalyses = selectedDate ? analysesByDate.get(selectedDate.toDateString()) || [] : [];

  const handlePrevWeek = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    if (isFuture(newDate)) { return; }
    setSelectedDate(newDate);
  };

  const canGoToNextWeek = useMemo(() => {
    if (!selectedDate) return false;
    const nextWeekDate = new Date(selectedDate);
    nextWeekDate.setDate(selectedDate.getDate() + 7);
    return !isFuture(nextWeekDate);
  }, [selectedDate]);

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    try {
      await analyzeHealthFromFace(selectedFile);
      setSelectedFile(null);
    } catch (uploadError) {
      console.error("Ошибка загрузки:", uploadError);
    }
  };

  const canUpload = selectedDate && isToday(selectedDate);

  const handleToggleAnalysis = (analysisId: string) => {
    setExpandedAnalysisId(prevId => (prevId === analysisId ? null : analysisId));
  };

  if (!currentUser) {
    return (
      <div className="bg-black min-h-screen text-white font-sans p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Требуется авторизация</h1>
          <p className="text-gray-400">
            Пожалуйста, войдите в свой аккаунт, чтобы получить доступ к календарю здоровья.
          </p>
        </div>
      </div>
    );
  }

  // Переиспользуемый компонент для деталей анализа
  const AnalysisDetails = ({ analysis }: { analysis: HealthAnalysisRecord }) => (
    <div className="space-y-4 text-sm">
        <div className="space-y-2">
            <h5 className="font-semibold text-base text-gray-100 flex items-center"><HeartPulse className="w-5 h-5 mr-2 text-sky-400"/> Общее наблюдение</h5>
            <p className="text-gray-300 pl-7">{analysis.diagnosis}</p>
        </div>
        <div className="space-y-2">
            <h5 className="font-semibold text-base text-gray-100 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-sky-400"/> Рекомендации</h5>
            <ul className="list-disc list-inside text-gray-300 pl-7 space-y-1">
                {analysis.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
            </ul>
        </div>
        <div className="space-y-2 pt-2 border-t border-white/10">
            <h5 className="font-semibold text-base text-gray-100 flex items-center"><ClipboardList className="w-5 h-5 mr-2 text-sky-400"/> Детали</h5>
            <div className="pl-7 space-y-1">
                <div className="flex justify-between"><span className="text-gray-400">Состояние кожи:</span><span className="font-medium text-right">{analysis.skinCondition}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Состояние глаз:</span><span className="font-medium text-right">{analysis.eyeCondition}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Уровень стресса:</span><span className="font-medium text-right">{analysis.stressLevel}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Настроение:</span><span className="font-medium text-right">{analysis.mood}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Усталость:</span><span className="font-medium text-right">{analysis.fatigue}</span></div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="bg-black min-h-screen text-white font-sans">
      {/* --- УЛУЧШЕННАЯ ДЕСКТОПНАЯ ВЕРСИЯ --- */}
      <div className="hidden lg:block relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 to-black">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/20 rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl opacity-50 animate-pulse animation-delay-4000"></div>

        <div className="relative max-w-7xl mx-auto p-8 z-10">
          <header className="mb-8">
            <h1 className="text-4xl font-bold flex items-center text-gray-100">
              <CalendarDays className="mr-4 h-10 w-10 text-sky-400" />
              Календарь здоровья
            </h1>
            <p className="text-lg text-gray-400 mt-2 capitalize">
              {selectedDate?.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </header>

          <div className="bg-gray-900/50 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-2xl mb-8 flex items-center gap-4">
            <button onClick={handlePrevWeek} className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex-grow">
              {selectedDate && <WeekView selectedDate={selectedDate} setSelectedDate={setSelectedDate} analysesByDate={analysesByDate} />}
            </div>
            <button onClick={handleNextWeek} disabled={!canGoToNextWeek} className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-30 disabled:cursor-not-allowed">
              <ArrowRight className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8">
            <div className="bg-gray-900/50 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-2xl h-fit">
              <h3 className="text-2xl font-semibold mb-4 border-b border-white/10 pb-4">
                {canUpload ? 'Добавить новую запись' : 'Просмотр записей'}
              </h3>
              {selectedDate && !isFuture(selectedDate) && (
                <div>
                  {canUpload ? (
                    <div>
                      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-sky-400 transition-colors">
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
                        <label htmlFor="file-upload" className="mt-4 block text-sm font-medium text-gray-200 hover:text-sky-400 cursor-pointer">{selectedFile ? selectedFile.name : 'Выберите файл'}</label>
                        <input id="file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG до 10MB</p>
                      </div>
                      <button onClick={handleFileUpload} disabled={!selectedFile || loading} className="w-full mt-4 bg-sky-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <UploadCloud className="mr-2 h-5 w-5" />}
                        {loading ? 'Анализ...' : 'Загрузить и проанализировать'}
                      </button>
                      {error && <p className="text-red-400 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-2"/>Ошибка: {error.message}</p>}
                    </div>
                  ) : (
                     <div className="text-center text-gray-500 py-10">
                        <CalendarDays className="mx-auto h-12 w-12" />
                        <p className="mt-2 text-sm">Добавлять новые записи можно только для текущего дня.</p>
                     </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-900/50 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-2xl mt-8 lg:mt-0">
               <h3 className="text-2xl font-semibold mb-4 border-b border-white/10 pb-4">
                {selectedDateAnalyses.length > 0 ? 'Записи за этот день' : 'Нет записей за этот день'}
              </h3>
              <div className="custom-scrollbar space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {selectedDateAnalyses.length > 0 ? (
                  selectedDateAnalyses.map(analysis => {
                    const isExpanded = expandedAnalysisId === analysis.id;
                    return (
                      <div key={analysis.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => handleToggleAnalysis(analysis.id)}>
                          <div className="flex items-center space-x-4">
                            <img src={analysis.imageUrl} alt="Анализ лица" className="w-16 h-16 rounded-md object-cover" />
                            <div>
                              <p className="font-semibold text-gray-100">{analysis.diagnosis}</p>
                              <p className="text-sm text-gray-400">{new Date(analysis.createdAt).toLocaleTimeString('ru-RU')}</p>
                            </div>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>

                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 pt-4 mt-4 border-t border-white/10' : 'max-h-0 opacity-0'}`}>
                          <AnalysisDetails analysis={analysis} />
                        </div>
                      </div>
                    );
                  })
                ) : (<div className="text-center text-gray-500 py-10"><ImageIcon className="mx-auto h-12 w-12" /><p className="mt-2 text-sm">Записи не найдены.</p></div>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- МОБИЛЬНАЯ ВЕРСИЯ (С АДАПТАЦИЕЙ ШРИФТОВ) --- */}
      <div className="block lg:hidden bg-gradient-to-b from-gray-900 to-black min-h-screen">
        <div className="p-4 space-y-6">
          <header className="flex justify-between items-center pt-2">
            <div className="w-10 h-10 flex items-center justify-center"><CalendarDays className="w-7 h-7 text-sky-400" /></div>
            {/* ИЗМЕНЕНИЕ: Уменьшен размер шрифта для даты */}
            <h1 className="text-base font-semibold text-gray-200">{selectedDate?.toLocaleString('ru-RU', { day: 'numeric', month: 'long' })}</h1>
          </header>

          <div className="-mx-4 px-4">
            {selectedDate && <WeekView selectedDate={selectedDate} setSelectedDate={setSelectedDate} analysesByDate={analysesByDate} />}
          </div>

          <div className="text-center py-8 px-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl">
            {/* ИЗМЕНЕНИЕ: Уменьшен размер шрифта */}
            <p className="text-sm text-gray-400">Анализов за сегодня</p>
            {/* ИЗМЕНЕНИЕ: Уменьшен самый большой шрифт */}
            <p className="text-6xl font-bold my-2 text-gray-100">{selectedDateAnalyses.length}</p>
            <p className="text-gray-400 text-sm">{canUpload ? "Вы можете добавить новую запись" : "Записи можно добавлять только сегодня"}</p>
            {canUpload && (
              <div className="mt-6">
                <input id="mobile-file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
                {/* ИЗМЕНЕНИЕ: Уменьшен размер шрифта в кнопке */}
                <label htmlFor="mobile-file-upload" className="w-full max-w-xs mx-auto bg-sky-500 text-white font-bold py-3 px-4 rounded-full hover:bg-sky-600 transition-colors flex items-center justify-center cursor-pointer shadow-lg shadow-sky-500/20 text-sm">
                  {loading ? <Loader2 className="animate-spin" /> : (selectedFile ? `Файл: ${selectedFile.name.substring(0, 20)}...` : 'Выберите файл')}
                </label>
                 {selectedFile && !loading && (<button onClick={handleFileUpload} className="w-full max-w-xs mx-auto mt-3 bg-sky-500/80 text-white font-bold py-3 px-4 rounded-full hover:bg-sky-500 transition-colors text-sm">Начать анализ</button>)}
              </div>
            )}
          </div>
        </div>

        <div className="bg-black p-4 rounded-t-3xl space-y-4 pb-24">
          <div>
            <div className="flex justify-between items-center mb-3 px-2">
              <h2 className="font-bold text-lg text-gray-200">Записи за день</h2>
            </div>
            {selectedDateAnalyses.length > 0 ? (
              <div className="space-y-3">
                {selectedDateAnalyses.map(analysis => {
                  const isExpanded = expandedAnalysisId === analysis.id;
                  return (
                    <div key={analysis.id} className="bg-gray-800 p-3 rounded-xl transition-all">
                      <div className="flex items-center space-x-4" onClick={() => handleToggleAnalysis(analysis.id)}>
                        <img src={analysis.imageUrl} alt="Анализ лица" className="w-14 h-14 rounded-lg object-cover" />
                        {/* ИЗМЕНЕНИЕ: Явная иерархия размеров шрифта */}
                        <div className="flex-1">
                          <p className="font-semibold text-base text-gray-200">{analysis.diagnosis}</p>
                          <p className="text-sm text-gray-400">Настроение: {analysis.mood}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(analysis.createdAt).toLocaleTimeString('ru-RU')}</p>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>

                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 pt-4 mt-4 border-t border-white/20' : 'max-h-0 opacity-0'}`}>
                        <AnalysisDetails analysis={analysis} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (<div className="text-center text-gray-500 py-8"><ImageIcon className="mx-auto h-10 w-10" /><p className="mt-2 text-sm">Записей не найдено.</p></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}