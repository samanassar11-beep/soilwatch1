import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const MAX_READINGS = 100;
const POLL_INTERVAL = 10000;

function getMoistureColor(pct) {
  if (pct < 20) return "#e8722a";
  if (pct < 40) return "#d4a843";
  if (pct < 60) return "#5aad6e";
  if (pct < 80) return "#3d8fbf";
  return "#5c6bc0";
}

function getMoistureLabel(pct) {
  if (pct < 20) return "Very Dry";
  if (pct < 40) return "Dry";
  if (pct < 60) return "Optimal";
  if (pct < 80) return "Moist";
  return "Very Wet";
}

function getMoistureEmoji(pct) {
  if (pct < 20) return "🏜️";
  if (pct < 40) return "🌵";
  if (pct < 60) return "🌱";
  if (pct < 80) return "💧";
  return "🌊";
}

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatTimeShort(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div style={{
        background: "#0d1117",
        border: `1px solid ${getMoistureColor(val)}`,
        borderRadius: 8,
        padding: "8px 14px",
        fontFamily: "'DM Mono', monospace",
        fontSize: 13,
      }}>
        <div style={{ color: "#8b949e", marginBottom: 2 }}>{label}</div>
        <div style={{ color: getMoistureColor(val), fontWeight: 700, fontSize: 16 }}>
          {val}% — {getMoistureLabel(val)}
        </div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [readings, setReadings] = useState([]);
  const [latest, setLatest] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connected, setConnected] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const fetchReadings = useCallback(async () => {
    try {
      const res = await fetch("/api/readings");
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setReadings(data);
          setLatest(data[data.length - 1]);
          setLastUpdate(new Date());
          setConnected(true);
        }
      }
    } catch (e) {
      console.error("Failed to fetch readings:", e);
    }
  }, []);

  useEffect(() => {
    fetchReadings();
    const poll = setInterval(fetchReadings, POLL_INTERVAL);
    return () => clearInterval(poll);
  }, [fetchReadings]);

  const chartData = readings.slice(-40).map(r => ({
    time: formatTimeShort(r.timestamp),
    pct: r.moisture_pct,
  }));

  const latestPct = latest?.moisture_pct ?? 0;
  const color = getMoistureColor(latestPct);
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (latestPct / 100) * circumference;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0e14",
      color: "#e6edf3",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .card { background: #0d1117; border: 1px solid #21262d; border-radius: 12px; transition: border-color 0.2s; }
        .card:hover { border-color: #30363d; }
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        .blink { animation: pulse 2s ease-in-out infinite; }
        @media (max-width: 600px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #21262d",
        padding: "20px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🌿</span>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.5px",
            }}>SoilWatch</span>
          </div>
          <div style={{ fontSize: 11, color: "#484f58", marginTop: 3 }}>
            Device: <span style={{ color: "#8b949e" }}>{latest?.device_id ?? "waiting..."}</span>
            {lastUpdate && (
              <span style={{ marginLeft: 14 }}>
                Last update: <span style={{ color: "#8b949e" }}>{formatTime(lastUpdate.toISOString())}</span>
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="blink" style={{
            width: 8, height: 8, borderRadius: "50%",
            background: connected ? "#3fb950" : "#6b7280",
          }} />
          <span style={{ fontSize: 12, color: connected ? "#3fb950" : "#6b7280" }}>
            {connected ? "Live" : "Awaiting device"}
          </span>
          <button
            onClick={() => setShowInstructions(v => !v)}
            style={{
              background: "transparent",
              border: "1px solid #30363d",
              color: "#8b949e",
              borderRadius: 6,
              padding: "5px 12px",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >{showInstructions ? "Hide Guide" : "Setup Guide"}</button>
        </div>
      </div>

      {/* Setup Guide */}
      {showInstructions && (
        <div className="fade-in" style={{
          background: "#0d1117",
          borderBottom: "1px solid #21262d",
          padding: "20px 28px",
          fontSize: 12,
          color: "#8b949e",
          lineHeight: 1.8,
        }}>
          <div style={{ fontFamily: "'Syne', sans-serif", color: "#e6edf3", fontWeight: 700, marginBottom: 12, fontSize: 14 }}>
            📡 Connecting your ESP32
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {[
              ["1. Wire the sensor", "S → GPIO 32, V → 3.3V, G → GND"],
              ["2. Update the .ino file", "Set your WiFi name, password and this site's URL as SERVER_URL"],
              ["3. Flash to ESP32", "Upload via Arduino IDE — board: ESP32 Dev Module"],
              ["4. Check Serial Monitor", "You should see readings every 10 seconds"],
            ].map(([title, desc]) => (
              <div key={title} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: "#58a6ff", fontWeight: 500, marginBottom: 4 }}>{title}</div>
                <div style={{ color: "#6e7681" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Gauge + Stats */}
        <div className="main-grid fade-in" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, marginBottom: 20 }}>

          {/* Gauge */}
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 130, height: 130 }}>
              <svg width={130} height={130} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={65} cy={65} r={54} fill="none" stroke="#161b22" strokeWidth={10} />
                <circle
                  cx={65} cy={65} r={54}
                  fill="none" stroke={color} strokeWidth={10}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 500, color, fontFamily: "'Syne', sans-serif" }}>{latestPct}%</div>
                <div style={{ fontSize: 18 }}>{getMoistureEmoji(latestPct)}</div>
              </div>
            </div>
            <div style={{ marginTop: 10, textAlign: "center" }}>
              <div style={{ fontSize: 13, color, fontWeight: 500 }}>{getMoistureLabel(latestPct)}</div>
              <div style={{ fontSize: 10, color: "#484f58", marginTop: 2 }}>MOISTURE LEVEL</div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "CURRENT", value: `${latestPct}%`, sub: latest?.status ?? "—", color },
              {
                label: "AVERAGE",
                value: readings.length > 0 ? `${Math.round(readings.reduce((a, r) => a + r.moisture_pct, 0) / readings.length)}%` : "—",
                sub: `${readings.length} readings`,
                color: "#8b949e",
              },
              { label: "RAW ADC", value: latest?.raw ?? "—", sub: "12-bit (0–4095)", color: "#58a6ff" },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: "18px 20px" }}>
                <div style={{ fontSize: 10, color: "#484f58", letterSpacing: 1.5, marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 500, color: s.color, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#6e7681", marginTop: 6 }}>{s.sub}</div>
              </div>
            ))}

            {/* Scale bar */}
            <div className="card" style={{ padding: "18px 20px", gridColumn: "span 3" }}>
              <div style={{ fontSize: 10, color: "#484f58", letterSpacing: 1.5, marginBottom: 10 }}>MOISTURE SCALE</div>
              <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 10 }}>
                {[
                  { color: "#e8722a", range: [0, 20] },
                  { color: "#d4a843", range: [20, 40] },
                  { color: "#5aad6e", range: [40, 60] },
                  { color: "#3d8fbf", range: [60, 80] },
                  { color: "#5c6bc0", range: [80, 100] },
                ].map((band, i) => (
                  <div key={i} style={{
                    flex: 1, background: band.color,
                    opacity: latestPct >= band.range[0] && latestPct < band.range[1] ? 1 : 0.25,
                    transition: "opacity 0.5s",
                  }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 9, color: "#484f58" }}>
                <span>0%</span><span>20%</span><span>40%</span><span>60%</span><span>80%</span><span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="card fade-in" style={{ padding: "20px 20px 10px", marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#484f58", letterSpacing: 1.5, marginBottom: 16 }}>
            MOISTURE HISTORY (LAST {chartData.length} READINGS)
          </div>
          {chartData.length === 0 ? (
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#484f58", fontSize: 13 }}>
              Waiting for first reading from device...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#5aad6e" />
                    <stop offset="50%" stopColor="#3d8fbf" />
                    <stop offset="100%" stopColor="#5c6bc0" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#161b22" strokeDasharray="0" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: "#484f58", fontSize: 10, fontFamily: "DM Mono" }} tickLine={false} axisLine={{ stroke: "#21262d" }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fill: "#484f58", fontSize: 10, fontFamily: "DM Mono" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={20} stroke="#e8722a" strokeDasharray="4 4" strokeOpacity={0.4} />
                <ReferenceLine y={40} stroke="#d4a843" strokeDasharray="4 4" strokeOpacity={0.3} />
                <ReferenceLine y={60} stroke="#5aad6e" strokeDasharray="4 4" strokeOpacity={0.3} />
                <ReferenceLine y={80} stroke="#3d8fbf" strokeDasharray="4 4" strokeOpacity={0.3} />
                <Line type="monotone" dataKey="pct" stroke="url(#lineGradient)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: color, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Table */}
        {readings.length > 0 && (
          <div className="card fade-in" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #21262d", fontSize: 10, color: "#484f58", letterSpacing: 1.5 }}>
              RECENT READINGS
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #21262d" }}>
                    {["Time", "Moisture", "Status", "Raw ADC", "Device"].map(h => (
                      <th key={h} style={{ padding: "10px 20px", textAlign: "left", color: "#484f58", fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...readings].reverse().slice(0, 10).map((r, i) => {
                    const c = getMoistureColor(r.moisture_pct);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #161b22" }}>
                        <td style={{ padding: "10px 20px", color: "#6e7681" }}>{formatTime(r.timestamp)}</td>
                        <td style={{ padding: "10px 20px", color: c, fontWeight: 500 }}>{r.moisture_pct}%</td>
                        <td style={{ padding: "10px 20px" }}>
                          <span style={{ background: `${c}18`, color: c, border: `1px solid ${c}40`, borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>{r.status}</span>
                        </td>
                        <td style={{ padding: "10px 20px", color: "#484f58" }}>{r.raw}</td>
                        <td style={{ padding: "10px 20px", color: "#484f58" }}>{r.device_id}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#30363d", paddingBottom: 20 }}>
          SoilWatch • Polls every {POLL_INTERVAL / 1000}s • ESP32-WROOM-32 + Keyestudio Resistive Sensor
        </div>
      </div>
    </div>
  );
}
