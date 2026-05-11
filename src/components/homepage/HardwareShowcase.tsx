import { useState } from "react";

const categories = ["All", "Controllers", "Sensors", "Automation", "Security", "Monitoring"] as const;

type HWItem = {
  name: string;
  img: string;
  category: string;
  role: string;
  comm: string;
};

const hardware: HWItem[] = [
  { name: "ESP32", img: "/hardware/esp32.png", category: "Controllers", role: "Primary WiFi+BLE microcontroller powering lobby, bedroom, and kitchen nodes with dual-core processing.", comm: "WiFi → Firebase RTDB" },
  { name: "ESP8266 NodeMCU", img: "/hardware/esp8266.png", category: "Controllers", role: "Cost-effective WiFi-enabled controller for auxiliary room nodes with Arduino-compatible firmware.", comm: "WiFi → Firebase RTDB" },
  { name: "Arduino Nano", img: "/hardware/arduino-nano.png", category: "Controllers", role: "Serial-connected co-processor handling analog sensors and relay banks via I2C/UART bridge.", comm: "UART → ESP → Firebase" },
  { name: "MQ Gas Sensor", img: "/hardware/sensors.png", category: "Sensors", role: "Detects combustible gas leaks (LPG, methane) and triggers emergency alerts via Firebase to Telegram.", comm: "Analog → ESP → Alert" },
  { name: "DHT11 / DHT22", img: "/hardware/sensors.png", category: "Sensors", role: "Measures ambient temperature and humidity for climate monitoring and automation trigger conditions.", comm: "Digital → ESP → Dashboard" },
  { name: "BMP180", img: "/hardware/sensors.png", category: "Sensors", role: "Barometric pressure and altitude sensor for environmental monitoring and weather-aware automation.", comm: "I2C → ESP → Firebase" },
  { name: "HC-SR04 Ultrasonic", img: "/hardware/sensors.png", category: "Sensors", role: "Measures water tank levels with millimeter precision, triggering alerts when levels are critical.", comm: "Digital → ESP → Alert" },
  { name: "PIR Motion Sensor", img: "/hardware/security.png", category: "Security", role: "Detects human presence for security monitoring. Triggers alerts and activates cameras on motion events.", comm: "Digital → ESP → Firebase" },
  { name: "4-Channel Relay Board", img: "/hardware/relay-board.png", category: "Automation", role: "Controls AC appliances — lights, fans, motors. Firebase state changes trigger instant relay switching.", comm: "ESP GPIO → Relay → Device" },
  { name: "RTC Module DS3231", img: "/hardware/rain-rtc.png", category: "Monitoring", role: "Maintains precise time for scheduling automation tasks and timestamping sensor data logs.", comm: "I2C → ESP → Scheduler" },
  { name: "Buzzer Module", img: "/hardware/security.png", category: "Security", role: "Audible alarm for gas leak detection, intrusion alerts, and critical system warnings.", comm: "ESP GPIO → Sound Alert" },
  { name: "Rain Sensor", img: "/hardware/rain-rtc.png", category: "Monitoring", role: "Detects rainfall and triggers automated responses — close windows, retract awnings, send alerts.", comm: "Analog → ESP → Firebase" },
  { name: "Servo Lock", img: "/hardware/security.png", category: "Security", role: "Motorized door lock mechanism controlled via Telegram commands or Firebase state for remote access.", comm: "ESP PWM → Lock Mechanism" },
  { name: "Lobby Controller", img: "/hardware/lobby-controller.png", category: "Controllers", role: "Custom PCB integrating ESP32, relay bank, sensor headers, and power management in a compact form.", comm: "All-in-One Node → Firebase" },
];

export default function HardwareShowcase() {
  const [active, setActive] = useState<string>("All");

  const filtered = active === "All" ? hardware : hardware.filter(h => h.category === active);

  return (
    <div className="hw-section">
      <div className="container">
        <div className="text-center" style={{ marginBottom: "1rem" }}>
          <p className="sec-label">Hardware</p>
          <h2 className="sec-title">Real <span>Hardware</span> Showcase</h2>
          <p className="sec-desc center">Every component powering the IoTMesh ecosystem — from microcontrollers to sensors, relays to custom PCBs.</p>
        </div>

        <div className="hw-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`hw-tab ${active === cat ? "active" : ""}`}
              onClick={() => setActive(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="hw-grid">
          {filtered.map((hw, i) => (
            <div
              key={hw.name}
              className="hw-card"
              style={{ animationDelay: `${i * 60}ms`, animation: "fadeUp 0.5s ease both" }}
            >
              <div className="hw-card-img">
                <img src={hw.img} alt={hw.name} loading="lazy" />
              </div>
              <div className="hw-card-body">
                <div className="hw-card-category">{hw.category}</div>
                <h3>{hw.name}</h3>
                <p>{hw.role}</p>
                <div className="hw-comm-flow">
                  <span className="dot" />
                  {hw.comm}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
