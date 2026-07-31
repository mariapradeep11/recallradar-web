import { motion } from "framer-motion";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import RecallRadarLogo from "./RecallRadarLogo";
import chickenInsights from "../data/source-intelligence/chicken-insights.json";

type Category = "food" | "drug" | "device" | "consumer" | "vehicle";
type SearchMode = "search" | "monitor";
type Cadence = "Instant" | "Weekly digest";

// ══════════════════════════ 3D ambient hero backdrop ══════════════════════════
// Reused from the original GlobalOrb build: metallic sphere + wireframe grid +
// 3-torus equatorial glow band + two orbit rings + floor grid + stars.

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
        <meshBasicMaterial color="#161214" transparent opacity={0.42} side={THREE.DoubleSide} />
      </mesh>
      {[1.6, 2.65, 3.8, 5.1, 6.6].map((radius) => (
        <mesh key={radius}>
          <ringGeometry args={[radius, radius + 0.012, 180]} />
          <meshBasicMaterial color="#c65b45" transparent opacity={radius < 3 ? 0.13 : 0.07} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {Array.from({ length: 18 }).map((_, index) => (
        <mesh key={index} rotation={[0, 0, (index / 18) * Math.PI]}>
          <planeGeometry args={[0.01, 13.6]} />
          <meshBasicMaterial color="#f7f3ee" transparent opacity={0.028} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {dots.map((dot, index) => (
        <mesh key={index} position={[dot.x, dot.z, 0.018]}>
          <circleGeometry args={[dot.s, 8]} />
          <meshBasicMaterial color={index % 5 === 0 ? "#f7f3ee" : "#c65b45"} transparent opacity={dot.o} side={THREE.DoubleSide} />
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
          <meshStandardMaterial color="#08080a" metalness={0.96} roughness={0.07} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.895, 28, 28]} />
          <meshBasicMaterial color="#6b6269" wireframe transparent opacity={0.18} side={THREE.DoubleSide} />
        </mesh>
        {/* Equatorial glow: sharp core line + mid band + wide bloom */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.89, 0.018, 12, 180]} />
          <meshBasicMaterial color="#c65b45" transparent opacity={0.95} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.89, 0.115, 16, 180]} />
          <meshBasicMaterial color="#c65b45" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.9, 0.33, 16, 180]} />
          <meshBasicMaterial color="#c65b45" transparent opacity={0.035} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.14, 1.148, 160]} />
          <meshBasicMaterial color="#c65b45" transparent opacity={0.38} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh ref={ringA} rotation={[0.68, 0.12, -0.42]}>
        <ringGeometry args={[2.08, 2.1, 180]} />
        <meshBasicMaterial color="#f7f3ee" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ringB} rotation={[1.2, 0.72, 0.05]}>
        <ringGeometry args={[2.25, 2.265, 180]} />
        <meshBasicMaterial color="#f7f3ee" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.02, 1.89]}>
        <circleGeometry args={[0.065, 32]} />
        <meshBasicMaterial color="#f7f3ee" transparent opacity={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.02, 1.895]} scale={[5, 0.42, 1]}>
        <circleGeometry args={[0.28, 64]} />
        <meshBasicMaterial color="#c65b45" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function HeroScene() {
  return (
    <Canvas camera={{ position: [0, 0.46, 7.2], fov: 38 }} dpr={[1, 1.7]} className="rr-scene">
      <Suspense fallback={null}>
        <color attach="background" args={["#0c0b0a"]} />
        <ambientLight intensity={0.08} />
        <pointLight position={[1.45, -0.18, 2.3]} color="#d97a62" intensity={8.5} distance={8} />
        <pointLight position={[4.2, 2.4, 3.4]} color="#fdf6f2" intensity={1.35} distance={10} />
        <pointLight position={[-2.5, -1.6, 2]} color="#c65b45" intensity={1.1} distance={8} />
        <Stars radius={70} depth={40} count={320} factor={1.1} fade speed={0.12} />
        <SentinelOrb />
        <HorizonGrid />
      </Suspense>
    </Canvas>
  );
}

