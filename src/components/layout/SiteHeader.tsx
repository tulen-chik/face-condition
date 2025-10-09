"use client";

import { HeartPulse, Menu, User, X, LogIn, UserPlus, CalendarDays, Paperclip, BrainCircuit, LogOut, } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useUser } from '@/contexts/UserContext';

interface Props {
  locale: string;
}

export default function SiteHeader({ locale }: Props) {
  const { currentUser, loading: authLoading, logout } = useUser();
  const pathname = usePathname();
  const t = useTranslations('common');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // Вся ваша логика остается без изменений
  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuVisible(true);
    } else {
      const timer = setTimeout(() => setIsMenuVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  // ОБНОВЛЕННАЯ НАВИГАЦИЯ с иконками под стиль приложения
  const nav = [
    { href: `/${locale}/calendar`, label: "Анализ", icon: CalendarDays },
    { href: `/${locale}/blog`, label: "Статьи", icon: Paperclip },
    { href: `/${locale}/analysis`, label: "Аналитика", icon: BrainCircuit },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* ОБНОВЛЕННЫЙ ДИЗАЙН ХЕДЕРА */}
      <header className="sticky top-0 z-40 bg-black text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">
            {/* Логотип */}
            <div className="flex items-center">
              <Link href={`/${locale}`} className="flex items-center space-x-2 group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 border border-white/10 group-hover:border-sky-500 transition-colors">
                  <HeartPulse className="w-6 h-6 text-sky-500" />
                </div>
                <span className="text-xl font-bold text-gray-100">Health AI</span>
              </Link>
            </div>

            {/* Навигация для десктопа */}
            <nav className="hidden md:flex items-center space-x-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-gray-800 text-sky-400' // Активная ссылка
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Кнопки пользователя для десктопа */}
            <div className="flex items-center space-x-4">
              {!authLoading && (
                <div className="hidden md:flex items-center space-x-2">
                  {currentUser ? (
                    <Link
                      href={`/${locale}/profile`}
                      className="flex items-center space-x-3 pl-2 pr-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                      {currentUser.avatarUrl ? (
                        <img 
                          src={currentUser.avatarUrl} 
                          alt="Аватар" 
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-200">{currentUser.displayName || t('profile')}</span>
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={`/${locale}/login`}
                        className="px-4 py-2 rounded-full text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      >
                        {t('login')}
                      </Link>
                      <Link
                        href={`/${locale}/register`}
                        className="flex items-center space-x-2 px-4 py-2 rounded-full bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>{t('register')}</span>
                      </Link>
                    </>
                  )}
                </div>
              )}

              {/* Кнопка мобильного меню */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="md:hidden p-2 -mr-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label={t('openMenu')}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ОБНОВЛЕННОЕ МОБИЛЬНОЕ МЕНЮ */}
      {isMenuVisible && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`fixed top-0 right-0 h-full w-full max-w-sm bg-black shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
              isMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center space-x-2">
                <HeartPulse className="w-6 h-6 text-sky-500" />
                <span className="text-xl font-bold text-white">Health AI</span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                aria-label={t('closeMenu')}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-between overflow-y-auto p-4">
              {/* Основные ссылки */}
              <div className="space-y-2">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-sky-500/20 text-sky-400' // ИСПРАВЛЕНИЕ: Яркая активная ссылка
                        : 'text-gray-200 hover:bg-gray-800 hover:text-white' // ИСПРАВЛЕНИЕ: Более яркий неактивный текст
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Блок пользователя */}
              <div className="pt-4 mt-4 border-t border-gray-800">
                {currentUser ? (
                  <div className="space-y-2">
                    <Link
                      href={`/${locale}/profile`}
                      className="flex items-center w-full px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                      {currentUser.avatarUrl ? (
                        <img 
                          src={currentUser.avatarUrl} 
                          alt="Аватар" 
                          className="w-7 h-7 mr-3 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 mr-3 rounded-full bg-gray-700 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <span className="font-medium text-gray-200">{currentUser.displayName || t('profile')}</span>
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      {t('logout')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href={`/${locale}/login`}
                      className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                      <LogIn className="w-5 h-5 mr-2" />
                      {t('login')}
                    </Link>
                    <Link
                      href={`/${locale}/register`}
                      className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-700 transition-colors"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      {t('register')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}