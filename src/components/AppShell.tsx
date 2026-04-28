'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCurriculum } from '@/context/CurriculumContext';

const navItems = [
  { href: '/dashboard', icon: '🏠', label: 'Начало' },
  { href: '/study', icon: '📖', label: 'Конспект' },
  { href: '/quiz', icon: '🧪', label: 'Тест' },
  { href: '/games', icon: '🎮', label: 'Игри' },
  { href: '/subjects', icon: '📚', label: 'Предмети' },
  { href: '/profile', icon: '👤', label: 'Профил' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const { t, mode } = useTheme();
  const { university } = useCurriculum();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${t.bg}`}>
        <div className="text-4xl animate-bounce">🩺</div>
      </div>
    );
  }

  if (!user) return null;

  const xpInLevel = profile ? profile.xp % 100 : 0;

  return (
    <div className={`min-h-screen flex ${t.bg}`}>
      {/* Sidebar (desktop) */}
      <aside className={`hidden md:flex flex-col w-64 fixed h-full z-40 ${t.sidebar}`}>
        {/* Logo */}
        <div className="p-6 pb-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🩺</span>
            <span className={`text-xl font-black ${mode === 'soft' ? 'shimmer-text' : 'sharp-shimmer-text'}`}>MedVibe</span>
          </Link>
        </div>

        {/* User info */}
        <div className={`mx-4 mb-4 p-4 rounded-2xl ${t.card}`}>
          <div className={`font-bold text-sm ${t.heading}`}>{profile?.displayName || 'Студент'}</div>
          <div className={`text-xs ${t.textMuted} mb-2`}>Ниво {profile?.level || 1} • {profile?.xp || 0} XP</div>
          <div className={`h-1.5 rounded-full ${t.progressBg}`}>
            <div className={`h-1.5 rounded-full bg-gradient-to-r ${t.xpBar} transition-all`} style={{ width: `${xpInLevel}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className={`text-xs ${t.textMuted}`}>{xpInLevel}/100 XP</span>
            {(profile?.streak ?? 0) > 0 && <span className="text-xs">🔥 {profile?.streak}</span>}
          </div>
          {university ? (
            <Link href="/study" className={`mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r ${university.gradient} text-white w-full`}>
              <span>{university.emoji}</span>
              <span className="truncate">{university.shortName}</span>
            </Link>
          ) : (
            <Link href="/study" className={`mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold w-full ${mode === 'soft' ? 'bg-pink-50 text-pink-500' : 'bg-gray-700 text-gray-300'} hover:opacity-80`}>
              <span>🏫</span>
              <span>Избери университет</span>
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? `${t.primary} text-white shadow-md`
                    : `${t.text} hover:bg-white/10`
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Premium badge */}
        {!profile?.isPremium && (
          <div className="p-4">
            <Link href="/profile#premium" className={`block p-4 rounded-2xl text-center text-sm font-semibold transition-all hover:scale-105 ${t.primary} text-white shadow-lg`}>
              ⭐ Вземи Premium<br />
              <span className="text-xs font-normal opacity-80">Пълен достъп за €9/мес</span>
            </Link>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t ${t.nav}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-all ${
                isActive ? t.primaryText : t.textMuted
              }`}
            >
              <span className={`text-lg ${isActive ? 'scale-110' : ''} transition-transform`}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
