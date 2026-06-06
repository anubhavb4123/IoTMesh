import { useState, useEffect, useRef } from "react";

// ── Scroll-reveal hook ──
function useInView(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ── Feature categories with icons and colors ──
interface Feature {
  name: string;
  icon: string;
  category: string;
}

const categories = [
  { key: "all", label: "All Features", icon: "⬡" },
  { key: "automation", label: "Automation", icon: "⚙" },
  { key: "sensors", label: "Sensors", icon: "📡" },
  { key: "cloud", label: "Cloud & Backend", icon: "☁" },
  { key: "alerts", label: "Alerts & Notifications", icon: "🔔" },
  { key: "voice", label: "Voice & Integrations", icon: "🎙" },
  { key: "architecture", label: "Architecture", icon: "🏗" },
];

const categoryColors: Record<string, { accent: string; glow: string; bg: string }> = {
  automation: { accent: "#22d3ee", glow: "rgba(34,211,238,0.25)", bg: "rgba(34,211,238,0.06)" },
  sensors: { accent: "#a78bfa", glow: "rgba(167,139,250,0.25)", bg: "rgba(167,139,250,0.06)" },
  cloud: { accent: "#34d399", glow: "rgba(52,211,153,0.25)", bg: "rgba(52,211,153,0.06)" },
  alerts: { accent: "#f59e0b", glow: "rgba(245,158,11,0.25)", bg: "rgba(245,158,11,0.06)" },
  voice: { accent: "#f472b6", glow: "rgba(244,114,182,0.25)", bg: "rgba(244,114,182,0.06)" },
  architecture: { accent: "#60a5fa", glow: "rgba(96,165,250,0.25)", bg: "rgba(96,165,250,0.06)" },
};

const features: Feature[] = [
  // Automation
  { name: "ESP32-based smart automation", icon: "🔌", category: "automation" },
  { name: "Remote light control", icon: "💡", category: "automation" },
  { name: "Remote fan control", icon: "🌀", category: "automation" },
  { name: "Relay switching system", icon: "🔀", category: "automation" },
  { name: "Lobby light voice control", icon: "🏠", category: "automation" },
  { name: "Home appliance automation", icon: "🏡", category: "automation" },
  { name: "Home automation workflows", icon: "🔄", category: "automation" },
  { name: "Voice-triggered appliance control", icon: "🗣", category: "automation" },
  { name: "Automation-ready architecture", icon: "🧩", category: "automation" },

  // Sensors & Monitoring
  { name: "Real-time sensor monitoring", icon: "📊", category: "sensors" },
  { name: "Temperature monitoring", icon: "🌡", category: "sensors" },
  { name: "Humidity monitoring", icon: "💧", category: "sensors" },
  { name: "Gas leakage detection", icon: "⚠", category: "sensors" },
  { name: "Air quality monitoring", icon: "🌬", category: "sensors" },
  { name: "Voltage monitoring", icon: "⚡", category: "sensors" },
  { name: "Battery percentage monitoring", icon: "🔋", category: "sensors" },
  { name: "Rain detection system", icon: "🌧", category: "sensors" },
  { name: "Water tank monitoring", icon: "🪣", category: "sensors" },
  { name: "Ultrasonic water level sensing", icon: "📏", category: "sensors" },
  { name: "Pressure-based weather prediction", icon: "🌤", category: "sensors" },
  { name: "Smart weather analysis", icon: "🌦", category: "sensors" },
  { name: "Smart energy monitoring", icon: "🔆", category: "sensors" },
  { name: "Remote monitoring system", icon: "🖥", category: "sensors" },

  // Cloud & Backend
  { name: "Real-time cloud synchronization", icon: "🔄", category: "cloud" },
  { name: "Firebase Realtime Database integration", icon: "🔥", category: "cloud" },
  { name: "Cloud-based automation server", icon: "🖧", category: "cloud" },
  { name: "24/7 Render backend hosting", icon: "🟢", category: "cloud" },
  { name: "Realtime database listeners", icon: "👂", category: "cloud" },
  { name: "Cloud-connected IoT ecosystem", icon: "🌐", category: "cloud" },
  { name: "Always-online automation backend", icon: "🔗", category: "cloud" },
  { name: "Secure token-based integrations", icon: "🔐", category: "cloud" },
  { name: "Realtime event processing", icon: "⚡", category: "cloud" },
  { name: "Cloud-hosted smart assistant", icon: "🤖", category: "cloud" },
  { name: "Live device state updates", icon: "📡", category: "cloud" },

  // Alerts & Notifications
  { name: "Real-time notifications", icon: "🔔", category: "alerts" },
  { name: "Instant Telegram alerts", icon: "📲", category: "alerts" },
  { name: "Low battery alerts", icon: "🪫", category: "alerts" },
  { name: "Power failure detection", icon: "🔌", category: "alerts" },
  { name: "Sensor threshold alerts", icon: "📈", category: "alerts" },
  { name: "Automatic alert broadcasting", icon: "📢", category: "alerts" },
  { name: "Smart alert engine", icon: "🧠", category: "alerts" },

  // Voice & Integrations
  { name: "Telegram bot control system", icon: "🤖", category: "voice" },
  { name: "Google Assistant voice control", icon: "🎤", category: "voice" },
  { name: "IFTTT automation integration", icon: "🔗", category: "voice" },
  { name: "Voice command processing", icon: "🎙", category: "voice" },
  { name: "Webhook support", icon: "🪝", category: "voice" },
  { name: "Google Assistant scene activation", icon: "🎬", category: "voice" },
  { name: "Telegram group integrations", icon: "👥", category: "voice" },

  // Architecture
  { name: "ESP32 remote command execution", icon: "📤", category: "architecture" },
  { name: "Bi-directional device communication", icon: "↔", category: "architecture" },
  { name: "Multi-device architecture", icon: "🔀", category: "architecture" },
  { name: "Custom command parser", icon: "⌨", category: "architecture" },
  { name: "Admin-controlled automation", icon: "🛡", category: "architecture" },
  { name: "Scalable IoT infrastructure", icon: "📐", category: "architecture" },
  { name: "Online smart-home dashboard", icon: "📱", category: "architecture" },
];

const FeaturesShowcase = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const { ref, visible } = useInView(0.02);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const filtered = activeCategory === "all"
    ? features
    : features.filter(f => f.category === activeCategory);

  const count = filtered.length;

  return (
    <div ref={ref} className={`feat-section ${visible ? "feat-visible" : ""}`}>
      <style>{`
        .feat-section {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .feat-section.feat-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .feat-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        .feat-label {
          font-family: var(--font-head);
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          color: var(--cyan);
          text-transform: uppercase;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .feat-label::before,
        .feat-label::after {
          content: '';
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--cyan), transparent);
        }
        .feat-title {
          font-family: var(--font-head);
          font-size: clamp(1.6rem, 3.5vw, 2.6rem);
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: 1rem;
          letter-spacing: -0.01em;
          color: var(--white);
        }
        .feat-title span { color: var(--cyan); }
        .feat-desc {
          color: var(--muted);
          max-width: 650px;
          margin: 0 auto 0.5rem;
          font-size: 1rem;
          line-height: 1.8;
        }
        .feat-count-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 1rem;
          padding: 0.4rem 1.2rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--cyan-dim);
          font-family: var(--font-head);
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          color: var(--cyan);
          transition: all 0.3s ease;
        }
        .feat-count-badge .feat-count-num {
          font-weight: 700;
          font-size: 0.85rem;
        }

        /* Category Tabs */
        .feat-tabs {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 2.5rem;
        }
        .feat-tab {
          padding: 0.5rem 1.2rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: transparent;
          color: var(--muted);
          font-family: var(--font-head);
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .feat-tab:hover {
          border-color: rgba(34,211,238,0.4);
          color: var(--white);
          background: rgba(34,211,238,0.05);
        }
        .feat-tab.active {
          border-color: var(--cyan);
          color: var(--cyan);
          background: var(--cyan-dim);
          box-shadow: 0 0 20px rgba(34,211,238,0.15);
        }
        .feat-tab-icon {
          font-size: 0.8rem;
        }

        /* Feature Grid */
        .feat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
        }

        /* Feature Card */
        .feat-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.1rem 1.2rem;
          display: flex;
          align-items: center;
          gap: 0.9rem;
          cursor: default;
          position: relative;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          transform: translateY(16px);
        }
        .feat-section.feat-visible .feat-card {
          opacity: 1;
          transform: translateY(0);
        }

        .feat-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--feat-glow, rgba(34,211,238,0.12)), transparent 60%);
          opacity: 0;
          transition: opacity 0.35s;
          pointer-events: none;
        }
        .feat-card:hover {
          border-color: var(--feat-accent, var(--cyan));
          transform: translateY(-4px) !important;
          box-shadow: 0 12px 40px var(--feat-glow, rgba(34,211,238,0.12)),
                      0 0 24px var(--feat-glow, rgba(34,211,238,0.08));
        }
        .feat-card:hover::before { opacity: 1; }

        .feat-card-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
          background: var(--feat-bg, rgba(34,211,238,0.06));
          border: 1px solid var(--feat-glow, rgba(34,211,238,0.15));
          transition: all 0.35s ease;
          position: relative;
          z-index: 1;
        }
        .feat-card:hover .feat-card-icon {
          box-shadow: 0 0 16px var(--feat-glow, rgba(34,211,238,0.25));
          transform: scale(1.08);
        }

        .feat-card-content {
          flex: 1;
          position: relative;
          z-index: 1;
        }
        .feat-card-name {
          font-family: var(--font-head);
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--white);
          letter-spacing: 0.02em;
          line-height: 1.3;
          transition: color 0.3s;
        }
        .feat-card:hover .feat-card-name {
          color: var(--feat-accent, var(--cyan));
        }
        .feat-card-cat {
          font-size: 0.6rem;
          color: var(--muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: var(--font-head);
          margin-top: 0.15rem;
          opacity: 0.7;
        }

        /* Pulse dot on active cards */
        .feat-card-pulse {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--feat-accent, var(--cyan));
          opacity: 0;
          transition: opacity 0.3s;
        }
        .feat-card:hover .feat-card-pulse {
          opacity: 1;
          animation: featPulse 1.5s ease-in-out infinite;
        }
        @keyframes featPulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--feat-glow, rgba(34,211,238,0.4)); }
          50% { box-shadow: 0 0 0 6px transparent; }
        }

        /* Bottom summary bar */
        .feat-summary {
          margin-top: 3rem;
          padding: 1.5rem 2rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: rgba(34,211,238,0.02);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3rem;
          flex-wrap: wrap;
        }
        .feat-summary-item {
          text-align: center;
        }
        .feat-summary-num {
          font-family: var(--font-head);
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--cyan);
          text-shadow: 0 0 16px rgba(34,211,238,0.3);
          line-height: 1.1;
        }
        .feat-summary-label {
          font-size: 0.65rem;
          color: var(--muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 0.2rem;
          font-family: var(--font-head);
        }

        @media (max-width: 768px) {
          .feat-grid {
            grid-template-columns: 1fr;
          }
          .feat-summary {
            gap: 1.5rem;
          }
          .feat-tabs {
            gap: 0.35rem;
          }
          .feat-tab {
            padding: 0.4rem 0.8rem;
            font-size: 0.6rem;
          }
        }

        @media (min-width: 1200px) {
          .feat-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <div className="container">
        {/* Header */}
        <div className="feat-header">
          <div className="feat-label">Complete Feature Suite</div>
          <h2 className="feat-title">
            55+ Powerful <span>Features</span>
          </h2>
          <p className="feat-desc">
            From real-time sensor monitoring to cloud-powered voice automation — every capability
            built into the IoTMesh ecosystem.
          </p>
          <div className="feat-count-badge">
            <span className="feat-count-num">{count}</span> features
            {activeCategory !== "all" && " in this category"}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="feat-tabs">
          {categories.map(cat => (
            <button
              key={cat.key}
              className={`feat-tab ${activeCategory === cat.key ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              <span className="feat-tab-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Feature Grid */}
        <div className="feat-grid">
          {filtered.map((feat, idx) => {
            const colors = categoryColors[feat.category] || categoryColors.automation;
            return (
              <div
                key={feat.name}
                className="feat-card"
                style={{
                  "--feat-accent": colors.accent,
                  "--feat-glow": colors.glow,
                  "--feat-bg": colors.bg,
                  transitionDelay: visible ? `${Math.min(idx * 30, 600)}ms` : "0ms",
                } as React.CSSProperties}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="feat-card-icon">{feat.icon}</div>
                <div className="feat-card-content">
                  <div className="feat-card-name">{feat.name}</div>
                  <div className="feat-card-cat">{feat.category}</div>
                </div>
                <div className="feat-card-pulse" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeaturesShowcase;
