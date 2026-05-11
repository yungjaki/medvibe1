'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useCurriculum } from '@/context/CurriculumContext';
import { questions, subjects } from '@/lib/data/questions';
import { universities } from '@/lib/data/curriculum';

export default function ProfilePage() {
  const { t, mode, setMode } = useTheme();
  const { profile, logout } = useAuth();
  const { university, setUniversity } = useCurriculum();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const totalCompleted = profile?.completedQuizzes?.length || 0;
  const totalQ = questions.length;
  const xpInLevel = profile ? profile.xp % 100 : 0;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero card */}
        <div className={`relative rounded-3xl overflow-hidden mb-6 animate-slide-up ${
          mode === 'soft'
            ? 'bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500'
            : 'bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800'
        }`}>
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20 blur-2xl bg-white" />
          <div className="relative z-10 p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-2xl font-black text-white shadow-xl">
                {profile?.displayName?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-black text-white truncate">{profile?.displayName}</h2>
                <p className="text-white/60 text-sm truncate">{profile?.email}</p>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-lg font-black text-white">{profile?.level || 1}</span>
                  <span className="text-white/60 text-[9px] font-semibold uppercase">Ниво</span>
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5 text-xs text-white/70">
                <span>⚡ {profile?.xp || 0} XP</span>
                <span>{xpInLevel}/100 до Ниво {(profile?.level || 1) + 1}</span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-2 rounded-full bg-white/80 transition-all duration-700 progress-shine" style={{ width: `${xpInLevel}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6 stagger-children">
          {[
            { label: 'Серия', value: `${profile?.streak || 0}д`, icon: '🔥', gradient: 'from-orange-400 to-red-500' },
            { label: 'Отговорени', value: totalCompleted, icon: '✅', gradient: 'from-emerald-400 to-teal-500' },
            { label: 'Напредък', value: `${Math.round((totalCompleted / Math.max(totalQ,1)) * 100)}%`, icon: '📈', gradient: 'from-violet-400 to-purple-500' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-3 text-center ${t.card}`}>
              <div className={`text-xl font-black bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent leading-tight`}>{s.value}</div>
              <div className={`text-[10px] mt-0.5 ${t.textMuted} leading-tight`}>{s.icon} {s.label}</div>
            </div>
          ))}
        </div>

        {/* Subject progress */}
        <div className={`rounded-3xl p-5 mb-6 ${t.card}`}>
          <h3 className={`font-bold mb-4 ${t.heading}`}>📊 Напредък по предмети</h3>
          <div className="space-y-4">
            {subjects.map(s => {
              const qs = questions.filter(q => q.subject === s.id);
              const done = profile?.completedQuizzes?.filter(id => qs.find(q => q.id === id)).length || 0;
              const pct = qs.length > 0 ? Math.round((done / qs.length) * 100) : 0;
              return (
                <div key={s.id}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-base flex-shrink-0`}>
                      {s.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-semibold ${t.heading} truncate`}>{s.name}</span>
                        <span className={`text-xs font-bold ${t.primaryText} ml-2 flex-shrink-0`}>{done}/{qs.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`h-2 rounded-full ${t.progressBg} overflow-hidden`}>
                    <div className={`h-2 rounded-full bg-gradient-to-r ${s.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Theme toggle */}
        <div className={`rounded-3xl p-5 mb-6 ${t.card}`}>
          <h3 className={`font-bold mb-4 ${t.heading}`}>Твоят стил ✨</h3>
          <div className={`flex rounded-2xl p-1 gap-1 ${mode === 'soft' ? 'bg-pink-100' : 'bg-gray-800'}`}>
            <button
              onClick={() => setMode('soft')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                mode === 'soft'
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md'
                  : 'text-gray-400 hover:text-pink-400'
              }`}
            >
              💅 Soft Mode
            </button>
            <button
              onClick={() => setMode('sharp')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                mode === 'sharp'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-cyan-400'
              }`}
            >
              🖤 Sharp Mode
            </button>
          </div>
          <p className={`text-xs mt-3 text-center ${t.textMuted}`}>
            {mode === 'soft' ? '💅 Пастелни цветове, сладки икони, "Ти се справяш отлично!"' : '🖤 Тъмен интерфейс, неон, "Фокус. Без оправдания."'}
          </p>
        </div>

        {/* University selector */}
        <div className={`rounded-3xl p-5 mb-6 ${t.card}`}>
          <h3 className={`font-bold mb-1 ${t.heading}`}>🏫 Твоят университет</h3>
          <p className={`text-xs ${t.textMuted} mb-4`}>Конспектът се адаптира към учебната програма на твоя университет.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {universities.map(u => (
              <button
                key={u.id}
                onClick={() => setUniversity(university?.id === u.id ? null : u.id)}
                className={`p-3 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] border-2 ${
                  university?.id === u.id
                    ? `bg-gradient-to-r ${u.gradient} text-white border-transparent shadow-md`
                    : `${t.card} ${t.text} border-transparent ${t.cardHover}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{u.emoji}</span>
                  <div>
                    <div className={`font-bold text-sm ${university?.id === u.id ? 'text-white' : t.heading}`}>{u.shortName}</div>
                    <div className={`text-xs ${university?.id === u.id ? 'text-white/70' : t.textMuted}`}>{u.city}</div>
                  </div>
                  {university?.id === u.id && <span className="ml-auto text-white font-bold">✓</span>}
                </div>
              </button>
            ))}
          </div>
          {university && (
            <div className={`mt-3 p-3 rounded-xl bg-gradient-to-r ${university.gradient} text-white text-xs`}>
              <div className="font-bold mb-1">{university.name}</div>
              <div className="opacity-75">{university.description}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {university.emphasis.map(e => (
                  <span key={e} className="px-2 py-0.5 rounded-full bg-white/20 font-medium">{e}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className={`rounded-3xl p-5 ${t.card}`}>
          {!showLogoutConfirm ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className={`w-full py-3 rounded-xl font-bold text-red-500 border-2 border-red-200 hover:bg-red-50 transition-all`}
            >
              Изход от профила
            </button>
          ) : (
            <div className="text-center">
              <p className={`mb-4 font-medium ${t.text}`}>Сигурен ли си?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutConfirm(false)} className={`flex-1 py-3 rounded-xl font-bold ${t.buttonSecondary}`}>
                  Отказ
                </button>
                <button onClick={handleLogout} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-all">
                  Да, изход
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
