'use client';

import { useState, useEffect, useRef } from 'react';
import { useGemini } from '@/contexts/GeminiContext';
import { useUser } from '@/contexts/UserContext'; // <-- 1. Импортируем useUser
import { BrainCircuit, AlertCircle, Sparkles, SendHorizontal, RefreshCw, Bot } from 'lucide-react';

// Определяем тип для сообщений в чате для строгой типизации
interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export default function AnalysisPage() {
  const { currentUser } = useUser(); // <-- 2. Получаем текущего пользователя
  const { getWeeklySummary, sendChatMessage } = useGemini();

  // Состояния для секции "Сводка за неделю"
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Состояния для секции "Чат"
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleFetchSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    setSummary('');
    try {
      const result = await getWeeklySummary();
      setSummary(result);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : 'Не удалось загрузить сводку.');
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, chatLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || chatLoading) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: currentMessage }] };
    
    setChatHistory(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    setChatLoading(true);

    try {
      const responseText = await sendChatMessage(messageToSend, chatHistory);
      const modelMessage: ChatMessage = { role: 'model', parts: [{ text: responseText }] };
      setChatHistory(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { 
        role: 'model', 
        parts: [{ text: `Произошла ошибка: ${error instanceof Error ? error.message : 'Не удалось получить ответ.'}` }] 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  // --- 3. Добавляем блок проверки авторизации ---
  if (!currentUser) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black p-4 sm:p-8 text-white font-sans flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-sky-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-gray-100">Требуется авторизация</h1>
          <p className="text-gray-400">
            Пожалуйста, войдите в свой аккаунт, чтобы получить доступ к центру аналитики и чату с ИИ-ассистентом.
          </p>
        </div>
      </div>
    );
  }

  // Если пользователь авторизован, показываем основной контент страницы
  return (
    <div className="relative min-h-screen overflow-hidden bg-black p-4 sm:p-8 text-white font-sans">
      <div className="relative max-w-7xl mx-auto z-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center text-gray-100">
            <BrainCircuit className="mr-4 h-9 w-9 sm:h-10 sm:w-10 text-sky-400" />
            Центр Аналитики
          </h1>
          <p className="text-gray-400 mt-2">Получите сводку о вашем состоянии и задайте вопросы нашему ИИ-ассистенту.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Секция: Сводка за неделю */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-200 flex items-center">
                <Sparkles className="w-6 h-6 mr-3 text-purple-400" />
                Сводка за неделю
              </h2>
              <button 
                onClick={handleFetchSummary}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                disabled={summaryLoading}
              >
                <RefreshCw className={`w-5 h-5 text-gray-400 ${summaryLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex-grow min-h-[200px] flex flex-col justify-center">
              {summaryLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                </div>
              ) : summaryError ? (
                <div className="text-center text-red-400 flex flex-col items-center">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <p>{summaryError}</p>
                </div>
              ) : summary ? (
                <p className="text-gray-300 leading-relaxed">{summary}</p>
              ) : (
                <div className="text-center text-gray-500">
                  <Bot className="w-10 h-10 mx-auto mb-3" />
                  <p>Нажмите кнопку обновления, чтобы получить аналитическую сводку за неделю.</p>
                </div>
              )}
            </div>
          </div>

          {/* Секция: Чат с ИИ */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col h-[70vh]">
            <h2 className="text-xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-4">Чат с ИИ-Ассистентом</h2>
            
            <div ref={chatContainerRef} className="flex-grow space-y-4 overflow-y-auto pr-2">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-sky-500 text-white rounded-br-lg' : 'bg-gray-700 text-gray-200 rounded-bl-lg'}`}>
                    <p className="text-sm leading-relaxed">{msg.parts[0].text}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-gray-200 p-3 rounded-2xl rounded-bl-lg">
                    <div className="flex items-center space-x-2">
                      <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 flex items-center space-x-2 border-t border-gray-700 pt-4">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Спросите о питании, сне..."
                className="w-full bg-gray-800 border border-gray-700 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors"
                disabled={chatLoading}
              />
              <button 
                type="submit" 
                className="bg-sky-500 p-3 rounded-full hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={chatLoading || !currentMessage.trim()}
              >
                <SendHorizontal className="w-5 h-5 text-white" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}