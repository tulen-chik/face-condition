'use client';

import { motion } from "framer-motion";
import {
    ArrowRight,
    BarChart,
    BrainCircuit,
    Camera,
    ShieldCheck,
    TrendingUp,
    UploadCloud,
    User,
    Zap,
} from "lucide-react";
import Link from "next/link";

// --- CONTENT CONSTANTS ---

const keyFeatures = [
    {
        title: "Анализ на базе ИИ",
        description: "Получите оценку состояния кожи, уровня стресса и усталости с помощью нейросети.",
        icon: BrainCircuit,
    },
    {
        title: "Отслеживание динамики",
        description: "Ведите дневник здоровья в календаре и наблюдайте за изменениями со временем.",
        icon: TrendingUp,
    },
    {
        title: "Персональные инсайты",
        description: "Узнайте, как образ жизни, питание и сон влияют на ваше самочувствие.",
        icon: User,
    },
    {
        title: "Конфиденциальность",
        description: "Ваши данные надежно защищены и доступны только вам. Мы не передаем их третьим лицам.",
        icon: ShieldCheck,
    },
    {
        title: "Простота использования",
        description: "Интуитивно понятный интерфейс позволяет начать пользоваться приложением за секунды.",
        icon: Zap,
    },
];

const steps = [
    {
        title: "Сделайте фото",
        description: "Сделайте селфи при хорошем дневном освещении без макияжа.",
        icon: Camera,
    },
    {
        title: "Загрузите в приложение",
        description: "Выберите фотографию из галереи или сделайте новый снимок.",
        icon: UploadCloud,
    },
    {
        title: "Получите анализ",
        description: "Наш ИИ обработает изображение и предоставит отчет за несколько секунд.",
        icon: BarChart,
    },
    {
        title: "Следите за прогрессом",
        description: "Сохраняйте результаты в календаре и отслеживайте динамику вашего здоровья.",
        icon: TrendingUp,
    },
];

const faqItems = [
    {
        question: "Насколько точен анализ?",
        answer: "Наш ИИ-алгоритм основан на анализе больших данных, но не является медицинской диагностикой. Используйте приложение для отслеживания общих тенденций и самочувствия.",
    },
    {
        question: "Мои данные в безопасности?",
        answer: "Да. Мы используем сквозное шифрование и строгие политики конфиденциальности. Ваши фотографии и данные анализа доступны только вам.",
    },
    {
        question: "Как часто нужно делать анализ?",
        answer: "Для наилучшего отслеживания динамики мы рекомендуем делать анализ 2-3 раза в неделю, примерно в одно и то же время и при схожем освещении.",
    },
    {
        question: "Что именно анализирует приложение?",
        answer: "Приложение оценивает такие показатели, как состояние кожи (гидратация, тон), признаки усталости и индикаторы стресса на основе визуальных маркеров.",
    },
];

// --- MAIN COMPONENT ---

export default function HomePage() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    return (
        <div className="bg-slate-50 min-h-screen text-gray-900 font-sans">
            {/* --- HERO SECTION --- */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 px-4">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#45969b]/10 rounded-full filter blur-3xl opacity-70 animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00ff90]/10 rounded-full filter blur-3xl opacity-70 animate-pulse animation-delay-4000"></div>

                <div className="relative z-10 max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-lg border border-slate-200 rounded-full shadow-sm mb-8"
                    >
                        <Zap className="w-5 h-5 text-[#009f5a]" />
                        <span className="text-sm font-semibold text-gray-700">Ваш персональный Health-трекер</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-gray-900"
                    >
                        Ваше лицо — карта вашего здоровья
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed"
                    >
                        Используйте силу искусственного интеллекта для анализа состояния кожи, уровня стресса и общего самочувствия по одной фотографии.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Link
                            href="/register"
                            className="group w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-gray-900 bg-[#00ff90] hover:bg-[#00e682] rounded-full transition-all duration-300 shadow-lg shadow-[#00ff90]/30"
                        >
                            <span className="mr-2">Начать анализ</span>
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* --- KEY FEATURES SECTION --- */}
            <section className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Ключевые возможности</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Все, что нужно для осознанного контроля за своим самочувствием.</p>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={containerVariants}
                    >
                        {keyFeatures.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={feature.title}
                                    variants={itemVariants}
                                    className="bg-white/80 backdrop-blur-lg border border-slate-200 rounded-2xl p-8 text-center shadow-lg transition-all hover:shadow-xl hover:-translate-y-1"
                                >
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00ff90]/20 text-[#009f5a] rounded-full mb-6">
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                    <p className="text-gray-600">{feature.description}</p>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* --- HOW IT WORKS SECTION --- */}
            <section className="py-20 lg:py-28 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Всего 4 простых шага</h2>
                        <p className="text-lg text-gray-600">Начните свой путь к лучшему самочувствию уже сегодня.</p>
                    </motion.div>

                    <div className="relative max-w-3xl mx-auto">
                        <div className="absolute left-1/2 top-12 bottom-12 w-0.5 bg-slate-200 hidden md:block" aria-hidden="true"></div>
                        <motion.div
                            className="space-y-16"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            variants={containerVariants}
                        >
                            {steps.map((step, i) => {
                                const Icon = step.icon;
                                return (
                                    <motion.div
                                        key={step.title}
                                        variants={itemVariants}
                                        className="flex flex-col md:flex-row items-center gap-8 relative"
                                    >
                                        <div className={`flex-1 text-center md:text-right ${i % 2 === 0 ? 'md:order-1' : 'md:order-3'}`}>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                            <p className="text-gray-600">{step.description}</p>
                                        </div>
                                        <div className="flex-shrink-0 w-24 h-24 bg-white border-4 border-slate-200 rounded-full flex items-center justify-center md:order-2 z-10">
                                            <div className="w-20 h-20 bg-[#00ff90] rounded-full flex items-center justify-center">
                                                <Icon className="w-10 h-10 text-gray-900" />
                                            </div>
                                        </div>
                                        <div className={`flex-1 ${i % 2 === 0 ? 'md:order-3' : 'md:order-1'}`}></div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- CTA SECTION --- */}
            <section className="py-20 lg:py-28 bg-slate-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold mb-6 text-gray-900"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.8 }}
                    >
                        Возьмите здоровье под контроль
                    </motion.h2>
                    <motion.p
                        className="text-xl mb-10 max-w-3xl mx-auto text-gray-600"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        Присоединяйтесь к тысячам пользователей, которые уже открыли для себя новый способ заботы о себе.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-gray-900 bg-[#00ff90] hover:bg-[#00e682] rounded-full transition-all duration-300 shadow-lg shadow-[#00ff90]/30"
                        >
                            Зарегистрироваться бесплатно
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* --- FAQ SECTION --- */}
            <section className="py-20 lg:py-28 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center text-gray-900">Частые вопросы</h2>
                    <div className="space-y-4">
                        {faqItems.map((faq, index) => (
                            <motion.div
                                key={index}
                                className="bg-slate-50 border border-slate-200 rounded-2xl p-6"
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.5 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                                <p className="text-gray-600">{faq.answer}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-16 bg-slate-100 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-gray-500">© {new Date().getFullYear()} Sona. Все права защищены.</p>
                </div>
            </footer>
        </div>
    );
}