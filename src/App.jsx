import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import BarcodeScanner from "./BarcodeScanner.jsx";
import HistoryPanel from "./HistoryPanel.jsx";
import { useHistory } from "./useHistory.js";
import RiskIntelligence from "./RiskIntelligence.jsx";
import PhotoHero from "./PhotoHero.jsx";
import { categoryGlow } from "./photoMap.js";

/* ═══════════════════════════════════════════════════════════════════════════════
   CONSTANTS & NORMALISERS
   (Carried over from your Phase 3 App.jsx — unchanged)
   ═══════════════════════════════════════════════════════════════════════════════ */

const endpoints = {
  food: "https://api.fda.gov/food/enforcement.json",
  drug: "https://api.fda.gov/drug/enforcement.json",
  device: "https://api.fda.gov/device/enforcement.json",
};

const categoryLabels = {
  food: "Food", drug: "Medicine", device: "Medical Devices",
  consumer: "Consumer Products", vehicle: "Vehicles",
};
const categories = ["food", "drug", "device", "consumer", "vehicle"];

const shortText = (t = "", l = 140) => (t.length > l ? t.slice(0, l).trim() + "…" : t);
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const escapeRegex = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlight = (text = "", query) => {
  if (!query.trim()) return text;
  const r = new RegExp(`(${escapeRegex(query.trim())})`, "gi");
  return text.split(r).map((p, i) =>
    p.toLowerCase() === query.trim().toLowerCase()
      ? <span key={i} style={{ background: "#ff3b30", color: "#fff", padding: "2px 5px", borderRadius: "5px" }}>{p}</span>
      : p
  );
};

const formatDate = (d = "") => (d.length === 8 ? `${d.slice(4,6)}/${d.slice(6,8)}/${d.slice(0,4)}` : "N/A");
const formatCpscDate = (d = "") => { if (!d) return "N/A"; const x = new Date(d); return Number.isNaN(x.getTime()) ? d : x.toLocaleDateString(); };

const normalizeFdaRecall = (r, cat, i) => ({
  id: `fda-${cat}-${r.report_date||""}-${r.recalling_firm||""}-${i}`,
  source: "FDA", category: cat,
  title: r.product_description || "Unknown product",
  reason: r.reason_for_recall || "No recall reason provided.",
  company: r.recalling_firm || "Unknown",
  date: formatDate(r.report_date), rawDate: r.report_date || "",
  url: `https://www.accessdata.fda.gov/scripts/ires/index.cfm?Product=${encodeURIComponent(r.product_description || "")}`,
  raw: r,
});

const normalizeCpscRecall = (r, i) => ({
  id: `cpsc-${r.RecallNumber || i}`,
  source: "CPSC", category: "consumer",
  title: r.Products?.[0]?.Name || r.Title || "Consumer product recall",
  reason: r.Hazard || r.Description || r.Title || "No hazard details provided.",
  company: r.Manufacturers?.[0]?.Name || r.Manufacturer || "Unknown",
  date: formatCpscDate(r.RecallDate), rawDate: r.RecallDate || "",
  url: r.URL || `https://www.cpsc.gov/Recalls?search=${encodeURIComponent(r.Products?.[0]?.Name || r.Title || "")}`,
  raw: r,
});

const normalizeNhtsaRecall = (r, i) => ({
  id: `nhtsa-${r.NHTSACampaignNumber || i}`,
  source: "NHTSA", category: "vehicle",
  title: `${r.ModelYear||""} ${r.Make||""} ${r.Model||""} — ${r.Component||"Vehicle recall"}`.trim(),
  reason: r.Summary || r.Conequence || r.Consequence || r.Notes || "No recall summary provided.",
  company: r.Manufacturer || "Unknown",
  date: r.ReportReceivedDate || "N/A", rawDate: r.ReportReceivedDate || "",
  url: `https://www.nhtsa.gov/recalls?nhtsaId=${encodeURIComponent(r.NHTSACampaignNumber||"")}`,
  raw: r,
});

