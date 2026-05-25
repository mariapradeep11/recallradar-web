import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { resolveAllPhotos, preloadPhoto, categoryGlow } from "./photoMap.js";

function ScanRings({ color = "#ff3b30" }) {
  const group = useRef();

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.z = state.clock.elapsedTime * 0.18;
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.25;
  });

  return (
    <group ref={group}>
      {[1.05, 1.45, 1.85].map((radius, i) => (
        <mesh key={radius} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.006, 8, 128]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.42 - i * 0.09}
          />
        </mesh>
      ))}

      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={80}
            itemSize={3}
            array={
              new Float32Array(
                Array.from({ length: 240 }, () => (Math.random() - 0.5) * 4)
              )
            }
          />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.025} transparent opacity={0.45} />
      </points>
    </group>
  );
}

function ScanCanvas({ color }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{
        position: "absolute",
        inset: 0,
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      <Suspense fallback={null}>
        <ScanRings color={color} />
        <Stars radius={40} depth={20} count={180} factor={1.2} fade />
      </Suspense>
    </Canvas>
  );
}

export default function PhotoHero({
  query = "",
  category = "food",
  hasResults = false,
  isSearching = false,
}) {
  const [photo, setPhoto] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const glow = categoryGlow[category] || categoryGlow.food;

  const photos = useMemo(() => {
    return resolveAllPhotos(query || category, category);
  }, [query, category]);

  useEffect(() => {
    const first = photos[0];
    if (!first) return;

    preloadPhoto(first).then((src) => {
      if (src) setPhoto(src);
    });

    setPhotoIndex(0);
  }, [photos]);

  useEffect(() => {
    if (photos.length <= 1) return;

    const onScroll = () => {
      const y = window.scrollY;
      setScrollY(y);

      const nextIndex = Math.floor(y / 520) % photos.length;
      if (nextIndex !== photoIndex) {
        preloadPhoto(photos[nextIndex]).then((src) => {
          if (src) {
            setPhoto(src);
            setPhotoIndex(nextIndex);
          }
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [photos, photoIndex]);

  if (!query && !isSearching && !hasResults) return null;

  return (
    <section
      style={{
        position: "relative",
        minHeight: hasResults ? "420px" : "520px",
        marginTop: "-20px",
        marginBottom: hasResults ? "-280px" : "-180px",
        borderRadius: "0 0 42px 42px",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {photo && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${photo})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: `scale(1.08) translateY(${scrollY * -0.035}px)`,
            transition: "background-image 0.8s ease, transform 0.2s linear",
            zIndex: 1,
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.72) 34%, rgba(0,0,0,0.2) 64%, rgba(0,0,0,0.88) 100%)",
          zIndex: 2,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 68% 44%, rgba(255,255,255,0.12), transparent 14%), radial-gradient(circle at 72% 45%, rgba(255,59,48,0.22), transparent 28%)",
          zIndex: 3,
          mixBlendMode: "screen",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: "8%",
          top: "23%",
          width: "420px",
          height: "420px",
          zIndex: 4,
          opacity: 0.95,
        }}
      >
        <ScanCanvas color={glow.primary} />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 6,
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "36px 28px 90px",
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          gap: "40px",
          alignItems: "center",
        }}
      >
        <div>
          <p
            style={{
              color: glow.primary,
              letterSpacing: "0.22em",
              fontSize: "0.72rem",
              fontWeight: 800,
              marginBottom: "24px",
            }}
          >
            KNOW BEFORE IT HURTS YOU
          </p>

          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(2.7rem, 5.4vw, 5.4rem)",
              lineHeight: 0.94,
              letterSpacing: "-0.06em",
              fontWeight: 400,
              margin: 0,
              maxWidth: "690px",
            }}
          >
            Real-time recall intelligence.
            <br />
            For everything you bring home.
          </h1>

          <p
            style={{
              marginTop: "28px",
              color: "rgba(255,255,255,0.58)",
              maxWidth: "430px",
              fontSize: "1rem",
              lineHeight: 1.65,
            }}
          >
            Scan a barcode or search a product to see if it has been recalled,
            why it matters, and what to do next.
          </p>
        </div>

        <div
          style={{
            justifySelf: "end",
            alignSelf: "center",
            width: "320px",
            display: "grid",
            gap: "18px",
            color: "rgba(255,255,255,0.75)",
            fontSize: "0.78rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          <div>
            <strong style={{ color: "#fff" }}>Product detected</strong>
            <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.45)" }}>
              93% confidence
            </p>
          </div>

          <div
            style={{
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
            }}
          />

          <div>
            <strong style={{ color: "#fff" }}>
              {query || "Product scan"}
            </strong>
            <p style={{ margin: "6px 0 0", color: glow.primary }}>
              Safety database match
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}