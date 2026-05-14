const dataFlow = [
  { icon: "📡", title: "ESP Room Nodes", desc: "Sensors collect environmental data", badge: "HARDWARE LAYER" },
  { icon: "🔥", title: "Firebase Realtime DB", desc: "Cloud synchronization & state management", badge: "CLOUD LAYER" },
  { icon: "⚙️", title: "Render Backend Engine", desc: "Event processing & automation logic", badge: "BACKEND LAYER" },
  { icon: "📲", title: "Telegram Notification Engine", desc: "Alert dispatch & command interface", badge: "MESSAGING LAYER" },
  { icon: "👥", title: "Subscribers / Dashboard", desc: "End-user delivery & monitoring", badge: "USER LAYER" },
];

const controlFlow = [
  { icon: "💬", title: "User Command", desc: "Telegram /command or Dashboard action", badge: "INPUT" },
  { icon: "🔥", title: "Firebase State Update", desc: "Cloud state modified in real time", badge: "CLOUD SYNC" },
  { icon: "📡", title: "ESP Reads Changes", desc: "Node polls Firebase for state deltas", badge: "DEVICE SYNC" },
  { icon: "🔌", title: "Relay Switching", desc: "GPIO pin state toggled on ESP", badge: "ACTUATION" },
  { icon: "⚡", title: "Physical Device Action", desc: "Light/Fan/Motor activated or deactivated", badge: "OUTPUT" },
];



function FlowArrow() {
  return (
    <div className="arch-arrow">
      <div className="arch-arrow-line" />
      <div className="arch-arrow-head" />
    </div>
  );
}

function FlowColumn({ label, steps }: { label: string; steps: typeof dataFlow }) {
  return (
    <div className="arch-flow-column">
      <div className="arch-flow-label">{label}</div>
      {steps.map((step, i) => (
        <div key={step.title}>
          <div className="arch-node">
            <div className="arch-node-icon">{step.icon}</div>
            <h4>{step.title}</h4>
            <p>{step.desc}</p>
            <div className="arch-node-badge">{step.badge}</div>
          </div>
          {i < steps.length - 1 && <FlowArrow />}
        </div>
      ))}
    </div>
  );
}

export default function SystemArchitecture() {
  return (
    <div className="arch-section">
      <div className="container">
        <div className="text-center" style={{ marginBottom: "1rem" }}>
          <p className="sec-label">System Architecture</p>
          <h2 className="sec-title">Complete <span>System</span> Flowchart</h2>
          <p className="sec-desc center">How data flows through the IoTMesh ecosystem — from sensor readings to user notifications, and from commands to physical hardware actions.</p>
        </div>

        <div className="arch-columns">
          <FlowColumn label="▼ DATA FLOW — SENSOR TO USER" steps={dataFlow} />
          <FlowColumn label="▼ CONTROL FLOW — COMMAND TO DEVICE" steps={controlFlow} />
        </div>

      </div>
    </div>
  );
}