const getRecallSeverity = (recall) => {
  const t = `${recall.reason||""} ${recall.raw?.Consequence||""} ${recall.raw?.Conequence||""}`.toLowerCase();
  if (t.includes("death")||t.includes("fire")||t.includes("crash")||t.includes("injury")||t.includes("choking")||t.includes("listeria")||t.includes("salmonella")) return "HIGH";
  if (t.includes("burn")||t.includes("fall")||t.includes("allergen")||t.includes("metal")||t.includes("glass")||t.includes("airbag")||t.includes("brake")) return "MEDIUM";
  return "LOW";
};

const getRecallGuidance = (recall) => {
  if (recall.category === "vehicle") return { label: "Vehicle safety recall", actions: ["Check whether your exact year, make, and model are affected", "Contact your dealer or manufacturer for repair instructions", "Recall repairs are usually handled by authorized dealers", "Keep the NHTSA campaign number for reference"] };
  if (recall.category === "consumer") return { label: "Consumer product safety recall", actions: ["Stop using the product until you verify the recall details", "Check model, batch, date code, or product identifiers", "Follow the remedy instructions for refund, repair, or replacement", "Contact the manufacturer if your product details are unclear"] };
  const r = (recall.reason||"").toLowerCase();
  if (r.includes("salmonella")||r.includes("listeria")||r.includes("contamination")) return { label: "Potential illness risk", actions: ["Do not consume or use this product", "Dispose of it safely or return it to the store", "Wash hands, surfaces, and containers that touched it", "Check the package for lot, UPC, or batch numbers"] };
  if (r.includes("undeclared")||r.includes("allergen")) return { label: "Potential allergy risk", actions: ["Avoid this product if you have allergies or sensitivities", "Check the ingredient label, UPC, lot, or batch number", "Return it to the store where it was purchased", "Contact the manufacturer if you are unsure"] };
  return { label: "Recall guidance", actions: ["Review the recall details carefully", "Check package identifiers like UPC, lot, or batch number", "Consider returning the product to the store", "Contact the manufacturer if details are unclear"] };
};

const getRiskCacheKey = (r = {}) => `recallradar:risk:${[r.source||"",r.category||"",r.id||"",r.title||"",r.date||"",r.rawDate||""].join("|").toLowerCase()}`;
const readCachedRisk = (r) => { try { const p = JSON.parse(localStorage.getItem(getRiskCacheKey(r))); return p?.risk || null; } catch { return null; } };
const writeCachedRisk = (r, risk) => { try { if (!risk || risk.aiStatus?.startsWith("fallback") || risk.aiStatus === "frontend_ai_unavailable") return; localStorage.setItem(getRiskCacheKey(r), JSON.stringify({ risk, cachedAt: new Date().toISOString() })); } catch {} };
const buildUnavailableRisk = (r) => ({ riskLevel: "UNAVAILABLE", contextualLabel: "AI UNAVAILABLE", riskQualifier: "AI risk analysis is temporarily unavailable.", why: ["AI analysis temporarily unavailable"], reportedImpact: "Not analyzed.", recommendedAction: "Review the official recall source.", confidence: "Limited", plainEnglishSummary: "AI analysis unavailable right now.", aiStatus: "frontend_ai_unavailable", sourceContext: { sourceName: r.source||"Official Source", sourceType: "Official recall data", sourceUrl: r.url||"", checkedFields: ["official recall record"], note: "AI analysis may be temporarily unavailable.", trustedSources: r.url ? [{ label: `Official ${r.source||"recall"} source`, url: r.url, type: "official" }] : [] } });

/* ═══════════════════════════════════════════════════════════════════════════════
   AMBIENT 3D HERO (idle state — before any search)
   ═══════════════════════════════════════════════════════════════════════════════ */

