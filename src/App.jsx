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
import FloatingPhotos from "./FloatingPhotos.jsx";
import { categoryGlow } from "./photoMap.js";

/* ═══════════════════════════════════════════════════════════════════════════════
   TABLER ICONS CDN — loaded in index.html:
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════════
   CONSTANTS & NORMALISERS
   ═══════════════════════════════════════════════════════════════════════════════ */

const endpoints = {
  food: "https://api.fda.gov/food/enforcement.json",
  drug: "https://api.fda.gov/drug/enforcement.json",
  device: "https://api.fda.gov/device/enforcement.json",
};

const categoryLabels = { food: "Food", drug: "Medicine", device: "Medical Devices", consumer: "Consumer Products", vehicle: "Vehicles" };
const categories = ["food", "drug", "device", "consumer", "vehicle"];

const shortText = (t = "", l = 140) => (t.length > l ? t.slice(0, l).trim() + "\u2026" : t);
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const escapeRegex = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlight = (text = "", query) => {
  if (!query.trim()) return text;
  const r = new RegExp(`(${escapeRegex(query.trim())})`, "gi");
  return text.split(r).map((p, i) =>
    p.toLowerCase() === query.trim().toLowerCase()
      ? <span key={i} style={{ background: "#ff3b30", color: "#fff", padding: "1px 5px", borderRadius: "4px", fontSize: "inherit" }}>{p}</span>
      : p
  );
};

const formatDate = (d = "") => (d.length === 8 ? `${d.slice(4,6)}/${d.slice(6,8)}/${d.slice(0,4)}` : "N/A");
const formatCpscDate = (d = "") => { if (!d) return "N/A"; const x = new Date(d); return Number.isNaN(x.getTime()) ? d : x.toLocaleDateString(); };

const normalizeFdaRecall = (r, cat, i) => ({ id: `fda-${cat}-${r.report_date||""}-${r.recalling_firm||""}-${i}`, source: "FDA", category: cat, title: r.product_description || "Unknown product", reason: r.reason_for_recall || "No recall reason provided.", company: r.recalling_firm || "Unknown", date: formatDate(r.report_date), rawDate: r.report_date || "", url: `https://www.accessdata.fda.gov/scripts/ires/index.cfm?Product=${encodeURIComponent(r.product_description || "")}`, raw: r });
const normalizeCpscRecall = (r, i) => ({ id: `cpsc-${r.RecallNumber || i}`, source: "CPSC", category: "consumer", title: r.Products?.[0]?.Name || r.Title || "Consumer product recall", reason: r.Hazard || r.Description || r.Title || "No hazard details.", company: r.Manufacturers?.[0]?.Name || r.Manufacturer || "Unknown", date: formatCpscDate(r.RecallDate), rawDate: r.RecallDate || "", url: r.URL || `https://www.cpsc.gov/Recalls?search=${encodeURIComponent(r.Products?.[0]?.Name || r.Title || "")}`, raw: r });
const normalizeNhtsaRecall = (r, i) => ({ id: `nhtsa-${r.NHTSACampaignNumber || i}`, source: "NHTSA", category: "vehicle", title: `${r.ModelYear||""} ${r.Make||""} ${r.Model||""} — ${r.Component||"Vehicle recall"}`.trim(), reason: r.Summary || r.Conequence || r.Consequence || r.Notes || "No summary.", company: r.Manufacturer || "Unknown", date: r.ReportReceivedDate || "N/A", rawDate: r.ReportReceivedDate || "", url: `https://www.nhtsa.gov/recalls?nhtsaId=${encodeURIComponent(r.NHTSACampaignNumber||"")}`, raw: r });

const getRecallSeverity = (recall) => {
  const t = `${recall.reason||""} ${recall.raw?.Consequence||""} ${recall.raw?.Conequence||""}`.toLowerCase();
  if (/death|fire|crash|injury|choking|listeria|salmonella/.test(t)) return "HIGH";
  if (/burn|fall|allergen|metal|glass|airbag|brake/.test(t)) return "MEDIUM";
  return "LOW";
};

