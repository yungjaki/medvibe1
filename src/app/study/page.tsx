'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useTheme } from '@/context/ThemeContext';
import { useCurriculum } from '@/context/CurriculumContext';
import { studyContent } from '@/lib/data/studyContent';
import { subjects } from '@/lib/data/questions';
import { universities } from '@/lib/data/curriculum';
import { curriculumEmphasis } from '@/lib/data/curriculum';

const subjectMeta = {
  anatomy:   { label: 'Анатомия',    emoji: '🦴', gradient: 'from-red-400 to-orange-500' },
  histology: { label: 'Хистология', emoji: '🔬', gradient: 'from-purple-400 to-pink-500' },
  biology:   { label: 'Биология',   emoji: '🧬', gradient: 'from-green-400 to-teal-500'  },
  chemistry: { label: 'Химия',      emoji: '⚗️', gradient: 'from-blue-400 to-cyan-500'   },
} as const;

export default function StudyPage() {
  const { t, mode } = useTheme();
  const { university, setUniversity } = useCurriculum();
  const [showPicker, setShowPicker] = useState(false);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const allSubjects = (['anatomy', 'histology', 'biology', 'chemistry'] as const);

  // Count high-emphasis chapters for current university
  const emphasisCount = university
    ? curriculumEmphasis.filter(e => e.universityId === university.id && e.examWeight === 'high').length
    : 0;

  return (
    <AppShell>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes popIn { 0%{transform:scale(.85);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        .anim-up { animation: slideUp .35s ease-out both; }
        .anim-pop { animation: popIn .4s cubic-bezier(.34,1.56,.64,1) both; }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-black ${t.heading}`}>Конспект 📖</h1>
            <p className={`mt-1 text-sm ${t.textMuted}`}>Теория, таблици и мнемоники — всичко на едно място</p>
          </div>
          <button
            onClick={() => setShowPicker(v => !v)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl font-semibold text-sm transition-all hover:scale-105 flex-shrink-0 ${
              university
                ? `bg-gradient-to-r ${university.gradient} text-white shadow-lg`
                : `${t.card} ${t.text} ${t.cardHover}`
            }`}
          >
            <span>{university ? university.emoji : '🏫'}</span>
            <span className="max-w-[100px] truncate">{university ? university.shortName : 'Университет'}</span>
            <span>▾</span>
          </button>
        </div>

        {/* University picker */}
        {showPicker && (
          <div className={`rounded-3xl p-5 mb-6 ${t.card} anim-pop shadow-xl`}>
            <h3 className={`font-bold mb-4 ${t.heading}`}>🏫 Твоят университет</h3>
            <p className={`text-sm ${t.textMuted} mb-4`}>
              Изборът на университет показва специфичните акценти в конспекта — кои теми са с по-голяма тежест на изпита.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {universities.map((u, i) => (
                <button
                  key={u.id}
                  onClick={() => { setUniversity(u.id); setShowPicker(false); }}
                  className={`p-4 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] anim-up border-2 ${
                    university?.id === u.id
                      ? `bg-gradient-to-r ${u.gradient} text-white border-transparent shadow-lg`
                      : `${t.card} ${t.text} border-transparent ${t.cardHover}`
                  }`}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{u.emoji}</span>
                    <div>
                      <div className={`font-bold text-sm ${university?.id === u.id ? 'text-white' : t.heading}`}>
                        {u.shortName}
                      </div>
                      <div className={`text-xs mt-0.5 ${university?.id === u.id ? 'text-white/70' : t.textMuted}`}>
                        {u.city} · {u.founded}
                      </div>
                    </div>
                    {university?.id === u.id && <span className="ml-auto text-white text-lg">✓</span>}
                  </div>
                  {university?.id !== u.id && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {u.emphasis.slice(0, 2).map(e => (
                        <span key={e} className={`text-xs px-2 py-0.5 rounded-full ${t.badge}`}>{e}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
              {university && (
                <button
                  onClick={() => { setUniversity(null); setShowPicker(false); }}
                  className={`p-4 rounded-2xl text-left transition-all border-2 border-dashed ${t.card} ${t.textMuted} ${t.cardHover}`}
                >
                  <span className="text-sm">✕ Изчисти избора</span>
                </button>
              )}
            </div>

            {/* University detail when selected */}
            {university && (
              <div className={`mt-4 p-4 rounded-2xl bg-gradient-to-r ${university.gradient} text-white`}>
                <div className="font-bold mb-1">{university.name}</div>
                <div className="text-sm text-white/80 mb-3">{university.description}</div>
                <div className="text-xs font-bold text-white/70 mb-2">АКЦЕНТ ВЪРХУ:</div>
                <div className="flex flex-wrap gap-2">
                  {university.emphasis.map(e => (
                    <span key={e} className="text-xs px-3 py-1 rounded-full bg-white/20 font-medium">{e}</span>
                  ))}
                </div>
                {university.atlasUsed && (
                  <div className="text-xs mt-2 text-white/60">📚 Атлас: {university.atlasUsed}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* University emphasis banner */}
        {university && !showPicker && (
          <div className={`rounded-2xl px-4 py-3 mb-6 bg-gradient-to-r ${university.gradient} text-white flex items-center gap-2 anim-up`}>
            <span className="text-xl flex-shrink-0">{university.emoji}</span>
            <div className="flex-1 min-w-0 overflow-hidden">
              <span className="font-bold text-sm">{university.shortName}</span>
              <span className="text-white/70 text-xs ml-1.5 hidden sm:inline">— {emphasisCount} теми с висока тежест</span>
              <span className="text-white/70 text-xs ml-1.5 sm:hidden">· {emphasisCount} важни теми</span>
            </div>
            <button onClick={() => setShowPicker(true)} className="text-xs text-white/70 hover:text-white flex-shrink-0 whitespace-nowrap">Смени ▸</button>
          </div>
        )}

        {/* Subject filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveSubject(null)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              activeSubject === null
                ? `${t.primary} text-white shadow-md`
                : `${t.card} ${t.text} ${t.cardHover}`
            }`}
          >
            Всички
          </button>
          {allSubjects.map(s => {
            const meta = subjectMeta[s];
            return (
              <button
                key={s}
                onClick={() => setActiveSubject(activeSubject === s ? null : s)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 ${
                  activeSubject === s
                    ? `bg-gradient-to-r ${meta.gradient} text-white shadow-md`
                    : `${t.card} ${t.text} ${t.cardHover}`
                }`}
              >
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>

        {/* Chapter cards */}
        {allSubjects
          .filter(s => activeSubject === null || s === activeSubject)
          .map(subjectId => {
            const content = studyContent.find(sc => sc.subject === subjectId);
            if (!content) return null;
            const meta = subjectMeta[subjectId];

            return (
              <div key={subjectId} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-xl`}>
                    {meta.emoji}
                  </div>
                  <h2 className={`text-xl font-black ${t.heading}`}>{meta.label}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-1 ${t.badge}`}>{content.chapters.length} глави</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {content.chapters.map((chapter, i) => {
                    const emphasis = university
                      ? curriculumEmphasis.find(
                          e => e.universityId === university.id &&
                               e.subject === subjectId &&
                               e.chapter === chapter.id
                        )
                      : null;

                    return (
                      <Link
                        key={chapter.id}
                        href={`/study/${subjectId}/${chapter.id}`}
                        className={`group rounded-3xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.99] ${t.card} anim-up`}
                        style={{ animationDelay: `${i * 0.06}s` }}
                      >
                        {/* Gradient top strip */}
                        <div className={`bg-gradient-to-r ${chapter.color} px-5 pt-5 pb-4`}>
                          <div className="flex items-start justify-between">
                            <span className="text-3xl">{chapter.icon}</span>
                            {emphasis && (
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                emphasis.examWeight === 'high'
                                  ? 'bg-white/30 text-white'
                                  : 'bg-white/20 text-white/80'
                              }`}>
                                {emphasis.examWeight === 'high' ? '🔥 Важно' : '📌 Среден'}
                              </span>
                            )}
                          </div>
                          <h3 className="font-black text-white mt-2">{chapter.title}</h3>
                          <p className="text-white/75 text-xs mt-1 line-clamp-2">{chapter.summary}</p>
                        </div>

                        {/* Stats */}
                        <div className={`px-5 py-3 flex items-center gap-3`}>
                          <span className={`text-xs ${t.textMuted}`}>{chapter.sections.length} секции</span>
                          {chapter.relatedQuestions && (
                            <span className={`text-xs ${t.textMuted}`}>· {chapter.relatedQuestions.length} въпроса</span>
                          )}
                          {emphasis?.examWeight === 'high' && (
                            <span className={`text-xs ml-auto font-bold ${t.primaryText} truncate`}>
                              {university?.shortName}
                            </span>
                          )}
                          <span className={`ml-auto text-lg ${t.textMuted} group-hover:translate-x-1 transition-transform`}>→</span>
                        </div>

                        {/* University exam note */}
                        {emphasis && (
                          <div className={`px-5 pb-4`}>
                            <p className={`text-xs leading-relaxed italic ${t.textMuted} border-t pt-2 ${t.primaryBorder}`}>
                              📌 {emphasis.notes}
                            </p>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </AppShell>
  );
}
