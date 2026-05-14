import { useState } from "react";

const categories = ["All", "Controllers", "Sensors", "Power Monitoring", "Automation", "Security"] as const;

type HWItem = {
  name: string;
  img: string;
  category: string;
  role: string;
  comm: string;
  integration: string;
};

const hardware: HWItem[] = [
  { name: "ESP32", img: "/hardware/esp32.png", category: "Controllers", role: "Primary WiFi+BLE microcontroller powering lobby, bedroom, and kitchen nodes with dual-core processing.", comm: "WiFi → Firebase RTDB", integration: "Central node hub — reads sensors, controls relays, syncs state to cloud in real time." },
  { name: "ESP8266 NodeMCU", img: "/hardware/esp8266.png", category: "Controllers", role: "Cost-effective WiFi-enabled controller for auxiliary room nodes with Arduino-compatible firmware.", comm: "WiFi → Firebase RTDB", integration: "Secondary room node — handles isolated sensor groups and relay banks per room." },
  { name: "Arduino Nano", img: "/hardware/arduino-nano.png", category: "Controllers", role: "Serial-connected co-processor handling analog sensors and relay banks via I2C/UART bridge.", comm: "UART → ESP → Firebase", integration: "Analog bridge — extends ESP capabilities with additional ADC channels and GPIO pins." },
  { name: "Custom Lobby Controller", img: "/hardware/lobby-controller.png", category: "Controllers", role: "Custom PCB integrating ESP32, relay bank, sensor headers, and power management in a compact form.", comm: "All-in-One → Firebase", integration: "Production-ready node — single board solution for complete room automation deployment." },
  { name: "MQ Gas Sensor", img: "/hardware/sensors.png", category: "Sensors", role: "Detects combustible gas leaks (LPG, methane) and triggers emergency alerts via Firebase → Telegram.", comm: "Analog → ESP → Alert", integration: "Safety-critical sensor — triggers instant Telegram broadcast and buzzer alarm on gas detection." },
  { name: "DHT11 / DHT22", img: "/hardware/sensors.png", category: "Sensors", role: "Measures ambient temperature and humidity for climate monitoring and automation trigger conditions.", comm: "Digital → ESP → Dashboard", integration: "Climate monitoring — data feeds dashboard graphs and triggers fan/AC automation rules." },
  { name: "BMP180 Barometric", img: "/hardware/sensors.png", category: "Sensors", role: "Barometric pressure and altitude sensor for environmental monitoring and weather-aware automation.", comm: "I2C → ESP → Firebase", integration: "Environmental intelligence — provides atmospheric pressure data for weather-based automation." },
  { name: "HC-SR04 Ultrasonic", img: "/hardware/sensors.png", category: "Sensors", role: "Measures water tank levels with millimeter precision, triggering alerts when levels are critical.", comm: "Digital → ESP → Alert", integration: "Water management — triggers pump control and low-level alerts via Telegram notifications." },
  { name: "Rain Sensor", img: "/hardware/rain-rtc.png", category: "Sensors", role: "Detects rainfall and triggers automated responses — close windows, retract awnings, send alerts.", comm: "Analog → ESP → Firebase", integration: "Weather response — integrates with home automation rules for rain-triggered device control." },
  { name: "Voltage Sensor", img: "/hardware/sensors.png", category: "Power Monitoring", role: "Monitors battery voltage and power source state — detects grid/inverter switching events.", comm: "Analog → ESP → Firebase", integration: "Power tracking — feeds real-time voltage data to dashboard and triggers low-battery alerts." },
  { name: "ACS712 Current Sensor", img: "/hardware/sensors.png", category: "Power Monitoring", role: "Measures current draw on AC lines for consumption tracking and overload detection.", comm: "Analog → ESP → Dashboard", integration: "Energy analytics — tracks power consumption patterns and detects anomalous current draw." },
  { name: "RTC DS3231", img: "/hardware/rain-rtc.png", category: "Power Monitoring", role: "Maintains precise time for scheduling automation tasks and timestamping sensor data logs.", comm: "I2C → ESP → Scheduler", integration: "Time-critical ops — enables scheduled automation and accurate event logging." },
  { name: "4-Channel Relay Board", img: "/hardware/relay-board.png", category: "Automation", role: "Controls AC appliances — lights, fans, motors. Firebase state changes trigger instant relay switching.", comm: "ESP GPIO → Relay → Device", integration: "Core actuator — bridges digital cloud commands to physical device ON/OFF switching." },
  { name: "Servo Lock System", img: "/hardware/security.png", category: "Security", role: "Motorized door lock mechanism controlled via Telegram commands or Firebase state for remote access.", comm: "ESP PWM → Lock Mechanism", integration: "Access control — Telegram /lock and /unlock commands directly control door mechanism." },
  { name: "PIR Motion Sensor", img: "/hardware/security.png", category: "Security", role: "Detects human presence for security monitoring. Triggers alerts and logs on motion events.", comm: "Digital → ESP → Firebase", integration: "Intrusion detection — motion events trigger Telegram alerts and activity logging." },
  { name: "Buzzer Module", img: "/hardware/security.png", category: "Security", role: "Audible alarm for gas leak detection, intrusion alerts, and critical system warnings.", comm: "ESP GPIO → Sound Alert", integration: "Local alarm — provides immediate audible feedback for emergency sensor triggers." },
];

export default function HardwareArchitecture() {
  const [active, setActive] = useState<string>("All");
  const filtered = active === "All" ? hardware : hardware.filter(h => h.category === active);

  return (
    <div className="hw-section">
      <div className="container">
        <div className="text-center" style={{ marginBottom: "1rem" }}>
          <p className="sec-label">Hardware Architecture</p>
          <h2 className="sec-title">Real <span>Hardware</span> Ecosystem</h2>
          <p className="sec-desc center">Every component powering the IoTMesh distributed automation platform — from microcontrollers and sensors to relay actuators and custom PCBs.</p>
        </div>

        <div className="hw-tabs">
          {categories.map(cat => (
            <button key={cat} className={`hw-tab ${active === cat ? "active" : ""}`} onClick={() => setActive(cat)}>
              {cat}
            </button>
          ))}
        </div>

        <div className="hw-grid">
          {filtered.map((hw, i) => (
            <div key={hw.name} className="hw-card" style={{ animationDelay: `${i * 60}ms`, animation: "fadeUp 0.5s ease both" }}>
              <div className="hw-card-img">
                <img src={hw.img} alt={hw.name} loading="lazy" />
              </div>
              <div className="hw-card-body">
                <div className="hw-card-category">{hw.category}</div>
                <h3>{hw.name}</h3>
                <p>{hw.role}</p>
                <p style={{ fontSize: "0.78rem", color: "rgba(240,244,255,0.4)", marginTop: "0.4rem", lineHeight: 1.5 }}>{hw.integration}</p>
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
