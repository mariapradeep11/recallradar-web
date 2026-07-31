import { useState } from "react";

const categoryLabels = {
  food: "Food", drug: "Medicine", device: "Medical Devices", consumer: "Consumer",
};

const categoryColors = {
  food: "#d9a441", drug: "#5c8a5c", device: "#8a7a9e", consumer: "#c65b45",
};

const formatTime = (iso) => {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatDate = (date = "") => {
  if (date.length !== 8) return "N/A";
  return `${date.slice(4, 6)}/${date.slice(6, 8)}/${date.slice(0, 4)}`;
};

const getSeverityColor = (reason = "") => {
  const r = reason.toLowerCase();
  if (r.includes("listeria") || r.includes("salmonella") || r.includes("death") || r.includes("contamination")) return "#ff3b30";
  if (r.includes("allergen") || r.includes("undeclared") || r.includes("metal")) return "#d9a441";
  return "#8f8880";
};

export default function HistoryPanel({
  open,
  onClose,
  searchHistory,
  savedSearches,
  alertHistory,
  onRunSearch,
  onToggleSaved,
  isSaved,
  onClearHistory,
  onClearSaved,
}) {
  const [tab, setTab] = useState("saved"); // saved | history | alerts

  if (!open) return null;

  const tabs = [
    { id: "saved",   label: "⭐ Saved",   count: savedSearches.length },
    { id: "history", label: "🕐 History", count: searchHistory.length },
    { id: "alerts",  label: "⚠️ Alerts",  count: alertHistory.length },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 90,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed",
        top: 0, right: 0, bottom: 0,
        width: "min(420px, 100vw)",
        background: "#0c0b0a",
        border: "1px solid rgba(247,243,238,0.1)",
        borderRight: "none",
        zIndex: 91,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.6)",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 20px 16px",
          borderBottom: "1px solid rgba(247,243,238,0.09)",
          flexShrink: 0,
        }}>
          <strong style={{ fontSize: "1.1rem", color: "#f7f3ee" }}>Your Activity</strong>
          <button onClick={onClose} style={{
            background: "rgba(247,243,238,0.08)", border: "none", color: "#f7f3ee",
            borderRadius: "999px", width: "32px", height: "32px",
            cursor: "pointer", fontSize: "1rem",
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "6px", padding: "12px 16px",
          borderBottom: "1px solid rgba(247,243,238,0.09)",
          flexShrink: 0,
        }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: "8px 4px", borderRadius: "10px", border: "none",
                background: tab === t.id ? "rgba(247,243,238,0.1)" : "transparent",
                color: tab === t.id ? "#f7f3ee" : "rgba(247,243,238,0.4)",
                cursor: "pointer", fontWeight: tab === t.id ? 800 : 500,
                fontSize: "0.78rem", transition: "all 0.15s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
              }}
            >
              <span>{t.label}</span>
              {t.count > 0 && (
                <span style={{
                  background: tab === t.id ? "#c65b45" : "rgba(247,243,238,0.14)",
                  borderRadius: "999px", padding: "1px 6px",
                  fontSize: "0.68rem", fontWeight: 900, color: "#fbf1ec",
                }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>

          {/* ── SAVED SEARCHES ── */}
          {tab === "saved" && (
            <>
              {savedSearches.length === 0 ? (
                <EmptyState
                  icon="⭐"
                  title="No saved searches yet"
                  body="Star a search result to save it here for quick access."
                />
              ) : (
                <>
                  {savedSearches.map((s) => (
                    <SearchCard
                      key={s.id}
                      item={s}
                      saved={true}
                      onRun={() => { onRunSearch(s.query, s.category); onClose(); }}
                      onToggle={() => onToggleSaved(s.query, s.category)}
                    />
                  ))}
                  <ClearButton label="Clear saved searches" onClick={onClearSaved} />
                </>
              )}
            </>
          )}

          {/* ── SEARCH HISTORY ── */}
          {tab === "history" && (
            <>
              {searchHistory.length === 0 ? (
                <EmptyState
                  icon="🕐"
                  title="No search history yet"
                  body="Your recent searches will appear here automatically."
                />
              ) : (
                <>
                  {searchHistory.map((s) => (
                    <SearchCard
                      key={s.id}
                      item={s}
                      saved={isSaved(s.query, s.category)}
                      onRun={() => { onRunSearch(s.query, s.category); onClose(); }}
                      onToggle={() => onToggleSaved(s.query, s.category)}
                      showCount
                    />
                  ))}
                  <ClearButton label="Clear search history" onClick={onClearHistory} />
                </>
              )}
            </>
          )}

          {/* ── ALERT HISTORY ── */}
          {tab === "alerts" && (
            <>
              {alertHistory.length === 0 ? (
                <EmptyState
                  icon="⚠️"
                  title="No alerts viewed yet"
                  body="Recalls you view will be logged here so you can come back to them."
                />
              ) : (
                <>
                  {alertHistory.map((a) => (
                    <AlertCard key={a.id} item={a} />
                  ))}
                  <ClearButton label="Clear alert history" onClick={onClearHistory} />
                </>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({ icon, title, body }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{icon}</div>
      <p style={{ color: "rgba(247,243,238,0.7)", fontWeight: 700, margin: "0 0 8px" }}>{title}</p>
      <p style={{ color: "rgba(247,243,238,0.32)", fontSize: "0.85rem", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function SearchCard({ item, saved, onRun, onToggle, showCount }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "12px 14px", borderRadius: "14px", marginBottom: "8px",
      background: "rgba(247,243,238,0.035)", border: "1px solid rgba(247,243,238,0.07)",
    }}>
      {/* Category dot */}
      <div style={{
        width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
        background: categoryColors[item.category] || "#8f8880",
      }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.92rem", color: "#f7f3ee", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.query}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "0.74rem", color: "rgba(247,243,238,0.32)" }}>
          {categoryLabels[item.category]}
          {showCount && item.resultCount !== undefined && (
            <span style={{ marginLeft: "6px", color: item.resultCount > 0 ? "#d9a441" : "rgba(247,243,238,0.24)" }}>
              · {item.resultCount} result{item.resultCount !== 1 ? "s" : ""}
            </span>
          )}
          <span style={{ marginLeft: "6px" }}>· {formatTime(item.timestamp)}</span>
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        <button
          onClick={onToggle}
          title={saved ? "Unsave" : "Save"}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "1rem", opacity: saved ? 1 : 0.3,
            transition: "opacity 0.15s",
          }}
        >
          ⭐
        </button>
        <button
          onClick={onRun}
          style={{
            background: "rgba(247,243,238,0.06)", border: "1px solid rgba(247,243,238,0.09)",
            color: "rgba(247,243,238,0.75)", borderRadius: "8px", padding: "5px 10px",
            cursor: "pointer", fontSize: "0.75rem", fontWeight: 700,
          }}
        >
          Search →
        </button>
      </div>
    </div>
  );
}

function AlertCard({ item }) {
  const color = getSeverityColor(item.reason);
  return (
    <div style={{
      padding: "12px 14px", borderRadius: "14px", marginBottom: "8px",
      background: "rgba(247,243,238,0.035)", border: "1px solid rgba(247,243,238,0.07)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <p style={{
          margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "#f7f3ee",
          lineHeight: 1.4, flex: 1,
        }}>
          {item.product.length > 80 ? item.product.slice(0, 80) + "…" : item.product}
        </p>
        <div style={{
          flexShrink: 0, width: "8px", height: "8px", borderRadius: "50%",
          background: color, marginTop: "5px",
        }} />
      </div>
      <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "rgba(247,243,238,0.32)", lineHeight: 1.4 }}>
        {item.firm && <span style={{ color: "rgba(247,243,238,0.4)" }}>{item.firm} · </span>}
        {formatDate(item.report_date)}
        <span style={{ marginLeft: "6px" }}>· {formatTime(item.timestamp)}</span>
      </p>
    </div>
  );
}

function ClearButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", marginTop: "16px", padding: "11px",
        borderRadius: "12px", background: "transparent",
        border: "1px solid rgba(247,243,238,0.09)",
        color: "rgba(247,243,238,0.28)", cursor: "pointer", fontSize: "0.82rem",
      }}
    >
      {label}
    </button>
  );
}
