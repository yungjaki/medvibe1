'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { subjects, questions } from '@/lib/data/questions';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { t, mode } = useTheme();

  const motivational = useMemo(() => {
    const msgs = t.motivational;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }, [t]);

  const xpInLevel = profile ? profile.xp % 100 : 0;
  const totalQuestions = questions.length;
  const completedCount = profile?.completedQuizzes?.length || 0;

  const subjectProgress = subjects.map(s => {
    const total = questions.filter(q => q.subject === s.id).length;
    const completed = profile?.completedQuizzes?.filter(id =>
      questions.find(q => q.id === id && q.subject === s.id)
    ).length || 0;
    return { ...s, total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  });

  const stats = [
    { label: 'XP точки', value: profile?.xp || 0, icon: '⚡', gradient: mode === 'soft' ? 'from-pink-400 to-purple-400' : 'from-cyan-500 to-blue-600', suffix: '' },
    { label: 'Серия', value: profile?.streak || 0, icon: '🔥', gradient: 'from-orange-400 to-red-400', suffix: ' дни' },
    { label: 'Ниво', value: profile?.level || 1, icon: '🏆', gradient: 'from-yellow-400 to-orange-400', suffix: '' },
    { label: 'Отговорени', value: completedCount, icon: '✅', gradient: 'from-green-400 to-teal-400', suffix: '' },
  ];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className={`text-3xl font-black ${t.heading}`}>
            Здравей, {profile?.displayName?.split(' ')[0] || 'Студент'}! 👋
          </h1>
          <p className={`mt-1 text-base ${t.textMuted}`}>{motivational}</p>
        </div>

        {/* XP Progress bar */}
        <div className={`rounded-2xl p-5 mb-6 ${t.card}`}>
          <div className="flex justify-between items-center mb-3 gap-2">
            <div className="min-w-0">
              <span className={`font-bold text-sm ${t.heading}`}>Ниво {profile?.level || 1}</span>
              <span className={`ml-2 text-xs ${t.textMuted} hidden sm:inline`}>{xpInLevel}/100 XP до следващото ниво</span>
              <span className={`ml-1 text-xs ${t.textMuted} sm:hidden`}>{xpInLevel}/100 XP</span>
            </div>
            <div className={`text-sm font-bold ${t.primaryText} whitespace-nowrap flex-shrink-0`}>⚡ {profile?.xp || 0} XP</div>
          </div>
          <div className={`h-3 rounded-full ${t.progressBg}`}>
            <div
              className={`h-3 rounded-full bg-gradient-to-r ${t.xpBar} transition-all duration-500`}
              style={{ width: `${xpInLevel}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(stat => (
            <div key={stat.label} className={`rounded-2xl p-4 ${t.card}`}>
              <div className={`text-2xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.value}{stat.suffix}
              </div>
              <div className={`text-xs mt-0.5 ${t.textMuted}`}>{stat.icon} {stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/quiz" className={`rounded-2xl p-5 transition-all hover:scale-105 active:scale-95 ${mode === 'soft' ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white shadow-lg shadow-pink-200/50' : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-900/30'}`}>
            <div className="text-3xl mb-2">🧪</div>
            <div className="font-bold">Бърз тест</div>
            <div className="text-sm opacity-80">10 въпроса, 5 мин</div>
          </Link>
          <Link href="/games" className={`rounded-2xl p-5 transition-all hover:scale-105 active:scale-95 ${t.card} ${t.cardHover}`}>
            <div className="text-3xl mb-2">🎮</div>
            <div className={`font-bold ${t.heading}`}>Игри</div>
            <div className={`text-sm ${t.textMuted}`}>Учи играейки</div>
          </Link>
          <Link href="/subjects" className={`rounded-2xl p-5 transition-all hover:scale-105 active:scale-95 ${t.card} ${t.cardHover}`}>
            <div className="text-3xl mb-2">📚</div>
            <div className={`font-bold ${t.heading}`}>Предмети</div>
            <div className={`text-sm ${t.textMuted}`}>Прегледай материала</div>
          </Link>
        </div>

        {/* Subject progress */}
        <div className="mb-4">
          <h2 className={`text-xl font-bold mb-4 ${t.heading}`}>Твоят напредък 📊</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjectProgress.map(s => (
              <Link key={s.id} href={`/subjects/${s.id}`} className={`rounded-2xl p-5 transition-all hover:scale-[1.02] ${t.card} ${t.cardHover}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{s.emoji}</span>
                  <div>
                    <div className={`font-bold ${t.heading}`}>{s.name}</div>
                    <div className={`text-xs ${t.textMuted}`}>{s.completed}/{s.total} въпроса</div>
                  </div>
                  <div className={`ml-auto text-sm font-bold ${t.primaryText}`}>{s.pct}%</div>
                </div>
                <div className={`h-2 rounded-full ${t.progressBg}`}>
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${s.color} transition-all duration-500`}
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Overall progress */}
        <div className={`rounded-2xl p-5 ${t.card}`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`font-bold text-sm ${t.heading}`}>Общ напредък</span>
            <span className={`text-sm font-bold ${t.primaryText}`}>{completedCount}/{totalQuestions}</span>
          </div>
          <div className={`h-3 rounded-full ${t.progressBg}`}>
            <div
              className={`h-3 rounded-full bg-gradient-to-r ${t.xpBar}`}
              style={{ width: `${Math.round((completedCount / totalQuestions) * 100)}%` }}
            />
          </div>
          <p className={`text-xs mt-2 ${t.textMuted}`}>
            {completedCount === 0
              ? 'Стартирай с първия тест! 🚀'
              : completedCount === totalQuestions
              ? 'Отговорил си на всички въпроси! 🎉'
              : `Остават ${totalQuestions - completedCount} въпроса`}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
