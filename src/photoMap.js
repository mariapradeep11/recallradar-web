/* ═══════════════════════════════════════════════════════════════════════════════
   RecallRadar — Photo Map Configuration
   
   HOW TO ADD/SWAP PHOTOS:
   1. Drop your photo into /public/images/{category}/
   2. Add or edit a keyword entry below
   3. That's it — the app picks it up instantly
   ═══════════════════════════════════════════════════════════════════════════════ */

const PHOTO_BASE = "/images/";

// ─── Multi-photo sets ────────────────────────────────────────────────────────
// Keywords that have multiple photos cycle through them on scroll
const keywordPhotoSets = {
  "chicken": [
    "chicken/chicken-01.jpg",
    "chicken/chicken-02.jpg",
    "chicken/chicken-03.jpg",
    "chicken/chicken-04.jpg",
    "chicken/chicken-05.jpg",
    "chicken/chicken-06.jpg",
    "chicken/chicken-07.jpg",
  ],
  "chicken breast": ["chicken/chicken-06.jpg", "chicken/chicken-03.jpg"],
  "poultry":        ["chicken/chicken-02.jpg", "chicken/chicken-04.jpg", "chicken/chicken-07.jpg"],
  "rotisserie":     ["chicken/chicken-05.jpg", "chicken/chicken-01.jpg"],
  "turkey":         ["chicken/chicken-03.jpg", "chicken/chicken-06.jpg"],
  "hen":            ["chicken/chicken-04.jpg", "chicken/chicken-07.jpg"],
  "drumstick":      ["chicken/chicken-07.jpg", "chicken/chicken-01.jpg"],

  "milk":           ["milk/milk-01.jpg", "milk/milk-02.jpg", "milk/milk-03.jpg", "milk/milk-04.jpg"],
  "dairy":          ["milk/milk-02.jpg", "milk/milk-04.jpg"],
  "cookies":        ["milk/milk-03.jpg"],
  "cookie":         ["milk/milk-03.jpg"],
  "cream":          ["milk/milk-04.jpg"],

  // TODO: add more as you drop photos in
  // "cheese": ["cheese/cheese-01.jpg", "cheese/cheese-02.jpg"],
  // "beef":   ["beef/beef-01.jpg"],
  // "toyota": ["vehicles/toyota-01.jpg", "vehicles/toyota-02.jpg"],
};

// ─── Category fallback photo sets ────────────────────────────────────────────
const categoryFallbackSets = {
  food:     ["chicken/chicken-01.jpg", "chicken/chicken-05.jpg", "milk/milk-01.jpg"],
  drug:     ["chicken/chicken-01.jpg"],   // TODO: add medicine photos
  device:   ["chicken/chicken-01.jpg"],   // TODO: add device photos
  consumer: ["chicken/chicken-01.jpg"],   // TODO: add consumer photos
  vehicle:  ["chicken/chicken-01.jpg"],   // TODO: add vehicle photos
};

// ─── Category ambient glow colours ───────────────────────────────────────────
export const categoryGlow = {
  food:     { primary: "#ff6040", secondary: "#ffb090", bg: "radial-gradient(ellipse at top center, rgba(255,96,64,0.12) 0%, transparent 60%)" },
  drug:     { primary: "#4488ff", secondary: "#80bbff", bg: "radial-gradient(ellipse at top center, rgba(68,136,255,0.1) 0%, transparent 60%)" },
  device:   { primary: "#0a84ff", secondary: "#60ccff", bg: "radial-gradient(ellipse at top center, rgba(10,132,255,0.1) 0%, transparent 60%)" },
  consumer: { primary: "#bf5af2", secondary: "#d890ff", bg: "radial-gradient(ellipse at top center, rgba(191,90,242,0.1) 0%, transparent 60%)" },
  vehicle:  { primary: "#30d158", secondary: "#80e8a0", bg: "radial-gradient(ellipse at top center, rgba(48,209,88,0.08) 0%, transparent 60%)" },
};

// ─── Resolve single best photo ───────────────────────────────────────────────
export function resolvePhoto(query = "", category = "food") {
  const photos = resolveAllPhotos(query, category);
  return photos[0] || PHOTO_BASE + "chicken/chicken-01.jpg";
}

// ─── Resolve ALL photos for a query (for scroll rotation) ────────────────────
export function resolveAllPhotos(query = "", category = "food") {
  const q = query.toLowerCase().trim();
  const sorted = Object.keys(keywordPhotoSets).sort((a, b) => b.length - a.length);

  for (const keyword of sorted) {
    if (q.includes(keyword)) {
      return keywordPhotoSets[keyword].map((p) => PHOTO_BASE + p);
    }
  }

  // Fallback to category set
  const fallback = categoryFallbackSets[category] || categoryFallbackSets.food;
  return fallback.map((p) => PHOTO_BASE + p);
}

// ─── Preload a photo ─────────────────────────────────────────────────────────
export function preloadPhoto(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export default resolvePhoto;
