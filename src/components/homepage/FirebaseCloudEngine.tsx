const cloudNodes = [
  { icon: "📡", title: "ESP Nodes", desc: "Edge devices" },
  { icon: "🔥", title: "Firebase RTDB", desc: "Realtime sync" },
  { icon: "⚙️", title: "Render Backend", desc: "Event engine" },
  { icon: "📲", title: "Telegram API", desc: "Alert dispatch" },
];
// firebase cloud engine of iotmesh

const cloudFeatures = [
  { title: "Realtime Synchronization", desc: "Firebase RTDB ensures sub-second data sync between ESP nodes and the cloud. Every sensor reading, relay state, and user command is reflected instantly across all connected clients." },
  { title: "Event-Driven Backend", desc: "Render-hosted Node.js service listens for Firebase data changes and triggers automated responses — alert broadcasts, state reconciliation, and scheduled tasks." },
  { title: "Distributed Device Communication", desc: "Each ESP node operates independently, reading/writing to its own Firebase path. The cloud orchestrates cross-node coordination without direct device-to-device coupling." },
  { title: "Cloud-Triggered Automation", desc: "Backend rules engine evaluates sensor thresholds and triggers actions: gas alert → buzzer + Telegram, high temp → fan relay, low water → notification chain." },
  { title: "Fault-Tolerant Architecture", desc: "If a node goes offline, Firebase retains last-known state. When reconnected, the node reconciles state automatically — no data loss, no manual intervention." },
];

export default function FirebaseCloudEngine() {
  return (
    <div>
      <div className="container">
        <div className="text-center" style={{ marginBottom: "1rem" }}>
          <p className="sec-label">Cloud</p>
          <h2 className="sec-title">Firebase + <span>Cloud Engine</span></h2>
          <p className="sec-desc center">The cloud backbone powering real-time synchronization, event-driven automation, and distributed device communication across the entire IoTMesh ecosystem.</p>
        </div>

        <div className="cloud-visual">
          <div className="cloud-nodes">
            {cloudNodes.map((node, i) => (
              <div key={node.title} style={{ display: "flex", alignItems: "center", gap: "0" }}>
                <div className="cloud-node" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="cloud-node-icon">{node.icon}</div>
                  <h4>{node.title}</h4>
                  <p>{node.desc}</p>
                </div>
                {i < cloudNodes.length - 1 && (
                  <div className="cloud-connector" style={{ margin: "0 0.5rem" }}>
                    ⟷
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="cloud-features">
            {cloudFeatures.map(feat => (
              <div key={feat.title} className="cloud-feat">
                <h4>{feat.title}</h4>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
