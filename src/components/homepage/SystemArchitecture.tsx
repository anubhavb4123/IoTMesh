import { useEffect, useRef, useState, useCallback } from "react";

/* ── Node color palette ── */
const C = {
  user:     { bg: "rgba(99,102,241,0.10)",  border: "#818cf8", text: "#a5b4fc" },
  firebase: { bg: "rgba(251,146,60,0.10)",  border: "#fb923c", text: "#fdba74" },
  backend:  { bg: "rgba(34,211,238,0.10)",  border: "#22d3ee", text: "#67e8f9" },
  telegram: { bg: "rgba(56,189,248,0.10)",  border: "#38bdf8", text: "#7dd3fc" },
  esp:      { bg: "rgba(74,222,128,0.10)",  border: "#4ade80", text: "#86efac" },
  nano:     { bg: "rgba(244,114,182,0.10)", border: "#f472b6", text: "#f9a8d4" },
  sensor:   { bg: "rgba(251,191,36,0.10)",  border: "#fbbf24", text: "#fcd34d" },
  relay:    { bg: "rgba(168,85,247,0.10)",  border: "#a855f7", text: "#c4b5fd" },
  alert:    { bg: "rgba(239,68,68,0.10)",   border: "#ef4444", text: "#fca5a5" },
  switch:   { bg: "rgba(74,222,128,0.10)",  border: "#4ade80", text: "#86efac" },
};
type NodeType = keyof typeof C;

type N = { id: string; icon: string; title: string; desc: string; type: NodeType; x: number; y: number; w?: number; list?: string[] };
type Conn = { from: string; to: string; label?: string; color: string; dashed?: boolean };

const nodes: N[] = [
  // ── TOP: Website Dashboard ──
  { id: "website", icon: "🖥️", title: "Website Dashboard", desc: "Admin Panel · Relay Control · Sensor Monitor · Virtual Switches · Alert Display · History", type: "user", x: 50, y: 20, w: 220 },

  // ── CENTER: Firebase — Single Source of Truth ──
  { id: "firebase", icon: "🔥", title: "Firebase Realtime DB", desc: "Single Source of Truth · Central Realtime State Bus", type: "firebase", x: 50, y: 160, w: 260 },

  // ── Firebase Data Store ──
  { id: "fb-data", icon: "📂", title: "Firebase Data Store", desc: "", type: "firebase", x: 50, y: 290, w: 280, list: ["controls", "sensor", "alerts", "weather", "history", "subscribers", "room-data", "alert-logs", "battery"] },

  // ── RIGHT BRANCH: Backend → Telegram ──
  { id: "render", icon: "⚙️", title: "Render Backend Engine", desc: "Event-Driven Alert Processing · Weather Prediction · Subscriber Management", type: "backend", x: 85, y: 160, w: 190 },
  { id: "telegram", icon: "📲", title: "Telegram Bot API", desc: "Alert Notification · Admin Chat · Subscriber Broadcast", type: "telegram", x: 85, y: 320, w: 180 },
  { id: "subscribers", icon: "👥", title: "Telegram Subscribers", desc: "Admin + Guest Users · Stored in Firebase", type: "telegram", x: 85, y: 460, w: 170 },
  { id: "alert-types", icon: "⚠️", title: "Alert Types", desc: "", type: "alert", x: 85, y: 580, w: 180, list: ["GAS", "POWER", "BATT", "HUMIDITY", "WEATHER", "IGNITION", "DOOR"] },

  // ── LEFT BRANCH: Hardware Layer ──
  { id: "lobby-esp", icon: "📡", title: "Lobby ESP8266", desc: "Cloud Sync Controller · WiFi · I2C Relay · Switch Reader", type: "esp", x: 15, y: 420, w: 190 },
  { id: "nano", icon: "🔧", title: "Arduino Nano", desc: "Sensor Processing Unit · LCD · UART to ESP", type: "nano", x: 15, y: 570, w: 180 },
  { id: "sensors", icon: "🌡️", title: "Sensor Infrastructure", desc: "", type: "sensor", x: 15, y: 720, w: 210, list: ["MQ Gas Sensor", "DHT Temp & Humidity", "BMP180 Pressure", "RTC DS3231 Time", "Water Level (HC-SR04)", "Battery Voltage", "Grid/Inverter Detect", "Buzzer Alert"] },
  { id: "phys-switch", icon: "🔘", title: "Physical Switches", desc: "NO direct relay connection · All through Firebase", type: "switch", x: 50, y: 440, w: 190 },
  { id: "relay-lobby", icon: "🔌", title: "6-Channel Relay", desc: "Lobby Appliances · I2C from ESP", type: "relay", x: 15, y: 900, w: 170 },
  { id: "virt-switch", icon: "💻", title: "Website Virtual Switch", desc: "Changes Firebase state directly", type: "user", x: 50, y: 580, w: 180 },

  // ── FUTURE ROOM NODES ──
  { id: "room1", icon: "📡", title: "Room 1 ESP", desc: "Relay Switch · Firebase Sync", type: "esp", x: 42, y: 900, w: 140 },
  { id: "room2", icon: "📡", title: "Room 2 ESP", desc: "Relay Switch · Firebase Sync", type: "esp", x: 60, y: 900, w: 140 },
  { id: "room3", icon: "📡", title: "Room 3 ESP", desc: "Relay Switch · Firebase Sync", type: "esp", x: 78, y: 900, w: 140 },
  { id: "relay-r1", icon: "🔌", title: "Room 1 Relay", desc: "Room Appliances", type: "relay", x: 42, y: 1020, w: 120 },
  { id: "relay-r2", icon: "🔌", title: "Room 2 Relay", desc: "Room Appliances", type: "relay", x: 60, y: 1020, w: 120 },
  { id: "relay-r3", icon: "🔌", title: "Room 3 Relay", desc: "Room Appliances", type: "relay", x: 78, y: 1020, w: 120 },
];

