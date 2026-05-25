import { Suspense, useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { resolvePhoto, resolveAllPhotos, preloadPhoto, categoryGlow } from "./photoMap.js";

/* ═══════════════════════════════════════════════════════════════════════════════
   3D SCAN OVERLAY — floating rings + particles on transparent canvas
   ═══════════════════════════════════════════════════════════════════════════════ */

function ScanRing({ radius = 1.8, color = "#ff3b30", speed = 0.5, yBase = 0 }) {
  const ref = useRef();
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.PI * 0.5;
    ref.current.position.y = yBase + Math.sin(s.clock.elapsedTime * speed) * 0.8;
    ref.current.rotation.z = s.clock.elapsedTime * 0.2;
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.005, 8, 80]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
}

function ScanParticles({ count = 50, radius = 2.2, color = "#ff6b60" }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.6 + Math.random() * 0.4);
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count, radius]);

  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.y = s.clock.elapsedTime * 0.06;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.018} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

function ScanOverlay({ glowColor = "#ff3b30" }) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }} style={{ background: "transparent", position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3 }}>
      <Suspense fallback={null}>
        <ScanRing radius={1.6} color={glowColor} speed={0.5} yBase={0} />
        <ScanRing radius={1.2} color={glowColor} speed={-0.35} yBase={0.15} />
        <ScanRing radius={2.0} color={glowColor} speed={0.25} yBase={-0.1} />
        <ScanParticles count={50} radius={2.4} color={glowColor} />
        <Stars radius={30} depth={15} count={150} factor={1.2} saturation={0} fade />
      </Suspense>
    </Canvas>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CINEMATIC PHOTO HERO
   
   Flow:
   1. Before search → invisible (height 0)
   2. Search triggered → screen goes black → photo fades in FULLSCREEN
   3. "Scanning" label pulses, 3D rings orbit on top
   4. After 2.5s reveal OR when results arrive → smoothly shrinks
   5. On scroll → next photo crossfades in (if multiple available)
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function PhotoHero({
  query = "",
  category = "food",
  hasResults = false,
  isSearching = false,
}) {
  const [phase, setPhase] = useState("idle");       // idle | reveal | compact
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [nextPhoto, setNextPhoto] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [allPhotos, setAllPhotos] = useState([]);
  const [crossfade, setCrossfade] = useState(false);
  const containerRef = useRef(null);
  const prevQueryRef = useRef("");
  const revealTimerRef = useRef(null);

  const glow = categoryGlow[category] || categoryGlow.food;

  // ── When search starts: go fullscreen black → reveal photo ────────────
  useEffect(() => {
    if (!isSearching) return;
    if (query === prevQueryRef.current && phase !== "idle") return;

    prevQueryRef.current = query;
    setPhase("reveal");
    setPhotoIndex(0);
    setCrossfade(false);

    // Resolve all available photos for this query
    const photos = resolveAllPhotos(query, category);
    setAllPhotos(photos);

    // Preload first photo
    if (photos.length > 0) {
      preloadPhoto(photos[0]).then((src) => {
        setCurrentPhoto(src);
      });
    }

    // Clear any existing timer
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);

  }, [isSearching, query, category]);

  // ── When results arrive: wait a beat, then shrink to compact ──────────
  useEffect(() => {
    if (!hasResults || phase !== "reveal") return;

    // Hold the fullscreen reveal for at least 2 seconds so the user sees it
    revealTimerRef.current = setTimeout(() => {
      setPhase("compact");
    }, 2000);

    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [hasResults, phase]);

  // ── Reset when going back to idle ─────────────────────────────────────
  useEffect(() => {
    if (!isSearching && !hasResults) {
      setPhase("idle");
      setCurrentPhoto(null);
      setNextPhoto(null);
      setPhotoIndex(0);
    }
  }, [isSearching, hasResults]);

  // ── Scroll-driven image rotation (compact mode) ───────────────────────
  useEffect(() => {
    if (phase !== "compact" || allPhotos.length <= 1) return;

    let lastScrollY = window.scrollY;
    let scrollAccum = 0;
    const threshold = 400; // pixels of scroll before next image

    const handleScroll = () => {
      const delta = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      scrollAccum += delta;

      if (scrollAccum >= threshold) {
        scrollAccum = 0;
        setPhotoIndex((prev) => {
          const next = (prev + 1) % allPhotos.length;

          // Crossfade to next photo
          preloadPhoto(allPhotos[next]).then((src) => {
            if (src) {
              setNextPhoto(src);
              setCrossfade(true);
              setTimeout(() => {
                setCurrentPhoto(src);
                setNextPhoto(null);
                setCrossfade(false);
              }, 800);
            }
          });

          return next;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [phase, allPhotos]);

  // ── Cleanup ───────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  // ── Don't render if idle ──────────────────────────────────────────────
  if (phase === "idle") return null;

  const isFullscreen = phase === "reveal";
  const isCompact = phase === "compact";

  return (
    <>
      {/* Fullscreen black backdrop for cinematic reveal */}
      {isFullscreen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000",
            zIndex: 50,
            animation: "fadeIn 0.3s ease forwards",
          }}
        />
      )}

      {/* Main hero container */}
      <div
        ref={containerRef}
        style={{
          position: isFullscreen ? "fixed" : "relative",
          inset: isFullscreen ? 0 : undefined,
          width: "100%",
          height: isFullscreen ? "100vh" : "220px",
          zIndex: isFullscreen ? 51 : 1,
          overflow: "hidden",
          borderRadius: isCompact ? "22px" : "0",
          marginBottom: isCompact ? "20px" : "0",
          transition: isCompact
            ? "height 0.8s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.8s ease"
            : "none",
        }}
      >
        {/* Current photo */}
        {currentPhoto && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${currentPhoto})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              animation: isFullscreen ? "photoReveal 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards" : "none",
              transform: isCompact ? "scale(1.05)" : "scale(1.15)",
              transition: "transform 12s ease-out",
              zIndex: 1,
            }}
          />
        )}

        {/* Crossfade: next photo fading in on top */}
        {nextPhoto && crossfade && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${nextPhoto})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              animation: "fadeIn 0.8s ease forwards",
              transform: "scale(1.05)",
              zIndex: 2,
            }}
          />
        )}

        {/* Dark cinematic vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isFullscreen
              ? `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.02) 30%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.85) 100%),
                 radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)`
              : `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)`,
            zIndex: 3,
            pointerEvents: "none",
          }}
        />

        {/* Category ambient glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: glow.bg,
            zIndex: 4,
            pointerEvents: "none",
            opacity: 0.5,
          }}
        />

        {/* 3D Scan overlay — only during reveal */}
        {isFullscreen && <ScanOverlay glowColor={glow.primary} />}

        {/* Scanning status — fullscreen mode */}
        {isFullscreen && (
          <div
            style={{
              position: "absolute",
              bottom: "15%",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              textAlign: "center",
              animation: "fadeInUp 0.8s ease 0.5s both",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "999px",
                padding: "10px 22px",
              }}
            >
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: glow.primary,
                boxShadow: `0 0 12px ${glow.primary}`,
                animation: "pulse 1.2s ease-in-out infinite",
              }} />
              <span style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.85rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}>
                Scanning safety database
              </span>
            </div>

            {/* Product label */}
            <p style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: "0.78rem",
              marginTop: "14px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              {query}
            </p>
          </div>
        )}

        {/* Compact mode: small label */}
        {isCompact && (
          <div
            style={{
              position: "absolute",
              bottom: "14px",
              left: "18px",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: glow.primary,
              boxShadow: `0 0 8px ${glow.primary}`,
            }} />
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", fontWeight: 600 }}>
              {query}
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.68rem" }}>
              {category === "vehicle" ? "NHTSA" : category === "consumer" ? "CPSC" : "FDA"}
            </span>
            {allPhotos.length > 1 && (
              <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.65rem" }}>
                {photoIndex + 1}/{allPhotos.length}
              </span>
            )}
          </div>
        )}

        {/* Scroll hint in compact mode */}
        {isCompact && allPhotos.length > 1 && (
          <div style={{
            position: "absolute",
            bottom: "14px",
            right: "18px",
            zIndex: 10,
            color: "rgba(255,255,255,0.2)",
            fontSize: "0.65rem",
          }}>
            scroll for more
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes photoReveal {
          0%   { opacity: 0; transform: scale(1.25); filter: brightness(0.3); }
          40%  { opacity: 1; }
          100% { opacity: 1; transform: scale(1.15); filter: brightness(0.85); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(1.6); }
        }
      `}</style>
    </>
  );
}
