'use client';

import { useState, useEffect, useRef } from 'react';
import { useGemini } from '@/contexts/GeminiContext';
import { useUser } from '@/contexts/UserContext';
import { AlertCircle, SendHorizontal, Bot } from 'lucide-react';

// Определяем тип для сообщений в чате
interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export default function ChatPage() {
  const { currentUser } = useUser();
  const { sendChatMessage } = useGemini();

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Автоматическая прокрутка чата вниз
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

  // Блок проверки авторизации
  if (!currentUser) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black p-4 sm:p-8 text-white font-sans flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-sky-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-gray-100">Требуется авторизация</h1>
          <p className="text-gray-400">
            Пожалуйста, войдите в свой аккаунт, чтобы начать чат с ИИ-ассистентом.
          </p>
        </div>
      </div>
    );
  }

  // Основной контент страницы
  return (
    <div className="relative min-h-screen overflow-hidden bg-black p-4 sm:p-8 text-white font-sans flex flex-col">
      <div className="relative max-w-4xl w-full mx-auto z-10 flex flex-col flex-grow">
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center text-gray-100">
            <Bot className="mr-4 h-9 w-9 sm:h-10 sm:w-10 text-sky-400" />
            ИИ-Ассистент
          </h1>
          <p className="text-gray-400 mt-2">Задайте любой вопрос о вашем здоровье, питании или тренировках.</p>
        </header>

        {/* Секция: Чат с ИИ */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col flex-grow h-[calc(100vh-200px)]">
          <div ref={chatContainerRef} className="flex-grow p-6 space-y-4 overflow-y-auto pr-2">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-sky-500 text-white rounded-br-lg' : 'bg-gray-700 text-gray-200 rounded-bl-lg'}`}>
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

          <form onSubmit={handleSendMessage} className="p-4 flex items-center space-x-2 border-t border-gray-700">
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
  );
}