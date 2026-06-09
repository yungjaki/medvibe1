'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { questions as baseQuestions, subjects, Question } from '@/lib/data/questions';
import { brainQuestions } from '@/lib/data/brainQuestions';

// Merge all questions (base + brain)
const questions = [...baseQuestions, ...brainQuestions];

type Phase = 'setup' | 'quiz' | 'results';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Confetti particle for results screen
function Confetti() {
  const colors = ['#f472b6', '#a78bfa', '#34d399', '#60a5fa', '#fbbf24', '#fb7185'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            background: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            animation: `fall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 1}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          to { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in { animation: slideIn 0.35s ease-out both; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .animate-pop-in { animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      `}</style>
    </div>
  );
}

function QuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, mode } = useTheme();
  const { profile, updateXP, updateStreak } = useAuth();

  const preSubject = searchParams.get('subject') || '';
  const [phase, setPhase] = useState<Phase>(preSubject ? 'quiz' : 'setup');
  const [selectedSubject, setSelectedSubject] = useState(preSubject || 'all');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(300);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<{ question: Question; chosen: number; correct: boolean }[]>([]);
  const [timeLeft, setTimeLeft] = useState(300);
  const [timerActive, setTimerActive] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const buildQuiz = useCallback(() => {
    let pool = questions.filter(q => {
      if (selectedSubject !== 'all' && q.subject !== selectedSubject) return false;
      return true;
    });
    pool = shuffle(pool).slice(0, questionCount);
    setQuizQuestions(pool);
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setAnswers([]);
    setTimeLeft(timeLimit);
    setTimerActive(true);
    setQuestionKey(k => k + 1);
    setPhase('quiz');
  }, [selectedSubject, questionCount, timeLimit]);

  useEffect(() => {
    if (preSubject && phase === 'quiz' && quizQuestions.length === 0) {
      buildQuiz();
    }
  }, [preSubject, phase, quizQuestions.length, buildQuiz]);

  // Timer
  useEffect(() => {
    if (!timerActive || phase !== 'quiz') return;
    if (timeLeft <= 0) {
      setTimerActive(false);
      finishQuiz();
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  });

  const finishQuiz = useCallback(async () => {
    setTimerActive(false);
    setPhase('results');
    const currentAnswers = answersRef.current;
    const correct = currentAnswers.filter(a => a.correct).length;
    const pct = currentAnswers.length > 0 ? (correct / currentAnswers.length) * 100 : 0;
    if (pct === 100 && currentAnswers.length > 0) setShowConfetti(true);
    const xpGain = correct * 10 + (correct === currentAnswers.length && currentAnswers.length > 0 ? 50 : 0);
    await updateXP(xpGain);
    await updateStreak();
  }, [updateXP, updateStreak]);

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const q = quizQuestions[current];
    const isCorrect = idx === q.correct;
    setAnswers(prev => [...prev, { question: q, chosen: idx, correct: isCorrect }]);
    if (!isCorrect) setShakeKey(k => k + 1);
  };

  const handleNext = () => {
    if (current + 1 >= quizQuestions.length) {
      finishQuiz();
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
      setQuestionKey(k => k + 1);
    }
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeColor = timeLeft < 30 ? 'text-red-500' : timeLeft < 60 ? 'text-yellow-500' : t.primaryText;

  const availableCount = questions.filter(q => {
    if (selectedSubject !== 'all' && q.subject !== selectedSubject) return false;
    return true;
  }).length;

  // SETUP SCREEN
  if (phase === 'setup') {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Hero */}
          <div className={`relative rounded-3xl overflow-hidden mb-8 animate-slide-up ${
            mode === 'soft'
              ? 'bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500'
              : 'bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800'
          }`}>
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20 blur-2xl bg-white" />
            <div className="relative z-10 p-6">
              <div className="text-4xl mb-3">🧪</div>
              <h1 className="text-2xl font-black text-white">Настрой теста</h1>
              <p className="text-white/70 text-sm mt-1">{availableCount} въпроса · избери предмет и настройки</p>
            </div>
          </div>

          <div className={`rounded-3xl p-6 mb-6 ${t.card}`}>
            <h2 className={`font-bold mb-4 ${t.heading}`}>Предмет</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[{ id: 'all', name: 'Всички', emoji: '📚' }, ...subjects].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubject(s.id)}
                  className={`p-3 rounded-2xl text-sm font-semibold transition-all border-2 ${
                    selectedSubject === s.id
                      ? `${t.primary} text-white border-transparent`
                      : `${t.card} ${t.text} border-transparent ${t.cardHover}`
                  }`}
                >
                  <span className="text-xl block mb-1">{'emoji' in s ? s.emoji : '📚'}</span>
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-3xl p-6 mb-6 ${t.card}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`font-bold ${t.heading}`}>Брой въпроси</h2>
              <span className={`text-xs ${t.textMuted}`}>{availableCount} налични</span>
            </div>
            <div className="flex gap-3">
              {[5, 10, 15, 20].map(n => {
                const isDisabled = n > availableCount;
                return (
                  <button
                    key={n}
                    onClick={() => !isDisabled && setQuestionCount(n)}
                    disabled={isDisabled}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                      isDisabled
                        ? `opacity-30 cursor-not-allowed ${t.card} ${t.text} border-transparent`
                        : questionCount === n
                        ? `${t.primary} text-white border-transparent`
                        : `${t.card} ${t.text} border-transparent ${t.cardHover}`
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            {questionCount > availableCount && (
              <p className={`text-xs mt-2 ${t.textMuted}`}>
                ⚠️ Само {availableCount} въпроса налични за тази комбинация
              </p>
            )}
          </div>

          <div className={`rounded-3xl p-6 mb-8 ${t.card}`}>
            <h2 className={`font-bold mb-4 ${t.heading}`}>Времево ограничение</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: '3 мин', val: 180 },
                { label: '5 мин', val: 300 },
                { label: '10 мин', val: 600 },
                { label: 'Без лимит', val: 99999 },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setTimeLimit(opt.val)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                    timeLimit === opt.val
                      ? `${t.primary} text-white border-transparent`
                      : `${t.card} ${t.text} border-transparent ${t.cardHover}`
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={buildQuiz}
            className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 ${t.primary} shadow-lg`}
          >
            🚀 Стартирай теста ({Math.min(questionCount, availableCount)} въпроса)
          </button>
        </div>
      </AppShell>
    );
  }

  // QUIZ SCREEN
  if (phase === 'quiz') {
    const q = quizQuestions[current];
    if (!q) return null;
    const progress = (current / quizQuestions.length) * 100;

    return (
      <AppShell>
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <span className={`text-sm font-bold ${t.textMuted} whitespace-nowrap`}>{current + 1} / {quizQuestions.length}</span>
            {timeLimit < 99999 && (
              <span className={`text-lg font-black tabular-nums ${timeColor} ${timeLeft < 10 ? 'animate-pulse' : ''} mx-auto`}>
                ⏱ {mins}:{secs.toString().padStart(2, '0')}
              </span>
            )}
            <span className={`text-sm font-bold ${t.primaryText} whitespace-nowrap`}>
              {subjects.find(s => s.id === q.subject)?.emoji}
              <span className="hidden xs:inline"> {subjects.find(s => s.id === q.subject)?.name}</span>
            </span>
          </div>

          {/* Progress */}
          <div className={`h-2 rounded-full mb-6 ${t.progressBg}`}>
            <div
              className={`h-2 rounded-full bg-gradient-to-r ${t.xpBar} transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question — re-animates on key change */}
          <div key={`q-${questionKey}`} className={`rounded-3xl p-6 mb-6 ${t.card} animate-slide-in`}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${t.textMuted}`}>{q.topic}</div>
            <p className={`text-xl font-bold leading-relaxed ${t.heading}`}>{q.question}</p>
          </div>

          {/* Options */}
          <div key={`opts-${questionKey}`} className="space-y-3 mb-6">
            {q.options.map((opt, idx) => {
              let style = `${t.card} ${t.text} border-2 border-transparent`;
              let extraClass = '';
              if (!answered) {
                style += ` ${t.cardHover} hover:border-opacity-50`;
                extraClass = 'hover:scale-[1.01] active:scale-[0.99]';
              } else {
                if (idx === q.correct) {
                  style = `${t.correct} border-2 border-green-300`;
                  extraClass = 'animate-pop-in';
                } else if (idx === selected && idx !== q.correct) {
                  style = `${t.wrong} border-2 border-red-300`;
                }
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={answered}
                  className={`w-full text-left p-4 rounded-2xl font-medium text-sm transition-all ${style} ${extraClass}`}
                  style={{ animationDelay: `${idx * 0.06}s` }}
                >
                  <span
                    className={`inline-block w-6 h-6 rounded-full text-xs font-bold text-center leading-6 mr-3 ${
                      answered && idx === q.correct
                        ? 'bg-green-400 text-white'
                        : answered && idx === selected && idx !== q.correct
                        ? 'bg-red-400 text-white'
                        : t.badge
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Explanation + Next */}
          {answered && (
            <div key={`exp-${questionKey}`} className="space-y-3 animate-slide-in">
              <div
                key={shakeKey}
                className={`rounded-2xl p-4 text-sm leading-relaxed border ${
                  selected === q.correct ? t.correct : `${t.wrong} animate-shake`
                }`}
              >
                <span className="font-bold block mb-1">
                  {selected === q.correct ? '✅ Правилно!' : '❌ Грешно'}
                </span>
                {q.explanation}
              </div>
              <button
                onClick={handleNext}
                className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all hover:scale-105 active:scale-95 ${t.primary}`}
              >
                {current + 1 >= quizQuestions.length ? '🏁 Виж резултатите' : 'Следващ въпрос →'}
              </button>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  // RESULTS SCREEN
  const correct = answers.filter(a => a.correct).length;
  const total = answers.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const xpEarned = correct * 10 + (correct === total && total > 0 ? 50 : 0);
  const grade =
    pct >= 90 ? { label: '🏆 Отличен!', color: 'text-green-500' } :
    pct >= 70 ? { label: '✅ Добър', color: 'text-blue-500' } :
    pct >= 50 ? { label: '⚠️ Среден', color: 'text-yellow-500' } :
    { label: '💪 Продължавай!', color: 'text-red-500' };

  const weakTopics = [...new Set(answers.filter(a => !a.correct).map(a => a.question.topic))];

  return (
    <AppShell>
      {showConfetti && <Confetti />}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8 animate-pop-in">
          <div className="text-7xl mb-4">{pct >= 90 ? '🏆' : pct >= 70 ? '🎯' : pct >= 50 ? '📚' : '💪'}</div>
          <h1 className={`text-4xl font-black ${grade.color}`}>{grade.label}</h1>
          <p className={`text-6xl font-black mt-2 ${t.heading}`}>{pct}%</p>
          <p className={`${t.textMuted} mt-1`}>{correct} / {total} правилни</p>
        </div>

        {/* XP earned */}
        <div className={`rounded-2xl p-5 mb-6 text-center ${t.card}`}>
          <div className={`text-3xl font-black bg-gradient-to-r ${t.xpBar} bg-clip-text text-transparent`}>
            +{xpEarned} XP
          </div>
          <div className={`text-sm ${t.textMuted}`}>
            {correct === total && total > 0
              ? '🎉 Бонус +50 XP за перфектен тест!'
              : `${correct} × 10 XP`}
          </div>
        </div>

        {/* Weak topics */}
        {weakTopics.length > 0 && (
          <div className={`rounded-2xl p-5 mb-6 ${t.card}`}>
            <h3 className={`font-bold mb-3 ${t.heading}`}>📌 Повтори тези теми</h3>
            <div className="flex flex-wrap gap-2">
              {weakTopics.map(topic => (
                <span key={topic} className={`text-sm px-3 py-1 rounded-full ${t.badge}`}>{topic}</span>
              ))}
            </div>
          </div>
        )}

        {/* Answer review */}
        <div className={`rounded-2xl overflow-hidden mb-6 ${t.card}`}>
          <h3 className={`font-bold p-4 border-b ${t.heading} ${t.primaryBorder}`}>Преглед на отговорите</h3>
          <div className="divide-y divide-opacity-10">
            {answers.map(({ question: q, chosen, correct: isCorrect }, i) => (
              <div key={i} className="p-4">
                <div className="flex gap-2 items-start">
                  <span>{isCorrect ? '✅' : '❌'}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${t.text}`}>{q.question}</p>
                    {!isCorrect && (
                      <p className={`text-xs mt-1 ${t.textMuted}`}>
                        Ти:{' '}
                        <span className="text-red-500">{q.options[chosen]}</span> · Правилен:{' '}
                        <span className="text-green-500">{q.options[q.correct]}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setPhase('setup');
              setQuizQuestions([]);
              setShowConfetti(false);
            }}
            className={`flex-1 py-3.5 rounded-2xl font-bold transition-all hover:scale-105 ${t.buttonSecondary}`}
          >
            Нов тест
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-white transition-all hover:scale-105 ${t.primary}`}
          >
            Към началото
          </button>
        </div>
      </div>
    </AppShell>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizContent />
    </Suspense>
  );
}
