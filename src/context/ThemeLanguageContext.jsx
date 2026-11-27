import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';

const ThemeLanguageContext = createContext();

export function ThemeLanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('ersona_language');
      return saved === 'en' || saved === 'id' ? saved : 'id';
    } catch {
      return 'id';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('ersona_site_theme');
    } catch {
      // Ignore storage access restriction
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.setAttribute('lang', language);
      localStorage.setItem('ersona_language', language);
    } catch {
      // Ignore storage access restriction
    }
  }, [language]);

  const setLanguage = (nextLang) => {
    if (nextLang === 'id' || nextLang === 'en') {
      setLanguageState(nextLang);
    }
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'id' ? 'en' : 'id'));
  };

  const t = (path, params = {}) => {
    const keys = path.split('.');
    let current = translations[language];
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        current = null;
        break;
      }
    }

    if (current === null && language !== 'id') {
      let fallback = translations.id;
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

    if (current === null || current === undefined) {
      return path;
    }

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
    throw new Error('useThemeLanguage must be used within ThemeLanguageProvider');
  }
  return context;
}
