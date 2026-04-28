'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { subjects, questions } from '@/lib/data/questions';

export default function SubjectsPage() {
  const { t } = useTheme();
  const { profile } = useAuth();

  const subjectData = subjects.map(s => {
    const qs = questions.filter(q => q.subject === s.id);
    const completed = profile?.completedQuizzes?.filter(id =>
      qs.find(q => q.id === id)
    ).length || 0;
    const pct = qs.length > 0 ? Math.round((completed / qs.length) * 100) : 0;
    return { ...s, totalQ: qs.length, completed, pct };
  });

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-black ${t.heading}`}>Предмети 📚</h1>
          <p className={`mt-1 ${t.textMuted}`}>Избери предмет и започни да учиш</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjectData.map(s => (
            <Link key={s.id} href={`/subjects/${s.id}`} className={`group rounded-3xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl ${t.card}`}>
              {/* Gradient header */}
              <div className={`bg-gradient-to-r ${s.color} p-6 flex items-center gap-4`}>
                <span className="text-5xl">{s.emoji}</span>
                <div>
                  <h2 className="text-2xl font-black text-white">{s.name}</h2>
                  <p className="text-white/80 text-sm">{s.description}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-sm ${t.textMuted}`}>{s.completed}/{s.totalQ} въпроса</span>
                  <span className={`font-bold text-sm ${t.primaryText}`}>{s.pct}%</span>
                </div>
                <div className={`h-2 rounded-full ${t.progressBg} mb-4`}>
                  <div className={`h-2 rounded-full bg-gradient-to-r ${s.color} transition-all`} style={{ width: `${s.pct}%` }} />
                </div>

                {/* Topics */}
                <div className="flex flex-wrap gap-2">
                  {s.topics.map(topic => (
                    <span key={topic} className={`text-xs px-3 py-1 rounded-full ${t.badge}`}>{topic}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
