import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

// Looks up product name from barcode using Open Food Facts (free, no key)
async function lookupBarcode(barcode) {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const data = await res.json();
    if (data.status === 1 && data.product) {
      const p = data.product;
      // Try to get the most useful search term
      return (
        p.product_name_en ||
        p.product_name ||
        p.generic_name ||
        p.brands ||
        null
      );
    }
    return null;
  } catch {
    return null;
  }
}

export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [status, setStatus] = useState("starting"); // starting | scanning | found | error | notfound
  const [foundText, setFoundText] = useState("");
  const [cameras, setCameras] = useState([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);

  const startScanning = async (cameraIndex = 0) => {
    setStatus("starting");
    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      setCameras(devices);

      if (devices.length === 0) {
        setStatus("error");
        return;
      }

      const deviceId = devices[cameraIndex]?.deviceId;
      setStatus("scanning");

      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        async (result, err) => {
          if (result) {
            const barcode = result.getText();
            setStatus("found");
            setFoundText("Looking up product…");

            // Stop scanning immediately on first result
            reader.reset();

            const productName = await lookupBarcode(barcode);

            if (productName) {
              setFoundText(productName);
              setTimeout(() => {
                onResult(productName);
                onClose();
              }, 800);
            } else {
              // Fall back to raw barcode if product not found in Open Food Facts
              setFoundText(`Barcode: ${barcode}`);
              setTimeout(() => {
                onResult(barcode);
                onClose();
              }, 800);
            }
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error("ZXing error:", err);
          }
        }
      );
    } catch (err) {
      console.error("Camera error:", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    startScanning(activeCameraIndex);
    return () => {
      readerRef.current?.reset();
    };
  }, [activeCameraIndex]);

  const switchCamera = () => {
    readerRef.current?.reset();
    const next = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(next);
  };

  return (
    // Overlay
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <span style={{ fontWeight: 800, fontSize: "1rem" }}>📷 Scan a barcode</span>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "#fff",
              borderRadius: "999px",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Video feed */}
        <div style={{ position: "relative", background: "#000", aspectRatio: "1" }}>
          <video
            ref={videoRef}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            muted
            playsInline
          />

          {/* Scan frame overlay */}
          {status === "scanning" && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}>
              {/* Corner brackets */}
              {[
                { top: "20%", left: "20%", borderTop: "3px solid #ff3b30", borderLeft: "3px solid #ff3b30" },
                { top: "20%", right: "20%", borderTop: "3px solid #ff3b30", borderRight: "3px solid #ff3b30" },
                { bottom: "20%", left: "20%", borderBottom: "3px solid #ff3b30", borderLeft: "3px solid #ff3b30" },
                { bottom: "20%", right: "20%", borderBottom: "3px solid #ff3b30", borderRight: "3px solid #ff3b30" },
              ].map((style, i) => (
                <div key={i} style={{
                  position: "absolute",
                  width: "28px",
                  height: "28px",
                  borderRadius: "2px",
                  ...style,
                }} />
              ))}

              {/* Scan line animation */}
              <div style={{
                position: "absolute",
                left: "20%",
                right: "20%",
                height: "2px",
                background: "linear-gradient(90deg, transparent, #ff3b30, transparent)",
                animation: "scanline 2s ease-in-out infinite",
              }} />
            </div>
          )}

          {/* Found overlay */}
          {status === "found" && (
            <div style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}>
              <div style={{ fontSize: "3rem" }}>✅</div>
              <p style={{ color: "#fff", fontWeight: 800, textAlign: "center", padding: "0 20px" }}>
                {foundText}
              </p>
            </div>
          )}

          {/* Error overlay */}
          {status === "error" && (
            <div style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "20px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "2.5rem" }}>📵</div>
              <p style={{ color: "#ff8a80", fontWeight: 800 }}>Camera not available</p>
              <p style={{ color: "#888", fontSize: "0.85rem" }}>
                Make sure you've allowed camera access in your browser settings, then try again.
              </p>
            </div>
          )}

          {/* Starting overlay */}
          {status === "starting" && (
            <div style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <p style={{ color: "#aaa" }}>Starting camera…</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "#666", fontSize: "0.8rem", margin: 0 }}>
            {status === "scanning" ? "Point at any product barcode" : ""}
          </p>
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#ccc",
                borderRadius: "999px",
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
            >
              🔄 Flip camera
            </button>
          )}
        </div>
      </div>

      {/* Scan line CSS animation */}
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
