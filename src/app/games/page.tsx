'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import AppShell from '@/components/AppShell';

const Operation3D = dynamic(() => import('@/components/Operation3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white/60 animate-spin" />
        <span className="text-white/40 text-sm">Зареждане…</span>
      </div>
    </div>
  ),
});
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { questions, tfStatements, flashCards, riddles, Riddle } from '@/lib/data/questions';

type GameType = 'menu' | 'speed' | 'matching' | 'truefalse' | 'flashcard' | 'memory' | 'riddle' | 'dna' | 'balancer' | 'organelle' | 'drugs' | 'immune' | 'operation' | 'cranial' | 'synapse' | 'brainlobes' | 'neurotransmitter' | 'brainpaths';

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

// ─── DRUGS & RECEPTORS ───────────────────────────────────────────────────────
const DRUG_PAIRS = [
  { drug: 'Аспирин',       mechanism: 'COX инхибитор',       emoji: '💊', desc: 'НПВС — необратимо инхибира COX-1/COX-2, намалява простагландините' },
  { drug: 'Метформин',     mechanism: 'AMPK активатор',      emoji: '💉', desc: 'Антидиабетик — намалява чернодробната глюконеогенеза' },
  { drug: 'Адреналин',     mechanism: 'β₁/α рецептор',       emoji: '⚡', desc: 'Катехоламин — увеличава СЧ и АН, избор при анафилаксия' },
  { drug: 'Атропин',       mechanism: 'М-холинорецептор',    emoji: '👁', desc: 'Антагонист — блокира парасимпатиковите ефекти (мидриаза, тахикардия)' },
  { drug: 'Морфин',        mechanism: 'μ-опиоиден рецептор', emoji: '😴', desc: 'Опиоид — мощен аналгетик с риск от зависимост и депресия на ДЦ' },
  { drug: 'Амоксицилин',   mechanism: 'PBP протеини',        emoji: '🔬', desc: 'β-лактамен антибиотик — инхибира синтеза на пептидогликан' },
  { drug: 'Аторвастатин',  mechanism: 'HMG-CoA редуктаза',   emoji: '❤️', desc: 'Статин — намалява синтеза на холестерол в черния дроб' },
  { drug: 'Метотрексат',   mechanism: 'DHFR инхибитор',      emoji: '🧬', desc: 'Антиметаболит — блокира синтеза на тетрахидрофолат' },
  { drug: 'Лозартан',      mechanism: 'AT₁ рецептор',        emoji: '🫀', desc: 'АРБ — блокира ангиотензин II рецепторите, антихипертензивен' },
  { drug: 'Омепразол',     mechanism: 'H⁺/K⁺ АТФаза',        emoji: '🍽', desc: 'PPI — необратимо инхибира стомашната протонна помпа' },
];

