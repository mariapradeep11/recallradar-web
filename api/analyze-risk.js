export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
  }

  const { recall } = req.body || {};

  if (!recall) {
    return res.status(400).json({ error: "Missing recall payload" });
  }

  const prompt = `
You are RecallRadar's safety intelligence analyst.

Analyze this official recall record using ONLY the provided data.
Do not invent facts. If reported incidents or injuries are not available, say that.

Return a strict JSON object with:
- riskLevel: HIGH, MEDIUM, or LOW
- why: array of 2-5 short reasons
- reportedImpact: short sentence
- recommendedAction: short action-oriented sentence
- confidence: High, Medium, or Limited
- plainEnglishSummary: one user-friendly sentence

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
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      return res.status(geminiRes.status).json({
        error: "Gemini request failed",
        detail: errorText,
      });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: "No Gemini response text returned" });
    }

    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({
      error: "Risk analysis failed",
      detail: err.message,
    });
  }
}