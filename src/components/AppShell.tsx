'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCurriculum } from '@/context/CurriculumContext';

const mobileNav = [
  { href: '/dashboard', icon: '🏠', label: 'Начало' },
  { href: '/study',     icon: '📖', label: 'Конспект' },
  { href: '/quiz',      icon: '🧪', label: 'Тест' },
  { href: '/anatomy',   icon: '🦴', label: '3D Атлас' },
  { href: '/profile',   icon: '👤', label: 'Профил' },
];

const sidebarNav = [
  { href: '/dashboard', icon: '🏠', label: 'Начало' },
  { href: '/study',     icon: '📖', label: 'Конспект' },
  { href: '/quiz',      icon: '🧪', label: 'Тест' },
  { href: '/games',     icon: '🎮', label: 'Игри' },
  { href: '/anatomy',   icon: '🦴', label: '3D Атлас' },
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
        <div className="flex flex-col items-center gap-4">
          <div className="text-5xl animate-float">🩺</div>
          <div className={`text-sm font-medium ${t.textMuted}`}>Зареждане...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const xpInLevel = profile ? profile.xp % 100 : 0;

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));

  return (
    <div className={`min-h-screen flex ${t.bg}`}>

      {/* ── Desktop Sidebar ───────────────────────────────────────── */}
      <aside className={`hidden md:flex flex-col w-64 fixed h-full z-40 ${t.sidebar}`}>

        {/* Logo */}
        <div className="p-6 pb-4 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
              mode === 'soft'
                ? 'bg-gradient-to-br from-pink-400 to-purple-500 shadow-lg shadow-pink-200/50'
                : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-900/50'
            }`}>
              🩺
            </div>
            <span className={`text-xl font-black ${mode === 'soft' ? 'shimmer-text' : 'sharp-shimmer-text'}`}>
              MedVibe
            </span>
          </Link>
        </div>

        {/* User card */}
        <div className={`mx-3 mb-4 p-4 rounded-2xl flex-shrink-0 ${
          mode === 'soft'
            ? 'bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100/80'
            : 'bg-white/[0.04] border border-white/[0.07]'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0 ${
              mode === 'soft'
                ? 'bg-gradient-to-br from-pink-400 to-purple-500'
                : 'bg-gradient-to-br from-cyan-500 to-blue-600'
            }`}>
              {profile?.displayName?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <div className={`font-bold text-sm truncate ${t.heading}`}>
                {profile?.displayName || 'Студент'}
              </div>
              <div className={`text-xs ${t.textMuted}`}>
                Ниво {profile?.level || 1}
              </div>
            </div>
            {(profile?.streak ?? 0) > 0 && (
              <span className="ml-auto text-sm flex-shrink-0">🔥 {profile?.streak}</span>
            )}
          </div>

          {/* XP bar */}
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span className={`text-xs ${t.textMuted}`}>{xpInLevel}/100 XP</span>
              <span className={`text-xs font-bold ${t.primaryText}`}>⚡ {profile?.xp || 0}</span>
            </div>
            <div className={`h-1.5 rounded-full ${t.progressBg} overflow-hidden`}>
              <div
                className={`h-1.5 rounded-full bg-gradient-to-r ${t.xpBar} transition-all duration-700 progress-shine`}
                style={{ width: `${xpInLevel}%` }}
              />
            </div>
          </div>

          {/* University badge */}
          {university ? (
            <Link
              href="/study"
              className={`mt-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r ${university.gradient} text-white w-full no-min-h transition-all hover:opacity-90 hover:scale-[1.02]`}
            >
              <span>{university.emoji}</span>
              <span className="truncate">{university.shortName}</span>
            </Link>
          ) : (
            <Link
              href="/study"
              className={`mt-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-semibold w-full no-min-h transition-all hover:opacity-80 ${
                mode === 'soft' ? 'bg-pink-100 text-pink-500' : 'bg-white/[0.06] text-gray-400'
              }`}
            >
              <span>🏫</span>
              <span>Избери университет</span>
            </Link>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {sidebarNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 relative group ${
                  active
                    ? mode === 'soft'
                      ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-lg shadow-pink-200/40'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-900/30'
                    : mode === 'soft'
                    ? `${t.text} hover:bg-pink-50/80`
                    : `${t.text} hover:bg-white/[0.05]`
                }`}
              >
                <span className={`text-lg transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {active && (
                  <span className={`ml-auto w-1.5 h-1.5 rounded-full ${mode === 'soft' ? 'bg-white/60' : 'bg-cyan-300/60'}`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom tagline */}
        <div className="p-4 flex-shrink-0">
          <p className={`text-xs text-center ${t.textMuted} font-medium`}>
            {mode === 'soft' ? '💖 Учи с любов' : '⚡ Учи. Печели. Доминирай.'}
          </p>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-8 min-w-0 overflow-x-hidden">
        {children}
      </main>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────── */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 ${t.nav}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch">
          {mobileNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-all duration-200 ${
                  active ? t.primaryText : t.textMuted
                }`}
              >
                {/* Active glow pill at top */}
                {active && (
                  <span
                    className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-gradient-to-r ${t.xpBar} animate-nav-pop`}
                  />
                )}
                {/* Active bg */}
                {active && (
                  <span className={`absolute inset-1 rounded-xl opacity-10 bg-gradient-to-b ${t.xpBar}`} />
                )}
                <span className={`text-[22px] leading-none transition-all duration-200 ${active ? 'scale-115' : 'scale-100'}`}
                  style={{ transform: active ? 'scale(1.15) translateY(-1px)' : 'scale(1)' }}
                >
                  {item.icon}
                </span>
                <span className={`text-[10px] font-semibold tracking-tight leading-none ${active ? t.primaryText : t.textMuted}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
