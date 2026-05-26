import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import RecallRadarLogo from "./RecallRadarLogo";
import chickenInsights from "../data/source-intelligence/chicken-insights.json";

type Category = "food" | "drug" | "device" | "consumer";

function Logo() {
  return (
    <a className="rr-logo" href="#" aria-label="RecallRadar home">
      <RecallRadarLogo className="rr-mark" />
    </a>
  );
}

function RadarReticle({ compact = false }: { compact?: boolean }) {
  return (
    <svg className={compact ? "rr-reticle rr-reticle--compact" : "rr-reticle"} viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="36" r="30" stroke="#fff" strokeOpacity=".16" />
      <circle cx="36" cy="36" r="19" stroke="#fff" strokeOpacity=".2" strokeDasharray="3 5" />
      <circle cx="36" cy="36" r="9" stroke="#fff" strokeOpacity=".34" />
      <path d="M36 5V15M36 57V67M5 36H15M57 36H67" stroke="#fff" strokeOpacity=".28" strokeLinecap="round" />
      <circle cx="36" cy="36" r="3" fill="#fff" />
      <circle cx="36" cy="36" r="1.5" fill="#ff372f" />
      <circle cx="53" cy="21" r="3" fill="#ff372f" />
    </svg>
  );
}

function HorizonGrid() {
  const dots = useMemo(() => {
    const result: { x: number; z: number; s: number; o: number }[] = [];
    for (let ring = 1; ring <= 16; ring += 1) {
      const count = 18 + ring * 8;
      const radius = ring * 0.48;
      for (let i = 0; i < count; i += 1) {
        if (i % 3 === 0 && ring < 8) continue;
        const angle = (i / count) * Math.PI * 2;
        result.push({
          x: Math.cos(angle) * radius,
          z: Math.sin(angle) * radius,
          s: ring % 4 === 0 ? 0.018 : 0.011,
          o: Math.max(0.08, 0.42 - ring * 0.018),
        });
      }
    }
    return result;
  }, []);

  return (
    <group position={[1.45, -2.35, -1.4]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <circleGeometry args={[8.5, 160]} />
        <meshBasicMaterial color="#161214" transparent opacity={0.42} />
      </mesh>
      {[1.6, 2.65, 3.8, 5.1, 6.6].map((radius) => (
        <mesh key={radius}>
          <ringGeometry args={[radius, radius + 0.012, 180]} />
          <meshBasicMaterial color="#ff3b30" transparent opacity={radius < 3 ? 0.13 : 0.07} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {Array.from({ length: 18 }).map((_, index) => (
        <mesh key={index} rotation={[0, 0, (index / 18) * Math.PI]}>
          <planeGeometry args={[0.01, 13.6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.028} />
        </mesh>
      ))}
      {dots.map((dot, index) => (
        <mesh key={index} position={[dot.x, dot.z, 0.018]}>
          <circleGeometry args={[dot.s, 8]} />
          <meshBasicMaterial color={index % 5 === 0 ? "#ffffff" : "#ff3b30"} transparent opacity={dot.o} />
        </mesh>
      ))}
    </group>
  );
}

function SentinelOrb() {
  const orb = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (orb.current) orb.current.rotation.y = t * 0.055;
    if (ringA.current) ringA.current.rotation.z = t * 0.035;
    if (ringB.current) ringB.current.rotation.x = t * -0.028;
  });

  return (
    <group position={[1.35, 0.18, -0.35]}>
      <group ref={orb}>
        <mesh>
          <sphereGeometry args={[1.88, 96, 96]} />
          <meshStandardMaterial color="#08080a" metalness={0.98} roughness={0.12} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.895, 28, 28]} />
          <meshBasicMaterial color="#6b6269" wireframe transparent opacity={0.18} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.89, 0.018, 12, 180]} />
          <meshBasicMaterial color="#ff3028" transparent opacity={0.95} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.89, 0.115, 16, 180]} />
          <meshBasicMaterial color="#ff3028" transparent opacity={0.12} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.9, 0.33, 16, 180]} />
          <meshBasicMaterial color="#ff3028" transparent opacity={0.035} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.14, 1.148, 160]} />
          <meshBasicMaterial color="#ff3028" transparent opacity={0.38} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh ref={ringA} rotation={[0.68, 0.12, -0.42]}>
        <ringGeometry args={[2.08, 2.1, 180]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ringB} rotation={[1.2, 0.72, 0.05]}>
        <ringGeometry args={[2.25, 2.265, 180]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.02, 1.89]}>
        <circleGeometry args={[0.065, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
      </mesh>
      <mesh position={[0, -0.02, 1.895]} scale={[5, 0.42, 1]}>
        <circleGeometry args={[0.28, 64]} />
        <meshBasicMaterial color="#ff3028" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function HeroScene() {
  return (
    <Canvas camera={{ position: [0, 0.46, 7.2], fov: 38 }} dpr={[1, 1.7]} className="rr-scene">
      <Suspense fallback={null}>
        <color attach="background" args={["#000"]} />
        <ambientLight intensity={0.08} />
        <pointLight position={[1.45, -0.18, 2.3]} color="#ff342c" intensity={8.5} distance={8} />
        <pointLight position={[4.2, 2.4, 3.4]} color="#fff5f5" intensity={1.35} distance={10} />
        <pointLight position={[-2.5, -1.6, 2]} color="#ff493d" intensity={1.1} distance={8} />
        <Stars radius={70} depth={40} count={320} factor={1.1} fade speed={0.12} />
        <SentinelOrb />
        <HorizonGrid />
      </Suspense>
    </Canvas>
  );
}

function HorizonInstallation() {
  const group = useRef<THREE.Group>(null);
  const globe = useRef<THREE.Group>(null);
  const flare = useRef<THREE.Group>(null);
  const orbitA = useRef<THREE.Mesh>(null);
  const orbitB = useRef<THREE.Mesh>(null);
  const sourceDots = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.18) * 0.08;
      group.current.position.y = Math.sin(t * 0.28) * 0.045;
    }
    if (globe.current) {
      globe.current.rotation.y = t * 0.13;
      globe.current.rotation.x = Math.sin(t * 0.24) * 0.035;
    }
    if (flare.current) {
      const s = 1 + Math.sin(t * 2.5) * 0.12;
      flare.current.scale.setScalar(s);
    }
    if (orbitA.current) orbitA.current.rotation.z = t * 0.16;
    if (orbitB.current) orbitB.current.rotation.x = t * -0.12;
    if (sourceDots.current) sourceDots.current.rotation.z = t * 0.34;
  });

  return (
    <group ref={group} position={[0, -0.1, 0]}>
      <group ref={globe}>
        <mesh>
          <sphereGeometry args={[1.58, 96, 96]} />
          <meshStandardMaterial color="#030304" metalness={0.95} roughness={0.18} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.595, 30, 30]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.08} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.59, 0.02, 12, 190]} />
          <meshBasicMaterial color="#ff3b30" transparent opacity={0.92} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.59, 0.14, 16, 190]} />
          <meshBasicMaterial color="#ff3b30" transparent opacity={0.1} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.59, 0.38, 16, 190]} />
          <meshBasicMaterial color="#ff3b30" transparent opacity={0.035} />
        </mesh>
      </group>

      <mesh ref={orbitA} rotation={[0.88, 0.12, -0.26]}>
        <ringGeometry args={[1.9, 1.915, 190]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.14} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={orbitB} rotation={[1.28, -0.42, 0.2]}>
        <ringGeometry args={[2.13, 2.145, 190]} />
        <meshBasicMaterial color="#ff3b30" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>

      <group ref={sourceDots} rotation={[0, 0, 0]}>
        {[0, Math.PI * 0.66, Math.PI * 1.32].map((angle, index) => (
          <group key={angle} position={[Math.cos(angle) * 1.9, Math.sin(angle) * 1.9, 0.12]}>
            <mesh>
              <sphereGeometry args={[index === 0 ? 0.06 : 0.045, 24, 24]} />
              <meshBasicMaterial color={index === 0 ? "#ffffff" : "#ff3b30"} transparent opacity={0.95} />
            </mesh>
            <mesh scale={[3.4, 1, 1]}>
              <sphereGeometry args={[0.08, 18, 18]} />
              <meshBasicMaterial color="#ff3b30" transparent opacity={0.16} />
            </mesh>
          </group>
        ))}
      </group>

      <group ref={flare} position={[0, 0, 1.6]}>
        <mesh>
          <sphereGeometry args={[0.08, 32, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.98} />
        </mesh>
        <mesh scale={[6.2, 0.55, 1]}>
          <sphereGeometry args={[0.18, 32, 32]} />
          <meshBasicMaterial color="#ff3b30" transparent opacity={0.42} />
        </mesh>
        <mesh scale={[1.2, 1.2, 1]}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshBasicMaterial color="#ff3b30" transparent opacity={0.16} />
        </mesh>
      </group>

      <mesh position={[0, 0.78, 1.58]}>
        <planeGeometry args={[0.012, 1.5]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.42} />
      </mesh>
    </group>
  );
}

function HorizonCanvas() {
  return (
    <Canvas camera={{ position: [0, 0.05, 5.4], fov: 42 }} dpr={[1, 1.6]} className="rr-horizon-canvas">
      <Suspense fallback={null}>
        <ambientLight intensity={0.12} />
        <pointLight position={[0, 0.3, 2.6]} color="#ff3b30" intensity={2.4} distance={6} />
        <pointLight position={[1.8, 1.2, 2.2]} color="#ffffff" intensity={0.6} distance={5} />
        <HorizonInstallation />
      </Suspense>
    </Canvas>
  );
}

