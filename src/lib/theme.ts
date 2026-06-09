export type ThemeMode = 'soft' | 'sharp';

export const themes = {
  soft: {
    name: 'Soft Mode',
    emoji: '💅',
    tagline: "You're doing amazing!",
    // Backgrounds
    bg: 'bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50',
    card: 'bg-white/85 backdrop-blur-sm border border-pink-100/80 shadow-xl shadow-pink-100/50',
    cardHover: 'hover:bg-white/95 hover:border-pink-200/80 hover:shadow-pink-200/50 hover:shadow-xl transition-all duration-200',
    // Primary
    primary: 'bg-gradient-to-r from-pink-500 to-purple-500',
    primaryHover: 'hover:from-pink-600 hover:to-purple-600',
    primaryText: 'text-pink-500',
    primaryBorder: 'border-pink-200',
    // Secondary
    secondary: 'bg-pink-50',
    secondaryText: 'text-purple-600',
    accent: 'bg-gradient-to-r from-purple-400 to-pink-400',
    // Text
    text: 'text-gray-700',
    textMuted: 'text-gray-400',
    heading: 'text-gray-800',
    // Nav
    nav: 'bg-white/85 backdrop-blur-xl border-t border-pink-100/80',
    sidebar: 'bg-white/90 backdrop-blur-xl border-r border-pink-100/80 shadow-xl shadow-pink-100/20',
    // Buttons
    button: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-200/50 hover:shadow-pink-300/60 hover:scale-105',
    buttonSecondary: 'bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100',
    // UI Elements
    badge: 'bg-pink-100 text-pink-600',
    progress: 'bg-gradient-to-r from-pink-400 to-purple-400',
    progressBg: 'bg-pink-100',
    xpBar: 'from-pink-400 to-purple-500',
    icon: 'text-pink-400',
    shadow: 'shadow-pink-100',
    streakColor: 'text-orange-400',
    // Feedback
    correct: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
    wrong: 'bg-red-50 border border-red-200 text-red-600',
    // Misc
    gameCard: 'bg-gradient-to-br from-pink-100 to-purple-100',
    inputBg: 'bg-white/80 border-pink-200 focus:border-pink-400 focus:ring-pink-200',
    // Brain / Neuro tokens
    brainAccent: '#a855f7',
    brainCard: 'bg-white/85 backdrop-blur-sm border border-purple-100/80 shadow-xl shadow-purple-100/40',
    brainGlow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    latinBadge: 'bg-purple-100 text-purple-600 border border-purple-200 text-[10px] font-black px-2 py-0.5 rounded-full',
    motivational: [
      'Ти се справяш невероятно! 💖',
      'Продължавай! Страхотна си! ✨',
      'Ти си суперзвезда! 🌟',
      'Отлична работа! 💅',
      'Горда съм от теб! 🎀',
      'Невроните ти работят на максимум! 🧠',
      'Всяка синапса свети! ⚡',
      'Мозъкът ти е невероятен! 💜',
    ],
  },
  sharp: {
    name: 'Sharp Mode',
    emoji: '🖤',
    tagline: 'No excuses. Just neurons firing.',
    // Backgrounds
    bg: 'bg-[#06080d]',
    card: 'bg-white/[0.05] backdrop-blur-xl border border-violet-500/10 shadow-2xl',
    cardHover: 'hover:bg-white/[0.08] hover:border-violet-500/25 hover:shadow-violet-500/10 hover:shadow-2xl transition-all duration-200',
    // Primary
    primary: 'bg-gradient-to-r from-violet-600 via-cyan-500 to-blue-600',
    primaryHover: 'hover:from-violet-500 hover:via-cyan-400 hover:to-blue-500',
    primaryText: 'text-cyan-400',
    primaryBorder: 'border-cyan-800/50',
    // Secondary
    secondary: 'bg-white/[0.06]',
    secondaryText: 'text-cyan-400',
    accent: 'bg-gradient-to-r from-violet-600 to-cyan-500',
    // Text
    text: 'text-gray-300',
    textMuted: 'text-gray-600',
    heading: 'text-white',
    // Nav
    nav: 'bg-[#06080d]/90 backdrop-blur-xl border-t border-white/[0.06]',
    sidebar: 'bg-[#06080d]/95 backdrop-blur-xl border-r border-white/[0.06]',
    // Buttons
    button: 'bg-gradient-to-r from-violet-600 via-cyan-500 to-blue-600 text-white shadow-lg shadow-violet-900/40 hover:shadow-violet-800/60 hover:scale-105',
    buttonSecondary: 'bg-white/[0.06] text-cyan-400 border border-white/[0.08] hover:bg-white/[0.1]',
    // UI Elements
    badge: 'bg-white/[0.08] text-cyan-400',
    progress: 'bg-gradient-to-r from-violet-600 via-cyan-500 to-blue-600',
    progressBg: 'bg-white/[0.06]',
    xpBar: 'from-violet-600 to-cyan-500',
    icon: 'text-cyan-400',
    shadow: 'shadow-black/50',
    streakColor: 'text-orange-400',
    // Feedback
    correct: 'bg-emerald-950/60 border border-emerald-700/50 text-emerald-400',
    wrong: 'bg-red-950/60 border border-red-800/50 text-red-400',
    // Misc
    gameCard: 'bg-white/[0.04] border border-violet-900/30',
    inputBg: 'bg-white/[0.06] border-white/[0.08] focus:border-violet-500 focus:ring-violet-900',
    // Brain / Neuro tokens
    brainAccent: '#7c3aed',
    brainCard: 'bg-white/[0.05] backdrop-blur-xl border border-violet-500/10 shadow-[0_0_30px_rgba(124,58,237,0.3)]',
    brainGlow: 'shadow-[0_0_30px_rgba(124,58,237,0.3)]',
    latinBadge: 'bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-black px-2 py-0.5 rounded-full',
    motivational: [
      'Концентрирай се.',
      'Без оправдания.',
      'Работата се върши сега.',
      'Фокус. Издръжливост. Победа.',
      'Ти знаеш материала. Докажи го.',
      'Невроните стрелят. Ти печелиш.',
      'Синапсите горят. Продължавай.',
      'Мозъкът се изгражда под натиск.',
    ],
  },
} as const;

// Extra named colour tokens (usable in non-Tailwind contexts)
export const colors = {
  brain: '#a855f7',
  brainViolet: '#7c3aed',
  electricViolet: '#7c3aed',
  neonCyan: '#06b6d4',
} as const;
