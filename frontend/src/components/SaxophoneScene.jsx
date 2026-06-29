import { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Sparkles, Environment, Lightformer, useProgress } from "@react-three/drei";
import * as THREE from "three";

function Loader3D() {
  const { progress } = useProgress();
  if (progress >= 100) return null;
  return (
    <div className="absolute inset-0 grid place-items-center pointer-events-none z-[2]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-full border border-white/10 border-t-[#e6b85c] animate-spin" />
        <span className="font-mono-x text-[10px] tracking-[0.3em] uppercase text-[#e6b85c]">Summoning the icon</span>
      </div>
    </div>
  );
}

const MODEL_URL = `${process.env.PUBLIC_URL || ""}/models/saxophone.glb`;

function Saxophone({ scrollRef, pointerRef }) {
  const { scene } = useGLTF(MODEL_URL);
  const group = useRef();

  // Clone (never mutate cached gltf) + normalize to a large size. Keep the ORIGINAL GLB
  // brass material untouched — only boost reflections so it shimmers with high contrast.
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    clone.scale.setScalar(5.3 / maxAxis);
    box.setFromObject(clone);
    const center = new THREE.Vector3();
    box.getCenter(center);
    clone.position.sub(center);
    clone.traverse((o) => {
      if (o.isMesh && o.material) {
        const m = o.material;
        m.metalness = 0.5;
        m.roughness = Math.min(m.roughness ?? 0.4, 0.34);
        m.envMapIntensity = 2.6;
        m.emissive = new THREE.Color("#5a3c0a");
        m.emissiveIntensity = 0.45;
        m.needsUpdate = true;
      }
    });
    return clone;
  }, [scene]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    const s = scrollRef.current || 0;
    const px = pointerRef.current.x || 0;
    const py = pointerRef.current.y || 0;
    // scroll spins it (up/down) + gentle idle drift; cursor adds a small tilt
    const targetY = s * Math.PI * 2 + t * 0.12 + px * 0.4;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.08);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -py * 0.16, 0.06);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, px * 0.06, 0.06);
    group.current.position.y = Math.sin(t * 0.5) * 0.06;
  });

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);

function SparkleField({ pointerRef }) {
  const g = useRef();
  useFrame(() => {
    if (!g.current) return;
    const px = pointerRef.current.x || 0;
    const py = pointerRef.current.y || 0;
    g.current.position.x = THREE.MathUtils.lerp(g.current.position.x, px * 1.4, 0.05);
    g.current.position.y = THREE.MathUtils.lerp(g.current.position.y, py * 1.0, 0.05);
    g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, px * 0.5, 0.04);
    g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, -py * 0.35, 0.04);
  });
  return (
    <group ref={g}>
      <Sparkles count={650} scale={[15, 11, 9]} size={1.1} speed={0.4} opacity={0.95} color="#f3cf86" noise={2.2} />
      <Sparkles count={260} scale={[12, 9, 7]} size={2.4} speed={0.22} opacity={0.6} color="#ffffff" noise={1.6} />
      <Sparkles count={120} scale={[9, 7, 6]} size={4} speed={0.15} opacity={0.4} color="#e6b85c" noise={1} />
    </group>
  );
}

function Rig({ pointerRef }) {
  useFrame((state) => {
    const px = pointerRef.current.x || 0;
    const py = pointerRef.current.y || 0;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, px * 0.5, 0.04);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, py * 0.35, 0.04);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function SaxophoneScene({ scrollRef }) {
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      pointerRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -((e.clientY / window.innerHeight) * 2 - 1),
      };
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none" data-testid="saxophone-scene">
      <Loader3D />
      <Canvas
        frameloop="always"
        camera={{ position: [0, 0, 7], fov: 46 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true, toneMappingExposure: 1.15 }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 7, 5]} intensity={4.2} color="#fff2d0" />
        <directionalLight position={[-6, -1, -3]} intensity={1.3} color="#e6a93f" />
        <pointLight position={[3, 3, 6]} intensity={18} color="#ffd790" distance={36} />
        <pointLight position={[-4, -2, 4]} intensity={8} color="#ffffff" distance={26} />

        {/* No-network high-contrast studio: bright thin strips = shimmering reflection streaks; dark fill = deep shadows */}
        <Environment resolution={512}>
          <Lightformer intensity={6} position={[0, 5, 6]} scale={[16, 1.4, 1]} color="#fff7e0" />
          <Lightformer intensity={5} position={[-3.5, 2, 5]} scale={[1.2, 14, 1]} color="#ffe7b0" />
          <Lightformer intensity={4.5} position={[3.5, -1, 5]} scale={[1.2, 14, 1]} color="#ffcf73" />
          <Lightformer intensity={3} position={[-7, 2, 1]} scale={[8, 10, 1]} color="#e6b85c" />
          <Lightformer intensity={0.2} position={[0, -6, -4]} scale={[18, 12, 1]} color="#120c04" />
        </Environment>

        <SparkleField pointerRef={pointerRef} />
        <Suspense fallback={null}>
          <Saxophone scrollRef={scrollRef} pointerRef={pointerRef} />
        </Suspense>
        <Rig pointerRef={pointerRef} />
      </Canvas>
    </div>
  );
}
