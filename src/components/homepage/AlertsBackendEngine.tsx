import { useEffect, useState, useRef } from "react";

const alertLogs = [
  { time: "21:04:12", tag: "tag-gas", label: "[GAS]", msg: "MQ Sensor triggered — broadcasting emergency alert to 12 subscribers..." },
  { time: "21:04:13", tag: "tag-sync", label: "[SYNC]", msg: "Firebase /alerts/gas updated → Render webhook fired" },
  { time: "21:04:14", tag: "tag-device", label: "[TELEGRAM]", msg: "Alert dispatched → \"Gas leak detected in Kitchen — take action!\"" },
  { time: "21:06:30", tag: "tag-battery", label: "[BATTERY]", msg: "Voltage dropped to 3.2V — low battery alert triggered for Node_02" },
  { time: "21:08:45", tag: "tag-motion", label: "[MOTION]", msg: "PIR detected movement — Zone A — logging intrusion event" },
  { time: "21:10:02", tag: "tag-device", label: "[DEVICE]", msg: "Relay_04 switched ON via Telegram /fan_on → Kitchen Fan activated" },
  { time: "21:11:18", tag: "tag-sync", label: "[SYNC]", msg: "Firebase state synced — 3 ESP nodes acknowledged relay state change" },
  { time: "21:13:55", tag: "tag-gas", label: "[WATER]", msg: "HC-SR04 reading: 12cm — tank level below threshold — pump alert sent" },
  { time: "21:15:22", tag: "tag-device", label: "[POWER]", msg: "Grid → Inverter switch detected — battery backup active — notifying admin" },
  { time: "21:17:00", tag: "tag-sync", label: "[SYSTEM]", msg: "All nodes online — heartbeat OK — 10 sensors active — 0 errors" },
];

const pipelineNodes = [
  { title: "Sensor", desc: "Data capture" },
  { title: "ESP Node", desc: "Local processing" },
  { title: "Firebase", desc: "Cloud sync" },
  { title: "Render", desc: "Event engine" },
  { title: "Telegram", desc: "Alert dispatch" },
  { title: "Subscribers", desc: "Notification" },
];

const features = [
  { title: "Event-Driven Alerts", desc: "Sensor threshold breaches trigger instant cascading notifications through the entire pipeline." },
  { title: "Subscriber System", desc: "Multi-user Telegram subscription — admins and guests receive role-appropriate notifications." },
  { title: "Admin & Guest Roles", desc: "Granular access control — admins manage devices, guests receive read-only monitoring access." },
  { title: "Firebase Listeners", desc: "Real-time database listeners detect state changes and trigger backend event processing." },
  { title: "Cloud-Controlled Switching", desc: "Firebase state changes propagate to ESP nodes — enabling remote relay control from anywhere." },
  { title: "Sensor Alert Broadcasting", desc: "Gas, motion, water, power events broadcast to all subscribers with contextual alert data." },
];

export default function AlertsBackendEngine() {
  const [visibleLines, setVisibleLines] = useState(0);
  const termRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = termRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        let i = 0;
        const interval = setInterval(() => {
          i++;
          setVisibleLines(i);
          if (i >= alertLogs.length) clearInterval(interval);
        }, 350);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div>
      <div className="container">
        <div className="text-center" style={{ marginBottom: "1.5rem" }}>
          <p className="sec-label">Backend Engine</p>
          <h2 className="sec-title">Alerts & <span>Backend</span> Architecture</h2>
          <p className="sec-desc center">Event-driven cloud backend powering real-time sensor alerts, Telegram broadcasting, and multi-user notification management.</p>
        </div>

        {/* Alert Pipeline */}
        <div className="alert-flow-pipeline">
          {pipelineNodes.map((node, i) => (
            <div key={node.title} style={{ display: "flex", alignItems: "center" }}>
              <div className="alert-flow-node">
                <h5>{node.title}</h5>
                <p>{node.desc}</p>
              </div>
              {i < pipelineNodes.length - 1 && <div className="alert-flow-arrow" style={{ color: "rgba(255, 255, 255, 0.4)" }}>→</div>}
            </div>
          ))}
        </div>

        {/* Terminal + Features Grid */}
        <div className="alert-grid">
          <div ref={termRef} className="alert-terminal">
            <div className="alert-terminal-header">
              <div className="alert-dot r" />
              <div className="alert-dot y" />
              <div className="alert-dot g" />
              <span className="alert-terminal-title">iotmesh-backend — alert-engine.log</span>
            </div>
            <div className="alert-terminal-body">
              {alertLogs.slice(0, visibleLines).map((log, i) => (
                <div key={i} className="alert-log-line" style={{ animationDelay: `${i * 80}ms` }}>
                  <span className="timestamp">{log.time}</span>{" "}
                  <span className={log.tag}>{log.label}</span>{" "}
                  <span className="msg">{log.msg}</span>
                </div>
              ))}
              {visibleLines >= alertLogs.length && <span className="alert-cursor" />}
            </div>
          </div>

          <div className="alert-features">
            {features.map((f, i) => (
              <div key={f.title} className="alert-feat-card" style={{ animationDelay: `${i * 60}ms`, animation: "fadeUp 0.5s ease both" }}>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
