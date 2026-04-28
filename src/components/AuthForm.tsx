'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  mode: 'login' | 'register';
};

export default function AuthForm({ mode }: Props) {
  const { login, register } = useAuth();
  const { t } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Грешка. Опитай пак.';
      if (msg.includes('email-already-in-use')) setError('Този имейл вече е регистриран.');
      else if (msg.includes('wrong-password') || msg.includes('invalid-credential')) setError('Грешен имейл или парола.');
      else if (msg.includes('weak-password')) setError('Паролата трябва да е поне 6 знака.');
      else setError('Нещо се обърка. Опитай пак.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${t.bg}`}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">🩺</span>
            <span className={`text-2xl font-black shimmer-text`}>MedVibe</span>
          </Link>
          <h1 className={`text-2xl font-bold ${t.heading}`}>
            {mode === 'login' ? 'Добре дошъл обратно 👋' : 'Присъедини се 🎉'}
          </h1>
          <p className={`text-sm mt-1 ${t.textMuted}`}>
            {mode === 'login' ? 'Продължи да учиш откъдето спря' : 'Безплатно. Без карта. Веднага.'}
          </p>
        </div>

        {/* Card */}
        <div className={`rounded-3xl p-8 shadow-xl ${t.card}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${t.text}`}>Ime</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Иванка / Иван"
                  required
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${t.inputBg} ${t.text} focus:ring-2`}
                />
              </div>
            )}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${t.text}`}>Имейл</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ivan@med.bg"
                required
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${t.inputBg} ${t.text} focus:ring-2`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${t.text}`}>Парола</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Минимум 6 знака"
                required
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${t.inputBg} ${t.text} focus:ring-2`}
              />
            </div>

            {error && (
              <div className={`text-sm px-4 py-3 rounded-xl border ${t.wrong}`}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${t.primary}`}
            >
              {loading ? '...' : mode === 'login' ? 'Влез в профила си' : 'Създай профил безплатно'}
            </button>
          </form>

          <div className={`mt-6 text-center text-sm ${t.textMuted}`}>
            {mode === 'login' ? (
              <>Нямаш профил?{' '}
                <Link href="/auth/register" className={`font-semibold ${t.primaryText} hover:underline`}>
                  Регистрирай се
                </Link>
              </>
            ) : (
              <>Вече имаш профил?{' '}
                <Link href="/auth/login" className={`font-semibold ${t.primaryText} hover:underline`}>
                  Влез
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
