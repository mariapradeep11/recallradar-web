function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clean(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : fallback;
}

function getClientIp(req) {
  return clean(req.headers["x-forwarded-for"] || req.headers["x-real-ip"]).split(",")[0];
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const email = clean(body.email).toLowerCase();
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Enter a valid email" });
  }

  const payload = {
    email,
    product: clean(body.product),
    category: clean(body.category),
    search_query: clean(body.search_query || body.query),
    source: clean(body.source, "waitlist"),
    intent: clean(body.intent),
    watchlist_categories: clean(body.watchlist_categories),
    alert_cadence: clean(body.alert_cadence),
    created_at: new Date().toISOString(),
    page: clean(body.page),
    user_agent: clean(req.headers["user-agent"]),
    ip_hint: getClientIp(req),
  };

  const endpoint = process.env.WAITLIST_WEBHOOK_URL || process.env.SHEETBEST_URL;

  if (!endpoint) {
    console.warn("Waitlist endpoint missing. Accepted but not persisted.", {
      emailDomain: email.split("@")[1],
      source: payload.source,
    });
    return res.status(202).json({ ok: true, persisted: false });
  }

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error("Waitlist upstream failed:", upstream.status, text.slice(0, 300));
      return res.status(502).json({ error: "Could not save waitlist signup" });
    }

    return res.status(200).json({ ok: true, persisted: true });
  } catch (error) {
    console.error("Waitlist request failed:", error);
    return res.status(502).json({ error: "Could not save waitlist signup" });
  }
}
