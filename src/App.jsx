import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import BarcodeScanner from "./BarcodeScanner.jsx";
import HistoryPanel   from "./HistoryPanel.jsx";
import { useHistory } from "./useHistory.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const endpoints = {
  food:   "https://api.fda.gov/food/enforcement.json",
  drug:   "https://api.fda.gov/drug/enforcement.json",
  device: "https://api.fda.gov/device/enforcement.json",
};

const categoryLabels = {
  food: "Food", drug: "Medicine", device: "Medical Devices", consumer: "Consumer Products",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const shortText = (text = "", limit = 140) =>
  text.length > limit ? text.slice(0, limit).trim() + "..." : text;

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const escapeRegex = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlight = (text = "", query) => {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${escapeRegex(query.trim())})`, "gi");
  return text.split(regex).map((part, i) =>
    part.toLowerCase() === query.trim().toLowerCase()
      ? <span key={i} style={{ background: "#ff3b30", color: "#fff", padding: "2px 5px", borderRadius: "5px" }}>{part}</span>
      : part
  );
};

const getSeverity = (reason = "") => {
  const r = reason.toLowerCase();
  if (r.includes("listeria") || r.includes("salmonella") || r.includes("death") || r.includes("seizure") || r.includes("contamination")) return "HIGH";
  if (r.includes("undeclared") || r.includes("allergen") || r.includes("metal") || r.includes("glass") || r.includes("chemical")) return "MEDIUM";
  return "LOW";
};

const getGuidance = (reason = "") => {
  const r = reason.toLowerCase();
  if (r.includes("salmonella") || r.includes("listeria") || r.includes("contamination")) return {
    label: "Potential illness risk",
    actions: ["🚫 Do not consume or use this product", "🗑 Dispose of it safely or return it to the store", "🧼 Wash hands, surfaces, and containers that touched it", "📦 Check the package for lot, UPC, or batch numbers"],
  };
  if (r.includes("undeclared") || r.includes("allergen")) return {
    label: "Potential allergy risk",
    actions: ["⚠️ Avoid this product if you have allergies or sensitivities", "📦 Check the ingredient label, UPC, lot, or batch number", "🔁 Return it to the store where it was purchased", "☎️ Contact the manufacturer if you are unsure"],
  };
  return {
    label: "Recall guidance",
    actions: ["⚠️ Review the recall details carefully", "📦 Check package identifiers like UPC, lot, or batch number", "🔁 Consider returning the product to the store", "☎️ Contact the manufacturer if details are unclear"],
  };
};

const formatDate = (date = "") => {
  if (date.length !== 8) return "N/A";
  return `${date.slice(4, 6)}/${date.slice(6, 8)}/${date.slice(0, 4)}`;
};

// ─── Three.js ─────────────────────────────────────────────────────────────────

function RecallOrb() {
  const groupRef = useRef(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.35;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.18;
  });
  return (
    <group ref={groupRef}>
      <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.9}>
        <mesh><icosahedronGeometry args={[1.4, 2]} /><meshStandardMaterial color="#ff3b30" emissive="#7a0f0a" roughness={0.25} metalness={0.65} /></mesh>
        <mesh scale={1.22}><icosahedronGeometry args={[1.4, 1]} /><meshBasicMaterial color="#ff3b30" wireframe transparent opacity={0.22} /></mesh>
        <mesh scale={1.65}><sphereGeometry args={[1.4, 32, 32]} /><meshBasicMaterial color="#ff3b30" transparent opacity={0.06} /></mesh>
      </Float>
    </group>
  );
}

function ThreeHero() {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.9 }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <pointLight position={[4, 4, 4]} intensity={2.4} color="#ffb3ad" />
          <pointLight position={[-4, -2, 3]} intensity={1.4} color="#ffffff" />
          <Stars radius={80} depth={40} count={900} factor={3} saturation={0} fade />
          <group position={[0, 0.2, 0]}><RecallOrb /></group>
          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const linkCardStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)",
  textDecoration: "none", color: "#fff", background: "rgba(255,255,255,0.02)",
};
const subtleText = { fontSize: "12px", color: "#888", marginTop: "2px" };
const arrowStyle = { color: "#ff3b30" };

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [query, setQuery]                     = useState("");
  const [results, setResults]                 = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [category, setCategory]               = useState("food");
  const [searched, setSearched]               = useState(false);
  const [error, setError]                     = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [email, setEmail]                     = useState("");
  const [joined, setJoined]                   = useState(false);
  const [copied, setCopied]                   = useState("");
  const [expandedWhy, setExpandedWhy]         = useState(null);
  const [showScanner, setShowScanner]         = useState(false);
  const [scannedLabel, setScannedLabel]       = useState("");
  const [showHistory, setShowHistory]         = useState(false);

  const {
    searchHistory, savedSearches, alertHistory,
    logSearch, toggleSaved, isSaved, logAlert,
    clearHistory, clearSaved,
  } = useHistory();

  // ── Search ────────────────────────────────────────────────────────────────
  const searchRecalls = useCallback(async (overrideQuery, overrideCategory) => {
    const searchTerm = overrideQuery ?? query;
    const cat        = overrideCategory ?? category;
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);
    setResults([]);

    if (cat === "consumer") {
      logSearch(searchTerm, cat, 0);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${endpoints[cat]}?search=${encodeURIComponent(searchTerm.trim())}&limit=10`);
      if (!res.ok) {
        if (res.status === 404) {
          setResults([]);
          logSearch(searchTerm, cat, 0);
        } else {
          setError(`Search failed (${res.status}). Please try again.`);
        }
        return;
      }
      const data = await res.json();
      const hits = data.results ?? [];
      setResults(hits);
      logSearch(searchTerm, cat, hits.length);
    } catch (err) {
      setError(err.name === "TypeError"
        ? "Network error — check your connection and try again."
        : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [query, category, logSearch]);

  useEffect(() => {
    const params      = new URLSearchParams(window.location.search);
    const sharedQuery = params.get("q");
    const sharedCat   = params.get("cat");
    if (sharedQuery) {
      const cat = (sharedCat && ["food","drug","device","consumer"].includes(sharedCat)) ? sharedCat : "food";
      setQuery(sharedQuery);
      setCategory(cat);
      searchRecalls(sharedQuery, cat);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScanResult = (productName) => {
    setScannedLabel(productName);
    setQuery(productName);
    setCategory("food");
    searchRecalls(productName, "food");
  };

  const handleRunSearch = (q, cat) => {
    setQuery(q);
    setCategory(cat);
    searchRecalls(q, cat);
  };

  const buildShareUrl = (recall) => {
    const params = new URLSearchParams({ q: query || recall.product_description || "", cat: category });
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const shareRecall = async (recall) => {
    const url  = buildShareUrl(recall);
    const text = `⚠️ Recall Alert\n\nProduct: ${shortText(recall.product_description, 180)}\n\nReason: ${shortText(recall.reason_for_recall, 180)}\n\nCheck it on RecallRadar:\n${url}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Recall Alert", text, url }); }
      else {
        await navigator.clipboard.writeText(text);
        setCopied(recall.product_description || "recall");
        setTimeout(() => setCopied(""), 1800);
      }
    } catch (err) { console.error("Share failed:", err); }
  };

  const openPremiumModal  = (product) => { setSelectedProduct(product || query || "this product"); setJoined(false); };
  const closePremiumModal = () => { setSelectedProduct(""); setEmail(""); setJoined(false); };
  const handleCategoryChange = (c) => { setCategory(c); setResults([]); setSearched(false); setError(""); };

  const joinWaitlist = async () => {
    if (!email.trim() || !isValidEmail(email)) { alert("Please enter a valid email address."); return; }
    try {
      const res = await fetch("https://api.sheetbest.com/sheets/a5c4ecd4-7684-48f7-9cd0-8ccf090c0b7a", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), product: selectedProduct, category, search_query: query, source: "premium_modal", timestamp: new Date().toISOString() }),
      });
      if (!res.ok) { alert(`Could not save email (${res.status}). Please try again.`); return; }
      setJoined(true);
    } catch { alert("Network error — please try again."); }
  };

  const totalActivity = searchHistory.length + alertHistory.length + savedSearches.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #351010 0%, #0b0b0b 38%, #050505 100%)", color: "#fff", fontFamily: "Inter, system-ui, sans-serif", padding: "2rem", position: "relative", overflow: "hidden" }}>
      <ThreeHero />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(5,5,5,0.08), rgba(5,5,5,0.78) 58%, #050505 100%)", zIndex: 1, pointerEvents: "none" }} />

      <motion.div
        initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        style={{ maxWidth: "1080px", margin: "auto", position: "relative", zIndex: 2 }}
      >
        {/* ── Nav ── */}
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "58px" }}>
          <strong style={{ fontSize: "1.1rem" }}>RecallRadar</strong>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* History button */}
            <button
              onClick={() => setShowHistory(true)}
              title="Your activity"
              style={{
                position: "relative",
                padding: "10px 14px", borderRadius: "999px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.88rem",
              }}
            >
              🕐 History
              {totalActivity > 0 && (
                <span style={{
                  position: "absolute", top: "-4px", right: "-4px",
                  background: "#ff3b30", borderRadius: "999px",
                  width: "16px", height: "16px", fontSize: "0.62rem",
                  fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {Math.min(totalActivity, 99)}
                </span>
              )}
            </button>
            <button
              onClick={() => openPremiumModal("early access monitoring")}
              style={{ padding: "10px 14px", borderRadius: "999px", background: "#fff", color: "#000", border: "none", fontWeight: 800, cursor: "pointer" }}
            >
              Join early access
            </button>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{ textAlign: "center", minHeight: "520px" }}>
          <p style={{ display: "inline-block", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "999px", padding: "7px 13px", color: "#ddd", fontSize: "0.85rem", background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
            Consumer safety intelligence for everyday products
          </p>
          <h1 style={{ fontSize: "clamp(3.4rem, 9vw, 7rem)", lineHeight: 0.92, margin: "210px 0 0", letterSpacing: "-0.085em", textShadow: "0 30px 100px rgba(255,59,48,0.22)" }}>
            Know before<br />it hurts you.
          </h1>
          <p style={{ color: "#c8c8c8", fontSize: "1.25rem", maxWidth: "760px", margin: "24px auto 0", lineHeight: 1.65 }}>
            RecallRadar helps you search food, drugs, and medical devices — then monitors the products you care about before a recall becomes your problem.
          </p>
        </section>

        {/* ── Search Panel ── */}
        <section style={{ marginTop: "-70px", background: "rgba(17,17,17,0.84)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "28px", padding: "24px", boxShadow: "0 35px 100px rgba(0,0,0,0.5)", backdropFilter: "blur(14px)" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
            {["food","drug","device","consumer"].map((c) => (
              <button key={c} onClick={() => handleCategoryChange(c)} style={{ padding: "9px 16px", borderRadius: "999px", border: category === c ? "1px solid #fff" : "1px solid rgba(255,255,255,0.12)", background: category === c ? "#fff" : "transparent", color: category === c ? "#000" : "#aaa", cursor: "pointer", fontWeight: 800 }}>
                {categoryLabels[c]}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            <button
              onClick={() => setShowScanner(true)}
              title="Scan a barcode"
              style={{ padding: "17px 18px", borderRadius: "16px", background: "rgba(255,59,48,0.12)", border: "1px solid rgba(255,59,48,0.3)", color: "#ff3b30", cursor: "pointer", fontSize: "1.3rem", flexShrink: 0 }}
            >
              📷
            </button>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setScannedLabel(""); }}
              onKeyDown={(e) => e.key === "Enter" && searchRecalls()}
              placeholder="Search product, brand, ingredient…"
              style={{ flex: 1, padding: "17px", borderRadius: "16px", border: scannedLabel ? "1px solid rgba(255,59,48,0.5)" : "1px solid rgba(255,255,255,0.12)", background: "#080808", color: "#fff", outline: "none", fontSize: "1rem" }}
            />
            <button
              onClick={() => searchRecalls()}
              disabled={loading}
              style={{ padding: "17px 26px", borderRadius: "16px", background: "#fff", color: "#000", border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: 900, opacity: loading ? 0.7 : 1, flexShrink: 0 }}
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>

          {scannedLabel && (
            <div style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,59,48,0.12)", border: "1px solid rgba(255,59,48,0.25)", borderRadius: "999px", padding: "6px 12px", fontSize: "0.82rem", color: "#ffb4ae" }}>
              📷 Scanned: <strong>{shortText(scannedLabel, 60)}</strong>
              <button onClick={() => setScannedLabel("")} style={{ background: "none", border: "none", color: "#ff8a80", cursor: "pointer", padding: 0 }}>✕</button>
            </div>
          )}

          {/* Quick access: saved searches */}
          {savedSearches.length > 0 && (
            <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ color: "#555", fontSize: "0.82rem" }}>⭐ Saved:</span>
              {savedSearches.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleRunSearch(s.query, s.category)}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#bbb", borderRadius: "999px", padding: "5px 12px", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  {s.query}
                </button>
              ))}
              {savedSearches.length > 4 && (
                <button onClick={() => setShowHistory(true)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "0.78rem" }}>
                  +{savedSearches.length - 4} more
                </button>
              )}
            </div>
          )}

          <p style={{ color: "#777", fontSize: "0.85rem", marginTop: "12px" }}>
            🔒 Join early access to monitor products and get future safety alerts.
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px", color: "#777" }}>
            <span>Try:</span>
            {["milk", "chicken", "Tylenol", "syringe", "toddler stool", "air fryer"].map((item) => (
              <button key={item} onClick={() => setQuery(item)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#bbb", borderRadius: "999px", padding: "5px 11px", cursor: "pointer" }}>
                {item}
              </button>
            ))}
          </div>
        </section>

        {error  && <p style={{ color: "#ff8a80", marginTop: "20px", textAlign: "center" }}>{error}</p>}
        {copied && <p style={{ color: "#a7f3d0", marginTop: "20px", textAlign: "center", fontWeight: 800 }}>Link copied to clipboard.</p>}

        {/* ── No Results ── */}
        {!loading && searched && results.length === 0 && (
          <section style={{ marginTop: "30px", padding: "24px", borderRadius: "20px", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
            <p style={{ color: "#ffb4ae", fontSize: "12px", marginBottom: "10px", fontWeight: 900 }}>BROADER SAFETY SIGNALS</p>
            <h3 style={{ marginBottom: "10px" }}>{category === "consumer" ? "Checking real-world safety signals" : "No FDA match — expanding your search"}</h3>
            <p style={{ color: "#aaa", lineHeight: 1.6 }}>{category === "consumer" ? "Consumer product risks often appear in recalls, news reports, and manufacturer notices before centralized databases catch up." : "This product may still have safety risks. Check official consumer-product, news, and manufacturer sources below."}</p>
            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <a href={`https://www.cpsc.gov/Recalls?search=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer" style={linkCardStyle}><div><strong>Consumer Product Safety</strong><p style={subtleText}>Official CPSC recall database</p></div><span style={arrowStyle}>→</span></a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(query + " recall news")}&tbm=nws`} target="_blank" rel="noreferrer" style={linkCardStyle}><div><strong>Latest recall news</strong><p style={subtleText}>Recent reports and public safety coverage</p></div><span style={arrowStyle}>→</span></a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(query + " manufacturer recall")}`} target="_blank" rel="noreferrer" style={linkCardStyle}><div><strong>Manufacturer notices</strong><p style={subtleText}>Company-issued recall and return information</p></div><span style={arrowStyle}>→</span></a>
            </div>
          </section>
        )}

        {/* ── Results ── */}
        <section style={{ marginTop: "30px" }}>
          {results.map((r, i) => {
            const severity   = getSeverity(r.reason_for_recall);
            const guidance   = getGuidance(r.reason_for_recall);
            const cardId     = `${r.report_date}-${r.recalling_firm}-${i}`;
            const isExpanded = expandedWhy === cardId;
            const savedThis  = isSaved(query, category);

            return (
              <motion.div
                key={cardId}
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.045 }}
                whileHover={{ scale: 1.015, boxShadow: "0 24px 80px rgba(255,59,48,0.12)" }}
                onViewportEnter={() => logAlert(r, category)}
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))", border: "1px solid rgba(255,255,255,0.09)", padding: "24px", marginBottom: "16px", borderRadius: "20px", position: "relative", overflow: "hidden" }}
              >
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(255,59,48,0.16), transparent 32%)", pointerEvents: "none" }} />
                <div style={{ position: "relative" }}>
                  {/* Severity badge + save button */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "inline-flex", background: severity === "HIGH" ? "rgba(255,59,48,0.25)" : severity === "MEDIUM" ? "rgba(255,149,0,0.25)" : "rgba(255,255,255,0.1)", color: severity === "HIGH" ? "#ff3b30" : severity === "MEDIUM" ? "#ff9500" : "#aaa", padding: "6px 11px", borderRadius: "999px", fontSize: "12px", fontWeight: 900 }}>
                      ⚠️ {severity} RISK
                    </div>
                    <button
                      onClick={() => toggleSaved(query, category)}
                      title={savedThis ? "Remove from saved" : "Save this search"}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", opacity: savedThis ? 1 : 0.3, transition: "opacity 0.15s" }}
                    >
                      ⭐
                    </button>
                  </div>

                  <h3 style={{ fontSize: "1.35rem", lineHeight: 1.35, margin: "0 0 12px" }}>
                    {highlight(shortText(r.product_description || "Unknown product", 180), query)}
                  </h3>
                  <p style={{ color: "#bbb", lineHeight: 1.55 }}>
                    <strong style={{ color: "#fff" }}>Reason:</strong>{" "}
                    {highlight(shortText(r.reason_for_recall || "No data", 180), query)}
                  </p>
                  <p style={{ color: "#999", fontSize: "0.92rem" }}>{guidance.label}</p>

                  <div style={{ marginTop: "18px", padding: "18px", borderRadius: "18px", background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "left" }}>
                    <strong style={{ display: "block", marginBottom: "12px" }}>🧭 What should I do?</strong>
                    <div style={{ display: "grid", gap: "10px" }}>
                      {guidance.actions.map((action, index) => (
                        <motion.div key={action} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} style={{ padding: "10px 12px", borderRadius: "12px", background: "rgba(255,255,255,0.045)", color: "#ddd", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {action}
                        </motion.div>
                      ))}
                    </div>
                    <button onClick={() => setExpandedWhy(isExpanded ? null : cardId)} style={{ marginTop: "14px", padding: "10px 12px", borderRadius: "12px", background: "transparent", border: "1px solid rgba(255,255,255,0.14)", color: "#ddd", cursor: "pointer", fontWeight: 800 }}>
                      {isExpanded ? "Hide explanation" : "Why is this dangerous?"}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                          <p style={{ color: "#aaa", lineHeight: 1.6, marginTop: "12px" }}>
                            This guidance is based on the recall reason: <strong style={{ color: "#fff" }}>{r.reason_for_recall || "No reason provided."}</strong>
                          </p>
                          <p style={{ color: "#888", lineHeight: 1.6 }}>For return or refund details, check the store where you purchased it or contact the recalling company.</p>
                          <a href={`https://www.google.com/search?q=${encodeURIComponent(`${r.recalling_firm || ""} recall contact return refund`)}`} target="_blank" rel="noreferrer" style={{ color: "#ffb4ae", fontWeight: 800 }}>Find return/contact info →</a>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <p style={{ color: "#888", marginBottom: 4, marginTop: "16px" }}><strong style={{ color: "#ccc" }}>Company:</strong> {r.recalling_firm || "Unknown"}</p>
                  <p style={{ color: "#666", marginTop: 0 }}><strong>Date:</strong> {formatDate(r.report_date)}</p>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                    <button onClick={() => openPremiumModal(r.product_description)} style={{ padding: "13px 17px", borderRadius: "13px", background: "#ff3b30", border: "none", color: "#fff", fontWeight: 900, cursor: "pointer" }}>
                      🛡 Protect me from this
                    </button>
                    <button onClick={() => shareRecall(r)} style={{ padding: "13px 17px", borderRadius: "13px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#ddd", fontWeight: 800, cursor: "pointer" }}>
                      🔗 Share
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>

        <footer style={{ color: "#555", textAlign: "center", margin: "50px 0 20px", fontSize: "0.85rem" }}>
          RecallRadar is an early prototype. Always verify recall details with official sources.
        </footer>
      </motion.div>

      {/* ── History Panel ── */}
      <AnimatePresence>
        {showHistory && (
          <HistoryPanel
            open={showHistory}
            onClose={() => setShowHistory(false)}
            searchHistory={searchHistory}
            savedSearches={savedSearches}
            alertHistory={alertHistory}
            onRunSearch={handleRunSearch}
            onToggleSaved={toggleSaved}
            isSaved={isSaved}
            onClearHistory={clearHistory}
            onClearSaved={clearSaved}
          />
        )}
      </AnimatePresence>

      {/* ── Barcode Scanner ── */}
      <AnimatePresence>
        {showScanner && <BarcodeScanner onResult={handleScanResult} onClose={() => setShowScanner(false)} />}
      </AnimatePresence>

      {/* ── Premium Modal ── */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePremiumModal} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 100 }}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 18 }} onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "520px", background: "linear-gradient(135deg, rgba(26,26,26,0.98), rgba(12,12,12,0.98))", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "24px", padding: "28px", boxShadow: "0 40px 120px rgba(0,0,0,0.7)" }}>
              {!joined ? (
                <>
                  <p style={{ color: "#ff8a80", fontWeight: 900, letterSpacing: "0.08em", fontSize: "0.78rem", margin: 0 }}>PREMIUM MONITORING</p>
                  <h2 style={{ margin: "12px 0", fontSize: "2rem" }}>Never miss a dangerous recall.</h2>
                  <p style={{ color: "#aaa", lineHeight: 1.6 }}>Join early access and we'll notify you when monitoring opens for products like:</p>
                  <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "14px", color: "#fff", margin: "16px 0" }}>{shortText(selectedProduct, 100)}</div>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && joinWaitlist()} placeholder="Enter your email" type="email" style={{ width: "100%", boxSizing: "border-box", padding: "15px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.12)", background: "#070707", color: "#fff", outline: "none", fontSize: "1rem" }} />
                  <button onClick={joinWaitlist} style={{ width: "100%", marginTop: "12px", padding: "15px", borderRadius: "14px", background: "#ff3b30", color: "#fff", border: "none", fontWeight: 900, cursor: "pointer", fontSize: "1rem" }}>Join early access</button>
                  <button onClick={closePremiumModal} style={{ width: "100%", marginTop: "10px", padding: "12px", borderRadius: "14px", background: "transparent", color: "#888", border: "none", cursor: "pointer" }}>Maybe later</button>
                </>
              ) : (
                <>
                  <h2 style={{ margin: "0 0 12px", fontSize: "2rem" }}>You're on the list.</h2>
                  <p style={{ color: "#aaa", lineHeight: 1.6 }}>Your email has been saved. We'll notify you when premium monitoring opens.</p>
                  <button onClick={closePremiumModal} style={{ width: "100%", marginTop: "12px", padding: "15px", borderRadius: "14px", background: "#fff", color: "#000", border: "none", fontWeight: 900, cursor: "pointer" }}>Continue exploring</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