const conns: Conn[] = [
  { from: "website", to: "firebase", label: "Realtime State Updates", color: "#818cf8" },
  { from: "firebase", to: "render", label: "Event Monitoring", color: "#fb923c" },
  { from: "firebase", to: "fb-data", label: "", color: "#fb923c", dashed: true },
  { from: "render", to: "telegram", label: "Alert Broadcast", color: "#22d3ee" },
  { from: "telegram", to: "subscribers", label: "Delivery", color: "#38bdf8" },
  { from: "subscribers", to: "alert-types", label: "", color: "#ef4444", dashed: true },
  { from: "firebase", to: "lobby-esp", label: "Realtime Sync", color: "#4ade80" },
  { from: "lobby-esp", to: "nano", label: "UART Serial", color: "#f472b6" },
  { from: "nano", to: "sensors", label: "Sensor Acquisition", color: "#fbbf24" },
  { from: "phys-switch", to: "firebase", label: "State via ESP → Firebase", color: "#4ade80" },
  { from: "lobby-esp", to: "relay-lobby", label: "I2C Relay Control", color: "#a855f7" },
  { from: "virt-switch", to: "firebase", label: "Firebase State Change", color: "#818cf8" },
  { from: "firebase", to: "room1", label: "", color: "#4ade80", dashed: true },
  { from: "firebase", to: "room2", label: "", color: "#4ade80", dashed: true },
  { from: "firebase", to: "room3", label: "", color: "#4ade80", dashed: true },
  { from: "room1", to: "relay-r1", label: "", color: "#a855f7" },
  { from: "room2", to: "relay-r2", label: "", color: "#a855f7" },
  { from: "room3", to: "relay-r3", label: "", color: "#a855f7" },
];

const sectionLabels = [
  { text: "CLOUD LAYER", y: 130, x: 50 },
  { text: "HARDWARE LAYER", y: 395, x: 15 },
  { text: "BACKEND & ALERTS", y: 130, x: 85 },
  { text: "DISTRIBUTED ROOM NODES · FUTURE EXPANSION", y: 870, x: 60 },
];

const TOTAL_H = 1120;

