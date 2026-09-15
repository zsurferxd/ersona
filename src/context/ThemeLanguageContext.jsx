import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';

const ThemeLanguageContext = createContext();

export function ThemeLanguageProvider({ children }) {
  // 1. Language State ('id' | 'en') - Default English
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('ersona_language');
      return saved === 'en' || saved === 'id' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  // Current Scope: 'landing' | 'workspace'
  const [currentScope, setCurrentScope] = useState('landing');

  // Deteksi tema OS / HP secara realtime
  const [systemTheme, setSystemTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Landing Page Theme: default 'light'
  const [landingTheme, setLandingTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('ersona_landing_theme');
      return saved === 'dark' || saved === 'light' ? saved : 'light';
    } catch {
      return 'light';
    }
  });

  // Workspace Theme: default null (mengikuti tema HP/systemTheme), atau preferensi manual user jika pernah toggle
  const [workspaceTheme, setWorkspaceTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('ersona_workspace_theme');
      return saved === 'dark' || saved === 'light' ? saved : null;
    } catch {
      return null;
    }
  });

  // Tema aktif berdasarkan scope saat ini
  const activeTheme = currentScope === 'workspace'
    ? (workspaceTheme || systemTheme)
    : landingTheme;

  // Efek sinkronisasi tema dengan class .dark di elemen <html>
  useEffect(() => {
    try {
      if (activeTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Gagal sinkronisasi tema:', e);
    }
  }, [activeTheme]);

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
    if (newTheme !== 'light' && newTheme !== 'dark') return;
    if (currentScope === 'workspace') {
      setWorkspaceTheme(newTheme);
      try { localStorage.setItem('ersona_workspace_theme', newTheme); } catch {}
    } else {
      setLandingTheme(newTheme);
      try { localStorage.setItem('ersona_landing_theme', newTheme); } catch {}
    }
  };

  const toggleTheme = () => {
    if (currentScope === 'workspace') {
      const next = (workspaceTheme || systemTheme) === 'dark' ? 'light' : 'dark';
      setWorkspaceTheme(next);
      try { localStorage.setItem('ersona_workspace_theme', next); } catch {}
    } else {
      const next = landingTheme === 'dark' ? 'light' : 'dark';
      setLandingTheme(next);
      try { localStorage.setItem('ersona_landing_theme', next); } catch {}
    }
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
        theme: activeTheme,
        isDark: activeTheme === 'dark',
        setTheme,
        toggleTheme,
        currentScope,
        setCurrentScope,
        systemTheme,
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
