"use client";

import { HeartPulse, Menu, User, X, LogIn, UserPlus, CalendarDays, Paperclip, BrainCircuit, LogOut, MessageCircle, } from 'lucide-react';
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

  // --- Business logic remains unchanged ---
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

  const nav = [
    { href: `/${locale}/calendar`, label: "Анализ", icon: CalendarDays },
    { href: `/${locale}/blog`, label: "Статьи", icon: Paperclip },
    { href: `/${locale}/analysis`, label: "Аналитика", icon: BrainCircuit },
    { href: `/${locale}/chat`, label: "Чат", icon: MessageCircle },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* --- REDESIGN: Light theme header with blur effect --- */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg text-gray-900 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href={`/${locale}`} className="flex items-center space-x-3 group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm group-hover:border-[#009f5a] transition-colors">
                  <HeartPulse className="w-6 h-6 text-[#009f5a]" />
                </div>
                <span className="text-xl font-bold text-gray-900">Sona</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-slate-100 text-[#009f5a]' // Active link
                      : 'text-gray-600 hover:bg-slate-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User buttons for desktop */}
            <div className="flex items-center space-x-4">
              {!authLoading && (
                <div className="hidden md:flex items-center space-x-2">
                  {currentUser ? (
                    <Link
                      href={`/${locale}/profile`}
                      className="flex items-center space-x-3 pl-2 pr-4 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
                    >
                      {currentUser.avatarUrl ? (
                        <img 
                          src={currentUser.avatarUrl} 
                          alt="Аватар" 
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-800">{currentUser.displayName || t('profile')}</span>
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={`/${locale}/login`}
                        className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-slate-100 transition-colors"
                      >
                        {t('login')}
                      </Link>
                      <Link
                        href={`/${locale}/register`}
                        className="flex items-center space-x-2 px-4 py-2 rounded-full bg-[#00ff90] text-gray-900 text-sm font-bold hover:bg-[#00e682] transition-colors shadow-md shadow-[#00ff90]/30"
                      >
                        <span>{t('register')}</span>
                      </Link>
                    </>
                  )}
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="md:hidden p-2 -mr-2 text-gray-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label={t('openMenu')}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- REDESIGN: Light theme mobile menu --- */}
      {isMenuVisible && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className={`fixed inset-0 z-50 bg-gray-900/20 backdrop-blur-sm transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-l border-slate-200 ${
              isMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <HeartPulse className="w-6 h-6 text-[#009f5a]" />
                <span className="text-xl font-bold text-gray-900">Sona</span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 -mr-2 text-gray-500 hover:text-gray-900 rounded-lg transition-colors"
                aria-label={t('closeMenu')}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-between overflow-y-auto p-4">
              {/* Main links */}
              <div className="space-y-2">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-[#00ff90]/20 text-[#009f5a]'
                        : 'text-gray-800 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* User block */}
              <div className="pt-4 mt-4 border-t border-slate-200">
                {currentUser ? (
                  <div className="space-y-2">
                    <Link
                      href={`/${locale}/profile`}
                      className="flex items-center w-full px-4 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      {currentUser.avatarUrl ? (
                        <img 
                          src={currentUser.avatarUrl} 
                          alt="Аватар" 
                          className="w-7 h-7 mr-3 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 mr-3 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <span className="font-medium text-gray-800">{currentUser.displayName || t('profile')}</span>
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-slate-100 transition-colors"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      {t('logout')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href={`/${locale}/login`}
                      className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors font-semibold text-gray-800"
                    >
                      <LogIn className="w-5 h-5 mr-2" />
                      {t('login')}
                    </Link>
                    <Link
                      href={`/${locale}/register`}
                      className="flex items-center justify-center w-full px-4 py-3 rounded-lg bg-[#00ff90] text-gray-900 font-bold hover:bg-[#00e682] transition-colors"
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