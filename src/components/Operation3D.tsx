'use client';

import { useRef, useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export type Op3DCaseId = 'heart' | 'kidney' | 'appendix';

// Relative hotspot positions as fractions of model half-extents (signed, so ±1 = bbox edge)
const REL_SPOTS: Record<Op3DCaseId, [number, number, number][]> = {
  heart: [
    [ 0.45,  0.50,  0.55],
    [-0.50,  0.20,  0.55],
    [ 0.20, -0.40,  0.50],
    [-0.30,  0.55, -0.30],
    [ 0.55, -0.25,  0.25],
  ],
  kidney: [
    [ 0.30,  0.45,  0.65],
    [-0.40,  0.15,  0.60],
    [ 0.20, -0.50,  0.50],
    [-0.25,  0.55, -0.30],
    [ 0.50, -0.20,  0.30],
  ],
  appendix: [
    [ 0.50, -0.14,  0.75],
    [ 0.60, -0.20,  0.65],
    [ 0.40, -0.10,  0.80],
    [ 0.55, -0.25,  0.60],
    [ 0.60, -0.16,  0.78],
  ],
};

const CAM_CFG: Record<Op3DCaseId, { pos: [number, number, number]; target: [number, number, number] }> = {
  heart:    { pos: [0,    0,     0.50], target: [0,     0,    0] },
  kidney:   { pos: [0,    0,     0.30], target: [0,     0,    0] },
  appendix: { pos: [0.15, -0.15, 1.70], target: [0.08, -0.18, 0] },
};

// ── Camera initialiser ────────────────────────────────────────────────────────
function CameraSetup({ caseId }: { caseId: Op3DCaseId }) {
  const { camera } = useThree();
  useEffect(() => {
    const cfg = CAM_CFG[caseId];
    camera.position.set(...cfg.pos);
    camera.lookAt(new THREE.Vector3(...cfg.target));
    camera.updateProjectionMatrix();
  }, [caseId, camera]);
  return null;
}

// ── Single glowing wound marker ───────────────────────────────────────────────
function WoundMarker({
  position, radius, fixed, onClick,
}: {
  position: [number, number, number];
  radius: number;
  fixed: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.MeshStandardMaterial>(null);
  const fixedAt = useRef<number | null>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (fixed && fixedAt.current === null) {
      fixedAt.current = Date.now();
      setTimeout(() => setGone(true), 700);
    }
  }, [fixed]);

  useFrame(() => {
    if (gone || !meshRef.current || !matRef.current) return;
    const now = Date.now();
    if (fixed && fixedAt.current !== null) {
      const t = Math.min((now - fixedAt.current) / 650, 1);
      meshRef.current.scale.setScalar(1 + t * 1.5);
      matRef.current.opacity = 1 - t;
      matRef.current.color.set('#22c55e');
      matRef.current.emissive.set('#22c55e');
      matRef.current.emissiveIntensity = 1;
    } else {
      const pulse = 1 + Math.sin(now * 0.005) * 0.28;
      meshRef.current.scale.setScalar(pulse);
      matRef.current.emissiveIntensity = 1.4 + Math.sin(now * 0.009) * 0.6;
    }
  });

  if (gone) return null;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); if (!fixed) onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'crosshair'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <sphereGeometry args={[radius, 20, 20]} />
      <meshStandardMaterial
        ref={matRef}
        color="#ef4444"
        emissive="#ef4444"
        emissiveIntensity={1.4}
        transparent
        opacity={1}
      />
    </mesh>
  );
}

// ── Organ + rotating hotspot group ───────────────────────────────────────────
const MODEL_URL: Record<Op3DCaseId, string> = {
  heart:    '/3D/heart.glb',
  kidney:   '/3D/kidney.glb',
  appendix: '/3D/skeleton.glb',
};

function OrganScene({
  caseId, fixedSet, onFix,
}: {
  caseId: Op3DCaseId;
  fixedSet: Set<number>;
  onFix: (i: number) => void;
}) {
  const { scene } = useGLTF(MODEL_URL[caseId]);
  const groupRef  = useRef<THREE.Group>(null);

  const { modelOffset, positions, sphereRadius } = useMemo(() => {
    const box    = new THREE.Box3().setFromObject(scene);
    const size   = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const rel = REL_SPOTS[caseId];
    return {
      modelOffset: [-center.x, -center.y, -center.z] as [number, number, number],
      positions: rel.map(([rx, ry, rz]) => [
        rx * size.x * 0.5,
        ry * size.y * 0.5,
        rz * size.z * 0.5,
      ] as [number, number, number]),
      sphereRadius: Math.max(Math.min(size.x, size.y, size.z) * 0.065, 0.005),
    };
  }, [scene, caseId]);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.28;
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} position={modelOffset} />
      {positions.map((pos, i) => (
        <WoundMarker
          key={i}
          position={pos}
          radius={sphereRadius}
          fixed={fixedSet.has(i)}
          onClick={() => onFix(i)}
        />
      ))}
    </group>
  );
}