function IntelligenceOrb() {
  const group = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = t * 0.16;
      group.current.rotation.x = Math.sin(t * 0.35) * 0.08;
    }
    if (scan.current) scan.current.rotation.z = t * 0.55;
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[1.08, 64, 64]} />
        <meshStandardMaterial color="#09090a" metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.095, 18, 18]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.018, 12, 160]} />
        <meshBasicMaterial color="#ff3b30" transparent opacity={0.75} />
      </mesh>
      <mesh ref={scan} rotation={[0.2, 0.5, 0]}>
        <ringGeometry args={[1.32, 1.34, 160]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.16} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.25, -0.08, 1.08]} scale={[3.8, 0.42, 1]}>
        <circleGeometry args={[0.13, 48]} />
        <meshBasicMaterial color="#ff332c" transparent opacity={0.62} />
      </mesh>
    </group>
  );
}

function IntelligenceCanvas() {
  return (
    <Canvas camera={{ position: [0, 0.1, 4.1], fov: 42 }} dpr={[1, 1.6]} className="rr-mini-canvas">
      <Suspense fallback={null}>
        <ambientLight intensity={0.1} />
        <pointLight position={[1.8, 0.1, 2.4]} color="#ff3b30" intensity={4.2} distance={6} />
        <pointLight position={[-2.6, 2.4, 2.5]} color="#ffffff" intensity={1.4} distance={7} />
        <Stars radius={40} depth={18} count={120} factor={0.75} fade />
        <IntelligenceOrb />
      </Suspense>
    </Canvas>
  );
}

function PipelineScene() {
  const group = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) group.current.rotation.y = Math.sin(t * 0.35) * 0.1;
    if (pulse.current) {
      const x = ((t * 0.85) % 4.8) - 2.4;
      pulse.current.position.x = x;
      pulse.current.position.y = 0.08;
    }
  });

  return (
    <group ref={group} position={[0, -0.05, 0]}>
      <mesh position={[0, 0.08, -0.03]}>
        <planeGeometry args={[5.2, 0.018]} />
        <meshBasicMaterial color="#ff3b30" transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, 0.08, -0.04]}>
        <planeGeometry args={[5.4, 0.22]} />
        <meshBasicMaterial color="#ff3b30" transparent opacity={0.09} />
      </mesh>
      <mesh position={[0, 0.08, -0.05]}>
        <planeGeometry args={[5.55, 0.62]} />
        <meshBasicMaterial color="#ff3b30" transparent opacity={0.035} />
      </mesh>
      {[-2.4, 0, 2.4].map((x, index) => (
        <group key={x} position={[x, 0.08, 0]}>
          <mesh>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshStandardMaterial color="#101012" emissive="#2b0907" metalness={0.7} roughness={0.22} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.28, 0.295, 72]} />
            <meshBasicMaterial color={index === 1 ? "#ffffff" : "#ff3b30"} transparent opacity={index === 1 ? 0.32 : 0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh scale={index === 1 ? 1.4 : 1.1}>
            <sphereGeometry args={[0.17, 24, 24]} />
            <meshBasicMaterial color="#ff3b30" transparent opacity={index === 1 ? 0.1 : 0.07} />
          </mesh>
        </group>
      ))}
      <group ref={pulse} position={[-2.4, 0.02, 0.04]}>
        <mesh>
          <sphereGeometry args={[0.075, 32, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
        </mesh>
        <mesh scale={[5.8, 1.2, 1]}>
          <sphereGeometry args={[0.09, 32, 32]} />
          <meshBasicMaterial color="#ff3b30" transparent opacity={0.28} />
        </mesh>
        <mesh scale={[13, 0.65, 1]}>
          <sphereGeometry args={[0.055, 24, 24]} />
          <meshBasicMaterial color="#ff3b30" transparent opacity={0.18} />
        </mesh>
      </group>
    </group>
  );
}

