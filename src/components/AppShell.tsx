'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCurriculum } from '@/context/CurriculumContext';

// Mobile bottom nav — 5 items maximum for comfort
const mobileNav = [
  { href: '/dashboard', icon: '🏠', label: 'Начало' },
  { href: '/study',     icon: '📖', label: 'Конспект' },
  { href: '/quiz',      icon: '🧪', label: 'Тест' },
  { href: '/games',     icon: '🎮', label: 'Игри' },
  { href: '/profile',   icon: '👤', label: 'Профил' },
];

// Desktop sidebar — full list
const sidebarNav = [
  { href: '/dashboard', icon: '🏠', label: 'Начало' },
  { href: '/study',     icon: '📖', label: 'Конспект' },
  { href: '/quiz',      icon: '🧪', label: 'Тест' },
  { href: '/games',     icon: '🎮', label: 'Игри' },
  { href: '/subjects',  icon: '📚', label: 'Предмети' },
  { href: '/profile',   icon: '👤', label: 'Профил' },
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
        <div className="text-5xl animate-bounce">🩺</div>
      </div>
    );
  }

  if (!user) return null;

  const xpInLevel = profile ? profile.xp % 100 : 0;

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));

  return (
    <div className={`min-h-screen flex ${t.bg}`}>

      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className={`hidden md:flex flex-col w-64 fixed h-full z-40 ${t.sidebar}`}>
        {/* Logo */}
        <div className="p-6 pb-4 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🩺</span>
            <span className={`text-xl font-black ${mode === 'soft' ? 'shimmer-text' : 'sharp-shimmer-text'}`}>
              MedVibe
            </span>
          </Link>
        </div>

        {/* User card */}
        <div className={`mx-4 mb-4 p-4 rounded-2xl ${t.card} flex-shrink-0`}>
          <div className={`font-bold text-sm truncate ${t.heading}`}>
            {profile?.displayName || 'Студент'}
          </div>
          <div className={`text-xs ${t.textMuted} mb-2`}>
            Ниво {profile?.level || 1} · {profile?.xp || 0} XP
          </div>
          <div className={`h-1.5 rounded-full ${t.progressBg}`}>
            <div
              className={`h-1.5 rounded-full bg-gradient-to-r ${t.xpBar} transition-all`}
              style={{ width: `${xpInLevel}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className={`text-xs ${t.textMuted}`}>{xpInLevel}/100 XP</span>
            {(profile?.streak ?? 0) > 0 && (
              <span className="text-xs">🔥 {profile?.streak}</span>
            )}
          </div>
          {/* University badge */}
          {university ? (
            <Link
              href="/study"
              className={`mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r ${university.gradient} text-white w-full no-min-h`}
            >
              <span>{university.emoji}</span>
              <span className="truncate">{university.shortName}</span>
            </Link>
          ) : (
            <Link
              href="/study"
              className={`mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold w-full no-min-h ${
                mode === 'soft' ? 'bg-pink-50 text-pink-500' : 'bg-gray-700 text-gray-300'
              } hover:opacity-80`}
            >
              <span>🏫</span>
              <span>Избери университет</span>
            </Link>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {sidebarNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                isActive(item.href)
                  ? `${t.primary} text-white shadow-md`
                  : `${t.text} hover:bg-white/10`
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-6 min-w-0 overflow-x-hidden">
        {children}
      </main>

      {/* ── Mobile Bottom Nav ────────────────────────────────── */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t ${t.nav}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {mobileNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all relative ${
                active ? t.primaryText : t.textMuted
              }`}
            >
              {/* Active pill */}
              {active && (
                <span
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r ${t.xpBar}`}
                />
              )}
              <span
                className={`text-xl transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}
              >
                {item.icon}
              </span>
              <span className={`text-[10px] font-semibold tracking-tight leading-tight ${active ? t.primaryText : t.textMuted}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
