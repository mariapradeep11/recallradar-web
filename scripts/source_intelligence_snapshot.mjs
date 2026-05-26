import fs from "node:fs/promises";
import path from "node:path";

const term = process.argv[2] || "chicken";
const slug = term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const outDir = path.join(process.cwd(), "data", "source-intelligence");
const reportDir = path.join(process.cwd(), "reports");

const FDA_FOOD_ENDPOINT = "https://api.fda.gov/food/enforcement.json";
const limit = 100;
const maxRecords = Number(process.env.MAX_RECORDS || 500);

const severityKeywords = [
  "salmonella",
  "listeria",
  "e. coli",
  "foreign material",
  "undeclared",
  "allergen",
  "plastic",
  "metal",
  "glass",
  "contamination",
  "misbranding",
  "illness",
  "injury",
];

function fdaSearchUrl(skip = 0) {
  const search = `product_description:${term}`;
  const params = new URLSearchParams({
    search,
    limit: String(limit),
    skip: String(skip),
  });
  return `${FDA_FOOD_ENDPOINT}?${params.toString()}`;
}

function safeDate(value = "") {
  if (!/^\d{8}$/.test(value)) return "Unknown";
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function yearFromDate(value = "") {
  return /^\d{8}$/.test(value) ? value.slice(0, 4) : "Unknown";
}

function inc(map, key, by = 1) {
  const clean = key || "Unknown";
  map.set(clean, (map.get(clean) || 0) + by);
}

function topEntries(map, n = 8) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function detectKeywords(record) {
  const text = `${record.reason_for_recall || ""} ${record.product_description || ""}`.toLowerCase();
  return severityKeywords.filter((keyword) => text.includes(keyword));
}

function normalize(record, index) {
  return {
    id: `fda-food-${record.recall_number || index}`,
    source: "FDA",
    category: "Food",
    product: record.product_description || "Unknown product",
    company: record.recalling_firm || "Unknown",
    reason: record.reason_for_recall || "No reason provided",
    classification: record.classification || "Unknown",
    status: record.status || "Unknown",
    state: record.state || "Unknown",
    country: record.country || "Unknown",
    reportDate: safeDate(record.report_date),
    recallInitiationDate: safeDate(record.recall_initiation_date),
    distributionPattern: record.distribution_pattern || "",
    recallNumber: record.recall_number || "",
    keywords: detectKeywords(record),
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (response.status === 404) {
    return { meta: { results: { total: 0 } }, results: [] };
  }
  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status}: ${url}`);
  }
  return response.json();
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(reportDir, { recursive: true });

  const first = await fetchJson(fdaSearchUrl(0));
  const total = first.meta?.results?.total || 0;
  const records = [...(first.results || [])];

  for (let skip = limit; skip < Math.min(total, maxRecords); skip += limit) {
    const page = await fetchJson(fdaSearchUrl(skip));
    records.push(...(page.results || []));
  }

  const normalized = records.map(normalize);
  const byYear = new Map();
  const byClass = new Map();
  const byFirm = new Map();
  const byState = new Map();
  const byKeyword = new Map();
  const actionWords = new Map();

  for (const record of normalized) {
    inc(byYear, record.reportDate.slice(0, 4));
    inc(byClass, record.classification);
    inc(byFirm, record.company);
    inc(byState, record.state);
    for (const keyword of record.keywords) inc(byKeyword, keyword);
    const reason = record.reason.toLowerCase();
    for (const action of ["do not consume", "return", "dispose", "destroy", "allergen", "contamination", "foreign material"]) {
      if (reason.includes(action)) inc(actionWords, action);
    }
  }

  const insights = {
    term,
    generatedAt: new Date().toISOString(),
    source: {
      name: "FDA openFDA Food Enforcement",
      url: FDA_FOOD_ENDPOINT,
      search: `product_description:${term}`,
    },
    totalOfficialMatches: total,
    recordsPulled: normalized.length,
    cappedAt: maxRecords,
    byYear: topEntries(byYear, 12),
    byClassification: topEntries(byClass, 5),
    topCompanies: topEntries(byFirm, 10),
    topStates: topEntries(byState, 10),
    topRiskKeywords: topEntries(byKeyword, 12),
    actionSignals: topEntries(actionWords, 10),
    sampleRecords: normalized.slice(0, 12),
  };

  const snapshotPath = path.join(outDir, `${slug}-snapshot.json`);
  const insightsPath = path.join(outDir, `${slug}-insights.json`);
  const reportPath = path.join(reportDir, `${slug}-recall-intelligence.md`);

  await fs.writeFile(snapshotPath, JSON.stringify(normalized, null, 2));
  await fs.writeFile(insightsPath, JSON.stringify(insights, null, 2));

  const report = [
    `# Recall Intelligence Snapshot: ${term}`,
    "",
    `Generated: ${insights.generatedAt}`,
    "",
    "## Source",
    "",
    `- FDA openFDA Food Enforcement API`,
    `- Search: \`${insights.source.search}\``,
    `- Official matches reported by API: **${total.toLocaleString()}**`,
    `- Records pulled for analysis: **${normalized.length.toLocaleString()}**`,
    "",
    "## Classification Mix",
    "",
    ...insights.byClassification.map(([label, count]) => `- ${label}: ${count}`),
    "",
    "## Recalls By Report Year",
    "",
    ...insights.byYear.map(([label, count]) => `- ${label}: ${count}`),
    "",
    "## Top Risk Keywords",
    "",
    ...(insights.topRiskKeywords.length ? insights.topRiskKeywords.map(([label, count]) => `- ${label}: ${count}`) : ["- No configured risk keywords detected in pulled records."]),
    "",
    "## Top Recalling Firms In Pulled Records",
    "",
    ...insights.topCompanies.map(([label, count]) => `- ${label}: ${count}`),
    "",
    "## Landing/Product Story Angles",
    "",
    `- Consumers should not have to know where FDA food enforcement records live to answer: "Has ${term} been recalled?"`,
    `- This query alone has **${total.toLocaleString()} official FDA match${total === 1 ? "" : "es"}** in the source system.`,
    "- A consumer app can translate dense enforcement language into product, company, reason, date, severity cues, and next action.",
    "- This supports the mobile direction: search once, save products, monitor household safety signals.",
    "",
    "## Sample Records",
    "",
    ...insights.sampleRecords.slice(0, 5).map((record) => [
      `### ${record.product}`,
      "",
      `- Company: ${record.company}`,
      `- Classification: ${record.classification}`,
      `- Report date: ${record.reportDate}`,
      `- Reason: ${record.reason}`,
      "",
    ].join("\n")),
  ].join("\n");

  await fs.writeFile(reportPath, report);

  console.log(JSON.stringify({
    term,
    totalOfficialMatches: total,
    recordsPulled: normalized.length,
    snapshotPath,
    insightsPath,
    reportPath,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
