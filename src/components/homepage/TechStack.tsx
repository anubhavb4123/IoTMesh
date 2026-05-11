const techStack = [
  { icon: "📡", name: "ESP32", role: "Primary MCU" },
  { icon: "📶", name: "ESP8266", role: "WiFi Node" },
  { icon: "🔧", name: "Arduino Nano", role: "Co-processor" },
  { icon: "🔥", name: "Firebase RTDB", role: "Realtime DB" },
  { icon: "⚙️", name: "Render", role: "Backend Host" },
  { icon: "🤖", name: "Telegram API", role: "Bot Engine" },
  { icon: "⚛️", name: "React", role: "Frontend" },
  { icon: "🔷", name: "TypeScript", role: "Type Safety" },
  { icon: "🎨", name: "Tailwind CSS", role: "Styling" },
  { icon: "⚡", name: "Vite", role: "Build Tool" },
];

// Distribute items in a circle
function getPosition(index: number, total: number, radius: number, centerX: number, centerY: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: centerX + radius * Math.cos(angle) - 36,
    y: centerY + radius * Math.sin(angle) - 36,
  };
}

export default function TechStack() {
  return (
    <div>
      <div className="container">
        <div className="text-center" style={{ marginBottom: "1rem" }}>
          <p className="sec-label">Stack</p>
          <h2 className="sec-title">Tech <span>Stack</span></h2>
          <p className="sec-desc center">The technologies powering IoTMesh — from embedded firmware to cloud infrastructure and modern frontend frameworks.</p>
        </div>

        {/* Desktop orbital */}
        <div className="ts-orbital">
          <div className="ts-ring ts-ring-1" />
          <div className="ts-ring ts-ring-2" />

          <div className="ts-center">
            <div style={{ fontSize: "1.5rem" }}>⬡</div>
            <div className="ts-center-label">IoTMesh</div>
          </div>

          {techStack.map((tech, i) => {
            const pos = getPosition(i, techStack.length, 200, 300, 250);
            return (
              <div
                key={tech.name}
                className="ts-item"
                style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
              >
                <div className="ts-item-dot">{tech.icon}</div>
                <div className="ts-item-label">{tech.name}</div>
              </div>
            );
          })}
        </div>

        {/* Mobile grid fallback */}
        <div className="ts-mobile">
          {techStack.map(tech => (
            <div key={tech.name} className="ts-mobile-item">
              <div className="icon">{tech.icon}</div>
              <h4>{tech.name}</h4>
              <p>{tech.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
