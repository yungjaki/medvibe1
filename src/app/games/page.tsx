'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AppShell from '@/components/AppShell';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { questions, tfStatements, flashCards, riddles, Riddle } from '@/lib/data/questions';

type GameType = 'menu' | 'speed' | 'matching' | 'truefalse' | 'flashcard' | 'memory' | 'riddle' | 'dna' | 'balancer' | 'organelle';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── GLOBAL ANIMATION STYLES ─────────────────────────────────────────────────
function GameStyles() {
  return (
    <style>{`
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes popIn {
        0% { transform: scale(0.8); opacity: 0; }
        60% { transform: scale(1.08); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes shake {
        0%,100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-5px); }
        80% { transform: translateX(5px); }
      }
      @keyframes flipY {
        0% { transform: perspective(600px) rotateY(0deg); }
        50% { transform: perspective(600px) rotateY(90deg); }
        100% { transform: perspective(600px) rotateY(0deg); }
      }
      @keyframes pulse-green {
        0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
        50% { box-shadow: 0 0 0 8px rgba(52,211,153,0.3); }
      }
      @keyframes fall {
        to { transform: translateY(110vh) rotate(720deg); opacity: 0; }
      }
      .anim-slide-up { animation: slideUp 0.35s ease-out both; }
      .anim-pop { animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
      .anim-shake { animation: shake 0.4s ease-in-out; }
      .anim-flip { animation: flipY 0.6s ease-in-out; }
      .anim-pulse-green { animation: pulse-green 0.5s ease-out; }
      .card-3d { perspective: 800px; }
      .card-inner {
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .card-inner.flipped { transform: rotateY(180deg); }
      .card-face {
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        position: absolute;
        inset: 0;
      }
      .card-back-face { transform: rotateY(180deg); }
    `}</style>
  );
}

