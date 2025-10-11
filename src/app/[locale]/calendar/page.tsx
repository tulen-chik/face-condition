'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useGemini } from '@/contexts/GeminiContext';
import { useUser } from '@/contexts/UserContext';
import { useNotes } from '@/contexts/NotesContex';
import { HealthAnalysisRecord, EnhancedImageRecord } from '@/types/health';
import { NoteRecord } from '@/types/notes';
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
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Wand2,
    X,
    BookText,
    PlusCircle
} from 'lucide-react';

// --- Вспомогательные функции ---

const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
}

const isFuture = (date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
};

const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// --- Компонент: Модальное окно с календарем ---
const CalendarModal = ({ isOpen, onClose, selectedDate, onDateSelect, daysWithNotes }: { isOpen: boolean, onClose: () => void, selectedDate: Date | null, onDateSelect: (date: Date) => void, daysWithNotes: Set<string> }) => {
    const [viewDate, setViewDate] = useState(selectedDate || new Date());

    useEffect(() => {
        if (selectedDate) {
            setViewDate(selectedDate);
        }
    }, [selectedDate]);

    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
        const days = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [viewDate]);

    const handlePrevMonth = () => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-2xl w-full max-w-sm lg:max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg lg:text-xl font-bold text-gray-900 capitalize">{viewDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}</h2>
                    <div className="flex items-center gap-2 text-gray-700">
                        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs text-gray-500 mb-2">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {calendarDays.map((day, index) => {
                        if (!day) return <div key={`empty-${index}`}></div>;
                        const dayIsSelected = selectedDate && isSameDay(day, selectedDate);
                        const dayIsToday = isToday(day);
                        const hasNote = daysWithNotes.has(formatDateKey(day));

                        return (
                            <div key={day.toISOString()} className="relative flex justify-center">
                                <button
                                    onClick={() => onDateSelect(day)}
                                    className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-semibold transition-colors hover:bg-[#00ff90]/20
                                        ${dayIsSelected ? 'bg-[#00ff90] text-gray-900' : ''}
                                        ${!dayIsSelected && dayIsToday ? 'border-2 border-[#00ff90]' : ''}
                                        ${!dayIsSelected && !dayIsToday ? 'text-gray-700' : ''}
                                        ${isFuture(day) && !dayIsSelected ? 'text-gray-400' : ''}
                                    `}
                                >
                                    {day.getDate()}
                                </button>
                                {hasNote && <div className="absolute bottom-1.5 lg:bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-800 rounded-full"></div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- Компонент: Горизонтальный выбор дня ---
const WeekView = ({ selectedDate, setSelectedDate, daysWithNotes }: { selectedDate: Date | null, setSelectedDate: (date: Date) => void, daysWithNotes: Set<string> }) => {
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
        <div ref={weekContainerRef} className="custom-scrollbar flex justify-center space-x-2 lg:space-x-4 overflow-x-auto pb-2">
            {weekDays.map(day => {
                const isSelected = day.toDateString() === selectedDate?.toDateString();
                const hasNote = day && daysWithNotes.has(formatDateKey(day));

                return (
                    <div
                        key={day.toISOString()}
                        data-date={day.toDateString()}
                        onClick={() => setSelectedDate(day)}
                        className={`flex flex-col items-center justify-center text-center p-2 rounded-xl w-16 h-20 lg:w-24 lg:h-28 flex-shrink-0 transition-all duration-300 cursor-pointer
                            ${isSelected ? 'bg-[#00ff90] text-gray-900 font-bold' : 'bg-white hover:bg-slate-100 border border-slate-200'}
                            ${isFuture(day) && !isSelected ? 'text-gray-400' : ''}
                        `}
                    >
                        <span className={`text-xs lg:text-sm uppercase ${isSelected ? 'text-gray-800' : 'text-gray-500'}`}>{isToday(day) ? 'СЕГОДНЯ' : day.toLocaleString('ru-RU', { weekday: 'short' })}</span>
                        <span className="text-xl lg:text-3xl font-semibold mt-1">{day.getDate()}</span>
                        {hasNote && <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full mt-1.5 ${isSelected ? 'bg-white' : 'bg-[#00ff90]'}`}></div>}
                    </div>
                );
            })}
        </div>
    );
};

