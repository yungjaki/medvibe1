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
        <h1 className={`text-3xl font-black mb-8 ${t.heading}`}>Профил 👤</h1>

        {/* User card */}
        <div className={`rounded-3xl p-6 mb-6 ${t.card}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${t.xpBar} flex items-center justify-center text-2xl font-black text-white`}>
              {profile?.displayName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className={`text-xl font-black ${t.heading}`}>{profile?.displayName}</h2>
              <p className={`text-sm ${t.textMuted}`}>{profile?.email}</p>
              {profile?.isPremium && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${mode === 'soft' ? 'bg-purple-100 text-purple-600' : 'bg-cyan-900/50 text-cyan-400'}`}>
                  ⭐ Premium
                </span>
              )}
            </div>
          </div>

          {/* XP */}
          <div className={`rounded-2xl p-4 ${mode === 'soft' ? 'bg-pink-50' : 'bg-gray-800'}`}>
            <div className="flex justify-between mb-2">
              <span className={`text-sm font-bold ${t.heading}`}>Ниво {profile?.level || 1}</span>
              <span className={`text-sm ${t.primaryText} font-bold`}>⚡ {profile?.xp || 0} XP</span>
            </div>
            <div className={`h-3 rounded-full ${t.progressBg}`}>
              <div className={`h-3 rounded-full bg-gradient-to-r ${t.xpBar} transition-all`} style={{ width: `${xpInLevel}%` }} />
            </div>
            <p className={`text-xs mt-1 ${t.textMuted}`}>{xpInLevel}/100 XP до Ниво {(profile?.level || 1) + 1}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { label: 'Серия', value: profile?.streak || 0, suffix: '🔥' },
            { label: 'Отговор.', value: totalCompleted, suffix: '✅' },
            { label: 'Напредък', value: `${Math.round((totalCompleted / totalQ) * 100)}%`, suffix: '📈' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-3 text-center ${t.card}`}>
              <div className={`text-xl font-black ${t.heading}`}>{s.value}</div>
              <div className={`text-[11px] ${t.textMuted} mt-0.5`}>{s.suffix} {s.label}</div>
            </div>
          ))}
        </div>

        {/* Subject progress */}
        <div className={`rounded-3xl p-5 mb-6 ${t.card}`}>
          <h3 className={`font-bold mb-4 ${t.heading}`}>Напредък по предмети</h3>
          <div className="space-y-3">
            {subjects.map(s => {
              const qs = questions.filter(q => q.subject === s.id);
              const done = profile?.completedQuizzes?.filter(id => qs.find(q => q.id === id)).length || 0;
              const pct = qs.length > 0 ? Math.round((done / qs.length) * 100) : 0;
              return (
                <div key={s.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={t.text}>{s.emoji} {s.name}</span>
                    <span className={t.primaryText}>{done}/{qs.length}</span>
                  </div>
                  <div className={`h-2 rounded-full ${t.progressBg}`}>
                    <div className={`h-2 rounded-full bg-gradient-to-r ${s.color}`} style={{ width: `${pct}%` }} />
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

        {/* Premium section */}
        {!profile?.isPremium && (
          <div id="premium" className={`rounded-3xl overflow-hidden mb-6`}>
            <div className={`p-6 bg-gradient-to-br ${mode === 'soft' ? 'from-pink-400 to-purple-500' : 'from-cyan-500 to-blue-700'} text-white`}>
              <h3 className="text-xl font-black mb-1">⭐ Вземи Premium</h3>
              <p className="text-white/80 text-sm mb-4">Пълен достъп до всички функции</p>
              <ul className="space-y-2 text-sm mb-5">
                {['Неограничени въпроси', 'AI обяснения', 'Симулация на изпит', 'Детайлна статистика'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span>✅</span> {f}
                  </li>
                ))}
              </ul>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-black">€9</span>
                <span className="text-white/60 pb-1">/месец</span>
              </div>
              <button className="w-full py-3 rounded-xl bg-white font-bold text-purple-600 hover:bg-gray-100 transition-all hover:scale-105">
                Абонирай се сега
              </button>
            </div>
          </div>
        )}

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
