/* ═══════════════════════════════════════════════════════════════════════════════
   RecallRadar — Photo Map Configuration
   
   HOW TO ADD/SWAP PHOTOS:
   1. Drop your photo into /public/photos/
   2. Add or edit a keyword entry below
   3. That's it — the app picks it up instantly
   
   NAMING CONVENTION:
   /public/photos/{keyword}.jpg  (e.g. chicken.jpg, milk.jpg, tylenol.jpg)
   
   RULES:
   - Dark backgrounds work best (the app overlays scan effects on top)
   - Landscape orientation preferred for hero (portrait works but crops)
   - Keep file sizes under 500KB for fast load (compress with squoosh.app)
   - All Unsplash photos are free for commercial use, no attribution required
   ═══════════════════════════════════════════════════════════════════════════════ */

const PHOTO_BASE = "/photos/";

// ─── Per-keyword photo map ───────────────────────────────────────────────────
// Each entry: keyword → filename in /public/photos/
// The matcher checks if the search query CONTAINS the keyword (case-insensitive)
// More specific keywords should come first (e.g. "chicken breast" before "chicken")


const departmentKeywords = {
  food_meat: [
    "meat",
    "beef",
    "steak",
    "burger",
    "ham",
    "pork",
  ],

  food_poultry: [
    "chicken",
    "poultry",
    "turkey",
    "nuggets",
    "wings",
  ],

  food_dairy: [
    "milk",
    "cheese",
    "yogurt",
    "cream",
    "butter",
  ],

  food_drinks: [
    "coke",
    "pepsi",
    "drink",
    "juice",
    "soda",
    "water",
  ],

  food_sauces: [
    "ketchup",
    "sauce",
    "mustard",
    "mayo",
    "condiment",
  ],

  medicine_pain_relief: [
    "tylenol",
    "ibuprofen",
    "advil",
    "pain",
    "acetaminophen",
  ],

  consumer_kitchen: [
    "air fryer",
    "blender",
    "toaster",
    "microwave",
  ],

  consumer_baby: [
    "stroller",
    "crib",
    "baby",
    "toddler",
    "kids",
  ],
};

const keywordPhotos = {
  // Food
  "chicken breast": "chicken-raw.jpg",
  "chicken":        "chicken.jpg",
  "poultry":        "chicken.jpg",
  "rotisserie":     "chicken-cooked.jpg",
  "milk":           "milk.jpg",
  "dairy":          "milk.jpg",
  "cheese":         "cheese.jpg",
  "eggs":           "eggs.jpg",
  "egg":            "eggs.jpg",
  "beef":           "beef.jpg",
  "steak":          "beef.jpg",
  "ground beef":    "beef.jpg",
  "pork":           "pork.jpg",
  "fish":           "fish.jpg",
  "salmon":         "fish.jpg",
  "shrimp":         "fish.jpg",
  "seafood":        "fish.jpg",
  "cereal":         "cereal.jpg",
  "bread":          "bread.jpg",
  "candy":          "candy.jpg",
  "chocolate":      "candy.jpg",
  "cookie":         "cookies.jpg",
  "cookies":        "cookies.jpg",
  "lettuce":        "produce.jpg",
  "spinach":        "produce.jpg",
  "salad":          "produce.jpg",
  "carrot":         "produce.jpg",
  "fruit":          "fruit.jpg",
  "apple":          "fruit.jpg",
  "berry":          "fruit.jpg",
  "juice":          "juice.jpg",
  "water":          "water.jpg",
  "baby food":      "baby-food.jpg",
  "infant formula": "formula.jpg",
  "formula":        "formula.jpg",
  "ice cream":      "ice-cream.jpg",
  "frozen":         "frozen.jpg",
  "snack":          "snacks.jpg",
  "chips":          "snacks.jpg",
  "nuts":           "nuts.jpg",
  "peanut":         "nuts.jpg",
  "almond":         "nuts.jpg",

  // Medicine
  "tylenol":        "pills.jpg",
  "advil":          "pills.jpg",
  "ibuprofen":      "pills.jpg",
  "aspirin":        "pills.jpg",
  "pill":           "pills.jpg",
  "tablet":         "pills.jpg",
  "capsule":        "pills.jpg",
  "vitamin":        "vitamins.jpg",
  "supplement":     "vitamins.jpg",
  "insulin":        "insulin.jpg",
  "antibiotic":     "medicine.jpg",
  "prescription":   "medicine.jpg",
  "drug":           "medicine.jpg",
  "syrup":          "medicine.jpg",
  "cream":          "cream.jpg",
  "ointment":       "cream.jpg",

  // Devices
  "syringe":        "syringe.jpg",
  "needle":         "syringe.jpg",
  "implant":        "implant.jpg",
  "pacemaker":      "implant.jpg",
  "catheter":       "device.jpg",
  "pump":           "device.jpg",
  "monitor":        "monitor.jpg",
  "ventilator":     "device.jpg",
  "defibrillator":  "device.jpg",
  "test kit":       "test-kit.jpg",
  "glucometer":     "device.jpg",

  // Consumer products
  "air fryer":      "air-fryer.jpg",
  "toaster":        "toaster.jpg",
  "stroller":       "stroller.jpg",
  "crib":           "crib.jpg",
  "car seat":       "car-seat.jpg",
  "heater":         "heater.jpg",
  "fan":            "fan.jpg",
  "charger":        "charger.jpg",
  "battery":        "battery.jpg",
  "toy":            "toys.jpg",
  "stool":          "furniture.jpg",
  "chair":          "furniture.jpg",
  "furniture":      "furniture.jpg",
  "helmet":         "helmet.jpg",
  "bike":           "bike.jpg",

  // Vehicles
  "toyota":         "toyota.jpg",
  "honda":          "honda.jpg",
  "ford":           "ford.jpg",
  "tesla":          "tesla.jpg",
  "chevrolet":      "chevy.jpg",
  "chevy":          "chevy.jpg",
  "bmw":            "bmw.jpg",
  "mercedes":       "mercedes.jpg",
  "nissan":         "nissan.jpg",
  "hyundai":        "hyundai.jpg",
  "kia":            "kia.jpg",
  "subaru":         "subaru.jpg",
  "jeep":           "jeep.jpg",
  "ram":            "truck.jpg",
  "truck":          "truck.jpg",
  "suv":            "suv.jpg",
  "sedan":          "sedan.jpg",
  "airbag":         "car-interior.jpg",
  "brake":          "car-parts.jpg",
  "tire":           "tire.jpg",
};

