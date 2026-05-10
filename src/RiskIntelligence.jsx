import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const riskColors = {
  HIGH: {
    bg: "rgba(255,59,48,0.16)",
    color: "#ff6b60",
    border: "rgba(255,59,48,0.32)",
    glow: "rgba(255,59,48,0.12)",
  },
  MEDIUM: {
    bg: "rgba(255,149,0,0.15)",
    color: "#ffb14a",
    border: "rgba(255,149,0,0.28)",
    glow: "rgba(255,149,0,0.08)",
  },
  LOW: {
    bg: "rgba(255,255,255,0.06)",
    color: "#aaa",
    border: "rgba(255,255,255,0.12)",
    glow: "rgba(255,255,255,0.03)",
  },
};

function buildActionSteps(risk) {
  const text = `${risk?.recommendedAction || ""}`.toLowerCase();

  if (text.includes("stop")) {
    return [
      "Stop using the product immediately",
      "Keep it away from children and family members",
      "Verify your exact product or batch details",
      risk.recommendedAction,
    ];
  }

  if (text.includes("repair")) {
    return [
      "Verify your exact affected product",
      "Contact the manufacturer or dealer",
      "Schedule repair or replacement instructions",
      risk.recommendedAction,
    ];
  }

  return [
    "Review official recall details carefully",
    "Verify product identifiers and batch details",
    "Avoid using the product until confirmed safe",
    risk.recommendedAction,
  ];
}

export default function RiskIntelligence({
  risk,
  loading,
  source,
  date,
}) {
  const [open, setOpen] = useState(true);

  if (loading) {
    return (
      <div
        style={{
          marginTop: "14px",
          padding: "14px 16px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.045)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#aaa",
          fontWeight: 800,
        }}
      >
        🧠 RecallRadar is analyzing safety risk…
      </div>
    );
  }

  if (!risk) return null;

  const theme = riskColors[risk.riskLevel] || riskColors.LOW;
  const actionSteps = buildActionSteps(risk);

  return (
    <div
      style={{
        marginTop: "16px",
        border: `1px solid ${theme.border}`,
        background: "rgba(14,14,16,0.92)",
        borderRadius: "22px",
        overflow: "hidden",
        boxShadow: `0 24px 80px ${theme.glow}`,
        backdropFilter: "blur(16px)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          color: "#fff",
          padding: "18px 18px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          textAlign: "left",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: theme.bg,
              color: theme.color,
              border: `1px solid ${theme.border}`,
              padding: "7px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 900,
              marginBottom: "10px",
            }}
          >
            ⚠️ {risk.riskLevel} RISK
          </div>

          <div style={{ fontWeight: 900, fontSize: "1.05rem" }}>
            Why RecallRadar flagged this
          </div>

          <div
            style={{
              color: "#8a8a8f",
              fontSize: "0.82rem",
              marginTop: "4px",
            }}
          >
            AI-assisted safety analysis based on official recall details
          </div>

          {(source || date) && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "10px",
                fontSize: "0.78rem",
                color: "#9a9aa1",
              }}
            >
              {source && <span>✔ Verified source: {source}</span>}
              {date && <span>📅 {date}</span>}
            </div>
          )}
        </div>

        <span style={{ color: "#aaa", fontSize: "1.1rem" }}>
          {open ? "−" : "+"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "0 18px 18px",
                display: "grid",
                gap: "16px",
              }}
            >
              <div>
                <strong style={{ display: "block", marginBottom: "10px" }}>
                  Severity drivers
                </strong>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  {(risk.why || []).map((reason) => (
                    <div
                      key={reason}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.055)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#e5e5e5",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                      }}
                    >
                      ⚠️ {reason}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.045)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      color: "#888",
                      fontSize: "0.76rem",
                      fontWeight: 900,
                      marginBottom: "7px",
                    }}
                  >
                    REPORTED IMPACT
                  </div>

                  <div style={{ color: "#fff", lineHeight: 1.5 }}>
                    {risk.reportedImpact}
                  </div>
                </div>

                <div
                  style={{
                    padding: "14px",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.045)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      color: "#888",
                      fontSize: "0.76rem",
                      fontWeight: 900,
                      marginBottom: "7px",
                    }}
                  >
                    CONFIDENCE
                  </div>

                  <div style={{ color: "#fff", lineHeight: 1.5 }}>
                    {risk.confidence} confidence
                  </div>

                  <div
                    style={{
                      marginTop: "8px",
                      color: "#888",
                      fontSize: "0.78rem",
                      lineHeight: 1.45,
                    }}
                  >
                    Based on official recall language and detected hazard severity.
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background: theme.bg,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div
                  style={{
                    color: theme.color,
                    fontWeight: 900,
                    marginBottom: "12px",
                  }}
                >
                  Recommended next steps
                </div>

                <div style={{ display: "grid", gap: "10px" }}>
                  {actionSteps.map((step, idx) => (
                    <div
                      key={step}
                      style={{
                        padding: "11px 12px",
                        borderRadius: "13px",
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        color: "#f1f1f1",
                        lineHeight: 1.45,
                      }}
                    >
                      <strong style={{ color: theme.color }}>
                        {idx + 1}.
                      </strong>{" "}
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {risk.plainEnglishSummary && (
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      color: "#888",
                      fontSize: "0.76rem",
                      fontWeight: 900,
                      marginBottom: "8px",
                    }}
                  >
                    SUMMARY
                  </div>

                  <p
                    style={{
                      color: "#bbb",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {risk.plainEnglishSummary}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}