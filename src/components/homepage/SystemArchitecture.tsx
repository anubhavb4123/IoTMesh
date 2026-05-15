import { useEffect, useRef, useState } from "react";

/* ─── Color palette for layers ─── */
const LAYER = {
  client:   { bg: "rgba(99,102,241,0.08)",  border: "#818cf8", accent: "#a5b4fc", label: "CLIENT LAYER" },
  cloud:    { bg: "rgba(251,146,60,0.08)",   border: "#fb923c", accent: "#fdba74", label: "CLOUD LAYER" },
  backend:  { bg: "rgba(34,211,238,0.08)",   border: "#22d3ee", accent: "#67e8f9", label: "BACKEND LAYER" },
  hardware: { bg: "rgba(74,222,128,0.08)",   border: "#4ade80", accent: "#86efac", label: "HARDWARE LAYER" },
  notify:   { bg: "rgba(56,189,248,0.08)",   border: "#38bdf8", accent: "#7dd3fc", label: "NOTIFICATION LAYER" },
  sensor:   { bg: "rgba(251,191,36,0.08)",   border: "#fbbf24", accent: "#fcd34d", label: "SENSOR LAYER" },
};

type NodeDef = { id: string; icon: string; title: string; sub?: string; color: string; glow: string };

/* ─── Nodes per layer ─── */
const clientNodes: NodeDef[] = [
  { id: "web", icon: "🖥️", title: "Web Dashboard", sub: "React + TypeScript", color: "#818cf8", glow: "rgba(99,102,241,0.3)" },
  { id: "mobile", icon: "📱", title: "Mobile Browser", sub: "Responsive PWA", color: "#818cf8", glow: "rgba(99,102,241,0.3)" },
  { id: "telegram-ui", icon: "💬", title: "Telegram Chat", sub: "Bot Commands", color: "#38bdf8", glow: "rgba(56,189,248,0.3)" },
];

const cloudNodes: NodeDef[] = [
  { id: "firebase", icon: "🔥", title: "Firebase RTDB", sub: "Single Source of Truth", color: "#fb923c", glow: "rgba(251,146,60,0.35)" },
  { id: "auth", icon: "🔐", title: "Firebase Auth", sub: "User Sessions", color: "#fb923c", glow: "rgba(251,146,60,0.25)" },
];

const backendNodes: NodeDef[] = [
  { id: "render", icon: "⚙️", title: "Render Backend", sub: "Node.js Event Engine", color: "#22d3ee", glow: "rgba(34,211,238,0.3)" },
  { id: "alert-proc", icon: "🔔", title: "Alert Processor", sub: "Threshold Detection", color: "#ef4444", glow: "rgba(239,68,68,0.25)" },
  { id: "weather", icon: "🌤️", title: "Weather API", sub: "Forecast Engine", color: "#22d3ee", glow: "rgba(34,211,238,0.2)" },
];

const notifyNodes: NodeDef[] = [
  { id: "telegram-bot", icon: "🤖", title: "Telegram Bot API", sub: "Alert Broadcast", color: "#38bdf8", glow: "rgba(56,189,248,0.3)" },
  { id: "subscribers", icon: "👥", title: "Subscribers", sub: "Admin + Guest Users", color: "#38bdf8", glow: "rgba(56,189,248,0.2)" },
];

const hardwareNodes: NodeDef[] = [
  { id: "lobby-esp", icon: "📡", title: "Lobby ESP8266", sub: "Main Controller", color: "#4ade80", glow: "rgba(74,222,128,0.3)" },
  { id: "room-esp1", icon: "📡", title: "Room 1 ESP", sub: "Node Controller", color: "#4ade80", glow: "rgba(74,222,128,0.2)" },
  { id: "room-esp2", icon: "📡", title: "Room 2 ESP", sub: "Node Controller", color: "#4ade80", glow: "rgba(74,222,128,0.2)" },
  { id: "nano", icon: "🔧", title: "Arduino Nano", sub: "Sensor MCU · UART", color: "#f472b6", glow: "rgba(244,114,182,0.25)" },
];

const sensorNodes: NodeDef[] = [
  { id: "s-gas", icon: "🔬", title: "MQ Gas", color: "#ef4444", glow: "rgba(239,68,68,0.2)" },
  { id: "s-dht", icon: "🌡️", title: "DHT11", color: "#fbbf24", glow: "rgba(251,191,36,0.2)" },
  { id: "s-bmp", icon: "🏔️", title: "BMP180", color: "#fbbf24", glow: "rgba(251,191,36,0.2)" },
  { id: "s-water", icon: "💧", title: "HC-SR04", color: "#3b82f6", glow: "rgba(59,130,246,0.2)" },
  { id: "s-rtc", icon: "⏰", title: "DS3231", color: "#fbbf24", glow: "rgba(251,191,36,0.2)" },
  { id: "s-relay", icon: "🔌", title: "6ch Relay", color: "#a855f7", glow: "rgba(168,85,247,0.25)" },
  { id: "s-batt", icon: "🔋", title: "Battery", color: "#22c55e", glow: "rgba(34,197,94,0.2)" },
  { id: "s-buzzer", icon: "🔊", title: "Buzzer", color: "#ef4444", glow: "rgba(239,68,68,0.2)" },
];

