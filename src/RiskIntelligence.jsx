import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const riskColors = {
  HIGH: {
    bg: "rgba(255,59,48,0.22)",
    color: "#ff6b60",
    border: "rgba(255,59,48,0.35)",
  },
  MEDIUM: {
    bg: "rgba(255,149,0,0.2)",
    color: "#ffb14a",
    border: "rgba(255,149,0,0.35)",
  },
  LOW: {
    bg: "rgba(255,255,255,0.08)",
    color: "#aaa",
    border: "rgba(255,255,255,0.12)",
  },
};

export default function RiskIntelligence({ risk, loading }) {
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        marginTop: "14px",
        padding: "14px 16px",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.045)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#aaa",
        fontWeight: 800,
      }}>
        🧠 RecallRadar is analyzing safety risk…
      </div>
    );
  }

  if (!risk) return null;

  const theme = riskColors[risk.riskLevel] || riskColors.LOW;

  return (
    <div style={{
      marginTop: "14px",
      border: `1px solid ${theme.border}`,
      background: "rgba(0,0,0,0.24)",
      borderRadius: "18px",
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          color: "#fff",
          padding: "14px 16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          textAlign: "left",
        }}
      >
        <div>
          <div style={{
            display: "inline-flex",
            background: theme.bg,
            color: theme.color,
            border: `1px solid ${theme.border}`,
            padding: "6px 11px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 900,
            marginBottom: "8px",
          }}>
            ⚠️ {risk.riskLevel} RISK
          </div>

          <div style={{ fontWeight: 900, fontSize: "1rem" }}>
            Why RecallRadar flagged this
          </div>

          <div style={{ color: "#888", fontSize: "0.82rem", marginTop: "3px" }}>
            AI-assisted safety analysis based on official recall details
          </div>
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
            <div style={{ padding: "0 16px 16px", display: "grid", gap: "14px" }}>
              <div>
                <strong style={{ display: "block", marginBottom: "8px" }}>
                  Our safety model detected
                </strong>

                <div style={{ display: "grid", gap: "8px" }}>
                  {(risk.why || []).map((reason) => (
                    <div key={reason} style={{
                      padding: "10px 12px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.045)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#ddd",
                    }}>
                      • {reason}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{
                  padding: "12px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.045)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ color: "#888", fontSize: "0.78rem", fontWeight: 800 }}>
                    Reported impact
                  </div>
                  <div style={{ marginTop: "5px", color: "#fff", lineHeight: 1.45 }}>
                    {risk.reportedImpact}
                  </div>
                </div>

                <div style={{
                  padding: "12px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.045)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ color: "#888", fontSize: "0.78rem", fontWeight: 800 }}>
                    Confidence
                  </div>
                  <div style={{ marginTop: "5px", color: "#fff" }}>
                    {risk.confidence} confidence
                  </div>
                </div>
              </div>

              <div style={{
                padding: "13px",
                borderRadius: "14px",
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                color: "#fff",
                lineHeight: 1.5,
              }}>
                <strong>Recommended action:</strong> {risk.recommendedAction}
              </div>

              {risk.plainEnglishSummary && (
                <p style={{ color: "#aaa", lineHeight: 1.55, margin: 0 }}>
                  {risk.plainEnglishSummary}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}