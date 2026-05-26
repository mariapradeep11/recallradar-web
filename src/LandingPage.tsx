import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

type Category = "food" | "drug" | "device" | "consumer";

// ─── 3D GLOBE ──────────────────────────────────────────────────────────────────

function GlobalOrb() {
  const sphereRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (sphereRef.current) sphereRef.current.rotation.y = t * 0.045;
    if (wireRef.current) wireRef.current.rotation.y = t * 0.045;
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 0.07;
    if (ring2Ref.current) ring2Ref.current.rotation.x = t * -0.05;
  });

  return (
    <group>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[2.2, 64, 64]} />
        <meshStandardMaterial color="#0e0e0e" metalness={0.96} roughness={0.07} />
      </mesh>
      <mesh ref={wireRef}>
        <sphereGeometry args={[2.26, 22, 22]} />
        <meshBasicMaterial color="#282828" wireframe transparent opacity={0.2} />
      </mesh>
      {/* Equatorial glow — wide bloom */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.22, 0.26, 16, 128]} />
        <meshBasicMaterial color="#ff3b30" transparent opacity={0.06} side={2} />
      </mesh>
      {/* Equatorial glow — core band */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.22, 0.065, 16, 128]} />
        <meshBasicMaterial color="#ff3b30" transparent opacity={0.32} side={2} />
      </mesh>
      {/* Equatorial glow — sharp edge */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.22, 0.011, 16, 128]} />
        <meshBasicMaterial color="#ff6050" transparent opacity={0.94} side={2} />
      </mesh>
      {/* Orbit ring 1 */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 5, 0, Math.PI / 7]}>
        <ringGeometry args={[2.66, 2.695, 128]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={2} />
      </mesh>
      {/* Orbit ring 2 */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 2.8, Math.PI / 5, 0]}>
        <ringGeometry args={[2.88, 2.91, 128]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.07} side={2} />
      </mesh>
    </group>
  );
}

function GlobeCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0.8, 7.5], fov: 38 }}
      style={{ position: "absolute", inset: 0, background: "transparent" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.06} />
        <pointLight position={[0, -3.5, 4.5]} color="#ff3b30" intensity={2.8} />
        <pointLight position={[5, 2, -4]} color="#ffffff" intensity={0.35} />
        <pointLight position={[-2, 5, 2]} color="#8888ff" intensity={0.1} />
        <GlobalOrb />
        <Stars radius={90} depth={50} count={300} factor={1.4} fade />
      </Suspense>
    </Canvas>
  );
}

// ─── SHARED HORIZON LOGO ───────────────────────────────────────────────────────

function HorizonLogo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: 0 }}>
      <svg width="88" height="44" viewBox="0 0 100 50" fill="none" style={{ overflow: "visible" }}>
        <defs>
          <filter id="lpArcGlow" x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" result="blur" />
          </filter>
          <filter id="lpFlareAtmos" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          </filter>
          <filter id="lpFlareMid" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          </filter>
          <linearGradient id="lpArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff3b30" stopOpacity="0" />
            <stop offset="22%" stopColor="#ff3b30" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#ff5540" stopOpacity="1" />
            <stop offset="78%" stopColor="#ff3b30" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#ff3b30" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M4 47 Q50 7 96 47" stroke="#ff3b30" strokeWidth="6" fill="none" strokeLinecap="round" filter="url(#lpArcGlow)" opacity="0.35" />
        <path d="M8 47 Q50 9 92 47" stroke="#ff4433" strokeWidth="2" fill="none" strokeLinecap="round" filter="url(#lpArcGlow)" opacity="0.5" />
        <path d="M10 47 Q50 11 90 47" stroke="url(#lpArcGrad)" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="11" r="14" fill="#cc2010" opacity="0.14" filter="url(#lpFlareAtmos)" />
        <circle cx="50" cy="11" r="6" fill="#ff3020" opacity="0.28" filter="url(#lpFlareMid)" />
        <circle cx="50" cy="11" r="3" fill="#ff4433" opacity="0.7" filter="url(#lpFlareMid)" />
        <circle cx="50" cy="11" r="2" fill="#ff6655" opacity="0.92" />
        <circle cx="50" cy="11" r="0.85" fill="white" opacity="0.97" />
        <path d="M50 9 L50 -4" stroke="white" strokeWidth="0.75" strokeLinecap="round" opacity="0.72" />
        <path d="M49.2 9.5 L44.5 3.5" stroke="#ffaa90" strokeWidth="0.55" strokeLinecap="round" opacity="0.48" />
        <path d="M50.8 9.5 L55.5 3.5" stroke="#ffaa90" strokeWidth="0.55" strokeLinecap="round" opacity="0.48" />
        <path d="M47.5 11 L43 11" stroke="#ff6040" strokeWidth="0.4" strokeLinecap="round" opacity="0.32" />
        <path d="M52.5 11 L57 11" stroke="#ff6040" strokeWidth="0.4" strokeLinecap="round" opacity="0.32" />
      </svg>
      <span style={{ fontFamily: "'Josefin Sans', 'Futura', system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 300, letterSpacing: "0.32em", color: "#fff", marginTop: "2px", lineHeight: 1, whiteSpace: "nowrap" }}>
        RECALL<span style={{ color: "#ff3b30" }}>RADAR</span>
      </span>
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #ff3b30 30%, #ff3b30 70%, transparent)", width: "94%", marginTop: "5px" }} />
    </div>
  );
}

