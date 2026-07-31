import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { resolveAllPhotos, preloadPhoto, categoryGlow } from "./photoMap.js";

const DEFAULT_PHOTO = "/images/chicken/chicken-01.jpg";

function TargetOrbit({ color = "#c65b45" }) {
  const outerRingRef = useRef();
  const dotRef = useRef();

  useFrame((state) => {
    if (!outerRingRef.current || !dotRef.current) return;
    // Outer ring spins very slowly
    outerRingRef.current.rotation.z = state.clock.elapsedTime * 0.04;
    // Dot orbits the outer ring
    const t = state.clock.elapsedTime * 0.48;
    dotRef.current.position.x = Math.cos(t) * 1.72;
    dotRef.current.position.y = Math.sin(t) * 1.72;
  });

  return (
    <group>
      {/* Outer ring — rotates slowly, dot rides it */}
      <group ref={outerRingRef}>
        <mesh>
          <ringGeometry args={[1.70, 1.74, 128]} />
          <meshBasicMaterial color="#f7f3ee" transparent opacity={0.42} side={2} />
        </mesh>
        {/* 4 tick marks on outer ring */}
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 1.72, Math.sin(a) * 1.72, 0]}>
            <circleGeometry args={[0.042, 8]} />
            <meshBasicMaterial color="#f7f3ee" transparent opacity={0.55} side={2} />
          </mesh>
        ))}
      </group>

      {/* Middle ring — static */}
      <mesh>
        <ringGeometry args={[1.15, 1.18, 128]} />
        <meshBasicMaterial color="#f7f3ee" transparent opacity={0.22} side={2} />
      </mesh>

      {/* Inner ring — static */}
      <mesh>
        <ringGeometry args={[0.58, 0.60, 64]} />
        <meshBasicMaterial color="#f7f3ee" transparent opacity={0.15} side={2} />
      </mesh>

      {/* Crosshair lines — 4 directions */}
      <mesh position={[0, 1.1, 0]}>
        <planeGeometry args={[0.007, 0.52]} />
        <meshBasicMaterial color="#f7f3ee" transparent opacity={0.22} side={2} />
      </mesh>
      <mesh position={[0, -1.1, 0]}>
        <planeGeometry args={[0.007, 0.52]} />
        <meshBasicMaterial color="#f7f3ee" transparent opacity={0.22} side={2} />
      </mesh>
      <mesh position={[1.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[0.007, 0.52]} />
        <meshBasicMaterial color="#f7f3ee" transparent opacity={0.22} side={2} />
      </mesh>
      <mesh position={[-1.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[0.007, 0.52]} />
        <meshBasicMaterial color="#f7f3ee" transparent opacity={0.22} side={2} />
      </mesh>

      {/* Orbiting dot + glow halo */}
      <group ref={dotRef}>
        <mesh>
          <circleGeometry args={[0.1, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.95} side={2} />
        </mesh>
        <mesh scale={3.8}>
          <circleGeometry args={[0.1, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.18} side={2} />
        </mesh>
      </group>

      {/* Center dot */}
      <mesh>
        <circleGeometry args={[0.055, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} side={2} />
      </mesh>
    </group>
  );
}

function OrbitCanvas({ color }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 42 }}
      style={{ position: "absolute", inset: 0, background: "transparent", pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <TargetOrbit color={color} />
        <Stars radius={50} depth={25} count={100} factor={0.9} fade />
      </Suspense>
    </Canvas>
  );
}

export default function PhotoHero({
  query = "",
  category = "food",
}) {
  const defaultPhoto = category === "vehicle" ? resolveAllPhotos("vehicle", "vehicle")[0] : DEFAULT_PHOTO;
  const [photo, setPhoto] = useState(defaultPhoto);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const glow = categoryGlow[category] || categoryGlow.food;

  const photos = useMemo(() => {
    if (!query.trim()) return [defaultPhoto];
    return resolveAllPhotos(query, category);
  }, [query, category, defaultPhoto]);

  useEffect(() => {
    const first = photos[0];
    if (!first) return;
    preloadPhoto(first).then((src) => {
      if (src) setPhoto(src);
    });
    setPhotoIndex(0);
  }, [photos]);

  useEffect(() => {
    if (photos.length <= 1) return;
    const onScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      const nextIndex = Math.floor(y / 520) % photos.length;
      if (nextIndex !== photoIndex) {
        preloadPhoto(photos[nextIndex]).then((src) => {
          if (src) { setPhoto(src); setPhotoIndex(nextIndex); }
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [photos, photoIndex]);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", isolation: "isolate" }}>

      {/* Photo background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${photo})`,
          backgroundSize: "cover",
          backgroundPosition: "60% center",
          transform: `scale(1.08) translateY(${scrollY * -0.03}px)`,
          transition: "background-image 0.8s ease",
          zIndex: 1,
        }}
      />

      {/* Left-to-right dark fade — lets text stay readable */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2,
        background: "linear-gradient(90deg, rgba(12,11,10,0.97) 0%, rgba(12,11,10,0.88) 28%, rgba(12,11,10,0.62) 50%, rgba(12,11,10,0.2) 70%, rgba(12,11,10,0.05) 100%)",
      }} />

      {/* Bottom fade */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2,
        background: "linear-gradient(to top, rgba(12,11,10,0.6) 0%, transparent 40%)",
      }} />

      {/* Category-tinted glow on the photo side */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 3, mixBlendMode: "screen",
        background: `radial-gradient(circle at 68% 44%, rgba(247,243,238,0.1), transparent 14%), ${glow.bg}`,
      }} />

      {/* 3D scan rings — centered on the food photo */}
      <div style={{ position: "absolute", right: "6%", top: "12%", width: "480px", height: "480px", zIndex: 4, opacity: 0.9 }}>
        <OrbitCanvas color={glow.primary} />
      </div>
    </div>
  );
}