// ─── CONFETTI ────────────────────────────────────────────────────────────────
function Confetti() {
  const colors = ['#f472b6', '#a78bfa', '#34d399', '#60a5fa', '#fbbf24'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {Array.from({ length: 28 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-sm"
          style={{
            background: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: `-5%`,
            animation: `fall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 0.8}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// ─── SPEED ROUND ─────────────────────────────────────────────────────────────
function SpeedRound({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'countdown' | 'playing' | 'done'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [pool, setPool] = useState(shuffle(questions).slice(0, 30));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [qKey, setQKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const id = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(id);
    }
    if (phase === 'countdown' && countdown === 0) setPhase('playing');
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) { setPhase('done'); updateXP(score * 5); return; }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  });

  const handleAnswer = useCallback((idx: number) => {
    if (phase !== 'playing' || feedback) return;
    const q = pool[current];
    const isCorrect = idx === q.correct;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      const ns = streak + 1;
      setScore(s => s + (ns >= 3 ? 2 : 1));
      setStreak(ns);
      setBestStreak(bs => Math.max(bs, ns));
    } else {
      setStreak(0);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setQKey(k => k + 1);
      if (current + 1 >= pool.length) {
        const np = shuffle(questions).slice(0, 30);
        setPool(np);
        setCurrent(0);
      } else {
        setCurrent(c => c + 1);
      }
    }, 500);
  }, [phase, feedback, pool, current, streak]);

  const start = () => {
    setPhase('countdown');
    setCountdown(3);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(60);
    setCurrent(0);
    setPool(shuffle(questions).slice(0, 30));
  };

  if (phase === 'idle' || phase === 'done') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <button onClick={onBack} className={`text-sm mb-6 ${t.textMuted} hover:${t.primaryText} transition-colors`}>← Обратно</button>
        <div className={`rounded-3xl p-8 text-center ${t.card} anim-slide-up`}>
          <div className="text-6xl mb-4">⚡</div>
          <h2 className={`text-3xl font-black mb-2 ${t.heading}`}>Бърз кръг</h2>
          <p className={`${t.textMuted} mb-6`}>60 секунди. Колкото повече въпроси — толкова повече XP. Серия от 3+ носи 2× точки!</p>
          {phase === 'done' && (
            <div className="mb-6 space-y-2">
              <div className={`text-5xl font-black bg-gradient-to-r ${t.xpBar} bg-clip-text text-transparent anim-pop`}>{score}</div>
              <div className={`text-sm ${t.textMuted}`}>точки · Най-дълга серия: {bestStreak}</div>
              <div className={`text-sm font-bold ${t.primaryText}`}>+{score * 5} XP спечелени</div>
            </div>
          )}
          <button onClick={start} className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 ${t.primary} shadow-lg`}>
            {phase === 'done' ? '🔄 Играй отново' : '⚡ Старт!'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'countdown') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <GameStyles />
        <div key={countdown} className={`text-9xl font-black anim-pop ${t.heading}`}>{countdown || '🔥'}</div>
      </div>
    );
  }

  const q = pool[current];
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <GameStyles />
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4 items-center">
          <span className={`font-black text-xl ${t.heading}`}>⚡{score}</span>
          {streak >= 3 && (
            <span className="text-orange-400 font-bold text-sm bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full anim-pop">
              🔥 Серия ×{streak}
            </span>
          )}
        </div>
        <span className={`text-2xl font-black tabular-nums ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : t.primaryText}`}>
          {timeLeft}s
        </span>
      </div>

      <div className={`h-2 rounded-full mb-6 ${t.progressBg}`}>
        <div
          className={`h-2 rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : `bg-gradient-to-r ${t.xpBar}`}`}
          style={{ width: `${(timeLeft / 60) * 100}%` }}
        />
      </div>

      <div
        key={`q-${qKey}`}
        className={`rounded-3xl p-6 mb-4 transition-all duration-300 anim-slide-up ${
          feedback === 'correct' ? t.correct : feedback === 'wrong' ? t.wrong : t.card
        }`}
      >
        <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${t.textMuted}`}>{q.topic}</div>
        <p className={`text-lg font-bold ${t.heading}`}>{q.question}</p>
      </div>

      <div key={`opts-${qKey}`} className="grid grid-cols-2 gap-3">
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(idx)}
            disabled={!!feedback}
            className={`p-4 rounded-2xl font-semibold text-sm transition-all active:scale-95 hover:scale-[1.03] ${t.card} ${t.text} border-2 border-transparent ${t.cardHover} anim-slide-up`}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <span className={`block text-xs mb-1 font-bold ${t.textMuted}`}>{String.fromCharCode(65 + idx)}</span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MATCHING GAME ────────────────────────────────────────────────────────────
const matchingPairs = [
  { term: 'Митохондрия', def: 'Електростанцията на клетката' },
  { term: 'Рибозома', def: 'Синтезира протеини' },
  { term: 'Лизозома', def: 'Храносмилателна органела' },
  { term: 'Ядро', def: 'Съдържа ДНК' },
  { term: 'Хлоропласт', def: 'Фотосинтеза' },
  { term: 'Апарат на Голджи', def: 'Опаковане и транспорт на протеини' },
  { term: 'Митрална клапа', def: 'Между ляво предсърдие и лява камера' },
  { term: 'Епиглотис', def: 'Затваря трахеята при преглъщане' },
  { term: 'Gluteus maximus', def: 'Най-голям мускул по обем' },
  { term: 'Олигодендроцити', def: 'Миелинизират аксони в ЦНС' },
  { term: 'SA възел', def: 'Естественият пейсмейкър на сърцето' },
  { term: 'Алвеоли', def: 'Място на газообмена в белите дробове' },
  { term: 'Хеликаза', def: 'Разплита ДНК при репликация' },
  { term: 'Остеокласти', def: 'Разграждат костната тъкан' },
  { term: 'Уретер', def: 'Свързва бъбрека с пикочния мехур' },
];

function MatchingGame({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [pairs, setPairs] = useState<typeof matchingPairs>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [defs, setDefs] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase, startTime]);

  const start = () => {
    const sel = shuffle(matchingPairs).slice(0, 7);
    setPairs(sel);
    setTerms(shuffle(sel.map(p => p.term)));
    setDefs(shuffle(sel.map(p => p.def)));
    setMatched([]);
    setSelectedTerm(null);
    setWrong(null);
    setMoves(0);
    setStartTime(Date.now());
    setElapsed(0);
    setConfetti(false);
    setPhase('playing');
  };

  const handleDef = (def: string) => {
    if (!selectedTerm || matched.includes(selectedTerm)) return;
    setMoves(m => m + 1);
    const isCorrect = pairs.find(p => p.term === selectedTerm)?.def === def;
    if (isCorrect) {
      const newMatched = [...matched, selectedTerm];
      setMatched(newMatched);
      setSelectedTerm(null);
      if (newMatched.length === pairs.length) {
        setPhase('done');
        setConfetti(true);
        updateXP(Math.max(10, 80 - moves) + 20);
      }
    } else {
      setWrong(def);
      setTimeout(() => { setWrong(null); setSelectedTerm(null); }, 700);
    }
  };

  if (phase === 'idle' || phase === 'done') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        {confetti && <Confetti />}
        <GameStyles />
        <button onClick={onBack} className={`text-sm mb-6 ${t.textMuted}`}>← Обратно</button>
        <div className={`rounded-3xl p-8 text-center ${t.card} anim-slide-up`}>
          <div className="text-6xl mb-4">🧩</div>
          <h2 className={`text-3xl font-black mb-2 ${t.heading}`}>Свържи термините</h2>
          <p className={`${t.textMuted} mb-6`}>7 термина, всеки с правилно определение. Намери всички двойки!</p>
          {phase === 'done' && (
            <div className="mb-6 space-y-1">
              <div className="text-3xl font-black text-green-500 anim-pop">🎉 Завърши!</div>
              <div className={`text-sm ${t.textMuted}`}>{moves} хода · {elapsed} сек</div>
            </div>
          )}
          <button onClick={start} className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 ${t.primary}`}>
            {phase === 'done' ? '🔄 Нова игра' : '🧩 Стартирай'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <GameStyles />
      <div className="flex justify-between items-center mb-4 gap-2">
        <button onClick={onBack} className={`text-sm ${t.textMuted} whitespace-nowrap flex-shrink-0`}>← Обратно</button>
        <span className={`text-xs font-bold ${t.textMuted} text-right`}>{matched.length}/{pairs.length} · {elapsed}s · {moves} хода</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${t.textMuted}`}>Термини</h3>
          {terms.map((term, i) => {
            const isMatched = matched.includes(term);
            const isSelected = selectedTerm === term;
            return (
              <button
                key={term}
                onClick={() => !isMatched && setSelectedTerm(term)}
                disabled={isMatched}
                className={`w-full p-3 rounded-xl text-sm font-semibold text-left transition-all border-2 anim-slide-up ${
                  isMatched ? `${t.correct} opacity-60` :
                  isSelected ? `${t.primary} text-white border-transparent scale-105` :
                  `${t.card} ${t.text} border-transparent ${t.cardHover}`
                }`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {isMatched ? '✅ ' : ''}{term}
              </button>
            );
          })}
        </div>
        <div className="space-y-3">
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${t.textMuted}`}>Определения</h3>
          {defs.map((def, i) => {
            const matchedTerm = pairs.find(p => p.def === def)?.term;
            const isMatched = matchedTerm ? matched.includes(matchedTerm) : false;
            const isWrong = wrong === def;
            return (
              <button
                key={def}
                onClick={() => handleDef(def)}
                disabled={isMatched || !selectedTerm}
                className={`w-full p-3 rounded-xl text-sm font-semibold text-left transition-all border-2 anim-slide-up ${
                  isMatched ? `${t.correct} opacity-60` :
                  isWrong ? `${t.wrong} anim-shake scale-95` :
                  selectedTerm ? `${t.card} ${t.text} border-transparent hover:scale-[1.02] cursor-pointer ${t.cardHover}` :
                  `${t.card} ${t.text} border-transparent opacity-50`
                }`}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {def}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── TRUE / FALSE BLITZ ───────────────────────────────────────────────────────
function TrueFalseBlitz({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'countdown' | 'playing' | 'done'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [pool, setPool] = useState(shuffle(tfStatements));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [stmtKey, setStmtKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const id = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(id);
    }
    if (phase === 'countdown' && countdown === 0) setPhase('playing');
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) { setPhase('done'); updateXP(score * 8); return; }
    const id = setTimeout(() => setTimeLeft(x => x - 1), 1000);
    return () => clearTimeout(id);
  });

  const answer = useCallback((choice: boolean) => {
    if (phase !== 'playing' || feedback) return;
    const stmt = pool[current];
    const isCorrect = choice === stmt.isTrue;
    setTotal(x => x + 1);
    setFeedback({ correct: isCorrect, text: stmt.explanation });

    if (isCorrect) {
      const ns = streak + 1;
      setScore(s => s + (ns >= 3 ? 2 : 1));
      setStreak(ns);
      setBestStreak(bs => Math.max(bs, ns));
    } else {
      setStreak(0);
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setStmtKey(k => k + 1);
      if (current + 1 >= pool.length) {
        setPool(shuffle(tfStatements));
        setCurrent(0);
      } else {
        setCurrent(c => c + 1);
      }
    }, 1200);
  }, [phase, feedback, pool, current, streak]);

  const start = () => {
    setPhase('countdown');
    setCountdown(3);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotal(0);
    setTimeLeft(45);
    setCurrent(0);
    setPool(shuffle(tfStatements));
  };

  if (phase === 'idle' || phase === 'done') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <GameStyles />
        <button onClick={onBack} className={`text-sm mb-6 ${t.textMuted}`}>← Обратно</button>
        <div className={`rounded-3xl p-8 text-center ${t.card} anim-slide-up`}>
          <div className="text-6xl mb-4">⚡🧠</div>
          <h2 className={`text-3xl font-black mb-2 ${t.heading}`}>Вярно или Грешно</h2>
          <p className={`${t.textMuted} mb-6`}>45 секунди. Прецени всяко твърдение — Вярно или Грешно. Серия от 3+ дава 2× точки!</p>
          {phase === 'done' && (
            <div className="mb-6 space-y-2">
              <div className={`text-5xl font-black bg-gradient-to-r ${t.xpBar} bg-clip-text text-transparent anim-pop`}>{score}</div>
              <div className={`text-sm ${t.textMuted}`}>{total} отговора · Най-дълга серия: {bestStreak}</div>
              <div className={`text-sm font-bold ${t.primaryText}`}>+{score * 8} XP спечелени</div>
            </div>
          )}
          <button onClick={start} className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 ${t.primary}`}>
            {phase === 'done' ? '🔄 Играй отново' : '🚀 Старт!'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'countdown') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <GameStyles />
        <div key={countdown} className={`text-9xl font-black anim-pop ${t.heading}`}>{countdown || '🧠'}</div>
      </div>
    );
  }

  const stmt = pool[current];

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <GameStyles />
      {/* Stats */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3 items-center">
          <span className={`font-black text-xl ${t.heading}`}>⚡{score}</span>
          {streak >= 3 && (
            <span className="text-orange-400 font-bold text-sm anim-pop">🔥×{streak}</span>
          )}
        </div>
        <span className={`text-2xl font-black tabular-nums ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : t.primaryText}`}>
          {timeLeft}s
        </span>
      </div>

      {/* Timer bar */}
      <div className={`h-2 rounded-full mb-6 ${t.progressBg}`}>
        <div
          className={`h-2 rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : `bg-gradient-to-r ${t.xpBar}`}`}
          style={{ width: `${(timeLeft / 45) * 100}%` }}
        />
      </div>

      {/* Statement card */}
      <div
        key={`stmt-${stmtKey}`}
        className={`rounded-3xl p-7 mb-4 text-center transition-all anim-slide-up min-h-[140px] flex flex-col justify-center ${
          feedback ? (feedback.correct ? t.correct : t.wrong) : t.card
        }`}
      >
        <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${t.textMuted}`}>{stmt.subject}</div>
        <p className={`text-xl font-bold leading-relaxed ${t.heading}`}>{stmt.statement}</p>
      </div>

      {/* Feedback explanation */}
      {feedback && (
        <div className={`rounded-2xl px-4 py-3 mb-4 text-sm text-center anim-slide-up ${
          feedback.correct ? t.correct : t.wrong
        }`}>
          <span className="font-bold">{feedback.correct ? '✅ Вярно!' : '❌ Грешно!'}</span>
          {' — '}{feedback.text}
        </div>
      )}

      {/* True / False buttons */}
      {!feedback && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => answer(true)}
            className="py-5 rounded-2xl font-black text-xl text-white bg-gradient-to-br from-green-400 to-emerald-500 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-200/40"
          >
            ✅ Вярно
          </button>
          <button
            onClick={() => answer(false)}
            className="py-5 rounded-2xl font-black text-xl text-white bg-gradient-to-br from-red-400 to-rose-500 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-200/40"
          >
            ❌ Грешно
          </button>
        </div>
      )}
      {feedback && (
        <div className="grid grid-cols-2 gap-4 opacity-30 pointer-events-none">
          <div className="py-5 rounded-2xl font-black text-xl text-white bg-gradient-to-br from-green-400 to-emerald-500 text-center">✅ Вярно</div>
          <div className="py-5 rounded-2xl font-black text-xl text-white bg-gradient-to-br from-red-400 to-rose-500 text-center">❌ Грешно</div>
        </div>
      )}
    </div>
  );
}

