const forwardFlow = [
  { icon: "📡", title: "ESP Room Nodes", desc: "Sensors collect data" },
  { icon: "🔥", title: "Firebase Realtime DB", desc: "Cloud data sync" },
  { icon: "⚙️", title: "Render Backend Engine", desc: "Event processing" },
  { icon: "📲", title: "Telegram Notification", desc: "Alert dispatch" },
  { icon: "👥", title: "Subscribers / Admins", desc: "End-user delivery" },
];

const reverseFlow = [
  { icon: "💬", title: "Telegram / Web Command", desc: "User sends command" },
  { icon: "🔥", title: "Firebase State Update", desc: "Cloud state changed" },
  { icon: "📡", title: "ESP Reads Changes", desc: "Node polls Firebase" },
  { icon: "🔌", title: "Relay Switching", desc: "GPIO state toggle" },
  { icon: "⚡", title: "Hardware Action", desc: "Device activated" },
];

function FlowArrow() {
  return (
    <div className="flow-arrow">
      <div className="flow-arrow-line" />
      <div className="flow-arrow-head" />
    </div>
  );
}

function FlowColumn({ title, steps }: { title: string; steps: typeof forwardFlow }) {
  return (
    <div className="flow-column">
      <div className="flow-column-title">{title}</div>
      <div className="flow-steps">
        {steps.map((step, i) => (
          <div key={step.title}>
            <div className="flow-node">
              <div className="flow-node-icon">{step.icon}</div>
              <h4>{step.title}</h4>
              <p>{step.desc}</p>
            </div>
            {i < steps.length - 1 && <FlowArrow />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SystemFlowchart() {
  return (
    <div className="flow-section">
      <div className="container">
        <div className="text-center" style={{ marginBottom: "1rem" }}>
          <p className="sec-label">Architecture</p>
          <h2 className="sec-title">System <span>Flowchart</span></h2>
          <p className="sec-desc center">How data flows through the IoTMesh ecosystem — from sensor readings to user notifications, and from commands to hardware actions.</p>
        </div>

        <div className="flow-container">
          <FlowColumn title="▼ DATA FLOW — SENSOR TO USER" steps={forwardFlow} />
          <FlowColumn title="▼ CONTROL FLOW — COMMAND TO DEVICE" steps={reverseFlow} />
        </div>
      </div>
    </div>
  );
}
