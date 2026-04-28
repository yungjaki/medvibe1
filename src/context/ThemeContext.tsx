'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode, themes } from '@/lib/theme';

type ThemeContextType = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  t: typeof themes.soft | typeof themes.sharp;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'soft',
  setMode: () => {},
  t: themes.soft,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('soft');

  useEffect(() => {
    const saved = localStorage.getItem('medvibe-theme') as ThemeMode;
    if (saved === 'soft' || saved === 'sharp') setModeState(saved);
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem('medvibe-theme', m);
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, t: themes[mode] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
