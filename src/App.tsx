import { Suspense, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RiskIntelligence from "./RiskIntelligence";
import BarcodeScanner from "./BarcodeScanner";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import PhotoHero from "./PhotoHero.jsx";
import FloatingPhotos from "./FloatingPhotos.jsx";



type Category = "food" | "drug" | "device" | "consumer";
type Severity = "LOW" | "MEDIUM" | "HIGH";

type Recall = {
  product_description?: string;
  reason_for_recall?: string;
  recalling_firm?: string;
  report_date?: string;
};

const endpoints: Record<Exclude<Category, "consumer">, string> = {
  food: "https://api.fda.gov/food/enforcement.json",
  drug: "https://api.fda.gov/drug/enforcement.json",
  device: "https://api.fda.gov/device/enforcement.json",
};

const categoryLabels: Record<Category, string> = {
  food: "Food",
  drug: "Medicine",
  device: "Medical Devices",
  consumer: "Consumer Products",
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

const getProductImage = (description = "", index = 0) => {
  const text = description.toLowerCase();

  if (text.includes("chicken")) {
    return productImages.chicken[index % productImages.chicken.length];
  }

  if (text.includes("milk")) {
    return productImages.milk[index % productImages.milk.length];
  }

  return "/images/chicken/chicken-01.jpg";
};

const linkCardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  textDecoration: "none",
  color: "#fff",
  background: "rgba(255,255,255,0.02)",
};

const subtleText: CSSProperties = {
  fontSize: "12px",
  color: "#888",
  marginTop: "2px",
};

const arrowStyle: CSSProperties = {
  color: "#ff3b30",
};

const shortText = (text?: string, limit = 140) =>
  text && text.length > limit ? text.slice(0, limit).trim() + "..." : text || "";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlight = (text = "", query: string) => {
  if (!query.trim()) return text;

  const safeQuery = escapeRegex(query.trim());
  const regex = new RegExp(`(${safeQuery})`, "gi");

  return text.split(regex).map((part, i) =>
    part.toLowerCase() === query.trim().toLowerCase() ? (
      <span
        key={i}
        style={{
          background: "#ff3b30",
          color: "#fff",
          padding: "2px 5px",
          borderRadius: "5px",
        }}
      >
        {part}
      </span>
    ) : (
      part
    )
  );
};

const getSeverity = (reason?: string): Severity => {
  if (!reason) return "LOW";
  const normalized = reason.toLowerCase();

  if (
    normalized.includes("listeria") ||
    normalized.includes("salmonella") ||
    normalized.includes("death") ||
    normalized.includes("seizure") ||
    normalized.includes("contamination") ||
    normalized.includes("serious injury")
  ) {
    return "HIGH";
  }

  if (
    normalized.includes("undeclared") ||
    normalized.includes("allergen") ||
    normalized.includes("metal") ||
    normalized.includes("glass") ||
    normalized.includes("chemical") ||
    normalized.includes("fall") ||
    normalized.includes("burn")
  ) {
    return "MEDIUM";
  }

  return "LOW";
};

const getGuidance = (reason = "") => {
  const r = reason.toLowerCase();

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
  if (!date || date.length !== 8) return "N/A";
  return `${date.slice(4, 6)}/${date.slice(6, 8)}/${date.slice(0, 4)}`;
};

function RecallOrb() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.35;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.18;
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.9}>
        <mesh>
          <icosahedronGeometry args={[1.4, 2]} />
          <meshStandardMaterial
            color="#ff3b30"
            emissive="#7a0f0a"
            roughness={0.25}
            metalness={0.65}
          />
        </mesh>

        <mesh scale={1.22}>
          <icosahedronGeometry args={[1.4, 1]} />
          <meshBasicMaterial color="#ff3b30" wireframe transparent opacity={0.22} />
        </mesh>

        <mesh scale={1.65}>
          <sphereGeometry args={[1.4, 32, 32]} />
          <meshBasicMaterial color="#ff3b30" transparent opacity={0.06} />
        </mesh>
      </Float>
    </group>
  );
}

