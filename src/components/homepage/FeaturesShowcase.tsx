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

// ── Feature categories ──
interface Feature {
  name: string;
  category: string;
}

const categories = [
  { key: "all", label: "All Features" },
  { key: "automation", label: "Automation" },
  { key: "sensors", label: "Sensors" },
  { key: "cloud", label: "Cloud & Backend" },
  { key: "alerts", label: "Alerts & Notifications" },
  { key: "voice", label: "Voice & Integrations" },
  { key: "architecture", label: "Architecture" },
];

const features: Feature[] = [
  // Automation
  { name: "ESP32-based smart automation", category: "automation" },
  { name: "Remote light control", category: "automation" },
  { name: "Remote fan control", category: "automation" },
  { name: "Relay switching system", category: "automation" },
  { name: "Lobby light voice control", category: "automation" },
  { name: "Home appliance automation", category: "automation" },
  { name: "Home automation workflows", category: "automation" },
  { name: "Voice-triggered appliance control", category: "automation" },
  { name: "Automation-ready architecture", category: "automation" },

  // Sensors & Monitoring
  { name: "Real-time sensor monitoring", category: "sensors" },
  { name: "Temperature monitoring", category: "sensors" },
  { name: "Humidity monitoring", category: "sensors" },
  { name: "Gas leakage detection", category: "sensors" },
  { name: "Air quality monitoring", category: "sensors" },
  { name: "Voltage monitoring", category: "sensors" },
  { name: "Battery percentage monitoring", category: "sensors" },
  { name: "Rain detection system", category: "sensors" },
  { name: "Water tank monitoring", category: "sensors" },
  { name: "Ultrasonic water level sensing", category: "sensors" },
  { name: "Pressure-based weather prediction", category: "sensors" },
  { name: "Smart weather analysis", category: "sensors" },
  { name: "Smart energy monitoring", category: "sensors" },
  { name: "Remote monitoring system", category: "sensors" },

  // Cloud & Backend
  { name: "Real-time cloud synchronization", category: "cloud" },
  { name: "Firebase Realtime Database integration", category: "cloud" },
  { name: "Cloud-based automation server", category: "cloud" },
  { name: "24/7 Render backend hosting", category: "cloud" },
  { name: "Realtime database listeners", category: "cloud" },
  { name: "Cloud-connected IoT ecosystem", category: "cloud" },
  { name: "Always-online automation backend", category: "cloud" },
  { name: "Secure token-based integrations", category: "cloud" },
  { name: "Realtime event processing", category: "cloud" },
  { name: "Cloud-hosted smart assistant", category: "cloud" },
  { name: "Live device state updates", category: "cloud" },

  // Alerts & Notifications
  { name: "Real-time notifications", category: "alerts" },
  { name: "Instant Telegram alerts", category: "alerts" },
  { name: "Low battery alerts", category: "alerts" },
  { name: "Power failure detection", category: "alerts" },
  { name: "Sensor threshold alerts", category: "alerts" },
  { name: "Automatic alert broadcasting", category: "alerts" },
  { name: "Smart alert engine", category: "alerts" },

  // Voice & Integrations
  { name: "Telegram bot control system", category: "voice" },
  { name: "Google Assistant voice control", category: "voice" },
  { name: "IFTTT automation integration", category: "voice" },
  { name: "Voice command processing", category: "voice" },
  { name: "Multi-platform smart control", category: "voice" },
  { name: "Voice-driven sensor inquiries", category: "voice" },
  { name: "Smart home ecosystem bridge", category: "voice" },
  { name: "Webhook-based trigger system", category: "voice" },

  // System Architecture & Hardware
  { name: "Microcontroller mesh network", category: "architecture" },
  { name: "Multi-MCU communication bus", category: "architecture" },
  { name: "UART inter-chip data channel", category: "architecture" },
  { name: "I2C multi-sensor bus topology", category: "architecture" },
  { name: "Fail-safe relay driver circuitry", category: "architecture" },
  { name: "Dual-MCU telemetry pipeline", category: "architecture" },
  { name: "Hardware heartbeat watchdog", category: "architecture" },
  { name: "Dual-temperature calibration engine", category: "architecture" },
  { name: "Modular room node architecture", category: "architecture" },
  { name: "Single Source of Truth paradigm", category: "architecture" },
];

export const FeaturesShowcase = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const { ref, visible } = useInView(0.05);

  const filtered = activeCategory === "all"
    ? features
    : features.filter(f => f.category === activeCategory);

  const count = filtered.length;

  return (
    <div
      ref={ref}
      className={`feat-section ${visible ? "feat-visible" : ""}`}
      style={{
        position: "relative",
        padding: "100px 0 80px",
        overflow: "hidden",
      }}
    >
      <style>{`
        .feat-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .feat-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-head);
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.75rem;
        }
        .feat-title {
          font-family: var(--font-head);
          font-size: clamp(1.6rem, 3.5vw, 2.4rem);
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.02em;
          line-height: 1.15;
          margin-bottom: 0.85rem;
        }
        .feat-desc {
          max-width: 580px;
          margin: 0 auto 1.5rem;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }
        .feat-count-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0.3rem 0.9rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          font-family: var(--font-head);
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          color: #ffffff;
        }
        .feat-count-num {
          font-weight: 700;
          color: #ffffff;
        }

        /* Tabs */
        .feat-tabs {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 2.5rem;
        }
        .feat-tab {
          padding: 0.5rem 1.2rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          font-family: var(--font-head);
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .feat-tab:hover {
          border-color: rgba(255, 255, 255, 0.3);
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
        }
        .feat-tab.active {
          border-color: #ffffff;
          color: #000000;
          background: #ffffff;
          font-weight: 700;
        }

        /* Feature Grid */
        .feat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
        }

        /* Feature Card */
        .feat-card {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 1.2rem 1.3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: default;
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
          opacity: 0;
          transform: translateY(16px);
          min-height: 90px;
        }
        .feat-section.feat-visible .feat-card {
          opacity: 1;
          transform: translateY(0);
        }

        .feat-card:hover {
          border-color: rgba(255, 255, 255, 0.35);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
          transform: translateY(-2px) !important;
        }

        .feat-card-content {
          flex: 1;
        }
        .feat-card-name {
          font-family: var(--font-head);
          font-size: 0.8rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.02em;
          line-height: 1.35;
        }
        .feat-card-cat {
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: monospace;
          margin-top: 0.5rem;
        }

        @media (max-width: 768px) {
          .feat-grid {
            grid-template-columns: 1fr;
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
              {cat.label}
            </button>
          ))}
        </div>

        {/* Feature Grid */}
        <div className="feat-grid">
          {filtered.map((feat, idx) => (
            <div
              key={feat.name}
              className="feat-card"
              style={{
                transitionDelay: visible ? `${Math.min(idx * 20, 400)}ms` : "0ms",
              } as React.CSSProperties}
            >
              <div className="feat-card-content">
                <div className="feat-card-name">{feat.name}</div>
                <div className="feat-card-cat">{feat.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesShowcase;
