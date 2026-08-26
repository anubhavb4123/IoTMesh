import { useEffect, useRef, useState } from "react";
import {
  Monitor,
  Smartphone,
  MessageSquare,
  Database,
  KeyRound,
  Server,
  Bell,
  Mic,
  Bot,
  Users,
  Radio,
  Cpu,
  CircuitBoard,
  Flame,
  Thermometer,
  Gauge,
  Droplets,
  Clock,
  Zap,
  BatteryCharging,
  Volume2,
  LucideIcon
} from "lucide-react";

/* ─── Monochrome palette for layers ─── */
const LAYER = {
  client:   { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.12)", accent: "#ffffff", label: "CLIENT LAYER" },
  cloud:    { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.12)", accent: "#ffffff", label: "CLOUD LAYER" },
  backend:  { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.12)", accent: "#ffffff", label: "BACKEND LAYER" },
  hardware: { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.12)", accent: "#ffffff", label: "HARDWARE LAYER" },
  notify:   { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.12)", accent: "#ffffff", label: "NOTIFICATION LAYER" },
  sensor:   { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.12)", accent: "#ffffff", label: "SENSOR LAYER" },
};

type NodeDef = { id: string; icon: LucideIcon; title: string; sub?: string };

/* ─── Nodes per layer ─── */
const clientNodes: NodeDef[] = [
  { id: "web", icon: Monitor, title: "Web Dashboard", sub: "React + TypeScript" },
  { id: "mobile", icon: Smartphone, title: "Mobile Browser", sub: "Responsive PWA" },
  { id: "telegram-ui", icon: MessageSquare, title: "Telegram Chat", sub: "Bot Commands" },
];

const cloudNodes: NodeDef[] = [
  { id: "firebase", icon: Database, title: "Firebase RTDB", sub: "Single Source of Truth" },
  { id: "auth", icon: KeyRound, title: "Firebase Auth", sub: "User Sessions" },
];

const backendNodes: NodeDef[] = [
  { id: "render", icon: Server, title: "Render Backend", sub: "Node.js Event Engine" },
  { id: "alert-proc", icon: Bell, title: "Alert Processor", sub: "Threshold Detection" },
  { id: "weather", icon: Mic, title: "Google Voice Agent", sub: "Voice AI Interface" },
];

const notifyNodes: NodeDef[] = [
  { id: "telegram-bot", icon: Bot, title: "Telegram Bot API", sub: "Alert Broadcast" },
  { id: "subscribers", icon: Users, title: "Subscribers", sub: "Admin + Guest Users" },
];

const hardwareNodes: NodeDef[] = [
  { id: "lobby-esp", icon: Radio, title: "Lobby ESP8266", sub: "Main Controller" },
  { id: "room-esp1", icon: Cpu, title: "Room 1 ESP", sub: "Node Controller" },
  { id: "room-esp2", icon: Cpu, title: "Room 2 ESP", sub: "Node Controller" },
  { id: "nano", icon: CircuitBoard, title: "Arduino Nano", sub: "Sensor MCU · UART" },
];

const sensorNodes: NodeDef[] = [
  { id: "s-gas", icon: Flame, title: "MQ Gas" },
  { id: "s-dht", icon: Thermometer, title: "DHT11" },
  { id: "s-bmp", icon: Gauge, title: "BMP180" },
  { id: "s-water", icon: Droplets, title: "HC-SR04" },
  { id: "s-rtc", icon: Clock, title: "DS3231" },
  { id: "s-relay", icon: Zap, title: "6ch Relay" },
  { id: "s-batt", icon: BatteryCharging, title: "Battery" },
  { id: "s-buzzer", icon: Volume2, title: "Buzzer" },
];

/* ─── Node Card Component ─── */
function NodeCard({ node }: { node: NodeDef }) {
  const Icon = node.icon;
  return (
    <div className="sd-node">
      <div className="sd-node-icon flex items-center justify-center">
        <Icon className="w-5 h-5 text-white stroke-[1.8]" />
      </div>
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
function FlowArrow({ label }: { label: string }) {
  return (
    <div className="sd-flow-arrow">
      <div className="sd-flow-line">
        <div className="sd-flow-dot" />
      </div>
      <div className="sd-flow-label">{label}</div>
      <div className="sd-flow-head" />
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
              <span className="sd-dot" style={{ background: "#ffffff" }} />
              IoTMesh System Design
            </div>
            <div className="sd-diagram-badge">LIVE ARCHITECTURE</div>
          </div>

          <div className="sd-diagram-body">
            {/* 1. CLIENT LAYER */}
            <LayerSection layerKey="client" nodes={clientNodes} />

            <FlowArrow label="HTTPS / WebSocket" />

            {/* 2. CLOUD LAYER */}
            <LayerSection layerKey="cloud" nodes={cloudNodes} />

            {/* Split into two branches */}
            <div className="sd-branches">
              {/* Left branch: Hardware */}
              <div className="sd-branch">
                <FlowArrow label="Realtime Sync" />
                <LayerSection layerKey="hardware" nodes={hardwareNodes} />
                <FlowArrow label="I2C · UART · GPIO" />
                <LayerSection layerKey="sensor" label="SENSOR & ACTUATOR LAYER" nodes={sensorNodes} />
              </div>

              {/* Right branch: Backend + Notifications */}
              <div className="sd-branch">
                <FlowArrow label="Event Listeners" />
                <LayerSection layerKey="backend" nodes={backendNodes} />
                <FlowArrow label="Alert Dispatch" />
                <LayerSection layerKey="notify" nodes={notifyNodes} />
              </div>
            </div>

            {/* Data flow legend */}
            <div className="sd-legend">
              <div className="sd-legend-title">DATA FLOW LEGEND</div>
              <div className="sd-legend-items">
                {[
                  { label: "Client → Cloud" },
                  { label: "Cloud → Backend" },
                  { label: "Cloud ↔ Hardware" },
                  { label: "Backend → Notify" },
                  { label: "MCU → Sensors" },
                  { label: "Sensor Data" },
                ].map(l => (
                  <div key={l.label} className="sd-legend-item">
                    <div className="sd-legend-dot" style={{ background: "#ffffff" }} />
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
