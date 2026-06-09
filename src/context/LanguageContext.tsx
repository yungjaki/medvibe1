'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Lang = 'bg' | 'latin';

interface LanguageContextValue {
  lang: Lang;
  isLatin: boolean;
  toggleLang: () => void;
  term: (bg: string, latin: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'medvibe-lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('bg');

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'latin' || saved === 'bg') {
        setLang(saved);
      }
    } catch {
      // localStorage unavailable (SSR / private browsing)
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === 'bg' ? 'latin' : 'bg';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const term = useCallback(
    (bg: string, latin: string) => (lang === 'latin' ? latin : bg),
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, isLatin: lang === 'latin', toggleLang, term }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a <LanguageProvider>');
  }
  return ctx;
}