// --- Компонент: Секция для заметок ---
const NotesSection = ({ selectedDate, notesForDay, onDeleteNote, loading }: { selectedDate: Date, notesForDay: NoteRecord[], onDeleteNote: (noteId: string) => void, loading: boolean }) => {
    const { addNote, loading: notesLoading } = useNotes();
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddNote = async () => {
        if (!newNoteContent.trim()) return;
        try {
            const dayString = formatDateKey(selectedDate);
            await addNote("Заметка", newNoteContent, dayString);
            setNewNoteContent('');
            setIsAdding(false);
        } catch (error) {
            console.error("Ошибка при добавлении заметки:", error);
        }
    };

    const handleCancel = () => {
        setNewNoteContent('');
        setIsAdding(false);
    };

    return (
        <div className="bg-white/80 backdrop-blur-lg border border-slate-200 rounded-2xl p-6 shadow-lg h-fit mt-8">
            <h3 className="text-2xl font-semibold mb-4 border-b border-slate-200 pb-4 flex items-center text-gray-900">
                <BookText className="w-6 h-6 mr-3 text-[#00ff90]" />
                Заметки на день
            </h3>
            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2 mb-4">
                {notesForDay.length > 0 ? (
                    notesForDay.map(note => (
                        <div key={note.id} className="bg-slate-100 p-3 rounded-lg text-sm animate-fade-in flex items-start justify-between group">
                            <p className="text-gray-700 whitespace-pre-wrap flex-grow mr-2">{note.content}</p>
                            <button
                                onClick={() => onDeleteNote(note.id)}
                                disabled={loading}
                                className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-20"
                                aria-label="Удалить заметку"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                ) : (
                    !isAdding && <p className="text-gray-500 text-sm text-center py-4">Заметок на этот день нет.</p>
                )}
            </div>

            {isAdding ? (
                <div className="mt-4 animate-fade-in-slow">
                    <textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Напишите что-нибудь..."
                        className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm text-gray-800 focus:ring-2 focus:ring-[#00ff90] focus:border-[#00ff90] transition"
                        rows={3}
                        autoFocus
                    />
                    <div className="flex items-center gap-2 mt-2">
                        <button
                            onClick={handleAddNote}
                            disabled={!newNoteContent.trim() || notesLoading}
                            className="flex-1 bg-[#00ff90] text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-[#00e682] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {notesLoading ? <Loader2 className="animate-spin" /> : 'Сохранить'}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-[#009f5a] hover:text-[#00ff90] font-semibold p-2 rounded-lg hover:bg-[#00ff90]/10 transition-colors"
                >
                    <PlusCircle className="w-5 h-5" />
                    Добавить заметку
                </button>
            )}
        </div>
    );
};

// --- Основной компонент страницы ---
export default function HealthCalendarPage() {
    const { currentUser } = useUser();
    const { analyses, enhancedImages, loading: geminiLoading, error: geminiError, analyzeHealthFromFace, generateEnhancedImage } = useGemini();
    const { notes, fetchNotes, addNote, removeNote, loading: notesLoading } = useNotes();

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isAddingNoteMobile, setIsAddingNoteMobile] = useState(false);

    const loading = geminiLoading || notesLoading;

    useEffect(() => {
        setSelectedDate(new Date());
        fetchNotes();
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

    const notesByDate = useMemo(() => {
        const map = new Map<string, NoteRecord[]>();
        notes.forEach(note => {
            const dateKey = note.day;
            if (!map.has(dateKey)) { map.set(dateKey, []); }
            const notesForDay = map.get(dateKey)!;
            notesForDay.push(note);
            notesForDay.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
        return map;
    }, [notes]);

    const daysWithNotes = useMemo(() => {
        const dateSet = new Set<string>();
        notes.forEach(note => {
            dateSet.add(note.day);
        });
        return dateSet;
    }, [notes]);

    const enhancedImagesMap = useMemo(() => {
        const map = new Map<string, EnhancedImageRecord>();
        enhancedImages.forEach(image => map.set(image.originalAnalysisId, image));
        return map;
    }, [enhancedImages]);

    const selectedDateAnalyses = selectedDate ? analysesByDate.get(selectedDate.toDateString()) || [] : [];
    const selectedDateNotes = selectedDate ? notesByDate.get(formatDateKey(selectedDate)) || [] : [];

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
        setSelectedDate(newDate);
    };

    const handleDateSelectFromCalendar = (date: Date) => {
        setSelectedDate(date);
        setIsCalendarModalOpen(false);
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return;
        try {
            await analyzeHealthFromFace(selectedFile);
            setSelectedFile(null);
        } catch (uploadError) {
            console.error("Ошибка загрузки:", uploadError);
        }
    };

    const handleToggleAnalysis = (analysisId: string) => setExpandedAnalysisId(prevId => (prevId === analysisId ? null : analysisId));

    const handleGenerateEnhancedImage = async (analysis: HealthAnalysisRecord) => {
        setGeneratingId(analysis.id);
        try {
            await generateEnhancedImage(analysis);
        } catch (genError) {
            console.error("Ошибка генерации изображения:", genError);
        } finally {
            setGeneratingId(null);
        }
    };

    const handleAddNoteMobile = async () => {
        if (!newNoteContent.trim() || !selectedDate) return;
        try {
            const dayString = formatDateKey(selectedDate);
            await addNote("Заметка", newNoteContent, dayString);
            setNewNoteContent('');
            setIsAddingNoteMobile(false);
        } catch (error) {
            console.error("Ошибка при добавлении заметки:", error);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            await removeNote(noteId);
        } catch (error) {
            console.error("Ошибка при удалении заметки:", error);
        }
    };

    if (!currentUser) {
        return (
            <div className="bg-slate-50 min-h-screen text-gray-800 font-sans p-4 sm:p-6 flex items-center justify-center">
                <div className="text-center max-w-md"><AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" /><h1 className="text-2xl font-bold mb-2">Требуется авторизация</h1><p className="text-gray-500">Пожалуйста, войдите в свой аккаунт, чтобы получить доступ к календарю здоровья.</p></div>
            </div>
        );
    }

    const AnalysisDetails = ({ analysis }: { analysis: HealthAnalysisRecord }) => (
        <div className="space-y-4 text-sm">
            <div className="space-y-2"><h5 className="font-semibold text-base text-gray-800 flex items-center"><HeartPulse className="w-5 h-5 mr-2 text-[#009f5a]" /> Общее наблюдение</h5><p className="text-gray-600 pl-7">{analysis.diagnosis}</p></div>
            <div className="space-y-2"><h5 className="font-semibold text-base text-gray-800 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-[#009f5a]" /> Рекомендации</h5><ul className="list-disc list-inside text-gray-600 pl-7 space-y-1">{analysis.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}</ul></div>
            <div className="space-y-2 pt-2 border-t border-slate-200"><h5 className="font-semibold text-base text-gray-800 flex items-center"><ClipboardList className="w-5 h-5 mr-2 text-[#009f5a]" /> Детали</h5><div className="pl-7 space-y-1"><div className="flex justify-between"><span className="text-gray-500">Состояние кожи:</span><span className="font-medium text-right text-gray-700">{analysis.skinCondition}</span></div><div className="flex justify-between"><span className="text-gray-500">Состояние глаз:</span><span className="font-medium text-right text-gray-700">{analysis.eyeCondition}</span></div><div className="flex justify-between"><span className="text-gray-500">Уровень стресса:</span><span className="font-medium text-right text-gray-700">{analysis.stressLevel}</span></div><div className="flex justify-between"><span className="text-gray-500">Настроение:</span><span className="font-medium text-right text-gray-700">{analysis.mood}</span></div><div className="flex justify-between"><span className="text-gray-500">Усталость:</span><span className="font-medium text-right text-gray-700">{analysis.fatigue}</span></div></div></div>
        </div>
    );

    return (
        <div className="bg-slate-50 min-h-screen text-gray-900 font-sans">
            <CalendarModal isOpen={isCalendarModalOpen} onClose={() => setIsCalendarModalOpen(false)} selectedDate={selectedDate} onDateSelect={handleDateSelectFromCalendar} daysWithNotes={daysWithNotes} />

            {/* --- ДЕСКТОПНАЯ ВЕРСИЯ --- */}
            <div className="hidden lg:block relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#45969b]/10 rounded-full filter blur-3xl opacity-70 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00ff90]/10 rounded-full filter blur-3xl opacity-70 animate-pulse animation-delay-4000"></div>
                <div className="relative max-w-7xl mx-auto p-8 z-10">
                    <header className="mb-8">
                        <div className="flex items-center">
                            <button onClick={() => setIsCalendarModalOpen(true)} className="p-2 rounded-full hover:bg-black/5 transition-colors mr-4"><CalendarDays className="h-10 w-10 text-[#009f5a]" /></button>
                            <div><h1 className="text-4xl font-bold text-gray-900">Календарь здоровья</h1><p className="text-lg text-gray-600 mt-1 capitalize">{selectedDate?.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
                        </div>
                    </header>
                    <div className="bg-white/80 backdrop-blur-lg border border-slate-200 rounded-2xl p-4 shadow-lg mb-8 flex items-center gap-4">
                        <button onClick={handlePrevWeek} className="p-2 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00ff90]"><ArrowLeft className="h-6 w-6" /></button>
                        <div className="flex-grow">{selectedDate && <WeekView selectedDate={selectedDate} setSelectedDate={setSelectedDate} daysWithNotes={daysWithNotes} />}</div>
                        <button onClick={handleNextWeek} className="p-2 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00ff90]"><ArrowRight className="h-6 w-6" /></button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8">
                        <div>
                            <div className="bg-white/80 backdrop-blur-lg border border-slate-200 rounded-2xl p-6 shadow-lg h-fit">
                                <h3 className="text-2xl font-semibold mb-4 border-b border-slate-200 pb-4">{selectedDate && isToday(selectedDate) ? 'Добавить анализ' : 'Анализ фото'}</h3>
                                {selectedDate && isToday(selectedDate) ? (
                                    <div>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#00ff90] transition-colors"><UploadCloud className="mx-auto h-12 w-12 text-gray-400" /><label htmlFor="file-upload" className="mt-4 block text-sm font-medium text-gray-700 hover:text-[#009f5a] cursor-pointer">{selectedFile ? selectedFile.name : 'Выберите файл'}</label><input id="file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} /><p className="text-xs text-gray-500 mt-1">PNG, JPG до 10MB</p></div>
                                        <button onClick={handleFileUpload} disabled={!selectedFile || loading} className="w-full mt-4 bg-[#00ff90] text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-[#00e682] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center">{geminiLoading ? <Loader2 className="animate-spin mr-2" /> : <UploadCloud className="mr-2 h-5 w-5" />}{geminiLoading ? 'Анализ...' : 'Загрузить и проанализировать'}</button>
                                        {geminiError && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-2" />Ошибка: {geminiError.message}</p>}
                                    </div>
                                ) : (<div className="text-center text-gray-500 py-10"><CalendarDays className="mx-auto h-12 w-12" /><p className="mt-2 text-sm">Добавлять анализы по фото можно только для текущего дня.</p></div>)}
                            </div>
                            {selectedDate && <NotesSection selectedDate={selectedDate} notesForDay={selectedDateNotes} onDeleteNote={handleDeleteNote} loading={notesLoading} />}
                        </div>
                        <div className="bg-white/80 backdrop-blur-lg border border-slate-200 rounded-2xl p-6 shadow-lg mt-8 lg:mt-0">
                            <h3 className="text-2xl font-semibold mb-4 border-b border-slate-200 pb-4">Записи за день</h3>
                            <div className="custom-scrollbar space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                                {selectedDate && isFuture(selectedDate) ? (
                                    <div className="text-center text-gray-500 py-10"><ImageIcon className="mx-auto h-12 w-12" /><p className="mt-2 text-sm">Анализы для будущих дат недоступны.</p><p className="mt-1 text-xs">Вы можете оставить заметку на этот день.</p></div>
                                ) : selectedDateAnalyses.length > 0 ? (
                                    selectedDateAnalyses.map(analysis => {
                                        const isExpanded = expandedAnalysisId === analysis.id;
                                        const enhancedImage = enhancedImagesMap.get(analysis.id);
                                        const isGenerating = generatingId === analysis.id;
                                        return (
                                            <div key={analysis.id} className="bg-slate-100 p-4 rounded-2xl border border-slate-200 transition-all">
                                                <div className="cursor-pointer" onClick={() => handleToggleAnalysis(analysis.id)}>
                                                    <div className="flex justify-center items-center gap-4 mb-4"><img src={analysis.imageUrl} alt="Оригинал" className="w-48 h-48 rounded-md object-cover shadow-md" />{enhancedImage && (<img src={enhancedImage.imageUrl} alt="Улучшенная версия" className="w-48 h-48 rounded-md object-cover shadow-md" />)}</div>
                                                    <div className="flex items-start justify-between"><div className="flex-1 min-w-0"><p className="font-semibold text-lg text-gray-800">{analysis.diagnosis}</p><p className="text-sm text-gray-500">{new Date(analysis.createdAt).toLocaleTimeString('ru-RU')}</p></div><ChevronDown className={`w-6 h-6 text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${isExpanded ? 'rotate-180' : ''}`} /></div>
                                                </div>
                                                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 pt-4 mt-4 border-t border-slate-200' : 'max-h-0 opacity-0'}`}>
                                                    <AnalysisDetails analysis={analysis} />
                                                    <div className="mt-4 pt-4 border-t border-slate-200"><button onClick={() => handleGenerateEnhancedImage(analysis)} disabled={!!enhancedImage || isGenerating} className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#45969b] rounded-lg hover:bg-[#3a7f83] transition-colors disabled:bg-gray-300 disabled:opacity-70 disabled:cursor-not-allowed">{isGenerating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Генерация...</>) : enhancedImage ? (<><Wand2 className="w-4 h-4 mr-2" />Улучшение создано</>) : (<><Wand2 className="w-4 h-4 mr-2" />Улучшить с помощью AI</>)}</button></div>
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

            {/* --- МОБИЛЬНАЯ ВЕРСИЯ --- */}
            <div className="block lg:hidden bg-gradient-to-b from-slate-100 to-slate-50 min-h-screen">
                <div className="p-4 space-y-6">
                    <header className="flex justify-between items-center pt-2">
                        <button onClick={() => setIsCalendarModalOpen(true)} className="w-10 h-10 flex items-center justify-center p-2 rounded-full hover:bg-black/5 transition-colors"><CalendarDays className="w-7 h-7 text-[#009f5a]" /></button>
                        <h1 className="text-base font-semibold text-gray-800">{selectedDate?.toLocaleString('ru-RU', { day: 'numeric', month: 'long' })}</h1>
                        <div className="w-10 h-10"></div>
                    </header>
                    <div className="-mx-4 px-4">{selectedDate && <WeekView selectedDate={selectedDate} setSelectedDate={setSelectedDate} daysWithNotes={daysWithNotes} />}</div>
                    {selectedDate && isToday(selectedDate) && (
                        <div className="text-center py-8 px-4 bg-white backdrop-blur-lg border border-slate-200 rounded-3xl shadow-md">
                            <p className="text-sm text-gray-500">Анализов за сегодня</p><p className="text-6xl font-bold my-2 text-gray-800">{selectedDateAnalyses.length}</p><p className="text-gray-500 text-sm">Вы можете добавить новую запись</p>
                            <div className="mt-6"><input id="mobile-file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} /><label htmlFor="mobile-file-upload" className="w-full max-w-xs mx-auto bg-[#00ff90] text-gray-900 font-bold py-3 px-4 rounded-full hover:bg-[#00e682] transition-colors flex items-center justify-center cursor-pointer shadow-lg shadow-[#00ff90]/30 text-sm">{loading ? <Loader2 className="animate-spin" /> : (selectedFile ? `Файл: ${selectedFile.name.substring(0, 20)}...` : 'Выберите файл')}</label>{selectedFile && !loading && (<button onClick={handleFileUpload} className="w-full max-w-xs mx-auto mt-3 bg-[#00ff90]/80 text-gray-900 font-bold py-3 px-4 rounded-full hover:bg-[#00ff90] transition-colors text-sm">Начать анализ</button>)}</div>
                        </div>
                    )}
                </div>
                <div className="bg-slate-100 p-4 rounded-t-3xl space-y-6 pb-24 border-t border-slate-200">
                    <div>
                        <div className="flex justify-between items-center mb-3 px-2"><h2 className="font-bold text-lg text-gray-800">Анализы за день</h2></div>
                        {selectedDate && isFuture(selectedDate) ? (
                            <div className="text-center text-gray-500 py-8"><ImageIcon className="mx-auto h-10 w-10" /><p className="mt-2 text-sm">Анализы для будущих дат недоступны.</p></div>
                        ) : selectedDateAnalyses.length > 0 ? (
                            <div className="space-y-4">
                                {selectedDateAnalyses.map(analysis => {
                                    const isExpanded = expandedAnalysisId === analysis.id;
                                    const enhancedImage = enhancedImagesMap.get(analysis.id);
                                    const isGenerating = generatingId === analysis.id;
                                    return (
                                        <div key={analysis.id} className="bg-white p-4 rounded-2xl transition-all shadow">
                                            <div className="cursor-pointer" onClick={() => handleToggleAnalysis(analysis.id)}>
                                                <div className="flex justify-center items-center gap-4 mb-4"><img src={analysis.imageUrl} alt="Оригинал" className="w-36 h-36 sm:w-40 sm:h-40 rounded-md object-cover shadow-sm" />{enhancedImage && (<img src={enhancedImage.imageUrl} alt="Улучшенная версия" className="w-36 h-36 sm:w-40 sm:h-40 rounded-md object-cover shadow-sm" />)}</div>
                                                <div className="flex items-start justify-between"><div className="flex-1 min-w-0"><p className="font-semibold text-lg text-gray-800">{analysis.diagnosis}</p><p className="text-sm text-gray-500">Настроение: {analysis.mood}</p><p className="text-xs text-gray-400 mt-1">{new Date(analysis.createdAt).toLocaleTimeString('ru-RU')}</p></div><ChevronDown className={`w-6 h-6 text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${isExpanded ? 'rotate-180' : ''}`} /></div>
                                            </div>
                                            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 pt-4 mt-4 border-t border-slate-200' : 'max-h-0 opacity-0'}`}>
                                                <AnalysisDetails analysis={analysis} />
                                                <div className="mt-4"><button onClick={() => handleGenerateEnhancedImage(analysis)} disabled={!!enhancedImage || isGenerating} className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-[#45969b] rounded-lg hover:bg-[#3a7f83] transition-colors disabled:bg-gray-300 disabled:opacity-70 disabled:cursor-not-allowed">{isGenerating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Генерация...</>) : enhancedImage ? (<><Wand2 className="w-4 h-4 mr-2" />Создано</>) : (<><Wand2 className="w-4 h-4 mr-2" />Улучшить</>)}</button></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (<div className="text-center text-gray-500 py-8"><ImageIcon className="mx-auto h-10 w-10" /><p className="mt-2 text-sm">Записей не найдено.</p></div>)}
                    </div>
                    {selectedDate && (
                        <div className="bg-white p-4 rounded-2xl shadow">
                            <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center"><BookText className="w-5 h-5 mr-2 text-[#009f5a]" />Заметки</h3>
                            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2 mb-4">
                                {selectedDateNotes.length > 0 ? (
                                    selectedDateNotes.map(note => (
                                        <div key={note.id} className="bg-slate-100 p-3 rounded-lg text-sm flex items-start justify-between group">
                                            <p className="text-gray-700 whitespace-pre-wrap flex-grow mr-2">{note.content}</p>
                                            <button
                                                onClick={() => handleDeleteNote(note.id)}
                                                disabled={notesLoading}
                                                className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors flex-shrink-0 disabled:opacity-20"
                                                aria-label="Удалить заметку"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                ) : (<p className="text-gray-500 text-sm text-center py-3">Заметок нет.</p>)}
                            </div>
                            {isAddingNoteMobile ? (
                                <div className="mt-4 animate-fade-in-slow">
                                    <textarea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Добавить заметку..." className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#00ff90] focus:border-[#00ff90] transition" rows={3} autoFocus />
                                    <div className="flex items-center gap-2 mt-2">
                                        <button onClick={handleAddNoteMobile} disabled={!newNoteContent.trim() || notesLoading} className="flex-1 bg-[#00ff90] text-gray-900 font-bold py-2.5 px-4 rounded-lg hover:bg-[#00e682] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-sm">{notesLoading ? <Loader2 className="animate-spin" /> : 'Сохранить'}</button>
                                        <button onClick={() => setIsAddingNoteMobile(false)} className="bg-gray-200 text-gray-800 font-bold py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors">Отмена</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setIsAddingNoteMobile(true)} className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-[#009f5a] hover:text-[#00ff90] font-semibold p-2 rounded-lg hover:bg-[#00ff90]/10 transition-colors"><PlusCircle className="w-5 h-5" />Добавить заметку</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}