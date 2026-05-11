import { useState } from "react";

type FlowData = {
  label: string;
  color: string;
  cssClass: string;
  steps: { icon: string; title: string; desc: string }[];
};

const flows: Record<string, FlowData> = {
  gas: {
    label: "Gas Leak Detection",
    color: "#ef4444",
    cssClass: "gas",
    steps: [
      { icon: "🔬", title: "MQ Sensor Reading", desc: "Analog gas concentration measurement" },
      { icon: "📡", title: "ESP Detects Abnormal Gas", desc: "Threshold comparison on-device" },
      { icon: "🔥", title: "Firebase Update", desc: "Gas alert flag set in RTDB" },
      { icon: "⚙️", title: "Render Backend Event", desc: "Cloud processes alert trigger" },
      { icon: "📲", title: "Telegram Alert", desc: "Broadcast to all subscribers" },
      { icon: "🔊", title: "Buzzer Activation", desc: "Local audible alarm triggered" },
    ],
  },
  relay: {
    label: "Smart Relay Control",
    color: "#22d3ee",
    cssClass: "relay",
    steps: [
      { icon: "💬", title: "User Command", desc: "/on or /off via Telegram or Web" },
      { icon: "🔥", title: "Firebase State Update", desc: "Relay state toggled in RTDB" },
      { icon: "📡", title: "ESP Reads Change", desc: "Node polls Firebase for updates" },
      { icon: "🔌", title: "Relay Switching", desc: "GPIO pin state changes" },
      { icon: "✅", title: "Device Feedback", desc: "Confirmation synced back to cloud" },
    ],
  },
  motion: {
    label: "Motion Detection",
    color: "#f59e0b",
    cssClass: "motion",
    steps: [
      { icon: "👁️", title: "PIR Detects Movement", desc: "Infrared motion sensed" },
      { icon: "📡", title: "ESP Updates Firebase", desc: "Motion event flagged in RTDB" },
      { icon: "⚙️", title: "Backend Logs Event", desc: "Timestamp and zone recorded" },
      { icon: "📲", title: "Optional Alert", desc: "Telegram notification if armed" },
    ],
  },
  water: {
    label: "Water Tank Monitoring",
    color: "#3b82f6",
    cssClass: "water",
    steps: [
      { icon: "📏", title: "HC-SR04 Measures Level", desc: "Ultrasonic distance calculation" },
      { icon: "🔥", title: "Firebase Sync", desc: "Water level data uploaded" },
      { icon: "📊", title: "Dashboard Update", desc: "Real-time gauge on frontend" },
      { icon: "⚠️", title: "Alert Generation", desc: "Low/overflow threshold alerts" },
    ],
  },
};

function FlowArrowSmall() {
  return (
    <div className="flow-arrow" style={{ height: "36px" }}>
      <div className="flow-arrow-line" />
      <div className="flow-arrow-head" />
    </div>
  );
}

export default function FeatureFlowcharts() {
  const [active, setActive] = useState<string>("gas");
  const flow = flows[active];

  return (
    <div>
      <div className="container">
        <div className="text-center" style={{ marginBottom: "1rem" }}>
          <p className="sec-label">Flows</p>
          <h2 className="sec-title">Feature <span>Flowcharts</span></h2>
          <p className="sec-desc center">Step-by-step visualization of how key IoTMesh features operate — from sensor trigger to final action.</p>
        </div>

        <div className="ff-tabs">
          {Object.entries(flows).map(([key, f]) => (
            <button
              key={key}
              className={`ff-tab ${active === key ? "active" : ""}`}
              onClick={() => setActive(key)}
              style={active === key ? { borderColor: f.color, color: f.color } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="ff-flow" key={active}>
          {flow.steps.map((step, i) => (
            <div key={step.title} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                className={`ff-step ${flow.cssClass}`}
                style={{ animation: `fadeUp 0.4s ${i * 80}ms ease both` }}
              >
                <div className="ff-step-icon">{step.icon}</div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
              {i < flow.steps.length - 1 && <FlowArrowSmall />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
