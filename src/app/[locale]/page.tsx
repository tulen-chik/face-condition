"use client"

import { motion } from "framer-motion"
// Иконки, соответствующие теме здоровья и технологий
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
} from "lucide-react"
import Link from "next/link"

// --- НОВЫЙ КОНТЕНТ СТРАНИЦЫ ---

// Ключевые возможности
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

// Как это работает
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

// FAQ
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

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  return (
    // --- НОВЫЙ ДИЗАЙН СТРАНИЦЫ ---
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 bg-black">
        <div className="absolute inset-0 z-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center"></div>
        </div>
        
        <div className="container mx-auto max-w-6xl text-center relative z-10 px-4">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full shadow-sm mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Zap className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Ваш персональный Health-трекер</span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Ваше лицо — карта вашего здоровья
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Используйте силу искусственного интеллекта для анализа состояния кожи, уровня стресса и общего самочувствия по одной фотографии.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/register"
                className="group w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-black bg-white hover:bg-gray-300 rounded-lg transition-colors duration-300"
              >
                <span className="mr-2">Начать анализ</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Ключевые возможности */}
      <section className="py-24 bg-black border-t border-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Ключевые возможности</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">Все, что нужно для осознанного контроля за своим самочувствием.</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {keyFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  className="bg-black border border-gray-800 rounded-lg p-8 text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Как это работает */}
      <section className="py-24 bg-gray-900/50 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Всего 4 простых шага</h2>
            <p className="text-lg text-gray-400">Начните свой путь к лучшему самочувствию уже сегодня.</p>
          </motion.div>

          <div className="relative max-w-5xl mx-auto">
            <div className="absolute left-1/2 top-12 bottom-12 w-0.5 bg-gray-800 hidden md:block" aria-hidden="true"></div>
            <motion.div
              className="space-y-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
            >
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={i}
                    variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
                    className="flex flex-col md:flex-row items-center gap-8"
                  >
                    <div className={`flex-1 text-center md:text-right ${i % 2 === 0 ? 'md:order-1' : 'md:order-3'}`}>
                      <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-gray-400">{step.description}</p>
                    </div>
                    <div className="flex-shrink-0 w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center border-4 border-black md:order-2">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div className={`flex-1 ${i % 2 === 0 ? 'md:order-3' : 'md:order-1'}`}></div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-black border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-6 text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            Возьмите здоровье под контроль
          </motion.h2>
          <motion.p
            className="text-xl mb-10 max-w-3xl mx-auto text-gray-400"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Присоединяйтесь к тысячам пользователей, которые уже открыли для себя новый способ заботы о себе.
          </motion.p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-black bg-white hover:bg-gray-300 rounded-lg transition-colors duration-300"
            >
              Зарегистрироваться бесплатно
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-black border-t border-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center text-white">Частые вопросы</h2>
          <div className="max-w-4xl mx-auto space-y-4">
            {faqItems.map((faq, index) => (
              <motion.div
                key={index}
                className="bg-black border border-gray-800 rounded-lg p-6"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <h3 className="text-lg font-bold text-white mb-2">{faq.question}</h3>
                <p className="text-gray-400">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-black border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500">© {new Date().getFullYear()} Health Vision. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}