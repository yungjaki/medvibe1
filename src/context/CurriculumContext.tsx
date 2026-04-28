'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { universities, University, curriculumEmphasis, CurriculumEmphasis } from '@/lib/data/curriculum';

type CurriculumContextType = {
  university: University | null;
  setUniversity: (id: string | null) => void;
  getEmphasis: (subject: string, chapter: string) => CurriculumEmphasis | null;
};

const CurriculumContext = createContext<CurriculumContextType>({
  university: null,
  setUniversity: () => {},
  getEmphasis: () => null,
});

const STORAGE_KEY = 'medvibe_university';

export function CurriculumProvider({ children }: { children: React.ReactNode }) {
  const [university, setUniversityState] = useState<University | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = universities.find(u => u.id === saved);
      if (found) setUniversityState(found);
    }
  }, []);

  const setUniversity = (id: string | null) => {
    if (!id) {
      localStorage.removeItem(STORAGE_KEY);
      setUniversityState(null);
      return;
    }
    const found = universities.find(u => u.id === id);
    if (found) {
      localStorage.setItem(STORAGE_KEY, id);
      setUniversityState(found);
    }
  };

  const getEmphasis = (subject: string, chapter: string): CurriculumEmphasis | null => {
    if (!university) return null;
    return curriculumEmphasis.find(
      e => e.universityId === university.id && e.subject === subject && e.chapter === chapter
    ) || null;
  };

  return (
    <CurriculumContext.Provider value={{ university, setUniversity, getEmphasis }}>
      {children}
    </CurriculumContext.Provider>
  );
}

export const useCurriculum = () => useContext(CurriculumContext);
