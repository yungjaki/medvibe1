'use client';

import { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment, Center } from '@react-three/drei';
import * as THREE from 'three';

// ── Per-model camera hints ────────────────────────────────────────────────────
const MODEL_CONFIG: Record<string, { camPos: [number, number, number]; target: [number, number, number] }> = {
  'skeleton':    { camPos: [0, 0.9, 3.2], target: [0, 0.9, 0] },
  'skin':        { camPos: [0, 0.9, 3.2], target: [0, 0.9, 0] },
  'skull':       { camPos: [0, 0,   1.8], target: [0, 0,   0] },
  'vertebrae':   { camPos: [0, 0,   1.5], target: [0, 0,   0] },
  'upper-limb':  { camPos: [0, 0,   3.0], target: [0, 0,   0] },
  'lower-limb':  { camPos: [0, 0,   3.5], target: [0, 0,   0] },
  'hand':        { camPos: [0, 0,   1.8], target: [0, 0,   0] },
  'heart':       { camPos: [0, 0,   0.4], target: [0, 0,   0] },
  'lungs':       { camPos: [0, 0,   0.7], target: [0, 0,   0] },
  'liver':       { camPos: [0, 0,   0.4], target: [0, 0,   0] },
  'kidney':      { camPos: [0, 0,   0.25],target: [0, 0,   0] },
};

// Bulgarian anatomy labels
const LABELS: Record<string, { bg: string; desc: string }> = {
  skull: { bg: 'Череп', desc: 'Предпазва мозъка и формира лицевия скелет.' },
  mandible: { bg: 'Долна челюст', desc: 'Подвижна кост — участва в дъвченето и говора.' },
  cervical: { bg: 'Шийни прешлени', desc: 'C1–C7 — поддържат главата.' },
  thoracic: { bg: 'Гръдни прешлени', desc: 'T1–T12 — свързани с ребрата.' },
  lumbar: { bg: 'Поясни прешлени', desc: 'L1–L5 — носят тежестта на тялото.' },
  sacrum: { bg: 'Сакрум', desc: 'Клиновидна кост в основата на гръбнака.' },
  sternum: { bg: 'Гръдна кост', desc: 'Плоска кост — прикрепват се ребрата.' },
  rib: { bg: 'Ребро', desc: '12 чифта ребра защитават гръдните органи.' },
  clavicle: { bg: 'Ключица', desc: 'Свързва раменния пояс с гръдната кост.' },
  scapula: { bg: 'Лопатка', desc: 'Триъгълна кост — основа на раменната става.' },
  humerus: { bg: 'Мишница', desc: 'Дълга кост на горния крайник.' },
  radius: { bg: 'Лъчева кост', desc: 'Латерална кост на предмишницата.' },
  ulna: { bg: 'Лакътна кост', desc: 'Медиална кост на предмишницата.' },
  femur: { bg: 'Бедрена кост', desc: 'Най-дългата кост в тялото.' },
  patella: { bg: 'Пателa', desc: 'Капачката на коляното — защитава ставата.' },
  tibia: { bg: 'Пищял', desc: 'Медиална кост на подбедрицата.' },
  fibula: { bg: 'Малопищялна кост', desc: 'Тънка латерална кост на подбедрицата.' },
  pelvis: { bg: 'Таз', desc: 'Свързва гръбнака с долните крайници.' },
  heart: { bg: 'Сърце', desc: 'Помпа на кръвоносната система — ~60-100 удара/мин.' },
  lung: { bg: 'Бял дроб', desc: 'Осигурява газообмена — O₂ влиза, CO₂ излиза.' },
  liver: { bg: 'Черен дроб', desc: 'Най-голямата жлеза — детоксикация и метаболизъм.' },
  kidney: { bg: 'Бъбрек', desc: 'Филтрира кръвта и произвежда урина.' },
  skin: { bg: 'Кожа', desc: 'Най-голямата органна система — защитна бариера.' },
};

function getLabel(name: string): { bg: string; desc: string } {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(LABELS)) {
    if (lower.includes(key)) return val;
  }
  return { bg: name.replace(/_/g, ' '), desc: 'Анатомична структура.' };
}

// ── Auto-fit camera when model loads ─────────────────────────────────────────
function AutoCamera({ modelKey }: { modelKey: string }) {
  const { camera } = useThree();
  useEffect(() => {
    const cfg = MODEL_CONFIG[modelKey] ?? MODEL_CONFIG['skeleton'];
    camera.position.set(...cfg.camPos);
    camera.lookAt(new THREE.Vector3(...cfg.target));
    camera.updateProjectionMatrix();
  }, [modelKey, camera]);
  return null;
}

