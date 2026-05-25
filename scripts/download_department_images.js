import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PHOTOS_PER_DEPARTMENT = 8;

if (!PEXELS_API_KEY) {
  console.error("Missing PEXELS_API_KEY");
  process.exit(1);
}

const departments = {
  // FOOD
  food_meat: ["premium raw meat black background", "steak dark food photography", "butcher meat studio black"],
  food_poultry: ["chicken black background", "poultry dark food photography", "raw chicken studio dark"],
  food_seafood: ["seafood dark background", "fish black background", "shrimp dark food photography"],
  food_dairy: ["milk dairy black background", "cheese dark food photography", "yogurt dark product photography"],
  food_eggs: ["eggs black background", "egg carton dark background"],
  food_drinks: ["soft drink black background", "beverage dark product photography", "soda can dark background"],
  food_water: ["water bottle black background", "clear water bottle dark background"],
  food_sauces: ["ketchup sauce black background", "condiments dark photography", "sauce bottle dark product"],
  food_snacks: ["chips snacks black background", "snack food dark background", "crackers dark photography"],
  food_candy: ["candy black background", "chocolate dark photography", "gummy candy dark background"],
  food_bakery: ["bread bakery black background", "pastry dark food photography", "cake dark background"],
  food_frozen: ["frozen food dark background", "ice cream black background", "frozen meal dark photography"],
  food_produce: ["vegetables black background", "fresh produce dark photography", "fruit dark background"],
  food_canned: ["canned food black background", "tin can dark product photography"],
  food_baby: ["baby food jar black background", "baby food dark product photography"],
  food_cereal: ["cereal bowl dark background", "breakfast cereal black background"],
  food_spices: ["spices black background", "seasoning dark food photography"],
  food_nuts: ["nuts black background", "trail mix dark food photography"],

  // MEDICINE
  medicine_pain_relief: ["medicine pills black background", "pain relief tablets dark", "pill bottle dark product"],
  medicine_cold_flu: ["cold medicine black background", "cough syrup dark product", "medicine syrup bottle dark"],
  medicine_vitamins: ["vitamins pills black background", "supplements dark photography", "vitamin bottle black background"],
  medicine_skin: ["skincare bottle black background", "cream jar dark product photography", "ointment tube dark background"],
  medicine_eye_ear: ["eye drops black background", "ear drops medicine dark product"],
  medicine_first_aid: ["first aid kit black background", "bandage dark product photography"],
  medicine_generic: ["pharmaceutical bottle black background", "medicine bottle dark", "capsules dark background"],

  // MEDICAL DEVICE
  device_syringe: ["syringe black background", "medical syringe dark photography"],
  device_monitoring: ["blood pressure monitor black background", "medical device dark product"],
  device_implant: ["medical implant dark background", "surgical device black background"],
  device_diagnostic: ["thermometer black background", "diagnostic medical device dark"],

  // CONSUMER PRODUCTS
  consumer_baby: ["baby product black background", "stroller dark product photography", "baby crib dark room"],
  consumer_toys: ["children toys black background", "toy product dark photography"],
  consumer_kitchen: ["kitchen appliance black background", "air fryer dark product", "blender black background"],
  consumer_electronics: ["consumer electronics black background", "device dark product", "charger cable dark photography"],
  consumer_furniture: ["furniture black background", "chair dark product photography", "stool black background"],
  consumer_home: ["home safety product black background", "household product dark", "cleaning product dark background"],
  consumer_outdoor: ["outdoor equipment black background", "sports equipment dark product"],
  consumer_tools: ["power tool black background", "hand tool dark product photography"],

  // VEHICLE
  vehicle_car: ["car black background", "vehicle dark studio photography"],
  vehicle_tires: ["tire black background", "car tire dark studio"],
  vehicle_brakes: ["brake system black background", "car brake dark photography"],
  vehicle_airbag: ["steering wheel dark photography", "car interior black background"],
  vehicle_battery: ["car battery black background", "electric vehicle battery dark"],
  vehicle_lights: ["car headlights black background", "vehicle lights dark photography"],

  // GENERIC FALLBACKS
  generic_food: ["premium food black background", "dark food photography"],
  generic_product: ["product photography black background", "luxury product dark background"],
  generic_safety: ["warning sign dark background", "safety alert dark background"],
};

async function searchPexels(query, perPage = 10) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    query
  )}&per_page=${perPage}&orientation=landscape`;

  const res = await fetch(url, {
    headers: {
      Authorization: PEXELS_API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`Pexels error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.photos || [];
}

async function downloadImage(url, filepath) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Image download failed ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
}

async function main() {
  const baseDir = path.join(process.cwd(), "public", "images", "departments");
  fs.mkdirSync(baseDir, { recursive: true });

  for (const [department, queries] of Object.entries(departments)) {
    const departmentDir = path.join(baseDir, department);
    fs.mkdirSync(departmentDir, { recursive: true });

    console.log(`\nDownloading: ${department}`);

    let downloaded = 0;
    const seen = new Set();

    for (const query of queries) {
      if (downloaded >= PHOTOS_PER_DEPARTMENT) break;

      try {
        const photos = await searchPexels(query, PHOTOS_PER_DEPARTMENT);

        for (const photo of photos) {
          if (downloaded >= PHOTOS_PER_DEPARTMENT) break;
          if (seen.has(photo.id)) continue;

          seen.add(photo.id);

          const imageUrl = photo.src.large2x || photo.src.large || photo.src.original;
          const fileNumber = String(downloaded + 1).padStart(2, "0");
          const filename = `${department}-${fileNumber}.jpg`;
          const filepath = path.join(departmentDir, filename);

          await downloadImage(imageUrl, filepath);

          downloaded += 1;
          console.log(`  saved ${filename}`);
        }
      } catch (err) {
        console.error(`  failed query "${query}":`, err.message);
      }
    }

    console.log(`Finished ${department}: ${downloaded} images`);
  }

  console.log("\nDone.");
}

main();