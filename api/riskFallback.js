const OFFICIAL_SOURCE_TYPES = {
  FDA: "Official government recall data",
  CPSC: "Official government consumer product recall data",
  NHTSA: "Official government vehicle safety recall data",
};

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function recallText(recall = {}) {
  return [
    recall.title,
    recall.reason,
    recall.company,
    recall.category,
    recall.source,
    recall.raw?.Hazard,
    recall.raw?.Description,
    recall.raw?.Remedy,
    recall.raw?.Summary,
    recall.raw?.Consequence,
    recall.raw?.Conequence,
    recall.raw?.Notes,
    recall.raw?.ProductDescription,
    recall.raw?.product_description,
    recall.raw?.reason_for_recall,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildTrustedSources(recall = {}) {
  const source = recall.source || "Official Source";
  const url = recall.url || "";

  const links = [];

  if (url) {
    links.push({
      label: `Official ${source} recall notice`,
      url,
      type: "official",
    });
  }

  if (source === "FDA") {
    links.push({
      label: "FDA recall database",
      url: "https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts",
      type: "official",
    });
  }

  if (source === "CPSC") {
    links.push({
      label: "CPSC recall database",
      url: "https://www.cpsc.gov/Recalls",
      type: "official",
    });
  }

  if (source === "NHTSA") {
    links.push({
      label: "NHTSA recall lookup",
      url: "https://www.nhtsa.gov/recalls",
      type: "official",
    });
  }

  if (recall.company && recall.company !== "Unknown") {
    links.push({
      label: "Manufacturer recall information",
      url: `https://www.google.com/search?q=${encodeURIComponent(
        `${recall.company} recall refund replacement repair`
      )}`,
      type: "manufacturer-search",
    });
  }

  return links;
}

function buildSourceContext(recall = {}) {
  const sourceName = recall.source || "Official Source";

  const checkedFields = [
    "hazard",
    "reason",
    "remedy",
    "reported impact",
  ];

  if (recall.category === "vehicle") {
    checkedFields.push("vehicle year/make/model", "campaign details");
  }

  if (recall.category === "consumer") {
    checkedFields.push("product identifiers", "consumer product hazard");
  }

  if (["food", "drug", "device"].includes(recall.category)) {
    checkedFields.push("recall classification", "affected product description");
  }

  return {
    sourceName,
    sourceType: OFFICIAL_SOURCE_TYPES[sourceName] || "Official recall data",
    sourceUrl: recall.url || "",
    checkedFields,
    trustedSources: buildTrustedSources(recall),
    note:
      recall.category === "vehicle"
        ? "Vehicle recall results are matched by year, make, and model. Confirm with VIN or license plate before taking action."
        : "RecallRadar analyzes official recall data. It does not treat random web articles as verified facts.",
  };
}

export function buildFallbackRisk(recall = {}) {
  const text = recallText(recall);

  const why = [];
  let riskLevel = "LOW";
  let contextualLabel = "LOW RISK";
  let riskQualifier =
    "No severe injury indicators detected in the official recall notice.";
  let reportedImpact =
    "No specific injury or incident count was found in the available recall details.";
  let recommendedAction =
    "Review the official recall notice and verify whether your exact product is affected.";
  let confidence = "Medium";

  const hasDeathOrSeriousInjury =
    text.includes("death") ||
    text.includes("serious injury") ||
    text.includes("fatal") ||
    text.includes("life-threatening");

  const hasChildSignal =
    text.includes("child") ||
    text.includes("children") ||
    text.includes("infant") ||
    text.includes("baby") ||
    text.includes("toddler") ||
    text.includes("crib") ||
    text.includes("stroller");

  const hasAllergenSignal =
    text.includes("undeclared") ||
    text.includes("allergen") ||
    text.includes("allergy") ||
    text.includes("milk") ||
    text.includes("egg") ||
    text.includes("fish") ||
    text.includes("anchovy") ||
    text.includes("peanut") ||
    text.includes("tree nut") ||
    text.includes("soy") ||
    text.includes("wheat");

  const hasContaminationSignal =
    text.includes("contamination") ||
    text.includes("listeria") ||
    text.includes("salmonella") ||
    text.includes("e. coli") ||
    text.includes("ecoli") ||
    text.includes("botulism") ||
    text.includes("foreign material");

  const hasFireCrashShockSignal =
    text.includes("fire") ||
    text.includes("burn") ||
    text.includes("shock") ||
    text.includes("electrocution") ||
    text.includes("crash") ||
    text.includes("brake") ||
    text.includes("airbag");

  const hasStopUseSignal =
    text.includes("stop using") ||
    text.includes("stop use") ||
    text.includes("do not use") ||
    text.includes("destroy") ||
    text.includes("refund") ||
    text.includes("replacement") ||
    text.includes("repair");

  const hasChokingEntrapmentFallSignal =
    text.includes("choking") ||
    text.includes("entrapment") ||
    text.includes("fall") ||
    text.includes("collapse") ||
    text.includes("tip over") ||
    text.includes("tip-over");

  if (hasDeathOrSeriousInjury) {
    riskLevel = "HIGH";
    contextualLabel = "HIGH RISK";
    riskQualifier =
      "Serious injury or death indicators were detected in the official recall notice.";
    why.push("Serious injury or death language detected");
  }

  if (hasChildSignal) {
    riskLevel = riskLevel === "HIGH" ? "HIGH" : "MEDIUM";
    why.push("Child, infant, baby, or toddler safety signal detected");
  }

  if (hasContaminationSignal) {
    riskLevel = "HIGH";
    contextualLabel = "HIGH RISK";
    riskQualifier =
      "Foodborne illness or contamination language was detected in the official recall notice.";
    why.push("Contamination or foodborne illness signal detected");
    recommendedAction =
      "Do not consume or use the affected product. Follow the official recall instructions.";
  }

  if (hasFireCrashShockSignal) {
    riskLevel = "HIGH";
    contextualLabel = "HIGH RISK";
    riskQualifier =
      "Fire, crash, shock, burn, or vehicle safety severity language was detected.";
    why.push("High-severity physical safety hazard detected");
  }

  if (hasChokingEntrapmentFallSignal) {
    riskLevel = riskLevel === "HIGH" ? "HIGH" : "MEDIUM";
    why.push("Choking, fall, collapse, or entrapment hazard detected");
  }

  if (hasAllergenSignal) {
    riskLevel = riskLevel === "HIGH" ? "HIGH" : "MEDIUM";
    contextualLabel = riskLevel === "HIGH" ? "HIGH RISK" : "CONTEXTUAL RISK";
    riskQualifier =
      "Potentially serious for people with relevant allergies or sensitivities.";
    why.push("Undeclared allergen or allergy-sensitive risk detected");
    recommendedAction =
      "Avoid this product if you have relevant allergies or sensitivities. Check the ingredient label and official recall notice.";
  }

  if (hasStopUseSignal) {
    why.push("Official remedy or stop-use guidance detected");
    recommendedAction =
      recall.raw?.Remedy ||
      recall.raw?.remedy ||
      "Stop using the affected product until you verify the official recall remedy.";
  }

  if (recall.category === "vehicle") {
    why.push("Vehicle recall matched by year, make, and model");
    recommendedAction =
      "Confirm whether your specific vehicle is affected using VIN or license plate lookup, then contact the manufacturer or dealer.";
  }

  if (why.length === 0) {
    why.push("Official recall record detected");
    why.push("No severe injury indicators detected in the available recall text");
  }

  if (text.includes("injur")) {
    reportedImpact =
      "The recall text references injury risk or reported injuries. Review the official notice for exact counts.";
  }

  if (text.includes("incident")) {
    reportedImpact =
      "The recall text references reported incidents. Review the official notice for exact details.";
  }

  if (riskLevel === "HIGH") {
    confidence = "High";
  }

  return {
    riskLevel,
    contextualLabel,
    riskQualifier,
    why: [...new Set(why)].slice(0, 6),
    reportedImpact,
    recommendedAction,
    confidence,
    plainEnglishSummary:
      riskLevel === "HIGH"
        ? "RecallRadar detected elevated safety indicators in the official recall notice."
        : contextualLabel === "CONTEXTUAL RISK"
          ? "RecallRadar detected risk that may be especially important for sensitive or affected consumers."
          : "RecallRadar did not detect severe injury indicators in the official recall notice.",
    sourceContext: buildSourceContext(recall),
  };
}

export function mergeRiskWithFallback(aiRisk = {}, fallbackRisk = {}) {
  return {
    riskLevel: aiRisk.riskLevel || fallbackRisk.riskLevel,
    contextualLabel:
      aiRisk.contextualLabel ||
      fallbackRisk.contextualLabel ||
      aiRisk.riskLevel ||
      fallbackRisk.riskLevel,
    riskQualifier:
      aiRisk.riskQualifier || fallbackRisk.riskQualifier,
    why:
      Array.isArray(aiRisk.why) && aiRisk.why.length > 0
        ? aiRisk.why
        : fallbackRisk.why,
    reportedImpact:
      aiRisk.reportedImpact || fallbackRisk.reportedImpact,
    recommendedAction:
      aiRisk.recommendedAction || fallbackRisk.recommendedAction,
    confidence:
      aiRisk.confidence || fallbackRisk.confidence || "Medium",
    plainEnglishSummary:
      aiRisk.plainEnglishSummary || fallbackRisk.plainEnglishSummary,
    sourceContext:
      aiRisk.sourceContext || fallbackRisk.sourceContext,
  };
}