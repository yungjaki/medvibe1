export type University = {
  id: string;
  name: string;
  shortName: string;
  city: string;
  emoji: string;
  gradient: string;
  founded: number;
  description: string;
  emphasis: string[];
  atlasUsed?: string;
};

export const universities: University[] = [
  {
    id: 'sofia',
    name: 'Медицински университет — София',
    shortName: 'МУ-София',
    city: 'София',
    emoji: '🏛️',
    gradient: 'from-blue-500 to-indigo-600',
    founded: 1917,
    description: 'Най-голямото и най-старото медицинско училище в България.',
    emphasis: ['Биохимия', 'Молекулярна биология', 'Анатомия по Sobotta', 'Хирургична анатомия'],
    atlasUsed: 'Sobotta / Netter',
  },
  {
    id: 'plovdiv',
    name: 'Медицински университет — Пловдив',
    shortName: 'МУ-Пловдив',
    city: 'Пловдив',
    emoji: '🌿',
    gradient: 'from-green-500 to-teal-600',
    founded: 1945,
    description: 'Силна практическа база, ранна работа с кадавери.',
    emphasis: ['Практическа анатомия', 'Клинична хистология', 'Регионална анатомия', 'Генетика'],
    atlasUsed: 'Netter / Frank H. Netter',
  },
  {
    id: 'varna',
    name: 'Медицински университет — Варна',
    shortName: 'МУ-Варна',
    city: 'Варна',
    emoji: '🌊',
    gradient: 'from-cyan-500 to-blue-500',
    founded: 1961,
    description: 'Интегриран учебен план с ранни клинични корелации.',
    emphasis: ['Молекулярна биология', 'Интегриран учебен план', 'Клинични корелации', 'Биохимия'],
    atlasUsed: 'Gray\'s Anatomy / Netter',
  },
  {
    id: 'pleven',
    name: 'Медицински университет — Плевен',
    shortName: 'МУ-Плевен',
    city: 'Плевен',
    emoji: '⚕️',
    gradient: 'from-orange-400 to-red-500',
    founded: 1974,
    description: 'По-малък университет с персонален подход и силна патофизиология.',
    emphasis: ['Патофизиология', 'Системна анатомия', 'Имунология', 'Ранна клинична практика'],
    atlasUsed: 'Sobotta',
  },
  {
    id: 'stara_zagora',
    name: 'Тракийски университет — Стара Загора',
    shortName: 'ТрУ-Стара Загора',
    city: 'Стара Загора',
    emoji: '🌾',
    gradient: 'from-yellow-500 to-orange-500',
    founded: 1995,
    description: 'Факултет по медицина към Тракийски университет.',
    emphasis: ['Сравнителна анатомия', 'Биохимия', 'Молекулярна генетика', 'Обща биология'],
    atlasUsed: 'Синельников / Netter',
  },
];

export type CurriculumEmphasis = {
  universityId: string;
  subject: string;
  chapter: string;
  notes: string; // university-specific exam notes
  examWeight: 'high' | 'medium' | 'low';
  specificTopics?: string[];
};

export const curriculumEmphasis: CurriculumEmphasis[] = [
  // Sofia
  { universityId: 'sofia', subject: 'anatomy', chapter: 'heart', notes: 'МУ-София: Задълбочено изучаване на хирургичната анатомия на сърцето. Коронарните артерии — задължителни!', examWeight: 'high', specificTopics: ['Коронарни артерии', 'Проводна система', 'Хирургична анатомия'] },
  { universityId: 'sofia', subject: 'biology', chapter: 'dna', notes: 'МУ-София: Биохимичен акцент — репликация, транскрипция и транслация в детайли с ензими.', examWeight: 'high' },
  { universityId: 'sofia', subject: 'chemistry', chapter: 'biochem', notes: 'МУ-София: Обширна биохимия — метаболизъм, ензимна кинетика по Michaelis-Menten.', examWeight: 'high' },
  { universityId: 'sofia', subject: 'histology', chapter: 'connective', notes: 'МУ-София: Детайлна класификация на съединителната тъкан с типове колаген.', examWeight: 'medium' },
  // Plovdiv
  { universityId: 'plovdiv', subject: 'anatomy', chapter: 'bones', notes: 'МУ-Пловдив: Практическа остеология — идентифициране на кости при кадавер. Акцент на стави и връзки.', examWeight: 'high', specificTopics: ['Стави', 'Синдесмология', 'Регионална анатомия'] },
  { universityId: 'plovdiv', subject: 'anatomy', chapter: 'muscles', notes: 'МУ-Пловдив: Задължително познаване на инервацията на мускулите, а не само произхода/инсерцията.', examWeight: 'high' },
  { universityId: 'plovdiv', subject: 'histology', chapter: 'epithelium', notes: 'МУ-Пловдив: Хистологични препарати под микроскоп — разпознаване на тъканни типове е задължително.', examWeight: 'high' },
  { universityId: 'plovdiv', subject: 'biology', chapter: 'genetics', notes: 'МУ-Пловдив: Класическа генетика на Мендел + хромозомни аберации. Задачи по генетика.', examWeight: 'high' },
  // Varna
  { universityId: 'varna', subject: 'biology', chapter: 'cell', notes: 'МУ-Варна: Молекулярна клетъчна биология — сигнални пътища, клетъчен цикъл.', examWeight: 'high' },
  { universityId: 'varna', subject: 'biology', chapter: 'dna', notes: 'МУ-Варна: Молекулярна генетика — PCR, секвениране, рекомбинантна ДНК.', examWeight: 'high' },
  { universityId: 'varna', subject: 'chemistry', chapter: 'organic', notes: 'МУ-Варна: Органична химия с акцент на биомолекули и метаболитни пътища.', examWeight: 'high' },
  { universityId: 'varna', subject: 'anatomy', chapter: 'nervous', notes: 'МУ-Варна: Интегриран подход — анатомия + функция на нервната система заедно.', examWeight: 'high' },
  // Pleven
  { universityId: 'pleven', subject: 'anatomy', chapter: 'heart', notes: 'МУ-Плевен: Физиологичен акцент на сърцето — проводна система, ЕКГ корелации.', examWeight: 'high' },
  { universityId: 'pleven', subject: 'histology', chapter: 'blood', notes: 'МУ-Плевен: Кръв и хемопоеза в детайли. Имунология интегрирана в хистологията.', examWeight: 'high' },
  { universityId: 'pleven', subject: 'biology', chapter: 'immunity', notes: 'МУ-Плевен: Разширена имунология — клетъчна и хуморална, MHC, цитокини.', examWeight: 'high' },
  // Stara Zagora
  { universityId: 'stara_zagora', subject: 'biology', chapter: 'genetics', notes: 'ТрУ-Стара Загора: Молекулярна генетика + сравнителна биология. Задачи и казуси.', examWeight: 'high' },
  { universityId: 'stara_zagora', subject: 'chemistry', chapter: 'biochem', notes: 'ТрУ-Стара Загора: Биохимия с акцент на ензими и метаболизъм.', examWeight: 'high' },
  { universityId: 'stara_zagora', subject: 'anatomy', chapter: 'organs', notes: 'ТрУ-Стара Загора: Сравнителна анатомия — хомологии при бозайниците.', examWeight: 'medium' },
];