// ─── LANDING PAGE ──────────────────────────────────────────────────────────────

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

  const categories: { label: string; cat: Category; icon: React.ReactNode }[] = [
    {
      label: "Food",
      cat: "food",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2C10 2 5.5 5.5 5.5 10.5V15H14.5V10.5C14.5 5.5 10 2 10 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M7 8C8 7.5 12 7.5 13 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Medicine",
      cat: "drug",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="4" y="9" width="12" height="6" rx="3" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 12H16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <path d="M10 5V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="10" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1" />
        </svg>
      ),
    },
    {
      label: "Medical Devices",
      cat: "device",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2 10H5.5L7 6L10 14L12 9L13.5 11H18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Consumer Products",
      cat: "consumer",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4.5 6H15.5L14 14H6L4.5 6Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M7 6V5C7 3.9 7.9 3 9 3H11C12.1 3 13 3.9 13 5V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="7.5" cy="16.5" r="1" fill="currentColor" />
          <circle cx="12.5" cy="16.5" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "Vehicles",
      cat: "consumer",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 11L5.5 7H14.5L17 11V14.5H3V11Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="6" cy="14.5" r="1.8" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="14" cy="14.5" r="1.8" stroke="currentColor" strokeWidth="1.1" />
          <path d="M3 11H17" stroke="currentColor" strokeWidth="0.9" />
          <path d="M7 7L6 11" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M13 7L14 11" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#ff3b30" strokeWidth="1.4" />
          <circle cx="12" cy="12" r="5.5" stroke="#ff3b30" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="12" cy="12" r="2.5" stroke="#ff3b30" strokeWidth="1.3" />
          <circle cx="12" cy="12" r="0.8" fill="#ff3b30" />
        </svg>
      ),
      title: "Instant Detection",
      desc: "Scan a barcode or search any product — get live FDA recall status in under a second.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 12H7L9 6L12 18L14.5 10L16.5 14H21" stroke="#ff3b30" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "AI Risk Analysis",
      desc: "Understand severity at a glance — plain language explanations with actionable next steps.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 3C12 3 7 6.5 7 12V16.5L5 18H19L17 16.5V12C17 6.5 12 3 12 3Z" stroke="#ff3b30" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18" stroke="#ff3b30" strokeWidth="1.3" />
          <circle cx="18" cy="6" r="3" fill="#ff3b30" opacity="0.9" />
        </svg>
      ),
      title: "Proactive Alerts",
      desc: "Get notified the moment a recall touches products in your household scan history.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#ff3b30" strokeWidth="1.4" />
          <path d="M3 12H21" stroke="#ff3b30" strokeWidth="1" strokeDasharray="3 2" />
          <path d="M12 3C9 6 7.5 9 7.5 12C7.5 15 9 18 12 21" stroke="#ff3b30" strokeWidth="1" />
          <path d="M12 3C15 6 16.5 9 16.5 12C16.5 15 15 18 12 21" stroke="#ff3b30" strokeWidth="1" />
        </svg>
      ),
      title: "Complete Coverage",
      desc: "Food, drugs, medical devices, consumer products, and vehicles — one unified platform.",
    },
  ];

  return (
    <div style={{ background: "#000", color: "#fff", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>

      {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>

        {/* Globe — right side */}
        <div style={{ position: "absolute", right: 0, top: 0, width: "65%", height: "100%", zIndex: 1 }}>
          <GlobeCanvas />
          {/* Blend left edge into black */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #000 0%, rgba(0,0,0,0.5) 30%, transparent 60%)", zIndex: 2, pointerEvents: "none" }} />
          {/* Blend bottom edge */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #000 0%, transparent 28%)", zIndex: 2, pointerEvents: "none" }} />
        </div>

        {/* SYSTEM ONLINE panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0, duration: 0.55 }}
          style={{
            position: "absolute",
            right: "clamp(20px, 4vw, 56px)",
            top: "clamp(90px, 14%, 140px)",
            zIndex: 10,
            background: "rgba(8, 8, 8, 0.72)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "18px 22px",
            minWidth: "210px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#34c759", boxShadow: "0 0 8px #34c759" }} />
            <span style={{ fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.62)" }}>SYSTEM ONLINE</span>
          </div>
          <div style={{ display: "grid", gap: "9px" }}>
            {([
              ["FDA Feed", "Active"],
              ["Recalls Indexed", "14,283"],
              ["Last Sync", "2m ago"],
              ["Coverage", "98.4%"],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "24px" }}>
                <span style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.32)", letterSpacing: "0.05em" }}>{label}</span>
                <span style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>MONITORING ACTIVE</span>
          </div>
        </motion.div>

        {/* Nav + hero text */}
        <div style={{
          position: "relative", zIndex: 10,
          maxWidth: "1200px", margin: "0 auto",
          padding: "0 clamp(20px, 4vw, 48px)",
          minHeight: "100vh", display: "flex", flexDirection: "column",
        }}>

          {/* NAV */}
          <nav style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "28px 0", flexShrink: 0,
          }}>
            <HorizonLogo />
            <div style={{ display: "flex", gap: "32px" }}>
              {["How it works", "Categories", "Intelligence", "About"].map((item) => (
                <span
                  key={item}
                  style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.52)", cursor: "pointer" }}
                >
                  {item}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <button
                onClick={onLaunch}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
              >
                Sign in
              </button>
              <button
                onClick={() => setShowEmail((v) => !v)}
                style={{ background: "#ff3b30", color: "#fff", border: "none", borderRadius: "999px", padding: "10px 22px", fontSize: "0.86rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                Join early access ↗
              </button>
            </div>
          </nav>

          {/* Hero text */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: "560px", paddingBottom: "110px" }}>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.74rem", fontWeight: 600, letterSpacing: "0.22em", marginBottom: "30px" }}
            >
              PROTECTING WHAT MATTERS
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(2.8rem, 5vw, 5.2rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.04em",
                fontWeight: 400,
                marginBottom: "30px",
                color: "#fff",
              }}
            >
              Real-time recall<br />intelligence.<br />
              <span style={{ color: "#ff3b30" }}>For everything<br />you bring home.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              style={{ color: "rgba(255,255,255,0.4)", fontSize: "1rem", lineHeight: 1.72, maxWidth: "400px", marginBottom: "44px" }}
            >
              Scan any product, search by name — know instantly if it's been recalled, why, and exactly what to do about it.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.34 }}
              style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "flex-start" }}
            >
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={onLaunch}
                  style={{ background: "#fff", color: "#000", border: "none", borderRadius: "12px", padding: "15px 30px", fontSize: "0.94rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Search recalls →
                </button>
                <button
                  onClick={() => setShowEmail((v) => !v)}
                  style={{ background: "transparent", color: "rgba(255,255,255,0.48)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: "12px", padding: "15px 24px", fontSize: "0.94rem", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Join early access
                </button>
              </div>

              <AnimatePresence>
                {showEmail && !joined && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    style={{ display: "flex", gap: "8px", width: "100%", maxWidth: "380px" }}
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && joinWaitlist()}
                      placeholder="your@email.com"
                      style={{
                        flex: 1, padding: "13px 16px", borderRadius: "10px",
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                        color: "#fff", outline: "none", fontSize: "0.9rem", fontFamily: "inherit",
                      }}
                    />
                    <button
                      onClick={joinWaitlist}
                      style={{ background: "#ff3b30", color: "#fff", border: "none", borderRadius: "10px", padding: "13px 20px", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" }}
                    >
                      Join →
                    </button>
                  </motion.div>
                )}
                {joined && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ color: "#34c759", fontSize: "0.88rem", margin: 0 }}
                  >
                    You're on the list. We'll be in touch.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ─── CATEGORY BAR ─────────────────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.012)",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 clamp(20px, 4vw, 48px)", display: "flex", alignItems: "stretch" }}>
          <div style={{ paddingRight: "32px", marginRight: "0", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.28)", letterSpacing: "0.14em", fontWeight: 600, lineHeight: 1.5, textTransform: "uppercase" }}>
              Protect<br />across
            </span>
          </div>
          <div style={{ display: "flex", flex: 1 }}>
            {categories.map(({ label, cat, icon }, i) => (
              <button
                key={label}
                onClick={() => onCategory(cat)}
                style={{
                  flex: 1, background: "none",
                  border: "none",
                  borderRight: i < categories.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  color: "rgba(255,255,255,0.44)", cursor: "pointer",
                  padding: "26px 12px", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: "10px", fontFamily: "inherit",
                  transition: "color 0.18s, background 0.18s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.44)";
                  (e.currentTarget as HTMLButtonElement).style.background = "none";
                }}
              >
                <span style={{ color: "inherit" }}>{icon}</span>
                <span style={{ fontSize: "0.76rem", fontWeight: 500, letterSpacing: "0.03em", textAlign: "center", color: "inherit" }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FEATURES ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "96px clamp(20px, 4vw, 48px) 80px" }}>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px" }}
        >
          Why RecallRadar
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(1.9rem, 3.2vw, 3rem)",
            lineHeight: 1.12, letterSpacing: "-0.03em",
            fontWeight: 400, color: "#fff",
            marginBottom: "72px", maxWidth: "560px",
          }}
        >
          Everything you need to stay ahead of product recalls.
        </motion.h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              style={{
                padding: "40px 32px 44px",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
              }}
            >
              <div style={{ marginBottom: "22px" }}>{f.icon}</div>
              <h3 style={{ fontSize: "1.06rem", fontWeight: 600, marginBottom: "12px", color: "#fff", letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.92rem", lineHeight: 1.68, margin: 0 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── FOOTER CTA ───────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "80px clamp(20px, 4vw, 48px)", textAlign: "center" }}>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
            fontWeight: 400, letterSpacing: "-0.03em",
            marginBottom: "14px", color: "#fff",
          }}
        >
          Start protecting your household today.
        </motion.h2>
        <p style={{ color: "rgba(255,255,255,0.34)", marginBottom: "36px", fontSize: "0.96rem" }}>
          No account required. Free forever for the basics.
        </p>
        <button
          onClick={onLaunch}
          style={{ background: "#ff3b30", color: "#fff", border: "none", borderRadius: "12px", padding: "16px 40px", fontSize: "1rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >
          Search recalls now →
        </button>
        <p style={{ color: "rgba(255,255,255,0.15)", marginTop: "60px", fontSize: "0.76rem" }}>
          RecallRadar is not affiliated with the FDA. Data is provided as-is from public government sources.
        </p>
      </div>
    </div>
  );
}