// ── 3D Model ─────────────────────────────────────────────────────────────────
function Model({
  url,
  modelKey,
  onHover,
  onClick,
}: {
  url: string;
  modelKey: string;
  onHover: (info: { bg: string; desc: string } | null) => void;
  onClick: (info: { bg: string; desc: string } | null) => void;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const [autoSpin, setAutoSpin] = useState(true);

  useEffect(() => { setAutoSpin(true); }, [url]);

  useFrame((_, delta) => {
    if (autoSpin && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
    }
  });

  const stop = useCallback(() => setAutoSpin(false), []);

  return (
    <Center>
      <group ref={groupRef}>
        <primitive
          object={scene}
          onPointerOver={(e: any) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
            onHover(getLabel(e.object.name || e.object.parent?.name || ''));
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
            onHover(null);
          }}
          onClick={(e: any) => {
            e.stopPropagation();
            stop();
            onClick(getLabel(e.object.name || e.object.parent?.name || ''));
          }}
          onPointerDown={stop}
        />
      </group>
    </Center>
  );
}

// ── Loader overlay ────────────────────────────────────────────────────────────
function Loader() {
  return (
    <Html center>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'white' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 13, opacity: 0.6, fontWeight: 600 }}>Зареждане…</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Html>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export interface AnatomyViewerProps {
  modelUrl: string;
  modelKey: string;
  darkMode?: boolean;
}

export default function AnatomyViewer({ modelUrl, modelKey, darkMode = true }: AnatomyViewerProps) {
  const [hovered, setHovered] = useState<{ bg: string; desc: string } | null>(null);
  const [selected, setSelected] = useState<{ bg: string; desc: string } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Reset info when model changes
  useEffect(() => {
    setSelected(null);
    setSheetOpen(false);
  }, [modelUrl]);

  const handleClick = (info: { bg: string; desc: string } | null) => {
    if (!info) return;
    setSelected(info);
    setSheetOpen(true);
  };

  const bg = darkMode ? '#0f172a' : '#f1f5f9';

  return (
    <div className="relative w-full h-full" style={{ background: bg, borderRadius: 'inherit' }}>
      <Canvas
        shadows
        camera={{ fov: 45, near: 0.01, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: bg, width: '100%', height: '100%' }}
      >
        <AutoCamera modelKey={modelKey} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 3]} intensity={1.3} castShadow />
        <directionalLight position={[-3, 2, -3]} intensity={0.5} color={darkMode ? '#93c5fd' : '#fde68a'} />
        <pointLight position={[0, -2, 2]} intensity={0.3} color="#f9a8d4" />

        <Suspense fallback={<Loader />}>
          <Model url={modelUrl} modelKey={modelKey} onHover={setHovered} onClick={handleClick} />
          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={0.05}
          maxDistance={10}
          target={MODEL_CONFIG[modelKey]?.target ?? [0, 0, 0]}
          makeDefault
        />
      </Canvas>

      {/* Hover chip */}
      {hovered && !sheetOpen && (
        <div
          className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2
                     px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-md
                     text-white text-sm font-semibold shadow-xl whitespace-nowrap"
        >
          🦴 {hovered.bg}
        </div>
      )}

      {/* Bottom sheet info panel */}
      <div
        className={`absolute inset-x-0 bottom-0 transition-transform duration-300 ease-out ${
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ zIndex: 10 }}
      >
        <div className="bg-black/80 backdrop-blur-xl rounded-t-3xl px-5 pt-4 pb-6 text-white shadow-2xl">
          {/* Handle bar */}
          <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-4" />
          <div className="flex items-start gap-3">
            <div className="text-3xl flex-shrink-0">🦴</div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-lg leading-tight">{selected?.bg}</div>
              <div className="text-sm text-white/70 mt-1.5 leading-relaxed">{selected?.desc}</div>
            </div>
            <button
              onClick={() => { setSheetOpen(false); setSelected(null); }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Hint — only when nothing is going on */}
      {!hovered && !sheetOpen && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2
                        text-white/30 text-xs font-medium whitespace-nowrap">
          Завъртете · Zoom · Кликнете
        </div>
      )}
    </div>
  );
}
