import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

async function lookupBarcode(barcode) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status === 1 && data.product) {
      const p = data.product;
      return p.product_name_en || p.product_name || p.generic_name || p.brands || null;
    }
    return null;
  } catch {
    return null;
  }
}

// phases: idle → requesting → granted → scanning → found
//         idle → requesting → denied
//         idle → requesting → unavailable

export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef    = useRef(null);
  const readerRef   = useRef(null);
  const streamRef   = useRef(null);

  const [phase, setPhase]             = useState("idle");
  const [foundText, setFoundText]     = useState("");
  const [cameras, setCameras]         = useState([]);
  const [cameraIndex, setCameraIndex] = useState(0);

  // ── Step 1: Request permission (iOS needs getUserMedia first) ─────────────
  const requestPermission = async () => {
    setPhase("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setPhase("granted");
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPhase("denied");
      } else {
        setPhase("unavailable");
      }
    }
  };

  // ── Step 2: Start ZXing once permission granted ───────────────────────────
  useEffect(() => {
    if (phase !== "granted") return;
    let cancelled = false;

    // Release the raw permission stream — ZXing opens its own
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const start = async () => {
      try {
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (cancelled) return;
        if (!devices || devices.length === 0) { setPhase("unavailable"); return; }

        setCameras(devices);

        // Prefer back/environment camera
        const backIndex = devices.findIndex((d) =>
          /back|rear|environment/i.test(d.label)
        );
        const useIndex = backIndex >= 0 ? backIndex : 0;
        setCameraIndex(useIndex);
        setPhase("scanning");

        await reader.decodeFromVideoDevice(
          devices[useIndex]?.deviceId,
          videoRef.current,
          async (result, err) => {
            if (result) {
              reader.reset();
              const barcode     = result.getText();
              setPhase("found");
              setFoundText("Looking up product…");
              const productName = await lookupBarcode(barcode);
              const label       = productName || `Barcode: ${barcode}`;
              setFoundText(label);
              setTimeout(() => { onResult(productName || barcode); onClose(); }, 900);
            }
            if (err && !(err instanceof NotFoundException)) { /* continuous non-fatal */ }
          }
        );
      } catch (err) {
        if (!cancelled) { console.error("ZXing error:", err); setPhase("unavailable"); }
      }
    };

    start();
    return () => { cancelled = true; readerRef.current?.reset(); };
  }, [phase]);

  // ── Switch camera ─────────────────────────────────────────────────────────
  const switchCamera = async () => {
    if (cameras.length < 2) return;
    readerRef.current?.reset();
    const next   = (cameraIndex + 1) % cameras.length;
    setCameraIndex(next);
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    try {
      await reader.decodeFromVideoDevice(cameras[next]?.deviceId, videoRef.current,
        async (result, err) => {
          if (result) {
            reader.reset();
            const barcode     = result.getText();
            setPhase("found");
            setFoundText("Looking up product…");
            const productName = await lookupBarcode(barcode);
            setFoundText(productName || `Barcode: ${barcode}`);
            setTimeout(() => { onResult(productName || barcode); onClose(); }, 900);
          }
          if (err && !(err instanceof NotFoundException)) {}
        }
      );
    } catch (err) { console.error("Switch camera error:", err); }
  };

  const stopScanning = () => { readerRef.current?.reset(); setPhase("stopped"); };
  const resumeScanning = () => setPhase("granted");

  useEffect(() => {
    return () => {
      readerRef.current?.reset();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Shared button styles ──────────────────────────────────────────────────
  const primaryBtn = {
    width: "100%", padding: "15px", borderRadius: "14px",
    background: "#ff3b30", color: "#fff", border: "none",
    fontWeight: 900, cursor: "pointer", fontSize: "1rem",
  };
  const ghostBtn = {
    width: "100%", marginTop: "10px", padding: "12px", borderRadius: "14px",
    background: "transparent", color: "#666", border: "none", cursor: "pointer",
  };
  const chipBtn = {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#ccc", borderRadius: "999px", padding: "8px 14px",
    cursor: "pointer", fontSize: "0.82rem", fontWeight: 700,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 200,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "420px", background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <span style={{ fontWeight: 800, fontSize: "1rem" }}>📷 Scan a barcode</span>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.08)", border: "none", color: "#fff",
            borderRadius: "999px", width: "32px", height: "32px", cursor: "pointer", fontSize: "1rem",
          }}>✕</button>
        </div>

        {/* ── IDLE ── */}
        {phase === "idle" && (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>📷</div>
            <h3 style={{ margin: "0 0 10px" }}>Enable your camera</h3>
            <p style={{ color: "#888", lineHeight: 1.6, marginBottom: "24px", fontSize: "0.9rem" }}>
              RecallRadar needs camera access to scan product barcodes. Your camera is only active while this window is open — we never store or transmit video.
            </p>
            <button onClick={requestPermission} style={primaryBtn}>Enable camera & scan</button>
            <button onClick={onClose} style={ghostBtn}>No thanks, I'll search manually</button>
          </div>
        )}

        {/* ── REQUESTING ── */}
        {phase === "requesting" && (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>⏳</div>
            <p style={{ color: "#aaa", fontWeight: 700 }}>Waiting for permission…</p>
            <p style={{ color: "#666", fontSize: "0.82rem", marginTop: "8px" }}>
              Look for a permission prompt at the top of your screen and tap <strong style={{ color: "#ccc" }}>Allow</strong>
            </p>
          </div>
        )}

        {/* ── DENIED ── */}
        {phase === "denied" && (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🚫</div>
            <h3 style={{ margin: "0 0 10px", color: "#ff8a80" }}>Camera access blocked</h3>
            <p style={{ color: "#888", lineHeight: 1.6, fontSize: "0.9rem", marginBottom: "20px" }}>
              To enable it, follow the steps for your device:
            </p>
            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {[
                { icon: "🍎", label: "iPhone / Safari", step: "Settings → Safari → Camera → Allow" },
                { icon: "🤖", label: "Android / Chrome", step: "Settings → Site Settings → Camera → Allow" },
                { icon: "💻", label: "Desktop", step: "Click 🔒 in address bar → Camera → Allow" },
              ].map(({ icon, label, step }) => (
                <div key={label} style={{
                  padding: "12px 14px", borderRadius: "12px",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  textAlign: "left",
                }}>
                  <p style={{ margin: "0 0 4px", color: "#fff", fontSize: "0.85rem", fontWeight: 700 }}>{icon} {label}</p>
                  <p style={{ margin: 0, color: "#888", fontSize: "0.8rem" }}>{step}</p>
                </div>
              ))}
            </div>
            <button onClick={requestPermission} style={{ ...primaryBtn, background: "#fff", color: "#000" }}>
              Try again
            </button>
            <button onClick={onClose} style={ghostBtn}>Search manually instead</button>
          </div>
        )}

        {/* ── UNAVAILABLE ── */}
        {phase === "unavailable" && (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📵</div>
            <h3 style={{ margin: "0 0 10px", color: "#ff8a80" }}>No camera detected</h3>
            <p style={{ color: "#888", lineHeight: 1.6, fontSize: "0.9rem", marginBottom: "24px" }}>
              We couldn't access a camera on this device. Try searching by product name or brand instead.
            </p>
            <button onClick={onClose} style={{ ...primaryBtn, background: "#fff", color: "#000" }}>
              Search manually
            </button>
          </div>
        )}

        {/* ── SCANNING / FOUND / STOPPED ── */}
        {(phase === "scanning" || phase === "found" || phase === "stopped") && (
          <>
            <div style={{ position: "relative", background: "#000", aspectRatio: "1" }}>
              <video
                ref={videoRef}
                style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                  opacity: phase === "stopped" ? 0.25 : 1,
                  transition: "opacity 0.3s",
                }}
                muted playsInline
              />

              {/* Scan frame */}
              {phase === "scanning" && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  {[
                    { top: "22%", left: "22%", borderTop: "3px solid #ff3b30", borderLeft: "3px solid #ff3b30" },
                    { top: "22%", right: "22%", borderTop: "3px solid #ff3b30", borderRight: "3px solid #ff3b30" },
                    { bottom: "22%", left: "22%", borderBottom: "3px solid #ff3b30", borderLeft: "3px solid #ff3b30" },
                    { bottom: "22%", right: "22%", borderBottom: "3px solid #ff3b30", borderRight: "3px solid #ff3b30" },
                  ].map((s, i) => (
                    <div key={i} style={{ position: "absolute", width: "28px", height: "28px", borderRadius: "2px", ...s }} />
                  ))}
                  <div style={{
                    position: "absolute", left: "22%", right: "22%", height: "2px",
                    background: "linear-gradient(90deg, transparent, #ff3b30, transparent)",
                    animation: "scanline 2s ease-in-out infinite",
                  }} />
                </div>
              )}

              {/* Found */}
              {phase === "found" && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.78)",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: "12px",
                }}>
                  <div style={{ fontSize: "3rem" }}>✅</div>
                  <p style={{ color: "#fff", fontWeight: 800, textAlign: "center", padding: "0 24px" }}>
                    {foundText}
                  </p>
                </div>
              )}

              {/* Stopped */}
              {phase === "stopped" && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: "16px",
                }}>
                  <p style={{ color: "#aaa", fontWeight: 700, margin: 0 }}>Camera paused</p>
                  <button onClick={resumeScanning} style={{
                    padding: "12px 28px", borderRadius: "999px",
                    background: "#fff", color: "#000", border: "none", fontWeight: 900, cursor: "pointer",
                  }}>
                    Resume
                  </button>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{
              padding: "14px 20px", display: "flex",
              justifyContent: "space-between", alignItems: "center", gap: "8px",
            }}>
              <p style={{ color: "#555", fontSize: "0.78rem", margin: 0, flex: 1 }}>
                {phase === "scanning" ? "Point at any product barcode" : ""}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                {phase === "scanning" && (
                  <button onClick={stopScanning} style={chipBtn}>⏸ Pause</button>
                )}
                {cameras.length > 1 && phase === "scanning" && (
                  <button onClick={switchCamera} style={chipBtn}>🔄 Flip</button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0%   { top: 22%; }
          50%  { top: 76%; }
          100% { top: 22%; }
        }
      `}</style>
    </div>
  );
}
