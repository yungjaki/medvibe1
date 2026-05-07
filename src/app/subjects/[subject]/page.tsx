'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { subjects, questions } from '@/lib/data/questions';

type Props = { params: Promise<{ subject: string }> };

const summaries: Record<string, Record<string, string>> = {
  anatomy: {
    'Костна система': 'Скелетът осигурява опора, защита и движение. 206 кости при възрастен, свързани чрез стави. Костта е жива тъкан — обновява се постоянно.',
    'Мускулна система': 'Над 600 мускула в тялото. Три вида: скелетни (доброволни), гладки (недоброволни) и сърдечни. Мускулите се съкращават чрез актин и миозин.',
    'Нервна система': '12 чифта черепномозъчни нерва, 31 чифта гръбначни нерва. ЦНС (главен + гръбначен мозък) и ПНС. Невронът е основна структурна единица.',
    'Сърдечно-съдова система': 'Сърцето има 4 камери. Ляво = системно кръвообращение, дясно = белодробно. Около 100,000 удара/ден.',
    'Дихателна система': 'Белите дробове съдържат ~300 млн алвеоли. Диафрагмата е главният дихателен мускул. Трахеята се разклонява на бронхи при Th4-5.',
  },
  histology: {
    'Епителна тъкан': 'Покрива повърхности и облицова кухини. Типове: плосък, кубичен, цилиндричен (1 слой = прост, много слоеве = стратифициран).',
    'Съединителна тъкан': 'Поддържа и свързва останалите тъкани. Включва: рехава, плътна, мастна, костна, хрущялна, кръв.',
    'Мускулна тъкан': 'Скелетна (набраздена, доброволна), гладка (недоброволна), сърдечна (набраздена, недоброволна). Контракцията е чрез Ca²⁺-тропонин механизъм.',
    'Нервна тъкан': 'Неврони (провеждат импулси) + глия (поддръжка). В ЦНС: астроцити, олигодендроцити, микроглия. В ПНС: Швановите клетки.',
    'Кожа': '3 слоя: епидермис (5 слоя), дерма (колаген/еластин) и хиподермис (мастна тъкан). Функции: защита, терморегулация, сетивност.',
  },
  biology: {
    'ДНК и гени': 'ДНК е двойна верига (Watson-Crick, 1953). Ген = участък от ДНК, кодиращ белтък. Транскрипция → иРНК → Транслация → Протеин.',
    'Клетъчна биология': 'Клетъчни органели: ядро, митохондрии, ЕПР, Голджи, лизозоми, рибозоми. Митохондриите имат собствена ДНК (ендосимбиотична теория).',
    'Генетика': 'Мендел: доминиране, сегрегация, независимо разпределение. ABO кръвни групи — кодоминантност (I^A, I^B) и рецесивност (i).',
    'Имунна система': 'Вродена (неспецифична) и придобита (специфична) имунност. B-лимфоцити → антитела. T-лимфоцити → клетъчен имунитет. MHC молекули.',
    'Ензими': 'Биологични катализатори — белтъчна природа. Активен център. Специфичност. Инхибиране (конкурентно/неконкурентно). pH и температура влияят.',
  },
  chemistry: {
    'Периодична система': '118 елемента, наредени по атомен номер. Периоди (хоризонтални) и групи (вертикални). Периодичен закон: свойствата се повтарят периодично.',
    'Химични връзки': 'Ковалентна (споделяне на е⁻), йонна (прехвърляне на е⁻), метална. Водородна връзка — важна за структурата на ДНК и протеините.',
    'Киселини и основи': 'Бренстед-Лоури: киселина = донор на H⁺, основа = акцептор. pH = -log[H⁺]. Кръвното pH = 7.35–7.45 (буфериране с HCO₃⁻).',
    'Органична химия': 'Въглеродна химия. Функционални групи: -OH, -COOH, -NH₂, -CHO. Биомолекули: въглехидрати, липиди, протеини, нуклеинови к-ни.',
    'Редокс реакции': 'Окисление = загуба на е⁻ (увеличаване на степента на окисление). Редукция = приемане на е⁻. OIL RIG. Клетъчното дишане е редокс процес.',
  },
};

export default function SubjectPage({ params }: Props) {
  const { subject } = use(params);
  const { t } = useTheme();
  const { profile } = useAuth();
  const router = useRouter();

  const subjectInfo = subjects.find(s => s.id === subject);
  if (!subjectInfo) {
    router.push('/subjects');
    return null;
  }

  const subjectQuestions = questions.filter(q => q.subject === subject);
  const completedIds = profile?.completedQuizzes || [];
  const completedCount = subjectQuestions.filter(q => completedIds.includes(q.id)).length;

  const topicGroups = subjectInfo.topics.map(topic => ({
    topic,
    questions: subjectQuestions.filter(q => q.topic === topic),
    summary: summaries[subject]?.[topic] || '',
  }));

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className={`rounded-3xl p-8 mb-8 bg-gradient-to-r ${subjectInfo.color} text-white`}>
          <Link href="/subjects" className="text-white/70 text-sm hover:text-white mb-3 block">← Обратно</Link>
          <div className="flex items-center gap-4">
            <span className="text-6xl">{subjectInfo.emoji}</span>
            <div>
              <h1 className="text-3xl font-black">{subjectInfo.name}</h1>
              <p className="text-white/80">{subjectInfo.description}</p>
              <div className="mt-2 text-sm font-medium">{completedCount}/{subjectQuestions.length} въпроса отговорени</div>
            </div>
          </div>
        </div>

        {/* Start quiz button */}
        <div className="mb-8 flex gap-3">
          <Link
            href={`/quiz?subject=${subject}`}
            className={`flex-1 py-4 rounded-2xl font-bold text-center text-white transition-all hover:scale-105 bg-gradient-to-r ${subjectInfo.color} shadow-lg`}
          >
            🧪 Стартирай тест по {subjectInfo.name}
          </Link>
        </div>

        {/* Topics */}
        <div className="space-y-6">
          {topicGroups.map(({ topic, questions: qs, summary }) => (
            <div key={topic} className={`rounded-2xl overflow-hidden ${t.card}`}>
              {/* Topic header */}
              <div className="p-5">
                <h2 className={`text-lg font-bold mb-2 ${t.heading}`}>{topic}</h2>
                {summary && <p className={`text-sm leading-relaxed ${t.text}`}>{summary}</p>}
              </div>

              {/* Questions preview */}
              {qs.length > 0 && (
                <div className={`border-t ${t.primaryBorder} divide-y divide-opacity-10`}>
                  {qs.slice(0, 2).map(q => {
                    const done = completedIds.includes(q.id);
                    return (
                      <div key={q.id} className={`px-5 py-3 flex items-center gap-3 text-sm ${t.textMuted}`}>
                        <span>{done ? '✅' : '⭕'}</span>
                        <span className="flex-1 truncate">{q.question}</span>
<span className={`text-xs px-2 py-0.5 rounded-full ${q.difficulty === 'easy' ? 'bg-green-100 text-green-600' : q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                          {q.difficulty === 'easy' ? 'лесен' : q.difficulty === 'medium' ? 'среден' : 'труден'}
                        </span>
                      </div>
                    );
                  })}
                  {qs.length > 2 && (
                    <div className={`px-5 py-2 text-xs ${t.textMuted}`}>
                      +{qs.length - 2} още въпроса в теста
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