function IdleOrb() {
  const ref = useRef(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.y = s.clock.elapsedTime * 0.25;
    ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.3) * 0.12;
  });
  return (
    <group ref={ref}>
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
        <mesh><icosahedronGeometry args={[1.2, 2]} /><meshStandardMaterial color="#ff3b30" emissive="#4a0f0a" roughness={0.3} metalness={0.6} /></mesh>
        <mesh scale={1.2}><icosahedronGeometry args={[1.2, 1]} /><meshBasicMaterial color="#ff3b30" wireframe transparent opacity={0.15} /></mesh>
        <mesh scale={1.6}><sphereGeometry args={[1.2, 32, 32]} /><meshBasicMaterial color="#ff3b30" transparent opacity={0.04} /></mesh>
      </Float>
    </group>
  );
}

function IdleHero() {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.7 }}>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 42 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[4, 3, 4]} intensity={2} color="#ffb3ad" />
          <pointLight position={[-3, -2, 3]} intensity={1} color="#ffffff" />
          <Stars radius={60} depth={30} count={500} factor={2} saturation={0} fade />
          <group position={[0, 0.2, 0]}><IdleOrb /></group>
          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   GLASS CARD STYLES
   ═══════════════════════════════════════════════════════════════════════════════ */

const glass = {
  card: {
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "22px",
    padding: "clamp(16px, 3vw, 24px)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    marginBottom: "16px",
    position: "relative",
    overflow: "hidden",
  },
  searchPanel: {
    background: "rgba(12,12,14,0.7)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "24px",
    padding: "clamp(16px, 3vw, 24px)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
  },
  input: {
    width: "100%", minWidth: 0, padding: "15px 17px", borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.4)",
    color: "#fff", outline: "none", fontSize: "0.95rem", boxSizing: "border-box",
  },
  badge: (severity) => ({
    display: "inline-flex", alignItems: "center", gap: "4px",
    padding: "5px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700,
    background: severity === "HIGH" ? "rgba(255,59,48,0.2)" : severity === "MEDIUM" ? "rgba(255,149,0,0.2)" : "rgba(255,255,255,0.06)",
    color: severity === "HIGH" ? "#ff6b60" : severity === "MEDIUM" ? "#ffb44a" : "#888",
    border: `1px solid ${severity === "HIGH" ? "rgba(255,59,48,0.3)" : severity === "MEDIUM" ? "rgba(255,149,0,0.25)" : "rgba(255,255,255,0.08)"}`,
  }),
  btn: {
    padding: "12px 18px", borderRadius: "12px", border: "none",
    fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", transition: "all 0.15s",
  },
  catBtn: (active) => ({
    padding: "7px 14px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 700,
    border: active ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.08)",
    background: active ? "rgba(255,255,255,0.1)" : "transparent",
    color: active ? "#fff" : "rgba(255,255,255,0.4)",
    cursor: "pointer", transition: "all 0.2s",
  }),
  link: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "13px 15px", borderRadius: "14px", textDecoration: "none", color: "#fff",
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    transition: "background 0.15s",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("food");
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState("");
  const [expandedWhy, setExpandedWhy] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedLabel, setScannedLabel] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [riskById, setRiskById] = useState({});
  const [riskLoadingById, setRiskLoadingById] = useState({});

  const { searchHistory, savedSearches, alertHistory, logSearch, toggleSaved, isSaved, logAlert, clearHistory, clearSaved } = useHistory();

  const glow = categoryGlow[category] || categoryGlow.food;

  // ── Risk analysis (same as your Phase 3) ────────────────────────────────
  const analyzeRisks = useCallback(async (hits, options = {}) => {
    const limit = options.limit ?? 1;
    const targets = hits.slice(0, limit);
    if (!targets.length) return;
    const cached = {}, loadState = {}, toAnalyze = [];
    targets.forEach((r) => { const k = r.id||r.title; const c = readCachedRisk(r); if (c) cached[k]=c; else { loadState[k]=true; toAnalyze.push(r); } });
    if (Object.keys(cached).length) setRiskById(p => ({...p,...cached}));
    if (Object.keys(loadState).length) setRiskLoadingById(p => ({...p,...loadState}));
    if (!toAnalyze.length) return;
    const settled = await Promise.allSettled(toAnalyze.map(async (r) => {
      const k = r.id||r.title;
      const res = await fetch("/api/analyze-risk", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({recall:r}) });
      let payload = null; try { payload = await res.json(); } catch {}
      if (!res.ok) return [k, buildUnavailableRisk(r)];
      const risk = payload || buildUnavailableRisk(r);
      if (!risk?.aiStatus?.startsWith("fallback")) writeCachedRisk(r, risk);
      return [k, risk];
    }));
    const nr = {}, nl = {};
    settled.forEach((item, idx) => { const r = toAnalyze[idx]; const k = r.id||r.title; nl[k]=false; if (item.status==="fulfilled") { const [fk,risk]=item.value; nr[fk]=risk; } else nr[k]=buildUnavailableRisk(r); });
    setRiskById(p => ({...p,...nr}));
    setRiskLoadingById(p => ({...p,...nl}));
  }, []);

  // ── Search ──────────────────────────────────────────────────────────────
  const searchRecalls = useCallback(async (overrideQuery, overrideCategory) => {
    const searchTerm = overrideQuery ?? query;
    const cat = overrideCategory ?? category;
    if (cat !== "vehicle" && !searchTerm.trim()) return;
    if (cat === "vehicle" && (!vehicleYear.trim()||!vehicleMake.trim()||!vehicleModel.trim())) { setError("Enter vehicle year, make, and model."); return; }

    setLoading(true); setError(""); setSearched(true); setResults([]); setRiskById({}); setRiskLoadingById({});

    try {
      let hits = [];
      if (["food","drug","device"].includes(cat)) {
        const res = await fetch(`${endpoints[cat]}?search=${encodeURIComponent(searchTerm.trim())}&limit=10`);
        if (!res.ok) { if (res.status!==404) setError(`Search failed (${res.status}).`); }
        else { const d = await res.json(); hits = (d.results??[]).map((r,i)=>normalizeFdaRecall(r,cat,i)); }
      }
      if (cat === "consumer") {
        const res = await fetch(`https://www.saferproducts.gov/RestWebServices/Recall?format=json&ProductName=${encodeURIComponent(searchTerm.trim())}`);
        if (!res.ok) { setError(`CPSC search failed (${res.status}).`); return; }
        const d = await res.json(); hits = Array.isArray(d) ? d.slice(0,10).map(normalizeCpscRecall) : [];
      }
      if (cat === "vehicle") {
        const res = await fetch(`https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(vehicleMake.trim())}&model=${encodeURIComponent(vehicleModel.trim())}&modelYear=${encodeURIComponent(vehicleYear.trim())}`);
        if (!res.ok) { setError(`NHTSA search failed (${res.status}).`); return; }
        const d = await res.json(); hits = (d.results??d.Results??[]).slice(0,20).map(normalizeNhtsaRecall);
      }
      setResults(hits);
      analyzeRisks(hits, { limit: 1 });
      logSearch(cat==="vehicle"?`${vehicleYear} ${vehicleMake} ${vehicleModel}`:searchTerm, cat, hits.length);
    } catch (err) {
      setError(err.name==="TypeError"?"Network error — check your connection.":"Something went wrong.");
    } finally { setLoading(false); }
  }, [query, category, vehicleYear, vehicleMake, vehicleModel, logSearch, analyzeRisks]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = p.get("q"), c = p.get("cat");
    if (q) { const cat = c&&categories.includes(c)?c:"food"; setQuery(q); setCategory(cat); searchRecalls(q, cat); }
  }, []);

  const handleScanResult = (n) => { setScannedLabel(n); setQuery(n); setCategory("food"); searchRecalls(n,"food"); };
  const handleRunSearch = (q,c) => { setQuery(q); setCategory(c); searchRecalls(q,c); };
  const shareRecall = async (r) => {
    const url = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(query||r.title||"")}&cat=${category}`;
    const text = `⚠️ Recall Alert\n\nProduct: ${shortText(r.title,180)}\n\nReason: ${shortText(r.reason,180)}\n\n${url}`;
    try { if (navigator.share) await navigator.share({title:"Recall Alert",text,url}); else { await navigator.clipboard.writeText(text); setCopied(r.title); setTimeout(()=>setCopied(""),1800); } } catch {}
  };
  const openPremiumModal = (p) => { setSelectedProduct(p||query||"this product"); setJoined(false); };
  const closePremiumModal = () => { setSelectedProduct(""); setEmail(""); setJoined(false); };
  const handleCategoryChange = (c) => { setCategory(c); setResults([]); setSearched(false); setError(""); setRiskById({}); setRiskLoadingById({}); };
  const joinWaitlist = async () => {
    if (!email.trim()||!isValidEmail(email)) { alert("Please enter a valid email."); return; }
    try { const r = await fetch("https://api.sheetbest.com/sheets/a5c4ecd4-7684-48f7-9cd0-8ccf090c0b7a",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim(),product:selectedProduct,category,search_query:query,source:"premium_modal",timestamp:new Date().toISOString()})}); if(!r.ok){alert(`Error (${r.status}).`);return;} setJoined(true); } catch{alert("Network error.");}
  };

  const totalActivity = searchHistory.length + alertHistory.length + savedSearches.length;

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #10080c 0%, #0a0c14 30%, #060608 100%)",
      color: "#fff",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Category ambient glow */}
      <div style={{ position: "fixed", inset: 0, background: glow.bg, zIndex: 0, pointerEvents: "none", transition: "background 0.8s ease" }} />

      {/* Idle 3D hero (visible before search) */}
      {!searched && <IdleHero />}

      <div style={{ position: "relative", zIndex: 2, maxWidth: "980px", margin: "0 auto", padding: "clamp(16px, 3vw, 28px)" }}>

        {/* ── NAV ── */}
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: searched ? "28px" : "48px", gap: "12px", flexWrap: "wrap" }}>
          <strong style={{ fontSize: "1rem", letterSpacing: "-0.02em", color: "rgba(255,255,255,0.85)" }}>RecallRadar</strong>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => setShowHistory(true)} style={{ position: "relative", padding: "8px 14px", borderRadius: "999px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>
              History
              {totalActivity > 0 && <span style={{ position: "absolute", top: "-3px", right: "-3px", background: "#ff3b30", borderRadius: "999px", width: "14px", height: "14px", fontSize: "0.6rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{Math.min(totalActivity, 99)}</span>}
            </button>
            <button onClick={() => openPremiumModal("early access")} style={{ padding: "8px 16px", borderRadius: "999px", background: "rgba(255,255,255,0.9)", color: "#000", border: "none", fontWeight: 700, cursor: "pointer", fontSize: "0.8rem" }}>
              Early access
            </button>
          </div>
        </nav>

        {/* ── HERO (idle state) ── */}
        {!searched && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ textAlign: "center", minHeight: "420px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ display: "inline-block", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "999px", padding: "6px 14px", color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)", margin: "0 auto 20px" }}>
              Consumer safety intelligence
            </p>
            <h1 style={{ fontSize: "clamp(2.8rem, 8vw, 5.5rem)", lineHeight: 0.92, margin: "0 0 20px", letterSpacing: "-0.06em", fontWeight: 600 }}>
              Know before<br />it hurts you.
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "clamp(0.95rem, 2.5vw, 1.15rem)", maxWidth: "600px", margin: "0 auto", lineHeight: 1.65 }}>
              Search food, drugs, medical devices, consumer products, and vehicle recalls. Scan barcodes. Get AI-powered safety analysis.
            </p>
          </motion.section>
        )}

        {/* ── PHOTO HERO (after search) ── */}
        <PhotoHero query={query} category={category} hasResults={results.length > 0} isSearching={loading} />

        {/* ── SEARCH PANEL ── */}
        <section style={glass.searchPanel}>
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
            {categories.map((c) => (
              <button key={c} onClick={() => handleCategoryChange(c)} style={glass.catBtn(category === c)}>
                {categoryLabels[c]}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
            <button onClick={() => setShowScanner(true)} title="Scan barcode" style={{ padding: "0 16px", borderRadius: "14px", background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.2)", color: "#ff6040", cursor: "pointer", fontSize: "1.2rem", flexShrink: 0 }}>
              <span style={{ lineHeight: 1 }}>⎚</span>
            </button>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setScannedLabel(""); }}
              onKeyDown={(e) => e.key === "Enter" && searchRecalls()}
              placeholder={category === "vehicle" ? "Optional keyword, e.g. airbag…" : "Search product, brand, ingredient…"}
              style={glass.input}
            />
            <button onClick={() => searchRecalls()} disabled={loading}
              style={{ ...glass.btn, background: "rgba(255,255,255,0.9)", color: "#000", flexShrink: 0, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Scanning…" : "Search"}
            </button>
          </div>

          {category === "vehicle" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px", marginTop: "12px" }}>
              <input value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} placeholder="Year" style={glass.input} />
              <input value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} placeholder="Make" style={glass.input} />
              <input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} onKeyDown={(e) => e.key==="Enter"&&searchRecalls()} placeholder="Model" style={glass.input} />
            </div>
          )}

          {scannedLabel && (
            <div style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.15)", borderRadius: "999px", padding: "5px 12px", fontSize: "0.78rem", color: "#ffb4ae" }}>
              Scanned: <strong>{shortText(scannedLabel, 50)}</strong>
              <button onClick={() => setScannedLabel("")} style={{ background: "none", border: "none", color: "#ff8a80", cursor: "pointer", padding: 0, fontSize: "0.8rem" }}>✕</button>
            </div>
          )}

          {savedSearches.length > 0 && (
            <div style={{ marginTop: "12px", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}>Saved:</span>
              {savedSearches.slice(0, 4).map((s) => (
                <button key={s.id} onClick={() => handleRunSearch(s.query, s.category)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", borderRadius: "999px", padding: "4px 10px", cursor: "pointer", fontSize: "0.72rem" }}>
                  {s.query}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>Try:</span>
            {["milk", "chicken", "Tylenol", "syringe", "air fryer"].map((item) => (
              <button key={item} onClick={() => setQuery(item)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", borderRadius: "999px", padding: "4px 10px", cursor: "pointer", fontSize: "0.72rem" }}>{item}</button>
            ))}
            <button onClick={() => { setCategory("vehicle"); setVehicleYear("2021"); setVehicleMake("Toyota"); setVehicleModel("Camry"); }} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", borderRadius: "999px", padding: "4px 10px", cursor: "pointer", fontSize: "0.72rem" }}>2021 Toyota Camry</button>
          </div>
        </section>

        {/* ── STATUS ── */}
        {error && <p style={{ color: "#ff8a80", marginTop: "18px", textAlign: "center", fontSize: "0.88rem" }}>{error}</p>}
        {copied && <p style={{ color: "#a7f3d0", marginTop: "18px", textAlign: "center", fontWeight: 700, fontSize: "0.88rem" }}>Link copied.</p>}

        {/* ── NO RESULTS ── */}
        {!loading && searched && results.length === 0 && (
          <section style={{ ...glass.card, marginTop: "24px" }}>
            <p style={{ color: "#ff8a80", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "8px" }}>NO MATCH FOUND</p>
            <h3 style={{ margin: "0 0 8px", fontSize: "1.15rem", fontWeight: 600 }}>
              {category === "vehicle" ? "No vehicle recall match" : category === "consumer" ? "No CPSC match" : "No FDA match"}
            </h3>
            <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.6, fontSize: "0.88rem", marginBottom: "16px" }}>
              Check broader safety sources below.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {category === "vehicle" ? (
                <a href={`https://www.nhtsa.gov/recalls?keyword=${encodeURIComponent(`${vehicleYear} ${vehicleMake} ${vehicleModel}`)}`} target="_blank" rel="noreferrer" style={glass.link}>
                  <div><strong style={{ fontSize: "0.88rem" }}>NHTSA recall lookup</strong><p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>Official vehicle recall database</p></div>
                  <span style={{ color: glow.primary }}>→</span>
                </a>
              ) : (
                <>
                  <a href={`https://www.cpsc.gov/Recalls?search=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer" style={glass.link}><div><strong style={{ fontSize: "0.88rem" }}>Consumer Product Safety</strong><p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>Official CPSC database</p></div><span style={{ color: glow.primary }}>→</span></a>
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(query+" recall news")}&tbm=nws`} target="_blank" rel="noreferrer" style={glass.link}><div><strong style={{ fontSize: "0.88rem" }}>Latest recall news</strong><p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>Recent safety coverage</p></div><span style={{ color: glow.primary }}>→</span></a>
                </>
              )}
            </div>
          </section>
        )}

        {/* ── RESULTS ── */}
        <section style={{ marginTop: "20px" }}>
          {results.map((r, i) => {
            const cardId = r.id||`${r.source}-${i}`;
            const risk = riskById[cardId];
            const isRiskLoading = riskLoadingById[cardId];
            const isFallback = risk?.aiStatus?.startsWith("fallback")||risk?.aiStatus==="frontend_ai_unavailable";
            const severity = risk && !isFallback ? risk.riskLevel : getRecallSeverity(r);
            const guidance = getRecallGuidance(r);
            const isExpanded = expandedWhy === cardId;
            const savedThis = isSaved(query, category);

            return (
              <motion.div
                key={cardId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onViewportEnter={() => logAlert(r, category)}
                style={glass.card}
              >
                {/* Glow */}
                <div style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "200px", background: `radial-gradient(circle, ${severity==="HIGH"?"rgba(255,59,48,0.1)":severity==="MEDIUM"?"rgba(255,149,0,0.08)":"rgba(255,255,255,0.03)"}, transparent 70%)`, pointerEvents: "none" }} />

                <div style={{ position: "relative" }}>
                  {/* Top row: badges + save */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: "8px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={glass.badge(severity)}>⚠ {severity} RISK</span>
                      <span style={{ ...glass.badge("LOW"), fontSize: "10px" }}>✓ {r.source}</span>
                    </div>
                    <button onClick={() => toggleSaved(query, category)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", opacity: savedThis ? 1 : 0.25, transition: "opacity 0.15s" }}>⭐</button>
                  </div>

                  <h3 style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)", lineHeight: 1.35, margin: "0 0 10px", fontWeight: 600 }}>
                    {highlight(shortText(r.title, 180), query)}
                  </h3>

                  <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.55, fontSize: "0.88rem", margin: "0 0 6px" }}>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Reason: </span>
                    {highlight(shortText(r.reason, 180), query)}
                  </p>

                  {/* Risk Intelligence */}
                  {isRiskLoading && <RiskIntelligence risk={risk} loading={isRiskLoading} source={r.source} date={r.date} sourceContext={risk?.sourceContext} />}
                  {risk && !isFallback && <RiskIntelligence risk={risk} loading={false} source={r.source} date={r.date} sourceContext={risk.sourceContext} />}
                  {risk && isFallback && (
                    <div style={{ marginTop: "12px", padding: "12px 14px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>
                      AI risk analysis temporarily unavailable. Official recall details shown below.
                    </div>
                  )}
                  {!risk && !isRiskLoading && (
                    <button onClick={() => analyzeRisks([r], { limit: 1 })} style={{ marginTop: "12px", ...glass.btn, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                      Analyze risk
                    </button>
                  )}

                  {/* Guidance */}
                  <div style={{ marginTop: "16px", padding: "16px", borderRadius: "16px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                      <strong style={{ fontSize: "0.88rem" }}>What should I do?</strong>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>{guidance.label}</span>
                    </div>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {guidance.actions.map((a, idx) => (
                        <motion.div key={a} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                          style={{ padding: "9px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.04)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                          {a}
                        </motion.div>
                      ))}
                    </div>

                    <button onClick={() => setExpandedWhy(isExpanded ? null : cardId)} style={{ marginTop: "12px", padding: "8px 12px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem" }}>
                      {isExpanded ? "Hide" : "Why is this dangerous?"}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                          <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginTop: "10px", fontSize: "0.85rem" }}>
                            Based on: <strong style={{ color: "rgba(255,255,255,0.7)" }}>{r.reason || "No reason provided."}</strong>
                          </p>
                          <a href={r.url||`https://www.google.com/search?q=${encodeURIComponent(`${r.company||""} recall`)}`} target="_blank" rel="noreferrer" style={{ color: "#ffb4ae", fontWeight: 700, fontSize: "0.85rem" }}>
                            Open official source →
                          </a>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Meta */}
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "14px", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                    <span>Source: {r.source}</span>
                    <span>Company: {r.company}</span>
                    <span>Date: {r.date}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
                    <button onClick={() => openPremiumModal(r.title)} style={{ ...glass.btn, background: "#ff3b30", color: "#fff" }}>
                      Protect me from this
                    </button>
                    <button onClick={() => shareRecall(r)} style={{ ...glass.btn, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                      Share
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>

        <footer style={{ color: "rgba(255,255,255,0.2)", textAlign: "center", margin: "40px 0 20px", fontSize: "0.75rem" }}>
          RecallRadar is an early prototype. Always verify with official sources.
        </footer>
      </div>

      {/* ── MODALS ── */}
      <AnimatePresence>{showHistory && <HistoryPanel open={showHistory} onClose={()=>setShowHistory(false)} searchHistory={searchHistory} savedSearches={savedSearches} alertHistory={alertHistory} onRunSearch={handleRunSearch} onToggleSaved={toggleSaved} isSaved={isSaved} onClearHistory={clearHistory} onClearSaved={clearSaved} />}</AnimatePresence>
      <AnimatePresence>{showScanner && <BarcodeScanner onResult={handleScanResult} onClose={()=>setShowScanner(false)} />}</AnimatePresence>
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={closePremiumModal} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:100 }}>
            <motion.div initial={{opacity:0,scale:0.94,y:16}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.94,y:16}} onClick={e=>e.stopPropagation()} style={{ width:"100%",maxWidth:"480px",background:"rgba(14,14,16,0.95)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"24px",padding:"28px",backdropFilter:"blur(20px)",boxShadow:"0 40px 100px rgba(0,0,0,0.6)" }}>
              {!joined ? (<>
                <p style={{color:"#ff8a80",fontWeight:700,letterSpacing:"0.08em",fontSize:"0.7rem",margin:0}}>PREMIUM MONITORING</p>
                <h2 style={{margin:"10px 0",fontSize:"1.6rem",fontWeight:600}}>Never miss a dangerous recall.</h2>
                <p style={{color:"rgba(255,255,255,0.4)",lineHeight:1.6,fontSize:"0.88rem"}}>Join early access for monitoring on products like:</p>
                <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"14px",padding:"12px",color:"#fff",margin:"14px 0",fontSize:"0.88rem"}}>{shortText(selectedProduct,100)}</div>
                <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&joinWaitlist()} placeholder="Email address" type="email" style={{...glass.input,marginBottom:"10px"}} />
                <button onClick={joinWaitlist} style={{...glass.btn,width:"100%",background:"#ff3b30",color:"#fff",fontSize:"0.92rem"}}>Join early access</button>
                <button onClick={closePremiumModal} style={{...glass.btn,width:"100%",marginTop:"8px",background:"transparent",color:"rgba(255,255,255,0.3)"}}>Maybe later</button>
              </>) : (<>
                <h2 style={{margin:"0 0 10px",fontSize:"1.6rem",fontWeight:600}}>You're on the list.</h2>
                <p style={{color:"rgba(255,255,255,0.4)",lineHeight:1.6,fontSize:"0.88rem"}}>We'll notify you when monitoring opens.</p>
                <button onClick={closePremiumModal} style={{...glass.btn,width:"100%",marginTop:"12px",background:"rgba(255,255,255,0.9)",color:"#000"}}>Continue</button>
              </>)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