// ─── FLASHCARD FLIP ───────────────────────────────────────────────────────────
function FlashcardFlip({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [deck, setDeck] = useState(shuffle(flashCards));
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const [cardKey, setCardKey] = useState(0);
  const [confetti, setConfetti] = useState(false);

  const start = () => {
    setDeck(shuffle(flashCards));
    setCurrent(0);
    setFlipped(false);
    setKnown(0);
    setUnknown(0);
    setCardKey(0);
    setConfetti(false);
    setPhase('playing');
  };

  const next = (didKnow: boolean) => {
    if (didKnow) setKnown(k => k + 1);
    else setUnknown(u => u + 1);
    if (current + 1 >= deck.length) {
      const knownCount = didKnow ? known + 1 : known;
      setPhase('done');
      updateXP(knownCount * 5);
      if (knownCount === deck.length) setConfetti(true);
    } else {
      setCurrent(c => c + 1);
      setFlipped(false);
      setCardKey(k => k + 1);
    }
  };

  if (phase === 'idle' || phase === 'done') {
    const finalKnown = known;
    const finalTotal = known + unknown;
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        {confetti && <Confetti />}
        <GameStyles />
        <button onClick={onBack} className={`text-sm mb-6 ${t.textMuted}`}>← Обратно</button>
        <div className={`rounded-3xl p-8 text-center ${t.card} anim-slide-up`}>
          <div className="text-6xl mb-4">🃏</div>
          <h2 className={`text-3xl font-black mb-2 ${t.heading}`}>Флашкарти</h2>
          <p className={`${t.textMuted} mb-6`}>Виж термина, обмисли, обърни картата. Кажи сам дали си знаел отговора.</p>
          {phase === 'done' && finalTotal > 0 && (
            <div className="mb-6 space-y-2">
              <div className={`text-4xl font-black text-green-500 anim-pop`}>{finalKnown}/{finalTotal}</div>
              <div className={`text-sm ${t.textMuted}`}>знаеш · +{finalKnown * 5} XP</div>
              <div className="flex gap-2 mt-3">
                <div className={`flex-1 rounded-xl py-2 text-center text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/20`}>
                  ✅ {finalKnown} знам
                </div>
                <div className={`flex-1 rounded-xl py-2 text-center text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20`}>
                  ❌ {unknown} учa
                </div>
              </div>
            </div>
          )}
          <button onClick={start} className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 ${t.primary}`}>
            {phase === 'done' ? '🔄 Ново тесте' : '🃏 Стартирай'}
          </button>
        </div>
      </div>
    );
  }

  const card = deck[current];
  const progress = (current / deck.length) * 100;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <GameStyles />
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className={`text-sm ${t.textMuted}`}>← Обратно</button>
        <span className={`text-sm font-bold ${t.textMuted}`}>{current + 1} / {deck.length}</span>
      </div>

      <div className={`h-2 rounded-full mb-6 ${t.progressBg}`}>
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${t.xpBar} transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 mb-5">
        <div className={`flex-1 rounded-xl py-2 text-center text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/20`}>
          ✅ {known}
        </div>
        <div className={`flex-1 rounded-xl py-2 text-center text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20`}>
          ❌ {unknown}
        </div>
      </div>

      {/* 3D Flip Card */}
      <div
        key={cardKey}
        className="card-3d cursor-pointer mb-6 anim-slide-up"
        style={{ height: '220px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div className={`card-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className={`card-face rounded-3xl p-8 flex flex-col items-center justify-center ${t.card} border-2 border-transparent`}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-4 ${t.textMuted}`}>{card.subject}</div>
            <p className={`text-2xl font-black text-center ${t.heading}`}>{card.front}</p>
            <p className={`text-xs mt-4 ${t.textMuted}`}>Натисни за да обърнеш →</p>
          </div>
          {/* Back */}
          <div className={`card-face card-back-face rounded-3xl p-8 flex flex-col items-center justify-center bg-gradient-to-br ${t.xpBar} text-white`}>
            <div className="text-xs font-bold uppercase tracking-wider mb-4 opacity-70">{card.subject}</div>
            <p className="text-lg font-bold text-center leading-relaxed">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Action buttons — only show after flip */}
      {flipped ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => next(false)}
            className="py-4 rounded-2xl font-black text-lg text-white bg-gradient-to-br from-red-400 to-rose-500 transition-all hover:scale-105 active:scale-95"
          >
            ❌ Учa
          </button>
          <button
            onClick={() => next(true)}
            className="py-4 rounded-2xl font-black text-lg text-white bg-gradient-to-br from-green-400 to-emerald-500 transition-all hover:scale-105 active:scale-95"
          >
            ✅ Знам
          </button>
        </div>
      ) : (
        <button
          onClick={() => setFlipped(true)}
          className={`w-full py-4 rounded-2xl font-bold text-white transition-all hover:scale-105 ${t.primary}`}
        >
          🔄 Обърни картата
        </button>
      )}
    </div>
  );
}

// ─── MEMORY MATCH ─────────────────────────────────────────────────────────────
type MemCard = { id: string; pairId: string; text: string; type: 'term' | 'def'; matched: boolean; flipped: boolean };

const memoryPairs = [
  { id: 'mp1', term: 'Митохондрия', def: 'Произвежда АТФ' },
  { id: 'mp2', term: 'Рибозома', def: 'Синтезира протеини' },
  { id: 'mp3', term: 'Епиглотис', def: 'Затваря трахеята' },
  { id: 'mp4', term: 'SA възел', def: 'Пейсмейкър на сърцето' },
  { id: 'mp5', term: 'Хеликаза', def: 'Разплита ДНК' },
  { id: 'mp6', term: 'Феmur', def: 'Най-дълга кост' },
  { id: 'mp7', term: 'Алвеоли', def: 'Газообмен в белия дроб' },
  { id: 'mp8', term: 'Инсулин', def: 'Понижава кръвната захар' },
];

function MemoryMatch({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [cards, setCards] = useState<MemCard[]>([]);
  const [selected, setSelected] = useState<MemCard[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [wrongPair, setWrongPair] = useState<string[]>([]);
  const lockRef = useRef(false);

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase, startTime]);

  const start = () => {
    const chosen = shuffle(memoryPairs).slice(0, 6);
    const deck: MemCard[] = shuffle([
      ...chosen.map(p => ({ id: `${p.id}-t`, pairId: p.id, text: p.term, type: 'term' as const, matched: false, flipped: false })),
      ...chosen.map(p => ({ id: `${p.id}-d`, pairId: p.id, text: p.def, type: 'def' as const, matched: false, flipped: false })),
    ]);
    setCards(deck);
    setSelected([]);
    setMoves(0);
    setStartTime(Date.now());
    setElapsed(0);
    setConfetti(false);
    setWrongPair([]);
    lockRef.current = false;
    setPhase('playing');
  };

  const flip = (card: MemCard) => {
    if (lockRef.current || card.flipped || card.matched || selected.length >= 2) return;

    const newCards = cards.map(c => c.id === card.id ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newSel = [...selected, card];
    setSelected(newSel);

    if (newSel.length === 2) {
      setMoves(m => m + 1);
      lockRef.current = true;
      const [a, b] = newSel;
      if (a.pairId === b.pairId) {
        setTimeout(() => {
          setCards(c => c.map(x => x.pairId === a.pairId ? { ...x, matched: true } : x));
          setSelected([]);
          lockRef.current = false;
          setCards(prev => {
            if (prev.every(x => x.matched || x.pairId === a.pairId)) {
              const allMatched = prev.map(x => x.pairId === a.pairId ? { ...x, matched: true } : x);
              if (allMatched.every(x => x.matched)) {
                setPhase('done');
                setConfetti(true);
                updateXP(Math.max(20, 100 - moves));
              }
              return allMatched;
            }
            return prev;
          });
        }, 400);
      } else {
        setWrongPair([a.id, b.id]);
        setTimeout(() => {
          setCards(c => c.map(x => (x.id === a.id || x.id === b.id) ? { ...x, flipped: false } : x));
          setSelected([]);
          setWrongPair([]);
          lockRef.current = false;
        }, 900);
      }
    }
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    if (cards.length > 0 && cards.every(c => c.matched)) {
      setPhase('done');
      setConfetti(true);
      updateXP(Math.max(20, 100 - moves));
    }
  }, [cards, phase, moves, updateXP]);

  if (phase === 'idle' || phase === 'done') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        {confetti && <Confetti />}
        <GameStyles />
        <button onClick={onBack} className={`text-sm mb-6 ${t.textMuted}`}>← Обратно</button>
        <div className={`rounded-3xl p-8 text-center ${t.card} anim-slide-up`}>
          <div className="text-6xl mb-4">🧠</div>
          <h2 className={`text-3xl font-black mb-2 ${t.heading}`}>Памет</h2>
          <p className={`${t.textMuted} mb-6`}>Намери всички двойки термин–определение. Колкото по-малко ходове, толкова повече XP!</p>
          {phase === 'done' && (
            <div className="mb-6 space-y-1">
              <div className="text-3xl font-black text-green-500 anim-pop">🎉 Перфектно!</div>
              <div className={`text-sm ${t.textMuted}`}>{moves} хода · {elapsed} сек</div>
            </div>
          )}
          <button onClick={start} className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 ${t.primary}`}>
            {phase === 'done' ? '🔄 Играй отново' : '🧠 Стартирай'}
          </button>
        </div>
      </div>
    );
  }

  const matchedCount = cards.filter(c => c.matched).length / 2;
  const totalPairs = cards.length / 2;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <GameStyles />
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className={`text-sm ${t.textMuted}`}>← Обратно</button>
        <span className={`text-sm font-bold ${t.textMuted}`}>{matchedCount}/{totalPairs} двойки · {moves} хода · {elapsed}s</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, i) => {
          const isWrong = wrongPair.includes(card.id);
          return (
            <button
              key={card.id}
              onClick={() => flip(card)}
              disabled={card.matched}
              className={`rounded-xl aspect-square flex items-center justify-center p-1.5 text-[10px] font-bold text-center transition-all duration-300 border-2 anim-slide-up leading-tight ${
                card.matched
                  ? `${t.correct} opacity-70 scale-95`
                  : card.flipped
                  ? isWrong
                    ? `${t.wrong} anim-shake border-red-300`
                    : `${t.primary} text-white border-transparent scale-105`
                  : `${t.card} ${t.text} border-transparent hover:scale-105 cursor-pointer ${t.cardHover}`
              }`}
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              {card.flipped || card.matched ? (
                <span className="break-words overflow-hidden" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>{card.text}</span>
              ) : (
                <span className={`text-xl ${t.textMuted}`}>?</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── КОЙ СЪМ АЗ? (WHO AM I?) ─────────────────────────────────────────────────
const ROUNDS = 5;

function RiddleGame({ onBack }: { onBack: () => void }) {
  const { t, mode } = useTheme();
  const { updateXP } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [deck, setDeck] = useState<Riddle[]>([]);
  const [current, setCurrent] = useState(0);
  const [cluesShown, setCluesShown] = useState(1);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [confetti, setConfetti] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  const start = () => {
    setDeck(shuffle(riddles).slice(0, ROUNDS));
    setCurrent(0);
    setCluesShown(1);
    setChosen(null);
    setScore(0);
    setRoundScores([]);
    setConfetti(false);
    setCardKey(0);
    setPhase('playing');
  };

  const handleAnswer = (answer: string) => {
    if (chosen) return;
    setChosen(answer);
    const riddle = deck[current];
    const isCorrect = answer === riddle.answer;
    const pts = isCorrect ? (4 - cluesShown) : 0; // 3, 2, 1 or 0 points
    setScore(s => s + pts);
    setRoundScores(rs => [...rs, pts]);
  };

  const handleNext = () => {
    if (current + 1 >= deck.length) {
      const total = roundScores.reduce((a, b) => a + b, 0) + (chosen === deck[current]?.answer ? (4 - cluesShown) : 0);
      updateXP(total * 10);
      if (total === ROUNDS * 3) setConfetti(true);
      setPhase('done');
    } else {
      setCurrent(c => c + 1);
      setCluesShown(1);
      setChosen(null);
      setCardKey(k => k + 1);
    }
  };

  const riddle = deck[current];
  const totalScore = roundScores.reduce((a, b) => a + b, 0);

  if (phase === 'idle' || phase === 'done') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        {confetti && <Confetti />}
        <GameStyles />
        <button onClick={onBack} className={`text-sm mb-6 ${t.textMuted}`}>← Обратно</button>
        <div className={`rounded-3xl p-8 text-center ${t.card} anim-slide-up`}>
          <div className="text-6xl mb-4">🔍</div>
          <h2 className={`text-3xl font-black mb-2 ${t.heading}`}>Кой съм аз?</h2>
          <p className={`${t.textMuted} mb-6`}>
            Прочети улики една по една и познай термина! Отговори по-рано → повече точки (3→2→1).
            {' '}{ROUNDS} рунда.
          </p>
          {phase === 'done' && (
            <div className="mb-6 space-y-3">
              <div className={`text-5xl font-black bg-gradient-to-r ${t.xpBar} bg-clip-text text-transparent anim-pop`}>
                {totalScore}/{ROUNDS * 3}
              </div>
              <div className={`text-sm ${t.textMuted}`}>точки · +{totalScore * 10} XP</div>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {roundScores.map((pts, i) => (
                  <span
                    key={i}
                    className={`w-10 h-10 rounded-full font-black text-sm flex items-center justify-center ${
                      pts === 3 ? 'bg-green-400 text-white' :
                      pts === 2 ? 'bg-yellow-400 text-white' :
                      pts === 1 ? 'bg-orange-400 text-white' :
                      'bg-red-400 text-white'
                    }`}
                  >
                    {pts}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button onClick={start} className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 ${t.primary} shadow-lg`}>
            {phase === 'done' ? '🔄 Играй отново' : '🔍 Старт!'}
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = chosen === riddle.answer;
  const isWrong = chosen !== null && !isCorrect;
  const pointsAvailable = 4 - cluesShown;
  const options = shuffle([riddle.answer, ...riddle.decoys]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <GameStyles />
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <button onClick={onBack} className={`text-sm ${t.textMuted} whitespace-nowrap`}>← Обратно</button>
        <span className={`text-sm font-bold ${t.textMuted}`}>Рунд {current + 1}/{ROUNDS}</span>
        <span className={`text-sm font-black ${t.primaryText} whitespace-nowrap`}>⚡{totalScore}</span>
      </div>

      {/* Progress bar */}
      <div className={`h-2 rounded-full mb-5 ${t.progressBg}`}>
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${t.xpBar} transition-all duration-500`}
          style={{ width: `${(current / ROUNDS) * 100}%` }}
        />
      </div>

      {/* Points badge */}
      <div className="flex justify-center mb-4">
        <div className={`px-4 py-1.5 rounded-full font-bold text-sm ${
          pointsAvailable === 3 ? 'bg-green-100 text-green-600' :
          pointsAvailable === 2 ? 'bg-yellow-100 text-yellow-600' :
          'bg-orange-100 text-orange-600'
        }`}>
          {chosen ? (isCorrect ? `+${isCorrect ? (4 - cluesShown) : 0} точки ✅` : '0 точки ❌') : `Познай сега → +${pointsAvailable} т.`}
        </div>
      </div>

      {/* Clues card */}
      <div key={`riddle-${cardKey}`} className={`rounded-3xl p-6 mb-4 ${t.card} anim-slide-up`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-3xl">{riddle.emoji}</span>
          <div className={`text-xs font-bold uppercase tracking-wider ${t.textMuted}`}>{riddle.subject}</div>
        </div>
        <div className="space-y-3">
          {riddle.clues.slice(0, cluesShown).map((clue, i) => (
            <div
              key={i}
              className={`flex gap-3 items-start rounded-2xl px-4 py-3 anim-slide-up ${
                mode === 'soft' ? 'bg-pink-50' : 'bg-gray-800'
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className={`font-black text-lg flex-shrink-0 ${
                i === 0 ? 'text-green-500' : i === 1 ? 'text-yellow-500' : 'text-orange-500'
              }`}>{i + 1}</span>
              <p className={`text-sm leading-relaxed ${t.text}`}>{clue}</p>
            </div>
          ))}
          {!chosen && cluesShown < 3 && (
            <button
              onClick={() => setCluesShown(c => c + 1)}
              className={`w-full py-2.5 rounded-2xl text-sm font-semibold border-2 border-dashed transition-all hover:scale-[1.01] ${
                mode === 'soft' ? 'border-pink-300 text-pink-500 hover:bg-pink-50' : 'border-gray-600 text-gray-400 hover:bg-gray-800'
              }`}
            >
              👁 Покажи следваща улика (-1 точка)
            </button>
          )}
        </div>
      </div>

      {/* Answer options */}
      {!chosen ? (
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt, i) => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              className={`p-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] border-2 border-transparent ${t.card} ${t.text} ${t.cardHover} anim-slide-up`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3 anim-slide-up">
          <div className={`rounded-2xl p-4 text-center font-black text-2xl ${isCorrect ? t.correct : t.wrong}`}>
            {isCorrect ? `✅ ${riddle.answer}!` : `❌ Беше: ${riddle.answer}`}
          </div>
          <button
            onClick={handleNext}
            className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all hover:scale-105 active:scale-95 ${t.primary}`}
          >
            {current + 1 >= deck.length ? '🏁 Виж резултата' : 'Следващ рунд →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── DNA BUILDER ─────────────────────────────────────────────────────────────
const DNA_TEMPLATE = ['A','T','G','C','G','A','T','T','C','G','A','T','G','C','G','A'] as const;
type Base = 'A' | 'T' | 'G' | 'C';
const COMPLEMENT: Record<Base, Base> = { A:'T', T:'A', G:'C', C:'G' };
const BASE_COLOR: Record<Base, string> = {
  A: 'bg-pink-500 text-white',
  T: 'bg-blue-500 text-white',
  G: 'bg-emerald-500 text-white',
  C: 'bg-amber-500 text-white',
};
const BASE_PAIR_COLOR: Record<Base, string> = {
  A: 'bg-pink-100 text-pink-700 border-pink-300',
  T: 'bg-blue-100 text-blue-700 border-blue-300',
  G: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  C: 'bg-amber-100 text-amber-700 border-amber-300',
};

function DNABuilder({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [answers, setAnswers] = useState<(Base | null)[]>(Array(16).fill(null));
  const [errors, setErrors] = useState<boolean[]>(Array(16).fill(false));
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [xpGiven, setXpGiven] = useState(false);

  const pick = (i: number, base: Base) => {
    if (done || answers[i] !== null) return;
    const correct = COMPLEMENT[DNA_TEMPLATE[i]];
    const isCorrect = base === correct;
    setAnswers(a => { const n = [...a]; n[i] = base; return n; });
    if (!isCorrect) {
      setErrors(e => { const n = [...e]; n[i] = true; return n; });
    } else {
      setScore(s => s + (errors[i] ? 1 : 2));
    }
    const nextAnswers = [...answers];
    nextAnswers[i] = base;
    if (nextAnswers.every(a => a !== null)) {
      setDone(true);
      if (!xpGiven) { updateXP(score + (isCorrect && !errors[i] ? 2 : 1)); setXpGiven(true); }
    }
  };

  const reset = () => {
    setAnswers(Array(16).fill(null));
    setErrors(Array(16).fill(false));
    setDone(false);
    setScore(0);
    setXpGiven(false);
  };

  const correctCount = answers.filter((a, i) => a === COMPLEMENT[DNA_TEMPLATE[i]]).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <GameStyles />
      <button onClick={onBack} className={`mb-4 text-sm font-semibold ${t.primaryText} hover:opacity-70`}>← Обратно</button>
      <h2 className={`text-2xl font-black mb-1 ${t.heading}`}>🧬 ДНК Строител</h2>
      <p className={`text-sm ${t.textMuted} mb-5`}>Избери комплементарната база за всяка позиция (A↔T, G↔C)</p>

      <div className={`rounded-2xl p-4 mb-4 ${t.card}`}>
        <div className="flex justify-between text-xs font-semibold mb-3">
          <span className={t.textMuted}>Матрична нишка</span>
          <span className={t.textMuted}>Комплементарна нишка</span>
        </div>
        <div className="space-y-2">
          {DNA_TEMPLATE.map((base, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 ${BASE_COLOR[base]}`}>{base}</div>
              <div className="flex-1 flex items-center justify-center gap-1">
                <div className="h-px flex-1 border-t-2 border-dashed border-gray-300/50" />
                <span className="text-xs text-gray-400">···</span>
                <div className="h-px flex-1 border-t-2 border-dashed border-gray-300/50" />
              </div>
              {answers[i] === null ? (
                <div className="flex gap-1 flex-shrink-0">
                  {(['A','T','G','C'] as Base[]).map(b => (
                    <button key={b} onClick={() => pick(i, b)}
                      className={`w-8 h-8 rounded-lg font-black text-xs transition-all hover:scale-110 active:scale-95 ${BASE_COLOR[b]}`}>{b}</button>
                  ))}
                </div>
              ) : (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 border-2 ${
                  answers[i] === COMPLEMENT[base] ? BASE_COLOR[answers[i]!] : 'bg-red-100 text-red-600 border-red-300'
                } anim-pop`}>
                  {answers[i] === COMPLEMENT[base] ? answers[i] : '✗'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl p-4 ${t.card} flex items-center justify-between`}>
        <div>
          <div className={`text-2xl font-black ${t.heading}`}>{correctCount}/16</div>
          <div className={`text-xs ${t.textMuted}`}>правилни двойки · {score} т.</div>
        </div>
        {done && (
          <div className="text-center anim-pop">
            <div className="text-3xl">{correctCount === 16 ? '🏆' : correctCount >= 12 ? '🎉' : '💪'}</div>
            <button onClick={reset} className={`mt-1 px-4 py-2 rounded-xl font-bold text-white text-sm ${t.primary}`}>Нова игра</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EQUATION BALANCER ───────────────────────────────────────────────────────
type EqSide = Record<string, number>;
interface Equation {
  label: string;
  reactants: { formula: string; elements: EqSide }[];
  products:  { formula: string; elements: EqSide }[];
}

const EQUATIONS: Equation[] = [
  {
    label: 'H₂ + O₂ → H₂O',
    reactants: [{ formula:'H₂', elements:{H:2} }, { formula:'O₂', elements:{O:2} }],
    products:  [{ formula:'H₂O', elements:{H:2,O:1} }],
  },
  {
    label: 'N₂ + H₂ → NH₃',
    reactants: [{ formula:'N₂', elements:{N:2} }, { formula:'H₂', elements:{H:2} }],
    products:  [{ formula:'NH₃', elements:{N:1,H:3} }],
  },
  {
    label: 'Fe + O₂ → Fe₂O₃',
    reactants: [{ formula:'Fe', elements:{Fe:1} }, { formula:'O₂', elements:{O:2} }],
    products:  [{ formula:'Fe₂O₃', elements:{Fe:2,O:3} }],
  },
  {
    label: 'CH₄ + O₂ → CO₂ + H₂O',
    reactants: [{ formula:'CH₄', elements:{C:1,H:4} }, { formula:'O₂', elements:{O:2} }],
    products:  [{ formula:'CO₂', elements:{C:1,O:2} }, { formula:'H₂O', elements:{H:2,O:1} }],
  },
  {
    label: 'Na + Cl₂ → NaCl',
    reactants: [{ formula:'Na', elements:{Na:1} }, { formula:'Cl₂', elements:{Cl:2} }],
    products:  [{ formula:'NaCl', elements:{Na:1,Cl:1} }],
  },
  {
    label: 'CaCO₃ → CaO + CO₂',
    reactants: [{ formula:'CaCO₃', elements:{Ca:1,C:1,O:3} }],
    products:  [{ formula:'CaO', elements:{Ca:1,O:1} }, { formula:'CO₂', elements:{C:1,O:2} }],
  },
];

const CORRECT_COEFFS: number[][] = [
  [2,1,2],[1,3,2],[4,3,2],[1,2,1,2],[2,1,2],[1,1,1],
];

function countAtoms(side: { formula: string; elements: EqSide }[], coeffs: number[]): EqSide {
  const result: EqSide = {};
  side.forEach((s, i) => {
    Object.entries(s.elements).forEach(([el, n]) => {
      result[el] = (result[el] || 0) + n * coeffs[i];
    });
  });
  return result;
}

function isBalanced(eq: Equation, rCoeffs: number[], pCoeffs: number[]): boolean {
  const left = countAtoms(eq.reactants, rCoeffs);
  const right = countAtoms(eq.products, pCoeffs);
  const allEls = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...allEls].every(el => (left[el] || 0) === (right[el] || 0));
}

function EquationBalancer({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [eqIdx, setEqIdx] = useState(0);
  const [solved, setSolved] = useState<boolean[]>(Array(6).fill(false));
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const eq = EQUATIONS[eqIdx];
  const [rCoeffs, setRCoeffs] = useState<number[]>(eq.reactants.map(() => 1));
  const [pCoeffs, setPCoeffs] = useState<number[]>(eq.products.map(() => 1));

  const loadEq = (idx: number) => {
    setEqIdx(idx);
    setRCoeffs(EQUATIONS[idx].reactants.map(() => 1));
    setPCoeffs(EQUATIONS[idx].products.map(() => 1));
    setAttempts(0);
    setConfirmed(false);
  };

  const adj = (side: 'r'|'p', i: number, delta: number) => {
    if (confirmed) return;
    if (side === 'r') setRCoeffs(c => { const n=[...c]; n[i]=Math.max(1,n[i]+delta); return n; });
    else setPCoeffs(c => { const n=[...c]; n[i]=Math.max(1,n[i]+delta); return n; });
  };

  const confirm = () => {
    setAttempts(a => a+1);
    if (isBalanced(eq, rCoeffs, pCoeffs)) {
      const pts = attempts === 0 ? 3 : attempts === 1 ? 2 : 1;
      setScore(s => s + pts);
      setConfirmed(true);
      setSolved(sv => { const n=[...sv]; n[eqIdx]=true; return n; });
      updateXP(pts * 5);
    }
  };

  const left = countAtoms(eq.reactants, rCoeffs);
  const right = countAtoms(eq.products, pCoeffs);
  const allEls = [...new Set([...Object.keys(left), ...Object.keys(right)])];

  const CoeffControl = ({ side, i, val }: { side:'r'|'p'; i:number; val:number }) => (
    <div className="flex flex-col items-center gap-1">
      <button onClick={() => adj(side,i,1)} className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 text-xs font-bold">+</button>
      <span className="text-xl font-black text-white w-8 text-center">{val > 1 ? val : ''}</span>
      <button onClick={() => adj(side,i,-1)} className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 text-xs font-bold">−</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <GameStyles />
      <button onClick={onBack} className={`mb-4 text-sm font-semibold ${t.primaryText} hover:opacity-70`}>← Обратно</button>
      <h2 className={`text-2xl font-black mb-1 ${t.heading}`}>⚗️ Балансирай уравнението</h2>
      <p className={`text-sm ${t.textMuted} mb-4`}>Нагласи коефициентите така, че броят атоми отляво = отдясно</p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {EQUATIONS.map((_, i) => (
          <button key={i} onClick={() => loadEq(i)}
            className={`w-9 h-9 rounded-xl font-bold text-sm transition-all ${
              i === eqIdx ? `${t.primary} text-white` : solved[i] ? 'bg-emerald-100 text-emerald-700' : `${t.card} ${t.text}`
            }`}>
            {solved[i] ? '✓' : i+1}
          </button>
        ))}
        <span className={`ml-auto self-center font-black text-lg ${t.primaryText}`}>{score} т.</span>
      </div>

      <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 p-5 mb-4">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {eq.reactants.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-white/60 font-bold">+</span>}
              <CoeffControl side="r" i={i} val={rCoeffs[i]} />
              <span className="text-white font-black text-lg">{r.formula}</span>
            </div>
          ))}
          <span className="text-white/60 font-bold text-xl">→</span>
          {eq.products.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-white/60 font-bold">+</span>}
              <CoeffControl side="p" i={i} val={pCoeffs[i]} />
              <span className="text-white font-black text-lg">{p.formula}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl p-4 mb-4 ${t.card}`}>
        <div className="text-xs font-semibold mb-2 grid grid-cols-3 text-center">
          <span className={t.textMuted}>Елемент</span>
          <span className="text-blue-500">Ляво</span>
          <span className="text-purple-500">Дясно</span>
        </div>
        {allEls.map(el => {
          const l = left[el]||0; const r = right[el]||0;
          return (
            <div key={el} className={`grid grid-cols-3 text-center py-1 rounded-lg text-sm font-bold ${l===r ? 'text-emerald-500' : 'text-red-500'}`}>
              <span>{el}</span><span>{l}</span><span>{r}</span>
            </div>
          );
        })}
      </div>

      {!confirmed ? (
        <button onClick={confirm}
          className={`w-full py-3 rounded-2xl font-bold text-white transition-all hover:scale-105 active:scale-95 ${t.primary}`}>
          Потвърди
        </button>
      ) : (
        <div className="text-center anim-pop">
          <div className="text-4xl mb-2">🎉</div>
          <p className={`font-bold mb-3 ${t.heading}`}>Балансирано! +{attempts === 0 ? 3 : attempts === 1 ? 2 : 1} т.</p>
          {eqIdx < 5 && (
            <button onClick={() => loadEq(eqIdx+1)}
              className={`px-6 py-3 rounded-2xl font-bold text-white ${t.primary}`}>
              Следващо →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ORGANELLE MAP ────────────────────────────────────────────────────────────
interface Organelle {
  id: string;
  name: string;
  emoji: string;
  fact: string;
  cx: number; cy: number; rx: number; ry: number;
  fill: string; stroke: string;
}

const ORGANELLES: Organelle[] = [
  { id:'nucleus',      name:'Ядро',          emoji:'🔵', fact:'Съдържа ДНК и управлява клетъчната дейност',                cx:200,cy:130,rx:50,ry:40,  fill:'#93c5fd',stroke:'#3b82f6' },
  { id:'mitochondria', name:'Митохондрия',   emoji:'🔴', fact:'Синтезира АТФ чрез клетъчното дишане',                     cx:310,cy:80, rx:38,ry:22,  fill:'#fca5a5',stroke:'#ef4444' },
  { id:'golgi',        name:'Апарат на Голджи',emoji:'🟡',fact:'Модифицира и опакова протеини за секреция',               cx:100,cy:180,rx:45,ry:20,  fill:'#fde68a',stroke:'#f59e0b' },
  { id:'lysosome',     name:'Лизозома',      emoji:'🟣', fact:'Съдържа хидролитични ензими за вътреклетъчно храносмилане',cx:310,cy:180,rx:22,ry:22,  fill:'#d8b4fe',stroke:'#8b5cf6' },
  { id:'er',           name:'Ендоплазмен ретикулум',emoji:'🟢',fact:'Гранулиран ЕР синтезира протеини; гладък — липиди', cx:155,cy:210,rx:55,ry:18,  fill:'#bbf7d0',stroke:'#22c55e' },
  { id:'ribosome',     name:'Рибозома',      emoji:'⚫', fact:'Синтезира протеини; 80S в еукариоти',                      cx:90, cy:120,rx:15,ry:15,  fill:'#6b7280',stroke:'#374151' },
  { id:'vacuole',      name:'Вакуола',       emoji:'🔷', fact:'При растенията централната вакуола поддържа тургора',      cx:265,cy:215,rx:32,ry:28,  fill:'#bae6fd',stroke:'#0ea5e9' },
  { id:'centrosome',   name:'Центрозома',    emoji:'🌟', fact:'Организира митотичното вретено при клетъчното делене',     cx:345,cy:215,rx:20,ry:20,  fill:'#fef08a',stroke:'#eab308' },
];

function OrganelleMap({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [order] = useState(() => shuffle([...ORGANELLES]));
  const [current, setCurrent] = useState(0);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [showFact, setShowFact] = useState<Organelle | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const target = order[current];

  const handleClick = (org: Organelle) => {
    if (found.has(org.id) || done || showFact) return;
    if (org.id === target.id) {
      const newFound = new Set(found).add(org.id);
      setFound(newFound);
      setScore(s => s + 10);
      setShowFact(org);
      updateXP(10);
    } else {
      setWrong(org.id);
      setTimeout(() => setWrong(null), 600);
    }
  };

  const next = () => {
    setShowFact(null);
    if (current + 1 >= order.length) { setDone(true); }
    else { setCurrent(c => c+1); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <GameStyles />
      <button onClick={onBack} className={`mb-4 text-sm font-semibold ${t.primaryText} hover:opacity-70`}>← Обратно</button>
      <h2 className={`text-2xl font-black mb-1 ${t.heading}`}>🔬 Клетъчна карта</h2>

      {!done ? (
        <>
          <div className={`rounded-2xl p-4 mb-4 text-center ${t.card}`}>
            <p className={`text-sm ${t.textMuted} mb-1`}>Намери:</p>
            <p className={`text-xl font-black ${t.heading}`}>{target.emoji} {target.name}</p>
            <p className={`text-xs ${t.textMuted} mt-1`}>{found.size}/{order.length} намерени · {score} т.</p>
          </div>

          <div className={`rounded-2xl overflow-hidden ${t.card} mb-4`}>
            <svg viewBox="0 0 420 270" className="w-full" style={{ maxHeight: 260 }}>
              <ellipse cx="210" cy="140" rx="195" ry="125" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,4" />
              {ORGANELLES.map(org => (
                <g key={org.id} onClick={() => handleClick(org)} className="cursor-pointer">
                  <ellipse
                    cx={org.cx} cy={org.cy} rx={org.rx} ry={org.ry}
                    fill={found.has(org.id) ? org.fill : wrong === org.id ? '#fca5a5' : org.fill + '66'}
                    stroke={found.has(org.id) ? org.stroke : wrong === org.id ? '#ef4444' : org.stroke + '99'}
                    strokeWidth={found.has(org.id) ? 2.5 : 1.5}
                    className="transition-all duration-200"
                    style={{ filter: found.has(org.id) ? 'drop-shadow(0 0 4px ' + org.stroke + '88)' : undefined }}
                  />
                  {found.has(org.id) && (
                    <text x={org.cx} y={org.cy+4} textAnchor="middle" fontSize="10" fontWeight="bold" fill={org.stroke}>{org.emoji}</text>
                  )}
                </g>
              ))}
            </svg>
          </div>

          {showFact && (
            <div className="rounded-2xl p-4 bg-emerald-50 border-2 border-emerald-200 anim-pop mb-4">
              <div className="text-2xl mb-1">{showFact.emoji} ✅</div>
              <p className="font-black text-emerald-800 mb-1">{showFact.name}</p>
              <p className="text-sm text-emerald-700">{showFact.fact}</p>
              <button onClick={next} className="mt-3 px-5 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all">
                {current + 1 >= order.length ? '🏁 Финал' : 'Следващ →'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={`rounded-2xl p-6 text-center ${t.card} anim-pop`}>
          <div className="text-5xl mb-3">🏆</div>
          <p className={`text-2xl font-black mb-2 ${t.heading}`}>{score} точки!</p>
          <p className={`${t.textMuted} mb-4`}>Намери всички {order.length} органели!</p>
          <button onClick={() => { setFound(new Set()); setCurrent(0); setScore(0); setDone(false); setShowFact(null); }}
            className={`px-6 py-3 rounded-2xl font-bold text-white ${t.primary}`}>Нова игра</button>
        </div>
      )}
    </div>
  );
}

// ─── GAMES MENU ───────────────────────────────────────────────────────────────
const gameList = [
  {
    id: 'speed',
    title: 'Бърз кръг',
    desc: '60 сек · максимум въпроси · серии за бонус',
    emoji: '⚡',
    gradient: 'from-yellow-400 to-orange-500',
    shadow: 'shadow-orange-200/40',
  },
  {
    id: 'truefalse',
    title: 'Вярно / Грешно',
    desc: '45 сек · бърза преценка на твърдения',
    emoji: '⚡🧠',
    gradient: 'from-green-400 to-teal-500',
    shadow: 'shadow-green-200/40',
  },
  {
    id: 'flashcard',
    title: 'Флашкарти',
    desc: 'Обърни картата · Знам / Уча',
    emoji: '🃏',
    gradient: 'from-purple-400 to-pink-500',
    shadow: 'shadow-purple-200/40',
  },
  {
    id: 'memory',
    title: 'Памет',
    desc: 'Намери всички двойки термин–определение',
    emoji: '🧠',
    gradient: 'from-blue-400 to-cyan-500',
    shadow: 'shadow-blue-200/40',
  },
  {
    id: 'matching',
    title: 'Свържи термините',
    desc: 'Свържи всеки термин с правилното определение',
    emoji: '🧩',
    gradient: 'from-rose-400 to-pink-500',
    shadow: 'shadow-rose-200/40',
  },
  {
    id: 'riddle',
    title: 'Кой съм аз?',
    desc: '5 рунда · улики → познай термина · отговори рано за повече точки',
    emoji: '🔍',
    gradient: 'from-violet-500 to-indigo-600',
    shadow: 'shadow-violet-200/40',
  },
  {
    id: 'dna',
    title: 'ДНК Строител',
    desc: 'Избери комплементарните бази · A↔T · G↔C',
    emoji: '🧬',
    gradient: 'from-pink-500 to-rose-600',
    shadow: 'shadow-pink-200/40',
  },
  {
    id: 'balancer',
    title: 'Балансирай уравнението',
    desc: '6 химични уравнения · нагласи коефициентите',
    emoji: '⚗️',
    gradient: 'from-indigo-500 to-purple-600',
    shadow: 'shadow-indigo-200/40',
  },
  {
    id: 'organelle',
    title: 'Клетъчна карта',
    desc: 'Намери органелите в клетката · научи функциите им',
    emoji: '🔬',
    gradient: 'from-teal-400 to-emerald-500',
    shadow: 'shadow-teal-200/40',
  },
] as const;

export default function GamesPage() {
  const { t } = useTheme();
  const [game, setGame] = useState<GameType>('menu');

  if (game === 'speed') return <AppShell><SpeedRound onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'matching') return <AppShell><MatchingGame onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'truefalse') return <AppShell><TrueFalseBlitz onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'flashcard') return <AppShell><FlashcardFlip onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'memory') return <AppShell><MemoryMatch onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'riddle') return <AppShell><RiddleGame onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'dna') return <AppShell><DNABuilder onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'balancer') return <AppShell><EquationBalancer onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'organelle') return <AppShell><OrganelleMap onBack={() => setGame('menu')} /></AppShell>;

  return (
    <AppShell>
      <GameStyles />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-black ${t.heading}`}>Игри 🎮</h1>
          <p className={`mt-1 ${t.textMuted}`}>9 начина да учиш докато се забавляваш</p>
        </div>

        <div className="space-y-4">
          {gameList.map((g, i) => (
            <button
              key={g.id}
              onClick={() => setGame(g.id as GameType)}
              className={`w-full rounded-3xl p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.99] ${t.card} ${t.cardHover} anim-slide-up shadow-sm hover:shadow-md`}
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${g.gradient} flex items-center justify-center text-3xl shadow-lg ${g.shadow} flex-shrink-0`}>
                  {g.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className={`text-xl font-black ${t.heading}`}>{g.title}</h2>
                  <p className={`text-sm ${t.textMuted} mt-0.5`}>{g.desc}</p>
                </div>
                <span className={`text-xl ${t.textMuted} flex-shrink-0`}>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