export default function SystemArchitecture() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string; label?: string; dashed?: boolean }[]>([]);

  const computeLines = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const newLines: typeof lines = [];

    conns.forEach(c => {
      const fromEl = nodeRefs.current[c.from];
      const toEl = nodeRefs.current[c.to];
      if (!fromEl || !toEl) return;

      const fRect = fromEl.getBoundingClientRect();
      const tRect = toEl.getBoundingClientRect();

      // From bottom-center of source node
      const x1 = fRect.left + fRect.width / 2 - cRect.left;
      const y1 = fRect.bottom - cRect.top;
      // To top-center of target node
      const x2 = tRect.left + tRect.width / 2 - cRect.left;
      const y2 = tRect.top - cRect.top;

      newLines.push({ x1, y1, x2, y2, color: c.color, label: c.label, dashed: c.dashed });
    });

    setLines(newLines);
  }, []);

  useEffect(() => {
    // Compute after layout paint
    const t = setTimeout(computeLines, 100);
    window.addEventListener("resize", computeLines);
    return () => { clearTimeout(t); window.removeEventListener("resize", computeLines); };
  }, [computeLines]);

  const setNodeRef = (id: string) => (el: HTMLDivElement | null) => { nodeRefs.current[id] = el; };

  return (
    <div className="arch-section">
      <div className="container">
        <div className="text-center" style={{ marginBottom: "1rem" }}>
          <p className="sec-label">System Architecture</p>
          <h2 className="sec-title">IoTMesh <span>Architecture</span> Diagram</h2>
          <p className="sec-desc center">Firebase acts as the Single Source of Truth and Central Realtime State Bus — every data path, control flow, and event pipeline in one unified diagram.</p>
        </div>

        <div ref={containerRef} style={{ position: "relative", width: "100%", height: `${TOTAL_H}px`, marginTop: "2rem" }}>

          {/* ── SVG Connection Lines — pixel-perfect from DOM measurements ── */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "visible" }}>
            <defs>
              {Object.entries(C).map(([k, v]) => (
                <marker key={k} id={`m-${k}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill={v.border} opacity="0.8" />
                </marker>
              ))}
            </defs>
            {lines.map((l, i) => {
              const mk = Object.entries(C).find(([, v]) => v.border === l.color);
              const markerId = mk ? `m-${mk[0]}` : "m-esp";

              // Bezier curve control points
              const dy = l.y2 - l.y1;
              const dx = l.x2 - l.x1;
              const cp = Math.max(Math.abs(dy) * 0.35, 30);

              // For mostly-vertical lines
              const c1x = l.x1;
              const c1y = l.y1 + cp;
              const c2x = l.x2;
              const c2y = l.y2 - cp;

              // Label position
              const lx = (l.x1 + l.x2) / 2 + (dx > 0 ? 8 : -8);
              const ly = (l.y1 + l.y2) / 2;

              return (
                <g key={i}>
                  <path
                    d={`M ${l.x1} ${l.y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${l.x2} ${l.y2}`}
                    fill="none"
                    stroke={l.color}
                    strokeWidth="1.8"
                    strokeDasharray={l.dashed ? "5 5" : "7 4"}
                    markerEnd={`url(#${markerId})`}
                    opacity="0.5"
                  >
                    <animate attributeName="stroke-dashoffset" from="22" to="0" dur="1.8s" repeatCount="indefinite" />
                  </path>
                  {l.label && (
                    <text x={lx} y={ly} fill={l.color} fontSize="8" fontFamily="'Orbitron', sans-serif" textAnchor="middle" opacity="0.55" letterSpacing="0.5">
                      {l.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* ── Section Labels ── */}
          {sectionLabels.map(l => (
            <div key={l.text} style={{
              position: "absolute", left: `${l.x}%`, top: `${l.y}px`,
              transform: "translateX(-50%)",
              fontFamily: "var(--font-head)", fontSize: "0.5rem", letterSpacing: "0.15em",
              color: "rgba(34,211,238,0.3)", whiteSpace: "nowrap", zIndex: 0,
            }}>{l.text}</div>
          ))}

          {/* ── Nodes ── */}
          {nodes.map(n => {
            const col = C[n.type];
            return (
              <div
                key={n.id}
                ref={setNodeRef(n.id)}
                style={{
                  position: "absolute",
                  left: `${n.x}%`,
                  top: `${n.y}px`,
                  transform: "translateX(-50%)",
                  width: n.w ? `${n.w}px` : "140px",
                  background: col.bg,
                  border: `1.5px solid ${col.border}`,
                  borderRadius: "12px",
                  padding: n.list ? "0.6rem 0.8rem" : "0.55rem 0.7rem",
                  textAlign: "center",
                  zIndex: 5,
                  cursor: "default",
                  transition: "all 0.3s ease",
                  boxShadow: `0 0 14px ${col.border}18`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 0 32px ${col.border}55`;
                  e.currentTarget.style.transform = "translateX(-50%) scale(1.06)";
                  e.currentTarget.style.zIndex = "20";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = `0 0 14px ${col.border}18`;
                  e.currentTarget.style.transform = "translateX(-50%) scale(1)";
                  e.currentTarget.style.zIndex = "5";
                }}
              >
                <div style={{ fontSize: "1.1rem", marginBottom: "0.1rem" }}>{n.icon}</div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: "0.6rem", fontWeight: 600, color: col.text, letterSpacing: "0.03em", lineHeight: 1.3 }}>{n.title}</div>
                {n.desc && <div style={{ fontSize: "0.52rem", color: "var(--muted)", marginTop: "0.1rem", lineHeight: 1.4 }}>{n.desc}</div>}
                {n.list && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", justifyContent: "center", marginTop: "0.4rem" }}>
                    {n.list.map(item => (
                      <span key={item} style={{
                        padding: "0.1rem 0.4rem",
                        border: `1px solid ${col.border}33`,
                        borderRadius: "999px",
                        fontSize: "0.48rem",
                        color: col.text,
                        fontFamily: "var(--font-head)",
                        letterSpacing: "0.05em",
                        opacity: 0.7,
                      }}>{item}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
