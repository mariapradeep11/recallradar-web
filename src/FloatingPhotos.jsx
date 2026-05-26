import { useState, useEffect, useMemo } from "react";
import { resolveAllPhotos, preloadPhoto, categoryGlow } from "./photoMap.js";

const rand = (min, max) => Math.random() * (max - min) + min;

function generateSlots() {
  const left = [
    { x: -4, y: 8,   w: 150, h: 110, rot: -7, op: 0.09, dur: 22, del: 0 },
    { x: 2,  y: 32,  w: 120, h: 90,  rot: 5,  op: 0.07, dur: 26, del: 1.5 },
    { x: -2, y: 58,  w: 130, h: 95,  rot: -4, op: 0.06, dur: 20, del: 3 },
  ];
  const right = [
    { x: 82, y: 12,  w: 140, h: 100, rot: 6,  op: 0.08, dur: 24, del: 0.8 },
    { x: 86, y: 40,  w: 110, h: 80,  rot: -5, op: 0.06, dur: 28, del: 2 },
    { x: 80, y: 65,  w: 125, h: 90,  rot: 3,  op: 0.05, dur: 21, del: 3.5 },
  ];
  return [...left, ...right].map((s, i) => ({ ...s, id: i }));
}

export default function FloatingPhotos({ query = "", category = "food", visible = false }) {
  const [loaded, setLoaded] = useState([]);
  const slots = useMemo(() => generateSlots(), []);
  const glow = categoryGlow[category] || categoryGlow.food;

  useEffect(() => {
    if (!visible || !query.trim()) { setLoaded([]); return; }
    const all = resolveAllPhotos(query, category);
    const expanded = [];
    for (let i = 0; i < 6; i++) expanded.push(all[i % all.length]);
    Promise.all(expanded.map(preloadPhoto)).then((r) => setLoaded(r.filter(Boolean)));
  }, [query, category, visible]);

  if (!visible || loaded.length === 0) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      {slots.map((s, i) => {
        const src = loaded[i % loaded.length];
        if (!src) return null;
        return (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.w}px`,
              height: `${s.h}px`,
              borderRadius: "14px",
              overflow: "hidden",
              opacity: s.op,
              transform: `rotate(${s.rot}deg)`,
              animation: `floatSide${i} ${s.dur}s ease-in-out ${s.del}s infinite alternate`,
              filter: "blur(1.5px) saturate(0.6)",
            }}
          >
            <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        );
      })}
      <style>{`
        ${slots.map((s, i) => `
          @keyframes floatSide${i} {
            0%   { transform: rotate(${s.rot}deg) translate(0px, 0px); }
            50%  { transform: rotate(${s.rot + rand(-2,2)}deg) translate(${rand(-4,4)}px, ${rand(-6,6)}px); }
            100% { transform: rotate(${s.rot - rand(-1,1)}deg) translate(${rand(-3,3)}px, ${rand(-5,5)}px); }
          }
        `).join("")}
      `}</style>
    </div>
  );
}