/* ─── Connection arrows ─── */
type Arrow = { from: string; to: string; label: string; color: string; dashed?: boolean };
const arrows: Arrow[] = [
  { from: "clients", to: "cloud",    label: "HTTPS / WebSocket",   color: "#818cf8" },
  { from: "cloud",   to: "backend",  label: "Event Listeners",     color: "#fb923c" },
  { from: "cloud",   to: "hardware", label: "Realtime Sync",       color: "#4ade80" },
  { from: "backend", to: "notify",   label: "Alert Dispatch",      color: "#22d3ee" },
  { from: "hardware",to: "sensors",  label: "I2C · UART · GPIO",   color: "#f472b6" },
];

/* ─── Node Card Component ─── */
function NodeCard({ node }: { node: NodeDef }) {
  return (
    <div className="sd-node" style={{ "--node-color": node.color, "--node-glow": node.glow } as React.CSSProperties}>
      <div className="sd-node-icon">{node.icon}</div>
      <div className="sd-node-title">{node.title}</div>
      {node.sub && <div className="sd-node-sub">{node.sub}</div>}
    </div>
  );
}

/* ─── Layer Section Component ─── */
function LayerSection({ layerKey, label, nodes, children }: {
  layerKey: keyof typeof LAYER; label?: string; nodes?: NodeDef[]; children?: React.ReactNode;
}) {
  const l = LAYER[layerKey];
  return (
    <div className="sd-layer" style={{ "--layer-bg": l.bg, "--layer-border": l.border, "--layer-accent": l.accent } as React.CSSProperties}>
      <div className="sd-layer-label">{label || l.label}</div>
      <div className="sd-layer-nodes">
        {nodes?.map(n => <NodeCard key={n.id} node={n} />)}
        {children}
      </div>
    </div>
  );
}

/* ─── Flow Arrow Between Layers ─── */
function FlowArrow({ label, color }: { label: string; color: string }) {
  return (
    <div className="sd-flow-arrow">
      <div className="sd-flow-line" style={{ background: `linear-gradient(180deg, ${color}, ${color}44)` }}>
        <div className="sd-flow-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
      <div className="sd-flow-label" style={{ color }}>{label}</div>
      <div className="sd-flow-head" style={{ borderTopColor: color }} />
    </div>
  );
}

/* ─── Main Component ─── */
export default function SystemArchitecture() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="sd-section" ref={sectionRef}>
      <div className="container">
        <div className="text-center" style={{ marginBottom: "2rem" }}>
          <p className="sec-label">System Architecture</p>
          <h2 className="sec-title">IoTMesh <span>System Design</span></h2>
          <p className="sec-desc center">
            Complete system design diagram — from client interfaces through cloud infrastructure
            to distributed hardware nodes. Firebase acts as the Single Source of Truth.
          </p>
        </div>

        <div className={`sd-diagram ${visible ? "sd-visible" : ""}`}>
          {/* Title Bar */}
          <div className="sd-diagram-header">
            <div className="sd-diagram-title">
              <span className="sd-dot" style={{ background: "#22d3ee" }} />
              IoTMesh System Design
            </div>
            <div className="sd-diagram-badge">LIVE ARCHITECTURE</div>
          </div>

          <div className="sd-diagram-body">
            {/* 1. CLIENT LAYER */}
            <LayerSection layerKey="client" nodes={clientNodes} />

            <FlowArrow label="HTTPS / WebSocket" color="#818cf8" />

            {/* 2. CLOUD LAYER */}
            <LayerSection layerKey="cloud" nodes={cloudNodes} />

            {/* Split into two branches */}
            <div className="sd-branches">
              {/* Left branch: Hardware */}
              <div className="sd-branch">
                <FlowArrow label="Realtime Sync" color="#4ade80" />
                <LayerSection layerKey="hardware" nodes={hardwareNodes} />
                <FlowArrow label="I2C · UART · GPIO" color="#f472b6" />
                <LayerSection layerKey="sensor" label="SENSOR & ACTUATOR LAYER" nodes={sensorNodes} />
              </div>

              {/* Right branch: Backend + Notifications */}
              <div className="sd-branch">
                <FlowArrow label="Event Listeners" color="#fb923c" />
                <LayerSection layerKey="backend" nodes={backendNodes} />
                <FlowArrow label="Alert Dispatch" color="#22d3ee" />
                <LayerSection layerKey="notify" nodes={notifyNodes} />
              </div>
            </div>

            {/* Data flow legend */}
            <div className="sd-legend">
              <div className="sd-legend-title">DATA FLOW LEGEND</div>
              <div className="sd-legend-items">
                {[
                  { color: "#818cf8", label: "Client → Cloud" },
                  { color: "#fb923c", label: "Cloud → Backend" },
                  { color: "#4ade80", label: "Cloud ↔ Hardware" },
                  { color: "#22d3ee", label: "Backend → Notify" },
                  { color: "#f472b6", label: "MCU → Sensors" },
                  { color: "#fbbf24", label: "Sensor Data" },
                ].map(l => (
                  <div key={l.label} className="sd-legend-item">
                    <div className="sd-legend-dot" style={{ background: l.color }} />
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
