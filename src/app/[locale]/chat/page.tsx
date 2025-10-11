'use client';

import { useState, useEffect, useRef } from 'react';
import { useGemini } from '@/contexts/GeminiContext';
import { useUser } from '@/contexts/UserContext';
import { AlertCircle, SendHorizontal, Bot, MessageCircle } from 'lucide-react';

// --- Business logic remains unchanged ---
interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  isError?: boolean;
}

export default function ChatPage() {
  const { currentUser } = useUser();
  const { sendChatMessage } = useGemini();

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
        parts: [{ text: `Произошла ошибка: ${error instanceof Error ? error.message : 'Не удалось получить ответ.'}` }],
        isError: true
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  // --- REDESIGNED UI ---

  if (!currentUser) {
    return (
      <div className="bg-slate-50 min-h-screen text-gray-800 font-sans p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Требуется авторизация</h1>
          <p className="text-gray-500">Пожалуйста, войдите в свой аккаунт, чтобы начать чат с ИИ-ассистентом.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 p-4 sm:p-8 text-gray-900 font-sans flex flex-col">
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#45969b]/10 rounded-full filter blur-3xl opacity-70 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00ff90]/10 rounded-full filter blur-3xl opacity-70 animate-pulse animation-delay-4000"></div>

      <div className="relative max-w-4xl w-full mx-auto z-10 flex flex-col flex-grow" style={{ height: 'calc(100vh - 4rem)' }}>
        <header className="mb-6 flex-shrink-0">
            <div className="flex items-center">
                <div className="p-2 rounded-full bg-white/80 border border-slate-200 shadow-md mr-4">
                    <Bot className="h-10 w-10 text-[#009f5a]" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">ИИ-Ассистент</h1>
                    <p className="text-lg text-gray-600 mt-1">Задайте любой вопрос о вашем здоровье</p>
                </div>
            </div>
        </header>

        {/* Chat Section */}
        <div className="bg-white/80 backdrop-blur-lg border border-slate-200 rounded-2xl shadow-lg flex flex-col flex-grow">
          <div ref={chatContainerRef} className="flex-grow p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && <Bot className="w-6 h-6 text-slate-400 flex-shrink-0 mb-1" />}
                <div className={`max-w-xs md:max-w-lg p-3 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-[#00ff90] text-gray-900 rounded-br-none' 
                    : msg.isError
                    ? 'bg-red-100 text-red-800 border border-red-200 rounded-bl-none'
                    : 'bg-slate-100 text-gray-800 rounded-bl-none'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.parts[0].text}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-end gap-2 justify-start">
                <Bot className="w-6 h-6 text-slate-400 flex-shrink-0 mb-1" />
                <div className="bg-slate-100 p-3 rounded-2xl rounded-bl-none">
                  <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 flex items-center space-x-3 border-t border-slate-200 bg-white/50 rounded-b-2xl">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Спросите о питании, сне..."
              className="w-full bg-white border border-slate-300 rounded-full py-2.5 px-5 focus:outline-none focus:ring-2 focus:ring-[#00ff90] transition text-sm"
              disabled={chatLoading}
            />
            <button
              type="submit"
              className="bg-[#00ff90] p-3 rounded-full hover:bg-[#00e682] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-md shadow-[#00ff90]/40"
              disabled={chatLoading || !currentMessage.trim()}
            >
              <SendHorizontal className="w-5 h-5 text-gray-900" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}