import { useState, useEffect, useRef, useMemo } from "react";
import { resolveAllPhotos, preloadPhoto, categoryGlow } from "./photoMap.js";

/* ═══════════════════════════════════════════════════════════════════════════════
   FLOATING PHOTOS BACKGROUND
   
   Multiple product photos float, slowly drift, rotate, and scale
   behind translucent glass result cards. Creates depth and premium feel.
   Photos crossfade in and out on a staggered loop.
   ═══════════════════════════════════════════════════════════════════════════════ */

// Random float in range
const rand = (min, max) => Math.random() * (max - min) + min;

// Generate random initial positions for floating photos
function generateSlots(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rand(5, 85),         // % from left
    y: rand(5, 80),         // % from top
    scale: rand(0.55, 0.9),
    rotation: rand(-12, 12), // degrees
    delay: rand(0, 4),       // animation delay
    duration: rand(18, 30),  // drift cycle duration
    driftX: rand(-6, 6),     // how far to drift horizontally
    driftY: rand(-4, 4),     // how far to drift vertically
    opacity: rand(0.06, 0.14),
  }));
}

export default function FloatingPhotos({
  query = "",
  category = "food",
  visible = false,
}) {
  const [photos, setPhotos] = useState([]);
  const [loaded, setLoaded] = useState([]);
  const slots = useMemo(() => generateSlots(5), []);
  const glow = categoryGlow[category] || categoryGlow.food;

  // Load photos when query changes
  useEffect(() => {
    if (!visible || !query.trim()) {
      setPhotos([]);
      setLoaded([]);
      return;
    }

    const allPhotos = resolveAllPhotos(query, category);
    // Take up to 5 photos, repeat if needed
    const expanded = [];
    for (let i = 0; i < 5; i++) {
      expanded.push(allPhotos[i % allPhotos.length]);
    }

    // Preload all
    Promise.all(expanded.map((src) => preloadPhoto(src))).then((results) => {
      setPhotos(expanded);
      setLoaded(results.filter(Boolean));
    });
  }, [query, category, visible]);

  if (!visible || loaded.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Dark base so photos don't make text unreadable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at top, #10080c 0%, #0a0c14 30%, #060608 100%)",
          zIndex: 0,
        }}
      />

      {/* Category ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: glow.bg,
          opacity: 0.7,
          zIndex: 1,
        }}
      />

      {/* Floating photos */}
      {slots.map((slot, i) => {
        const src = loaded[i % loaded.length];
        if (!src) return null;

        return (
          <div
            key={slot.id}
            style={{
              position: "absolute",
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              width: "clamp(180px, 22vw, 320px)",
              height: "clamp(130px, 16vw, 230px)",
              borderRadius: "18px",
              overflow: "hidden",
              opacity: slot.opacity,
              transform: `scale(${slot.scale}) rotate(${slot.rotation}deg)`,
              animation: `floatDrift${i} ${slot.duration}s ease-in-out ${slot.delay}s infinite alternate`,
              zIndex: 2,
              filter: "blur(1px) saturate(0.7)",
            }}
          >
            <img
              src={src}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        );
      })}

      {/* Overlay to ensure text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(to bottom, rgba(6,6,8,0.75) 0%, rgba(6,6,8,0.55) 30%, rgba(6,6,8,0.65) 70%, rgba(6,6,8,0.9) 100%)
          `,
          zIndex: 3,
        }}
      />

      {/* Unique keyframes for each floating photo */}
      <style>{`
        ${slots.map((slot, i) => `
          @keyframes floatDrift${i} {
            0% {
              transform: scale(${slot.scale}) rotate(${slot.rotation}deg) translate(0px, 0px);
            }
            50% {
              transform: scale(${slot.scale * 1.05}) rotate(${slot.rotation + rand(-3, 3)}deg) translate(${slot.driftX}px, ${slot.driftY}px);
            }
            100% {
              transform: scale(${slot.scale}) rotate(${slot.rotation - rand(-2, 2)}deg) translate(${-slot.driftX * 0.5}px, ${-slot.driftY * 0.5}px);
            }
          }
        `).join("\n")}
      `}</style>
    </div>
  );
}
