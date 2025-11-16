import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations, Language, AvailableLanguage } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (key: string, fallback?: string) => string;
  availableLanguages: AvailableLanguage[];
  t: (key: string, fallback?: string) => string; // Alias for translate
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get browser language or default to 'en'
  const getBrowserLanguage = (): Language => {
    const browserLang = navigator.language.split('-')[0];
    return (Object.keys(translations).includes(browserLang) ? browserLang : 'en') as Language;
  };

  // Check localStorage for saved language or use browser language
  const getSavedLanguage = (): Language => {
    const savedLang = localStorage.getItem('language');
    return (savedLang && Object.keys(translations).includes(savedLang) 
      ? savedLang 
      : getBrowserLanguage()) as Language;
  };

  const [language, setLanguageState] = useState<Language>(getSavedLanguage());

  const availableLanguages: AvailableLanguage[] = [
    { code: 'en', nativeName: 'English' },
    { code: 'es', nativeName: 'Español' },
    { code: 'fr', nativeName: 'Français' },
    { code: 'de', nativeName: 'Deutsch' },
    { code: 'zh', nativeName: '中文' },
  ];

  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  const translate = (key: string, fallback?: string): string => {
    // If a fallback is provided, return it directly (new direct text content approach)
    if (fallback) {
      return fallback;
    }
    
    // For backward compatibility, still support translation keys
    const translation = translations[language]?.[key] || translations['en'][key];
    return translation || key || ""; // Return key or empty string if translation doesn't exist
  };

  // Listen for language changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'language' && e.newValue) {
        setLanguageState(e.newValue as Language);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      translate, 
      t: translate, // Add translate function as a t alias for compatibility
      availableLanguages 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
