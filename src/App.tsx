import { lazy, Suspense, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RiskIntelligence from "./RiskIntelligence";
import BarcodeScanner from "./BarcodeScanner";
import HistoryPanel from "./HistoryPanel.jsx";
import PhotoHero from "./PhotoHero.jsx";
import FloatingPhotos from "./FloatingPhotos.jsx";
import RecallRadarLogo from "./RecallRadarLogo";
import { resolvePhoto } from "./photoMap.js";
import { useHistory } from "./useHistory.js";

const LandingPage = lazy(() => import("./LandingPage"));

type Category = "food" | "drug" | "device" | "consumer" | "vehicle";
type Severity = "LOW" | "MEDIUM" | "HIGH";
type SearchMode = "search" | "monitor";

type Recall = {
  id?: string;
  source?: "FDA" | "CPSC" | "NHTSA" | string;
  category?: Category | string;
  product_description?: string;
  reason_for_recall?: string;
  recalling_firm?: string;
  report_date?: string;
  recall_number?: string;
  classification?: string;
  status?: string;
  url?: string;
  remedy?: string;
};

const categoryLabels: Record<Category, string> = {
  food: "Food",
  drug: "Medicine",
  device: "Medical Devices",
  consumer: "Consumer Products",
  vehicle: "Vehicles",
};

const productImages: Record<string, string[]> = {
  chicken: [
    "/images/chicken/chicken-01.jpg",
    "/images/chicken/chicken-02.jpg",
    "/images/chicken/chicken-03.jpg",
    "/images/chicken/chicken-04.jpg",
    "/images/chicken/chicken-05.jpg",
    "/images/chicken/chicken-06.jpg",
    "/images/chicken/chicken-07.jpg",
  ],
  milk: [
    "/images/milk/milk-01.jpg",
    "/images/milk/milk-02.jpg",
    "/images/milk/milk-03.jpg",
    "/images/milk/milk-04.jpg",
  ],
};

const getProductImage = (description = "", index = 0, itemCategory: Category | string = "food") => {
  if (itemCategory === "vehicle") {
    return resolvePhoto(description, "vehicle");
  }
  const text = description.toLowerCase();
  if (text.includes("chicken")) return productImages.chicken[index % productImages.chicken.length];
  if (text.includes("milk")) return productImages.milk[index % productImages.milk.length];
  return resolvePhoto(description, itemCategory as Category);
};

const linkCardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid rgba(247,243,238,0.09)",
  textDecoration: "none",
  color: "#f7f3ee",
  background: "rgba(247,243,238,0.02)",
};

const subtleText: CSSProperties = { fontSize: "12px", color: "rgba(247,243,238,0.4)", marginTop: "2px" };
const arrowStyle: CSSProperties = { color: "#c65b45" };

const shortText = (text?: string, limit = 140) =>
  text && text.length > limit ? text.slice(0, limit).trim() + "..." : text || "";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlight = (text = "", query: string) => {
  if (!query.trim()) return text;
  const safeQuery = escapeRegex(query.trim());
  const regex = new RegExp(`(${safeQuery})`, "gi");
  return text.split(regex).map((part, i) =>
    part.toLowerCase() === query.trim().toLowerCase() ? (
      <span key={i} style={{ background: "#c65b45", color: "#fbf1ec", padding: "2px 5px", borderRadius: "5px" }}>{part}</span>
    ) : (
      part
    )
  );
};

const getSeverity = (reason?: string, itemCategory?: Category | string): Severity => {
  if (!reason) return "LOW";
  const n = reason.toLowerCase();
  if (itemCategory === "vehicle") {
    if (n.includes("air bag") || n.includes("airbag") || n.includes("brake") || n.includes("crash") || n.includes("fire") || n.includes("injury") || n.includes("death") || n.includes("fuel") || n.includes("stall")) return "HIGH";
    return "MEDIUM";
  }
  if (n.includes("listeria") || n.includes("salmonella") || n.includes("death") || n.includes("seizure") || n.includes("contamination") || n.includes("serious injury")) return "HIGH";
  if (n.includes("undeclared") || n.includes("allergen") || n.includes("metal") || n.includes("glass") || n.includes("chemical") || n.includes("fall") || n.includes("burn")) return "MEDIUM";
  return "LOW";
};

