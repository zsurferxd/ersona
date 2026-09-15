import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';

const ThemeLanguageContext = createContext();

export function ThemeLanguageProvider({ children }) {
  // 1. Language State ('id' | 'en')
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('ersona_language');
      return saved === 'en' || saved === 'id' ? saved : 'id';
    } catch {
      return 'id';
    }
  });

  // 2. Theme State ('light' | 'dark')
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('ersona_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      // Fallback ke preferensi OS sistem jika ada
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    } catch {
      return 'light';
    }
  });

  // Efek sinkronisasi tema dengan class .dark di elemen <html>
  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('ersona_theme', theme);
    } catch (e) {
      console.warn('Gagal menyimpan tema:', e);
    }
  }, [theme]);

  // Efek sinkronisasi bahasa dengan atribut lang di <html>
  useEffect(() => {
    try {
      document.documentElement.setAttribute('lang', language);
      localStorage.setItem('ersona_language', language);
    } catch (e) {
      console.warn('Gagal menyimpan bahasa:', e);
    }
  }, [language]);

  const setTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
    }
  };

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setLanguage = (newLang) => {
    if (newLang === 'id' || newLang === 'en') {
      setLanguageState(newLang);
    }
  };

  const toggleLanguage = () => {
    setLanguageState(prev => (prev === 'id' ? 'en' : 'id'));
  };

  // Helper fungsi penerjemah string berantai: t('landing.hero.title', { name: 'User' })
  const t = (path, params = {}) => {
    const keys = path.split('.');
    
    // Cari di kamus bahasa aktif
    let current = translations[language];
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        current = null;
        break;
      }
    }

    // Fallback ke bahasa Indonesia jika di EN tidak ditemukan
    if (current === null && language !== 'id') {
      let fallback = translations['id'];
      for (const key of keys) {
        if (fallback && fallback[key] !== undefined) {
          fallback = fallback[key];
        } else {
          fallback = null;
          break;
        }
      }
      current = fallback;
    }

    // Jika tetap tidak ada, kembalikan key
    if (current === null || current === undefined) {
      return path;
    }

    // Ganti parameter dinamis, misal {days}
    if (typeof current === 'string' && Object.keys(params).length > 0) {
      let formatted = current;
      for (const [pKey, pVal] of Object.entries(params)) {
        formatted = formatted.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      }
      return formatted;
    }

    return current;
  };

  return (
    <ThemeLanguageContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme,
        language,
        isEn: language === 'en',
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </ThemeLanguageContext.Provider>
  );
}

export function useThemeLanguage() {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage harus digunakan di dalam ThemeLanguageProvider');
  }
  return context;
}