const getRecallGuidance = (recall) => {
  if (recall.category === "vehicle") return { label: "Vehicle safety recall", actions: ["Check whether your exact year, make, and model are affected", "Contact your dealer or manufacturer for repair instructions", "Recall repairs are usually handled by authorized dealers", "Keep the NHTSA campaign number for reference"] };
  if (recall.category === "consumer") return { label: "Consumer product safety", actions: ["Stop using the product until you verify recall details", "Check model, batch, date code, or product identifiers", "Follow remedy instructions for refund, repair, or replacement", "Contact the manufacturer if details are unclear"] };
  const r = (recall.reason||"").toLowerCase();
  if (/salmonella|listeria|contamination/.test(r)) return { label: "Illness risk", actions: ["Do not consume or use this product", "Dispose of it safely or return to the store", "Wash hands, surfaces, and containers that touched it", "Check the package for lot, UPC, or batch numbers"] };
  if (/undeclared|allergen/.test(r)) return { label: "Allergy risk", actions: ["Avoid if you have allergies or sensitivities", "Check ingredient label, UPC, lot, or batch number", "Return to the store where purchased", "Contact the manufacturer if unsure"] };
  return { label: "General recall", actions: ["Review the recall details carefully", "Check package identifiers like UPC, lot, or batch number", "Consider returning the product to the store", "Contact the manufacturer if details are unclear"] };
};

const getRiskCacheKey = (r = {}) => `recallradar:risk:${[r.source||"",r.category||"",r.id||"",r.title||"",r.date||"",r.rawDate||""].join("|").toLowerCase()}`;
const readCachedRisk = (r) => { try { return JSON.parse(localStorage.getItem(getRiskCacheKey(r)))?.risk || null; } catch { return null; } };
const writeCachedRisk = (r, risk) => { try { if (!risk || risk.aiStatus?.startsWith("fallback") || risk.aiStatus === "frontend_ai_unavailable") return; localStorage.setItem(getRiskCacheKey(r), JSON.stringify({ risk, cachedAt: new Date().toISOString() })); } catch {} };
const buildUnavailableRisk = (r) => ({ riskLevel: "UNAVAILABLE", contextualLabel: "AI UNAVAILABLE", riskQualifier: "AI risk analysis temporarily unavailable.", why: ["AI analysis temporarily unavailable"], reportedImpact: "Not analyzed.", recommendedAction: "Review the official recall source.", confidence: "Limited", plainEnglishSummary: "AI analysis unavailable.", aiStatus: "frontend_ai_unavailable", sourceContext: { sourceName: r.source||"Official Source", sourceType: "Official recall data", sourceUrl: r.url||"", checkedFields: ["official recall record"], note: "AI may be temporarily unavailable.", trustedSources: r.url ? [{ label: `Official ${r.source||"recall"} source`, url: r.url, type: "official" }] : [] } });

/* ═══════════════════════════════════════════════════════════════════════════════
   IDLE 3D HERO
   ═══════════════════════════════════════════════════════════════════════════════ */

function IdleOrb() {
  const ref = useRef(null);
  useFrame((s) => { if (!ref.current) return; ref.current.rotation.y = s.clock.elapsedTime * 0.25; ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.3) * 0.12; });
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
   GLASS DESIGN TOKENS — no emojis, Tabler icons, premium surfaces
   ═══════════════════════════════════════════════════════════════════════════════ */

