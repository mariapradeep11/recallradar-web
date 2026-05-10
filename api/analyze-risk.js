import {
  buildFallbackRisk,
  mergeRiskWithFallback,
} from "./riskFallback.js";

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { recall } = req.body || {};

  if (!recall) {
    return res.status(400).json({ error: "Missing recall payload" });
  }

  const fallbackRisk = buildFallbackRisk(recall);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      ...fallbackRisk,
      aiStatus: "fallback_only",
      aiMessage:
        "Gemini key was not available, so RecallRadar used deterministic fallback analysis.",
    });
  }

  const prompt = `
You are RecallRadar's safety intelligence analyst.

Analyze this official recall record using ONLY the provided recall data.
Do not claim that you searched the internet.
Do not invent incident counts, injuries, deaths, source names, or remedy instructions.
If the provided recall data does not include a fact, say that it was not found in the available official recall details.

Return strict JSON only.

Required JSON shape:
{
  "riskLevel": "HIGH" | "MEDIUM" | "LOW",
  "contextualLabel": "HIGH RISK" | "MEDIUM RISK" | "LOW RISK" | "CONTEXTUAL RISK",
  "riskQualifier": "short explanation of what this risk level means",
  "why": ["2-6 short safety signals"],
  "reportedImpact": "short sentence",
  "recommendedAction": "short action-oriented sentence",
  "confidence": "High" | "Medium" | "Limited",
  "plainEnglishSummary": "one user-friendly sentence"
}

Risk guidance:
- Use HIGH for death, serious injury, fire, crash, electrocution, severe contamination, botulism, or urgent stop-use situations.
- Use MEDIUM for undeclared allergens, choking, fall, burn, glass/metal contamination, or moderate injury risk.
- Use LOW only when no severe injury indicators are detected.
- For allergen recalls, use contextualLabel "CONTEXTUAL RISK" if the risk is mainly serious for allergy-sensitive consumers.

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
      return res.status(200).json({
        ...fallbackRisk,
        aiStatus: "fallback_after_ai_error",
        aiMessage:
          "AI analysis was unavailable, so RecallRadar used deterministic fallback analysis.",
      });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = safeJsonParse(text);

    if (!parsed) {
      return res.status(200).json({
        ...fallbackRisk,
        aiStatus: "fallback_after_parse_error",
        aiMessage:
          "AI response could not be parsed, so RecallRadar used deterministic fallback analysis.",
      });
    }

    const mergedRisk = mergeRiskWithFallback(parsed, fallbackRisk);

    return res.status(200).json({
      ...mergedRisk,
      aiStatus: "ai_plus_fallback",
      aiMessage:
        "RecallRadar AI analyzed official recall details and fallback safety checks verified the output shape.",
    });
  } catch (err) {
    return res.status(200).json({
      ...fallbackRisk,
      aiStatus: "fallback_after_runtime_error",
      aiMessage:
        "AI analysis failed at runtime, so RecallRadar used deterministic fallback analysis.",
    });
  }
}