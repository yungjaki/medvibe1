'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useTheme } from '@/context/ThemeContext';
import { useCurriculum } from '@/context/CurriculumContext';
import { studyContent, StudyBlock } from '@/lib/data/studyContent';

type Props = { params: Promise<{ subject: string; chapter: string }> };

function BlockRenderer({ block, mode }: { block: StudyBlock; mode: 'soft' | 'sharp' }) {
  const { t } = useTheme();

  switch (block.type) {
    case 'text':
      return <p className={`text-sm leading-relaxed ${t.text}`}>{block.text}</p>;

    case 'keypoints':
      return (
        <ul className="space-y-2">
          {block.points.map((p, i) => (
            <li key={i} className={`flex gap-2 text-sm leading-relaxed ${t.text}`}>
              <span className={`mt-0.5 text-base flex-shrink-0 ${mode === 'soft' ? 'text-pink-400' : 'text-cyan-400'}`}>◆</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      );

    case 'table':
      return (
        <div className="overflow-x-auto -mx-1">
          {block.title && <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${t.textMuted}`}>{block.title}</p>}
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th
                    key={i}
                    className={`px-3 py-2 text-left font-bold rounded-tl ${
                      mode === 'soft' ? 'bg-pink-50 text-pink-700' : 'bg-gray-800 text-cyan-400'
                    } first:rounded-tl last:rounded-tr`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className={`border-t ${mode === 'soft' ? 'border-pink-100' : 'border-gray-700'}`}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-3 py-2 leading-snug ${
                        ci === 0
                          ? `font-semibold ${mode === 'soft' ? 'text-pink-600' : 'text-cyan-300'}`
                          : t.text
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'mnemonic':
      return (
        <div className={`rounded-2xl px-4 py-3 flex gap-3 ${
          mode === 'soft' ? 'bg-purple-50 border border-purple-200' : 'bg-violet-900/30 border border-violet-700'
        }`}>
          <span className="text-xl flex-shrink-0">🧠</span>
          <div>
            <p className={`text-sm font-black ${mode === 'soft' ? 'text-purple-700' : 'text-violet-300'}`}>
              {block.text}
            </p>
            <p className={`text-xs mt-1 leading-relaxed ${mode === 'soft' ? 'text-purple-500' : 'text-violet-400'}`}>
              {block.meaning}
            </p>
          </div>
        </div>
      );

    case 'clinical':
      return (
        <div className={`rounded-2xl px-4 py-3 flex gap-3 ${
          mode === 'soft' ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900/30 border border-blue-700'
        }`}>
          <span className="text-xl flex-shrink-0">🏥</span>
          <p className={`text-sm leading-relaxed ${mode === 'soft' ? 'text-blue-700' : 'text-blue-300'}`}>
            <span className="font-bold">Клинично: </span>{block.text}
          </p>
        </div>
      );

    case 'examtip':
      return (
        <div className={`rounded-2xl px-4 py-3 flex gap-3 ${
          mode === 'soft' ? 'bg-amber-50 border border-amber-200' : 'bg-yellow-900/30 border border-yellow-700'
        }`}>
          <span className="text-xl flex-shrink-0">⭐</span>
          <p className={`text-sm leading-relaxed ${mode === 'soft' ? 'text-amber-700' : 'text-yellow-300'}`}>
            <span className="font-bold">Изпитен съвет: </span>{block.text}
          </p>
        </div>
      );

    case 'warning':
      return (
        <div className={`rounded-2xl px-4 py-3 flex gap-3 ${
          mode === 'soft' ? 'bg-red-50 border border-red-200' : 'bg-red-900/30 border border-red-700'
        }`}>
          <span className="text-xl flex-shrink-0">⚠️</span>
          <p className={`text-sm leading-relaxed ${mode === 'soft' ? 'text-red-700' : 'text-red-300'}`}>
            <span className="font-bold">Внимание: </span>{block.text}
          </p>
        </div>
      );

    default:
      return null;
  }
}

export default function ChapterPage({ params }: Props) {
  const { subject, chapter: chapterId } = use(params);
  const { t, mode } = useTheme();
  const { university, getEmphasis } = useCurriculum();
  const router = useRouter();
  const [openSection, setOpenSection] = useState<number | null>(0);

  const subjectContent = studyContent.find(sc => sc.subject === subject);
  const chapter = subjectContent?.chapters.find(c => c.id === chapterId);

  if (!chapter) {
    router.push('/study');
    return null;
  }

  const emphasis = getEmphasis(subject, chapterId);

  const chapterIndex = subjectContent!.chapters.findIndex(c => c.id === chapterId);
  const prevChapter = chapterIndex > 0 ? subjectContent!.chapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < subjectContent!.chapters.length - 1 ? subjectContent!.chapters[chapterIndex + 1] : null;

  const subjectLabels: Record<string, string> = {
    anatomy: 'Анатомия',
    histology: 'Хистология',
    biology: 'Биология',
    chemistry: 'Химия',
  };

  return (
    <AppShell>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @keyframes expandDown { from{opacity:0;max-height:0} to{opacity:1;max-height:2000px} }
        .anim-up { animation: slideUp .35s ease-out both; }
        .anim-expand { animation: expandDown .3s ease-out both; }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className={`flex items-center gap-2 text-sm mb-6 ${t.textMuted}`}>
          <Link href="/study" className="hover:underline">Конспект</Link>
          <span>›</span>
          <Link href={`/study?subject=${subject}`} className="hover:underline capitalize">{subjectLabels[subject]}</Link>
          <span>›</span>
          <span className={t.text}>{chapter.title}</span>
        </div>

        {/* Chapter header */}
        <div className={`rounded-3xl overflow-hidden mb-6 anim-up`}>
          <div className={`bg-gradient-to-r ${chapter.color} p-7`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-5xl">{chapter.icon}</span>
              {emphasis && (
                <div className={`text-right`}>
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                    emphasis.examWeight === 'high' ? 'bg-white/30 text-white' : 'bg-white/20 text-white/80'
                  }`}>
                    {emphasis.examWeight === 'high' ? '🔥 Висока тежест' : '📌 Средна тежест'}
                  </span>
                  {university && (
                    <div className="text-white/60 text-xs mt-1">{university.shortName}</div>
                  )}
                </div>
              )}
            </div>
            <h1 className="text-2xl font-black text-white">{chapter.title}</h1>
            <p className="text-white/75 text-sm mt-1">{chapter.summary}</p>
          </div>

          {/* University-specific exam note */}
          {emphasis && (
            <div className={`px-6 py-4 ${mode === 'soft' ? 'bg-amber-50' : 'bg-yellow-900/20'} border-b ${mode === 'soft' ? 'border-amber-200' : 'border-yellow-700/50'}`}>
              <div className="flex gap-3">
                <span className="text-xl flex-shrink-0">📌</span>
                <div>
                  <p className={`text-xs font-bold mb-1 ${mode === 'soft' ? 'text-amber-700' : 'text-yellow-400'}`}>
                    {university?.shortName} — Конспект
                  </p>
                  <p className={`text-sm ${mode === 'soft' ? 'text-amber-600' : 'text-yellow-300'}`}>
                    {emphasis.notes}
                  </p>
                  {emphasis.specificTopics && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {emphasis.specificTopics.map(tp => (
                        <span key={tp} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          mode === 'soft' ? 'bg-amber-200 text-amber-700' : 'bg-yellow-800/50 text-yellow-300'
                        }`}>{tp}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className={`px-6 py-4 flex gap-6 ${t.card}`}>
            <div className="text-center">
              <div className={`text-xl font-black ${t.heading}`}>{chapter.sections.length}</div>
              <div className={`text-xs ${t.textMuted}`}>Секции</div>
            </div>
            {chapter.relatedQuestions && (
              <div className="text-center">
                <div className={`text-xl font-black ${t.heading}`}>{chapter.relatedQuestions.length}</div>
                <div className={`text-xs ${t.textMuted}`}>Въпроса</div>
              </div>
            )}
            <div className="ml-auto flex items-center">
              {chapter.relatedQuestions && (
                <Link
                  href={`/quiz?subject=${subject}`}
                  className={`text-sm font-bold px-4 py-2 rounded-xl text-white bg-gradient-to-r ${chapter.color} transition-all hover:scale-105 shadow-sm`}
                >
                  🧪 Тест по темата
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Sections — accordion */}
        <div className="space-y-3 mb-8">
          {chapter.sections.map((section, si) => {
            const isOpen = openSection === si;
            return (
              <div key={si} className={`rounded-2xl overflow-hidden ${t.card} anim-up`} style={{ animationDelay: `${si * 0.07}s` }}>
                <button
                  onClick={() => setOpenSection(isOpen ? null : si)}
                  className={`w-full flex items-center justify-between px-5 py-4 text-left transition-all ${t.cardHover}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      isOpen
                        ? `bg-gradient-to-br ${chapter.color} text-white`
                        : `${mode === 'soft' ? 'bg-pink-100 text-pink-500' : 'bg-gray-700 text-gray-300'}`
                    }`}>
                      {si + 1}
                    </span>
                    <span className={`font-bold text-sm ${t.heading}`}>{section.title}</span>
                  </div>
                  <span className={`text-lg transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${t.textMuted}`}>
                    ▾
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 space-y-4 anim-expand">
                    <div className={`h-px ${mode === 'soft' ? 'bg-pink-100' : 'bg-gray-700'} mb-4`} />
                    {section.blocks.map((block, bi) => (
                      <div key={bi}>
                        <BlockRenderer block={block} mode={mode} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Prev / Next chapter navigation */}
        <div className="flex gap-3">
          {prevChapter ? (
            <Link
              href={`/study/${subject}/${prevChapter.id}`}
              className={`flex-1 p-4 rounded-2xl text-left transition-all hover:scale-[1.02] ${t.card} ${t.cardHover}`}
            >
              <div className={`text-xs mb-1 ${t.textMuted}`}>← Предишна</div>
              <div className={`font-bold text-sm ${t.heading}`}>{prevChapter.icon} {prevChapter.title}</div>
            </Link>
          ) : <div className="flex-1" />}

          {nextChapter ? (
            <Link
              href={`/study/${subject}/${nextChapter.id}`}
              className={`flex-1 p-4 rounded-2xl text-right transition-all hover:scale-[1.02] ${t.card} ${t.cardHover}`}
            >
              <div className={`text-xs mb-1 ${t.textMuted}`}>Следваща →</div>
              <div className={`font-bold text-sm ${t.heading}`}>{nextChapter.icon} {nextChapter.title}</div>
            </Link>
          ) : (
            <Link
              href="/study"
              className={`flex-1 p-4 rounded-2xl text-right transition-all hover:scale-[1.02] ${t.card} ${t.cardHover}`}
            >
              <div className={`text-xs mb-1 ${t.textMuted}`}>Обратно</div>
              <div className={`font-bold text-sm ${t.heading}`}>📖 Конспект</div>
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}
