const readings = [];
const MAX = 100;

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method === "POST") {
    const { device_id, raw, moisture_pct, status, uptime_ms } = req.body;
    if (moisture_pct === undefined || raw === undefined) {
      return res.status(400).json({ error: "Missing fields" });
    }
    readings.push({
      device_id: device_id || "unknown",
      raw,
      moisture_pct,
      status: status || "",
      uptime_ms: uptime_ms || 0,
      timestamp: new Date().toISOString(),
    });
    if (readings.length > MAX) readings.shift();
    return res.status(201).json({ ok: true });
  }
  if (req.method === "GET") {
    return res.status(200).json(readings);
  }
  return res.status(405).json({ error: "Method not allowed" });
}