function ThreeHero() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.9,
      }}
    >
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <pointLight position={[4, 4, 4]} intensity={2.4} color="#ffb3ad" />
          <pointLight position={[-4, -2, 3]} intensity={1.4} color="#ffffff" />
          <Stars radius={80} depth={40} count={900} factor={3} saturation={0} fade />
          <group position={[0, 0.2, 0]}>
            <RecallOrb />
          </group>
          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default function App() {
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
  const [expandedWhy, setExpandedWhy] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const searchRecalls = async (overrideQuery?: string) => {
    const searchTerm = overrideQuery || query;
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);
    setResults([]);

    if (category === "consumer") {
      setLoading(false);
      return;
    }

    try {
      const encodedQuery = encodeURIComponent(searchTerm.trim());
      const url = `${endpoints[category]}?search=${encodedQuery}&limit=10`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setResults([]);
        setError("");
        return;
      }

      setResults(data.results || []);
    } catch (err) {
      console.error(err);
      setResults([]);
      setError("Something went wrong while searching recalls.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedQuery = params.get("q");

    if (sharedQuery) {
      setQuery(sharedQuery);
      setTimeout(() => searchRecalls(sharedQuery), 250);
    }
  }, []);

  const buildShareUrl = (recall: Recall) => {
    const params = new URLSearchParams({
      q: query || recall.product_description || "",
      product: recall.product_description || "",
    });

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const shareRecall = async (recall: Recall) => {
    const url = buildShareUrl(recall);

    const text = `⚠️ Recall Alert

Product: ${shortText(recall.product_description, 180)}

Reason: ${shortText(recall.reason_for_recall, 180)}

Check it on RecallRadar:
${url}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Recall Alert", text, url });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(recall.product_description || "recall");
        setTimeout(() => setCopied(""), 1800);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const openPremiumModal = (product?: string) => {
    setSelectedProduct(product || query || "this product");
    setJoined(false);
  };

  const closePremiumModal = () => {
    setSelectedProduct("");
    setEmail("");
    setJoined(false);
  };

  const joinWaitlist = async () => {
    if (!email.trim() || !isValidEmail(email)) {
      alert("Enter a valid email");
      return;
    }

    try {
      const res = await fetch(
        "https://api.sheetbest.com/sheets/a5c4ecd4-7684-48f7-9cd0-8ccf090c0b7a",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            product: selectedProduct,
            category,
            search_query: query,
            source: "premium_modal",
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Sheet.best error:", res.status, errorText);
        alert(`Could not save email. Error ${res.status}`);
        return;
      }

      setJoined(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #351010 0%, #0b0b0b 38%, #050505 100%)",
        color: "#fff",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(0.9); opacity: 0.65; }
            50% { transform: scale(1.08); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.65; }
          }
        `}
      </style>

      {searched && (
        <PhotoHero query={query} category={category} hasResults={results.length > 0} isSearching={loading} />
      )}
      {!searched && <ThreeHero />}

      {searched && (
        <PhotoHero query={query} category={category} hasResults={results.length > 0} isSearching={loading} />
      )}
      {!searched && <ThreeHero />}
      <FloatingPhotos query={query} category={category} visible={searched && results.length > 0} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(5,5,5,0.08), rgba(5,5,5,0.78) 58%, #050505 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ maxWidth: "1080px", margin: "auto", position: "relative", zIndex: 2 }}
      >
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "58px",
          }}
        >
          <strong style={{ fontSize: "1.1rem" }}>RecallRadar</strong>
          <button
            onClick={() => openPremiumModal("early access monitoring")}
            style={{
              padding: "10px 14px",
              borderRadius: "999px",
              background: "#fff",
              color: "#000",
              border: "none",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Join early access
          </button>
        </nav>

        <section style={{ textAlign: "center", minHeight: "520px" }}>
          <p
            style={{
              display: "inline-block",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "999px",
              padding: "7px 13px",
              color: "#ddd",
              fontSize: "0.85rem",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(12px)",
            }}
          >
            Consumer safety intelligence for everyday products
          </p>

          <h1
            style={{
              fontSize: "clamp(3.4rem, 9vw, 7rem)",
              lineHeight: 0.92,
              margin: "210px 0 0",
              letterSpacing: "-0.085em",
              textShadow: "0 30px 100px rgba(255,59,48,0.22)",
            }}
          >
            Know before
            <br />
            it hurts you.
          </h1>

          <p
            style={{
              color: "#c8c8c8",
              fontSize: "1.25rem",
              maxWidth: "760px",
              margin: "24px auto 0",
              lineHeight: 1.65,
            }}
          >
            RecallRadar helps you search food, drugs, and medical devices — then
            monitors the products you care about before a recall becomes your problem.
          </p>
        </section>

<PhotoHero query={query} category={category} hasResults={results.length > 0} isSearching={loading} />
        <section
          style={{
            marginTop: "-70px",
            background: "rgba(17,17,17,0.84)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "28px",
            padding: "24px",
            boxShadow: "0 35px 100px rgba(0,0,0,0.5)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
            {(["food", "drug", "device", "consumer"] as Category[]).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCategory(c);
                  setResults([]);
                  setSearched(false);
                  setError("");
                }}
                style={{
                  padding: "9px 16px",
                  borderRadius: "999px",
                  border: category === c ? "1px solid #fff" : "1px solid rgba(255,255,255,0.12)",
                  background: category === c ? "#fff" : "transparent",
                  color: category === c ? "#000" : "#aaa",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                {categoryLabels[c]}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              title="Scan barcode"
              style={{
                width: "54px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,59,48,0.14)",
                color: "#fff",
                fontSize: "1.2rem",
                cursor: "pointer",
              }}
            >
              📷
            </button>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchRecalls();
              }}
              placeholder="Search product, brand, ingredient..."
              style={{
                flex: 1,
                padding: "17px",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "#080808",
                color: "#fff",
                outline: "none",
                fontSize: "1rem",
              }}
            />

            <button
              onClick={() => searchRecalls()}
              style={{
                padding: "17px 26px",
                borderRadius: "16px",
                background: "#fff",
                color: "#000",
                border: "none",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          <p style={{ color: "#777", fontSize: "0.85rem", marginTop: "12px" }}>
            🔒 Join early access to monitor products and get future safety alerts.
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px", color: "#777" }}>
            <span>Try:</span>
            {["milk", "chicken", "Tylenol", "syringe", "toddler stool", "air fryer"].map((item) => (
              <button
                key={item}
                onClick={() => setQuery(item)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#bbb",
                  borderRadius: "999px",
                  padding: "5px 11px",
                  cursor: "pointer",
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <p style={{ color: "#ff8a80", marginTop: "20px", textAlign: "center" }}>
            {error}
          </p>
        )}

        {copied && (
          <p style={{ color: "#a7f3d0", marginTop: "20px", textAlign: "center", fontWeight: 800 }}>
            Link copied to clipboard.
          </p>
        )}

        {!loading && searched && results.length === 0 && (
          <section
            style={{
              marginTop: "30px",
              padding: "24px",
              borderRadius: "20px",
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(10px)",
            }}
          >
            <p style={{ color: "#ffb4ae", fontSize: "12px", marginBottom: "10px", fontWeight: 900 }}>
              BROADER SAFETY SIGNALS
            </p>

            <h3 style={{ marginBottom: "10px" }}>
              {category === "consumer"
                ? "Checking real-world safety signals"
                : "No FDA match — expanding your search"}
            </h3>

            <p style={{ color: "#aaa", lineHeight: 1.6 }}>
              {category === "consumer"
                ? "Consumer product risks often appear in recalls, news reports, and manufacturer notices before centralized databases catch up."
                : "This product may still have safety risks. Check official consumer-product, news, and manufacturer sources below."}
            </p>

            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <a
                href={`https://www.cpsc.gov/Recalls?search=${encodeURIComponent(query)}`}
                target="_blank"
                rel="noreferrer"
                style={linkCardStyle}
              >
                <div>
                  <strong>Consumer Product Safety</strong>
                  <p style={subtleText}>Official CPSC recall database</p>
                </div>
                <span style={arrowStyle}>→</span>
              </a>

              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(query + " recall news")}&tbm=nws`}
                target="_blank"
                rel="noreferrer"
                style={linkCardStyle}
              >
                <div>
                  <strong>Latest recall news</strong>
                  <p style={subtleText}>Recent reports, incidents, and public safety coverage</p>
                </div>
                <span style={arrowStyle}>→</span>
              </a>

              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(query + " manufacturer recall")}`}
                target="_blank"
                rel="noreferrer"
                style={linkCardStyle}
              >
                <div>
                  <strong>Manufacturer notices</strong>
                  <p style={subtleText}>Company-issued recall and return information</p>
                </div>
                <span style={arrowStyle}>→</span>
              </a>
            </div>
          </section>
        )}

        <section style={{ marginTop: "30px" }}>
          {results.map((r, i) => {
            const severity = getSeverity(r.reason_for_recall);
            const guidance = getGuidance(r.reason_for_recall);
            const cardId = `${r.report_date}-${r.recalling_firm}-${i}`;
            const isExpanded = expandedWhy === cardId;

            return (
              <motion.div
                key={cardId}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.045 }}
                whileHover={{
                  scale: 1.015,
                  boxShadow: "0 24px 80px rgba(255,59,48,0.12)",
                }}
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
                  border: "1px solid rgba(255,255,255,0.09)",
                  padding: "24px",
                  marginBottom: "16px",
                  borderRadius: "20px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(circle at top right, rgba(255,59,48,0.16), transparent 32%)",
                    pointerEvents: "none",
                  }}
                />

                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "210px",
                      borderRadius: "20px",
                      overflow: "hidden",
                      marginBottom: "20px",
                      background: "#111",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <img
                      src={getProductImage(r.product_description, i)}
                      alt={r.product_description || "Product image"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: "brightness(0.9) saturate(1.05)",
                        transform: "scale(1.02)",
                      }}
                    />

                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.48), rgba(0,0,0,0.02))",
                      }}
                    />

                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          width: "120px",
                          height: "120px",
                          borderRadius: "999px",
                          border: "1px solid rgba(255,255,255,0.18)",
                          boxShadow: "0 0 24px rgba(255,255,255,0.16)",
                          animation: "pulse 3s infinite",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        top: "14px",
                        left: "14px",
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        padding: "9px 12px",
                        borderRadius: "14px",
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        letterSpacing: "0.03em",
                      }}
                    >
                      SCAN DETECTED
                    </div>
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      background:
                        severity === "HIGH"
                          ? "rgba(255,59,48,0.25)"
                          : severity === "MEDIUM"
                            ? "rgba(255,149,0,0.25)"
                            : "rgba(255,255,255,0.1)",
                      color:
                        severity === "HIGH"
                          ? "#ff3b30"
                          : severity === "MEDIUM"
                            ? "#ff9500"
                            : "#aaa",
                      padding: "6px 11px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 900,
                      marginBottom: "12px",
                    }}
                  >
                    ⚠️ {severity} RISK
                  </div>

                  <h3 style={{ fontSize: "1.35rem", lineHeight: 1.35, margin: "0 0 12px" }}>
                    {highlight(shortText(r.product_description || "Unknown product", 180), query)}
                  </h3>

                  <p style={{ color: "#bbb", lineHeight: 1.55 }}>
                    <strong style={{ color: "#fff" }}>Reason:</strong>{" "}
                    {highlight(shortText(r.reason_for_recall || "No data", 180), query)}
                  </p>

                  <p style={{ color: "#999", fontSize: "0.92rem" }}>{guidance.label}</p>

                  <RiskIntelligence
                    risk={{
                      riskLevel: severity,
                      why: [r.reason_for_recall || "Recall hazard detected"],
                      reportedImpact:
                        "Official recall detected from government safety source.",
                      recommendedAction:
                        guidance.actions?.[0] || "Review official recall instructions.",
                      confidence: "High",
                      plainEnglishSummary:
                        r.reason_for_recall || "Potential product safety issue detected.",
                    }}
                    loading={false}
                    source="FDA"
                    date={formatDate(r.report_date)}
                  />

                  <div
                    style={{
                      marginTop: "18px",
                      padding: "18px",
                      borderRadius: "18px",
                      background: "rgba(0,0,0,0.28)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      textAlign: "left",
                    }}
                  >
                    <strong style={{ display: "block", marginBottom: "12px" }}>
                      🧭 What should I do?
                    </strong>

                    <div style={{ display: "grid", gap: "10px" }}>
                      {guidance.actions.map((action, index) => (
                        <motion.div
                          key={action}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "12px",
                            background: "rgba(255,255,255,0.045)",
                            color: "#ddd",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          {action}
                        </motion.div>
                      ))}
                    </div>

                    <button
                      onClick={() => setExpandedWhy(isExpanded ? null : cardId)}
                      style={{
                        marginTop: "14px",
                        padding: "10px 12px",
                        borderRadius: "12px",
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.14)",
                        color: "#ddd",
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                    >
                      {isExpanded ? "Hide explanation" : "Why is this dangerous?"}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ overflow: "hidden" }}
                        >
                          <p style={{ color: "#aaa", lineHeight: 1.6, marginTop: "12px" }}>
                            This guidance is based on the recall reason:{" "}
                            <strong style={{ color: "#fff" }}>
                              {r.reason_for_recall || "No reason provided."}
                            </strong>
                          </p>

                          <p style={{ color: "#888", lineHeight: 1.6 }}>
                            For return or refund details, check the store where you purchased it
                            or contact the recalling company.
                          </p>

                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(
                              `${r.recalling_firm || ""} recall contact return refund`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#ffb4ae", fontWeight: 800 }}
                          >
                            Find return/contact info →
                          </a>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <p style={{ color: "#888", marginBottom: 4, marginTop: "16px" }}>
                    <strong style={{ color: "#ccc" }}>Company:</strong>{" "}
                    {r.recalling_firm || "Unknown"}
                  </p>

                  <p style={{ color: "#666", marginTop: 0 }}>
                    <strong>Date:</strong> {formatDate(r.report_date)}
                  </p>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                    <button
                      onClick={() => openPremiumModal(r.product_description)}
                      style={{
                        padding: "13px 17px",
                        borderRadius: "13px",
                        background: "#ff3b30",
                        border: "none",
                        color: "#fff",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      🛡 Protect me from this in the future
                    </button>

                    <button
                      onClick={() => shareRecall(r)}
                      style={{
                        padding: "13px 17px",
                        borderRadius: "13px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#ddd",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      🔗 Share this recall
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

      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePremiumModal}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.72)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 100,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 18 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "520px",
                background:
                  "linear-gradient(135deg, rgba(26,26,26,0.98), rgba(12,12,12,0.98))",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "24px",
                padding: "28px",
                boxShadow: "0 40px 120px rgba(0,0,0,0.7)",
              }}
            >
              {!joined ? (
                <>
                  <p
                    style={{
                      color: "#ff8a80",
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      fontSize: "0.78rem",
                      margin: 0,
                    }}
                  >
                    PREMIUM MONITORING
                  </p>

                  <h2 style={{ margin: "12px 0", fontSize: "2rem" }}>
                    Never miss a dangerous recall.
                  </h2>

                  <p style={{ color: "#aaa", lineHeight: 1.6 }}>
                    Join early access and we’ll notify you when monitoring opens for products like:
                  </p>

                  <div
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "16px",
                      padding: "14px",
                      color: "#fff",
                      margin: "16px 0",
                    }}
                  >
                    {shortText(selectedProduct, 100)}
                  </div>

                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    type="email"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "15px",
                      borderRadius: "14px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "#070707",
                      color: "#fff",
                      outline: "none",
                      fontSize: "1rem",
                    }}
                  />

                  <button
                    onClick={joinWaitlist}
                    style={{
                      width: "100%",
                      marginTop: "12px",
                      padding: "15px",
                      borderRadius: "14px",
                      background: "#ff3b30",
                      color: "#fff",
                      border: "none",
                      fontWeight: 900,
                      cursor: "pointer",
                      fontSize: "1rem",
                    }}
                  >
                    Join early access
                  </button>

                  <button
                    onClick={closePremiumModal}
                    style={{
                      width: "100%",
                      marginTop: "10px",
                      padding: "12px",
                      borderRadius: "14px",
                      background: "transparent",
                      color: "#888",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Maybe later
                  </button>
                </>
              ) : (
                <>
                  <h2 style={{ margin: "0 0 12px", fontSize: "2rem" }}>
                    You’re on the list.
                  </h2>
                  <p style={{ color: "#aaa", lineHeight: 1.6 }}>
                    Your email has been saved. We’ll notify you when premium monitoring opens.
                  </p>
                  <button
                    onClick={closePremiumModal}
                    style={{
                      width: "100%",
                      marginTop: "12px",
                      padding: "15px",
                      borderRadius: "14px",
                      background: "#fff",
                      color: "#000",
                      border: "none",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Continue exploring
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
}