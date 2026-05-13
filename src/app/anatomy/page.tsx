'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useTheme } from '@/context/ThemeContext';

const AnatomyViewer = dynamic(() => import('@/components/AnatomyViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-3xl">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white/70 rounded-full animate-spin" />
        <span className="text-white/50 text-sm font-medium">Зареждане на 3D модела…</span>
      </div>
    </div>
  ),
});

// ── Model catalogue ────────────────────────────────────────────────────────────
type ModelId =
  | 'skeleton' | 'skull' | 'vertebrae'
  | 'upper-limb' | 'lower-limb' | 'hand'
  | 'skin' | 'muscles'
  | 'heart' | 'lungs' | 'liver' | 'kidney';

interface ModelEntry {
  id: ModelId;
  label: string;
  emoji: string;
  file: string;
  group: 'skeleton' | 'organs' | 'surface' | 'soon';
  color: string;
}

const MODELS: ModelEntry[] = [
  { id: 'skeleton',   label: 'Скелет',        emoji: '🦴', file: 'skeleton.glb',   group: 'skeleton', color: 'from-cyan-500 to-blue-600' },
  { id: 'skull',      label: 'Череп',         emoji: '💀', file: 'skull.glb',      group: 'skeleton', color: 'from-slate-500 to-slate-700' },
  { id: 'vertebrae',  label: 'Прешлени',      emoji: '🔩', file: 'vertebrae.glb',  group: 'skeleton', color: 'from-amber-500 to-orange-600' },
  { id: 'upper-limb', label: 'Горен крайник', emoji: '💪', file: 'upper-limb.glb', group: 'skeleton', color: 'from-violet-500 to-purple-700' },
  { id: 'lower-limb', label: 'Долен крайник', emoji: '🦿', file: 'lower-limb.glb', group: 'skeleton', color: 'from-teal-500 to-emerald-700' },
  { id: 'hand',       label: 'Ръка',          emoji: '✋', file: 'hand.glb',       group: 'skeleton', color: 'from-pink-500 to-rose-600' },
  { id: 'skin',       label: 'Кожа',          emoji: '🧬', file: 'skin.glb',       group: 'surface',  color: 'from-orange-400 to-amber-600' },
  { id: 'heart',      label: 'Сърце',         emoji: '🫀', file: 'heart.glb',      group: 'organs',   color: 'from-red-500 to-rose-700' },
  { id: 'lungs',      label: 'Бели дробове',  emoji: '🫁', file: 'lungs.glb',      group: 'organs',   color: 'from-sky-400 to-blue-600' },
  { id: 'liver',      label: 'Черен дроб',    emoji: '🫀', file: 'liver.glb',      group: 'organs',   color: 'from-amber-600 to-red-700' },
  { id: 'kidney',     label: 'Бъбреци',       emoji: '🫘', file: 'kidney.glb',     group: 'organs',   color: 'from-rose-500 to-pink-700' },
  { id: 'muscles',    label: 'Мускули',       emoji: '💪', file: '',               group: 'soon',     color: 'from-gray-500 to-gray-700' },
];

// Top-level system tabs
const TABS = [
  { id: 'skeleton', label: 'Скелет',  emoji: '🦴' },
  { id: 'surface',  label: 'Кожа',    emoji: '🧬' },
  { id: 'organs',   label: 'Органи',  emoji: '🫀' },
  { id: 'soon',     label: 'Скоро',   emoji: '⏳' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AnatomyPage() {
  const { t, mode } = useTheme();
  const darkMode = mode !== 'soft';
  const [tab, setTab] = useState<TabId>('skeleton');
  const [activeModel, setActiveModel] = useState<ModelEntry>(MODELS[0]);

  const tabModels = MODELS.filter(m => m.group === tab);

  const handleTabChange = (newTab: TabId) => {
    setTab(newTab);
    const first = MODELS.find(m => m.group === newTab && m.group !== 'soon');
    if (first) setActiveModel(first);
  };

  const handleModelSelect = (m: ModelEntry) => {
    if (m.group === 'soon') return;
    setActiveModel(m);
  };

  return (
    <AppShell>
      {/* Full-height layout — viewer takes all available space */}
      <div className="flex flex-col" style={{ height: 'calc(100dvh - 5rem)', maxHeight: '100dvh' }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 pt-4 pb-2 flex items-center gap-3">
          <div>
            <h1 className={`text-xl md:text-2xl font-black leading-tight ${t.heading}`}>
              3D Анатомия
            </h1>
            <p className={`text-xs ${t.textMuted} hidden sm:block`}>
              Интерактивен атлас — завъртете и кликнете
            </p>
          </div>
          {/* Active model badge */}
          <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${activeModel.color} text-white text-xs font-bold shadow`}>
            <span>{activeModel.emoji}</span>
            <span className="max-w-[90px] truncate">{activeModel.label}</span>
          </div>
        </div>

        {/* ── 3D Viewer ─────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 mx-4 rounded-3xl overflow-hidden shadow-2xl"
             style={{ minHeight: 200 }}>
          {activeModel.group !== 'soon' ? (
            <AnatomyViewer
              modelUrl={`/3D/${activeModel.file}`}
              modelKey={activeModel.id}
              darkMode={darkMode}
            />
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center gap-4 rounded-3xl ${t.card}`}>
              <span className="text-5xl">🚧</span>
              <div className={`text-center font-bold ${t.heading}`}>Скоро</div>
              <p className={`text-sm ${t.textMuted} text-center px-8`}>
                Моделът се разработва и ще бъде добавен скоро.
              </p>
            </div>
          )}
        </div>

        {/* ── System tabs ───────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 pt-3 pb-1">
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {TABS.map(tab_ => (
              <button
                key={tab_.id}
                onClick={() => handleTabChange(tab_.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  tab === tab_.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md scale-105'
                    : `${t.card} ${t.text} ${t.cardHover}`
                }`}
              >
                <span className="text-sm">{tab_.emoji}</span>
                <span>{tab_.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Model selector chips ──────────────────────────────── */}
        <div className="flex-shrink-0 px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
            {tabModels.map(m => {
              const isActive = activeModel.id === m.id;
              const isSoon = m.group === 'soon';
              return (
                <button
                  key={m.id}
                  onClick={() => handleModelSelect(m)}
                  disabled={isSoon}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${m.color} text-white shadow-lg scale-105`
                      : isSoon
                      ? `${t.card} opacity-40 cursor-not-allowed`
                      : `${t.card} ${t.text} ${t.cardHover} hover:scale-105`
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                  {isSoon && <span className={`text-[10px] ${t.textMuted}`}>скоро</span>}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