function DrugReceptorGame({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [pairs, setPairs] = useState<typeof DRUG_PAIRS>([]);
  const [drugs, setDrugs] = useState<string[]>([]);
  const [mechs, setMechs] = useState<string[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [lastDesc, setLastDesc] = useState<string | null>(null);

  const start = () => {
    const sel = shuffle(DRUG_PAIRS).slice(0, 6);
    setPairs(sel);
    setDrugs(shuffle(sel.map(p => p.drug)));
    setMechs(shuffle(sel.map(p => p.mechanism)));
    setMatched([]); setSelectedDrug(null); setWrong(null);
    setMoves(0); setScore(0); setConfetti(false); setLastDesc(null);
    setPhase('playing');
  };

  const handleMech = (mech: string) => {
    if (!selectedDrug || matched.includes(selectedDrug)) return;
    setMoves(m => m + 1);
    const pair = pairs.find(p => p.drug === selectedDrug);
    if (pair?.mechanism === mech) {
      const nm = [...matched, selectedDrug];
      setMatched(nm);
      setScore(s => s + Math.max(1, 4 - Math.floor(moves / 2)));
      setLastDesc(pair.desc);
      setSelectedDrug(null);
      if (nm.length === pairs.length) { setPhase('done'); setConfetti(true); updateXP(score * 5 + 30); }
    } else {
      setWrong(mech);
      setTimeout(() => { setWrong(null); setSelectedDrug(null); }, 700);
    }
  };

  if (phase !== 'playing') return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {confetti && <Confetti />}
      <GameStyles />
      <button onClick={onBack} className={`text-sm mb-6 ${t.textMuted}`}>← Обратно</button>
      <div className={`rounded-3xl p-8 text-center ${t.card} anim-slide-up`}>
        <div className="text-6xl mb-4">💊</div>
        <h2 className={`text-3xl font-black mb-2 ${t.heading}`}>Лекарства & Рецептори</h2>
        <p className={`${t.textMuted} mb-6`}>Свържи всяко лекарство с неговия механизъм на действие. 6 двойки.</p>
        {phase === 'done' && (
          <div className="mb-6 space-y-1">
            <div className="text-3xl font-black text-green-500 anim-pop">🎉 Завърши!</div>
            <div className={`text-sm ${t.textMuted}`}>{moves} хода</div>
          </div>
        )}
        <button onClick={start} className={`w-full py-4 rounded-2xl font-bold text-white text-lg hover:scale-105 ${t.primary}`}>
          {phase === 'done' ? '🔄 Нова игра' : '💊 Стартирай'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <GameStyles />
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className={`text-sm ${t.textMuted}`}>← Обратно</button>
        <span className={`text-xs font-bold ${t.textMuted}`}>{matched.length}/{pairs.length} · {moves} хода</span>
      </div>

      {lastDesc && (
        <div className="mb-3 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 anim-slide-up font-medium">
          ✅ {lastDesc}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${t.textMuted}`}>Лекарство</div>
          {drugs.map(drug => {
            const pair = pairs.find(p => p.drug === drug);
            const isMatched = matched.includes(drug);
            const isSelected = selectedDrug === drug;
            return (
              <button key={drug} onClick={() => !isMatched && setSelectedDrug(drug)} disabled={isMatched}
                className={`w-full p-3 rounded-xl text-sm font-semibold text-left transition-all border-2 anim-slide-up flex items-center gap-2 ${
                  isMatched ? `${t.correct} opacity-60` :
                  isSelected ? `${t.primary} text-white border-transparent scale-105` :
                  `${t.card} ${t.text} border-transparent ${t.cardHover}`
                }`}>
                <span>{pair?.emoji}</span>
                <span>{drug}</span>
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${t.textMuted}`}>Механизъм</div>
          {mechs.map(mech => {
            const matchedDrug = pairs.find(p => p.mechanism === mech)?.drug;
            const isMatched = matchedDrug ? matched.includes(matchedDrug) : false;
            const isWrong = wrong === mech;
            return (
              <button key={mech} onClick={() => handleMech(mech)} disabled={isMatched || !selectedDrug}
                className={`w-full p-3 rounded-xl text-sm font-semibold text-left transition-all border-2 anim-slide-up ${
                  isMatched ? `${t.correct} opacity-60` :
                  isWrong ? `${t.wrong} anim-shake` :
                  selectedDrug ? `${t.card} ${t.text} border-transparent hover:scale-[1.02] ${t.cardHover}` :
                  `${t.card} ${t.text} border-transparent opacity-50`
                }`}>
                {mech}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── IMMUNE DEFENSE ───────────────────────────────────────────────────────────
interface Enemy {
  id: number; x: number; hp: number; maxHp: number;
  type: 'bacteria' | 'virus' | 'fungus';
  speed: number;
}
interface Defender {
  slot: number; type: 'neutrophil' | 'macrophage' | 'tcell';
  lastAttack: number;
}

const DEF_TYPES = {
  neutrophil: { emoji: '🔵', name: 'Неутрофил',  range: 80,  dmg: 12, rate: 900,  cost: 40,  color: '#3b82f6' },
  macrophage: { emoji: '🟠', name: 'Макрофаг',   range: 110, dmg: 35, rate: 2200, cost: 100, color: '#f97316' },
  tcell:      { emoji: '🟢', name: 'T-клетка',   range: 130, dmg: 22, rate: 1600, cost: 70,  color: '#22c55e' },
} as const;
type DefType = keyof typeof DEF_TYPES;

const ENEMY_TYPES_DEF = {
  bacteria: { emoji: '🦠', name: 'Бактерия', hp: 50,  speed: 38, reward: 10, color: '#ef4444' },
  virus:    { emoji: '🔴', name: 'Вирус',    hp: 90,  speed: 55, reward: 15, color: '#8b5cf6' },
  fungus:   { emoji: '⚫', name: 'Гъбичка',  hp: 140, speed: 22, reward: 20, color: '#78716c' },
};

const WAVES_DEF = [
  ['bacteria','bacteria','bacteria','bacteria','bacteria'],
  ['bacteria','bacteria','virus','bacteria','virus','bacteria'],
  ['virus','bacteria','fungus','virus','bacteria','fungus','virus'],
] as const;

// Slot x positions (10 slots along top row + 10 bottom row)
const SLOT_XS = [50, 100, 155, 210, 265, 320, 375];
const PATH_Y  = 135;
const CANVAS_W = 420, CANVAS_H = 270;

function ImmuneDefense({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    enemies: [] as Enemy[],
    defenders: [] as Defender[],
    gold: 120, lives: 10, score: 0,
    wave: 0, spawned: 0, spawnTimer: 0,
    phase: 'setup' as 'setup' | 'fighting' | 'won' | 'lost',
    time: 0,
  });
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const eidRef = useRef(0);
  const [ui, setUi] = useState({ gold: 120, lives: 10, score: 0, wave: 0, phase: 'setup' as string });
  const [selDef, setSelDef] = useState<DefType>('neutrophil');
  const [slotMap, setSlotMap] = useState<Record<number, DefType>>({});

  const syncUi = () => {
    const s = stateRef.current;
    setUi({ gold: s.gold, lives: s.lives, score: s.score, wave: s.wave, phase: s.phase });
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const s = stateRef.current;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Path
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, PATH_Y);
    ctx.lineTo(CANVAS_W, PATH_Y);
    ctx.stroke();

    // Slot indicators
    for (let row = 0; row < 2; row++) {
      const sy = row === 0 ? 55 : 215;
      SLOT_XS.forEach((sx, i) => {
        const slotId = row * 10 + i;
        const def = s.defenders.find(d => d.slot === slotId);
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.fillStyle = def ? DEF_TYPES[def.type].color + '33' : '#1e293b';
        ctx.fill();
        ctx.strokeStyle = def ? DEF_TYPES[def.type].color : '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();
        if (def) {
          ctx.font = '16px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(DEF_TYPES[def.type].emoji, sx, sy);
        }
      });
    }

    // Enemies
    s.enemies.forEach(e => {
      const et = ENEMY_TYPES_DEF[e.type];
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(et.emoji, e.x, PATH_Y);
      // HP bar
      const bw = 28, bh = 4;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(e.x - bw/2, PATH_Y - 20, bw, bh);
      ctx.fillStyle = e.hp > e.maxHp * 0.5 ? '#22c55e' : e.hp > e.maxHp * 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(e.x - bw/2, PATH_Y - 20, bw * (e.hp / e.maxHp), bh);
    });

    // Attack beams
    s.defenders.forEach(def => {
      const dt = DEF_TYPES[def.type];
      const row = def.slot < 10 ? 0 : 1;
      const idx = def.slot % 10;
      const sx = SLOT_XS[idx], sy = row === 0 ? 55 : 215;
      const target = s.enemies.find(e => Math.abs(e.x - sx) < dt.range);
      if (target && (Date.now() - def.lastAttack) < 200) {
        ctx.strokeStyle = dt.color + '88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(target.x, PATH_Y);
        ctx.stroke();
      }
    });
  }, []);

  const gameLoop = useCallback((ts: number) => {
    const dt = Math.min((ts - lastRef.current) / 1000, 0.1);
    lastRef.current = ts;
    const s = stateRef.current;
    if (s.phase !== 'fighting') return;

    // Spawn enemies
    s.spawnTimer += dt;
    const wave = WAVES_DEF[s.wave] as readonly string[];
    const interval = 1.8 - s.wave * 0.3;
    if (s.spawned < wave.length && s.spawnTimer >= interval) {
      s.spawnTimer = 0;
      const type = wave[s.spawned] as keyof typeof ENEMY_TYPES_DEF;
      const et = ENEMY_TYPES_DEF[type];
      s.enemies.push({ id: eidRef.current++, x: -20, hp: et.hp, maxHp: et.hp, type, speed: et.speed });
      s.spawned++;
    }

    // Move enemies
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const e = s.enemies[i];
      e.x += e.speed * dt;
      if (e.x > CANVAS_W + 20) {
        s.enemies.splice(i, 1);
        s.lives--;
        if (s.lives <= 0) { s.phase = 'lost'; syncUi(); draw(); return; }
      }
    }

    // Attack
    const now = Date.now();
    s.defenders.forEach(def => {
      const dt2 = DEF_TYPES[def.type];
      if (now - def.lastAttack < dt2.rate) return;
      const row = def.slot < 10 ? 0 : 1;
      const idx = def.slot % 10;
      const sx = SLOT_XS[idx];
      const target = s.enemies.find(e => Math.abs(e.x - sx) < dt2.range);
      if (target) {
        target.hp -= dt2.dmg;
        def.lastAttack = now;
        if (target.hp <= 0) {
          s.gold += ENEMY_TYPES_DEF[target.type].reward;
          s.score += ENEMY_TYPES_DEF[target.type].reward;
          s.enemies.splice(s.enemies.indexOf(target), 1);
        }
      }
    });

    // Wave done?
    if (s.spawned >= wave.length && s.enemies.length === 0) {
      if (s.wave < WAVES_DEF.length - 1) {
        s.wave++;
        s.spawned = 0;
        s.spawnTimer = 0;
        s.phase = 'setup';
      } else {
        s.phase = 'won';
        updateXP(s.score + 50);
      }
      syncUi(); draw(); return;
    }

    draw();
    syncUi();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [draw, updateXP]);

  const startWave = () => {
    stateRef.current.phase = 'fighting';
    lastRef.current = performance.now();
    syncUi();
    rafRef.current = requestAnimationFrame(gameLoop);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scale = CANVAS_W / rect.width;
    const cx = (e.clientX - rect.left) * scale;
    const cy = (e.clientY - rect.top) * scale;

    for (let row = 0; row < 2; row++) {
      const sy = row === 0 ? 55 : 215;
      SLOT_XS.forEach((sx, i) => {
        if (Math.hypot(cx - sx, cy - sy) < 22) {
          const slotId = row * 10 + i;
          const s = stateRef.current;
          if (s.defenders.find(d => d.slot === slotId)) return;
          const cost = DEF_TYPES[selDef].cost;
          if (s.gold >= cost) {
            s.gold -= cost;
            s.defenders.push({ slot: slotId, type: selDef, lastAttack: 0 });
            setSlotMap(m => ({ ...m, [slotId]: selDef }));
            syncUi();
            draw();
          }
        }
      });
    }
  };

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const waveNames = ['Вълна 1 — Бактерии', 'Вълна 2 — Бактерии + Вируси', 'Вълна 3 — Всички видове'];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <GameStyles />
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className={`text-sm ${t.textMuted}`}>← Обратно</button>
        <span className={`text-sm font-black ${t.heading}`}>🦠 Имунна отбрана</span>
        <div className="flex gap-3 text-sm font-bold">
          <span className="text-amber-500">💰{ui.gold}</span>
          <span className="text-red-500">❤️{ui.lives}</span>
          <span className={t.primaryText}>⚡{ui.score}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="rounded-2xl overflow-hidden mb-3 touch-none">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full cursor-pointer"
          onClick={handleCanvasClick}
        />
      </div>

      {ui.phase === 'won' && (
        <div className={`rounded-2xl p-5 text-center ${t.card} anim-pop mb-3`}>
          <div className="text-4xl mb-2">🏆</div>
          <div className={`font-black text-xl ${t.heading}`}>Спечели! {ui.score} точки</div>
          <button onClick={onBack} className={`mt-3 px-6 py-2 rounded-xl font-bold text-white ${t.primary}`}>← Меню</button>
        </div>
      )}

      {ui.phase === 'lost' && (
        <div className={`rounded-2xl p-5 text-center ${t.card} anim-pop mb-3`}>
          <div className="text-4xl mb-2">💔</div>
          <div className={`font-black text-xl ${t.heading}`}>Инфекцията се разпространи!</div>
          <button onClick={onBack} className={`mt-3 px-6 py-2 rounded-xl font-bold text-white ${t.primary}`}>← Меню</button>
        </div>
      )}

      {(ui.phase === 'setup') && (
        <div className={`rounded-2xl px-4 py-3 mb-3 ${t.card} text-center`}>
          <div className={`text-sm font-bold ${t.heading} mb-2`}>{waveNames[ui.wave]}</div>
          <button onClick={startWave}
            className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:scale-105 transition-all shadow-lg">
            ▶ Старт на вълната
          </button>
        </div>
      )}

      {/* Defender selector */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(DEF_TYPES) as DefType[]).map(type => {
          const d = DEF_TYPES[type];
          return (
            <button key={type} onClick={() => setSelDef(type)}
              className={`flex-1 p-2.5 rounded-xl text-xs font-bold transition-all border-2 min-w-0 ${
                selDef === type ? 'border-transparent text-white shadow-lg' : `${t.card} ${t.text} border-transparent ${t.cardHover}`
              }`}
              style={selDef === type ? { background: d.color } : {}}>
              <div className="text-lg mb-0.5">{d.emoji}</div>
              <div className="truncate">{d.name}</div>
              <div className={`${selDef === type ? 'opacity-80' : t.textMuted} font-normal`}>💰{d.cost}</div>
            </button>
          );
        })}
      </div>
      <p className={`text-xs text-center mt-2 ${t.textMuted}`}>Кликни върху слот (кръгче) за да поставиш клетка</p>
    </div>
  );
}

// ─── OPERATION GAME 3D ───────────────────────────────────────────────────────
const OP_CASES = [
  {
    id: 'appendix' as const, name: 'Апендектомия', emoji: '🩹',
    gradient: 'from-emerald-500 to-teal-700',
    bg: '#021a12',
    symptoms: ['🌡 Температура 38.8°C', '📍 Болка в дясна долна квадрант', '✅ Симптом на Блумберг (+)'],
    organs: [{ name: 'Апендикс', emoji: '🩹', ok: true }, { name: 'Далак', emoji: '🫀', ok: false }, { name: 'Черен дроб', emoji: '🟤', ok: false }, { name: 'Жлъчен мехур', emoji: '🟡', ok: false }],
    fact: 'Апендицитът е най-честата хирургична спешност — засяга 7% от хората.',
    xp: 80,
  },
  {
    id: 'heart' as const, name: 'Байпас операция', emoji: '🫀',
    gradient: 'from-red-500 to-rose-800',
    bg: '#2a0808',
    symptoms: ['💔 ЕКГ: ST-елевация в II, III, aVF', '🩸 Тропонин: 4.2 ng/mL ↑↑', '😰 Болка с иррадиация в лявата ръка'],
    organs: [{ name: 'Сърце', emoji: '🫀', ok: true }, { name: 'Бял дроб', emoji: '🫁', ok: false }, { name: 'Аорта', emoji: '🔴', ok: false }, { name: 'Перикард', emoji: '🟠', ok: false }],
    fact: 'ИМА настъпва при оклузия на коронарна артерия — всяка минута унищожава 2 млн. кардиомиоцита.',
    xp: 100,
  },
  {
    id: 'kidney' as const, name: 'Нефректомия', emoji: '🫘',
    gradient: 'from-violet-500 to-purple-900',
    bg: '#160828',
    symptoms: ['🔴 Хематурия (кръв в урината)', '📡 Ехография: маса 4.5 cm', '⚖️ Загуба на тегло 6 kg / 3 месеца'],
    organs: [{ name: 'Бъбрек', emoji: '🫘', ok: true }, { name: 'Надбъбрек', emoji: '🟣', ok: false }, { name: 'Пикочен мехур', emoji: '🔵', ok: false }, { name: 'Далак', emoji: '🟤', ok: false }],
    fact: 'Бъбречноклетъчният карцином (RCC) е 90% от бъбречните тумори при възрастни.',
    xp: 90,
  },
] as const;

type OpCase  = typeof OP_CASES[number];
type OpPhase = 'case-select' | 'diagnosis' | 'surgery3d' | 'result';

function OperationGame({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [selCase,    setSelCase]    = useState<OpCase | null>(null);
  const [phase,      setPhase]      = useState<OpPhase>('case-select');
  const [surgScore,  setSurgScore]  = useState(0);
  const [xpFinal,    setXpFinal]    = useState(0);
  const [diagErr,    setDiagErr]    = useState(0);
  const [diagFlash,  setDiagFlash]  = useState<'ok' | 'bad' | null>(null);
  const [confetti,   setConfetti]   = useState(false);

  const startCase = (c: OpCase) => {
    setSelCase(c); setPhase('diagnosis'); setSurgScore(0); setDiagErr(0); setXpFinal(0);
  };

  const handleDiagAnswer = (ok: boolean) => {
    if (diagFlash) return;
    if (ok) {
      setDiagFlash('ok');
      setTimeout(() => { setDiagFlash(null); setPhase('surgery3d'); }, 700);
    } else {
      setDiagErr(e => e + 1);
      setDiagFlash('bad');
      setTimeout(() => setDiagFlash(null), 500);
    }
  };

  const handleSurgeryDone = useCallback((score: number) => {
    setSurgScore(score);
    setPhase('result');
  }, []);

  // Award XP when result phase is reached — run once per result
  useEffect(() => {
    if (phase === 'result' && selCase) {
      const xp = Math.max(10, Math.round(surgScore / 100 * selCase.xp) - diagErr * 5);
      setXpFinal(xp);
      updateXP(xp);
      setConfetti(xp > 60);
    }
    // intentionally depends only on phase so it fires once when entering result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const bg   = selCase?.bg       ?? '#030712';
  const grad = selCase?.gradient ?? 'from-emerald-500 to-teal-700';

  // ── Case select ──────────────────────────────────────────────────────────────
  if (phase === 'case-select') return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <GameStyles />
      <button onClick={onBack} className={`text-sm mb-5 ${t.textMuted}`}>← Обратно</button>
      <h2 className={`text-2xl font-black mb-1 ${t.heading}`}>🔬 3D Операционна зала</h2>
      <p className={`text-sm ${t.textMuted} mb-5`}>Диагностика + 3D хирургична симулация</p>
      <div className="space-y-3">
        {OP_CASES.map(c => (
          <button key={c.id} onClick={() => startCase(c)}
            className={`w-full p-5 rounded-2xl text-left bg-gradient-to-r ${c.gradient} text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg anim-slide-up`}>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{c.emoji}</span>
              <div>
                <div className="font-black text-lg">{c.name}</div>
                <div className="text-white/70 text-xs mt-0.5">до {c.xp} XP · 3D хирургия</div>
              </div>
              <span className="ml-auto text-2xl">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Diagnosis ─────────────────────────────────────────────────────────────
  if (phase === 'diagnosis') return (
    <div className="max-w-lg mx-auto px-4 py-4" style={{ minHeight: '100vh', background: bg }}>
      <GameStyles />
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-white/50 text-sm">← Изход</button>
        <div className="flex-1 flex gap-1 mx-2">
          {['Диагноза', '3D Хирургия'].map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/20'}`} />
          ))}
        </div>
        <span className="text-white/50 text-xs">1/2</span>
      </div>
      <div className={`rounded-2xl p-4 mb-4`} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="text-white/60 text-xs font-bold uppercase mb-2">Симптоми на пациента</div>
        {selCase!.symptoms.map(s => <div key={s} className="text-white text-sm py-1">{s}</div>)}
      </div>
      <div className="text-white/70 text-sm font-bold mb-3">Кой орган е засегнат?</div>
      <div className="grid grid-cols-2 gap-3">
        {shuffle([...selCase!.organs]).map(o => (
          <button key={o.name} onClick={() => handleDiagAnswer(o.ok)}
            className={`p-4 rounded-2xl font-bold text-center transition-all hover:scale-[1.03] active:scale-[0.97] ${
              diagFlash === 'ok' && o.ok   ? 'bg-green-500 text-white scale-105' :
              diagFlash === 'bad' && !o.ok ? 'bg-red-500/50 text-white anim-shake' :
              'bg-white/10 text-white hover:bg-white/20'
            }`}>
            <div className="text-3xl mb-1">{o.emoji}</div>
            <div className="text-sm">{o.name}</div>
          </button>
        ))}
      </div>
      {diagErr > 0 && <p className="text-red-400 text-xs text-center mt-3">❌ {diagErr} грешни опита</p>}
    </div>
  );

  // ── 3D Surgery ────────────────────────────────────────────────────────────
  if (phase === 'surgery3d') return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column' }}>
      <GameStyles />
      {/* Slim header */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0">
        <button onClick={onBack} className="text-white/50 text-sm">← Изход</button>
        <div className="flex-1 flex gap-1 mx-2">
          {['Диагноза', '3D Хирургия'].map((s, i) => (
            <div key={s} className="flex-1 h-1.5 rounded-full bg-white" />
          ))}
        </div>
        <span className="text-white/50 text-xs">2/2</span>
      </div>
      <div className="text-center text-white/40 text-xs pb-2">
        Намери и кликни 5-те рани върху 3D модела
      </div>
      {/* 3D viewer fills remaining space */}
      <div className="flex-1" style={{ minHeight: 340 }}>
        <Operation3D
          caseId={selCase!.id}
          bg={bg}
          onDone={handleSurgeryDone}
        />
      </div>
    </div>
  );

  // ── Result ───────────────────────────────────────────────────────────────
  // Guard: selCase must be set to reach result phase
  if (!selCase) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-8" style={{ minHeight: '100vh', background: bg }}>
      {confetti && <Confetti />}
      <GameStyles />
      <div className="text-center">
        <div className="text-6xl mb-3">{surgScore >= 80 ? '🏆' : surgScore >= 50 ? '👍' : '💪'}</div>
        <h2 className="text-white font-black text-2xl mb-1">Операцията завърши!</h2>
        <div className={`text-5xl font-black bg-gradient-to-r ${grad} bg-clip-text text-transparent mb-2 anim-pop`}>
          {surgScore}%
        </div>
        <div className="text-white/60 text-sm mb-5">+{xpFinal} XP · {selCase.name}</div>
        <div className="space-y-2 mb-5 max-w-xs mx-auto">
          <div className="flex justify-between items-center px-4 py-2 rounded-xl bg-white/5 text-sm text-white">
            <span>🔍 Диагноза</span>
            <span className="font-bold">{diagErr === 0 ? '✅ Перфектно' : `❌ ${diagErr} грешки`}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2 rounded-xl bg-white/5 text-sm text-white">
            <span>🔬 3D Хирургия</span>
            <span className="font-bold">{surgScore}%</span>
          </div>
        </div>
        <div className="text-white/50 text-xs px-4 py-3 rounded-2xl bg-white/5 mb-5 text-left">
          📚 {selCase.fact}
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setPhase('case-select'); setSelCase(null); }}
            className="flex-1 py-3 rounded-2xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all">
            ← Избери случай
          </button>
          <button onClick={() => startCase(selCase)}
            className={`flex-1 py-3 rounded-2xl font-bold text-white bg-gradient-to-r ${grad} hover:scale-105 transition-all shadow-lg`}>
            🔄 Повтори
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CRANIAL NERVE CHALLENGE ─────────────────────────────────────────────────
interface CranialNerve {
  num: string;
  name: string;
  latin: string;
  func: string;
}

const CRANIAL_NERVES: CranialNerve[] = [
  { num: 'I',    name: 'Обонятелен',         latin: 'Olfactory',          func: 'Отговаря за обонянието' },
  { num: 'II',   name: 'Зрителен',           latin: 'Optic',              func: 'Отговаря за зрението' },
  { num: 'III',  name: 'Окулемоторен',       latin: 'Oculomotor',         func: 'Движение на очните ябълки (4 мускула), акомодация, зенична реакция' },
  { num: 'IV',   name: 'Трохлеарен',         latin: 'Trochlear',          func: 'Инервира m. obliquus superior — завъртане на окото надолу и навътре' },
  { num: 'V',    name: 'Тригеминален',       latin: 'Trigeminal',         func: 'Сетивност на лицето (3 клона) и дъвкателни мускули' },
  { num: 'VI',   name: 'Абдуцентен',         latin: 'Abducens',           func: 'Инервира m. rectus lateralis — отвеждане на окото навън' },
  { num: 'VII',  name: 'Лицев',              latin: 'Facial',             func: 'Мимически мускули, вкус (предни 2/3 на езика), слюнчени жлези' },
  { num: 'VIII', name: 'Вестибулокохлеарен', latin: 'Vestibulocochlear',  func: 'Слух и равновесие' },
  { num: 'IX',   name: 'Глософарингеален',   latin: 'Glossopharyngeal',   func: 'Вкус (задна 1/3 на езика), гълтане, паротидна жлеза' },
  { num: 'X',    name: 'Вагусов',            latin: 'Vagus',              func: 'Парасимпатик за гръден кош и корем, гласни струни, гълтане' },
  { num: 'XI',   name: 'Аксесорен',          latin: 'Accessory',          func: 'Инервира m. sternocleidomastoideus и m. trapezius' },
  { num: 'XII',  name: 'Хипоглосен',         latin: 'Hypoglossal',        func: 'Всички мускули на езика (движение при говор и гълтане)' },
];

function buildCranialQuestion(pool: CranialNerve[]): { nerve: CranialNerve; options: CranialNerve[] } {
  const nerve = pool[Math.floor(Math.random() * pool.length)];
  const distractors = shuffle(CRANIAL_NERVES.filter(n => n.num !== nerve.num)).slice(0, 3);
  const options = shuffle([nerve, ...distractors]);
  return { nerve, options };
}

function CranialNerveChallenge({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'countdown' | 'playing' | 'done'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [qKey, setQKey] = useState(0);
  const [current, setCurrent] = useState<{ nerve: CranialNerve; options: CranialNerve[] }>(() => buildCranialQuestion(CRANIAL_NERVES));
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [revealed, setRevealed] = useState<CranialNerve | null>(null);
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
    if (timeLeft <= 0) { setPhase('done'); updateXP(score * 10); return; }
    const id = setTimeout(() => setTimeLeft(x => x - 1), 1000);
    return () => clearTimeout(id);
  });

  const handleAnswer = useCallback((option: CranialNerve) => {
    if (phase !== 'playing' || feedback) return;
    const isCorrect = option.num === current.nerve.num;
    setTotal(x => x + 1);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setRevealed(current.nerve);
    if (isCorrect) {
      const ns = streak + 1;
      const mult = ns >= 3 ? 2 : 1;
      setScore(s => s + 10 * mult);
      setStreak(ns);
      setBestStreak(bs => Math.max(bs, ns));
    } else {
      setStreak(0);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setRevealed(null);
      setQKey(k => k + 1);
      setCurrent(buildCranialQuestion(CRANIAL_NERVES));
    }, 1400);
  }, [phase, feedback, current, streak]);

  const start = () => {
    setPhase('countdown');
    setCountdown(3);
    setTimeLeft(60);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotal(0);
    setQKey(0);
    setCurrent(buildCranialQuestion(CRANIAL_NERVES));
    setFeedback(null);
    setRevealed(null);
  };

  if (phase === 'idle' || phase === 'done') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <GameStyles />
        <button onClick={onBack} className={`text-sm mb-6 ${t.textMuted} hover:${t.primaryText} transition-colors`}>← Обратно</button>
        <div className={`rounded-3xl p-8 text-center ${t.card} anim-slide-up`}>
          <div className="text-6xl mb-4">🧠</div>
          <h2 className={`text-3xl font-black mb-2 ${t.heading}`}>Черепни нерви</h2>
          <p className={`${t.textMuted} mb-6`}>60 секунди. Прочети функцията и познай черепния нерв (I–XII). Серия от 3+ дава 2× XP!</p>
          {phase === 'done' && (
            <div className="mb-6 space-y-2">
              <div className={`text-5xl font-black bg-gradient-to-r ${t.xpBar} bg-clip-text text-transparent anim-pop`}>{score}</div>
              <div className={`text-sm ${t.textMuted}`}>{total} отговора · Най-дълга серия: {bestStreak}</div>
              <div className={`text-sm font-bold ${t.primaryText}`}>+{score * 10} XP спечелени</div>
            </div>
          )}
          <button onClick={start} className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 ${t.primary} shadow-lg`}>
            {phase === 'done' ? '🔄 Играй отново' : '🧠 Старт!'}
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
          className={`h-2 rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-purple-600'}`}
          style={{ width: `${(timeLeft / 60) * 100}%` }}
        />
      </div>

      <div
        key={`q-${qKey}`}
        className={`rounded-3xl p-6 mb-5 anim-slide-up ${feedback === 'correct' ? t.correct : feedback === 'wrong' ? t.wrong : t.card}`}
      >
        <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${t.textMuted}`}>Какъв е черепният нерв?</div>
        <p className={`text-lg font-bold leading-relaxed ${t.heading}`}>{current.nerve.func}</p>
        {revealed && (
          <div className="mt-3 pt-3 border-t border-white/10 anim-slide-up">
            <span className="text-sm font-black text-violet-400">{revealed.num} — {revealed.name}</span>
            <span className={`text-xs ml-2 ${t.textMuted}`}>({revealed.latin})</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {current.options.map((opt, idx) => (
          <button
            key={opt.num}
            onClick={() => handleAnswer(opt)}
            disabled={!!feedback}
            className={`p-4 rounded-2xl font-semibold text-sm transition-all active:scale-95 hover:scale-[1.03] anim-slide-up ${
              feedback && opt.num === current.nerve.num
                ? 'bg-green-500 text-white border-2 border-green-400'
                : feedback && opt.num !== current.nerve.num
                ? `${t.card} ${t.text} opacity-40 border-2 border-transparent`
                : `${t.card} ${t.text} border-2 border-transparent ${t.cardHover}`
            }`}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <span className={`block text-xs mb-1 font-black text-violet-500`}>{opt.num}</span>
            <span className="block font-bold">{opt.name}</span>
            <span className={`block text-[10px] ${t.textMuted} mt-0.5`}>{opt.latin}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SYNAPSE BUILDER ─────────────────────────────────────────────────────────
interface SynapseScenario {
  name: string;
  neurotransmitter: string;
  color: string;
}

const SYNAPSE_STEPS = [
  'Акционен потенциал пристига в пресинаптичния терминал',
  'Калциеви канали (Ca²⁺) се отварят',
  'Ca²⁺ навлиза в терминала',
  'Синаптичните везикули се сливат с мембраната',
  'Невротрансмитерите се освобождават в синаптичната цепнатина',
  'НТ се свързват с постсинаптичните рецептори',
  'Постсинаптичен потенциал (EPSP или IPSP)',
  'НТ се разграждат или реабсорбират (рецикличен транспорт)',
];

const SYNAPSE_SCENARIOS: SynapseScenario[] = [
  { name: 'Ацетилхолин синапс',  neurotransmitter: 'Ацетилхолин (ACh)',  color: 'from-blue-500 to-cyan-600' },
  { name: 'Допаминов синапс',     neurotransmitter: 'Допамин (DA)',        color: 'from-purple-500 to-violet-600' },
  { name: 'ГАМК-ергичен синапс',  neurotransmitter: 'ГАМК (GABA)',         color: 'from-emerald-500 to-teal-600' },
];

function SynapseBuilder({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'countdown' | 'playing' | 'done'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(90);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [confetti, setConfetti] = useState(false);

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

  const start = (sIdx?: number) => {
    const idx = sIdx ?? 0;
    setScenarioIdx(idx);
    setShuffled(shuffle([...SYNAPSE_STEPS]));
    setPlaced([]);
    setWrongIdx(null);
    setScore(0);
    setConfetti(false);
    setTimeLeft(90);
    setPhase('countdown');
    setCountdown(3);
  };

  const handleStepClick = (step: string) => {
    if (phase !== 'playing') return;
    const expectedIdx = placed.length;
    if (SYNAPSE_STEPS[expectedIdx] === step) {
      const newPlaced = [...placed, step];
      setPlaced(newPlaced);
      setWrongIdx(null);
      const pts = 5 + Math.floor(timeLeft / 10);
      setScore(s => s + pts);
      if (newPlaced.length === SYNAPSE_STEPS.length) {
        setPhase('done');
        setConfetti(true);
        updateXP(score + pts + 30);
      }
    } else {
      const idx = shuffled.indexOf(step);
      setWrongIdx(idx);
      setScore(s => Math.max(0, s - 2));
      setTimeout(() => setWrongIdx(null), 600);
    }
  };

  if (phase === 'idle' || phase === 'done') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        {confetti && <Confetti />}
        <GameStyles />
        <button onClick={onBack} className={`text-sm mb-6 ${t.textMuted}`}>← Обратно</button>
        <div className={`rounded-3xl p-8 text-center ${t.card} anim-slide-up`}>
          <div className="text-6xl mb-4">⚡</div>
          <h2 className={`text-3xl font-black mb-2 ${t.heading}`}>Синапс Билдер</h2>
          <p className={`${t.textMuted} mb-6`}>Подреди 8-те стъпки на синаптичното предаване в правилния ред. Кликни стъпките последователно!</p>
          {phase === 'done' && (
            <div className="mb-5 space-y-2">
              <div className={`text-5xl font-black bg-gradient-to-r ${t.xpBar} bg-clip-text text-transparent anim-pop`}>{score}</div>
              <div className={`text-sm ${t.textMuted}`}>точки · +{score + 30} XP</div>
              {confetti && <div className="text-green-500 font-black">🎉 Перфектно! Всички стъпки наред!</div>}
            </div>
          )}
          <div className="space-y-2 mb-5">
            <div className={`text-xs font-bold uppercase tracking-wider ${t.textMuted} mb-2`}>Избери сценарий:</div>
            {SYNAPSE_SCENARIOS.map((sc, i) => (
              <button key={i} onClick={() => start(i)}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-white text-sm bg-gradient-to-r ${sc.color} hover:scale-105 transition-all`}>
                {sc.name} — {sc.neurotransmitter}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'countdown') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <GameStyles />
        <div key={countdown} className={`text-9xl font-black anim-pop ${t.heading}`}>{countdown || '⚡'}</div>
      </div>
    );
  }

  const scenario = SYNAPSE_SCENARIOS[scenarioIdx];

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <GameStyles />
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className={`font-black text-xl ${t.heading}`}>⚡{score}</span>
          <span className={`ml-2 text-xs ${t.textMuted}`}>{placed.length}/8 стъпки</span>
        </div>
        <span className={`text-2xl font-black tabular-nums ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : t.primaryText}`}>
          {timeLeft}s
        </span>
      </div>

      <div className={`h-2 rounded-full mb-4 ${t.progressBg}`}>
        <div className={`h-2 rounded-full transition-all duration-1000 bg-gradient-to-r ${timeLeft <= 10 ? 'from-red-500 to-red-600' : scenario.color}`}
          style={{ width: `${(timeLeft / 90) * 100}%` }} />
      </div>

      <div className={`rounded-2xl px-4 py-2 mb-4 bg-gradient-to-r ${scenario.color} text-white text-sm font-bold text-center`}>
        {scenario.name} · {scenario.neurotransmitter}
      </div>

      {placed.length > 0 && (
        <div className={`rounded-2xl p-3 mb-4 ${t.card} space-y-1`}>
          <div className={`text-xs font-bold uppercase tracking-wider ${t.textMuted} mb-2`}>Вече наредени:</div>
          {placed.map((s, i) => (
            <div key={i} className="flex gap-2 items-start anim-slide-up">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <span className={`text-xs ${t.text}`}>{s}</span>
            </div>
          ))}
        </div>
      )}

      <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${t.textMuted}`}>
        Следваща стъпка #{placed.length + 1} — кликни правилната:
      </div>
      <div className="space-y-2">
        {shuffled.filter(s => !placed.includes(s)).map((step, i) => {
          const isWrong = wrongIdx === shuffled.indexOf(step);
          return (
            <button key={step} onClick={() => handleStepClick(step)}
              className={`w-full p-3 rounded-xl text-sm font-medium text-left transition-all border-2 anim-slide-up ${
                isWrong
                  ? `${t.wrong} anim-shake border-red-400`
                  : `${t.card} ${t.text} border-transparent ${t.cardHover} hover:scale-[1.01]`
              }`}
              style={{ animationDelay: `${i * 0.03}s` }}>
              {step}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── BRAIN LOBE IDENTIFIER ────────────────────────────────────────────────────
interface BrainLobeQuestion {
  question: string;
  lobe: string;
  explanation: string;
}

const BRAIN_LOBE_OPTIONS = [
  'Фронтален дял', 'Париетален дял', 'Темпорален дял',
  'Окципитален дял', 'Малък мозък', 'Мозъчен ствол',
];

const BRAIN_LOBE_QUESTIONS: BrainLobeQuestion[] = [
  { question: 'Планиране, вземане на решения и личност', lobe: 'Фронтален дял', explanation: 'Префронталната кора е отговорна за изпълнителните функции.' },
  { question: 'Зона на Брока — продукция на реч', lobe: 'Фронтален дял', explanation: 'Зона на Брока (поле 44/45 на Бродман) е в долния фронтален гирус.' },
  { question: 'Работна памет и краткосрочна памет', lobe: 'Фронтален дял', explanation: 'Дорзолатералната префронтална кора поддържа работната памет.' },
  { question: 'Първична моторна кора — произволни движения', lobe: 'Фронтален дял', explanation: 'Прецентралният гирус съдържа моторния хомункулус.' },
  { question: 'Сетивност на кожата, болка и температура', lobe: 'Париетален дял', explanation: 'Постцентралният гирус е първичната соматосетивна кора.' },
  { question: 'Пространствена ориентация и навигация', lobe: 'Париетален дял', explanation: 'Десният париетален дял е ключов за пространствено осъзнаване.' },
  { question: 'Герстман синдром: акалкулия, аграфия, пръстова агнозия', lobe: 'Париетален дял', explanation: 'Герстман синдромът настъпва при лезия на ляв долен париетален лобул.' },
  { question: 'Слух и разбиране на реч', lobe: 'Темпорален дял', explanation: 'Първичната слухова кора е в Хешловите извивки (Sylvian gyri).' },
  { question: 'Зона на Вернике — разбиране на реч', lobe: 'Темпорален дял', explanation: 'Зона на Вернике е в задния горен темпорален гирус.' },
  { question: 'Дългосрочна памет и хипокамп', lobe: 'Темпорален дял', explanation: 'Хипокампът е в медиалния темпорален лоб и консолидира памет.' },
  { question: 'Разпознаване на лица (прозопагнозия при увреда)', lobe: 'Темпорален дял', explanation: 'Fusiform face area е в инферо-темпоралната кора.' },
  { question: 'Зрение, визуална обработка', lobe: 'Окципитален дял', explanation: 'Калкаринната фисура съдържа V1 (първична зрителна кора).' },
  { question: 'Зрителна агнозия — вижда, но не разпознава обекти', lobe: 'Окципитален дял', explanation: 'Зрителната агнозия настъпва при увреда на асоциативна зрителна кора.' },
  { question: 'Хомонимна хемианопсия след инсулт', lobe: 'Окципитален дял', explanation: 'Засягането на зрителна кора дава противоположностранна зрителна загуба.' },
  { question: 'Координация на движенията, фина моторика', lobe: 'Малък мозък', explanation: 'Малкият мозък сравнява замислено и изпълнено движение.' },
  { question: 'Атаксия, нистагъм и дизартрия при увреда', lobe: 'Малък мозък', explanation: 'Класическа триада при увреда на малкия мозък (вермис или хемисфери).' },
  { question: 'Равновесие и постурален рефлекс', lobe: 'Малък мозък', explanation: 'Флокулонодуларен лоб обработва вестибуларна информация.' },
  { question: 'Дишане и сърдечна честота (жизнено важни центрове)', lobe: 'Мозъчен ствол', explanation: 'Медулата съдържа дихателния и кардиоваскуларния център.' },
  { question: 'Черепни нерви III–XII излизат оттук', lobe: 'Мозъчен ствол', explanation: 'Мозъчният ствол (средния мозък, мост, медула) е изходна точка на ЧН III–XII.' },
  { question: 'Ретикуларна формация — будност и съзнание', lobe: 'Мозъчен ствол', explanation: 'Ascending reticular activating system (ARAS) поддържа будността.' },
  { question: 'Засягане: загуба на болка и температура ипсилатерално на лицето + контралатерално на тялото', lobe: 'Мозъчен ствол', explanation: 'Синдром на Валенберг (латерален мозъчно-стволов инфаркт) — PICA.' },
  { question: 'Музикална памет и разпознаване на мелодии', lobe: 'Темпорален дял', explanation: 'Дясната темпорална кора е доминантна за музикална обработка.' },
  { question: 'Лунатизъм и агресия при увреда на тази структура', lobe: 'Фронтален дял', explanation: 'Орбитофронталната кора регулира импулс-контрол и поведение.' },
  { question: 'Кортикобулбарни и кортикоспинални пътища преминават оттук', lobe: 'Мозъчен ствол', explanation: 'Пирамидите на медулата съдържат низходящите моторни пътища.' },
  { question: 'Цветно зрение и зрителна пространствена обработка', lobe: 'Окципитален дял', explanation: 'Зрителните асоциативни зони V2–V5 са в окципиталния и части от теменния дял.' },
  { question: 'Алексия и аграфия (четене и писане)', lobe: 'Париетален дял', explanation: 'Ъгловият гирус (angular gyrus) в долния париетален лобул медиира грамотността.' },
  { question: 'Хемиплегия след инсулт на вътрешна капсула', lobe: 'Фронтален дял', explanation: 'Кортикоспиналните влакна от моторната кора пресичат в пирамидите и засягат контралатерални крайници.' },
  { question: 'Слухова халюцинация при епилепсия', lobe: 'Темпорален дял', explanation: 'Темпорален епилептичен фокус може да дава слухови или обонятелни халюцинации.' },
  { question: 'Интенционен тремор (по-силен в края на движение)', lobe: 'Малък мозък', explanation: 'Дисметрията и интенционният тремор са класически церебеларни знаци.' },
  { question: 'Окомоторни нарушения: диплопия и нистагъм при увреда', lobe: 'Мозъчен ствол', explanation: 'Ядрата на ЧН III, IV и VI са в мозъчния ствол.' },
];

function BrainLobeIdentifier({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'countdown' | 'playing' | 'done'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [pool, setPool] = useState<BrainLobeQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; answer: string; explanation: string } | null>(null);
  const [qKey, setQKey] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const TOTAL = 20;

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const id = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(id);
    }
    if (phase === 'countdown' && countdown === 0) setPhase('playing');
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      const wasCorrect = feedback?.ok;
      setPhase('done');
      updateXP((correct + (wasCorrect ? 1 : 0)) * 10);
      return;
    }
    const id = setTimeout(() => setTimeLeft(x => x - 1), 1000);
    return () => clearTimeout(id);
  });

  const start = () => {
    const q = shuffle([...BRAIN_LOBE_QUESTIONS]).slice(0, TOTAL);
    setPool(q);
    setCurrent(0);
    setTimeLeft(45);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrect(0);
    setFeedback(null);
    setQKey(0);
    setConfetti(false);
    setPhase('countdown');
    setCountdown(3);
  };

  const handleAnswer = useCallback((lobe: string) => {
    if (phase !== 'playing' || feedback) return;
    const q = pool[current];
    const isCorrect = lobe === q.lobe;
    setFeedback({ ok: isCorrect, answer: q.lobe, explanation: q.explanation });
    if (isCorrect) {
      const ns = streak + 1;
      const pts = 10 * (ns >= 3 ? 2 : 1);
      setScore(s => s + pts);
      setCorrect(c => c + 1);
      setStreak(ns);
      setBestStreak(bs => Math.max(bs, ns));
    } else {
      setStreak(0);
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setFeedback(null);
      setQKey(k => k + 1);
      setTimeLeft(45);
      if (current + 1 >= pool.length) {
        setPhase('done');
        setConfetti(true);
        updateXP(correct * 10 + (isCorrect ? 10 : 0));
      } else {
        setCurrent(c => c + 1);
      }
    }, 1500);
  }, [phase, feedback, pool, current, streak, correct]);

  if (phase === 'idle' || phase === 'done') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        {confetti && <Confetti />}
        <GameStyles />
        <button onClick={onBack} className={`text-sm mb-6 ${t.textMuted}`}>← Обратно</button>
        <div className={`rounded-3xl p-8 text-center ${t.card} anim-slide-up`}>
          <div className="text-6xl mb-4">🧠</div>
          <h2 className={`text-3xl font-black mb-2 ${t.heading}`}>Мозъчни Дялове</h2>
          <p className={`${t.textMuted} mb-6`}>20 въпроса · 45 сек на въпрос. Прочети функцията и познай кой мозъчен дял/структура е отговорна!</p>
          {phase === 'done' && (
            <div className="mb-6 space-y-2">
              <div className={`text-5xl font-black bg-gradient-to-r ${t.xpBar} bg-clip-text text-transparent anim-pop`}>{correct}/{TOTAL}</div>
              <div className={`text-sm ${t.textMuted}`}>правилни · Серия: {bestStreak} · Точки: {score}</div>
              <div className={`text-sm font-bold ${t.primaryText}`}>+{correct * 10} XP спечелени</div>
            </div>
          )}
          <button onClick={start} className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 ${t.primary} shadow-lg`}>
            {phase === 'done' ? '🔄 Играй отново' : '🧠 Старт!'}
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

  const q = pool[current];

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <GameStyles />
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3 items-center">
          <span className={`font-black text-xl ${t.heading}`}>⚡{score}</span>
          {streak >= 3 && <span className="text-orange-400 font-bold text-sm anim-pop">🔥×{streak}</span>}
        </div>
        <span className={`text-sm font-bold ${t.textMuted}`}>{current + 1}/{TOTAL}</span>
        <span className={`text-2xl font-black tabular-nums ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : t.primaryText}`}>
          {timeLeft}s
        </span>
      </div>

      <div className={`h-2 rounded-full mb-5 ${t.progressBg}`}>
        <div className={`h-2 rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-fuchsia-600'}`}
          style={{ width: `${(timeLeft / 45) * 100}%` }} />
      </div>

      <div key={`q-${qKey}`}
        className={`rounded-3xl p-6 mb-5 anim-slide-up min-h-[110px] flex flex-col justify-center ${feedback ? (feedback.ok ? t.correct : t.wrong) : t.card}`}>
        <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${t.textMuted}`}>Кой мозъчен дял/структура?</div>
        <p className={`text-lg font-bold leading-relaxed ${t.heading}`}>{q.question}</p>
      </div>

      {feedback && (
        <div className={`rounded-2xl px-4 py-3 mb-4 text-sm anim-slide-up ${feedback.ok ? t.correct : t.wrong}`}>
          <div className="font-black mb-1">{feedback.ok ? `✅ ${feedback.answer}!` : `❌ Правилно: ${feedback.answer}`}</div>
          <div className={t.text}>{feedback.explanation}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {BRAIN_LOBE_OPTIONS.map((lobe, i) => (
          <button key={lobe} onClick={() => handleAnswer(lobe)} disabled={!!feedback}
            className={`p-3 rounded-xl text-sm font-bold transition-all active:scale-95 hover:scale-[1.02] border-2 anim-slide-up ${
              feedback && lobe === q.lobe ? 'bg-green-500 text-white border-green-400 scale-105' :
              feedback && lobe !== q.lobe ? `${t.card} ${t.text} border-transparent opacity-40` :
              `${t.card} ${t.text} border-transparent ${t.cardHover}`
            }`}
            style={{ animationDelay: `${i * 0.04}s` }}>
            {lobe}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── NEUROTRANSMITTER PATHS ───────────────────────────────────────────────────
interface NTPair {
  nt: string;
  role: string;
  region: string;
  receptor: string;
  deficit: string;
  emoji: string;
}

const NT_PAIRS: NTPair[] = [
  { nt: 'Допамин',       role: 'Награда / мотивация', region: 'Стриатум',                  receptor: 'D1/D2 рецептори',         deficit: 'Дефицит → Паркинсон',            emoji: '🎯' },
  { nt: 'Серотонин',     role: 'Настроение / сън',    region: 'Рафеови ядра',               receptor: '5-HT рецептори',           deficit: 'Дефицит → депресия',             emoji: '😊' },
  { nt: 'ГАМК',          role: 'Инхибиция',           region: 'Широко в ЦНС',              receptor: 'GABA-A / GABA-B',          deficit: 'Дефицит → епилепсия',            emoji: '🔵' },
  { nt: 'Глутамат',      role: 'Възбуждане',          region: 'Широко в ЦНС',              receptor: 'NMDA / AMPA',              deficit: 'Излишък → ексайтотоксичност',     emoji: '⚡' },
  { nt: 'Ацетилхолин',   role: 'Памет / моторика',   region: 'Базални ганглии',            receptor: 'Никотинови / Мускаринови', deficit: 'Дефицит → Алцхаймер',            emoji: '🧠' },
  { nt: 'Норадреналин',  role: 'Бдителност',          region: 'Locus coeruleus',            receptor: 'α / β адренорецептори',    deficit: 'Дефицит → депресия / ADHD',      emoji: '👁' },
  { nt: 'Ендорфини',     role: 'Болкоуспокояване',   region: 'Широко в ЦНС',              receptor: 'Опиоидни μ рецептори',     deficit: 'Блокирани от налоксон',          emoji: '😴' },
  { nt: 'Хистамин',      role: 'Бдителност / будност',region: 'Tuberomammillary nucleus',  receptor: 'H1 / H2 рецептори',        deficit: 'Блокиране → сънливост',          emoji: '⏰' },
  { nt: 'Окситоцин',     role: 'Социална свързаност', region: 'Хипоталамус',               receptor: 'Окситоцинови рецептори',   deficit: 'Роля в доверие / привързаност',  emoji: '❤️' },
  { nt: 'Мелатонин',     role: 'Циркаден ритъм',     region: 'Епифиза',                   receptor: 'Мелатонинови рецептори',   deficit: 'Регулира сън / събуждане',       emoji: '🌙' },
];

function NeurotransmitterGame({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [pairs, setPairs] = useState<NTPair[]>([]);
  const [nts, setNts] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedNt, setSelectedNt] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [lastInfo, setLastInfo] = useState<NTPair | null>(null);

  const start = () => {
    const sel = shuffle(NT_PAIRS).slice(0, 6);
    setPairs(sel);
    setNts(shuffle(sel.map(p => p.nt)));
    setRoles(shuffle(sel.map(p => p.role)));
    setMatched([]); setSelectedNt(null); setWrong(null);
    setMoves(0); setScore(0); setConfetti(false); setLastInfo(null);
    setPhase('playing');
  };

  const handleRole = (role: string) => {
    if (!selectedNt || matched.includes(selectedNt)) return;
    setMoves(m => m + 1);
    const pair = pairs.find(p => p.nt === selectedNt);
    if (pair?.role === role) {
      const nm = [...matched, selectedNt];
      setMatched(nm);
      setScore(s => s + Math.max(1, 5 - Math.floor(moves / 3)));
      setLastInfo(pair);
      setSelectedNt(null);
      if (nm.length === pairs.length) { setPhase('done'); setConfetti(true); updateXP(score * 5 + 40); }
    } else {
      setWrong(role);
      setTimeout(() => { setWrong(null); setSelectedNt(null); }, 700);
    }
  };

  if (phase !== 'playing') return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {confetti && <Confetti />}
      <GameStyles />
      <button onClick={onBack} className={`text-sm mb-6 ${t.textMuted}`}>← Обратно</button>
      <div className={`rounded-3xl p-8 text-center ${t.card} anim-slide-up`}>
        <div className="text-6xl mb-4">🧠</div>
        <h2 className={`text-3xl font-black mb-2 ${t.heading}`}>Невротрансмитерни Пътища</h2>
        <p className={`${t.textMuted} mb-6`}>Свържи всеки невротрансмитер с неговата основна роля. 6 двойки на игра.</p>
        {phase === 'done' && (
          <div className="mb-6 space-y-1">
            <div className="text-3xl font-black text-green-500 anim-pop">🎉 Завърши!</div>
            <div className={`text-sm ${t.textMuted}`}>{moves} хода · {score} точки</div>
          </div>
        )}
        <button onClick={start} className={`w-full py-4 rounded-2xl font-bold text-white text-lg hover:scale-105 transition-all ${t.primary}`}>
          {phase === 'done' ? '🔄 Нова игра' : '🧠 Стартирай'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <GameStyles />
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className={`text-sm ${t.textMuted}`}>← Обратно</button>
        <span className={`text-xs font-bold ${t.textMuted}`}>{matched.length}/{pairs.length} · {moves} хода</span>
      </div>

      {lastInfo && (
        <div className="mb-3 px-4 py-3 rounded-2xl bg-violet-50 border border-violet-200 dark:bg-violet-900/20 dark:border-violet-800 anim-slide-up">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{lastInfo.emoji}</span>
            <span className="font-black text-violet-700 dark:text-violet-300 text-sm">{lastInfo.nt}</span>
          </div>
          <div className="text-xs text-violet-600 dark:text-violet-400 space-y-0.5">
            <div>📍 <b>Регион:</b> {lastInfo.region}</div>
            <div>🔗 <b>Рецептор:</b> {lastInfo.receptor}</div>
            <div>⚠️ {lastInfo.deficit}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${t.textMuted}`}>Невротрансмитер</div>
          {nts.map(nt => {
            const pair = pairs.find(p => p.nt === nt);
            const isMatched = matched.includes(nt);
            const isSelected = selectedNt === nt;
            return (
              <button key={nt} onClick={() => !isMatched && setSelectedNt(nt)} disabled={isMatched}
                className={`w-full p-3 rounded-xl text-sm font-semibold text-left transition-all border-2 anim-slide-up flex items-center gap-2 ${
                  isMatched ? `${t.correct} opacity-60` :
                  isSelected ? `${t.primary} text-white border-transparent scale-105` :
                  `${t.card} ${t.text} border-transparent ${t.cardHover}`
                }`}>
                <span>{pair?.emoji}</span>
                <span>{nt}</span>
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${t.textMuted}`}>Основна роля</div>
          {roles.map(role => {
            const matchedNt = pairs.find(p => p.role === role)?.nt;
            const isMatched = matchedNt ? matched.includes(matchedNt) : false;
            const isWrong = wrong === role;
            return (
              <button key={role} onClick={() => handleRole(role)} disabled={isMatched || !selectedNt}
                className={`w-full p-3 rounded-xl text-sm font-semibold text-left transition-all border-2 anim-slide-up ${
                  isMatched ? `${t.correct} opacity-60` :
                  isWrong ? `${t.wrong} anim-shake` :
                  selectedNt ? `${t.card} ${t.text} border-transparent hover:scale-[1.02] ${t.cardHover}` :
                  `${t.card} ${t.text} border-transparent opacity-50`
                }`}>
                {role}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── NEURAL PATHWAY TRACER ────────────────────────────────────────────────────
interface PathwayQuestion {
  scenario: string;
  options: string[];
  correct: string;
  explanation: string;
}

const PATHWAY_QUESTIONS: PathwayQuestion[] = [
  {
    scenario: 'Пациент има слабост на десния крак и ръка след инсулт в лявата мозъчна хемисфера. Кой тракт е засегнат?',
    options: ['Десен кортикоспинален тракт', 'Ляв кортикоспинален тракт', 'Спиноталамичен тракт', 'Дорзални колони'],
    correct: 'Ляв кортикоспинален тракт',
    explanation: 'Пирамидалните влакна декусират в медулата — ляв кортикоспинален тракт контролира десните крайници.',
  },
  {
    scenario: 'Загуба на болка и температура вдясно на тялото + слабост вляво. Кой синдром?',
    options: ['Синдром на Браун-Секар', 'Синдром на Валенберг', 'Централен мозъчен синдром', 'Таламичен синдром'],
    correct: 'Синдром на Браун-Секар',
    explanation: 'Браун-Секар: хемисекция на гръбначен мозък — ипсилатерална слабост + контралатерална загуба на болка/температура.',
  },
  {
    scenario: 'Атаксия при ходене, нистагъм и дизартрия. Кой е засегнат?',
    options: ['Малък мозък', 'Базални ганглии', 'Таламус', 'Фронтален дял'],
    correct: 'Малък мозък',
    explanation: 'Класическата церебеларна триада: атаксия, нистагъм, интенционен тремор и дизартрия.',
  },
  {
    scenario: 'Пациент губи усещане за допир и проприоцепция в левия крак. Кой е засегнат?',
    options: ['Ляв дорзален сноп (Гол и Бурдах)', 'Десен дорзален сноп (Гол и Бурдах)', 'Ляв спиноталамичен тракт', 'Десен кортикоспинален тракт'],
    correct: 'Ляв дорзален сноп (Гол и Бурдах)',
    explanation: 'Дорзалните снопове пренасят проприоцепция и фин допир ипсилатерално до медулата, след което декусират.',
  },
  {
    scenario: 'Пациент с ригидност, тремор в покой и брадикинезия. Кой невронален тракт/верига е засегнат?',
    options: ['Нигростриатален допаминов път', 'Кортикоспинален тракт', 'Спиноцеребеларен тракт', 'Вестибулоспинален тракт'],
    correct: 'Нигростриатален допаминов път',
    explanation: 'Паркинсон е резултат от дегенерация на допаминергичните неврони в substantia nigra → стриатум.',
  },
  {
    scenario: 'Остра загуба на зрение в едното око + спастична парапареза на краката. Кой е засегнат?',
    options: ['Множествена склероза (зрителен нерв + гръбначен мозък)', 'Таламичен инсулт', 'Синдром на Браун-Секар', 'Латерален медуларен синдром'],
    correct: 'Множествена склероза (зрителен нерв + гръбначен мозък)',
    explanation: 'Неврит на зрителния нерв + спинална демиелинизация е класическа презентация на МС (увреда разделена в пространство и времe).',
  },
  {
    scenario: '"Заключен синдром" (locked-in): тетраплегия, запазено вертикално движение на очите. Кое ниво е засегнато?',
    options: ['Вентрален мост', 'Медула', 'Среден мозък', 'С1 гръбначен мозък'],
    correct: 'Вентрален мост',
    explanation: 'Двустранна лезия на вентралния мост унищожава кортикоспинални и кортикобулбарни пътища, спестявайки ARAS и вертикалния поглед.',
  },
  {
    scenario: 'Зрителна загуба в горния десен квадрант (горна дясна квадрантанопсия). Кое е засегнато?',
    options: ['Ляв темпорален радиаций', 'Ляв париетален радиаций', 'Дясна зрителна кора', 'Оптична хиазма'],
    correct: 'Ляв темпорален радиаций',
    explanation: 'Зрителните лъчения от долната ретина (горен зрителен квадрант) минават през темпоралния дял (пътека на Мейер).',
  },
  {
    scenario: 'Двустранна загуба на темпоралните полузрителни полета (битемпорална хемианопсия). Кое е засегнато?',
    options: ['Оптична хиазма (средата)', 'Лява зрителна кора', 'Оптичен тракт', 'Зрителни лъчения'],
    correct: 'Оптична хиазма (средата)',
    explanation: 'Кръстосването на назалните влакна в хиазмата е засегнато — класически знак за хипофизен аденом.',
  },
  {
    scenario: 'Неспособност за формиране на нова дългосрочна памет при запазена работна памет. Кое е засегнато?',
    options: ['Хипокамп (двустранно)', 'Амигдала', 'Префронтална кора', 'Таламус'],
    correct: 'Хипокамп (двустранно)',
    explanation: 'Двустранно увреждане на хипокампа причинява антероградна амнезия (случай H.M. е класическият пример).',
  },
  {
    scenario: 'Пациент не може да произведе реч, разбира я добре. Зона/регион засегнат?',
    options: ['Зона на Брока (фронтален дял)', 'Зона на Вернике (темпорален дял)', 'Arcuate fasciculus', 'Угловият гирус'],
    correct: 'Зона на Брока (фронтален дял)',
    explanation: 'Брокова афазия: не-флуентна реч с добро разбиране — лезия в долния фронтален гирус на доминантната хемисфера.',
  },
  {
    scenario: 'Пациент говори флуентно, но не разбира реч (несмислена реч). Кое е засегнато?',
    options: ['Зона на Вернике (темпорален дял)', 'Зона на Брока', 'Фронтален дял', 'Arcuate fasciculus'],
    correct: 'Зона на Вернике (темпорален дял)',
    explanation: 'Вернике афазия: флуентна, но несмислена реч (неологизми) с лошо разбиране — задна горна темпорална кора.',
  },
  {
    scenario: 'Пациентът повтаря думи перфектно, но не може да назове предмети, не разбира. Кое е засегнато?',
    options: ['Arcuate fasciculus', 'Зона на Вернике', 'Зона на Брока', 'Хипокамп'],
    correct: 'Arcuate fasciculus',
    explanation: 'Проводникова афазия: нарушено повтаряне при запазено разбиране и флуентна реч — увреда на arcuate fasciculus.',
  },
  {
    scenario: 'Интенционен тремор (тремор нараства при приближаване към цел), дисметрия. Кое е засегнато?',
    options: ['Зъбчато ядро на малкия мозък', 'Базални ганглии', 'Substantia nigra', 'Лентикуларно ядро'],
    correct: 'Зъбчато ядро на малкия мозък',
    explanation: 'Дентаталното ядро (nucleus dentatus) е изходното ядро на малкия мозък и медиира финото коригиране на движенията.',
  },
  {
    scenario: 'Хореиформени движения и деменция при млад пациент с фамилна история. Кой е засегнат?',
    options: ['Стриатум (каудатно ядро)', 'Малък мозък', 'Кортикоспинален тракт', 'Хипокамп'],
    correct: 'Стриатум (каудатно ядро)',
    explanation: 'Болест на Хънтингтън: загуба на ГАМК-ергични неврони в каудатното ядро и путамен → хорея.',
  },
  {
    scenario: 'Рефлексна дъга: лезия на алфа-мотоневрон (долен мотоневрон). Какво очакваме?',
    options: ['Вяла парализа, хипотония, фасцикулации, арефлексия', 'Спастична парализа, хиперрефлексия, Бабински (+)', 'Хорея и ригидност', 'Атаксия и нистагъм'],
    correct: 'Вяла парализа, хипотония, фасцикулации, арефлексия',
    explanation: 'ДМН увреда дава вяла парализа (LMN признаци) — обратното на горния моторен неврон (UMN).',
  },
  {
    scenario: 'Увреда на горния мотоневрон (UMN). Какъв тип парализа и рефлекси?',
    options: ['Спастична парализа, хиперрефлексия, симптом на Бабински (+)', 'Вяла парализа, хипотония, фасцикулации', 'Тремор в покой, ригидност', 'Атаксия, интенционен тремор'],
    correct: 'Спастична парализа, хиперрефлексия, симптом на Бабински (+)',
    explanation: 'UMN увреда освобождава рефлекторната дъга от кортикална инхибиция → спазъм, хиперрефлексия, (+) Бабински.',
  },
  {
    scenario: 'Пациент след инсулт на таламуса: постоянна нетърпима болка в контралатералната половина. Кой синдром?',
    options: ['Таламичен болков синдром (Дежерин-Руси)', 'Синдром на Браун-Секар', 'Централен болков синдром от медула', 'Синдром на Валенберг'],
    correct: 'Таламичен болков синдром (Дежерин-Руси)',
    explanation: 'Таламичен инсулт може да причини централна постинсултна болка (Дежерин-Руси) — тежка, дифузна, трудна за лечение.',
  },
  {
    scenario: 'Синдром на Хорнер: птоза, миоза, анхидроза. Кой е засегнат?',
    options: ['Симпатикусов път (от хипоталамус → гръбначен мозък → горен цервикален ганглий)', 'Зрителен нерв', 'Окулемоторен нерв (III)', 'Вестибулокохлеарен нерв (VIII)'],
    correct: 'Симпатикусов път (от хипоталамус → гръбначен мозък → горен цервикален ганглий)',
    explanation: 'Хорнер синдром: прекъсване на симпатиковия тригенон (хипоталамус → Т1 → горен ганглий → очни симпатикови влакна).',
  },
  {
    scenario: 'Загуба на болка и температура в дерматомите на тялото (двустранно), запазена проприоцепция. Кое е засегнато?',
    options: ['Антериорна комисура (спиноталамичните кръстове)', 'Дорзални снопове', 'Кортикоспинален тракт', 'Вестибулоспинален тракт'],
    correct: 'Антериорна комисура (спиноталамичните кръстове)',
    explanation: 'При сирингомиелия централната кухина в гръбначния мозък засяга антериорната комисура — загуба на болка/температура, запазен допир.',
  },
  {
    scenario: 'Пациент след падане: слабост и нарушена чувствителност двустранно под нивото на лезията, задни мускули на врата болни. Ниво?',
    options: ['Пълна напречна лезия на гръбначния мозък', 'Синдром на Браун-Секар', 'Централен мозъчен синдром', 'Ядрена офталмоплегия'],
    correct: 'Пълна напречна лезия на гръбначния мозък',
    explanation: 'Пълна напречна лезия: загуба на всички функции (моторни, сетивни, автономни) под нивото на увредата.',
  },
  {
    scenario: 'Пациент с диплопия при поглед вляво: дясното око не се движи навън. Кой черепен нерв?',
    options: ['Десен абдуцентен нерв (VI)', 'Десен окулемоторен нерв (III)', 'Ляв трохлеарен нерв (IV)', 'Ляв абдуцентен нерв (VI)'],
    correct: 'Десен абдуцентен нерв (VI)',
    explanation: 'ЧН VI инервира m. rectus lateralis — пареза дава неспособност за абдукция (поглед навън).',
  },
  {
    scenario: 'Пациент не може да затвори очи, усмивката е асиметрична (двата дяла на лицето засегнати). Кой нерв?',
    options: ['Лицев нерв (VII) — централна пареза', 'Лицев нерв (VII) — периферна пареза', 'Тригеминален нерв (V)', 'Окулемоторен нерв (III)'],
    correct: 'Лицев нерв (VII) — периферна пареза',
    explanation: 'Периферна VII пареза (Бел паралич) засяга целия ипсилатерален хемифас (вкл. чело). Централна засяга само долната половина.',
  },
  {
    scenario: 'Пресинаптичен аксон е прерязан. Какво се случва с постсинаптичния неврон?',
    options: ['Денервационна свръхчувствителност (up-regulation на рецептори)', 'Атрофия и загуба на рецептори', 'Няма промяна', 'Аксонална регенерация'],
    correct: 'Денервационна свръхчувствителност (up-regulation на рецептори)',
    explanation: 'При денервация постсинаптичната мембрана прави up-regulation на рецепторите, което я прави свръхчувствителна към малки количества НТ.',
  },
  {
    scenario: 'Антероградна (Валерова) дегенерация след аксотомия: в кой сегмент?',
    options: ['Дисталният аксон (от лезията към терминала)', 'Проксималният аксон (от лезията към тялото)', 'Клетъчното тяло', 'Дендритите'],
    correct: 'Дисталният аксон (от лезията към терминала)',
    explanation: 'Валерова дегенерация: дисталният аксон дегенерира (без транспорт от клетъчното тяло). Проксималното се регенерира по-лесно.',
  },
];

function BrainPathsGame({ onBack }: { onBack: () => void }) {
  const { t } = useTheme();
  const { updateXP } = useAuth();
  const [phase, setPhase] = useState<'idle' | 'countdown' | 'playing' | 'done'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [pool, setPool] = useState<PathwayQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; answer: string; explanation: string } | null>(null);
  const [qKey, setQKey] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [optionsOrder, setOptionsOrder] = useState<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const TOTAL = 15;

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      const id = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(id);
    }
    if (phase === 'countdown' && countdown === 0) setPhase('playing');
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      setFeedback({ ok: false, answer: pool[current]?.correct ?? '', explanation: pool[current]?.explanation ?? '' });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setFeedback(null);
        setQKey(k => k + 1);
        if (current + 1 >= pool.length) {
          setPhase('done');
          updateXP(correct * 15 + (streak >= 5 ? 25 : 0));
        } else {
          setCurrent(c => c + 1);
          setTimeLeft(60);
        }
      }, 1500);
      return;
    }
    const id = setTimeout(() => setTimeLeft(x => x - 1), 1000);
    return () => clearTimeout(id);
  });

  const start = () => {
    const q = shuffle([...PATHWAY_QUESTIONS]).slice(0, TOTAL);
    setPool(q);
    setCurrent(0);
    setTimeLeft(60);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrect(0);
    setFeedback(null);
    setQKey(0);
    setConfetti(false);
    setOptionsOrder(shuffle(q[0].options));
    setPhase('countdown');
    setCountdown(3);
  };

  const handleAnswer = useCallback((answer: string) => {
    if (phase !== 'playing' || feedback) return;
    const q = pool[current];
    const isCorrect = answer === q.correct;
    setFeedback({ ok: isCorrect, answer: q.correct, explanation: q.explanation });
    if (isCorrect) {
      const ns = streak + 1;
      const pts = 15 * (ns >= 3 ? 2 : 1);
      setScore(s => s + pts);
      setCorrect(c => c + 1);
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
        setPhase('done');
        setConfetti(isCorrect && correct >= TOTAL - 3);
        updateXP(correct * 15 + (isCorrect ? 15 : 0) + (streak >= 5 ? 25 : 0));
      } else {
        const nextQ = pool[current + 1];
        setOptionsOrder(shuffle(nextQ.options));
        setCurrent(c => c + 1);
        setTimeLeft(60);
      }
    }, 2000);
  }, [phase, feedback, pool, current, streak, correct]);

  if (phase === 'idle' || phase === 'done') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        {confetti && <Confetti />}
        <GameStyles />
        <button onClick={onBack} className={`text-sm mb-6 ${t.textMuted}`}>← Обратно</button>
        <div className={`rounded-3xl p-8 text-center ${t.card} anim-slide-up`}>
          <div className="text-6xl mb-4">🧠</div>
          <h2 className={`text-3xl font-black mb-2 ${t.heading}`}>Невронни Пътища</h2>
          <p className={`${t.textMuted} mb-6`}>
            {TOTAL} клинични сценария. Идентифицирай засегнатия неврологичен път или структура.
            {' '}60 сек на въпрос · +15 XP на правилен отговор · трудност: ⭐⭐⭐
          </p>
          {phase === 'done' && (
            <div className="mb-6 space-y-2">
              <div className={`text-5xl font-black bg-gradient-to-r ${t.xpBar} bg-clip-text text-transparent anim-pop`}>{correct}/{TOTAL}</div>
              <div className={`text-sm ${t.textMuted}`}>правилни · Серия: {bestStreak} · Точки: {score}</div>
              <div className={`text-sm font-bold ${t.primaryText}`}>+{correct * 15} XP спечелени</div>
            </div>
          )}
          <button onClick={start} className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 ${t.primary} shadow-lg`}>
            {phase === 'done' ? '🔄 Играй отново' : '🧠 Старт!'}
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

  const q = pool[current];

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <GameStyles />
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3 items-center">
          <span className={`font-black text-xl ${t.heading}`}>⚡{score}</span>
          {streak >= 3 && <span className="text-orange-400 font-bold text-sm anim-pop">🔥×{streak}</span>}
        </div>
        <span className={`text-sm font-bold ${t.textMuted}`}>{current + 1}/{TOTAL}</span>
        <span className={`text-2xl font-black tabular-nums ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : t.primaryText}`}>
          {timeLeft}s
        </span>
      </div>

      <div className={`h-2 rounded-full mb-5 ${t.progressBg}`}>
        <div className={`h-2 rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-violet-600 to-indigo-600'}`}
          style={{ width: `${(timeLeft / 60) * 100}%` }} />
      </div>

      <div key={`q-${qKey}`}
        className={`rounded-3xl p-6 mb-5 anim-slide-up ${feedback ? (feedback.ok ? t.correct : t.wrong) : t.card}`}>
        <div className={`text-xs font-bold uppercase tracking-wider mb-2 text-violet-500`}>Клиничен сценарий</div>
        <p className={`text-base font-bold leading-relaxed ${t.heading}`}>{q.scenario}</p>
      </div>

      {feedback && (
        <div className={`rounded-2xl px-4 py-3 mb-4 text-sm anim-slide-up ${feedback.ok ? t.correct : t.wrong}`}>
          <div className="font-black mb-1">{feedback.ok ? `✅ Правилно!` : `❌ Правилно: ${feedback.answer}`}</div>
          <div className={`${t.text} leading-relaxed`}>{feedback.explanation}</div>
        </div>
      )}

      <div className="space-y-2">
        {(feedback ? q.options : optionsOrder).map((opt, i) => (
          <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!feedback}
            className={`w-full p-4 rounded-2xl font-semibold text-sm text-left transition-all active:scale-[0.98] hover:scale-[1.01] border-2 anim-slide-up ${
              feedback && opt === q.correct ? 'bg-green-500 text-white border-green-400 scale-[1.01]' :
              feedback && opt !== q.correct ? `${t.card} ${t.text} border-transparent opacity-40` :
              `${t.card} ${t.text} border-transparent ${t.cardHover}`
            }`}
            style={{ animationDelay: `${i * 0.04}s` }}>
            <span className={`block text-xs mb-1 font-black text-violet-500`}>{String.fromCharCode(65 + i)}</span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── GAMES MENU ───────────────────────────────────────────────────────────────
type GameCategory = 'all' | 'classic' | 'lab' | 'new';

interface GameEntry {
  id: GameType;
  title: string;
  desc: string;
  emoji: string;
  gradient: string;
  xp: string;
  stars: 1 | 2 | 3;
  category: 'classic' | 'lab' | 'new';
  isNew?: boolean;
}

const GAME_LIST: GameEntry[] = [
  { id: 'speed',     title: 'Бърз кръг',              desc: '60 сек · въпроси · серии за бонус',         emoji: '⚡',  gradient: 'from-yellow-400 to-orange-500', xp: 'до 300',  stars: 1, category: 'classic' },
  { id: 'truefalse', title: 'Вярно / Грешно',          desc: '45 сек · бързи твърдения',                  emoji: '🧠',  gradient: 'from-green-400 to-teal-500',    xp: 'до 200',  stars: 1, category: 'classic' },
  { id: 'flashcard', title: 'Флашкарти',               desc: 'Обърни картата · Знам / Уча',               emoji: '🃏',  gradient: 'from-purple-400 to-pink-500',   xp: 'до 100',  stars: 1, category: 'classic' },
  { id: 'memory',    title: 'Памет',                   desc: 'Намери двойките термин–определение',         emoji: '🎴',  gradient: 'from-blue-400 to-cyan-500',     xp: 'до 100',  stars: 2, category: 'classic' },
  { id: 'matching',  title: 'Свържи термините',        desc: '7 двойки · термин към определение',         emoji: '🧩',  gradient: 'from-rose-400 to-pink-500',     xp: 'до 100',  stars: 2, category: 'classic' },
  { id: 'riddle',    title: 'Кой съм аз?',             desc: '5 рунда · улики → познай термина',          emoji: '🔍',  gradient: 'from-violet-500 to-indigo-600', xp: 'до 150',  stars: 2, category: 'classic' },
  { id: 'dna',       title: 'ДНК Строител',            desc: 'Комплементарни бази · A↔T · G↔C',           emoji: '🧬',  gradient: 'from-pink-500 to-rose-600',     xp: 'до 32',   stars: 2, category: 'lab' },
  { id: 'balancer',  title: 'Балансирай уравнение',    desc: '6 химични уравнения · коефициенти',         emoji: '⚗️',  gradient: 'from-indigo-500 to-purple-600', xp: 'до 90',   stars: 3, category: 'lab' },
  { id: 'organelle', title: 'Клетъчна карта',          desc: 'Намери органелите в SVG клетката',          emoji: '🔬',  gradient: 'from-teal-400 to-emerald-500',  xp: 'до 80',   stars: 2, category: 'lab' },
  { id: 'drugs',             title: 'Лекарства & Рецептори',    desc: 'Свържи лекарство с механизъм на действие',        emoji: '💊',  gradient: 'from-sky-500 to-blue-700',          xp: 'до 100',  stars: 3, category: 'new', isNew: true },
  { id: 'immune',            title: 'Имунна отбрана',            desc: 'Поставяй имунни клетки · 3 вълни врагове',        emoji: '🦠',  gradient: 'from-red-500 to-rose-700',          xp: 'до 150',  stars: 3, category: 'new', isNew: true },
  { id: 'operation',         title: 'Операция! 3D',               desc: 'Диагноза + 3D хирургия · кликни раните',         emoji: '🔬',  gradient: 'from-emerald-500 to-teal-700',      xp: 'до 100',  stars: 3, category: 'new', isNew: true },
  { id: 'cranial',           title: 'Черепни нерви',              desc: '🧠 60 сек · познай нерв I–XII по функция · серии', emoji: '🧠',  gradient: 'from-violet-500 to-purple-700',     xp: 'до 200',  stars: 2, category: 'new', isNew: true },
  { id: 'synapse',           title: 'Синапс Билдер',              desc: '🧠 Подреди 8-те стъпки на синаптичното предаване', emoji: '⚡',  gradient: 'from-indigo-500 to-violet-700',     xp: 'до 150',  stars: 2, category: 'new', isNew: true },
  { id: 'brainlobes',        title: 'Мозъчни Дялове',             desc: '🧠 20 въпроса · функция → кой мозъчен дял?',      emoji: '🧩',  gradient: 'from-fuchsia-500 to-pink-700',      xp: 'до 200',  stars: 2, category: 'new', isNew: true },
  { id: 'neurotransmitter',  title: 'Невротрансмитери',           desc: '🧠 Свържи НТ с роля · Допамин, ГАМК, Глутамат…',  emoji: '🔗',  gradient: 'from-purple-500 to-indigo-700',     xp: 'до 120',  stars: 3, category: 'new', isNew: true },
  { id: 'brainpaths',        title: 'Невронни Пътища',            desc: '🧠 15 клинични сценария · познай пътя/структурата', emoji: '🩺',  gradient: 'from-violet-600 to-blue-800',       xp: 'до 225',  stars: 3, category: 'new', isNew: true },
];

const CAT_TABS: { id: GameCategory; label: string; emoji: string }[] = [
  { id: 'all',     label: 'Всички',     emoji: '🎮' },
  { id: 'classic', label: 'Класически', emoji: '⚡' },
  { id: 'lab',     label: 'Лаборатория',emoji: '🔬' },
  { id: 'new',     label: 'Нови',       emoji: '✨' },
];

function Stars({ n }: { n: 1 | 2 | 3 }) {
  return (
    <span className="text-[11px]">
      {'⭐'.repeat(n)}{'☆'.repeat(3 - n)}
    </span>
  );
}

export default function GamesPage() {
  const { t, mode } = useTheme();
  const [game, setGame] = useState<GameType>('menu');
  const [cat, setCat] = useState<GameCategory>('all');

  if (game === 'speed')     return <AppShell><GameStyles /><SpeedRound     onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'matching')  return <AppShell><GameStyles /><MatchingGame   onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'truefalse') return <AppShell><GameStyles /><TrueFalseBlitz onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'flashcard') return <AppShell><GameStyles /><FlashcardFlip  onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'memory')    return <AppShell><GameStyles /><MemoryMatch    onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'riddle')    return <AppShell><GameStyles /><RiddleGame     onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'dna')       return <AppShell><GameStyles /><DNABuilder     onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'balancer')  return <AppShell><GameStyles /><EquationBalancer onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'organelle') return <AppShell><GameStyles /><OrganelleMap   onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'drugs')            return <AppShell><GameStyles /><DrugReceptorGame        onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'immune')           return <AppShell><GameStyles /><ImmuneDefense           onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'operation')        return <AppShell><GameStyles /><OperationGame           onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'cranial')          return <AppShell><GameStyles /><CranialNerveChallenge   onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'synapse')          return <AppShell><GameStyles /><SynapseBuilder          onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'brainlobes')       return <AppShell><GameStyles /><BrainLobeIdentifier     onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'neurotransmitter') return <AppShell><GameStyles /><NeurotransmitterGame    onBack={() => setGame('menu')} /></AppShell>;
  if (game === 'brainpaths')       return <AppShell><GameStyles /><BrainPathsGame          onBack={() => setGame('menu')} /></AppShell>;

  const visible = cat === 'all' ? GAME_LIST : GAME_LIST.filter(g => g.category === cat);
  const newCount = GAME_LIST.filter(g => g.isNew).length;

  return (
    <AppShell>
      <GameStyles />
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-5">
          <h1 className={`text-2xl md:text-3xl font-black ${t.heading}`}>Игри 🎮</h1>
          <p className={`mt-0.5 text-sm ${t.textMuted}`}>{GAME_LIST.length} игри · учи докато се забавляваш</p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none pb-1">
          {CAT_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setCat(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                cat === tab.id
                  ? mode === 'soft'
                    ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-md scale-105'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md scale-105'
                  : `${t.card} ${t.text} ${t.cardHover}`
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              {tab.id === 'new' && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{newCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Game grid — 2 cols mobile, 3 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {visible.map((g, i) => (
            <button
              key={g.id}
              onClick={() => setGame(g.id)}
              className={`group relative rounded-2xl md:rounded-3xl overflow-hidden text-left transition-all hover:scale-[1.03] active:scale-[0.97] hover:shadow-xl anim-slide-up ${t.card}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Top gradient strip */}
              <div className={`bg-gradient-to-br ${g.gradient} p-4 pb-3`}>
                {g.isNew && (
                  <span className="absolute top-2 right-2 bg-white/90 text-red-500 text-[10px] font-black px-2 py-0.5 rounded-full">
                    НОВО
                  </span>
                )}
                <div className="text-3xl md:text-4xl mb-1 transition-transform duration-200 group-hover:scale-110">
                  {g.emoji}
                </div>
              </div>

              {/* Card body */}
              <div className="p-3">
                <div className={`font-black text-sm md:text-base leading-tight ${t.heading} mb-1`}>{g.title}</div>
                <div className={`text-[11px] md:text-xs ${t.textMuted} leading-snug line-clamp-2`}>{g.desc}</div>

                {/* Meta row */}
                <div className="flex items-center justify-between mt-2">
                  <Stars n={g.stars} />
                  <span className={`text-[10px] md:text-xs font-bold ${t.primaryText}`}>⚡{g.xp} XP</span>
                </div>
              </div>
            </button>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