// ══════════════════════════ Real recall data (chicken dataset) ══════════════════════════

const feedSignals: { product: string; reason: string; classification: string; tag: string; time: string; severity: "high" | "med" }[] = [
  { product: "Meijer Chicken Cobb Salad", reason: "Listeria monocytogenes", classification: "Class I", tag: "listeria", time: "2h", severity: "high" },
  { product: "Whole Foods Balsamic Chicken Breast", reason: "Listeria monocytogenes", classification: "Class II", tag: "listeria", time: "5h", severity: "med" },
  { product: "Dierbergs Grilled Chicken Caesar Wrap", reason: "Undeclared anchovy", classification: "Class I", tag: "undeclared", time: "9h", severity: "high" },
  { product: "Dierbergs Santa Fe Chicken Wrap", reason: "Undeclared milk", classification: "Class I", tag: "undeclared", time: "9h", severity: "high" },
  { product: "Kerry Beef & Chicken Meatball Seasoning", reason: "Salmonella risk", classification: "Class II", tag: "salmonella", time: "1d", severity: "med" },
  { product: "Giant Eagle Cajun Chicken Meal", reason: "Salmonella Newport", classification: "Class II", tag: "salmonella", time: "1d", severity: "med" },
  { product: "Coborn's Chicken Salad Croissant", reason: "Potential Listeria contamination", classification: "Class I", tag: "contamination", time: "2d", severity: "high" },
  { product: "National Foods Chicken Base", reason: "Elevated lead in spice", classification: "Class III", tag: "contamination", time: "2d", severity: "med" },
  { product: "Lipari Chicken Salad Sandwich", reason: "Listeria monocytogenes", classification: "Class I", tag: "listeria", time: "3d", severity: "high" },
];

const riskKeywords = chickenInsights.topRiskKeywords.slice(0, 5) as [string, number][];
const maxKeywordCount = riskKeywords[0]?.[1] || 1;

const categories: { label: string; cat: Category; source: string; example: string }[] = [
  { label: "Food", cat: "food", source: "FDA", example: "chicken" },
  { label: "Medicine", cat: "drug", source: "FDA", example: "ibuprofen" },
  { label: "Medical Devices", cat: "device", source: "FDA", example: "syringe" },
  { label: "Consumer Products", cat: "consumer", source: "CPSC", example: "air fryer" },
  { label: "Vehicles", cat: "vehicle", source: "NHTSA", example: "2021 Toyota Camry" },
];

// ══════════════════════════ Page ══════════════════════════