const getGuidance = (reason = "", itemCategory?: Category | string) => {
  const r = reason.toLowerCase();
  if (itemCategory === "vehicle") {
    return {
      label: "Vehicle safety recall",
      actions: [
        "Confirm your exact vehicle with a VIN lookup",
        "Contact a Toyota dealer or the manufacturer for repair status",
        "Ask whether recall service is available before driving long distances",
        "Save this vehicle so future NHTSA matches can be monitored",
      ],
    };
  }
  if (r.includes("salmonella") || r.includes("listeria") || r.includes("contamination")) {
    return {
      label: "Potential illness risk",
      actions: [
        "🚫 Do not consume or use this product",
        "🗑 Dispose of it safely or return it to the store",
        "🧼 Wash hands, surfaces, and containers that touched it",
        "📦 Check the package for lot, UPC, or batch numbers",
      ],
    };
  }
  if (r.includes("undeclared") || r.includes("allergen")) {
    return {
      label: "Potential allergy risk",
      actions: [
        "⚠️ Avoid this product if you have allergies or sensitivities",
        "📦 Check the ingredient label, UPC, lot, or batch number",
        "🔁 Return it to the store where it was purchased",
        "☎️ Contact the manufacturer if you are unsure",
      ],
    };
  }
  return {
    label: "Recall guidance",
    actions: [
      "⚠️ Review the recall details carefully",
      "📦 Check package identifiers like UPC, lot, or batch number",
      "🔁 Consider returning the product to the store",
      "☎️ Contact the manufacturer if details are unclear",
    ],
  };
};

const formatDate = (date?: string) => {
  if (!date) return "N/A";
  if (/^\d{8}$/.test(date)) {
    return `${date.slice(4, 6)}/${date.slice(6, 8)}/${date.slice(0, 4)}`;
  }
  const slashDate = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashDate) {
    const [, first, second, year] = slashDate;
    const month = Number(first) > 12 ? second : first;
    const day = Number(first) > 12 ? first : second;
    const parsedSlashDate = new Date(Number(year), Number(month) - 1, Number(day));
    if (!Number.isNaN(parsedSlashDate.getTime())) {
      return parsedSlashDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  }
  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return date;
};

const sourceName = (category: Category) => {
  if (category === "consumer") return "CPSC";
  if (category === "vehicle") return "NHTSA";
  return "FDA";
};

const getOfficialRecallUrl = (recall: Recall) => {
  if (recall.category === "vehicle" || recall.source === "NHTSA") {
    return recall.recall_number
      ? `https://www.nhtsa.gov/recalls?nhtsaId=${encodeURIComponent(recall.recall_number)}`
      : "https://www.nhtsa.gov/recalls";
  }
  return recall.url || `https://www.google.com/search?q=${encodeURIComponent(`${recall.recalling_firm || ""} recall`)}`;
};

const getVehicleIssueLabel = (recall: Recall) => {
  const text = `${recall.classification || ""} ${recall.reason_for_recall || ""}`.toLowerCase();
  if (text.includes("air bag") || text.includes("airbag") || text.includes("occupant classification")) return "Airbag system";
  if (text.includes("brake")) return "Brake system";
  if (text.includes("tire")) return "Tires";
  if (text.includes("fuel")) return "Fuel system";
  if (text.includes("battery")) return "Battery / electrical";
  if (text.includes("light") || text.includes("lamp")) return "Lighting";
  return recall.classification || "Vehicle safety system";
};

const getVehicleRiskLabel = (severity: Severity) => (
  severity === "HIGH" ? "URGENT SAFETY RECALL" : "SAFETY RECALL"
);

const parseVehicleQuery = (value = "") => {
  const year = value.match(/\b(19|20)\d{2}\b/)?.[0] || "";
  const rest = value.replace(year, "").trim().split(/\s+/).filter(Boolean);
  return {
    year,
    make: rest[0] || "",
    model: rest.slice(1).join(" "),
  };
};

