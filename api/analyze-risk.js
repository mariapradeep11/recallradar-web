function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text?.match(/\{[\s\S]*\}/);

    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function cleanText(value, fallback = "") {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();

  if (!trimmed) return fallback;

  const invalidPhrases = [
    "not found",
    "not available",
    "not provided",
    "unknown",
    "n/a",
    "none",
    "null",
  ];

  if (invalidPhrases.includes(trimmed.toLowerCase())) {
    return fallback;
  }

  return trimmed;
}

function buildTrustedSources(recall = {}) {
  const trustedSources = [];

  if (isValidUrl(recall.url)) {
    trustedSources.push({
      label: `Official ${recall.source || "recall"} notice`,
      url: recall.url,
      type: "official",
    });
  }

  if (recall.source === "FDA") {
    trustedSources.push({
      label: "FDA recall database",
      url: "https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts",
      type: "official",
    });
  }

  if (recall.source === "CPSC") {
    trustedSources.push({
      label: "CPSC recall database",
      url: "https://www.cpsc.gov/Recalls",
      type: "official",
    });
  }

  if (recall.source === "NHTSA") {
    trustedSources.push({
      label: "NHTSA recall lookup",
      url: "https://www.nhtsa.gov/recalls",
      type: "official",
    });
  }

  if (recall.company && recall.company !== "Unknown") {
    trustedSources.push({
      label: "Manufacturer recall information",
      url: `https://www.google.com/search?q=${encodeURIComponent(
        `${recall.company} recall refund replacement repair`
      )}`,
      type: "manufacturer-search",
    });
  }

  return trustedSources;
}

function buildSourceContext(recall = {}) {
  const sourceName = recall.source || "Official Source";

  const checkedFields = [
    "official recall record",
    "product description",
    "recall reason",
    "reported impact",
    "recommended action",
  ];

  if (recall.category === "vehicle") {
    checkedFields.push("vehicle year/make/model", "campaign details");
  }

  if (recall.category === "consumer") {
    checkedFields.push("consumer product hazard", "remedy details");
  }

  if (["food", "drug", "device"].includes(recall.category)) {
    checkedFields.push("FDA enforcement details");
  }

  return {
    sourceName,
    sourceType: "Official recall data",
    sourceUrl: isValidUrl(recall.url) ? recall.url : "",
    checkedFields,
    note:
      recall.category === "vehicle"
        ? "Vehicle recall results matched by year, make, and model should be confirmed with VIN or license plate lookup."
        : "RecallRadar analyzes official recall data. It does not treat random web articles as verified facts.",
    trustedSources: buildTrustedSources(recall),
  };
}

function buildMinimalFallbackRisk(recall = {}) {
  return {
    riskLevel: "UNKNOWN",
    contextualLabel: "REVIEW NEEDED",
    riskQualifier:
      "AI analysis was unavailable. Review the official recall notice before taking action.",
    why: ["Official recall record detected"],
    reportedImpact:
      "Reported impact was not analyzed because AI risk analysis was unavailable.",
    recommendedAction:
      "Review the official recall source and verify whether your exact product is affected.",
    confidence: "Limited",
    plainEnglishSummary:
      "RecallRadar found an official recall, but AI risk analysis was unavailable.",
    sourceContext: buildSourceContext(recall),
    aiStatus: "fallback_only",
    aiMessage:
      "AI analysis was unavailable, so RecallRadar returned a minimal official-source fallback.",
  };
}

function normalizeSourceContext(parsedSourceContext = {}, recall = {}) {
  const base = buildSourceContext(recall);

  const parsedTrustedSources = Array.isArray(parsedSourceContext.trustedSources)
    ? parsedSourceContext.trustedSources
        .filter((link) => link && isValidUrl(link.url))
        .map((link) => ({
          label: cleanText(link.label, "Trusted source"),
          url: link.url,
          type: cleanText(link.type, "official"),
        }))
    : [];

  const trustedSources =
    parsedTrustedSources.length > 0 ? parsedTrustedSources : base.trustedSources;

  const parsedCheckedFields = Array.isArray(parsedSourceContext.checkedFields)
    ? parsedSourceContext.checkedFields
        .map((field) => cleanText(field))
        .filter(Boolean)
    : [];

  return {
    ...base,
    sourceName: cleanText(parsedSourceContext.sourceName, base.sourceName),
    sourceType: cleanText(parsedSourceContext.sourceType, base.sourceType),
    sourceUrl: isValidUrl(parsedSourceContext.sourceUrl)
      ? parsedSourceContext.sourceUrl
      : base.sourceUrl,
    checkedFields:
      parsedCheckedFields.length > 0 ? parsedCheckedFields : base.checkedFields,
    note: cleanText(parsedSourceContext.note, base.note),
    trustedSources,
  };
}

