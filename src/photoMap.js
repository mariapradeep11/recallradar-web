/* ═══════════════════════════════════════════════════════════════════════════════
   RecallRadar — Photo Map Configuration

   HOW TO ADD/SWAP PHOTOS:
   1. Drop your photo into /public/images/{category}/
   2. Or drop department photos into /public/images/departments/{department}/
   3. Add/edit keyword entries below
   4. That's it — the app picks it up instantly
   ═══════════════════════════════════════════════════════════════════════════════ */

const PHOTO_BASE = "/images/";

// ─── Existing multi-photo sets ───────────────────────────────────────────────
const keywordPhotoSets = {
  chicken: [
    "chicken/chicken-01.jpg",
    "chicken/chicken-02.jpg",
    "chicken/chicken-03.jpg",
    "chicken/chicken-04.jpg",
    "chicken/chicken-05.jpg",
    "chicken/chicken-06.jpg",
    "chicken/chicken-07.jpg",
  ],
  "chicken breast": ["chicken/chicken-06.jpg", "chicken/chicken-03.jpg"],
  poultry: ["chicken/chicken-02.jpg", "chicken/chicken-04.jpg", "chicken/chicken-07.jpg"],
  rotisserie: ["chicken/chicken-05.jpg", "chicken/chicken-01.jpg"],
  turkey: ["chicken/chicken-03.jpg", "chicken/chicken-06.jpg"],
  hen: ["chicken/chicken-04.jpg", "chicken/chicken-07.jpg"],
  drumstick: ["chicken/chicken-07.jpg", "chicken/chicken-01.jpg"],

  milk: ["milk/milk-01.jpg", "milk/milk-02.jpg", "milk/milk-03.jpg", "milk/milk-04.jpg"],
  dairy: ["milk/milk-02.jpg", "milk/milk-04.jpg"],
  cookies: ["milk/milk-03.jpg"],
  cookie: ["milk/milk-03.jpg"],
  cream: ["milk/milk-04.jpg"],
};

// ─── Department folders downloaded by the Pexels script ─────────────────────
const departmentPhotoSets = {
  food_meat: rangeImages("food_meat"),
  food_poultry: rangeImages("food_poultry"),
  food_seafood: rangeImages("food_seafood"),
  food_dairy: rangeImages("food_dairy"),
  food_eggs: rangeImages("food_eggs"),
  food_drinks: rangeImages("food_drinks"),
  food_water: rangeImages("food_water"),
  food_sauces: rangeImages("food_sauces"),
  food_snacks: rangeImages("food_snacks"),
  food_candy: rangeImages("food_candy"),
  food_bakery: rangeImages("food_bakery"),
  food_frozen: rangeImages("food_frozen"),
  food_produce: rangeImages("food_produce"),
  food_canned: rangeImages("food_canned"),
  food_baby: rangeImages("food_baby"),
  food_cereal: rangeImages("food_cereal"),
  food_spices: rangeImages("food_spices"),
  food_nuts: rangeImages("food_nuts"),

  medicine_pain_relief: rangeImages("medicine_pain_relief"),
  medicine_cold_flu: rangeImages("medicine_cold_flu"),
  medicine_vitamins: rangeImages("medicine_vitamins"),
  medicine_skin: rangeImages("medicine_skin"),
  medicine_eye_ear: rangeImages("medicine_eye_ear"),
  medicine_first_aid: rangeImages("medicine_first_aid"),
  medicine_generic: rangeImages("medicine_generic"),

  device_syringe: rangeImages("device_syringe"),
  device_monitoring: rangeImages("device_monitoring"),
  device_implant: rangeImages("device_implant"),
  device_diagnostic: rangeImages("device_diagnostic"),

  consumer_baby: rangeImages("consumer_baby"),
  consumer_toys: rangeImages("consumer_toys"),
  consumer_kitchen: rangeImages("consumer_kitchen"),
  consumer_electronics: rangeImages("consumer_electronics"),
  consumer_furniture: rangeImages("consumer_furniture"),
  consumer_home: rangeImages("consumer_home"),
  consumer_outdoor: rangeImages("consumer_outdoor"),
  consumer_tools: rangeImages("consumer_tools"),

  vehicle_car: rangeImages("vehicle_car"),
  vehicle_tires: rangeImages("vehicle_tires"),
  vehicle_brakes: rangeImages("vehicle_brakes"),
  vehicle_airbag: rangeImages("vehicle_airbag"),
  vehicle_battery: rangeImages("vehicle_battery"),
  vehicle_lights: rangeImages("vehicle_lights"),

  generic_food: rangeImages("generic_food"),
  generic_product: rangeImages("generic_product"),
  generic_safety: rangeImages("generic_safety"),
};

