"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  Component,
  ReactNode,
} from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  DoubleSide,
  Group,
  Mesh,
  MathUtils,
} from "three";
type SceneInput = React.RefObject<{ x: number; y: number; scroll: number }>;
function Ribbon() {
  const geometry = useMemo(() => {
    const points: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = (i / 100) * Math.PI * 1.75;
      for (const side of [-1, 1]) {
        const r = 1.9 + side * 0.14;
        points.push(
          Math.cos(t) * r,
          Math.sin(t) * r * 0.55,
          Math.sin(t * 1.6) * 0.4 + side * 0.15 * Math.sin(t * 2),
        );
      }
      if (i < 100) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(points, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      position={[0, -0.5, -0.8]}
      rotation={[0.1, 0.2, -0.45]}
    >
      <meshStandardMaterial
        color="#eee8df"
        side={DoubleSide}
        roughness={0.75}
      />
    </mesh>
  );
}
function DetachedPetal({
  geometry,
  position,
  index,
  input,
}: {
  geometry: BufferGeometry;
  position: [number, number, number];
  index: number;
  input: SceneInput;
}) {
  const mesh = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    const dx = position[0] - input.current.x * 3,
      dy = position[1] + input.current.y * 2;
    const distance = Math.hypot(dx, dy);
    const force = Math.max(0, 1 - distance / 1.8) * 0.2;
    mesh.current.position.x = MathUtils.damp(
      mesh.current.position.x,
      position[0] + dx * force,
      2,
      delta,
    );
    mesh.current.position.y = MathUtils.damp(
      mesh.current.position.y,
      position[1] + dy * force + input.current.scroll * 0.08,
      2,
      delta,
    );
  });
  return (
    <Float
      speed={0.65 + index * 0.1}
      rotationIntensity={0.12}
      floatIntensity={0.12}
    >
      <mesh
        ref={mesh}
        geometry={geometry}
        position={position}
        scale={0.4 + index * 0.04}
        rotation={[0.8, index * 1.4, 0.6]}
      >
        <meshStandardMaterial
          color="#e51b2b"
          side={DoubleSide}
          roughness={0.4}
        />
      </mesh>
    </Float>
  );
}
function petalGeometry(layer = 2) {
  const points: number[] = [];
  const indices: number[] = [];
  const n = 22;
  for (let y = 0; y <= n; y++)
    for (let x = 0; x <= n; x++) {
      const u = (x / n) * 2 - 1,
        v = y / n;
      const spread = (0.6 - layer * 0.045) * Math.sin(Math.PI * v * 0.78);
      const radius = 0.035 + layer * 0.14 + v * (0.38 + layer * 0.21);
      const angle = u * spread;
      points.push(
        Math.sin(angle) * radius,
        Math.cos(angle) * radius,
        0.55 -
          layer * 0.1 +
          Math.sin(v * Math.PI * 0.86) * (0.2 + layer * 0.025) -
          v * v * 0.35 +
          u * u * v * 0.18,
      );
    }
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const a = y * (n + 1) + x;
      indices.push(a, a + 1, a + n + 1, a + 1, a + n + 2, a + n + 1);
    }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(points, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
function Flower({
  input,
}: {
  input: React.RefObject<{ x: number; y: number; scroll: number }>;
}) {
  const ref = useRef<Group>(null);
  const geometries = useMemo(
    () => Array.from({ length: 6 }, (_, i) => petalGeometry(i)),
    [],
  );
  const geometry = geometries[2];
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y = MathUtils.damp(
      ref.current.rotation.y,
      input.current.x * 0.17 + input.current.scroll * 0.12,
      2,
      delta,
    );
    ref.current.rotation.x = MathUtils.damp(
      ref.current.rotation.x,
      -0.35 + input.current.y * 0.1,
      2,
      delta,
    );
  });
  return (
    <group ref={ref} rotation={[-0.35, 0, 0.12]}>
      <group rotation={[0, 0, 0.15]}>
        {geometries.flatMap((g, layer) =>
          Array.from({ length: 5 + layer * 2 }, (_, i) => {
            const a = (i * Math.PI * 2) / (5 + layer * 2) + layer * 0.65;
            return (
              <mesh key={`${layer}-${i}`} geometry={g} rotation={[0, 0, a]}>
                <meshStandardMaterial
                  color={i % 4 === 0 ? "#f33342" : "#cf1328"}
                  side={DoubleSide}
                  roughness={0.48}
                  metalness={0.05}
                />
              </mesh>
            );
          }),
        )}
      </group>
      {[
        [-2, 0.9, -0.7],
        [1.8, -0.8, 0.2],
        [1.2, 1.7, -0.9],
      ].map((p, i) => (
        <DetachedPetal
          key={i}
          geometry={geometry}
          position={p as [number, number, number]}
          index={i}
          input={input}
        />
      ))}
      <Ribbon />
    </group>
  );
}
class SafeCanvas extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export default function Rose() {
  const holder = useRef<HTMLDivElement>(null);
  const input = useRef({ x: 0, y: 0, scroll: 0 });
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(true);
  const [low, setLow] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let capable = false;
    try {
      capable = !!document.createElement("canvas").getContext("webgl2");
    } catch {}
    const update = () => setEnabled(capable && !media.matches);
    update();
    media.addEventListener("change", update);
    setLow(navigator.hardwareConcurrency <= 4 || window.innerWidth < 768);
    const obs = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (holder.current) obs.observe(holder.current);
    const change = () => setActive(!document.hidden);
    const pointer = (e: PointerEvent) => {
      input.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      input.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const scroll = () => {
      input.current.scroll = Math.min(2, window.scrollY / window.innerHeight);
    };
    document.addEventListener("visibilitychange", change);
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      obs.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", change);
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("scroll", scroll);
    };
  }, []);
  return (
    <div ref={holder} className="rose-scene" aria-hidden="true">
      <div className="rose-fallback" />
      {enabled && visible && active && (
        <SafeCanvas>
          <Canvas
            dpr={low ? 1 : [1, 1.5]}
            camera={{ position: [0, 0, 5.7], fov: 38 }}
            gl={{ alpha: true, antialias: !low }}
          >
            <ambientLight intensity={1.5} />
            <directionalLight position={[3, 5, 4]} intensity={3} />
            <directionalLight position={[-3, -1, 3]} intensity={0.6} />
            <Flower input={input} />
          </Canvas>
        </SafeCanvas>
      )}
    </div>
  );
}