function normalizeRiskResponse(parsed = {}, recall = {}) {
  const fallback = buildMinimalFallbackRisk(recall);

  const riskLevel = ["HIGH", "MEDIUM", "LOW"].includes(parsed.riskLevel)
    ? parsed.riskLevel
    : fallback.riskLevel;

  const contextualLabel =
    cleanText(parsed.contextualLabel) ||
    (riskLevel === "HIGH"
      ? "HIGH RISK"
      : riskLevel === "MEDIUM"
        ? "MEDIUM RISK"
        : riskLevel === "LOW"
          ? "LOW RISK"
          : "REVIEW NEEDED");

  return {
    riskLevel,
    contextualLabel,
    riskQualifier:
      cleanText(parsed.riskQualifier) ||
      "RecallRadar analyzed the official recall notice for consumer safety signals.",
    why:
      Array.isArray(parsed.why) && parsed.why.length > 0
        ? parsed.why.map((item) => cleanText(item)).filter(Boolean).slice(0, 6)
        : fallback.why,
    reportedImpact:
      cleanText(parsed.reportedImpact) ||
      "No specific injury or incident count was found in the provided recall details.",
    recommendedAction:
      cleanText(parsed.recommendedAction) ||
      "Review the official recall source and verify whether your exact product is affected.",
    confidence: cleanText(parsed.confidence, "Medium"),
    plainEnglishSummary:
      cleanText(parsed.plainEnglishSummary) ||
      "RecallRadar analyzed the official recall notice and summarized the key safety signals.",
    sourceContext: normalizeSourceContext(parsed.sourceContext || {}, recall),
    aiStatus: "ai_generated",
    aiMessage:
      "RecallRadar AI analyzed official recall details. No external web search was used.",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { recall } = req.body || {};

  if (!recall) {
    return res.status(400).json({
      error: "Missing recall payload",
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json(buildMinimalFallbackRisk(recall));
  }

  const prompt = `
You are RecallRadar's safety intelligence analyst.

Analyze this official recall record using ONLY the provided recall data.

Important rules:
- Do not claim you searched the internet.
- Do not invent incident counts, injuries, deaths, source names, or remedy instructions.
- If the data does not include a fact, say it was not found in the available official recall details.
- You may reason from the official recall text, but keep the explanation grounded.
- For allergen recalls, do not call it simply LOW if it may be serious for allergy-sensitive consumers. Use CONTEXTUAL RISK when appropriate.
- For vehicle recalls, mention that year/make/model matches should be confirmed with VIN or license plate lookup.
- For sourceContext.sourceUrl and trustedSources URLs, only return valid http or https URLs. If no valid URL exists, return an empty string or an empty array.
- Return strict JSON only. No markdown. No extra commentary.

Required JSON shape:
{
  "riskLevel": "HIGH" | "MEDIUM" | "LOW",
  "contextualLabel": "HIGH RISK" | "MEDIUM RISK" | "LOW RISK" | "CONTEXTUAL RISK",
  "riskQualifier": "short explanation of what this risk level means",
  "why": ["2-6 short safety signals"],
  "reportedImpact": "short sentence",
  "recommendedAction": "short action-oriented sentence",
  "confidence": "High" | "Medium" | "Limited",
  "plainEnglishSummary": "one user-friendly sentence",
  "sourceContext": {
    "sourceName": "FDA | CPSC | NHTSA | Official Source",
    "sourceType": "Official recall data",
    "sourceUrl": "valid official source URL or empty string",
    "checkedFields": ["hazard", "reason", "remedy", "reported impact"],
    "note": "short trust note",
    "trustedSources": [
      {
        "label": "Official recall notice",
        "url": "valid http or https URL only",
        "type": "official"
      }
    ]
  }
}

Risk guidance:
- Use HIGH for death, serious injury, fire, crash, electrocution, severe contamination, botulism, urgent stop-use, or severe child safety hazards.
- Use MEDIUM for undeclared allergens, choking, fall, burn, glass/metal contamination, or moderate injury risk.
- Use CONTEXTUAL RISK when the risk is especially important for a specific group, such as people with allergies, children, elderly consumers, drivers of affected vehicles, or medical-device users.
- Use LOW only when no severe injury indicators are detected and the recall appears precautionary.
- For allergen recalls, explain that risk may be low for the general population but elevated for allergy-sensitive consumers.

Recall record:
${JSON.stringify(recall, null, 2)}
`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.15,
            responseMimeType: "application/json",
          },
        }),
      }
    );

if (!geminiRes.ok) {
  const errorText = await geminiRes.text();

  console.error("Gemini API failed:", {
    status: geminiRes.status,
    statusText: geminiRes.statusText,
    errorText,
  });

  return res.status(200).json({
    ...buildMinimalFallbackRisk(recall),
    aiStatus: "fallback_after_ai_error",
    aiMessage:
      "AI analysis was unavailable, so RecallRadar returned a minimal official-source fallback.",
    debug:
      process.env.NODE_ENV !== "production"
        ? {
            status: geminiRes.status,
            statusText: geminiRes.statusText,
            errorText,
          }
        : undefined,
  });
}

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = safeJsonParse(text);

    if (!parsed) {
      return res.status(200).json({
        ...buildMinimalFallbackRisk(recall),
        aiStatus: "fallback_after_parse_error",
        aiMessage:
          "AI response could not be parsed, so RecallRadar returned a minimal official-source fallback.",
      });
    }

    const normalized = normalizeRiskResponse(parsed, recall);

    return res.status(200).json(normalized);
  } catch (err) {
    return res.status(200).json({
      ...buildMinimalFallbackRisk(recall),
      aiStatus: "fallback_after_runtime_error",
      aiMessage:
        "AI analysis failed at runtime, so RecallRadar returned a minimal official-source fallback.",
    });
  }
}