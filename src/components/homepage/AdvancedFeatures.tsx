const features = [
  { icon: "🌐", title: "Distributed IoT Node System", desc: "Each room operates as a self-contained IoT node with its own ESP controller, sensors, and relay bank — communicating via Firebase without central server dependency." },
  { icon: "🔄", title: "Realtime Cloud Synchronization", desc: "Sub-second data sync between edge devices and cloud via Firebase RTDB. Every sensor reading and relay state is mirrored instantly across all connected endpoints." },
  { icon: "📢", title: "Subscriber-Based Notifications", desc: "Users subscribe to specific alert categories — gas, power, intrusion. Only relevant subscribers receive targeted Telegram notifications, reducing noise." },
  { icon: "🔗", title: "Firebase Relay Synchronization", desc: "Relay states stored in Firebase act as single source of truth. Multiple clients can read/write relay states simultaneously with automatic conflict resolution." },
  { icon: "🔀", title: "Hybrid Local + Remote Control", desc: "Devices respond to both local hardware switches and cloud-based commands. State reconciliation ensures consistency regardless of input source." },
  { icon: "🧱", title: "Modular Hardware Expansion", desc: "Add new sensors, relays, or entire room nodes without touching existing infrastructure. Each module self-registers with Firebase on first boot." },
  { icon: "📐", title: "Multi-Room Scalability", desc: "Scale from a single room prototype to a full building deployment. Each node's Firebase path is namespaced, preventing data collision and enabling parallel operation." },
  { icon: "⚡", title: "Event-Driven Backend", desc: "Render-hosted backend listens for Firebase data change events and triggers automation chains — no polling, no delays, pure reactive architecture." },
  { icon: "🛡️", title: "Cloud-Controlled Automation", desc: "Automation rules defined in the cloud execute across all nodes. Change a rule once, it applies everywhere — centralized intelligence with distributed execution." },
];

export default function AdvancedFeatures() {
  return (
    <div>
      <div className="container">
        <div className="text-center" style={{ marginBottom: "1rem" }}>
          <p className="sec-label">Advanced</p>
          <h2 className="sec-title">Advanced <span>Features</span></h2>
          <p className="sec-desc center">Enterprise-grade capabilities that set IoTMesh apart — distributed architecture, real-time sync, and intelligent automation at scale.</p>
        </div>

        <div className="adv-grid">
          {features.map((feat, i) => (
            <div
              key={feat.title}
              className="adv-card"
              style={{ animation: `fadeUp 0.5s ${i * 50}ms ease both` }}
            >
              <div className="adv-icon">{feat.icon}</div>
              <h3>{feat.title}</h3>
              <p>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