const g = {
  card: { background: "rgba(255,255,255,0.035)", border: "0.5px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "clamp(16px, 3vw, 22px)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", marginBottom: "14px", position: "relative", overflow: "hidden" },
  panel: { background: "rgba(10,10,14,0.75)", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: "22px", padding: "clamp(16px, 3vw, 22px)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" },
  input: { width: "100%", minWidth: 0, padding: "13px 16px", borderRadius: "12px", border: "0.5px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.35)", color: "#fff", outline: "none", fontSize: "0.9rem", boxSizing: "border-box" },
  btn: { padding: "11px 18px", borderRadius: "11px", border: "none", fontWeight: 600, cursor: "pointer", fontSize: "0.82rem", transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: "6px" },
  severity: (s) => ({
    display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 600, letterSpacing: "0.04em",
    background: s === "HIGH" ? "rgba(255,59,48,0.14)" : s === "MEDIUM" ? "rgba(255,149,0,0.14)" : "rgba(255,255,255,0.05)",
    color: s === "HIGH" ? "#ff6b60" : s === "MEDIUM" ? "#ffb44a" : "rgba(255,255,255,0.4)",
    border: `0.5px solid ${s === "HIGH" ? "rgba(255,59,48,0.25)" : s === "MEDIUM" ? "rgba(255,149,0,0.2)" : "rgba(255,255,255,0.07)"}`,
  }),
  source: { display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 9px", borderRadius: "999px", fontSize: "10px", fontWeight: 600, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "0.5px solid rgba(255,255,255,0.06)" },
  catBtn: (active) => ({ padding: "7px 14px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 600, border: active ? "0.5px solid rgba(255,255,255,0.3)" : "0.5px solid rgba(255,255,255,0.07)", background: active ? "rgba(255,255,255,0.08)" : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.35)", cursor: "pointer", transition: "all 0.2s" }),
  link: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: "12px", textDecoration: "none", color: "#fff", background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.05)", transition: "background 0.15s" },
  meta: { display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "14px", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" },
  glow: (s) => ({ position: "absolute", top: -20, right: -20, width: 140, height: 140, background: `radial-gradient(circle, ${s==="HIGH"?"rgba(255,59,48,0.08)":s==="MEDIUM"?"rgba(255,149,0,0.06)":"rgba(255,255,255,0.02)"}, transparent 70%)`, pointerEvents: "none", borderRadius: "50%" }),
};

/* ═══════════════════════════════════════════════════════════════════════════════
   ICON HELPER — Tabler icon shorthand
   ═══════════════════════════════════════════════════════════════════════════════ */

const Icon = ({ name, size = 14, style = {} }) => (
  <i className={`ti ti-${name}`} style={{ fontSize: `${size}px`, lineHeight: 1, ...style }} aria-hidden="true" />
);

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

  const searchRecalls = useCallback(async (oQ, oC) => {
    const term = oQ ?? query, cat = oC ?? category;
    if (cat !== "vehicle" && !term.trim()) return;
    if (cat === "vehicle" && (!vehicleYear.trim()||!vehicleMake.trim()||!vehicleModel.trim())) { setError("Enter year, make, and model."); return; }
    setLoading(true); setError(""); setSearched(true); setResults([]); setRiskById({}); setRiskLoadingById({});
    try {
      let hits = [];
      if (["food","drug","device"].includes(cat)) { const res = await fetch(`${endpoints[cat]}?search=${encodeURIComponent(term.trim())}&limit=10`); if (!res.ok) { if (res.status!==404) setError(`Search failed (${res.status}).`); } else { const d = await res.json(); hits = (d.results??[]).map((r,i)=>normalizeFdaRecall(r,cat,i)); } }
      if (cat === "consumer") { const res = await fetch(`https://www.saferproducts.gov/RestWebServices/Recall?format=json&ProductName=${encodeURIComponent(term.trim())}`); if (!res.ok) { setError(`CPSC failed (${res.status}).`); return; } const d = await res.json(); hits = Array.isArray(d) ? d.slice(0,10).map(normalizeCpscRecall) : []; }
      if (cat === "vehicle") { const res = await fetch(`https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(vehicleMake.trim())}&model=${encodeURIComponent(vehicleModel.trim())}&modelYear=${encodeURIComponent(vehicleYear.trim())}`); if (!res.ok) { setError(`NHTSA failed (${res.status}).`); return; } const d = await res.json(); hits = (d.results??d.Results??[]).slice(0,20).map(normalizeNhtsaRecall); }
      setResults(hits); analyzeRisks(hits, { limit: 1 });
      logSearch(cat==="vehicle"?`${vehicleYear} ${vehicleMake} ${vehicleModel}`:term, cat, hits.length);
    } catch (err) { setError(err.name==="TypeError"?"Network error.":"Something went wrong."); } finally { setLoading(false); }
  }, [query, category, vehicleYear, vehicleMake, vehicleModel, logSearch, analyzeRisks]);

  useEffect(() => { const p = new URLSearchParams(window.location.search); const q = p.get("q"), c = p.get("cat"); if (q) { const cat = c&&categories.includes(c)?c:"food"; setQuery(q); setCategory(cat); searchRecalls(q, cat); } }, []);

  const handleScanResult = (n) => { setScannedLabel(n); setQuery(n); setCategory("food"); searchRecalls(n,"food"); };
  const handleRunSearch = (q,c) => { setQuery(q); setCategory(c); searchRecalls(q,c); };
  const shareRecall = async (r) => { const url = `${location.origin}${location.pathname}?q=${encodeURIComponent(query||r.title||"")}&cat=${category}`; const text = `Recall Alert\n\n${shortText(r.title,180)}\n${shortText(r.reason,180)}\n\n${url}`; try { if (navigator.share) await navigator.share({title:"Recall Alert",text,url}); else { await navigator.clipboard.writeText(text); setCopied(r.title); setTimeout(()=>setCopied(""),1800); } } catch {} };
  const openPremiumModal = (p) => { setSelectedProduct(p||query||"this product"); setJoined(false); };
  const closePremiumModal = () => { setSelectedProduct(""); setEmail(""); setJoined(false); };
  const handleCategoryChange = (c) => { setCategory(c); setResults([]); setSearched(false); setError(""); setRiskById({}); setRiskLoadingById({}); };
  const joinWaitlist = async () => { if (!email.trim()||!isValidEmail(email)) { alert("Enter a valid email."); return; } try { const r = await fetch("https://api.sheetbest.com/sheets/a5c4ecd4-7684-48f7-9cd0-8ccf090c0b7a",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim(),product:selectedProduct,category,search_query:query,source:"premium_modal",timestamp:new Date().toISOString()})}); if(!r.ok){alert(`Error (${r.status}).`);return;} setJoined(true); } catch{alert("Network error.");} };

  const totalActivity = searchHistory.length + alertHistory.length + savedSearches.length;

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top, #10080c 0%, #0a0c14 30%, #060608 100%)", color: "#fff", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", position: "relative", overflow: "hidden" }}>

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, background: glow.bg, zIndex: 0, pointerEvents: "none", transition: "background 0.8s ease" }} />

      {/* Background layers */}
      {searched && <PhotoHero query={query} category={category} hasResults={results.length > 0} isSearching={loading} />}
      {!searched && <IdleHero />}
      <FloatingPhotos query={query} category={category} visible={searched && results.length > 0} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "920px", margin: "0 auto", padding: "clamp(14px, 3vw, 24px)" }}>

        {/* NAV */}
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: searched ? "24px" : "40px", gap: "10px", flexWrap: "wrap" }}>
          <strong style={{ fontSize: "0.95rem", letterSpacing: "-0.02em", color: "rgba(255,255,255,0.8)" }}>RecallRadar</strong>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => setShowHistory(true)} style={{ position: "relative", ...g.btn, background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
              <Icon name="clock" size={14} /> History
              {totalActivity > 0 && <span style={{ position: "absolute", top: -3, right: -3, background: "#ff3b30", borderRadius: "50%", width: 14, height: 14, fontSize: "0.55rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{Math.min(totalActivity, 99)}</span>}
            </button>
            <button onClick={() => openPremiumModal("early access")} style={{ ...g.btn, background: "rgba(255,255,255,0.88)", color: "#000" }}>
              Early access
            </button>
          </div>
        </nav>

        {/* IDLE HERO */}
        {!searched && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ textAlign: "center", minHeight: "400px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ display: "inline-block", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "999px", padding: "5px 14px", color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", background: "rgba(255,255,255,0.03)", margin: "0 auto 18px", letterSpacing: "0.03em" }}>
              Consumer safety intelligence
            </p>
            <h1 style={{ fontSize: "clamp(2.6rem, 7.5vw, 5rem)", lineHeight: 0.93, margin: "0 0 18px", letterSpacing: "-0.055em", fontWeight: 600 }}>
              Know before<br />it hurts you.
            </h1>
            <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "clamp(0.88rem, 2.2vw, 1.05rem)", maxWidth: "540px", margin: "0 auto", lineHeight: 1.65 }}>
              Search food, drugs, medical devices, consumer products, and vehicle recalls. Scan barcodes. Get AI-powered safety analysis.
            </p>
          </motion.section>
        )}

        {/* SEARCH PANEL */}
        <section style={g.panel}>
          <div style={{ display: "flex", justifyContent: "center", gap: "5px", flexWrap: "wrap", marginBottom: "14px" }}>
            {categories.map((c) => <button key={c} onClick={() => handleCategoryChange(c)} style={g.catBtn(category === c)}>{categoryLabels[c]}</button>)}
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
            <button onClick={() => setShowScanner(true)} title="Scan barcode" style={{ padding: "0 15px", borderRadius: "12px", background: "rgba(255,59,48,0.08)", border: "0.5px solid rgba(255,59,48,0.15)", color: "#ff6040", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center" }}>
              <Icon name="scan" size={18} />
            </button>
            <input value={query} onChange={(e) => { setQuery(e.target.value); setScannedLabel(""); }} onKeyDown={(e) => e.key === "Enter" && searchRecalls()} placeholder={category === "vehicle" ? "Optional keyword, e.g. airbag\u2026" : "Search product, brand, ingredient\u2026"} style={g.input} />
            <button onClick={() => searchRecalls()} disabled={loading} style={{ ...g.btn, background: "rgba(255,255,255,0.88)", color: "#000", flexShrink: 0, opacity: loading ? 0.5 : 1 }}>
              {loading ? <><Icon name="loader-2" size={14} style={{ animation: "spin 1s linear infinite" }} /> Scanning</> : "Search"}
            </button>
          </div>

          {category === "vehicle" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px", marginTop: "10px" }}>
              <input value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} placeholder="Year" style={g.input} />
              <input value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} placeholder="Make" style={g.input} />
              <input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} onKeyDown={(e) => e.key==="Enter"&&searchRecalls()} placeholder="Model" style={g.input} />
            </div>
          )}

          {scannedLabel && (
            <div style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,59,48,0.08)", border: "0.5px solid rgba(255,59,48,0.12)", borderRadius: "999px", padding: "4px 12px", fontSize: "0.75rem", color: "#ffb4ae" }}>
              <Icon name="scan" size={12} /> Scanned: <strong>{shortText(scannedLabel, 45)}</strong>
              <button onClick={() => setScannedLabel("")} style={{ background: "none", border: "none", color: "#ff8a80", cursor: "pointer", padding: 0 }}><Icon name="x" size={12} /></button>
            </div>
          )}

          {savedSearches.length > 0 && (
            <div style={{ marginTop: "10px", display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem" }}><Icon name="star" size={11} /> Saved:</span>
              {savedSearches.slice(0, 4).map((s) => (
                <button key={s.id} onClick={() => handleRunSearch(s.query, s.category)} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", borderRadius: "999px", padding: "3px 10px", cursor: "pointer", fontSize: "0.68rem" }}>{s.query}</button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
            <span style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.7rem" }}>Try:</span>
            {["milk", "chicken", "Tylenol", "syringe", "air fryer"].map((item) => (
              <button key={item} onClick={() => setQuery(item)} style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", borderRadius: "999px", padding: "3px 9px", cursor: "pointer", fontSize: "0.68rem" }}>{item}</button>
            ))}
            <button onClick={() => { setCategory("vehicle"); setVehicleYear("2021"); setVehicleMake("Toyota"); setVehicleModel("Camry"); }} style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", borderRadius: "999px", padding: "3px 9px", cursor: "pointer", fontSize: "0.68rem" }}>2021 Toyota Camry</button>
          </div>
        </section>

        {error && <p style={{ color: "#ff8a80", marginTop: "16px", textAlign: "center", fontSize: "0.85rem" }}>{error}</p>}
        {copied && <p style={{ color: "#a7f3d0", marginTop: "16px", textAlign: "center", fontWeight: 600, fontSize: "0.85rem" }}>Link copied</p>}

        {/* NO RESULTS */}
        {!loading && searched && results.length === 0 && (
          <section style={{ ...g.card, marginTop: "20px" }}>
            <p style={{ color: "#ff8a80", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "8px" }}>NO MATCH FOUND</p>
            <h3 style={{ margin: "0 0 8px", fontSize: "1.05rem", fontWeight: 600 }}>{category === "vehicle" ? "No vehicle recall match" : category === "consumer" ? "No CPSC match" : "No FDA match"}</h3>
            <p style={{ color: "rgba(255,255,255,0.35)", lineHeight: 1.6, fontSize: "0.85rem", marginBottom: "14px" }}>Check broader safety sources below.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {category === "vehicle" ? (
                <a href={`https://www.nhtsa.gov/recalls?keyword=${encodeURIComponent(`${vehicleYear} ${vehicleMake} ${vehicleModel}`)}`} target="_blank" rel="noreferrer" style={g.link}><div><strong style={{ fontSize: "0.85rem" }}>NHTSA recall lookup</strong><p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>Official vehicle recall database</p></div><Icon name="arrow-right" size={14} style={{ color: glow.primary }} /></a>
              ) : (
                <>
                  <a href={`https://www.cpsc.gov/Recalls?search=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer" style={g.link}><div><strong style={{ fontSize: "0.85rem" }}>Consumer Product Safety</strong><p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>Official CPSC database</p></div><Icon name="arrow-right" size={14} style={{ color: glow.primary }} /></a>
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(query+" recall news")}&tbm=nws`} target="_blank" rel="noreferrer" style={g.link}><div><strong style={{ fontSize: "0.85rem" }}>Latest recall news</strong><p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>Recent safety coverage</p></div><Icon name="arrow-right" size={14} style={{ color: glow.primary }} /></a>
                </>
              )}
            </div>
          </section>
        )}

        {/* RESULTS */}
        <section style={{ marginTop: "18px" }}>
          {results.map((r, i) => {
            const cardId = r.id||`${r.source}-${i}`;
            const risk = riskById[cardId], isRL = riskLoadingById[cardId];
            const isFB = risk?.aiStatus?.startsWith("fallback")||risk?.aiStatus==="frontend_ai_unavailable";
            const sev = risk && !isFB ? risk.riskLevel : getRecallSeverity(r);
            const guide = getRecallGuidance(r);
            const isExp = expandedWhy === cardId;
            const saved = isSaved(query, category);

            return (
              <motion.div key={cardId} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onViewportEnter={() => logAlert(r, category)} style={g.card}>
                <div style={g.glow(sev)} />
                <div style={{ position: "relative" }}>

                  {/* Badges */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "8px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={g.severity(sev)}><Icon name="alert-triangle" size={11} /> {sev} RISK</span>
                      <span style={g.source}><Icon name="circle-check" size={10} /> {r.source}</span>
                    </div>
                    <button onClick={() => toggleSaved(query, category)} title={saved?"Unsave":"Save"} style={{ background: "none", border: "none", cursor: "pointer", color: saved ? "#ffb44a" : "rgba(255,255,255,0.15)", transition: "color 0.15s" }}>
                      <Icon name={saved ? "star-filled" : "star"} size={16} />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: "clamp(0.95rem, 2.3vw, 1.12rem)", lineHeight: 1.4, margin: "0 0 8px", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                    {highlight(shortText(r.title, 180), query)}
                  </h3>

                  {/* Reason */}
                  <p style={{ color: "rgba(255,255,255,0.42)", lineHeight: 1.55, fontSize: "0.84rem", margin: "0 0 4px" }}>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Reason: </span>
                    {highlight(shortText(r.reason, 180), query)}
                  </p>

                  {/* Risk Intelligence */}
                  {isRL && <RiskIntelligence risk={risk} loading={isRL} source={r.source} date={r.date} sourceContext={risk?.sourceContext} />}
                  {risk && !isFB && <RiskIntelligence risk={risk} loading={false} source={r.source} date={r.date} sourceContext={risk.sourceContext} />}
                  {risk && isFB && (
                    <div style={{ marginTop: "10px", padding: "11px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon name="info-circle" size={14} /> AI analysis temporarily unavailable. Official details shown below.
                    </div>
                  )}
                  {!risk && !isRL && (
                    <button onClick={() => analyzeRisks([r], { limit: 1 })} style={{ marginTop: "10px", ...g.btn, background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }}>
                      <Icon name="brain" size={14} /> Analyze risk
                    </button>
                  )}

                  {/* Guidance */}
                  <div style={{ marginTop: "14px", padding: "14px 16px", borderRadius: "14px", background: "rgba(0,0,0,0.2)", border: "0.5px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                      <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: "6px" }}><Icon name="compass" size={14} /> What should I do?</span>
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.7rem" }}>{guide.label}</span>
                    </div>
                    <div style={{ display: "grid", gap: "6px" }}>
                      {guide.actions.map((a, idx) => (
                        <motion.div key={a} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                          style={{ padding: "8px 12px", borderRadius: "9px", background: "rgba(255,255,255,0.025)", color: "rgba(255,255,255,0.5)", border: "0.5px solid rgba(255,255,255,0.03)", fontSize: "0.82rem", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: "8px" }}>
                          <Icon name="chevron-right" size={12} style={{ marginTop: "3px", flexShrink: 0, color: "rgba(255,255,255,0.2)" }} />
                          <span>{a}</span>
                        </motion.div>
                      ))}
                    </div>

                    <button onClick={() => setExpandedWhy(isExp ? null : cardId)} style={{ marginTop: "10px", padding: "7px 12px", borderRadius: "9px", background: "transparent", border: "0.5px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontWeight: 600, fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Icon name={isExp ? "chevron-up" : "chevron-down"} size={12} />
                      {isExp ? "Hide details" : "Why is this dangerous?"}
                    </button>

                    <AnimatePresence>
                      {isExp && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                          <p style={{ color: "rgba(255,255,255,0.35)", lineHeight: 1.6, marginTop: "10px", fontSize: "0.82rem" }}>
                            Based on: <strong style={{ color: "rgba(255,255,255,0.6)" }}>{r.reason || "No reason provided."}</strong>
                          </p>
                          <a href={r.url||`https://www.google.com/search?q=${encodeURIComponent(`${r.company||""} recall`)}`} target="_blank" rel="noreferrer" style={{ color: "#ffb4ae", fontWeight: 600, fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            Open official source <Icon name="external-link" size={12} />
                          </a>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Meta */}
                  <div style={g.meta}>
                    <span><Icon name="database" size={11} style={{ marginRight: 3 }} />{r.source}</span>
                    <span><Icon name="building" size={11} style={{ marginRight: 3 }} />{r.company}</span>
                    <span><Icon name="calendar" size={11} style={{ marginRight: 3 }} />{r.date}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                    <button onClick={() => openPremiumModal(r.title)} style={{ ...g.btn, background: "#ff3b30", color: "#fff" }}>
                      <Icon name="shield-check" size={14} /> Protect me
                    </button>
                    <button onClick={() => shareRecall(r)} style={{ ...g.btn, background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
                      <Icon name="share" size={14} /> Share
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>

        <footer style={{ color: "rgba(255,255,255,0.15)", textAlign: "center", margin: "36px 0 16px", fontSize: "0.7rem" }}>
          RecallRadar is an early prototype. Always verify with official sources.
        </footer>
      </div>

      {/* MODALS */}
      <AnimatePresence>{showHistory && <HistoryPanel open={showHistory} onClose={()=>setShowHistory(false)} searchHistory={searchHistory} savedSearches={savedSearches} alertHistory={alertHistory} onRunSearch={handleRunSearch} onToggleSaved={toggleSaved} isSaved={isSaved} onClearHistory={clearHistory} onClearSaved={clearSaved} />}</AnimatePresence>
      <AnimatePresence>{showScanner && <BarcodeScanner onResult={handleScanResult} onClose={()=>setShowScanner(false)} />}</AnimatePresence>
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={closePremiumModal} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",zIndex:100 }}>
            <motion.div initial={{opacity:0,scale:0.95,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:12}} onClick={e=>e.stopPropagation()} style={{ width:"100%",maxWidth:"440px",background:"rgba(12,12,16,0.95)",border:"0.5px solid rgba(255,255,255,0.07)",borderRadius:"22px",padding:"24px",backdropFilter:"blur(24px)",boxShadow:"0 30px 80px rgba(0,0,0,0.5)" }}>
              {!joined ? (<>
                <p style={{color:"#ff8a80",fontWeight:600,letterSpacing:"0.07em",fontSize:"0.65rem",margin:0}}>PREMIUM MONITORING</p>
                <h2 style={{margin:"10px 0",fontSize:"1.45rem",fontWeight:600}}>Never miss a dangerous recall.</h2>
                <p style={{color:"rgba(255,255,255,0.38)",lineHeight:1.6,fontSize:"0.85rem"}}>Join early access for monitoring on products like:</p>
                <div style={{background:"rgba(255,255,255,0.03)",border:"0.5px solid rgba(255,255,255,0.05)",borderRadius:"12px",padding:"11px 14px",color:"rgba(255,255,255,0.7)",margin:"12px 0",fontSize:"0.85rem"}}>{shortText(selectedProduct,90)}</div>
                <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&joinWaitlist()} placeholder="Email address" type="email" style={{...g.input,marginBottom:"8px"}} />
                <button onClick={joinWaitlist} style={{...g.btn,width:"100%",background:"#ff3b30",color:"#fff",justifyContent:"center",fontSize:"0.88rem"}}><Icon name="shield-check" size={15} /> Join early access</button>
                <button onClick={closePremiumModal} style={{...g.btn,width:"100%",marginTop:"6px",background:"transparent",color:"rgba(255,255,255,0.25)",justifyContent:"center"}}>Maybe later</button>
              </>) : (<>
                <h2 style={{margin:"0 0 8px",fontSize:"1.45rem",fontWeight:600}}>You're on the list.</h2>
                <p style={{color:"rgba(255,255,255,0.38)",lineHeight:1.6,fontSize:"0.85rem"}}>We'll notify you when monitoring opens.</p>
                <button onClick={closePremiumModal} style={{...g.btn,width:"100%",marginTop:"10px",background:"rgba(255,255,255,0.88)",color:"#000",justifyContent:"center"}}>Continue</button>
              </>)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
