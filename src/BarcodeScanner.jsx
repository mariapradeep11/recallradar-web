import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

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

export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const readerRef   = useRef(new BrowserMultiFormatReader());
  const scanLoopRef = useRef(null);

  const [phase, setPhase]             = useState("idle");
  const [foundText, setFoundText]     = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [hasFront, setHasFront]       = useState(false);
  const [useFront, setUseFront]       = useState(false);

  const stopStream = () => {
    clearInterval(scanLoopRef.current);
    scanLoopRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async (front = false) => {
    stopStream();
    setPhase("starting");
    setErrorDetail("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: front ? "user" : { ideal: "environment" },
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setHasFront(devices.filter((d) => d.kind === "videoinput").length > 1);
      } catch { /* ignore */ }

      const video = videoRef.current;
      if (video) {
        video.muted = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.srcObject = stream;

        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.width  = video.videoWidth  || 640;
            video.height = video.videoHeight || 480;
            resolve();
          };
          if (video.readyState >= 1) resolve();
        });

        try {
          await video.play();
        } catch (playErr) {
          console.warn("video.play() failed:", playErr);
        }
      }

      setPhase("scanning");
      beginScanLoop();

    } catch (err) {
      console.error("Camera error:", err.name, err.message);
      setErrorDetail(`${err.name}: ${err.message}`);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") setPhase("denied");
      else if (err.name === "NotReadableError" || err.name === "TrackStartError")  setPhase("inuse");
      else setPhase("unavailable");
    }
  };

  const beginScanLoop = () => {
    scanLoopRef.current = setInterval(async () => {
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c || v.readyState < 2 || v.videoWidth === 0) return;

      c.width  = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext("2d").drawImage(v, 0, 0);

      try {
        const result = await readerRef.current.decodeFromCanvas(c);
        if (result) {
          stopStream();
          const barcode = result.getText();
          setPhase("found");
          setFoundText("Looking up product…");
          const name  = await lookupBarcode(barcode);
          const label = name || `Barcode: ${barcode}`;
          setFoundText(label);
          setTimeout(() => { onResult(name || barcode); onClose(); }, 900);
        }
      } catch { /* no barcode in frame yet */ }
    }, 400);
  };

  const stopCamera   = () => { stopStream(); setPhase("stopped"); };
  const resumeCamera = () => startCamera(useFront);
  const flipCamera   = () => { const next = !useFront; setUseFront(next); startCamera(next); };

  useEffect(() => () => stopStream(), []);

  const primaryBtn = { width: "100%", padding: "15px", borderRadius: "14px", background: "#ff3b30", color: "#fff", border: "none", fontWeight: 900, cursor: "pointer", fontSize: "1rem" };
  const whiteBtn   = { width: "100%", padding: "15px", borderRadius: "14px", background: "#fff", color: "#000", border: "none", fontWeight: 900, cursor: "pointer" };
  const ghostBtn   = { width: "100%", marginTop: "10px", padding: "12px", borderRadius: "14px", background: "transparent", color: "#666", border: "none", cursor: "pointer" };
  const chipBtn    = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ccc", borderRadius: "999px", padding: "8px 14px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", overflow: "hidden" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontWeight: 800, fontSize: "1rem" }}>📷 Scan a barcode</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: "999px", width: "32px", height: "32px", cursor: "pointer", fontSize: "1rem" }}>✕</button>
        </div>

        {phase === "idle" && (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>📷</div>
            <h3 style={{ margin: "0 0 10px" }}>Scan a product barcode</h3>
            <p style={{ color: "#888", lineHeight: 1.6, marginBottom: "24px", fontSize: "0.9rem" }}>
              Point your camera at any barcode and we'll instantly check for recalls. Camera is only active while this window is open.
            </p>
            <button onClick={() => startCamera(false)} style={primaryBtn}>Enable camera & start scanning</button>
            <button onClick={onClose} style={ghostBtn}>No thanks, I'll search manually</button>
          </div>
        )}

        {phase === "starting" && (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>⏳</div>
            <p style={{ color: "#aaa", fontWeight: 700 }}>Starting camera…</p>
            <p style={{ color: "#666", fontSize: "0.82rem", marginTop: "8px" }}>
              If prompted, tap <strong style={{ color: "#ccc" }}>Allow</strong> to grant camera access
            </p>
          </div>
        )}

        {phase === "denied" && (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🚫</div>
            <h3 style={{ margin: "0 0 10px", color: "#ff8a80" }}>Camera access blocked</h3>
            <p style={{ color: "#888", lineHeight: 1.6, fontSize: "0.9rem", marginBottom: "20px" }}>Enable camera access for this site:</p>
            <button onClick={() => startCamera(false)} style={whiteBtn}>Try again</button>
            <button onClick={onClose} style={ghostBtn}>Search manually instead</button>
          </div>
        )}

        {phase === "inuse" && (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📹</div>
            <h3 style={{ margin: "0 0 10px", color: "#ff9500" }}>Camera is in use</h3>
            <p style={{ color: "#888", lineHeight: 1.6, fontSize: "0.9rem", marginBottom: "24px" }}>
              Another app is using your camera. Close it and try again.
            </p>
            <button onClick={() => startCamera(false)} style={whiteBtn}>Try again</button>
            <button onClick={onClose} style={ghostBtn}>Search manually instead</button>
          </div>
        )}

        {phase === "unavailable" && (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📵</div>
            <h3 style={{ margin: "0 0 10px", color: "#ff8a80" }}>Camera not available</h3>
            <p style={{ color: "#888", lineHeight: 1.6, fontSize: "0.9rem", marginBottom: "12px" }}>
              We couldn't access a camera on this device.
            </p>
            {errorDetail && (
              <p style={{ color: "#444", fontSize: "0.7rem", marginBottom: "20px", fontFamily: "monospace", wordBreak: "break-all" }}>
                {errorDetail}
              </p>
            )}
            <button onClick={() => startCamera(false)} style={whiteBtn}>Try again</button>
            <button onClick={onClose} style={ghostBtn}>Search manually instead</button>
          </div>
        )}

        {(phase === "scanning" || phase === "found" || phase === "stopped") && (
          <>
            <div style={{ position: "relative", background: "#111", width: "100%", aspectRatio: "1", overflow: "hidden" }}>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                webkit-playsinline="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  background: "#000",
                  opacity: phase === "stopped" ? 0.25 : 1,
                  transition: "opacity 0.3s",
                  transform: "translateZ(0)",
                  WebkitTransform: "translateZ(0)",
                  zIndex: 1,
                }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {phase === "scanning" && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
                  <div style={{
                    position: "absolute",
                    top: "20%", left: "15%", right: "15%", bottom: "20%",
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                    borderRadius: "8px",
                  }} />
                  {[
                    { top: "20%", left: "15%", borderTop: "3px solid #ff3b30", borderLeft: "3px solid #ff3b30", borderRadius: "4px 0 0 0" },
                    { top: "20%", right: "15%", borderTop: "3px solid #ff3b30", borderRight: "3px solid #ff3b30", borderRadius: "0 4px 0 0" },
                    { bottom: "20%", left: "15%", borderBottom: "3px solid #ff3b30", borderLeft: "3px solid #ff3b30", borderRadius: "0 0 0 4px" },
                    { bottom: "20%", right: "15%", borderBottom: "3px solid #ff3b30", borderRight: "3px solid #ff3b30", borderRadius: "0 0 4px 0" },
                  ].map((s, i) => (
                    <div key={i} style={{ position: "absolute", width: "32px", height: "32px", ...s }} />
                  ))}
                  <div style={{
                    position: "absolute",
                    left: "15%", right: "15%", height: "2px",
                    background: "linear-gradient(90deg, transparent, #ff3b30, transparent)",
                    animation: "scanline 2s ease-in-out infinite",
                  }} />
                </div>
              )}

              {phase === "found" && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.78)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", zIndex: 3 }}>
                  <div style={{ fontSize: "3rem" }}>✅</div>
                  <p style={{ color: "#fff", fontWeight: 800, textAlign: "center", padding: "0 24px", margin: 0 }}>{foundText}</p>
                </div>
              )}

              {phase === "stopped" && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", zIndex: 3 }}>
                  <p style={{ color: "#aaa", fontWeight: 700, margin: 0 }}>Camera paused</p>
                  <button onClick={resumeCamera} style={{ padding: "12px 28px", borderRadius: "999px", background: "#fff", color: "#000", border: "none", fontWeight: 900, cursor: "pointer" }}>Resume</button>
                </div>
              )}
            </div>

            <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
              <p style={{ color: "#555", fontSize: "0.78rem", margin: 0, flex: 1 }}>
                {phase === "scanning" ? "Point barcode at the red frame" : ""}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                {phase === "scanning" && <button onClick={stopCamera} style={chipBtn}>⏸ Pause</button>}
                {phase === "scanning" && hasFront && <button onClick={flipCamera} style={chipBtn}>🔄 Flip</button>}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0%   { top: 20%; }
          50%  { top: 78%; }
          100% { top: 20%; }
        }
      `}</style>
    </div>
  );
}