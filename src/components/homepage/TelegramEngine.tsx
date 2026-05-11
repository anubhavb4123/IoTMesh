import { useEffect, useRef, useState } from "react";

const terminalLines = [
  { type: "prompt", text: "$ /status" },
  { type: "output", text: "🟢 Lobby: ONLINE | Temp: 28.3°C | Gas: Normal" },
  { type: "output", text: "🟢 Bedroom: ONLINE | Humidity: 62% | Fan: ON" },
  { type: "output", text: "🟡 Kitchen: ALERT | Gas Level: ELEVATED" },
  { type: "blank", text: "" },
  { type: "prompt", text: "$ /on lobby_light" },
  { type: "success", text: "✓ Lobby Light → ON (Firebase synced)" },
  { type: "blank", text: "" },
  { type: "prompt", text: "$ /off kitchen_fan" },
  { type: "success", text: "✓ Kitchen Fan → OFF (Relay switched)" },
  { type: "blank", text: "" },
  { type: "prompt", text: "$ /logins" },
  { type: "output", text: "Admin: anubhav@iotmesh.io — Last: 2m ago" },
  { type: "output", text: "Guest: visitor_01 — Last: 14m ago" },
  { type: "blank", text: "" },
  { type: "alert", text: "⚠ ALERT: Gas leak detected in Kitchen Node!" },
  { type: "alert", text: "→ Buzzer ACTIVATED | Telegram alert SENT" },
];

const features = [
  { icon: "🤖", title: "Telegram Bot Integration", desc: "Full-featured bot engine connected to Firebase for real-time device interaction." },
  { icon: "📢", title: "Subscriber-Based Alerts", desc: "Users subscribe to receive automated notifications for critical events and sensor thresholds." },
  { icon: "👤", title: "Admin + Guest Access", desc: "Multi-tier permission system — admins control everything, guests get read-only status." },
  { icon: "👥", title: "Multi-User Handling", desc: "Multiple users can interact simultaneously with independent sessions and command queues." },
  { icon: "🎮", title: "Remote Command Execution", desc: "Execute /on, /off, /status commands from anywhere to control devices in real-time." },
  { icon: "📊", title: "Live Sensor Monitoring", desc: "Query current sensor readings directly from Telegram without opening the dashboard." },
];

function TerminalTypewriter() {
  const [visibleLines, setVisibleLines] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleLines >= terminalLines.length) {
      // Reset after a delay
      const resetTimer = setTimeout(() => setVisibleLines(0), 4000);
      return () => clearTimeout(resetTimer);
    }
    const timer = setTimeout(() => setVisibleLines(v => v + 1), 400);
    return () => clearTimeout(timer);
  }, [visibleLines]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [visibleLines]);

  return (
    <div className="tg-terminal">
      <div className="tg-terminal-header">
        <div className="tg-terminal-dot r" />
        <div className="tg-terminal-dot y" />
        <div className="tg-terminal-dot g" />
        <div className="tg-terminal-title">IoTMesh Telegram Bot — Live Session</div>
      </div>
      <div className="tg-terminal-body" ref={bodyRef}>
        {terminalLines.slice(0, visibleLines).map((line, i) => {
          if (line.type === "blank") return <div key={i} style={{ height: "0.5rem" }} />;
          return (
            <div key={i} className="tg-line">
              <span className={line.type === "prompt" ? "prompt" : line.type === "success" ? "success" : line.type === "alert" ? "alert" : "output"}>
                {line.text}
              </span>
            </div>
          );
        })}
        {visibleLines < terminalLines.length && (
          <div className="tg-line">
            <span className="tg-type-cursor" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TelegramEngine() {
  return (
    <div className="tg-section">
      <div className="container">
        <div className="text-center" style={{ marginBottom: "1rem" }}>
          <p className="sec-label">Automation</p>
          <h2 className="sec-title">Telegram <span>Automation Engine</span></h2>
          <p className="sec-desc center">A full-featured Telegram bot backend that enables remote monitoring, command execution, and subscriber-based alert broadcasting.</p>
        </div>

        <div className="tg-grid">
          <TerminalTypewriter />

          <div className="tg-features">
            {features.map(feat => (
              <div key={feat.title} className="tg-feat-card">
                <div className="tg-feat-icon">{feat.icon}</div>
                <div>
                  <h4>{feat.title}</h4>
                  <p>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
