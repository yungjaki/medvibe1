'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCurriculum } from '@/context/CurriculumContext';
import { subjects, questions } from '@/lib/data/questions';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { t, mode } = useTheme();
  const { university } = useCurriculum();

  const motivational = useMemo(() => {
    const msgs = t.motivational;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }, [t]);

  const xpInLevel = profile ? profile.xp % 100 : 0;
  const totalQuestions = questions.length;
  const completedCount = profile?.completedQuizzes?.length || 0;
  const overallPct = Math.round((completedCount / totalQuestions) * 100);

  const subjectProgress = subjects.map(s => {
    const total = questions.filter(q => q.subject === s.id).length;
    const completed = profile?.completedQuizzes?.filter(id =>
      questions.find(q => q.id === id && q.subject === s.id)
    ).length || 0;
    return { ...s, total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  });

  const stats = [
    { label: 'XP точки',   value: profile?.xp || 0,           icon: '⚡', gradient: t.xpBar },
    { label: 'Серия',      value: `${profile?.streak || 0}д`, icon: '🔥', gradient: 'from-orange-400 to-red-500' },
    { label: 'Ниво',       value: profile?.level || 1,         icon: '🏆', gradient: 'from-yellow-400 to-orange-500' },
    { label: 'Отговорени', value: completedCount,              icon: '✅', gradient: 'from-emerald-400 to-teal-500' },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Добро утро';
    if (h < 18) return 'Добър ден';
    return 'Добър вечер';
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">

        {/* ── Hero greeting ─────────────────────────────────────── */}
        <div className={`relative rounded-3xl overflow-hidden mb-6 animate-slide-up ${
          mode === 'soft'
            ? 'bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500'
            : 'bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800'
        }`}>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-3xl bg-white" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-15 blur-2xl bg-white" />
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-sm font-medium mb-1">{greeting()},</p>
                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  {profile?.displayName?.split(' ')[0] || 'Студент'} 👋
                </h1>
                <p className="text-white/75 text-sm mt-2 leading-relaxed max-w-xs">{motivational}</p>
                {university && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold">
                    <span>{university.emoji}</span>
                    <span>{university.shortName}</span>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex flex-col items-center justify-center shadow-xl">
                  <span className="text-xl md:text-2xl font-black text-white">{profile?.level || 1}</span>
                  <span className="text-white/70 text-[10px] font-semibold uppercase tracking-wide">Ниво</span>
                </div>
                {overallPct > 0 && (
                  <div className="mt-2 text-white/70 text-xs font-medium">{overallPct}% готов</div>
                )}
              </div>
            </div>
            <div className="mt-5">
              <div className="flex justify-between mb-1.5 text-xs text-white/70 font-medium">
                <span>⚡ {profile?.xp || 0} XP</span>
                <span>{xpInLevel}/100 до Ниво {(profile?.level || 1) + 1}</span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-white/80 transition-all duration-700 progress-shine"
                  style={{ width: `${xpInLevel}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2 md:gap-3 mb-6 stagger-children">
          {stats.map(stat => (
            <div key={stat.label} className={`rounded-2xl p-3 md:p-4 text-center ${t.card}`}>
              <div className={`text-lg md:text-2xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent leading-tight`}>
                {stat.value}
              </div>
              <div className={`text-[10px] md:text-xs mt-0.5 ${t.textMuted} leading-tight`}>
                {stat.icon} {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick actions ──────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Link
            href="/quiz"
            className={`group rounded-2xl p-4 md:p-5 transition-all hover:scale-[1.03] active:scale-[0.97] animate-slide-up ${
              mode === 'soft'
                ? 'bg-gradient-to-br from-pink-400 to-purple-500 shadow-lg shadow-pink-200/50'
                : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-900/40'
            }`}
          >
            <div className="text-2xl md:text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">🧪</div>
            <div className="font-black text-white text-sm md:text-base">Бърз тест</div>
            <div className="text-white/70 text-xs mt-0.5 hidden md:block">10 въпроса · 5 мин</div>
          </Link>
          <Link
            href="/games"
            className={`group rounded-2xl p-4 md:p-5 transition-all hover:scale-[1.03] active:scale-[0.97] animate-slide-up ${t.card} ${t.cardHover}`}
            style={{ animationDelay: '0.05s' }}
          >
            <div className="text-2xl md:text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">🎮</div>
            <div className={`font-black text-sm md:text-base ${t.heading}`}>Игри</div>
            <div className={`text-xs mt-0.5 hidden md:block ${t.textMuted}`}>Учи играейки</div>
          </Link>
          <Link
            href="/study"
            className={`group rounded-2xl p-4 md:p-5 transition-all hover:scale-[1.03] active:scale-[0.97] animate-slide-up ${t.card} ${t.cardHover}`}
            style={{ animationDelay: '0.1s' }}
          >
            <div className="text-2xl md:text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">📖</div>
            <div className={`font-black text-sm md:text-base ${t.heading}`}>Конспект</div>
            <div className={`text-xs mt-0.5 hidden md:block ${t.textMuted}`}>Теория и таблици</div>
          </Link>
        </div>

        {/* ── Subject progress ───────────────────────────────────── */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg md:text-xl font-black ${t.heading}`}>Твоят напредък 📊</h2>
            <Link href="/subjects" className={`text-sm font-semibold ${t.primaryText} hover:opacity-80 transition-opacity`}>
              Всички →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjectProgress.map((s, i) => (
              <Link
                key={s.id}
                href={`/subjects/${s.id}`}
                className={`rounded-2xl p-4 md:p-5 transition-all hover:scale-[1.02] active:scale-[0.99] animate-slide-up ${t.card} ${t.cardHover}`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl shadow-sm flex-shrink-0`}>
                    {s.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`font-black text-sm md:text-base ${t.heading} truncate`}>{s.name}</div>
                    <div className={`text-xs ${t.textMuted}`}>{s.completed}/{s.total} въпроса</div>
                  </div>
                  <div className={`text-sm font-black ${t.primaryText} flex-shrink-0`}>{s.pct}%</div>
                </div>
                <div className={`h-2 rounded-full ${t.progressBg} overflow-hidden`}>
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${s.color} transition-all duration-700`}
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Overall progress ────────────────────────────────────── */}
        <div className={`rounded-2xl p-4 md:p-5 animate-slide-up ${t.card}`} style={{ animationDelay: '0.3s' }}>
          <div className="flex justify-between items-center mb-2">
            <span className={`font-black text-sm ${t.heading}`}>Общ напредък</span>
            <span className={`text-sm font-black ${t.primaryText}`}>{completedCount}/{totalQuestions}</span>
          </div>
          <div className={`h-3 rounded-full ${t.progressBg} overflow-hidden`}>
            <div
              className={`h-3 rounded-full bg-gradient-to-r ${t.xpBar} transition-all duration-700 progress-shine`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className={`text-xs mt-2 ${t.textMuted}`}>
            {completedCount === 0
              ? '🚀 Стартирай с първия тест!'
              : completedCount === totalQuestions
              ? '🎉 Отговорил си на всички въпроси!'
              : `Остават ${totalQuestions - completedCount} въпроса до 100%`}
          </p>
        </div>

      </div>
    </AppShell>
  );
}