export default function LandingPage({
  onLaunch,
  onCategory,
}: {
  onLaunch: (payload?: { query?: string; category?: Category; mode?: SearchMode }) => void;
  onCategory: (cat: Category) => void;
}) {
  const [heroQuery, setHeroQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [cadence, setCadence] = useState<Cadence>("Instant");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [watchError, setWatchError] = useState("");

  const commandExamples = categories.map((c) => c.example);

  useEffect(() => {
    if (heroQuery.trim()) return;
    const id = window.setInterval(() => {
      setPlaceholderIndex((index) => (index + 1) % commandExamples.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, [commandExamples.length, heroQuery]);

  const launchSearch = () => {
    onLaunch({ query: heroQuery.trim() || commandExamples[placeholderIndex], category: "food", mode: "search" });
  };

  const toggleCat = (label: string) => {
    setSelectedCats((prev) => (prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]));
  };

  const submitWatchlist = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setWatchError("Enter a valid email");
      return;
    }
    setWatchError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source: "landing_watchlist",
          intent: "monitor",
          page: "landing",
          watchlist_categories: selectedCats.length ? selectedCats.join(", ") : "All categories",
          alert_cadence: cadence,
        }),
      });
      if (!res.ok) throw new Error("Watchlist request failed");
      setStep(4);
    } catch {
      setWatchError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const chickenProof = {
    total: chickenInsights.totalOfficialMatches,
    classI: (chickenInsights.byClassification.find(([k]) => k === "Class I")?.[1] as number) || 0,
    topKeyword: riskKeywords[0],
  };

  const visibleSignals = activeFilter ? feedSignals.filter((s) => s.tag === activeFilter) : feedSignals;

  return (
    <main className="rr-landing">
      <div className="rr-bg"><HeroScene /></div>

      {/* ─── NAV ─── */}
      <nav className="rr-nav">
        <a className="rr-logo" href="#" aria-label="RecallRadar home" onClick={(e) => e.preventDefault()}>
          <RecallRadarLogo className="rr-mark" idPrefix="lp-nav" />
        </a>
        <div className="rr-navlinks">
          <a href="#how-it-works">How it works</a>
          <a href="#coverage">Coverage</a>
        </div>
        <button className="rr-btn" onClick={() => onLaunch()}>Get started</button>
      </nav>

      {/* ─── HERO ─── */}
      <section className="rr-hero">
        <div className="rr-hero-copy">
          <p className="rr-eyebrow">Real-time recall intelligence</p>
          <h1 className="rr-h1">See the recall before it reaches your kitchen.</h1>
          <p className="rr-body rr-hero-sub">One search layer across FDA, CPSC, and NHTSA — updated as new recalls are filed, not once a quarter.</p>

          <div className="rr-search">
            <input
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && launchSearch()}
              placeholder={`Search "${commandExamples[placeholderIndex]}"`}
            />
            <button className="rr-btn" onClick={launchSearch}>Search</button>
          </div>

          <div className="rr-chip-row">
            {categories.map((c) => (
              <button key={c.cat} className="rr-chip" onClick={() => onCategory(c.cat)}>{c.label}</button>
            ))}
          </div>
        </div>

        <div className="rr-feed">
          <div className="rr-feed-head">
            <span className="rr-live-dot" /> RECENT SIGNALS
            {activeFilter && (
              <button className="rr-feed-clear" onClick={() => setActiveFilter(null)}>
                Showing "{activeFilter}" · clear ×
              </button>
            )}
          </div>
          <div className="rr-feed-list">
            {visibleSignals.length === 0 && (
              <div className="rr-feed-empty">No live examples tagged "{activeFilter}" yet.</div>
            )}
            {visibleSignals.map((s, i) => (
              <div className="rr-feed-row" key={i}>
                <span className={`rr-feed-dot rr-feed-dot--${s.severity}`} />
                <div className="rr-feed-text">
                  <div className="p">{s.product}</div>
                  <div className="r">{s.reason} · {s.classification}</div>
                </div>
                <span className="rr-feed-time">{s.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STAT STRIP ─── */}
      <section className="rr-stats">
        <div className="rr-stat"><span className="rr-stat-num">{chickenProof.total}</span><span className="rr-stat-label">Recalls tracked · chicken alone</span></div>
        <div className="rr-stat"><span className="rr-stat-num">{chickenProof.classI}</span><span className="rr-stat-label">Class I · most severe</span></div>
        <div className="rr-stat"><span className="rr-stat-num">{chickenProof.topKeyword?.[1]}</span><span className="rr-stat-label">Linked to {chickenProof.topKeyword?.[0]}</span></div>
        <div className="rr-stat"><span className="rr-stat-num">3</span><span className="rr-stat-label">Federal sources, one search</span></div>
      </section>

      {/* ─── EXPLORABLE RISK CHART ─── */}
      <section className="rr-section" id="how-it-works">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="rr-section-head">
            <h2 className="rr-h2">Where the risk concentrates</h2>
            <span className="rr-section-hint">Click a keyword to filter the feed above ↑</span>
          </div>
          <div className="rr-bar-chart">
            {riskKeywords.map(([keyword, count]) => (
              <button
                key={keyword}
                className={`rr-bar-row${activeFilter === keyword ? " is-active" : ""}`}
                onClick={() => setActiveFilter((prev) => (prev === keyword ? null : keyword))}
              >
                <span className="rr-bar-label">{keyword}</span>
                <span className="rr-bar-track"><span className="rr-bar-fill" style={{ width: `${(count / maxKeywordCount) * 100}%` }} /></span>
                <span className="rr-bar-count">{count}</span>
              </button>
            ))}
          </div>
          <p className="rr-source-note">Source: FDA openFDA Food Enforcement API, {chickenInsights.recordsPulled} chicken-related records analyzed as of {new Date(chickenInsights.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.</p>
        </motion.div>
      </section>

      {/* ─── COVERAGE ─── */}
      <section className="rr-section" id="coverage">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h2 className="rr-h2">Coverage</h2>
          <div className="rr-cov-table">
            {categories.map((c) => (
              <button key={c.cat} className="rr-cov-row" onClick={() => onCategory(c.cat)}>
                <span className="rr-cov-name">{c.label}</span>
                <span className="rr-cov-count">{c.source} enforcement data →</span>
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── WATCHLIST (replaces plain waitlist form) ─── */}
      <section className="rr-section rr-watchlist-section">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="rr-stepper">
          <div className="rr-stepper-progress">
            <span className={`rr-stepper-seg${step >= 1 ? " is-done" : ""}`} />
            <span className={`rr-stepper-seg${step >= 2 ? " is-done" : ""}`} />
            <span className={`rr-stepper-seg${step >= 3 ? " is-done" : ""}`} />
          </div>

          {step === 1 && (
            <div className="rr-step">
              <h2 className="rr-h2 rr-step-title">Build your watchlist</h2>
              <p className="rr-body">Pick what you want us watching for you. We'll tell you the moment something's flagged — not once a season.</p>
              <div className="rr-cat-grid">
                {categories.map((c) => (
                  <button
                    key={c.cat}
                    className={`rr-cat-toggle${selectedCats.includes(c.label) ? " is-selected" : ""}`}
                    onClick={() => toggleCat(c.label)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="rr-step-actions"><span /><button className="rr-btn" onClick={() => setStep(2)}>Continue</button></div>
            </div>
          )}

          {step === 2 && (
            <div className="rr-step">
              <h2 className="rr-h2 rr-step-title">How should we reach you?</h2>
              <p className="rr-body">Change this anytime — nothing here is permanent.</p>
              <div className="rr-cadence-grid">
                {(["Instant", "Weekly digest"] as Cadence[]).map((c) => (
                  <button key={c} className={`rr-cadence-card${cadence === c ? " is-selected" : ""}`} onClick={() => setCadence(c)}>
                    <span className="rr-cadence-name">{c}</span>
                    <span className="rr-cadence-desc">{c === "Instant" ? "The moment a match is filed against your list." : "One roundup, every Monday morning."}</span>
                  </button>
                ))}
              </div>
              <div className="rr-step-actions"><button className="rr-btn ghost small" onClick={() => setStep(1)}>Back</button><button className="rr-btn" onClick={() => setStep(3)}>Continue</button></div>
            </div>
          )}

          {step === 3 && (
            <div className="rr-step">
              <h2 className="rr-h2 rr-step-title">Where should alerts go?</h2>
              <p className="rr-body">One email. That's it.</p>
              <div className="rr-search"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@email.com" /></div>
              {watchError && <p className="rr-error">{watchError}</p>}
              <div className="rr-step-actions"><button className="rr-btn ghost small" onClick={() => setStep(2)}>Back</button><button className="rr-btn" onClick={submitWatchlist} disabled={submitting}>{submitting ? "Saving…" : "Start monitoring"}</button></div>
            </div>
          )}

          {step === 4 && (
            <div className="rr-step">
              <h2 className="rr-h2 rr-step-title">You're being monitored.</h2>
              <p className="rr-body">Not a subscription — a safety net. Cancel or edit anytime.</p>
              <div className="rr-confirm-card">
                <div className="rr-confirm-row"><span>Watching</span><span>{selectedCats.length ? selectedCats.join(", ") : "All categories"}</span></div>
                <div className="rr-confirm-row"><span>Cadence</span><span>{cadence}</span></div>
                <div className="rr-confirm-row"><span>Sent to</span><span>{email}</span></div>
              </div>
              <p className="rr-confirm-note">First check runs now against {chickenProof.total}+ tracked recalls in your categories.</p>
            </div>
          )}
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="rr-footer">
        <RecallRadarLogo className="rr-footer-logo" idPrefix="lp-footer" compact />
        <div className="rr-footer-links">
          <span>Source: FDA openFDA · CPSC · NHTSA</span>
          <a href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
        </div>
        <span className="rr-footer-copy">© {new Date().getFullYear()} RecallRadar. Not affiliated with FDA, CPSC, or NHTSA.</span>
      </footer>

      <style>{`
        .rr-landing { position: relative; background: var(--rr-bg); color: var(--rr-text); overflow: hidden; }
        .rr-bg { position: fixed; inset: 0; z-index: 0; opacity: 0.55; pointer-events: none; }
        .rr-scene { width: 100% !important; height: 100% !important; }

        .rr-landing > *:not(.rr-bg) { position: relative; z-index: 1; }

        .rr-nav {
          display: flex; align-items: center; justify-content: space-between;
          max-width: 1200px; margin: 0 auto;
          padding: 28px clamp(20px, 4vw, 48px);
        }
        .rr-logo { display: block; width: 190px; height: 78px; }
        .rr-mark { display: block; width: 100%; height: 100%; overflow: visible; }
        .rr-navlinks { display: flex; gap: 28px; font-size: 0.82rem; color: var(--rr-text-soft); }
        .rr-navlinks a { color: inherit; text-decoration: none; }
        .rr-navlinks a:hover { color: var(--rr-text); }

        .rr-btn {
          font-family: Inter, system-ui, sans-serif; font-size: 0.82rem; font-weight: 700;
          background: var(--rr-accent); color: #fbf1ec; border: none;
          padding: 11px 20px; border-radius: 9px; cursor: pointer; white-space: nowrap;
        }
        .rr-btn.ghost { background: transparent; border: 1px solid var(--rr-border); color: var(--rr-text); }
        .rr-btn.small { padding: 9px 15px; font-size: 0.76rem; }
        .rr-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .rr-eyebrow { font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 700; color: var(--rr-accent); margin: 0 0 20px; }
        .rr-h1 {
          font-family: Georgia, 'Times New Roman', serif; font-weight: 400;
          font-size: clamp(2.6rem, 5vw, 4.6rem); line-height: 1.04; letter-spacing: -0.03em;
          margin: 0 0 22px; max-width: 12ch;
        }
        .rr-h2 { font-family: Georgia, 'Times New Roman', serif; font-weight: 400; font-size: clamp(1.5rem, 2.4vw, 2rem); letter-spacing: -0.02em; margin: 0; }
        .rr-body { color: var(--rr-text-soft); line-height: 1.65; margin: 0; }

        .rr-hero {
          display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 56px; align-items: start;
          max-width: 1200px; margin: 0 auto; padding: 40px clamp(20px, 4vw, 48px) 90px;
        }
        .rr-hero-sub { max-width: 40ch; font-size: 1rem; margin-bottom: 32px; }

        .rr-search { display: flex; gap: 10px; background: var(--rr-surface); border: 1px solid var(--rr-border); border-radius: 14px; padding: 8px 8px 8px 20px; backdrop-filter: blur(20px); }
        .rr-search input { flex: 1; background: none; border: none; outline: none; color: var(--rr-text); font-size: 0.98rem; font-family: inherit; padding: 10px 0; }
        .rr-search input::placeholder { color: var(--rr-text-muted); }

        .rr-chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
        .rr-chip { font-family: Inter, system-ui, sans-serif; font-size: 0.76rem; font-weight: 600; background: var(--rr-surface); border: 1px solid var(--rr-border); color: var(--rr-text-soft); padding: 8px 15px; border-radius: 100px; cursor: pointer; }
        .rr-chip:hover { color: var(--rr-text); border-color: rgba(247,243,238,0.24); }

        .rr-feed { background: var(--rr-surface); border: 1px solid var(--rr-border); border-radius: 16px; overflow: hidden; backdrop-filter: blur(20px); }
        .rr-feed-head { display: flex; align-items: center; gap: 8px; padding: 14px 18px; border-bottom: 1px solid var(--rr-border); font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--rr-text-muted); font-weight: 700; }
        .rr-live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--rr-alert); flex-shrink: 0; }
        .rr-feed-clear { margin-left: auto; background: none; border: none; color: var(--rr-accent-strong); font-size: 0.68rem; cursor: pointer; text-transform: none; letter-spacing: normal; font-family: inherit; }
        .rr-feed-list { max-height: 340px; overflow-y: auto; }
        .rr-feed-empty { padding: 24px 18px; color: var(--rr-text-muted); font-size: 0.82rem; }
        .rr-feed-row { display: flex; align-items: center; gap: 12px; padding: 13px 18px; border-bottom: 1px solid var(--rr-border); }
        .rr-feed-row:last-child { border-bottom: none; }
        .rr-feed-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .rr-feed-dot--high { background: var(--rr-alert); }
        .rr-feed-dot--med { background: var(--rr-caution); }
        .rr-feed-text { flex: 1; min-width: 0; }
        .rr-feed-text .p { font-size: 0.85rem; font-weight: 650; color: var(--rr-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rr-feed-text .r { font-size: 0.74rem; color: var(--rr-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rr-feed-time { font-size: 0.7rem; color: var(--rr-text-muted); flex-shrink: 0; }

        .rr-stats { display: flex; flex-wrap: wrap; max-width: 1200px; margin: 0 auto; border-top: 1px solid var(--rr-border); border-bottom: 1px solid var(--rr-border); }
        .rr-stat { flex: 1; min-width: 180px; padding: 26px clamp(20px, 4vw, 48px); border-right: 1px solid var(--rr-border); }
        .rr-stat:last-child { border-right: none; }
        .rr-stat-num { font-family: Georgia, 'Times New Roman', serif; font-variant-numeric: tabular-nums; font-size: 2rem; display: block; color: var(--rr-text); }
        .rr-stat-label { font-size: 0.72rem; letter-spacing: 0.03em; color: var(--rr-text-muted); text-transform: uppercase; }

        .rr-section { max-width: 1200px; margin: 0 auto; padding: 72px clamp(20px, 4vw, 48px); border-bottom: 1px solid var(--rr-border); }
        .rr-section-head { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
        .rr-section-hint { font-size: 0.8rem; color: var(--rr-text-muted); }

        .rr-bar-chart { display: flex; flex-direction: column; gap: 8px; margin-top: 24px; max-width: 640px; }
        .rr-bar-row { display: grid; grid-template-columns: 130px 1fr 44px; align-items: center; gap: 12px; background: none; border: none; padding: 8px; border-radius: 10px; cursor: pointer; text-align: left; font-family: inherit; }
        .rr-bar-row:hover { background: var(--rr-surface); }
        .rr-bar-row.is-active { background: var(--rr-surface-2); }
        .rr-bar-label { font-size: 0.84rem; color: var(--rr-text-soft); text-transform: capitalize; }
        .rr-bar-row.is-active .rr-bar-label { color: var(--rr-text); font-weight: 650; }
        .rr-bar-track { height: 9px; background: var(--rr-surface-2); border-radius: 5px; overflow: hidden; }
        .rr-bar-fill { display: block; height: 100%; background: var(--rr-accent); border-radius: 5px; }
        .rr-bar-row.is-active .rr-bar-fill { background: var(--rr-accent-strong); }
        .rr-bar-count { font-family: Georgia, serif; font-variant-numeric: tabular-nums; font-size: 0.86rem; color: var(--rr-text-soft); text-align: right; }
        .rr-source-note { margin-top: 20px; font-size: 0.76rem; color: var(--rr-text-muted); max-width: 60ch; }

        .rr-cov-table { display: flex; flex-direction: column; margin-top: 20px; max-width: 640px; }
        .rr-cov-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 4px; border-bottom: 1px solid var(--rr-border); background: none; border-left: none; border-right: none; border-top: none; cursor: pointer; font-family: inherit; text-align: left; }
        .rr-cov-row:hover .rr-cov-name { color: var(--rr-accent-strong); }
        .rr-cov-name { font-size: 0.98rem; font-weight: 650; color: var(--rr-text); }
        .rr-cov-count { font-size: 0.82rem; color: var(--rr-text-muted); }

        .rr-watchlist-section { background: rgba(247,243,238,0.015); }
        .rr-stepper { max-width: 520px; margin: 0 auto; }
        .rr-stepper-progress { display: flex; gap: 6px; margin-bottom: 26px; }
        .rr-stepper-seg { flex: 1; height: 3px; border-radius: 3px; background: var(--rr-border); }
        .rr-stepper-seg.is-done { background: var(--rr-accent); }
        .rr-step { display: flex; flex-direction: column; gap: 18px; }
        .rr-step-title { margin-bottom: -6px; }

        .rr-cat-grid { display: flex; flex-wrap: wrap; gap: 9px; }
        .rr-cat-toggle { font-family: Inter, system-ui, sans-serif; font-size: 0.84rem; font-weight: 600; background: var(--rr-surface); border: 1.5px solid var(--rr-border); color: var(--rr-text-soft); padding: 11px 17px; border-radius: 10px; cursor: pointer; }
        .rr-cat-toggle.is-selected { background: rgba(198,91,69,0.16); border-color: var(--rr-accent); color: var(--rr-accent-strong); }

        .rr-cadence-grid { display: flex; flex-direction: column; gap: 10px; }
        .rr-cadence-card { display: flex; flex-direction: column; gap: 3px; text-align: left; background: var(--rr-surface); border: 1.5px solid var(--rr-border); border-radius: 12px; padding: 15px 17px; cursor: pointer; font-family: inherit; }
        .rr-cadence-card.is-selected { border-color: var(--rr-accent); background: rgba(198,91,69,0.1); }
        .rr-cadence-name { font-size: 0.92rem; font-weight: 650; color: var(--rr-text); }
        .rr-cadence-desc { font-size: 0.78rem; color: var(--rr-text-muted); }

        .rr-step-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
        .rr-error { color: #ff6b60; font-size: 0.82rem; margin: 0; }

        .rr-confirm-card { background: var(--rr-surface); border: 1px solid var(--rr-border); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 4px; }
        .rr-confirm-row { display: flex; justify-content: space-between; font-size: 0.86rem; padding: 10px 0; border-bottom: 1px solid var(--rr-border); }
        .rr-confirm-row:last-child { border-bottom: none; }
        .rr-confirm-row span:first-child { color: var(--rr-text-muted); }
        .rr-confirm-row span:last-child { color: var(--rr-text); font-weight: 650; text-align: right; }
        .rr-confirm-note { font-size: 0.8rem; color: var(--rr-text-muted); text-align: center; margin: 16px 0 0; }

        .rr-footer {
          max-width: 1200px; margin: 0 auto; padding: 36px clamp(20px, 4vw, 48px) 44px;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
        }
        .rr-footer-logo { width: 120px; height: 50px; }
        .rr-footer-links { display: flex; gap: 24px; font-size: 0.78rem; color: var(--rr-text-muted); }
        .rr-footer-links a { color: inherit; text-decoration: none; }
        .rr-footer-links a:hover { color: var(--rr-text-soft); }
        .rr-footer-copy { font-size: 0.74rem; color: var(--rr-text-muted); }

        @media (max-width: 860px) {
          .rr-hero { grid-template-columns: 1fr; }
          .rr-stat { min-width: 50%; }
        }
      `}</style>
    </main>
  );
}