const buildRecallSearchUrl = (category: Category, searchTerm: string) => {
  const params = new URLSearchParams({ category, query: searchTerm.trim() });
  if (category === "vehicle") {
    const vehicle = parseVehicleQuery(searchTerm);
    if (vehicle.year) params.set("year", vehicle.year);
    if (vehicle.make) params.set("make", vehicle.make);
    if (vehicle.model) params.set("model", vehicle.model);
  }
  return `/api/recalls?${params.toString()}`;
};

export default function App() {
  const [view, setView] = useState<"landing" | "app">("landing");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<Category>("food");
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const {
    searchHistory, savedSearches, alertHistory,
    logSearch, toggleSaved, isSaved, logAlert, clearHistory, clearSaved,
  } = useHistory();

  const searchRecalls = async (overrideQuery?: string, overrideCategory?: Category) => {
    const searchTerm = overrideQuery || query;
    const searchCategory = overrideCategory || category;
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    setResults([]);
    try {
      const url = buildRecallSearchUrl(searchCategory, searchTerm);
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setResults([]);
        setError(data?.error || `${sourceName(searchCategory)} search is temporarily unavailable.`);
        return;
      }
      if (data.needsVehicleFields) {
        setResults([]);
        setError("Enter a vehicle as year, make, and model, for example: 2021 Toyota Camry.");
        return;
      }
      const hits: Recall[] = data.results || [];
      setResults(hits);
      logSearch(searchTerm, searchCategory, hits.length);
    } catch (err) {
      console.error(err);
      setResults([]);
      setError("Something went wrong while searching recalls.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunSearch = (q: string, c: Category) => {
    setQuery(q);
    setCategory(c);
    searchRecalls(q, c);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedQuery = params.get("q");
    const sharedCategory = params.get("cat") as Category | null;
    if (sharedQuery) {
      const initialCategory = sharedCategory && categoryLabels[sharedCategory] ? sharedCategory : "food";
      setQuery(sharedQuery);
      setCategory(initialCategory);
      setTimeout(() => searchRecalls(sharedQuery, initialCategory), 250);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildShareUrl = (recall: Recall) => {
    const params = new URLSearchParams({ q: query || recall.product_description || "", cat: category, product: recall.product_description || "" });
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const shareRecall = async (recall: Recall) => {
    const url = buildShareUrl(recall);
    const text = `⚠️ Recall Alert\n\nProduct: ${shortText(recall.product_description, 180)}\n\nReason: ${shortText(recall.reason_for_recall, 180)}\n\nCheck it on RecallRadar:\n${url}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Recall Alert", text, url }); }
      else { await navigator.clipboard.writeText(text); setCopied(recall.product_description || "recall"); setTimeout(() => setCopied(""), 1800); }
    } catch (err) { console.error("Share failed:", err); }
  };

  const openPremiumModal = (product?: string) => { setSelectedProduct(product || query || "this product"); setJoined(false); };
  const closePremiumModal = () => { setSelectedProduct(""); setEmail(""); setJoined(false); };

  const joinWaitlist = async () => {
    if (!email.trim() || !isValidEmail(email)) { alert("Enter a valid email"); return; }
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), product: selectedProduct, category, search_query: query, source: "premium_modal", intent: "monitor_product", page: "app" }),
      });
      if (!res.ok) { const t = await res.text(); console.error("Waitlist error:", res.status, t); alert(`Could not save email. Error ${res.status}`); return; }
      setJoined(true);
    } catch (err) { console.error(err); alert("Something went wrong"); }
  };

  if (view === "landing") {
    const launchFromLanding = ({ query: landingQuery = "", category: landingCategory = "food", mode = "search" }: { query?: string; category?: Category; mode?: SearchMode } = {}) => {
      setCategory(landingCategory);
      setQuery(landingQuery);
      setView("app");
      setResults([]);
      setSearched(false);
      setError("");

      if (mode === "monitor") {
        setSelectedProduct(landingQuery || "this product");
        return;
      }

      if (landingQuery.trim()) {
        setTimeout(() => searchRecalls(landingQuery, landingCategory), 150);
      }
    };

    return (
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0c0b0a", color: "#f7f3ee" }} />}>
        <LandingPage
          onLaunch={launchFromLanding}
          onCategory={(cat) => launchFromLanding({ category: cat as Category })}
        />
      </Suspense>
    );
  }

  return (
    <div style={{ background: "#0c0b0a", color: "#f7f3ee", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>

      {/* ─── HERO ─── */}
      <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>

        {/* Background: food photo + 3D radar rings */}
        <PhotoHero query={query} category={category} />
        <FloatingPhotos query={query} category={category} visible={searched && results.length > 0} />

        {/* Nav + hero content */}
        <div style={{
          position: "relative", zIndex: 10,
          maxWidth: "1200px", margin: "0 auto",
          padding: "0 clamp(20px, 4vw, 48px)",
          minHeight: "100vh", display: "flex", flexDirection: "column",
        }}>

          {/* NAV */}
          <nav style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "28px 0", borderBottom: "1px solid rgba(247,243,238,0.09)", flexShrink: 0,
          }}>
            <button
              onClick={() => setView("landing")}
              aria-label="Back to RecallRadar landing page"
              style={{ width: "210px", height: "86px", border: 0, padding: 0, background: "transparent", cursor: "pointer", flexShrink: 0 }}
            >
              <RecallRadarLogo className="app-nav-logo" idPrefix="nav" />
            </button>

            <button
              onClick={() => setShowHistory(true)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "rgba(247,243,238,0.06)", border: "1px solid rgba(247,243,238,0.1)",
                color: "rgba(247,243,238,0.78)", borderRadius: "999px", padding: "9px 16px",
                cursor: "pointer", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.04em",
                fontFamily: "inherit",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M10 6V10L12.6 11.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              History
              {(savedSearches.length + searchHistory.length) > 0 && (
                <span style={{ background: "#c65b45", color: "#fbf1ec", borderRadius: "999px", padding: "1px 7px", fontSize: "0.68rem", fontWeight: 900 }}>
                  {savedSearches.length + searchHistory.length}
                </span>
              )}
            </button>
          </nav>

          {/* Hero text + search */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: "80px", maxWidth: "580px" }}>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ color: "#c65b45", letterSpacing: "0.22em", fontSize: "0.7rem", fontWeight: 900, marginBottom: "28px" }}
            >
              KNOW BEFORE IT HURTS YOU
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(2.8rem, 5.2vw, 5.4rem)",
                lineHeight: 0.94,
                letterSpacing: "-0.04em",
                fontWeight: 400,
                marginBottom: "28px",
                color: "#f7f3ee",
              }}
            >
              Real-time recall<br />intelligence.<br />For everything<br />you bring home.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              style={{ color: "rgba(247,243,238,0.55)", maxWidth: "380px", fontSize: "0.94rem", lineHeight: 1.72, marginBottom: "44px" }}
            >
              Scan a barcode or search a product to see if it's been recalled and why.
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              style={{ maxWidth: "500px" }}
            >
              <div style={{
                display: "flex",
                background: "rgba(12,11,10,0.92)",
                border: "1px solid rgba(247,243,238,0.1)",
                borderRadius: "14px",
                overflow: "hidden",
                backdropFilter: "blur(24px)",
              }}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchRecalls()}
                  placeholder="Search by product, brand, or barcode..."
                  style={{ flex: 1, padding: "18px 16px", background: "transparent", border: "none", color: "#f7f3ee", outline: "none", fontSize: "0.94rem", fontFamily: "inherit" }}
                />
                <span style={{ display: "flex", alignItems: "center", paddingRight: "12px", color: "rgba(247,243,238,0.18)", fontSize: "0.75rem", letterSpacing: "0.06em", flexShrink: 0, pointerEvents: "none" }}>⌘K</span>
                <button
                  type="button"
                  onClick={() => searchRecalls()}
                  style={{ background: "#c65b45", border: "none", color: "#fbf1ec", padding: "0 18px", cursor: "pointer", fontWeight: 900, fontFamily: "inherit", flexShrink: 0 }}
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  title="Scan barcode"
                  style={{ background: "#c65b45", border: "none", color: "#fbf1ec", padding: "0 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="1" y="4" width="2" height="12" fill="currentColor" rx="0.5" />
                    <rect x="4.5" y="4" width="1" height="12" fill="currentColor" rx="0.5" />
                    <rect x="7" y="4" width="2" height="12" fill="currentColor" rx="0.5" />
                    <rect x="10.5" y="4" width="1" height="12" fill="currentColor" rx="0.5" />
                    <rect x="13" y="4" width="3" height="12" fill="currentColor" rx="0.5" />
                    <rect x="17.5" y="4" width="1.5" height="12" fill="currentColor" rx="0.5" />
                  </svg>
                </button>
              </div>

              <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "10px", color: "rgba(247,243,238,0.36)", fontSize: "0.84rem" }}>
                <span>or</span>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  style={{ background: "none", border: "none", color: "rgba(247,243,238,0.44)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.84rem", padding: 0, fontFamily: "inherit" }}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <circle cx="7.5" cy="7.5" r="6.5" stroke="rgba(247,243,238,0.44)" strokeWidth="1" />
                    <circle cx="7.5" cy="7.5" r="2.5" stroke="rgba(247,243,238,0.44)" strokeWidth="1" />
                    <circle cx="7.5" cy="7.5" r="1" fill="rgba(247,243,238,0.44)" />
                  </svg>
                  Scan barcode
                </button>
              </div>

              {loading && (
                <p style={{ color: "rgba(247,243,238,0.35)", fontSize: "0.82rem", marginTop: "12px" }}>
                  Searching {sourceName(category)} recall data...
                </p>
              )}

              {/* Category pills */}
              <div style={{ marginTop: "20px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(["food", "drug", "device", "consumer", "vehicle"] as Category[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setResults([]); setSearched(false); setError(""); }}
                    style={{
                      padding: "7px 14px",
                      borderRadius: "999px",
                      border: category === c ? "1px solid rgba(247,243,238,0.4)" : "1px solid rgba(247,243,238,0.1)",
                      background: category === c ? "rgba(247,243,238,0.09)" : "transparent",
                      color: category === c ? "#f7f3ee" : "rgba(247,243,238,0.36)",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: "0.74rem",
                      letterSpacing: "0.06em",
                      fontFamily: "inherit",
                    }}
                  >
                    {categoryLabels[c].toUpperCase()}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ─── RESULTS ─── */}
      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 28px" }}>

        {error && (
          <p style={{ color: "#ff6b60", margin: "28px 0 0", textAlign: "center" }}>{error}</p>
        )}

        {copied && (
          <p style={{ color: "#8fb08f", margin: "28px 0 0", textAlign: "center", fontWeight: 800 }}>Link copied to clipboard.</p>
        )}

        {!loading && searched && results.length === 0 && (
          <section style={{ marginTop: "40px", padding: "28px", borderRadius: "20px", background: "rgba(247,243,238,0.03)", border: "1px solid rgba(247,243,238,0.07)", backdropFilter: "blur(10px)" }}>
            <p style={{ color: "#e4a396", fontSize: "12px", marginBottom: "10px", fontWeight: 900 }}>BROADER SAFETY SIGNALS</p>
            <h3 style={{ marginBottom: "10px" }}>
              {category === "vehicle" ? "No NHTSA match found" : category === "consumer" ? "No CPSC match found" : "No FDA match - expanding your search"}
            </h3>
            <p style={{ color: "rgba(247,243,238,0.55)", lineHeight: 1.6 }}>
              {category === "vehicle"
                ? "Try a full year, make, and model. VIN-specific checks should still be confirmed with NHTSA or the manufacturer."
                : category === "consumer"
                  ? "Try a product type, brand, or model number. You can also check official CPSC and manufacturer notices below."
                  : "This product may still have safety risks. Check official consumer-product, news, and manufacturer sources below."}
            </p>
            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <a href={category === "vehicle" ? "https://www.nhtsa.gov/recalls" : `https://www.cpsc.gov/Recalls?search=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer" style={linkCardStyle}>
                <div><strong>{category === "vehicle" ? "NHTSA recall lookup" : "Consumer Product Safety"}</strong><p style={subtleText}>{category === "vehicle" ? "Official vehicle recall database" : "Official CPSC recall database"}</p></div>
                <span style={arrowStyle}>→</span>
              </a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(query + " recall news")}&tbm=nws`} target="_blank" rel="noreferrer" style={linkCardStyle}>
                <div><strong>Latest recall news</strong><p style={subtleText}>Recent reports, incidents, and public safety coverage</p></div>
                <span style={arrowStyle}>→</span>
              </a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(query + " manufacturer recall")}`} target="_blank" rel="noreferrer" style={linkCardStyle}>
                <div><strong>Manufacturer notices</strong><p style={subtleText}>Company-issued recall and return information</p></div>
                <span style={arrowStyle}>→</span>
              </a>
            </div>
          </section>
        )}

        <section style={{ marginTop: "40px" }}>
          {results.map((r, i) => {
            const resultCategory = (r.category || category) as Category;
            const isVehicle = resultCategory === "vehicle";
            const severity = getSeverity(r.reason_for_recall, resultCategory);
            const guidance = getGuidance(r.reason_for_recall, resultCategory);
            const cardId = `${r.report_date}-${r.recalling_firm}-${i}`;
            const imageQuery = isVehicle
              ? `${r.classification || ""} ${r.reason_for_recall || ""} ${r.product_description || query}`
              : r.product_description || query;
            const riskLabel = isVehicle ? getVehicleRiskLabel(severity) : `${severity} RISK`;
            const vehicleIssueLabel = isVehicle ? getVehicleIssueLabel(r) : "";
            const officialRecallUrl = getOfficialRecallUrl(r);

            return (
              <motion.div
                key={cardId}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.045 }}
                whileHover={{ scale: 1.008, boxShadow: "0 24px 80px rgba(198,91,69,0.1)" }}
                onViewportEnter={() => logAlert(r, resultCategory)}
                style={{
                  background: "linear-gradient(135deg, rgba(247,243,238,0.055), rgba(247,243,238,0.02))",
                  border: "1px solid rgba(247,243,238,0.08)",
                  padding: "24px",
                  marginBottom: "16px",
                  borderRadius: "20px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(198,91,69,0.14), transparent 32%)", pointerEvents: "none" }} />
                <div style={{ position: "relative" }}>

                  {/* Product image */}
                  <div style={{ position: "relative", width: "100%", height: "210px", borderRadius: "20px", overflow: "hidden", marginBottom: "20px", background: "#111", border: "1px solid rgba(247,243,238,0.07)" }}>
                    <img
                      src={getProductImage(imageQuery, i, resultCategory)}
                      alt={r.product_description || "Product"}
                      style={{ width: "100%", height: "100%", objectFit: "cover", filter: isVehicle ? "brightness(0.68) saturate(0.86)" : "brightness(0.9) saturate(1.05)", transform: "scale(1.02)" }}
                    />
                    <div style={{ position: "absolute", inset: 0, background: isVehicle ? "linear-gradient(90deg, rgba(0,0,0,0.78), rgba(0,0,0,0.22)), linear-gradient(to top, rgba(0,0,0,0.68), rgba(0,0,0,0.04))" : "linear-gradient(to top, rgba(0,0,0,0.48), rgba(0,0,0,0.02))" }} />
                    {!isVehicle && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                        <div style={{ width: "120px", height: "120px", borderRadius: "999px", border: "1px solid rgba(247,243,238,0.18)", boxShadow: "0 0 24px rgba(247,243,238,0.16)", animation: "pulse 3s infinite" }} />
                      </div>
                    )}
                    <div style={{ position: "absolute", top: "14px", left: "14px", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(247,243,238,0.08)", padding: "9px 12px", borderRadius: "14px", color: "#f7f3ee", fontWeight: 800, fontSize: "0.74rem", letterSpacing: "0.04em" }}>
                      {isVehicle ? "NHTSA MATCH" : "SCAN DETECTED"}
                    </div>
                    {isVehicle && (
                      <div style={{ position: "absolute", left: "18px", right: "18px", bottom: "16px", display: "grid", gap: "12px" }}>
                        <div>
                          <p style={{ margin: "0 0 8px", color: "#8fb08f", fontSize: "0.74rem", fontWeight: 900, letterSpacing: "0.12em" }}>VEHICLE RECALL DOSSIER</p>
                          <h4 style={{ margin: 0, fontSize: "1.55rem", lineHeight: 1.1 }}>{shortText(r.product_description || query, 90)}</h4>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
                          {[
                            ["System", vehicleIssueLabel],
                            ["Campaign", r.recall_number || "NHTSA"],
                            ["Next step", "Confirm by VIN"],
                          ].map(([label, value]) => (
                            <div key={label} style={{ padding: "10px 12px", borderRadius: "14px", background: "rgba(0,0,0,0.48)", border: "1px solid rgba(247,243,238,0.1)" }}>
                              <div style={{ color: "rgba(247,243,238,0.45)", fontSize: "0.68rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
                              <div style={{ marginTop: "4px", color: "#f7f3ee", fontWeight: 850, fontSize: "0.86rem" }}>{shortText(value, 34)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Severity badge */}
                  <div style={{
                    display: "inline-flex",
                    background: severity === "HIGH" ? "rgba(255,59,48,0.22)" : severity === "MEDIUM" ? "rgba(217,164,65,0.22)" : "rgba(247,243,238,0.08)",
                    color: severity === "HIGH" ? "#ff3b30" : severity === "MEDIUM" ? "#d9a441" : "rgba(247,243,238,0.55)",
                    padding: "6px 11px", borderRadius: "999px", fontSize: "12px", fontWeight: 900, marginBottom: "12px",
                  }}>
                    ⚠️ {riskLabel}
                  </div>

                  <h3 style={{ fontSize: "1.3rem", lineHeight: 1.35, marginBottom: "12px" }}>
                    {highlight(shortText(r.product_description || "Unknown product", 180), query)}
                  </h3>

                  <p style={{ color: "rgba(247,243,238,0.6)", lineHeight: 1.55, marginBottom: "4px" }}>
                    <strong style={{ color: "#f7f3ee" }}>Reason:</strong>{" "}
                    {highlight(shortText(r.reason_for_recall || "No data", 180), query)}
                  </p>
                  <p style={{ color: "rgba(247,243,238,0.45)", fontSize: "0.92rem" }}>{guidance.label}</p>

                  <RiskIntelligence
                    risk={{
                      riskLevel: severity,
                      contextualLabel: riskLabel,
                      riskQualifier: isVehicle ? "Vehicle matches by year, make, and model should be confirmed with a VIN lookup." : undefined,
                      why: isVehicle
                        ? [
                          "Official NHTSA recall match",
                          `${vehicleIssueLabel} flagged`,
                          "Exact eligibility depends on VIN",
                        ]
                        : [r.reason_for_recall || "Recall hazard detected"],
                      reportedImpact: isVehicle ? "NHTSA recall detected. Injury or incident counts were not found in the available recall summary." : "Official recall detected from government safety source.",
                      recommendedAction: guidance.actions?.[0] || "Review official recall instructions.",
                      confidence: "High",
                      plainEnglishSummary: isVehicle ? "This vehicle may be covered by an official safety campaign. Confirm with VIN before deciding your exact next step." : r.reason_for_recall || "Potential product safety issue detected.",
                    }}
                    loading={false}
                    source={r.source || sourceName(category)}
                    date={formatDate(r.report_date)}
                    sourceContext={isVehicle ? {
                      sourceName: "NHTSA",
                      sourceType: "Official vehicle recall data",
                      sourceUrl: officialRecallUrl,
                      checkedFields: ["year", "make", "model", "campaign number", "component", "summary"],
                      note: "Vehicle recall matches should be confirmed with VIN or license plate lookup.",
                    } : undefined}
                  />

                  <p style={{ color: "rgba(247,243,238,0.45)", marginTop: "18px", marginBottom: "4px" }}>
                    <strong style={{ color: "rgba(247,243,238,0.7)" }}>Company:</strong> {r.recalling_firm || "Unknown"}
                  </p>
                  <p style={{ color: "rgba(247,243,238,0.32)", marginTop: 0 }}>
                    <strong>Date:</strong> {formatDate(r.report_date)}
                  </p>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
                    <button
                      onClick={() => openPremiumModal(r.product_description)}
                      style={{ padding: "13px 17px", borderRadius: "13px", background: "#c65b45", border: "none", color: "#fbf1ec", fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      🛡 {isVehicle ? "Save vehicle alerts" : "Protect me from this in the future"}
                    </button>
                    {isVehicle && (
                      <a
                        href={officialRecallUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ padding: "13px 17px", borderRadius: "13px", background: "rgba(92,138,92,0.14)", border: "1px solid rgba(92,138,92,0.28)", color: "#9bc39b", fontWeight: 900, textDecoration: "none" }}
                      >
                        Check VIN on NHTSA
                      </a>
                    )}
                    <button
                      onClick={() => shareRecall(r)}
                      style={{ padding: "13px 17px", borderRadius: "13px", background: "rgba(247,243,238,0.06)", border: "1px solid rgba(247,243,238,0.11)", color: "rgba(247,243,238,0.85)", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      🔗 Share this recall
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>

        <footer style={{ color: "rgba(247,243,238,0.24)", textAlign: "center", margin: "60px 0 28px", fontSize: "0.82rem", borderTop: "1px solid rgba(247,243,238,0.06)", paddingTop: "28px" }}>
          RecallRadar is not affiliated with FDA, CPSC, or NHTSA. Official data is provided as-is.
        </footer>
      </div>

      {/* ─── PREMIUM MODAL ─── */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closePremiumModal}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 100 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 18 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: "520px", background: "linear-gradient(135deg, rgba(18,16,15,0.99), rgba(9,8,7,0.99))", border: "1px solid rgba(247,243,238,0.11)", borderRadius: "24px", padding: "28px", boxShadow: "0 40px 120px rgba(0,0,0,0.7)" }}
            >
              {!joined ? (
                <>
                  <p style={{ color: "#e4a396", fontWeight: 900, letterSpacing: "0.08em", fontSize: "0.76rem", margin: 0 }}>PREMIUM MONITORING</p>
                  <h2 style={{ margin: "12px 0", fontSize: "2rem", color: "#f7f3ee" }}>Never miss a dangerous recall.</h2>
                  <p style={{ color: "rgba(247,243,238,0.55)", lineHeight: 1.6 }}>Join early access and we'll notify you when monitoring opens for products like:</p>
                  <div style={{ background: "rgba(247,243,238,0.06)", border: "1px solid rgba(247,243,238,0.08)", borderRadius: "16px", padding: "14px", color: "#f7f3ee", margin: "16px 0" }}>
                    {shortText(selectedProduct, 100)}
                  </div>
                  <input
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email" type="email"
                    style={{ width: "100%", boxSizing: "border-box", padding: "15px", borderRadius: "14px", border: "1px solid rgba(247,243,238,0.11)", background: "#070707", color: "#f7f3ee", outline: "none", fontSize: "1rem", fontFamily: "inherit" }}
                  />
                  <button onClick={joinWaitlist} style={{ width: "100%", marginTop: "12px", padding: "15px", borderRadius: "14px", background: "#c65b45", color: "#fbf1ec", border: "none", fontWeight: 900, cursor: "pointer", fontSize: "1rem", fontFamily: "inherit" }}>
                    Join early access
                  </button>
                  <button onClick={closePremiumModal} style={{ width: "100%", marginTop: "10px", padding: "12px", borderRadius: "14px", background: "transparent", color: "rgba(247,243,238,0.4)", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    Maybe later
                  </button>
                </>
              ) : (
                <>
                  <h2 style={{ margin: "0 0 12px", fontSize: "2rem", color: "#f7f3ee" }}>You're on the list.</h2>
                  <p style={{ color: "rgba(247,243,238,0.55)", lineHeight: 1.6 }}>Your email has been saved. We'll notify you when premium monitoring opens.</p>
                  <button onClick={closePremiumModal} style={{ width: "100%", marginTop: "12px", padding: "15px", borderRadius: "14px", background: "#f7f3ee", color: "#0c0b0a", border: "none", fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>
                    Continue exploring
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── BARCODE SCANNER ─── */}
      {showScanner && (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onResult={(value: string) => {
            setQuery(value);
            setShowScanner(false);
            setTimeout(() => searchRecalls(value), 150);
          }}
        />
      )}

      {/* ─── HISTORY DRAWER ─── */}
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

      <style>{`
        .app-nav-logo {
          display: block;
          width: 100%;
          height: 100%;
          overflow: visible;
        }
      `}</style>
    </div>
  );
}
