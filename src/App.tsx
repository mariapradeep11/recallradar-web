import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Category = "food" | "drug" | "device";
type Severity = "LOW" | "MEDIUM" | "HIGH";

type Recall = {
  product_description?: string;
  reason_for_recall?: string;
  recalling_firm?: string;
  report_date?: string;
};

const endpoints: Record<Category, string> = {
  food: "https://api.fda.gov/food/enforcement.json",
  drug: "https://api.fda.gov/drug/enforcement.json",
  device: "https://api.fda.gov/device/enforcement.json",
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
    normalized.includes("contamination")
  ) {
    return "HIGH";
  }

  if (
    normalized.includes("undeclared") ||
    normalized.includes("allergen") ||
    normalized.includes("metal") ||
    normalized.includes("glass") ||
    normalized.includes("chemical")
  ) {
    return "MEDIUM";
  }

  return "LOW";
};

const formatDate = (date?: string) => {
  if (!date || date.length !== 8) return "N/A";
  return `${date.slice(4, 6)}/${date.slice(6, 8)}/${date.slice(0, 4)}`;
};

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

  const searchRecalls = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const url = `${endpoints[category]}?search=${encodedQuery}&limit=10`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setResults([]);
        setError(
          "No matching recalls found. Try a broader search like milk, chicken, Tylenol, or cheese."
        );
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          product: selectedProduct || "",
          category,
          search_query: query || "",
          source: "premium_modal",
          timestamp: new Date().toISOString(),
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Sheet.best error:", res.status, errorText);
      alert(`Could not save email. Error ${res.status}: ${errorText}`);
      return;
    }

    setJoined(true);
  } catch (err) {
    console.error(err);
    alert("Could not save your email. Please try again.");
  }
};

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #2a0f0f 0%, #0b0b0b 38%, #050505 100%)",
        color: "#fff",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "2rem",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ maxWidth: "980px", margin: "auto" }}
      >
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <p
            style={{
              display: "inline-block",
              border: "1px solid #3a3a3a",
              borderRadius: "999px",
              padding: "6px 12px",
              color: "#bbb",
              fontSize: "0.85rem",
              marginBottom: "14px",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Consumer safety intelligence for everyday products
          </p>

          <h1
            style={{
              fontSize: "clamp(3rem, 8vw, 5.8rem)",
              lineHeight: 0.95,
              margin: 0,
              letterSpacing: "-0.08em",
            }}
          >
            RecallRadar
          </h1>

          <p
            style={{
              color: "#aaa",
              fontSize: "1.15rem",
              maxWidth: "680px",
              margin: "20px auto 0",
              lineHeight: 1.6,
            }}
          >
            Search food, drugs, and medical devices. Instantly see if something
            you bought, eat, or use has been recalled.
          </p>
        </div>

        <div
          style={{
            marginTop: "34px",
            background: "rgba(17,17,17,0.82)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "24px",
            padding: "22px",
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {(["food", "drug", "device"] as Category[]).map((c) => (
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
                  border:
                    category === c
                      ? "1px solid #fff"
                      : "1px solid rgba(255,255,255,0.12)",
                  background: category === c ? "#fff" : "transparent",
                  color: category === c ? "#000" : "#aaa",
                  cursor: "pointer",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchRecalls();
              }}
              placeholder="Search product, brand, ingredient..."
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "#080808",
                color: "#fff",
                outline: "none",
                fontSize: "1rem",
              }}
            />

            <button
              onClick={searchRecalls}
              style={{
                padding: "16px 24px",
                borderRadius: "14px",
                background: "#fff",
                color: "#000",
                border: "none",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "14px",
              color: "#777",
              fontSize: "0.9rem",
            }}
          >
            <span>Try:</span>
            {["milk", "chicken", "cheese", "Tylenol", "syringe"].map((item) => (
              <button
                key={item}
                onClick={() => setQuery(item)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#bbb",
                  borderRadius: "999px",
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ color: "#ff8a80", marginTop: "20px", textAlign: "center" }}>
            {error}
          </p>
        )}

        {!loading && searched && !error && results.length === 0 && (
          <p style={{ color: "#888", marginTop: "24px", textAlign: "center" }}>
            No recalls found. Try a broader product or brand name.
          </p>
        )}

        <div style={{ marginTop: "30px" }}>
          {results.map((r, i) => {
            const severity = getSeverity(r.reason_for_recall);

            return (
              <motion.div
                key={`${r.report_date}-${r.recalling_firm}-${i}`}
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
                  padding: "22px",
                  marginBottom: "16px",
                  borderRadius: "18px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(circle at top right, rgba(255,59,48,0.16), transparent 32%)",
                    pointerEvents: "none",
                  }}
                />

                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
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
                      padding: "5px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 800,
                      marginBottom: "12px",
                    }}
                  >
                    ⚠️ {severity} RISK
                  </div>

                  <h3
                    style={{
                      fontSize: "1.25rem",
                      lineHeight: 1.35,
                      margin: "0 0 12px",
                    }}
                  >
                    {highlight(
                      shortText(r.product_description || "Unknown product", 180),
                      query
                    )}
                  </h3>

                  <p style={{ color: "#bbb", lineHeight: 1.55 }}>
                    <strong style={{ color: "#fff" }}>Reason:</strong>{" "}
                    {highlight(
                      shortText(r.reason_for_recall || "No data", 180),
                      query
                    )}
                  </p>

                  <p style={{ color: "#999", fontSize: "0.9rem" }}>
                    {severity === "HIGH"
                      ? "This may pose serious health risks. Avoid using or consuming immediately."
                      : severity === "MEDIUM"
                        ? "This may affect sensitive individuals such as those with allergies."
                        : "Low-risk recall, but still worth checking if you’ve used this product."}
                  </p>

                  <p style={{ color: "#888", marginBottom: 4 }}>
                    <strong style={{ color: "#ccc" }}>Company:</strong>{" "}
                    {r.recalling_firm || "Unknown"}
                  </p>

                  <p style={{ color: "#666", marginTop: 0 }}>
                    <strong>Date:</strong> {formatDate(r.report_date)}
                  </p>

                  <button
                    onClick={() => openPremiumModal(r.product_description)}
                    style={{
                      marginTop: "12px",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      background: "#ff3b30",
                      border: "none",
                      color: "#fff",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    🛡 Protect me from this in the future
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
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
                      fontWeight: 800,
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
                    Join early access and we’ll notify you when monitoring opens
                    for products like:
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
                    This is the monetization signal we needed. Next step is saving
                    this email somewhere real.
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
    </div>
  );
}