// ─── Category fallback photos ────────────────────────────────────────────────
// Shown when no keyword matches — one per category
const categoryFallbackPhotos = {
  food:     "food-generic.jpg",
  drug:     "medicine-generic.jpg",
  device:   "device-generic.jpg",
  consumer: "consumer-generic.jpg",
  vehicle:  "vehicle-generic.jpg",
};

// ─── Category ambient glow colours ───────────────────────────────────────────
// These tint the background when results load
export const categoryGlow = {
  food:     { primary: "#ff6040", secondary: "#ffb090", bg: "radial-gradient(ellipse at top center, rgba(255,96,64,0.12) 0%, transparent 60%)" },
  drug:     { primary: "#4488ff", secondary: "#80bbff", bg: "radial-gradient(ellipse at top center, rgba(68,136,255,0.1) 0%, transparent 60%)" },
  device:   { primary: "#0a84ff", secondary: "#60ccff", bg: "radial-gradient(ellipse at top center, rgba(10,132,255,0.1) 0%, transparent 60%)" },
  consumer: { primary: "#bf5af2", secondary: "#d890ff", bg: "radial-gradient(ellipse at top center, rgba(191,90,242,0.1) 0%, transparent 60%)" },
  vehicle:  { primary: "#30d158", secondary: "#80e8a0", bg: "radial-gradient(ellipse at top center, rgba(48,209,88,0.08) 0%, transparent 60%)" },
};

// ─── Main resolver function ──────────────────────────────────────────────────
// Call this with the search query and category to get the right photo URL

export function resolvePhoto(query = "", category = "food") {
  const q = query.toLowerCase().trim();

  // 1. Try exact keyword matches (longer keywords first for specificity)
  const sortedKeywords = Object.keys(keywordPhotos).sort((a, b) => b.length - a.length);

  for (const keyword of sortedKeywords) {
    if (q.includes(keyword)) {
      return PHOTO_BASE + keywordPhotos[keyword];
    }
  }

  // 2. Fall back to category generic
  const fallback = categoryFallbackPhotos[category];
  if (fallback) {
    return PHOTO_BASE + fallback;
  }

  // 3. Ultimate fallback
  return PHOTO_BASE + "food-generic.jpg";
}

// ─── Check if a photo actually exists (preload) ──────────────────────────────
export function preloadPhoto(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export default resolvePhoto;
