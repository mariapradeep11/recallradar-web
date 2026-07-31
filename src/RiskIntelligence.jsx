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
    bg: "rgba(217,164,65,0.16)",
    color: "#e8c179",
    border: "rgba(217,164,65,0.3)",
    glow: "rgba(217,164,65,0.08)",
  },
  LOW: {
    bg: "rgba(247,243,238,0.06)",
    color: "rgba(247,243,238,0.6)",
    border: "rgba(247,243,238,0.13)",
    glow: "rgba(247,243,238,0.03)",
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

  if (text.includes("allerg")) {
    return [
      "Avoid this product if you have relevant allergies or sensitivities",
      "Check the ingredient label and product identifiers",
      "Verify whether your exact product is affected",
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
  sourceContext,
}) {
  const [open, setOpen] = useState(true);

  if (loading) {
    return (
      <div
        style={{
          marginTop: "14px",
          padding: "14px 16px",
          borderRadius: "18px",
          background: "rgba(247,243,238,0.045)",
          border: "1px solid rgba(247,243,238,0.08)",
          color: "rgba(247,243,238,0.6)",
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
        background: "rgba(12,11,10,0.92)",
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
          color: "#f7f3ee",
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
            ⚠️ {risk.contextualLabel || `${risk.riskLevel} RISK`}
          </div>

          <div style={{ fontWeight: 900, fontSize: "1.05rem" }}>
            Why RecallRadar flagged this
          </div>

          <div
            style={{
              color: "rgba(247,243,238,0.45)",
              fontSize: "0.82rem",
              marginTop: "4px",
              lineHeight: 1.45,
            }}
          >
            AI-assisted safety analysis based on official recall details
          </div>

          {risk.riskQualifier && (
            <div
              style={{
                color: "rgba(247,243,238,0.55)",
                fontSize: "0.82rem",
                marginTop: "6px",
                lineHeight: 1.45,
              }}
            >
              {risk.riskQualifier}
            </div>
          )}

          {(source || date) && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "10px",
                fontSize: "0.78rem",
                color: "rgba(247,243,238,0.5)",
              }}
            >
              {source && <span>✔ Verified source: {source}</span>}
              {date && <span>📅 {date}</span>}
            </div>
          )}
        </div>

        <span style={{ color: "rgba(247,243,238,0.55)", fontSize: "1.1rem" }}>
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
                  Key safety signals
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
                        background: "rgba(247,243,238,0.055)",
                        border: "1px solid rgba(247,243,238,0.08)",
                        color: "rgba(247,243,238,0.88)",
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
                    background: "rgba(247,243,238,0.045)",
                    border: "1px solid rgba(247,243,238,0.06)",
                  }}
                >
                  <div
                    style={{
                      color: "rgba(247,243,238,0.4)",
                      fontSize: "0.76rem",
                      fontWeight: 900,
                      marginBottom: "7px",
                    }}
                  >
                    REPORTED IMPACT
                  </div>

                  <div style={{ color: "#f7f3ee", lineHeight: 1.5 }}>
                    {risk.reportedImpact ||
                      "No reported impact count found in available recall details."}
                  </div>
                </div>

                <div
                  style={{
                    padding: "14px",
                    borderRadius: "16px",
                    background: "rgba(247,243,238,0.045)",
                    border: "1px solid rgba(247,243,238,0.06)",
                  }}
                >
                  <div
                    style={{
                      color: "rgba(247,243,238,0.4)",
                      fontSize: "0.76rem",
                      fontWeight: 900,
                      marginBottom: "7px",
                    }}
                  >
                    CONFIDENCE
                  </div>

                  <div style={{ color: "#f7f3ee", lineHeight: 1.5 }}>
                    {risk.confidence || "Medium"} confidence
                  </div>

                  <div
                    style={{
                      marginTop: "8px",
                      color: "rgba(247,243,238,0.4)",
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
                      key={`${step}-${idx}`}
                      style={{
                        padding: "11px 12px",
                        borderRadius: "13px",
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid rgba(247,243,238,0.05)",
                        color: "rgba(247,243,238,0.92)",
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

              {sourceContext && (
                <div
                  style={{
                    padding: "15px",
                    borderRadius: "16px",
                    background: "rgba(247,243,238,0.035)",
                    border: "1px solid rgba(247,243,238,0.06)",
                    color: "rgba(247,243,238,0.78)",
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: "#f7f3ee" }}>
                    What RecallRadar checked
                  </strong>

                  <div style={{ marginTop: "10px", color: "rgba(247,243,238,0.55)" }}>
                    {sourceContext.sourceName && (
                      <div>✔ Source: {sourceContext.sourceName}</div>
                    )}
                    {sourceContext.sourceType && (
                      <div>✔ Type: {sourceContext.sourceType}</div>
                    )}
                  </div>

                  {Array.isArray(sourceContext.checkedFields) && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginTop: "12px",
                      }}
                    >
                      {sourceContext.checkedFields.map((field) => (
                        <span
                          key={field}
                          style={{
                            padding: "7px 10px",
                            borderRadius: "999px",
                            background: "rgba(247,243,238,0.055)",
                            border: "1px solid rgba(247,243,238,0.08)",
                            fontSize: "0.78rem",
                            color: "rgba(247,243,238,0.85)",
                          }}
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  )}

                  {sourceContext.note && (
                    <p
                      style={{
                        color: "rgba(247,243,238,0.4)",
                        margin: "12px 0 0",
                        fontSize: "0.85rem",
                      }}
                    >
                      {sourceContext.note}
                    </p>
                  )}

                  {Array.isArray(sourceContext.trustedSources) &&
                    sourceContext.trustedSources.length > 0 && (
                      <div style={{ marginTop: "14px" }}>
                        <strong style={{ color: "#f7f3ee", fontSize: "0.9rem" }}>
                          Trusted source links
                        </strong>

                        <div
                          style={{
                            display: "grid",
                            gap: "8px",
                            marginTop: "10px",
                          }}
                        >
                          {sourceContext.trustedSources.map((link) => (
                            <a
                              key={link.label}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#e4a396",
                                textDecoration: "none",
                                fontWeight: 800,
                                fontSize: "0.88rem",
                              }}
                            >
                              {link.label} →
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {risk.plainEnglishSummary && (
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "16px",
                    background: "rgba(247,243,238,0.03)",
                    border: "1px solid rgba(247,243,238,0.05)",
                  }}
                >
                  <div
                    style={{
                      color: "rgba(247,243,238,0.4)",
                      fontSize: "0.76rem",
                      fontWeight: 900,
                      marginBottom: "8px",
                    }}
                  >
                    SUMMARY
                  </div>

                  <p
                    style={{
                      color: "rgba(247,243,238,0.6)",
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
