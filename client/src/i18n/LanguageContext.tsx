import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { SupportedLanguage, LanguageMeta } from './types.js';
import { SUPPORTED_LANGUAGES } from './types.js';
import { translations } from './translations/index.js';

export const LANGUAGE_STORAGE_KEY = 'antigravity_apex_language';
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export interface LanguageContextType {
  language: SupportedLanguage;
  currentLanguageMeta: LanguageMeta;
  languages: LanguageMeta[];
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      return saved;
    }

    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.toLowerCase();
      // Check prefix matching (e.g. 'zh-CN' -> 'zh', 'ru-RU' -> 'ru', 'de-DE' -> 'de')
      for (const lang of SUPPORTED_LANGUAGES) {
        if (browserLang === lang.code || browserLang.startsWith(`${lang.code}-`)) {
          return lang.code;
        }
      }
    }
  } catch {
    // Fallback if localStorage or navigator is inaccessible
  }

  return DEFAULT_LANGUAGE;
}

function resolveNestedKey(obj: unknown, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const segments = path.split('.');
  let current: unknown = obj;

  for (const segment of segments) {
    if (current && typeof current === 'object' && segment in current) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  if (typeof current === 'string') {
    return current;
  }
  return undefined;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = language;
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [language]);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    if (SUPPORTED_LANGUAGES.some(l => l.code === newLang)) {
      setLanguageState(newLang);
    }
  }, []);

  const t = useCallback(
    (path: string, fallback?: string): string => {
      // 1. Try currently selected language dictionary
      const currentDict = translations[language] as unknown;
      const foundCurrent = resolveNestedKey(currentDict, path);
      if (foundCurrent !== undefined) {
        return foundCurrent;
      }

      // 2. Fallback to English reference schema
      if (language !== 'en') {
        const enDict = translations.en as unknown;
        const foundEn = resolveNestedKey(enDict, path);
        if (foundEn !== undefined) {
          return foundEn;
        }
      }

      // 3. Fallback to provided string or the key path itself
      return fallback !== undefined ? fallback : path;
    },
    [language]
  );

  const currentLanguageMeta = useMemo(() => {
    return SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      currentLanguageMeta,
      languages: SUPPORTED_LANGUAGES,
      setLanguage,
      t,
    }),
    [language, currentLanguageMeta, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a <LanguageProvider>');
  }
  return context;
}

