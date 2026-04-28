'use client';

import { useState } from 'react';
import Link from 'next/link';

type PreviewMode = 'soft' | 'sharp';

export default function LandingPage() {
  const [preview, setPreview] = useState<PreviewMode>('soft');

  const isSoft = preview === 'soft';

  return (
    <div className={`min-h-screen transition-all duration-700 ${isSoft ? 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50' : 'bg-gray-950'}`}>
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-500 ${isSoft ? 'bg-white/70 backdrop-blur-md border-b border-pink-100' : 'bg-gray-950/80 backdrop-blur-md border-b border-gray-800'}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🩺</span>
          <span className={`text-xl font-bold ${isSoft ? 'shimmer-text' : 'sharp-shimmer-text'}`}>MedVibe</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className={`text-sm font-medium px-4 py-2 rounded-full transition-all ${isSoft ? 'text-gray-600 hover:text-pink-500' : 'text-gray-400 hover:text-cyan-400'}`}>
            Вход
          </Link>
          <Link href="/auth/register" className={`text-sm font-semibold px-5 py-2 rounded-full transition-all hover:scale-105 ${isSoft ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md shadow-pink-200' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-900/30'}`}>
            Регистрация
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${isSoft ? 'bg-pink-100 text-pink-600' : 'bg-gray-800 text-cyan-400 border border-gray-700'}`}>
          <span>🇧🇬</span> За медицински студенти в България
        </div>

        <h1 className={`text-5xl md:text-7xl font-black mb-6 leading-tight ${isSoft ? 'text-gray-800' : 'text-white'}`}>
          Учи медицина.{' '}
          <span className={isSoft ? 'shimmer-text' : 'sharp-shimmer-text'}>
            Усети разликата.
          </span>
        </h1>

        <p className={`text-xl mb-10 max-w-2xl mx-auto leading-relaxed ${isSoft ? 'text-gray-500' : 'text-gray-400'}`}>
          Анатомия, Хистология, Биология, Химия — всичко на едно място.
          Тестове, игри, XP система и твоят собствен стил.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/auth/register" className={`px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-xl ${isSoft ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-pink-200' : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-900/40'}`}>
            Започни безплатно →
          </Link>
          <button
            onClick={() => setPreview(isSoft ? 'sharp' : 'soft')}
            className={`px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 border-2 ${isSoft ? 'border-pink-200 text-pink-500 bg-white/80 hover:bg-pink-50' : 'border-gray-700 text-cyan-400 bg-gray-900 hover:bg-gray-800'}`}
          >
            {isSoft ? '🖤 Виж Sharp Mode' : '💅 Виж Soft Mode'}
          </button>
        </div>

        {/* Theme toggle preview */}
        <div className={`inline-flex rounded-full p-1 gap-1 ${isSoft ? 'bg-pink-100' : 'bg-gray-800'}`}>
          <button
            onClick={() => setPreview('soft')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${preview === 'soft' ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md' : isSoft ? 'text-gray-400 hover:text-pink-500' : 'text-gray-400 hover:text-pink-400'}`}
          >
            💅 Soft Mode
          </button>
          <button
            onClick={() => setPreview('sharp')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${preview === 'sharp' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : isSoft ? 'text-gray-400 hover:text-cyan-500' : 'text-gray-400 hover:text-cyan-400'}`}
          >
            🖤 Sharp Mode
          </button>
        </div>
      </section>

      {/* Mock Dashboard Preview */}
      <section className="px-6 max-w-5xl mx-auto mb-20">
        <div className={`rounded-3xl overflow-hidden shadow-2xl border transition-all duration-500 ${isSoft ? 'border-pink-100 shadow-pink-100/50' : 'border-gray-800 shadow-gray-900'}`}>
          {/* Mock nav bar */}
          <div className={`px-6 py-4 flex items-center gap-3 ${isSoft ? 'bg-white/90' : 'bg-gray-900'}`}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className={`flex-1 mx-4 h-6 rounded-full text-xs flex items-center px-4 ${isSoft ? 'bg-gray-100 text-gray-400' : 'bg-gray-800 text-gray-500'}`}>
              medvibe.bg/dashboard
            </div>
          </div>
          {/* Mock content */}
          <div className={`p-6 ${isSoft ? 'bg-gradient-to-br from-pink-50 to-purple-50' : 'bg-gray-950'}`}>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { icon: '⚡', label: 'XP', value: '2,450', color: isSoft ? 'from-pink-400 to-purple-400' : 'from-cyan-500 to-blue-600' },
                { icon: '🔥', label: 'Серия', value: '7 дни', color: isSoft ? 'from-orange-300 to-red-300' : 'from-orange-500 to-red-600' },
                { icon: '🏆', label: 'Ниво', value: 'Мед. 5', color: isSoft ? 'from-yellow-300 to-orange-300' : 'from-yellow-500 to-orange-500' },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-2xl p-4 ${isSoft ? 'bg-white/80 border border-pink-100' : 'bg-gray-900 border border-gray-800'}`}>
                  <div className={`text-2xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</div>
                  <div className={`text-xs mt-1 ${isSoft ? 'text-gray-400' : 'text-gray-500'}`}>{stat.icon} {stat.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { emoji: '🦴', name: 'Анатомия', progress: 65, color: 'from-red-400 to-orange-400' },
                { emoji: '🔬', name: 'Хистология', progress: 40, color: 'from-purple-400 to-pink-400' },
                { emoji: '🧬', name: 'Биология', progress: 80, color: 'from-green-400 to-teal-400' },
                { emoji: '⚗️', name: 'Химия', progress: 30, color: 'from-blue-400 to-cyan-400' },
              ].map((subj) => (
                <div key={subj.name} className={`rounded-2xl p-4 ${isSoft ? 'bg-white/80 border border-pink-100' : 'bg-gray-900 border border-gray-800'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{subj.emoji}</span>
                    <span className={`font-semibold text-sm ${isSoft ? 'text-gray-700' : 'text-gray-300'}`}>{subj.name}</span>
                  </div>
                  <div className={`h-2 rounded-full ${isSoft ? 'bg-gray-100' : 'bg-gray-800'}`}>
                    <div className={`h-2 rounded-full bg-gradient-to-r ${subj.color} transition-all`} style={{ width: `${subj.progress}%` }} />
                  </div>
                  <div className={`text-xs mt-1 ${isSoft ? 'text-gray-400' : 'text-gray-500'}`}>{subj.progress}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 max-w-5xl mx-auto mb-20">
        <h2 className={`text-3xl font-black text-center mb-12 ${isSoft ? 'text-gray-800' : 'text-white'}`}>
          Всичко, което ти трябва {isSoft ? '✨' : '⚡'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '📚', title: 'Предметни модули', desc: 'Анатомия, Хистология, Биология, Химия — структурирано и ясно' },
            { icon: '🧪', title: 'Изпитен режим', desc: 'MCQ тестове с таймер, точкуване и анализ на слабите места' },
            { icon: '🎮', title: 'Мини игри', desc: '"Познай структурата", "Бърз кръг", "Свържи термините"' },
            { icon: '📈', title: 'XP система', desc: 'Ниво нагоре с всеки тест. Серии за ежедневно учене.' },
            { icon: '💅', title: 'Твоят стил', desc: 'Soft Mode (пастелно, сладко) или Sharp Mode (тъмно, неон)' },
            { icon: '🤖', title: 'AI обяснения', desc: 'Защо сбърка? Claude ти обяснява подробно. (Premium)' },
          ].map((f) => (
            <div key={f.title} className={`rounded-2xl p-6 transition-all hover:scale-105 ${isSoft ? 'bg-white/70 border border-pink-100 hover:border-pink-200 hover:shadow-lg hover:shadow-pink-100/50' : 'bg-gray-900 border border-gray-800 hover:border-cyan-900 hover:shadow-lg hover:shadow-cyan-900/20'}`}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className={`font-bold mb-2 ${isSoft ? 'text-gray-800' : 'text-white'}`}>{f.title}</h3>
              <p className={`text-sm leading-relaxed ${isSoft ? 'text-gray-500' : 'text-gray-400'}`}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 max-w-4xl mx-auto mb-20">
        <h2 className={`text-3xl font-black text-center mb-12 ${isSoft ? 'text-gray-800' : 'text-white'}`}>
          Прости цени {isSoft ? '💸' : '💰'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free */}
          <div className={`rounded-3xl p-8 border-2 transition-all ${isSoft ? 'bg-white/70 border-pink-100' : 'bg-gray-900 border-gray-800'}`}>
            <div className={`text-sm font-bold uppercase tracking-wider mb-2 ${isSoft ? 'text-pink-400' : 'text-cyan-400'}`}>Безплатен</div>
            <div className={`text-5xl font-black mb-1 ${isSoft ? 'text-gray-800' : 'text-white'}`}>€0</div>
            <div className={`text-sm mb-6 ${isSoft ? 'text-gray-400' : 'text-gray-500'}`}>завинаги безплатен</div>
            <ul className={`space-y-3 text-sm mb-8 ${isSoft ? 'text-gray-600' : 'text-gray-400'}`}>
              {['✅ 20 въпроса / ден', '✅ 2 предмета', '✅ Базови игри', '✅ XP & нива', '❌ AI обяснения', '❌ Пълен въпросник'].map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link href="/auth/register" className={`block text-center py-3 rounded-full font-bold transition-all hover:scale-105 ${isSoft ? 'bg-pink-50 text-pink-500 border-2 border-pink-200 hover:bg-pink-100' : 'bg-gray-800 text-cyan-400 border-2 border-gray-700 hover:bg-gray-700'}`}>
              Започни сега
            </Link>
          </div>

          {/* Premium */}
          <div className={`rounded-3xl p-8 border-2 relative overflow-hidden transition-all ${isSoft ? 'bg-gradient-to-br from-pink-400 to-purple-500 border-transparent text-white' : 'bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border-cyan-700 text-white'}`}>
            <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">ПОПУЛЯРЕН</div>
            <div className="text-sm font-bold uppercase tracking-wider mb-2 text-white/80">Premium</div>
            <div className="text-5xl font-black mb-1">€9</div>
            <div className="text-sm mb-6 text-white/60">на месец</div>
            <ul className="space-y-3 text-sm mb-8 text-white/90">
              {['✅ Неограничени въпроси', '✅ Всички 4 предмета', '✅ Всички игри', '✅ AI обяснения', '✅ Симулация на изпит', '✅ Детайлна статистика'].map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link href="/auth/register?plan=premium" className="block text-center py-3 rounded-full font-bold bg-white hover:bg-gray-100 transition-all hover:scale-105 text-purple-600">
              Вземи Premium
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`px-6 py-8 text-center border-t ${isSoft ? 'border-pink-100 text-gray-400' : 'border-gray-800 text-gray-600'}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xl">🩺</span>
          <span className={`font-bold ${isSoft ? 'text-gray-600' : 'text-gray-400'}`}>MedVibe</span>
        </div>
        <p className="text-sm">Направено с ❤️ за медицински студенти в България</p>
      </footer>
    </div>
  );
}
