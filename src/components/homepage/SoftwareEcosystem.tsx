const stack = [
  { name: "Firebase RTDB", role: "Realtime cloud database — syncs device state, sensor data, and user commands across all nodes.", tag: "DATABASE" },
  { name: "Render Backend", role: "Node.js event-driven server — processes alerts, manages Telegram bot, handles cloud logic.", tag: "BACKEND" },
  { name: "Telegram Bot API", role: "Command interface and alert engine — subscribers receive real-time notifications and control devices.", tag: "MESSAGING" },
  { name: "React + TypeScript", role: "Modern responsive dashboard — real-time monitoring, device control, and user management.", tag: "FRONTEND" },
  { name: "Vite + Tailwind", role: "Lightning-fast build tooling with utility-first CSS for rapid development and optimal performance.", tag: "TOOLING" },
  { name: "ESP Firmware (C++)", role: "Custom Arduino/PlatformIO firmware — sensor polling, relay control, Firebase sync, OTA updates.", tag: "EMBEDDED" },
  { name: "Sensor Data Upload", role: "DHT, BMP, MQ sensors push data through ESP nodes to Firebase in real time.", tag: "DATA FLOW" },
  { name: "Cloud Synchronization", role: "Bidirectional real-time state sync between ESP nodes, dashboard, and Telegram.", tag: "SYNC" },
  { name: "Power Monitoring", role: "Voltage and current tracking with automated alerts on threshold breaches.", tag: "MONITORING" },
  { name: "Motion Detection", role: "PIR sensor triggers flow through ESP → Firebase → Telegram alert pipeline.", tag: "SECURITY" },
  { name: "Gas Alert System", role: "MQ sensor emergency broadcast pipeline — instant multi-subscriber notification.", tag: "SAFETY" },
  { name: "Water Level Monitoring", role: "HC-SR04 ultrasonic sensor drives tank level tracking and pump control logic.", tag: "AUTOMATION" },
];

const screenshots = [
  { src: "/pictures/dashboard.png", title: "Central Dashboard", desc: "Real-time overview of all ESP nodes, sensor metrics, device states, and system health." },
  { src: "/pictures/devices1.png", title: "Device Management", desc: "Control relays, lights, fans, and appliances with instant cloud-synced state updates." },
  { src: "/pictures/sensors.png", title: "Live Sensor Monitoring", desc: "Temperature, humidity, gas, pressure, voltage, and battery data — updated in real time." },
  { src: "/pictures/devices2.png", title: "Advanced Configuration", desc: "Configure device behavior, assign ESP pins, and manage room-wise automation rules." },
  { src: "/pictures/telegram.png", title: "Telegram Bot Interface", desc: "Send commands, receive alerts, and control devices directly through Telegram messaging." },
  { src: "/pictures/users.png", title: "User & Role Management", desc: "Admin and guest roles with permission-based access control for secure IoT management." },
];

export default function SoftwareEcosystem() {
  return (
    <div>
      <div className="container">
        <div className="text-center" style={{ marginBottom: "3rem" }}>
          <p className="sec-label">Software Ecosystem</p>
          <h2 className="sec-title">Cloud-Native <span>Software</span> Stack</h2>
          <p className="sec-desc center">From embedded firmware to cloud backend and responsive dashboard — a full-stack IoT platform built for real-time intelligence.</p>
        </div>

        <div className="sw-stack-grid">
          {stack.map((s, i) => (
            <div key={s.name} className="sw-stack-card" style={{ animationDelay: `${i * 60}ms`, animation: "fadeUp 0.5s ease both" }}>
              <h4>{s.name}</h4>
              <p>{s.role}</p>
              <div style={{ marginTop: "0.75rem", display: "inline-block", padding: "0.15rem 0.6rem", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "999px", fontSize: "0.55rem", fontFamily: "var(--font-head)", color: "rgba(255, 255, 255, 0.6)", letterSpacing: "0.1em", background: "rgba(255, 255, 255, 0.03)" }}>{s.tag}</div>
            </div>
          ))}
        </div>

        <div className="text-center" style={{ marginTop: "4rem", marginBottom: "2rem" }}>
          <p className="sec-label">Platform Preview</p>
          <h3 className="sec-title" style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)" }}>Dashboard & <span>Interfaces</span></h3>
        </div>

        <div className="sw-gallery">
          {screenshots.map((ss, i) => (
            <div key={ss.title} className="sw-screenshot" style={{ animationDelay: `${i * 80}ms`, animation: "fadeUp 0.5s ease both" }}>
              <img src={ss.src} alt={ss.title} loading="lazy" />
              <div className="sw-screenshot-info">
                <h4>{ss.title}</h4>
                <p>{ss.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
