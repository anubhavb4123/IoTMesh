const rooms = [
  { id: "lobby", icon: "🏛️", name: "Lobby Node", desc: "Relay control, gas detection, door monitoring", x: "15%", y: "20%" },
  { id: "bedroom", icon: "🛏️", name: "Bedroom Node", desc: "Climate control, lighting, fan automation", x: "75%", y: "15%" },
  { id: "kitchen", icon: "🍳", name: "Kitchen Node", desc: "Gas monitoring, appliance control, alerts", x: "10%", y: "70%" },
  { id: "security", icon: "🛡️", name: "Security Node", desc: "PIR motion, servo lock, buzzer alerts", x: "80%", y: "65%" },
  { id: "water", icon: "💧", name: "Water Monitor", desc: "HC-SR04 tank level, rain detection", x: "50%", y: "85%" },
];

export default function RoomNodeArchitecture() {
  return (
    <div>
      <div className="container">
        <div className="text-center" style={{ marginBottom: "1rem" }}>
          <p className="sec-label">Nodes</p>
          <h2 className="sec-title">Room Node <span>Architecture</span></h2>
          <p className="sec-desc center">Each room operates as an independent IoT node — reading Firebase, uploading sensor data, controlling relays, and receiving cloud commands.</p>
        </div>

        <div className="room-network">
          {/* SVG connection lines */}
          <svg className="room-conn-line" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }}>
            {rooms.map(room => (
              <line
                key={room.id}
                x1="50%" y1="50%"
                x2={room.x} y2={room.y}
              />
            ))}
          </svg>

          {/* Central hub */}
          <div className="room-hub">
            <div className="room-hub-icon">🔥</div>
            <div className="room-hub-label">FIREBASE<br/>RTDB</div>
          </div>

          {/* Room nodes */}
          {rooms.map(room => (
            <div
              key={room.id}
              className="room-node-item"
              style={{ left: room.x, top: room.y, transform: "translate(-50%, -50%)" }}
            >
              <div className="node-icon">{room.icon}</div>
              <h4><span className="room-node-status" />{room.name}</h4>
              <p>{room.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
