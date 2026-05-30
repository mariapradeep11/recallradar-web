import { randomUUID } from "node:crypto";

const FDA_ENDPOINTS = {
  food: "https://api.fda.gov/food/enforcement.json",
  drug: "https://api.fda.gov/drug/enforcement.json",
  device: "https://api.fda.gov/device/enforcement.json",
};

const SOURCE_LABELS = {
  food: "FDA",
  drug: "FDA",
  device: "FDA",
  consumer: "CPSC",
  vehicle: "NHTSA",
};

function clean(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function json(res, status, body) {
  res.status(status).setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=900");
  return res.json(body);
}

function fdaDate(value = "") {
  return /^\d{8}$/.test(value) ? value : "";
}

function normalizeFda(record = {}, category) {
  const sourceUrl = `https://www.accessdata.fda.gov/scripts/ires/index.cfm#Event_Recall_${encodeURIComponent(record.recall_number || "")}`;
  return {
    id: `fda-${category}-${record.recall_number || record.event_id || randomUUID()}`,
    source: "FDA",
    category,
    product_description: clean(record.product_description, "Unknown product"),
    reason_for_recall: clean(record.reason_for_recall, "No reason provided"),
    recalling_firm: clean(record.recalling_firm, "Unknown"),
    report_date: fdaDate(record.report_date),
    recall_initiation_date: fdaDate(record.recall_initiation_date),
    classification: clean(record.classification, "Unknown"),
    status: clean(record.status, "Unknown"),
    distribution_pattern: clean(record.distribution_pattern),
    recall_number: clean(record.recall_number),
    url: record.recall_number ? sourceUrl : "https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts",
  };
}

function normalizeCpsc(record = {}) {
  const products = Array.isArray(record.Products) ? record.Products : [];
  const hazards = Array.isArray(record.Hazards) ? record.Hazards : [];
  const companies = Array.isArray(record.Manufacturers) ? record.Manufacturers : [];
  const remedies = Array.isArray(record.Remedies) ? record.Remedies : [];
  const incidents = Array.isArray(record.Injuries) ? record.Injuries : [];
  const productNames = products.map((item) => clean(item.Name)).filter(Boolean).join(", ");
  const hazardText = hazards.map((item) => clean(item.Name || item.HazardType || item.HazardDescription)).filter(Boolean).join("; ");
  const remedyText = remedies.map((item) => clean(item.Name)).filter(Boolean).join(", ");
  const incidentText = incidents.map((item) => clean(item.Name || item.InjuryDescription)).filter(Boolean).join("; ");

  return {
    id: `cpsc-${record.RecallID || record.RecallNumber || randomUUID()}`,
    source: "CPSC",
    category: "consumer",
    product_description: clean(productNames || record.Title, "Consumer product recall"),
    reason_for_recall: clean([hazardText, remedyText && `Remedy: ${remedyText}`, incidentText && `Incidents: ${incidentText}`].filter(Boolean).join(" "), "CPSC recall hazard reported."),
    recalling_firm: clean(companies.map((item) => item.Name).filter(Boolean).join(", "), "Unknown"),
    report_date: clean(record.RecallDate || record.LastPublishDate),
    recall_number: clean(record.RecallNumber || String(record.RecallID || "")),
    url: clean(record.URL, "https://www.cpsc.gov/Recalls"),
    status: "Published",
  };
}

function parseVehicleQuery(query = {}) {
  const raw = clean(query.query || "");
  const year = clean(query.year || raw.match(/\b(19|20)\d{2}\b/)?.[0]);
  const withoutYear = raw.replace(year, "").trim();
  const make = clean(query.make || withoutYear.split(/\s+/)[0]);
  const model = clean(query.model || withoutYear.split(/\s+/).slice(1).join(" "));
  return { year, make, model };
}

function normalizeNhtsa(record = {}, vehicle) {
  return {
    id: `nhtsa-${record.NHTSACampaignNumber || randomUUID()}`,
    source: "NHTSA",
    category: "vehicle",
    product_description: clean(`${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim(), clean(record.Model, "Vehicle recall")),
    reason_for_recall: clean(record.Summary || record.DefectConsequence || record.Conequence, "NHTSA vehicle recall detected."),
    recalling_firm: clean(record.Manufacturer, "Unknown"),
    report_date: clean(record.ReportReceivedDate || record.RecallDate),
    recall_number: clean(record.NHTSACampaignNumber),
    classification: clean(record.Component, "Vehicle"),
    status: "Published",
    url: "https://www.nhtsa.gov/recalls",
    remedy: clean(record.Remedy),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "RecallRadar/1.0 (+https://recallradar.com)",
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (response.status === 404) return { ok: true, data: { results: [], Results: [] } };
  if (!response.ok) {
    const error = new Error(`Upstream request failed with ${response.status}`);
    error.status = response.status;
    error.upstream = data;
    throw error;
  }

  return { ok: true, data };
}

async function searchFda(category, query) {
  const params = new URLSearchParams({
    search: query,
    limit: "20",
  });
  const { data } = await fetchJson(`${FDA_ENDPOINTS[category]}?${params.toString()}`);
  return (data.results || []).map((record) => normalizeFda(record, category));
}

async function searchCpsc(query) {
  const params = new URLSearchParams({
    format: "json",
    ProductName: query,
  });
  const { data } = await fetchJson(`https://www.saferproducts.gov/RestWebServices/Recall?${params.toString()}`);
  return Array.isArray(data) ? data.slice(0, 20).map(normalizeCpsc) : [];
}

async function searchNhtsa(input) {
  const vehicle = parseVehicleQuery(input);
  if (!vehicle.year || !vehicle.make || !vehicle.model) {
    return { results: [], vehicle, needsVehicleFields: true };
  }

  const params = new URLSearchParams({
    make: vehicle.make,
    model: vehicle.model,
    modelYear: vehicle.year,
  });
  const { data } = await fetchJson(`https://api.nhtsa.gov/recalls/recallsByVehicle?${params.toString()}`);
  const rows = data.results || data.Results || [];
  return { results: rows.slice(0, 20).map((record) => normalizeNhtsa(record, vehicle)), vehicle };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const category = clean(req.query.category, "food");
  const query = clean(req.query.query);

  if (!query) {
    return json(res, 400, { error: "Missing query" });
  }

  if (!["food", "drug", "device", "consumer", "vehicle"].includes(category)) {
    return json(res, 400, { error: "Unsupported recall category" });
  }

  try {
    if (category === "vehicle") {
      const vehicleSearch = await searchNhtsa(req.query);
      return json(res, 200, {
        source: SOURCE_LABELS[category],
        category,
        query,
        ...vehicleSearch,
      });
    }

    const results = category === "consumer"
      ? await searchCpsc(query)
      : await searchFda(category, query);

    return json(res, 200, {
      source: SOURCE_LABELS[category],
      category,
      query,
      results,
    });
  } catch (error) {
    console.error("Recall search failed:", error);
    return json(res, 502, {
      error: "Recall source unavailable",
      detail: error.message,
    });
  }
}