// ── Loader shown inside canvas while GLB is fetching ─────────────────────────
function CanvasLoader() {
  return null; // keep it silent; the outer UI shows the spinner
}

// ── Public component ──────────────────────────────────────────────────────────
export interface Operation3DProps {
  caseId: Op3DCaseId;
  bg: string;
  onDone: (score: number) => void;
}

const MESSAGES = ['✅ Рана затворена!', '💚 Перфектно!', '🎯 Отлично!', '🩹 Излекувано!'];

export default function Operation3D({ caseId, bg, onDone }: Operation3DProps) {
  const TOTAL         = 5;
  const TIME_LIMIT    = 45;
  const startRef      = useRef(Date.now());
  const doneFiredRef  = useRef(false);

  const [fixedSet, setFixedSet] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [flash, setFlash]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);

  const remaining = TOTAL - fixedSet.size;
  const allDone   = remaining === 0;

  // Hide loading spinner once canvas mounts
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(id);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (allDone || timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, allDone]);

  // Time out → finish
  useEffect(() => {
    if (timeLeft <= 0 && !allDone && !doneFiredRef.current) {
      doneFiredRef.current = true;
      onDone(Math.round((fixedSet.size / TOTAL) * 70));
    }
  }, [timeLeft, allDone, fixedSet.size, onDone]);

  // All wounds fixed → finish with time bonus
  useEffect(() => {
    if (allDone && !doneFiredRef.current) {
      doneFiredRef.current = true;
      const elapsed    = (Date.now() - startRef.current) / 1000;
      const timeBonus  = Math.max(0, (TIME_LIMIT - elapsed) / TIME_LIMIT);
      const score      = Math.round(70 + timeBonus * 30);
      setTimeout(() => onDone(score), 900);
    }
  }, [allDone, onDone]);

  const handleFix = useCallback((i: number) => {
    setFixedSet(prev => {
      const next = new Set(prev);
      next.add(i);
      return next;
    });
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    setFlash(msg);
    setTimeout(() => setFlash(null), 700);
  }, []);

  const timerPct  = (timeLeft / TIME_LIMIT) * 100;
  const timerColor = timeLeft > 15 ? '#22c55e' : timeLeft > 7 ? '#eab308' : '#ef4444';

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: bg }}>

      {/* 3D Canvas */}
      <Canvas
        camera={{ fov: 45, near: 0.001, far: 200 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%', background: bg }}
      >
        <CameraSetup caseId={caseId} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[2, 4, 3]}  intensity={1.1} castShadow />
        <directionalLight position={[-3, 1, -2]} intensity={0.4} color="#60a5fa" />
        <pointLight position={[0, 0.5, 0.8]} intensity={0.8} color="#ff3333" distance={2} />

        <Suspense fallback={<CanvasLoader />}>
          <OrganScene caseId={caseId} fixedSet={fixedSet} onFix={handleFix} />
          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={0.005}
          maxDistance={50}
          target={CAM_CFG[caseId].target}
          makeDefault
        />
      </Canvas>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white/70 animate-spin" />
          <span className="text-white/50 text-sm font-medium">Зареждане на модела…</span>
        </div>
      )}

      {/* Timer bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/10 z-10">
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${timerPct}%`, background: timerColor }}
        />
      </div>

      {/* Stats chips */}
      {!loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
          <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg">
            <span style={{ color: timerColor }}>⏱</span>
            <span style={{ color: timeLeft <= 7 ? timerColor : 'white' }}>{timeLeft}s</span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg">
            <span>🩸</span>
            <span>{remaining} рани</span>
          </div>
        </div>
      )}

      {/* Flash feedback */}
      {flash && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/80 backdrop-blur-sm text-white font-black text-xl px-6 py-3 rounded-2xl shadow-2xl">
            {flash}
          </div>
        </div>
      )}

      {/* Hint */}
      {!loading && !flash && remaining > 0 && (
        <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 text-white/30 text-xs font-medium whitespace-nowrap z-10">
          Кликни върху червените маркери · Завърти с мишка
        </div>
      )}

      {/* All-done banner */}
      {allDone && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="text-center">
            <div className="text-6xl mb-2">✅</div>
            <div className="text-white font-black text-2xl">Операцията успешна!</div>
          </div>
        </div>
      )}
    </div>
  );
}