function PipelineCanvas() {
  return (
    <Canvas camera={{ position: [0, 0.35, 5.6], fov: 42 }} dpr={[1, 1.6]} className="rr-pipeline-canvas">
      <Suspense fallback={null}>
        <ambientLight intensity={0.16} />
        <pointLight position={[0, 1.3, 2.8]} color="#ff3b30" intensity={3.5} distance={7} />
        <pointLight position={[-2, 1.8, 2.2]} color="#ffffff" intensity={0.8} distance={6} />
        <PipelineScene />
      </Suspense>
    </Canvas>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 15 15 5M8 5h7v7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RadarLensButton({ label = "Search" }: { label?: string }) {
  return (
    <span className="rr-lens-button" aria-hidden="true">
      <span className="rr-lens-core">
        {Array.from({ length: 56 }).map((_, index) => (
          <i key={index} style={{ transform: `rotate(${index * (360 / 56)}deg)` }} />
        ))}
        <b />
      </span>
      <span>{label}</span>
    </span>
  );
}

function CategoryIcon({ name }: { name: string }) {
  const common = { stroke: "currentColor", strokeWidth: 1.35, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {name === "food" && (
        <>
          <path d="M10.5 9.2c-4.6 1.6-4.2 8.6-.5 10.8 2.2 1.3 3.2-.3 4-.3s1.8 1.6 4 .3c3.7-2.2 4.1-9.2-.5-10.8-1.6-.6-2.8.2-3.5.9-.7-.7-1.9-1.5-3.5-.9Z" {...common} />
          <path d="M14.2 9.8c.2-2.2 1.2-3.8 3.5-4.7" {...common} />
          <path d="M10.6 5.9c1.3.1 2.4.9 3.1 2.1" {...common} />
        </>
      )}
      {name === "drug" && (
        <>
          <rect x="5" y="12" width="18" height="8" rx="4" {...common} />
          <path d="M14 12v8M8.2 6.8l2.6-2.6a3 3 0 0 1 4.2 4.2L12.4 11" {...common} />
        </>
      )}
      {name === "device" && <path d="M4 14h4.5l2-5.5 4 11 2.4-7 2 3.5H24" {...common} />}
      {name === "consumer" && (
        <>
          <path d="M7 11h14l-1.2 10H8.2L7 11Z" {...common} />
          <path d="M10 11V8.5a4 4 0 0 1 8 0V11" {...common} />
        </>
      )}
      {name === "vehicle" && (
        <>
          <path d="M5 14.5 7.6 10h12.8l2.6 4.5v5H5v-5Z" {...common} />
          <path d="M7 15h14M9 19.5h.1M19 19.5h.1" {...common} />
          <circle cx="9" cy="20" r="1.8" {...common} />
          <circle cx="19" cy="20" r="1.8" {...common} />
        </>
      )}
    </svg>
  );
}

function FeatureIcon({ type }: { type: string }) {
  if (type === "monitor") return <RecallRadarLogo compact className="rr-mark rr-mark--compact" />;
  if (type === "detect") return <RadarReticle compact />;
  return (
    <svg className="rr-feature-svg" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {type === "guide" && (
        <>
          <path d="M32 11 49 18v12c0 11-7.2 18.6-17 23-9.8-4.4-17-12-17-23V18l17-7Z" stroke="#fff" strokeOpacity=".22" />
          <path d="m25 31 5 5 10-12" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {type === "trust" && (
        <>
          <circle cx="32" cy="32" r="21" stroke="#fff" strokeOpacity=".22" />
          <path d="M44 22a16 16 0 0 1 3.5 10" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" />
          <circle cx="47.5" cy="32" r="3" fill="#ff3b30" />
        </>
      )}
    </svg>
  );
}

export default function LandingPage({
  onLaunch,
  onCategory,
}: {
  onLaunch: () => void;
  onCategory: (cat: Category) => void;
}) {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [heroQuery, setHeroQuery] = useState("");
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [commandMode, setCommandMode] = useState<"search" | "monitor">("search");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [proofRevealed, setProofRevealed] = useState(false);

  const joinWaitlist = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Enter a valid email");
      return;
    }
    try {
      await fetch("https://api.sheetbest.com/sheets/a5c4ecd4-7684-48f7-9cd0-8ccf090c0b7a", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "landing_hero", timestamp: new Date().toISOString() }),
      });
      setJoined(true);
    } catch {
      alert("Something went wrong. Try again.");
    }
  };

  const categories: { label: string; cat: Category; icon: string; source: string; example: string }[] = [
    { label: "Food", cat: "food", icon: "food", source: "FDA", example: "chicken" },
    { label: "Medicine", cat: "drug", icon: "drug", source: "FDA", example: "ibuprofen" },
    { label: "Medical Devices", cat: "device", icon: "device", source: "FDA", example: "syringe" },
    { label: "Consumer Products", cat: "consumer", icon: "consumer", source: "CPSC", example: "air fryer" },
    { label: "Vehicles", cat: "consumer", icon: "vehicle", source: "NHTSA", example: "2021 Toyota Camry" },
  ];

  const activeCategory = categories[activeCategoryIndex];
  const commandExamples = categories.map((category) => category.example);
  const commandPlaceholder = commandMode === "monitor"
    ? `Save ${activeCategory.example} for recall alerts`
    : `Search "${commandExamples[placeholderIndex]}"`;

  useEffect(() => {
    if (heroQuery.trim()) return;
    const id = window.setInterval(() => {
      setPlaceholderIndex((index) => (index + 1) % commandExamples.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, [commandExamples.length, heroQuery]);

  const features: { title: string; body: string; icon: string | ReactNode }[] = [
    { title: "Real-time monitoring", body: "We track recalls as they happen across official sources.", icon: "monitor" },
    { title: "Intelligent detection", body: "AI-powered matching understands what you search, not just keywords.", icon: "detect" },
    { title: "Actionable guidance", body: "Clear steps so you know exactly what to do.", icon: "guide" },
    { title: "Built for trust", body: "Transparent, independent, and privacy-first by design.", icon: "trust" },
  ];

  const workflow = [
    { step: "01", title: "Search anything you bring home", body: "Type a brand, product, ingredient, device, or vehicle. RecallRadar normalizes messy terms into official-source recall lookups." },
    { step: "02", title: "Match against live safety signals", body: "The system compares FDA, CPSC, and vehicle recall data, then highlights the source, date, company, severity, and affected product details." },
    { step: "03", title: "Know the next action", body: "Plain-language guidance turns recall records into practical steps: stop use, check lot codes, return, contact, repair, or monitor." },
  ];

  const intelligenceCards = [
    ["FDA", "Food, medicine, and medical device enforcement recall data."],
    ["CPSC", "Consumer product recalls for household goods, toys, appliances, and more."],
    ["NHTSA", "Vehicle safety campaigns by year, make, model, component, and manufacturer."],
    ["Household graph", "Saved products and vehicles become monitorable mobile safety signals."],
  ];

  const coverageStats = [
    ["3", "official sources"],
    ["5", "safety categories"],
    ["24/7", "monitoring model"],
  ];

  const sourceSignals = [
    { source: "FDA", scope: "Food • Drugs • Devices", count: "3", label: "categories" },
    { source: "CPSC", scope: "Consumer Products", count: "1", label: "source" },
    { source: "NHTSA", scope: "Vehicles", count: "1", label: "vehicle graph" },
  ];

  const chickenProof = {
    total: chickenInsights.totalOfficialMatches,
    pulled: chickenInsights.recordsPulled,
    generatedAt: new Date(chickenInsights.generatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    classes: chickenInsights.byClassification,
    signals: chickenInsights.topRiskKeywords.slice(0, 5),
  };

  return (
    <main className="rr-landing">
      <div className="rr-bg">
        <div className="rr-earthrise-bg" />
        <div className="rr-space-vignette" />
        <div className="rr-horizon" />
      </div>

      <div className="rr-hero-stage">
        <header className="rr-nav">
          <Logo />
          <nav className="rr-links" aria-label="Primary navigation">
            {["How it works", "Categories", "Intelligence", "About"].map((item) => (
              <a href={`#${item.toLowerCase().replaceAll(" ", "-")}`} key={item}>
                {item}
              </a>
            ))}
          </nav>
          <div className="rr-actions">
            <button className="rr-signin" onClick={onLaunch}>Sign in</button>
            <button className="rr-outline" onClick={() => setShowEmail((value) => !value)}>
              Join early access <ArrowIcon />
            </button>
          </div>
        </header>

        <section className="rr-hero" aria-labelledby="recallradar-title">
          <motion.div className="rr-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="rr-kicker">KNOW BEFORE IT HURTS YOU.</p>
            <h1 id="recallradar-title">
              Real-time recall
              <br />
              intelligence.
              <br />
              <span>For everything</span>
              <br />
              <span>you bring home.</span>
            </h1>
            <p className="rr-body">
              RecallRadar monitors food, medicine, medical devices, consumer products, and vehicles - so you can protect what matters most.
            </p>

            <div className="rr-command-deck">
              <div className="rr-command-topline">
                <span>RECALL COMMAND</span>
                <div className="rr-mode-toggle" aria-label="Command mode">
                  {(["search", "monitor"] as const).map((mode) => (
                    <button
                      key={mode}
                      className={commandMode === mode ? "is-active" : ""}
                      onClick={() => setCommandMode(mode)}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <strong>{activeCategory.source} READY</strong>
              </div>

              <div className="rr-search-shell">
                <div className="rr-search-lens" aria-hidden="true">
                  <RadarLensButton label="" />
                </div>
                <input
                  value={heroQuery}
                  onChange={(event) => setHeroQuery(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && onLaunch()}
                  placeholder={commandPlaceholder}
                  aria-label="Search recalls"
                />
                <button className="rr-search-action" onClick={onLaunch}>
                  <span>{commandMode === "monitor" ? "Join monitoring" : "Explore intelligence"}</span>
                  <ArrowIcon />
                </button>
              </div>

              <div className="rr-command-examples" aria-label="Example recall searches">
                <span>Try</span>
                {commandExamples.map((example, index) => (
                  <button
                    key={example}
                    className={activeCategoryIndex === index ? "is-active" : ""}
                    onClick={() => {
                      setActiveCategoryIndex(index);
                      setPlaceholderIndex(index);
                      setHeroQuery(example);
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {showEmail && !joined && (
                <motion.div className="rr-email" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && joinWaitlist()}
                    placeholder="your@email.com"
                  />
                  <button onClick={joinWaitlist}>Join</button>
                </motion.div>
              )}
              {joined && (
                <motion.p className="rr-joined" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  You're on the list. We'll be in touch.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.aside className="rr-status" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45, duration: 0.6 }}>
            <p>SYSTEM ONLINE</p>
            <span>Monitoring recalls across 5 categories 24/7</span>
            <RadarReticle compact />
          </motion.aside>
        </section>

        <section id="categories" className="rr-category-rail" aria-label="Recall categories">
          {categories.map((category, index) => (
            <button
              key={category.label}
              className={activeCategoryIndex === index ? "rr-category is-active" : "rr-category"}
              onClick={() => {
                setActiveCategoryIndex(index);
                setPlaceholderIndex(index);
              }}
              onDoubleClick={() => onCategory(category.cat)}
            >
              <span className="rr-category-icon"><CategoryIcon name={category.icon} /></span>
              <span className="rr-category-copy">
                <b>{category.label}</b>
                <em>{category.source}</em>
              </span>
              {index < categories.length - 1 && <i aria-hidden="true" />}
            </button>
          ))}
        </section>

        <section className="rr-feature-panel" aria-label="RecallRadar capabilities">
          {features.map((feature) => (
            <article className="rr-feature" key={feature.title}>
              <div className="rr-feature-icon">
                {typeof feature.icon === "string" ? <FeatureIcon type={feature.icon} /> : feature.icon}
              </div>
              <h2>{feature.title}</h2>
              <p>{feature.body}</p>
            </article>
          ))}
        </section>
      </div>

      <section className="rr-proof-section" aria-labelledby="proof-title">
        <div className="rr-proof-copy">
          <p className="rr-section-kicker">WHAT THE LABEL DOESN'T TELL YOU</p>
          <h2 id="proof-title">Your food can look normal. The recall record tells another story.</h2>
          <p>
            A search for chicken surfaces hundreds of official FDA enforcement records across Listeria, Salmonella, undeclared allergens, plastic, and other signals. RecallRadar turns that hidden public record into something a household can understand.
          </p>
          <div className="rr-proof-actions">
            <button className="rr-primary rr-proof-primary" onClick={() => setProofRevealed((value) => !value)}>
              {proofRevealed ? "Hide recall layer" : "Reveal the recall layer"} <ArrowIcon />
            </button>
            <button className="rr-proof-link" onClick={onLaunch}>Search a product <ArrowIcon /></button>
          </div>
        </div>

        <aside className="rr-proof-card">
          <div className="rr-proof-visual">
            <img src="/images/chicken/chicken-recall-specimen.png" alt="Chicken surrounded by recall risk signals" />
            <div className="rr-proof-visual-vignette" />
            {chickenProof.signals.map(([label, count], index) => (
              <button
                type="button"
                key={label}
                className={`rr-organism rr-organism-${index + 1}`}
                aria-label={`${label}: ${count} FDA food enforcement matches in the pulled chicken recall records`}
              >
                <i />
                <b>{label}</b>
                <em>{count}</em>
                <small>
                  FDA food enforcement
                  <br />
                  {count} matches in {chickenProof.pulled.toLocaleString()} pulled records
                </small>
              </button>
            ))}
            {!proofRevealed && (
              <button className="rr-proof-reveal-hotspot" onClick={() => setProofRevealed(true)}>
                <RadarLensButton label="" />
                <span>Tap to reveal what recall data sees</span>
              </button>
            )}
          </div>

          <AnimatePresence initial={false}>
            {proofRevealed && (
              <motion.div
                className="rr-proof-data"
                initial={{ opacity: 0, y: 14, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 10, height: 0 }}
              >
                <div className="rr-proof-card-head">
                  <span>FDA FOOD ENFORCEMENT</span>
                  <b>Official snapshot</b>
                </div>
                <strong>{chickenProof.total.toLocaleString()}</strong>
                <p>official matches for “chicken”</p>
                <div className="rr-proof-classes">
                  {chickenProof.classes.map(([label, count]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <b>{count}</b>
                    </div>
                  ))}
                </div>
                <small>FDA openFDA Food Enforcement API • pulled {chickenProof.pulled.toLocaleString()} records • {chickenProof.generatedAt}</small>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </section>

      <section id="how-it-works" className="rr-section rr-how">
        <div className="rr-section-head">
          <p className="rr-section-kicker">HOW IT WORKS</p>
          <h2>From search to safety decision in seconds.</h2>
          <span>Built for real households, not regulatory experts.</span>
        </div>
        <div className="rr-pipeline-panel" aria-hidden="true">
          <PipelineCanvas />
          <div className="rr-pipeline-labels">
            <span>Search</span>
            <span>Match</span>
            <span>Act</span>
          </div>
        </div>
        <div className="rr-workflow">
          {workflow.map((item) => (
            <article key={item.step} className="rr-step">
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="intelligence" className="rr-section rr-intelligence-band">
        <div className="rr-orb-panel">
          <IntelligenceCanvas />
          <div className="rr-orb-stats" aria-label="RecallRadar source coverage metrics">
            {coverageStats.map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="rr-orb-readout">
            <p>OFFICIAL SOURCE LAYER</p>
            <strong>FDA • CPSC • NHTSA</strong>
            <span>Public recall systems unified for product search</span>
          </div>
          <div className="rr-source-orbits" aria-hidden="true">
            {sourceSignals.map((signal) => (
              <div key={signal.source}>
                <b>{signal.source}</b>
                <span>{signal.scope}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rr-intel-copy">
          <p className="rr-section-kicker">SOURCE COVERAGE</p>
          <h2>One intelligence layer across FDA, CPSC, and NHTSA recalls.</h2>
          <p>
            The globe represents official recall data flowing into one household safety graph. Search now; later, the mobile app can monitor saved products and vehicles automatically.
          </p>
          <div className="rr-source-table">
            {sourceSignals.map((signal) => (
              <article key={signal.source}>
                <div>
                  <strong>{signal.source}</strong>
                  <span>{signal.scope}</span>
                </div>
                <p><b>{signal.count}</b>{signal.label}</p>
              </article>
            ))}
          </div>
          <div className="rr-intel-grid">
            {intelligenceCards.map(([title, body]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rr-section rr-coverage" aria-labelledby="coverage-title">
        <div className="rr-section-head">
          <p className="rr-section-kicker">CATEGORY COVERAGE</p>
          <h2 id="coverage-title">One safety surface for the products that matter most.</h2>
        </div>
        <div className="rr-coverage-grid">
          {categories.map((category) => (
            <button key={category.label} onClick={() => onCategory(category.cat)} className="rr-coverage-card">
              <CategoryIcon name={category.icon} />
              <h3>{category.label}</h3>
              <p>{category.label === "Vehicles" ? "Campaign, component, and manufacturer recall checks." : "Official recall search, plain-language risk context, and household guidance."}</p>
            </button>
          ))}
        </div>
      </section>

      <section id="about" className="rr-section rr-trust">
        <div>
          <p className="rr-section-kicker">BUILT FOR TRUST</p>
          <h2>Independent, transparent, and designed for high-stakes clarity.</h2>
        </div>
        <div className="rr-trust-list">
          {["Official-source first", "Privacy-conscious product monitoring", "Clear uncertainty when AI cannot verify", "Action steps before feature hype"].map((item) => (
            <p key={item}><span />{item}</p>
          ))}
        </div>
      </section>

      <section className="rr-final-cta">
        <RecallRadarLogo className="rr-final-logo" />
        <h2>Know before it hurts you.</h2>
        <p>Search recalls now, or join early access for household monitoring as RecallRadar expands.</p>
        <div>
          <button className="rr-primary rr-final-primary" onClick={onLaunch}>Explore intelligence <ArrowIcon /></button>
          <button className="rr-outline" onClick={() => setShowEmail((value) => !value)}>Join early access <ArrowIcon /></button>
        </div>
      </section>

      <style>{`
        .rr-landing {
          position: relative;
          min-height: 100svh;
          overflow-x: hidden;
          background: #000;
          color: #fff;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          isolation: isolate;
        }

        .rr-hero-stage {
          position: relative;
          min-height: 100svh;
          overflow: hidden;
          z-index: 1;
        }

        .rr-bg,
        .rr-scene,
        .rr-earthrise-bg,
        .rr-space-vignette,
        .rr-horizon {
          position: absolute;
          inset: 0;
        }

        .rr-bg {
          z-index: 0;
          bottom: auto;
          height: 100svh;
          background: #000;
          pointer-events: none;
        }

        .rr-scene {
          width: 100%;
          height: 100%;
        }

        .rr-earthrise-bg {
          z-index: 1;
          background-image: url("/images/brand/recallradar-earth-sunrise-red.png");
          background-size: cover;
          background-position: 56% 48%;
          filter: saturate(1.02) contrast(1.08) brightness(.9);
          transform: scale(1.012);
          transform-origin: 55% 44%;
          animation: rrEarthriseDrift 28s ease-in-out infinite alternate;
        }

        .rr-space-vignette {
          z-index: 2;
          background:
            linear-gradient(90deg, rgba(0,0,0,.98) 0%, rgba(0,0,0,.9) 25%, rgba(0,0,0,.5) 48%, rgba(0,0,0,.42) 68%, rgba(0,0,0,.78) 100%),
            linear-gradient(180deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,.1) 26%, rgba(0,0,0,.36) 66%, rgba(0,0,0,.94) 100%),
            radial-gradient(circle at 50% 34%, rgba(18, 88, 180, .16), transparent 24%),
            radial-gradient(circle at 66% 64%, rgba(255,59,48,.14), transparent 34%);
          pointer-events: none;
        }

        .rr-horizon {
          top: auto;
          height: 50%;
          z-index: 3;
          background:
            radial-gradient(ellipse at 52% 8%, rgba(255,255,255,.42), rgba(64,146,255,.2) 12%, transparent 28%),
            linear-gradient(180deg, transparent 0 38%, rgba(255,255,255,.14) 39%, rgba(107,177,255,.2) 40%, transparent 45%),
            radial-gradient(ellipse at 60% 34%, rgba(255,59,48,.16), transparent 46%);
          mix-blend-mode: screen;
          opacity: .58;
          pointer-events: none;
        }

        .rr-nav {
          position: relative;
          z-index: 5;
          height: 128px;
          display: grid;
          grid-template-columns: minmax(420px, 1fr) auto minmax(330px, 1fr);
          align-items: center;
          gap: 28px;
          padding: 0 clamp(28px, 4vw, 64px);
        }

        .rr-logo {
          display: block;
          color: #fff;
          text-decoration: none;
          width: 342px;
          height: 142px;
          transform: translate(-18px, 3px);
        }

        .rr-logo .rr-mark {
          display: block;
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .rr-mark--compact {
          width: 64px;
          height: 35px;
        }

        .rr-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(30px, 4vw, 58px);
        }

        .rr-links a,
        .rr-signin {
          color: rgba(255,255,255,.9);
          text-decoration: none;
          font-size: 15px;
          font-weight: 520;
        }

        .rr-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 26px;
        }

        .rr-signin,
        .rr-outline,
        .rr-primary,
        .rr-email button,
        .rr-category {
          font: inherit;
          cursor: pointer;
        }

        .rr-signin {
          border: 0;
          background: transparent;
          padding: 10px 0;
        }

        .rr-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          min-height: 50px;
          padding: 0 22px 0 25px;
          border: 1px solid rgba(255, 68, 55, .95);
          border-radius: 999px;
          background: rgba(0,0,0,.28);
          color: #fff;
          box-shadow: 0 0 24px rgba(255, 59, 48, .2), inset 0 0 18px rgba(255, 59, 48, .08);
          font-size: 15px;
          font-weight: 560;
          white-space: nowrap;
        }

        .rr-outline svg,
        .rr-primary svg {
          width: 18px;
          height: 18px;
        }

        .rr-hero {
          position: relative;
          z-index: 4;
          min-height: calc(100svh - 98px);
          display: grid;
          grid-template-columns: minmax(300px, 560px) 1fr minmax(150px, 250px);
          align-items: center;
          gap: 34px;
          padding: 50px clamp(28px, 9vw, 140px) 286px;
        }

        .rr-copy {
          align-self: center;
          padding-top: 32px;
        }

        .rr-kicker {
          margin: 0 0 24px;
          color: #ff3b30;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .38em;
        }

        .rr-copy h1 {
          margin: 0;
          max-width: 590px;
          font-size: clamp(54px, 5.1vw, 76px);
          line-height: .98;
          letter-spacing: 0;
          font-weight: 280;
          text-shadow: 0 0 22px rgba(255,255,255,.18);
        }

        .rr-copy h1 span {
          color: #ff332c;
          text-shadow: 0 0 20px rgba(255,59,48,.2);
        }

        .rr-body {
          max-width: 440px;
          margin: 30px 0 0;
          color: rgba(255,255,255,.56);
          font-size: 16px;
          line-height: 1.72;
        }

        .rr-command-deck {
          position: relative;
          width: min(100%, 700px);
          margin-top: 34px;
          padding: 10px;
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 32px;
          background:
            linear-gradient(115deg, rgba(255,59,48,.14), transparent 36%),
            rgba(4, 4, 4, .68);
          box-shadow:
            0 0 0 1px rgba(255,59,48,.07),
            0 0 54px rgba(255,59,48,.16),
            inset 0 1px 0 rgba(255,255,255,.055);
          backdrop-filter: blur(18px);
          overflow: hidden;
        }

        .rr-command-deck::before {
          content: "";
          position: absolute;
          left: -30%;
          top: 0;
          width: 28%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.09), rgba(255,59,48,.16), transparent);
          transform: skewX(-18deg);
          animation: rrCommandSweep 5.5s ease-in-out infinite;
          pointer-events: none;
        }

        .rr-command-topline {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 12px;
          padding: 0 8px 9px;
        }

        .rr-command-topline > span,
        .rr-command-topline > strong {
          color: rgba(255,255,255,.45);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .24em;
        }

        .rr-command-topline > strong {
          justify-self: end;
          color: #ff4a40;
        }

        .rr-mode-toggle {
          display: inline-flex;
          align-items: center;
          padding: 3px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 999px;
          background: rgba(0,0,0,.46);
        }

        .rr-mode-toggle button {
          min-width: 74px;
          height: 28px;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: rgba(255,255,255,.42);
          font: inherit;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .1em;
          cursor: pointer;
        }

        .rr-mode-toggle button.is-active {
          background: rgba(255,59,48,.94);
          color: #fff;
          box-shadow: 0 0 20px rgba(255,59,48,.34);
        }

        .rr-search-shell {
          position: relative;
          display: grid;
          grid-template-columns: 74px minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          width: 100%;
          min-height: 72px;
          padding: 8px 9px 8px 11px;
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 999px;
          background:
            linear-gradient(90deg, rgba(255,59,48,.14), transparent 38%),
            rgba(5, 5, 5, .72);
          box-shadow:
            0 0 0 1px rgba(255,59,48,.08),
            0 0 46px rgba(255,59,48,.18),
            inset 0 0 30px rgba(255,255,255,.035);
          backdrop-filter: blur(18px);
          overflow: hidden;
        }

        .rr-search-shell::before {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          background:
            linear-gradient(90deg, rgba(255,255,255,.1), transparent 18% 82%, rgba(255,59,48,.13)),
            radial-gradient(circle at 82% 50%, rgba(255,59,48,.28), transparent 30%);
          pointer-events: none;
          opacity: .78;
        }

        .rr-search-shell input,
        .rr-search-action,
        .rr-search-lens {
          position: relative;
          z-index: 1;
        }

        .rr-search-shell input {
          width: 100%;
          min-width: 0;
          height: 48px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #fff;
          font-size: 15px;
          font-weight: 560;
        }

        .rr-search-shell input::placeholder {
          color: rgba(255,255,255,.42);
        }

        .rr-search-shell:focus-within {
          border-color: rgba(255,59,48,.38);
          box-shadow: inset 0 0 26px rgba(255,59,48,.08), 0 0 36px rgba(255,59,48,.16);
        }

        .rr-search-lens {
          display: grid;
          place-items: center;
          width: 58px;
          height: 58px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255,59,48,.2), rgba(255,59,48,.04) 56%, transparent 70%);
          box-shadow: inset 0 0 18px rgba(255,255,255,.06), 0 0 28px rgba(255,59,48,.28);
        }

        .rr-lens-button {
          display: inline-grid;
          grid-template-columns: auto auto;
          align-items: center;
          gap: 10px;
          color: #fff;
          font-size: 13px;
          font-weight: 760;
        }

        .rr-lens-core {
          position: relative;
          display: block;
          width: 46px;
          height: 46px;
          border-radius: 999px;
          animation: rrLensSpin 7s linear infinite;
        }

        .rr-lens-core i {
          position: absolute;
          left: 50%;
          top: 1px;
          width: 1.4px;
          height: 8px;
          margin-left: -.7px;
          border-radius: 999px;
          background: rgba(255,255,255,.55);
          transform-origin: 50% 22px;
        }

        .rr-lens-core i:nth-child(9n),
        .rr-lens-core i:nth-child(9n + 1) {
          background: #ff3b30;
          box-shadow: 0 0 7px rgba(255,59,48,.8);
        }

        .rr-lens-core b {
          position: absolute;
          inset: 11px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 999px;
          background: radial-gradient(circle at 60% 35%, rgba(255,255,255,.12), rgba(0,0,0,.82) 50%);
          box-shadow: inset 0 0 14px rgba(0,0,0,.8), 0 0 20px rgba(255,59,48,.14);
        }

        .rr-search-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          min-height: 54px;
          padding: 0 9px 0 22px;
          border: 0;
          border-radius: 999px;
          background: #ff241f;
          color: #fff;
          box-shadow: 0 0 30px rgba(255, 59, 48, .36);
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .rr-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          min-height: 56px;
          padding: 0 9px 0 24px;
          border: 0;
          border-radius: 999px;
          background: #ff241f;
          color: #fff;
          box-shadow: 0 0 28px rgba(255, 59, 48, .34);
          font-size: 15px;
          font-weight: 760;
        }

        .rr-primary svg {
          width: 40px;
          height: 40px;
          padding: 10px;
          border-radius: 999px;
          background: #fff;
          color: #ff332c;
        }

        .rr-search-action svg {
          width: 38px;
          height: 38px;
          padding: 10px;
          border-radius: 999px;
          background: #fff;
          color: #ff332c;
          flex: 0 0 auto;
        }

        .rr-command-examples {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 8px 2px;
          flex-wrap: wrap;
        }

        .rr-command-examples span {
          color: rgba(255,255,255,.28);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .18em;
          text-transform: uppercase;
        }

        .rr-command-examples button {
          min-height: 28px;
          padding: 0 11px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 999px;
          background: rgba(255,255,255,.025);
          color: rgba(255,255,255,.45);
          font: inherit;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition: color .18s ease, border-color .18s ease, background .18s ease;
        }

        .rr-command-examples button:hover,
        .rr-command-examples button.is-active {
          color: #fff;
          border-color: rgba(255,59,48,.34);
          background: rgba(255,59,48,.08);
        }

        .rr-email {
          display: flex;
          gap: 8px;
          max-width: 410px;
          margin-top: 18px;
        }

        .rr-email input {
          min-width: 0;
          flex: 1;
          height: 48px;
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 999px;
          background: rgba(0,0,0,.5);
          color: #fff;
          padding: 0 18px;
          outline: none;
        }

        .rr-email button {
          border: 0;
          border-radius: 999px;
          background: #fff;
          color: #050505;
          padding: 0 20px;
          font-weight: 750;
        }

        .rr-joined {
          margin-top: 18px;
          color: #a7f3d0;
          font-weight: 650;
        }

        .rr-status {
          grid-column: 3;
          justify-self: end;
          width: 190px;
          margin-top: 62px;
          color: rgba(255,255,255,.56);
        }

        .rr-status p {
          margin: 0 0 8px;
          color: #ff3b30;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .34em;
        }

        .rr-status span {
          display: block;
          max-width: 150px;
          font-size: 15px;
          line-height: 1.55;
        }

        .rr-reticle {
          display: block;
          width: 76px;
          height: 76px;
          margin-top: 30px;
          opacity: .75;
        }

        .rr-reticle--compact {
          width: 54px;
          height: 54px;
        }

        .rr-category-rail {
          position: absolute;
          left: clamp(28px, 9vw, 140px);
          right: clamp(28px, 9vw, 140px);
          bottom: 214px;
          z-index: 5;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          align-items: center;
          min-height: 82px;
          border-top: 1px solid rgba(255,255,255,.07);
          border-bottom: 1px solid rgba(255,255,255,.025);
          background: linear-gradient(180deg, rgba(0,0,0,.18), rgba(0,0,0,.36));
        }

        .rr-category {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          min-width: 0;
          height: 82px;
          border: 0;
          background: transparent;
          color: rgba(255,255,255,.88);
          font-size: 15px;
          font-weight: 620;
          transition: background .18s ease, color .18s ease;
          overflow: hidden;
        }

        .rr-category::before {
          content: "";
          position: absolute;
          inset: 12px 18px;
          border: 1px solid rgba(255,255,255,0);
          border-radius: 999px;
          background: transparent;
          opacity: 0;
          transition: opacity .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;
        }

        .rr-category:hover::before,
        .rr-category.is-active::before {
          opacity: 1;
          border-color: rgba(255,59,48,.24);
          background: radial-gradient(circle at 24% 50%, rgba(255,59,48,.13), rgba(255,255,255,.025) 62%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 0 22px rgba(255,59,48,.1);
        }

        .rr-category.is-active {
          color: #fff;
        }

        .rr-category-icon,
        .rr-category-copy {
          position: relative;
          z-index: 1;
        }

        .rr-category-icon {
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border-radius: 999px;
          transition: transform .18s ease, background .18s ease;
        }

        .rr-category:hover .rr-category-icon,
        .rr-category.is-active .rr-category-icon {
          transform: translateY(-1px);
          background: rgba(255,59,48,.12);
        }

        .rr-category svg {
          width: 28px;
          height: 28px;
          color: rgba(255,255,255,.82);
        }

        .rr-category-copy {
          display: grid;
          gap: 3px;
          text-align: left;
        }

        .rr-category-copy b {
          font-size: 15px;
          line-height: 1;
        }

        .rr-category-copy em {
          color: rgba(255,59,48,.82);
          font-size: 10px;
          font-style: normal;
          font-weight: 850;
          letter-spacing: .18em;
          line-height: 1;
          opacity: 0;
          transform: translateY(-2px);
          transition: opacity .18s ease, transform .18s ease;
        }

        .rr-category:hover .rr-category-copy em,
        .rr-category.is-active .rr-category-copy em {
          opacity: 1;
          transform: translateY(0);
        }

        .rr-category i {
          position: absolute;
          right: 0;
          top: 27px;
          width: 1px;
          height: 26px;
          background: rgba(255,255,255,.12);
        }

        .rr-feature-panel {
          position: absolute;
          left: clamp(28px, 9vw, 140px);
          right: clamp(28px, 9vw, 140px);
          bottom: 0;
          z-index: 5;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          min-height: 186px;
          border: 1px solid rgba(255,255,255,.12);
          border-bottom: 0;
          border-radius: 22px 22px 0 0;
          background: linear-gradient(180deg, rgba(5,7,8,.72), rgba(1,1,1,.92));
          box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 -24px 90px rgba(0,0,0,.36);
          backdrop-filter: blur(16px);
        }

        .rr-feature {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 0;
          padding: 30px 36px 34px;
          text-align: center;
        }

        .rr-feature:not(:last-child)::after {
          content: "";
          position: absolute;
          right: 0;
          bottom: 46px;
          width: 1px;
          height: 56px;
          background: rgba(255,255,255,.1);
        }

        .rr-feature-icon {
          display: grid;
          place-items: center;
          width: 58px;
          height: 58px;
          margin-bottom: 14px;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 999px;
          background: radial-gradient(circle at 50% 50%, rgba(255,59,48,.18), transparent 58%);
        }

        .rr-feature-icon .rr-mark {
          width: 48px;
          height: 34px;
          overflow: visible;
        }

        .rr-feature-svg {
          width: 46px;
          height: 46px;
        }

        .rr-feature h2 {
          margin: 0 0 9px;
          font-size: 16px;
          line-height: 1.2;
          letter-spacing: 0;
          font-weight: 760;
        }

        .rr-feature p {
          max-width: 235px;
          margin: 0;
          color: rgba(255,255,255,.48);
          font-size: 14px;
          line-height: 1.38;
        }

        .rr-proof-section {
          position: relative;
          z-index: 4;
          display: grid;
          grid-template-columns: minmax(320px, 1fr) minmax(320px, 430px);
          align-items: center;
          gap: clamp(36px, 6vw, 86px);
          width: min(100% - 56px, 1256px);
          margin: 0 auto;
          padding: 118px 0 100px;
        }

        .rr-proof-section::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,59,48,.32), rgba(255,255,255,.1), transparent);
        }

        .rr-proof-copy h2 {
          max-width: 780px;
          margin: 0;
          color: #fff;
          font-size: clamp(42px, 5.2vw, 76px);
          font-weight: 270;
          line-height: 1;
          letter-spacing: 0;
          text-shadow: 0 0 24px rgba(255,255,255,.12);
        }

        .rr-proof-copy > p {
          max-width: 640px;
          margin: 26px 0 34px;
          color: rgba(255,255,255,.56);
          font-size: 18px;
          line-height: 1.68;
        }

        .rr-proof-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .rr-proof-primary svg {
          width: 38px;
          height: 38px;
        }

        .rr-proof-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 48px;
          padding: 0 18px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 999px;
          background: rgba(255,255,255,.025);
          color: rgba(255,255,255,.72);
          font: inherit;
          font-weight: 760;
          cursor: pointer;
        }

        .rr-proof-link svg {
          width: 16px;
          height: 16px;
          color: #ff3b30;
        }

        .rr-proof-card {
          position: relative;
          padding: 0;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 24px;
          background:
            radial-gradient(circle at 72% 18%, rgba(255,59,48,.18), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.015));
          box-shadow: inset 0 1px 0 rgba(255,255,255,.055), 0 30px 90px rgba(0,0,0,.35);
          overflow: hidden;
          backdrop-filter: blur(18px);
        }

        .rr-proof-card::before {
          content: "";
          position: absolute;
          left: -18%;
          top: 50%;
          width: 136%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,59,48,.8), rgba(255,255,255,.36), rgba(255,59,48,.8), transparent);
          box-shadow: 0 0 24px rgba(255,59,48,.34);
          opacity: .34;
        }

        .rr-proof-card > * {
          position: relative;
          z-index: 1;
        }

        .rr-proof-visual {
          position: relative;
          min-height: 410px;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 58%, rgba(255,59,48,.2), transparent 34%),
            #050505;
        }

        .rr-proof-visual img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: sepia(.1) saturate(.9) hue-rotate(-4deg) contrast(1.12) brightness(.72);
          transform: scale(1.03);
        }

        .rr-proof-visual::before,
        .rr-proof-visual::after {
          content: "";
          position: absolute;
          z-index: 1;
          pointer-events: none;
        }

        .rr-proof-visual::before {
          left: 50%;
          bottom: 18px;
          width: min(78%, 520px);
          aspect-ratio: 1;
          border: 1px solid rgba(255,59,48,.28);
          border-radius: 999px;
          transform: translateX(-50%) rotateX(68deg);
          background:
            repeating-radial-gradient(circle, transparent 0 26px, rgba(255,59,48,.18) 27px 28px, transparent 29px 48px),
            linear-gradient(90deg, transparent 49.5%, rgba(255,255,255,.22) 50%, transparent 50.5%),
            linear-gradient(0deg, transparent 49.5%, rgba(255,255,255,.14) 50%, transparent 50.5%);
          box-shadow: 0 0 42px rgba(255,59,48,.18);
          opacity: .56;
        }

        .rr-proof-visual::after {
          left: 6%;
          right: 6%;
          top: 52%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255,59,48,.2), rgba(255,255,255,.58), rgba(255,59,48,.36), transparent);
          box-shadow: 0 0 28px rgba(255,59,48,.38);
          opacity: .46;
          animation: rrProofScan 4.8s ease-in-out infinite;
        }

        .rr-proof-visual-vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 42%, transparent 0 36%, rgba(0,0,0,.3) 70%, rgba(0,0,0,.78) 100%),
            linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.58)),
            radial-gradient(circle at 52% 76%, rgba(255,59,48,.24), transparent 32%);
        }

        .rr-organism {
          --parasite: #ffd35a;
          --parasite-dark: #7a3b08;
          --parasite-glow: rgba(255, 211, 90, .46);
          position: absolute;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: clamp(58px, 5vw, 78px);
          height: clamp(58px, 5vw, 78px);
          padding: 0;
          border: 1px solid color-mix(in srgb, var(--parasite) 48%, transparent);
          border-radius: 999px;
          background:
            radial-gradient(circle at 34% 30%, rgba(255,255,255,.18), transparent 17%),
            radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--parasite) 16%, transparent), rgba(255,59,48,.025) 48%, rgba(0,0,0,.42) 72%),
            rgba(0,0,0,.22);
          color: rgba(255,255,255,.82);
          box-shadow: inset 0 0 24px rgba(255,255,255,.06), 0 0 28px var(--parasite-glow);
          backdrop-filter: blur(12px);
          animation: rrOrganismFloat 5.8s ease-in-out infinite;
          appearance: none;
          cursor: help;
          font: inherit;
          text-align: left;
        }

        .rr-organism::before {
          content: "";
          position: absolute;
          inset: -10px;
          border: 1px solid color-mix(in srgb, var(--parasite) 22%, transparent);
          border-radius: inherit;
          background: radial-gradient(circle, transparent 54%, color-mix(in srgb, var(--parasite) 18%, transparent) 55%, transparent 58%);
          opacity: .7;
        }

        .rr-organism::after {
          content: "";
          position: absolute;
          inset: 13px;
          border-radius: inherit;
          background:
            conic-gradient(from 20deg, transparent 0 10deg, rgba(255,255,255,.38) 11deg 13deg, transparent 14deg 34deg, color-mix(in srgb, var(--parasite) 72%, transparent) 35deg 38deg, transparent 39deg 360deg);
          filter: blur(.2px);
          opacity: .78;
          animation: rrLensRotate 7s linear infinite;
        }

        .rr-organism i {
          position: relative;
          z-index: 1;
          width: 36px;
          height: 17px;
          border-radius: 58% 42% 54% 46% / 62% 48% 52% 38%;
          background:
            radial-gradient(circle at 22% 28%, rgba(255,255,255,.9), transparent 15%),
            repeating-linear-gradient(90deg, color-mix(in srgb, var(--parasite) 90%, #fff) 0 4px, var(--parasite-dark) 5px 7px),
            linear-gradient(135deg, var(--parasite), var(--parasite-dark));
          box-shadow: 0 0 18px var(--parasite-glow);
          transform: rotate(-18deg);
        }

        .rr-organism i::before,
        .rr-organism i::after {
          content: "";
          position: absolute;
          pointer-events: none;
        }

        .rr-organism i::before {
          left: -9px;
          top: 7px;
          width: 16px;
          height: 7px;
          border-radius: 999px 0 0 999px;
          border-top: 2px solid var(--parasite);
          border-left: 2px solid var(--parasite);
          transform: rotate(-34deg);
          filter: drop-shadow(0 0 5px var(--parasite-glow));
        }

        .rr-organism i::after {
          right: -13px;
          top: 7px;
          width: 18px;
          height: 12px;
          border-radius: 50%;
          border-top: 2px solid var(--parasite);
          border-right: 2px solid var(--parasite);
          box-shadow:
            7px -4px 0 -5px var(--parasite),
            9px 4px 0 -5px var(--parasite);
          transform: rotate(24deg);
          filter: drop-shadow(0 0 5px var(--parasite-glow));
        }

        .rr-organism b {
          position: absolute;
          left: 50%;
          bottom: -30px;
          z-index: 2;
          max-width: 130px;
          padding: 5px 9px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 999px;
          background: rgba(0,0,0,.62);
          font-size: 11px;
          font-weight: 820;
          line-height: 1;
          text-transform: capitalize;
          white-space: nowrap;
          transform: translateX(-50%);
        }

        .rr-organism em {
          position: absolute;
          right: 6px;
          top: 6px;
          z-index: 2;
          display: grid;
          place-items: center;
          min-width: 26px;
          height: 26px;
          padding: 0 5px;
          border-radius: 999px;
          background: rgba(0,0,0,.72);
          color: var(--parasite);
          font-size: 10px;
          font-style: normal;
          font-weight: 900;
          text-shadow: 0 0 12px var(--parasite-glow);
        }

        .rr-organism small {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 10px);
          width: max-content;
          max-width: 220px;
          padding: 10px 12px;
          border: 1px solid color-mix(in srgb, var(--parasite) 36%, transparent);
          border-radius: 12px;
          background: rgba(5,5,5,.9);
          color: rgba(255,255,255,.7);
          box-shadow: 0 18px 38px rgba(0,0,0,.42), 0 0 28px var(--parasite-glow);
          font-size: 11px;
          font-weight: 720;
          line-height: 1.45;
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, 8px);
          transition: opacity .2s ease, transform .2s ease;
          white-space: normal;
        }

        .rr-organism small::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 100%;
          width: 8px;
          height: 8px;
          border-right: 1px solid color-mix(in srgb, var(--parasite) 36%, transparent);
          border-bottom: 1px solid color-mix(in srgb, var(--parasite) 36%, transparent);
          background: rgba(5,5,5,.9);
          transform: translate(-50%, -4px) rotate(45deg);
        }

        .rr-organism:hover,
        .rr-organism:focus-visible {
          border-color: color-mix(in srgb, var(--parasite) 66%, white 18%);
          background:
            radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--parasite) 24%, transparent), rgba(0,0,0,.7) 70%);
          color: #fff;
          outline: none;
          box-shadow: 0 0 34px var(--parasite-glow);
        }

        .rr-organism:hover small,
        .rr-organism:focus-visible small {
          opacity: 1;
          transform: translate(-50%, 0);
        }

        .rr-organism-1 {
          --parasite: #ffe06a;
          --parasite-dark: #9d5d0f;
          --parasite-glow: rgba(255, 224, 106, .42);
          left: 13%;
          top: 18%;
          animation-delay: -.4s;
        }

        .rr-organism-2 {
          --parasite: #c6ff5f;
          --parasite-dark: #3f6d15;
          --parasite-glow: rgba(198, 255, 95, .34);
          right: 12%;
          top: 22%;
          animation-delay: -1.3s;
        }

        .rr-organism-3 {
          --parasite: #ffb24a;
          --parasite-dark: #8f330d;
          --parasite-glow: rgba(255, 178, 74, .38);
          left: 11%;
          bottom: 31%;
          animation-delay: -2.1s;
        }

        .rr-organism-4 {
          --parasite: #ffdb76;
          --parasite-dark: #7d5216;
          --parasite-glow: rgba(255, 219, 118, .34);
          right: 18%;
          bottom: 18%;
          animation-delay: -3s;
        }

        .rr-organism-5 {
          --parasite: #d8b6ff;
          --parasite-dark: #57307d;
          --parasite-glow: rgba(216, 182, 255, .32);
          left: 40%;
          bottom: 15%;
          animation-delay: -4s;
        }

        @keyframes rrProofScan {
          0%, 100% {
            transform: translateY(-16px);
            opacity: .24;
          }
          50% {
            transform: translateY(18px);
            opacity: .58;
          }
        }

        .rr-proof-reveal-hotspot {
          position: absolute;
          z-index: 3;
          left: 50%;
          bottom: 24px;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          max-width: calc(100% - 44px);
          min-height: 58px;
          padding: 7px 16px 7px 7px;
          border: 1px solid rgba(255,59,48,.35);
          border-radius: 999px;
          background: rgba(0,0,0,.62);
          color: #fff;
          transform: translateX(-50%);
          box-shadow: 0 0 34px rgba(255,59,48,.24);
          backdrop-filter: blur(16px);
          font: inherit;
          font-size: 13px;
          font-weight: 780;
          cursor: pointer;
          white-space: nowrap;
        }

        .rr-proof-reveal-hotspot .rr-lens-core {
          width: 42px;
          height: 42px;
        }

        .rr-proof-reveal-hotspot .rr-lens-core i {
          transform-origin: 50% 20px;
        }

        .rr-proof-data {
          overflow: hidden;
          padding: 24px 26px 26px;
          border-top: 1px solid rgba(255,255,255,.09);
          background:
            radial-gradient(circle at 78% 12%, rgba(255,59,48,.14), transparent 38%),
            rgba(0,0,0,.42);
        }

        .rr-proof-card-head {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 26px;
        }

        .rr-proof-card-head span,
        .rr-proof-card-head b {
          color: #ff4a40;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .22em;
        }

        .rr-proof-card-head b {
          color: rgba(255,255,255,.38);
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .rr-proof-data > strong {
          display: block;
          color: #fff;
          font-size: clamp(72px, 7vw, 112px);
          font-weight: 760;
          letter-spacing: -.04em;
          line-height: .86;
          text-shadow: 0 0 28px rgba(255,59,48,.2);
        }

        .rr-proof-data > p {
          margin: 12px 0 26px;
          color: rgba(255,255,255,.58);
          font-size: 16px;
          font-weight: 650;
        }

        .rr-proof-classes {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 22px;
        }

        .rr-proof-classes div {
          padding: 12px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 14px;
          background: rgba(0,0,0,.34);
        }

        .rr-proof-classes span {
          display: block;
          color: rgba(255,255,255,.42);
          font-size: 11px;
          font-weight: 780;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        .rr-proof-classes b {
          display: block;
          margin-top: 8px;
          color: #fff;
          font-size: 26px;
          line-height: 1;
        }

        .rr-proof-signals {
          display: grid;
          gap: 10px;
          margin-bottom: 18px;
        }

        .rr-proof-signals > span {
          color: rgba(255,255,255,.34);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .2em;
          text-transform: uppercase;
        }

        .rr-proof-signals div {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .rr-proof-signals p {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 32px;
          margin: 0;
          padding: 0 10px;
          border: 1px solid rgba(255,59,48,.2);
          border-radius: 999px;
          background: rgba(255,59,48,.065);
        }

        .rr-proof-signals b {
          color: rgba(255,255,255,.78);
          font-size: 12px;
          text-transform: capitalize;
        }

        .rr-proof-signals em {
          color: #ff4a40;
          font-size: 12px;
          font-style: normal;
          font-weight: 850;
        }

        .rr-proof-data small {
          display: block;
          color: rgba(255,255,255,.32);
          font-size: 11px;
          line-height: 1.55;
        }

        .rr-section {
          position: relative;
          z-index: 4;
          width: min(100% - 56px, 1256px);
          margin: 0 auto;
          padding: 118px 0;
        }

        .rr-section::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
        }

        .rr-section-head {
          display: grid;
          grid-template-columns: minmax(280px, 640px) minmax(220px, 360px);
          align-items: end;
          justify-content: space-between;
          gap: 36px;
          margin-bottom: 54px;
        }

        .rr-section-kicker {
          margin: 0 0 16px;
          color: #ff3b30;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: .34em;
        }

        .rr-section h2,
        .rr-final-cta h2 {
          margin: 0;
          color: #f8f8f6;
          font-size: clamp(34px, 4vw, 58px);
          font-weight: 280;
          line-height: 1.02;
          letter-spacing: 0;
          text-shadow: 0 0 20px rgba(255,255,255,.12);
        }

        .rr-section-head span,
        .rr-intel-copy > p,
        .rr-final-cta > p {
          color: rgba(255,255,255,.52);
          font-size: 16px;
          line-height: 1.65;
        }

        .rr-workflow {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 22px;
          background:
            radial-gradient(circle at 18% 8%, rgba(255,59,48,.11), transparent 30%),
            linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.012));
          overflow: hidden;
          backdrop-filter: blur(18px);
        }

        .rr-pipeline-panel {
          position: relative;
          height: 190px;
          margin: -18px 0 18px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 22px;
          background:
            radial-gradient(circle at 50% 50%, rgba(255,59,48,.13), transparent 42%),
            linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01));
          overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 28px 80px rgba(0,0,0,.24);
        }

        .rr-pipeline-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px),
            linear-gradient(180deg, rgba(255,255,255,.025) 1px, transparent 1px);
          background-size: 90px 90px;
          mask-image: radial-gradient(circle at 50% 50%, #000 0 42%, transparent 74%);
          pointer-events: none;
        }

        .rr-pipeline-canvas {
          position: absolute !important;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .rr-pipeline-labels {
          position: absolute;
          left: 12%;
          right: 12%;
          bottom: 20px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          pointer-events: none;
        }

        .rr-pipeline-labels span {
          justify-self: center;
          min-width: 86px;
          padding: 7px 12px;
          border: 1px solid rgba(255,59,48,.22);
          border-radius: 999px;
          background: rgba(0,0,0,.42);
          color: rgba(255,255,255,.78);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .18em;
          text-align: center;
          text-transform: uppercase;
          backdrop-filter: blur(10px);
        }

        .rr-step {
          position: relative;
          min-height: 270px;
          padding: 34px 34px 38px;
        }

        .rr-step:not(:last-child) {
          border-right: 1px solid rgba(255,255,255,.09);
        }

        .rr-step span {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          margin-bottom: 58px;
          border: 1px solid rgba(255,59,48,.34);
          border-radius: 999px;
          color: #ff4a40;
          background: rgba(255,59,48,.08);
          box-shadow: 0 0 28px rgba(255,59,48,.15);
          font-size: 12px;
          font-weight: 850;
          letter-spacing: .12em;
        }

        .rr-step h3,
        .rr-intel-grid h3,
        .rr-coverage-card h3 {
          margin: 0 0 12px;
          color: #fff;
          font-size: 18px;
          line-height: 1.22;
          font-weight: 760;
        }

        .rr-step p,
        .rr-intel-grid p,
        .rr-coverage-card p,
        .rr-trust-list p {
          margin: 0;
          color: rgba(255,255,255,.48);
          font-size: 14px;
          line-height: 1.58;
        }

        .rr-intelligence-band {
          display: grid;
          grid-template-columns: minmax(320px, 470px) minmax(420px, 1fr);
          align-items: center;
          gap: clamp(42px, 7vw, 90px);
        }

        .rr-orb-panel {
          position: relative;
          min-height: 520px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 24px;
          background:
            radial-gradient(circle at 50% 44%, rgba(255,59,48,.2), transparent 36%),
            linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.012));
          box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 40px 120px rgba(0,0,0,.32);
          overflow: hidden;
        }

        .rr-orb-panel::after {
          content: "";
          position: absolute;
          left: 10%;
          right: 10%;
          bottom: 22%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,59,48,.7), rgba(255,255,255,.48), rgba(255,59,48,.7), transparent);
          box-shadow: 0 0 30px rgba(255,59,48,.45);
        }

        .rr-orb-stats {
          position: absolute;
          left: 24px;
          right: 24px;
          top: 24px;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .rr-orb-stats div {
          min-width: 0;
          padding: 13px 12px 12px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 14px;
          background: rgba(0,0,0,.45);
          backdrop-filter: blur(12px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.035);
        }

        .rr-orb-stats strong {
          display: block;
          color: #fff;
          font-size: 28px;
          font-weight: 780;
          line-height: 1;
          letter-spacing: 0;
        }

        .rr-orb-stats span {
          display: block;
          margin-top: 6px;
          color: rgba(255,255,255,.42);
          font-size: 11px;
          line-height: 1.2;
          text-transform: uppercase;
          letter-spacing: .12em;
        }

        .rr-source-orbits {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        .rr-source-orbits div {
          position: absolute;
          display: grid;
          gap: 3px;
          min-width: 126px;
          padding: 10px 12px;
          border: 1px solid rgba(255,59,48,.18);
          border-radius: 999px;
          background: rgba(0,0,0,.44);
          box-shadow: 0 0 22px rgba(255,59,48,.1);
          backdrop-filter: blur(10px);
        }

        .rr-source-orbits div:nth-child(1) {
          left: 9%;
          top: 38%;
        }

        .rr-source-orbits div:nth-child(2) {
          right: 8%;
          top: 43%;
        }

        .rr-source-orbits div:nth-child(3) {
          right: 17%;
          bottom: 31%;
        }

        .rr-source-orbits b {
          color: #ff443a;
          font-size: 11px;
          letter-spacing: .24em;
        }

        .rr-source-orbits span {
          color: rgba(255,255,255,.58);
          font-size: 11px;
          white-space: nowrap;
        }

        .rr-mini-canvas {
          position: absolute !important;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .rr-orb-readout {
          position: absolute;
          left: 28px;
          right: 28px;
          bottom: 28px;
          display: grid;
          gap: 5px;
          padding: 18px 20px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 16px;
          background: rgba(0,0,0,.5);
          backdrop-filter: blur(14px);
        }

        .rr-orb-readout p {
          margin: 0;
          color: #ff3b30;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .28em;
        }

        .rr-orb-readout strong {
          color: #fff;
          font-size: 15px;
        }

        .rr-orb-readout span {
          color: rgba(255,255,255,.42);
          font-size: 13px;
        }

        .rr-intel-copy > p {
          max-width: 640px;
          margin: 22px 0 34px;
        }

        .rr-source-table {
          display: grid;
          gap: 8px;
          margin-bottom: 28px;
        }

        .rr-source-table article {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 18px;
          min-height: 72px;
          padding: 13px 16px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 16px;
          background:
            linear-gradient(90deg, rgba(255,59,48,.06), transparent 50%),
            rgba(255,255,255,.02);
        }

        .rr-source-table strong {
          display: block;
          color: #fff;
          font-size: 15px;
          letter-spacing: .18em;
        }

        .rr-source-table span {
          display: block;
          margin-top: 5px;
          color: rgba(255,255,255,.46);
          font-size: 13px;
        }

        .rr-source-table p {
          display: inline-flex;
          align-items: baseline;
          gap: 7px;
          margin: 0;
          color: rgba(255,255,255,.46);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .12em;
          white-space: nowrap;
        }

        .rr-source-table b {
          color: #ff3b30;
          font-size: 30px;
          line-height: 1;
          letter-spacing: 0;
          text-transform: none;
        }

        .rr-intel-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .rr-intel-grid article,
        .rr-coverage-card {
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 16px;
          background: rgba(255,255,255,.025);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.035);
        }

        .rr-intel-grid article {
          padding: 22px;
        }

        .rr-coverage-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        .rr-coverage-card {
          min-height: 230px;
          padding: 25px 22px;
          color: #fff;
          text-align: left;
          font: inherit;
          cursor: pointer;
          transition: transform .18s ease, border-color .18s ease, background .18s ease;
        }

        .rr-coverage-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,59,48,.34);
          background: rgba(255,59,48,.045);
        }

        .rr-coverage-card svg {
          width: 34px;
          height: 34px;
          margin-bottom: 46px;
          color: rgba(255,255,255,.86);
        }

        .rr-trust {
          display: grid;
          grid-template-columns: minmax(320px, 640px) minmax(320px, 470px);
          gap: clamp(40px, 7vw, 96px);
          align-items: center;
        }

        .rr-trust-list {
          display: grid;
          gap: 12px;
        }

        .rr-trust-list p {
          display: flex;
          align-items: center;
          gap: 13px;
          min-height: 58px;
          padding: 0 18px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 999px;
          background: rgba(255,255,255,.025);
          color: rgba(255,255,255,.68);
          font-weight: 620;
        }

        .rr-trust-list span {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #ff3b30;
          box-shadow: 0 0 16px rgba(255,59,48,.8);
          flex: 0 0 auto;
        }

        .rr-final-cta {
          position: relative;
          z-index: 4;
          display: grid;
          justify-items: center;
          width: min(100% - 56px, 980px);
          margin: 20px auto 0;
          padding: 118px 0 130px;
          text-align: center;
        }

        .rr-final-logo {
          width: 280px;
          height: 116px;
          margin-bottom: 10px;
          overflow: visible;
        }

        .rr-final-cta > p {
          max-width: 620px;
          margin: 20px 0 34px;
        }

        .rr-final-cta > div {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .rr-final-primary svg {
          width: 38px;
          height: 38px;
        }

        @media (max-width: 1080px) {
          .rr-nav {
            grid-template-columns: 1fr auto;
          }

          .rr-links {
            display: none;
          }

          .rr-hero {
            grid-template-columns: minmax(280px, 560px) 1fr;
            padding-bottom: 320px;
          }

          .rr-status {
            grid-column: 2;
          }

          .rr-category-rail,
          .rr-feature-panel {
            left: 24px;
            right: 24px;
          }

          .rr-workflow,
          .rr-intelligence-band,
          .rr-trust,
          .rr-section-head,
          .rr-proof-section {
            grid-template-columns: 1fr;
          }

          .rr-coverage-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 760px) {
          .rr-hero-stage {
            min-height: 1180px;
          }

          .rr-nav {
            height: auto;
            display: flex;
            padding: 24px 20px 0;
          }

          .rr-logo .rr-mark {
            width: 100%;
            height: 100%;
          }

          .rr-logo {
            width: 198px;
            height: 82px;
          }

          .rr-actions {
            gap: 12px;
          }

          .rr-signin {
            display: none;
          }

          .rr-outline {
            min-height: 42px;
            padding: 0 14px 0 16px;
            font-size: 13px;
          }

          .rr-hero {
            min-height: 720px;
            display: block;
            padding: 92px 22px 420px;
          }

          .rr-copy {
            padding-top: 0;
          }

          .rr-copy h1 {
            font-size: clamp(44px, 13vw, 62px);
          }

          .rr-body {
            max-width: 350px;
            font-size: 15px;
          }

          .rr-search-shell {
            grid-template-columns: 54px minmax(0, 1fr);
            border-radius: 30px;
            padding: 8px;
            width: 100%;
          }

          .rr-search-action {
            grid-column: 1 / -1;
            min-height: 50px;
            width: 100%;
          }

          .rr-search-lens {
            width: 48px;
            height: 48px;
          }

          .rr-lens-core {
            width: 40px;
            height: 40px;
          }

          .rr-lens-core i {
            transform-origin: 50% 19px;
          }

          .rr-status {
            display: none;
          }

          .rr-category-rail {
            left: 18px;
            right: 18px;
            bottom: 382px;
            grid-template-columns: repeat(2, 1fr);
            min-height: 0;
          }

          .rr-category {
            height: 54px;
            justify-content: flex-start;
            padding-left: 20px;
            font-size: 13px;
          }

          .rr-category i {
            display: none;
          }

          .rr-feature-panel {
            left: 18px;
            right: 18px;
            grid-template-columns: 1fr;
            min-height: 0;
            border-radius: 18px 18px 0 0;
          }

          .rr-feature {
            min-height: 126px;
            padding: 20px 24px;
          }

          .rr-feature:not(:last-child)::after {
            left: 24px;
            right: 24px;
            bottom: 0;
            top: auto;
            width: auto;
            height: 1px;
          }

          .rr-section {
            width: min(100% - 36px, 1256px);
            padding: 82px 0;
          }

          .rr-proof-section {
            width: min(100% - 36px, 1256px);
            padding: 82px 0 70px;
          }

          .rr-proof-classes {
            grid-template-columns: 1fr;
          }

          .rr-section-head {
            margin-bottom: 32px;
          }

          .rr-workflow,
          .rr-intel-grid,
          .rr-coverage-grid {
            grid-template-columns: 1fr;
          }

          .rr-step {
            min-height: 0;
          }

          .rr-pipeline-panel {
            height: 170px;
            margin-top: 0;
          }

          .rr-pipeline-labels {
            left: 8px;
            right: 8px;
            gap: 8px;
          }

          .rr-pipeline-labels span {
            min-width: 0;
            width: 100%;
            font-size: 10px;
            letter-spacing: .1em;
          }

          .rr-step:not(:last-child) {
            border-right: 0;
            border-bottom: 1px solid rgba(255,255,255,.09);
          }

          .rr-step span {
            margin-bottom: 28px;
          }

          .rr-orb-panel {
            min-height: 420px;
          }

          .rr-orb-stats {
            grid-template-columns: 1fr;
            right: auto;
            width: 132px;
          }

          .rr-orb-stats strong {
            font-size: 23px;
          }

          .rr-source-orbits {
            display: none;
          }

          .rr-source-table article {
            grid-template-columns: 1fr;
          }

          .rr-source-table p {
            justify-content: flex-start;
          }

          .rr-trust-list p {
            border-radius: 18px;
          }

          .rr-final-cta {
            width: min(100% - 36px, 980px);
            padding: 82px 0 96px;
          }
        }

        @keyframes rrLensSpin {
          to { transform: rotate(360deg); }
        }

        @keyframes rrCommandSweep {
          0%, 58% { transform: translateX(0) skewX(-18deg); opacity: 0; }
          68% { opacity: .85; }
          100% { transform: translateX(520%) skewX(-18deg); opacity: 0; }
        }

        @keyframes rrOrganismFloat {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: .78; }
          50% { transform: translate3d(8px, -10px, 0) scale(1.04); opacity: 1; }
        }

        @keyframes rrEarthriseDrift {
          from {
            transform: scale(1.012) translate3d(0, 0, 0);
            filter: saturate(1) contrast(1.06) brightness(.86);
          }
          to {
            transform: scale(1.045) translate3d(-1.2%, .6%, 0);
            filter: saturate(1.08) contrast(1.1) brightness(.94);
          }
        }
      `}</style>
    </main>
  );
}