// ─── Department keyword routing ──────────────────────────────────────────────
const departmentKeywords = {
  food_poultry: ["chicken", "poultry", "turkey", "hen", "drumstick", "wings", "nuggets", "rotisserie"],
  food_meat: ["beef", "steak", "pork", "ham", "bacon", "sausage", "meat", "burger", "ground beef"],
  food_seafood: ["fish", "salmon", "tuna", "shrimp", "seafood", "crab", "lobster", "sardine"],
  food_dairy: ["milk", "cheese", "yogurt", "cream", "butter", "dairy", "ice cream"],
  food_eggs: ["egg", "eggs", "egg carton"],
  food_drinks: ["drink", "beverage", "soda", "juice", "cola", "coke", "pepsi", "tea", "coffee"],
  food_water: ["water", "bottled water", "sparkling water"],
  food_sauces: ["ketchup", "sauce", "mustard", "mayo", "mayonnaise", "condiment", "dressing", "dip", "salsa"],
  food_snacks: ["chips", "crackers", "snack", "pretzel", "popcorn", "granola", "bar"],
  food_candy: ["candy", "chocolate", "gummy", "gum", "sweet", "caramel"],
  food_bakery: ["bread", "cake", "pastry", "muffin", "bagel", "donut", "bakery"],
  food_frozen: ["frozen", "frozen meal", "pizza", "ice cream"],
  food_produce: ["lettuce", "spinach", "vegetable", "fruit", "apple", "banana", "tomato", "onion", "produce"],
  food_canned: ["can", "canned", "tin", "soup", "beans"],
  food_baby: ["baby food", "infant food", "formula"],
  food_cereal: ["cereal", "oats", "breakfast"],
  food_spices: ["spice", "seasoning", "pepper", "salt", "powder"],
  food_nuts: ["nut", "nuts", "almond", "peanut", "cashew", "trail mix"],

  medicine_pain_relief: ["tylenol", "advil", "ibuprofen", "acetaminophen", "aspirin", "pain relief"],
  medicine_cold_flu: ["cold", "flu", "cough", "syrup", "decongestant", "nyquil", "dayquil"],
  medicine_vitamins: ["vitamin", "supplement", "multivitamin", "mineral"],
  medicine_skin: ["cream", "ointment", "lotion", "skin", "acne", "sunscreen"],
  medicine_eye_ear: ["eye drop", "ear drop", "contact lens"],
  medicine_first_aid: ["bandage", "first aid", "gauze", "antiseptic"],
  medicine_generic: ["medicine", "drug", "tablet", "capsule", "pill", "pharmaceutical"],

  device_syringe: ["syringe", "needle", "injector"],
  device_monitoring: ["blood pressure", "glucose", "monitor", "pulse oximeter"],
  device_implant: ["implant", "pacemaker", "surgical"],
  device_diagnostic: ["thermometer", "diagnostic", "test kit"],

  consumer_baby: ["baby", "toddler", "crib", "stroller", "car seat", "high chair", "kids"],
  consumer_toys: ["toy", "doll", "game", "children"],
  consumer_kitchen: ["air fryer", "blender", "toaster", "microwave", "pressure cooker", "appliance"],
  consumer_electronics: ["battery", "charger", "phone", "electronics", "cable", "adapter"],
  consumer_furniture: ["chair", "stool", "table", "dresser", "furniture"],
  consumer_home: ["cleaner", "detergent", "household", "home", "smoke alarm"],
  consumer_outdoor: ["bike", "helmet", "sports", "outdoor", "grill"],
  consumer_tools: ["tool", "drill", "saw", "power tool"],

  vehicle_tires: ["tire", "tires"],
  vehicle_brakes: ["brake", "brakes"],
  vehicle_airbag: ["airbag", "air bag", "air bags", "steering wheel", "occupant classification", "ocs", "passenger air bag"],
  vehicle_battery: ["battery", "electric vehicle", "ev"],
  vehicle_lights: ["headlight", "tail light", "lamp"],
  vehicle_car: ["car", "vehicle", "toyota", "honda", "ford", "tesla", "mazda", "chevrolet", "bmw"],
};

// ─── Category fallback photo sets ────────────────────────────────────────────
const categoryFallbackSets = {
  food: departmentPhotoSets.generic_food.length
    ? departmentPhotoSets.generic_food
    : ["chicken/chicken-01.jpg", "chicken/chicken-05.jpg", "milk/milk-01.jpg"],

  drug: departmentPhotoSets.medicine_generic.length
    ? departmentPhotoSets.medicine_generic
    : ["chicken/chicken-01.jpg"],

  device: departmentPhotoSets.device_diagnostic.length
    ? departmentPhotoSets.device_diagnostic
    : ["chicken/chicken-01.jpg"],

  consumer: departmentPhotoSets.generic_product.length
    ? departmentPhotoSets.generic_product
    : ["chicken/chicken-01.jpg"],

  vehicle: departmentPhotoSets.vehicle_car.length
    ? departmentPhotoSets.vehicle_car
    : ["chicken/chicken-01.jpg"],
};

// ─── Category ambient glow colours ───────────────────────────────────────────
export const categoryGlow = {
  food: { primary: "#ff6040", secondary: "#ffb090", bg: "radial-gradient(ellipse at top center, rgba(255,96,64,0.12) 0%, transparent 60%)" },
  drug: { primary: "#4488ff", secondary: "#80bbff", bg: "radial-gradient(ellipse at top center, rgba(68,136,255,0.1) 0%, transparent 60%)" },
  device: { primary: "#0a84ff", secondary: "#60ccff", bg: "radial-gradient(ellipse at top center, rgba(10,132,255,0.1) 0%, transparent 60%)" },
  consumer: { primary: "#bf5af2", secondary: "#d890ff", bg: "radial-gradient(ellipse at top center, rgba(191,90,242,0.1) 0%, transparent 60%)" },
  vehicle: { primary: "#30d158", secondary: "#80e8a0", bg: "radial-gradient(ellipse at top center, rgba(48,209,88,0.08) 0%, transparent 60%)" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function rangeImages(department, count = 15) {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return `departments/${department}/${department}-${n}.jpg`;
  });
}

function toPublicPaths(paths = []) {
  return paths.map((p) => (p.startsWith("/") ? p : PHOTO_BASE + p));
}

function resolveDepartment(query = "") {
  const q = query.toLowerCase().trim();

  for (const [department, keywords] of Object.entries(departmentKeywords)) {
    if (keywords.some((keyword) => q.includes(keyword))) {
      return department;
    }
  }

  return null;
}

// ─── Resolve single best photo ───────────────────────────────────────────────
export function resolvePhoto(query = "", category = "food") {
  const photos = resolveAllPhotos(query, category);
  return photos[0] || PHOTO_BASE + "chicken/chicken-01.jpg";
}

// ─── Resolve ALL photos for a query ──────────────────────────────────────────
export function resolveAllPhotos(query = "", category = "food") {
  const q = query.toLowerCase().trim();

  // 1. Preserve your existing exact/manual keyword behavior first
  const sorted = Object.keys(keywordPhotoSets).sort((a, b) => b.length - a.length);

  for (const keyword of sorted) {
    if (q.includes(keyword)) {
      return toPublicPaths(keywordPhotoSets[keyword]);
    }
  }

  // 2. New department-based behavior
  const department = resolveDepartment(q);

  if (department && departmentPhotoSets[department]?.length) {
    return toPublicPaths(departmentPhotoSets[department]);
  }

  // 3. Fallback by selected category
  const fallback = categoryFallbackSets[category] || categoryFallbackSets.food;
  return toPublicPaths(fallback);
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
